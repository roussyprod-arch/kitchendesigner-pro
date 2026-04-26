/* ═════════════════════════════════════════════════════
   ROUTES COMMANDES
═════════════════════════════════════════════════════ */

import express from 'express';
import Order from '../models/Order.js';
import Material from '../models/Material.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateOrder } from '../middleware/validation.js';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ═════════════════════════════════════════════════════
// CRÉER UNE COMMANDE
// ═════════════════════════════════════════════════════

router.post('/', protect, validateCreateOrder, async (req, res) => {
  try {
    const {
      items,
      billingAddress,
      shippingAddress,
      shippingMethod,
      discountCode,
    } = req.body;

    // Vérifier les matériaux et calculer le total
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const material = await Material.findById(item.materialId);
      if (!material) {
        return res.status(404).json({
          error: `Matériau ${item.materialId} non trouvé`,
        });
      }

      const itemTotal = material.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        materialId: material._id,
        name: material.name,
        category: material.category,
        quantity: item.quantity,
        price: material.price,
        total: itemTotal,
        customizations: item.customizations,
      });
    }

    // Calculer les frais d'expédition
    let shippingCost = 0;
    if (shippingMethod === 'express') shippingCost = 25;
    if (shippingMethod === 'overnight') shippingCost = 50;

    // Créer la commande
    const order = await Order.create({
      userId: req.userId,
      items: orderItems,
      subtotal,
      tax: Math.round(subtotal * 0.2 * 100) / 100,
      taxRate: 0.2,
      shipping: shippingCost,
      discount: 0,
      discountCode,
      total: subtotal + Math.round(subtotal * 0.2 * 100) / 100 + shippingCost,
      billingAddress,
      shippingAddress,
      shippingMethod,
      paymentMethod: 'stripe',
      status: 'pending',
    });

    res.status(201).json({
      message: 'Commande créée avec succès',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// OBTENIR LES COMMANDES DE L'UTILISATEUR
// ═════════════════════════════════════════════════════

router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = { userId: req.userId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.materialId');

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// OBTENIR UNE COMMANDE
// ═════════════════════════════════════════════════════

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.materialId');

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// CRÉER UN PAIEMENT STRIPE
// ═════════════════════════════════════════════════════

router.post('/:id/payment', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Créer une session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: order.items.map(item => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: item.name,
            description: item.category,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.STRIPE_SUCCESS_URL}?orderId=${order._id}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}?orderId=${order._id}`,
      customer_email: req.userEmail,
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// CONFIRMER LE PAIEMENT
// ═════════════════════════════════════════════════════

router.post('/:id/confirm-payment', protect, async (req, res) => {
  try {
    const { stripePaymentIntentId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier le statut du paiement avec Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      order.markAsPaid(stripePaymentIntentId);
      await order.save();

      res.json({
        message: 'Paiement confirmé avec succès',
        order,
      });
    } else {
      res.status(400).json({ error: 'Le paiement n\'a pas été traité' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// DEMANDER UN RETOUR
// ═════════════════════════════════════════════════════

router.post('/:id/return', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (!order.isDelivered) {
      return res.status(400).json({ error: 'Commande non livrée' });
    }

    order.requestReturn(reason);
    await order.save();

    res.json({
      message: 'Demande de retour créée',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// AJOUTER UN AVIS À LA COMMANDE
// ═════════════════════════════════════════════════════

router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    order.feedback = {
      rating,
      comment,
      submittedAt: new Date(),
    };

    await order.save();

    res.json({
      message: 'Avis ajouté avec succès',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// OBTENIR TOUTES LES COMMANDES (ADMIN)
// ═════════════════════════════════════════════════════

router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email');

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
