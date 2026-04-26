/* ═════════════════════════════════════════════════════
   ROUTES MATÉRIAUX
═════════════════════════════════════════════════════ */

import express from 'express';
import Material from '../models/Material.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validateCreateMaterial } from '../middleware/validation.js';

const router = express.Router();

// ═════════════════════════════════════════════════════
// OBTENIR TOUS LES MATÉRIAUX
// ═════════════════════════════════════════════════════

router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      search,
      sortBy = '-createdAt',
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      featured,
    } = req.query;

    let filter = { inStock: true };

    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const materials = await Material.find(filter)
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Material.countDocuments(filter);

    res.json({
      materials,
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
// OBTENIR UN MATÉRIAU
// ═════════════════════════════════════════════════════

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).populate('relatedProducts');

    if (!material) {
      return res.status(404).json({ error: 'Matériau non trouvé' });
    }

    // Incrémenter les vues
    material.incrementViews();
    await material.save();

    res.json({ material });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// CRÉER UN MATÉRIAU (ADMIN)
// ═════════════════════════════════════════════════════

router.post('/', protect, validateCreateMaterial, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const material = await Material.create({
      ...req.body,
      createdBy: req.userId,
    });

    res.status(201).json({
      message: 'Matériau créé avec succès',
      material,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// METTRE À JOUR UN MATÉRIAU (ADMIN)
// ═════════════════════════════════════════════════════

router.put('/:id', protect, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.userId },
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({ error: 'Matériau non trouvé' });
    }

    res.json({
      message: 'Matériau mis à jour avec succès',
      material,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// AJOUTER UN AVIS
// ═════════════════════════════════════════════════════

router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Matériau non trouvé' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'La notation doit être entre 1 et 5' });
    }

    material.addReview(rating);
    await material.save();

    res.json({
      message: 'Avis ajouté avec succès',
      material,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// AJOUTER AUX FAVORIS
// ═════════════════════════════════════════════════════

router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Matériau non trouvé' });
    }

    material.incrementFavorites();
    await material.save();

    res.json({
      message: 'Ajouté aux favoris',
      material,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// SUPPRIMER UN MATÉRIAU (ADMIN)
// ═════════════════════════════════════════════════════

router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await Material.findByIdAndDelete(req.params.id);

    res.json({ message: 'Matériau supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
