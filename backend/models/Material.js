/* ═════════════════════════════════════════════════════
   MODÈLE MATÉRIAU
═════════════════════════════════════════════════════ */

import mongoose from 'mongoose';

const MaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du matériau est requis'],
      unique: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, 'La description est requise'],
      minlength: [10, 'La description doit avoir au moins 10 caractères'],
    },

    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      enum: [
        'Countertops',
        'Cabinets',
        'Backsplash',
        'Flooring',
        'Hardware',
        'Appliances',
        'Lighting',
        'Accessories',
      ],
      index: true,
    },

    subcategory: String,

    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: [0.01, 'Le prix doit être supérieur à 0'],
    },

    pricePerUnit: {
      type: String,
      enum: ['piece', 'sqm', 'sqft', 'meter', 'liter'],
      default: 'piece',
    },

    color: {
      type: String,
      required: [true, 'La couleur est requise'],
    },

    colors: [
      {
        name: String,
        hex: String,
        image: String,
      },
    ],

    material: {
      type: String,
      enum: [
        'Wood',
        'Metal',
        'Ceramic',
        'Stone',
        'Glass',
        'Laminate',
        'Granite',
        'Marble',
        'Quartz',
        'Stainless Steel',
      ],
      required: [true, 'Le type de matériau est requis'],
    },

    texture: String,

    dimensions: {
      width: Number,
      height: Number,
      depth: Number,
      unit: { type: String, default: 'cm' },
    },

    weight: {
      value: Number,
      unit: { type: String, default: 'kg' },
    },

    warranty: {
      years: Number,
      description: String,
    },

    maintenance: {
      cleaning: String,
      protection: String,
      tips: [String],
    },

    specifications: {
      durability: { type: Number, min: 1, max: 10 },
      waterResistance: { type: Number, min: 1, max: 10 },
      heatResistance: { type: Number, min: 1, max: 10 },
      easyToClean: { type: Number, min: 1, max: 10 },
      eco: { type: Number, min: 1, max: 10 },
    },

    images: [
      {
        url: String,
        alt: String,
        isPrimary: Boolean,
      },
    ],

    thumbnail: String,

    Model3d: {
      url: String,
      format: String, // 'obj', 'fbx', 'glb'
    },

    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },

    stockQuantity: {
      type: Number,
      default: 0,
    },

    availability: {
      type: String,
      enum: ['in-stock', 'low-stock', 'on-order', 'discontinued'],
      default: 'in-stock',
    },

    supplier: {
      name: String,
      contact: String,
      leadTime: String, // '2-3 weeks'
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    reviews: {
      type: Number,
      default: 0,
    },

    rating_breakdown: {
      '5': { type: Number, default: 0 },
      '4': { type: Number, default: 0 },
      '3': { type: Number, default: 0 },
      '2': { type: Number, default: 0 },
      '1': { type: Number, default: 0 },
    },

    tags: [String],

    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
      },
    ],

    discount: {
      percentage: Number,
      validUntil: Date,
      reason: String,
    },

    ecoLabel: {
      certified: Boolean,
      label: String, // 'FSC', 'GreenGuard', etc.
      link: String,
    },

    customizable: {
      type: Boolean,
      default: false,
    },

    customizationOptions: [
      {
        name: String,
        type: String, // 'color', 'size', 'finish'
        choices: [String],
      },
    ],

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
    },

    favorites: {
      type: Number,
      default: 0,
    },

    incompatibleWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

MaterialSchema.index({ category: 1, inStock: 1 });
MaterialSchema.index({ name: 'text', description: 'text', tags: 'text' });
MaterialSchema.index({ price: 1 });
MaterialSchema.index({ rating: -1 });
MaterialSchema.index({ featured: 1 });

// ═════════════════════════════════════════════════════
// VIRTUALS
// ═════════════════════════════════════════════════════

MaterialSchema.virtual('discountedPrice').get(function () {
  if (!this.discount?.percentage) return this.price;
  return (this.price * (1 - this.discount.percentage / 100)).toFixed(2);
});

MaterialSchema.virtual('discountAmount').get(function () {
  if (!this.discount?.percentage) return 0;
  return (this.price * (this.discount.percentage / 100)).toFixed(2);
});

MaterialSchema.virtual('averageRating').get(function () {
  return this.rating.toFixed(1);
});

MaterialSchema.virtual('url').get(function () {
  return `/api/materials/${this._id}`;
});

// ═════════════════════════════════════════════════════
// MÉTHODES
// ═════════════════════════════════════════════════════

MaterialSchema.methods.addReview = function (rating) {
  const totalRating = this.rating * this.reviews;
  this.reviews += 1;
  this.rating = (totalRating + rating) / this.reviews;

  this.rating_breakdown[rating] = (this.rating_breakdown[rating] || 0) + 1;
};

MaterialSchema.methods.updateStock = function (quantity) {
  this.stockQuantity = Math.max(0, this.stockQuantity + quantity);

  if (this.stockQuantity > 20) {
    this.availability = 'in-stock';
  } else if (this.stockQuantity > 5) {
    this.availability = 'low-stock';
  } else if (this.stockQuantity > 0) {
    this.availability = 'low-stock';
  } else {
    this.availability = 'on-order';
  }

  this.inStock = this.stockQuantity > 0;
};

MaterialSchema.methods.isOnDiscount = function () {
  if (!this.discount?.validUntil) return false;
  return new Date() < new Date(this.discount.validUntil);
};

MaterialSchema.methods.incrementViews = function () {
  this.views += 1;
};

MaterialSchema.methods.incrementFavorites = function () {
  this.favorites += 1;
};

const Material = mongoose.model('Material', MaterialSchema);

export default Material;
