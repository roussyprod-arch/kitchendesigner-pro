/* ═════════════════════════════════════════════════════
   MODÈLE COMMANDE
═════════════════════════════════════════════════════ */

import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },

    items: [
      {
        materialId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Material',
        },
        name: {
          type: String,
          required: true,
        },
        category: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
        customizations: mongoose.Schema.Types.Mixed,
      },
    ],

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxRate: {
      type: Number,
      default: 0.20,
    },

    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountCode: String,

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'EUR',
      enum: ['EUR', 'USD', 'GBP'],
    },

    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'pending',
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ['credit-card', 'paypal', 'bank-transfer', 'stripe'],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    stripePaymentIntentId: String,

    stripeInvoiceId: String,

    billingAddress: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      email: String,
      phone: String,
    },

    shippingAddress: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String,
    },

    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard',
    },

    trackingNumber: String,

    estimatedDelivery: Date,

    actualDelivery: Date,

    notes: String,

    timeline: [
      {
        status: String,
        date: { type: Date, default: Date.now },
        message: String,
      },
    ],

    invoice: {
      number: String,
      url: String,
      createdAt: Date,
    },

    returnRequest: {
      requested: Boolean,
      reason: String,
      requestDate: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
      },
      items: [
        {
          materialId: mongoose.Schema.Types.ObjectId,
          quantity: Number,
          reason: String,
        },
      ],
    },

    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ═════════════════════════════════════════════════════
// INDEXES
// ═════════════════════════════════════════════════════

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderNumber: 1 });

// ═════════════════════════════════════════════════════
// HOOKS
// ═════════════════════════════════════════════════════

OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Générer un numéro de commande unique
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `KD-${timestamp}-${random}`;
  }

  // Mettre à jour le total
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.tax = Math.round(this.subtotal * this.taxRate * 100) / 100;
  this.total = this.subtotal + this.tax + this.shipping - this.discount;

  next();
});

// ═════════════════════════════════════════════════════
// VIRTUALS
// ═════════════════════════════════════════════════════

OrderSchema.virtual('formattedTotal').get(function () {
  return this.total.toFixed(2);
});

OrderSchema.virtual('itemsCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

OrderSchema.virtual('isDelivered').get(function () {
  return this.status === 'delivered';
});

OrderSchema.virtual('isPaid').get(function () {
  return this.paymentStatus === 'paid';
});

// ═════════════════════════════════════════════════════
// MÉTHODES
// ═════════════════════════════════════════════════════

OrderSchema.methods.updateStatus = function (newStatus, message) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    message,
  });
};

OrderSchema.methods.markAsPaid = function (stripeId) {
  this.paymentStatus = 'paid';
  this.stripePaymentIntentId = stripeId;
  this.updateStatus('confirmed', 'Paiement reçu');
};

OrderSchema.methods.requestReturn = function (reason) {
  this.returnRequest = {
    requested: true,
    reason,
    requestDate: new Date(),
    status: 'pending',
    items: this.items.map(item => ({
      materialId: item.materialId,
      quantity: item.quantity,
    })),
  };
};

OrderSchema.methods.canBeCancelled = function () {
  return ['pending', 'confirmed'].includes(this.status);
};

OrderSchema.methods.cancel = function () {
  if (!this.canBeCancelled()) {
    throw new Error('Cette commande ne peut pas être annulée');
  }
  this.status = 'cancelled';
  this.updateStatus('cancelled', 'Commande annulée par l\'utilisateur');
};

const Order = mongoose.model('Order', OrderSchema);

export default Order;
