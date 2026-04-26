/* ═════════════════════════════════════════════════════
   MODÈLE PROJET
═════════════════════════════════════════════════════ */

import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du projet est requis'],
      trim: true,
      minlength: [3, 'Le nom doit avoir au moins 3 caractères'],
      maxlength: [200, 'Le nom ne doit pas dépasser 200 caractères'],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    description: {
      type: String,
      maxlength: [2000, 'La description ne doit pas dépasser 2000 caractères'],
    },

    status: {
      type: String,
      enum: ['draft', 'in-progress', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },

    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },

    dimensions: {
      width: {
        type: Number,
        required: [true, 'La largeur est requise'],
        min: [0.5, 'La largeur doit être au moins 0.5m'],
        max: [10, 'La largeur ne doit pas dépasser 10m'],
      },
      height: {
        type: Number,
        required: [true, 'La hauteur est requise'],
        min: [1, 'La hauteur doit être au moins 1m'],
        max: [4, 'La hauteur ne doit pas dépasser 4m'],
      },
      depth: {
        type: Number,
        default: 0.6,
        min: [0.3, 'La profondeur doit être au moins 0.3m'],
        max: [2, 'La profondeur ne doit pas dépasser 2m'],
      },
    },

    budget: {
      type: Number,
      default: 0,
      min: [0, 'Le budget ne peut pas être négatif'],
    },

    estimatedCost: {
      type: Number,
      default: 0,
      min: [0, 'Le coût estimé ne peut pas être négatif'],
    },

    style: {
      type: String,
      enum: [
        'modern',
        'classic',
        'rustic',
        'industrial',
        'minimalist',
        'scandinavian',
        'mediterranean',
        'custom',
      ],
      default: 'modern',
    },

    materials: [
      {
        materialId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Material',
        },
        name: String,
        category: String,
        quantity: Number,
        price: Number,
        total: Number,
        addedAt: { type: Date, default: Date.now },
      },
    ],

    elements: [
      {
        id: String,
        type: String, // 'cabinet', 'counter', 'appliance', 'backsplash'
        position: {
          x: Number,
          y: Number,
          z: Number,
        },
        size: {
          width: Number,
          height: Number,
          depth: Number,
        },
        material: String,
        color: String,
        properties: mongoose.Schema.Types.Mixed,
      },
    ],

    thumbnail: String,

    images: [String],

    Model3d: {
      format: String,
      url: String,
      lastUpdated: Date,
    },

    collaborators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        email: String,
        role: { type: String, enum: ['viewer', 'editor', 'owner'] },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        name: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    versions: [
      {
        versionNumber: Number,
        createdAt: { type: Date, default: Date.now },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        data: mongoose.Schema.Types.Mixed,
      },
    ],

    isFavorite: {
      type: Boolean,
      default: false,
    },

    tags: [String],

    statistics: {
      viewsCount: { type: Number, default: 0 },
      downloadsCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      versionsCount: { type: Number, default: 1 },
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

ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ═════════════════════════════════════════════════════
// VIRTUALS
// ═════════════════════════════════════════════════════

ProjectSchema.virtual('url').get(function () {
  return `/api/projects/${this._id}`;
});

ProjectSchema.virtual('surface').get(function () {
  return (this.dimensions.width * this.dimensions.height).toFixed(2);
});

ProjectSchema.virtual('remainingBudget').get(function () {
  return this.budget - this.estimatedCost;
});

// ═════════════════════════════════════════════════════
// MÉTHODES
// ═════════════════════════════════════════════════════

ProjectSchema.methods.addMaterial = function (material, quantity, price) {
  const existingMaterial = this.materials.find(
    m => m.materialId?.toString() === material._id?.toString()
  );

  if (existingMaterial) {
    existingMaterial.quantity += quantity;
    existingMaterial.total = existingMaterial.price * existingMaterial.quantity;
  } else {
    this.materials.push({
      materialId: material._id,
      name: material.name,
      category: material.category,
      quantity,
      price: price || material.price,
      total: (price || material.price) * quantity,
    });
  }

  this.recalculateCost();
};

ProjectSchema.methods.removeMaterial = function (materialId) {
  this.materials = this.materials.filter(
    m => m.materialId?.toString() !== materialId.toString()
  );
  this.recalculateCost();
};

ProjectSchema.methods.recalculateCost = function () {
  this.estimatedCost = this.materials.reduce((sum, m) => sum + (m.total || 0), 0);
};

ProjectSchema.methods.createVersion = async function (createdBy) {
  this.versions.push({
    versionNumber: this.versions.length + 1,
    createdBy,
    data: {
      materials: this.materials,
      elements: this.elements,
      dimensions: this.dimensions,
    },
  });
  this.statistics.versionsCount = this.versions.length;
};

ProjectSchema.methods.addCollaborator = function (userId, email, role = 'editor') {
  const exists = this.collaborators.some(c => c.userId?.toString() === userId.toString());
  if (!exists) {
    this.collaborators.push({ userId, email, role });
  }
};

ProjectSchema.methods.removeCollaborator = function (userId) {
  this.collaborators = this.collaborators.filter(c => c.userId?.toString() !== userId.toString());
};

const Project = mongoose.model('Project', ProjectSchema);

export default Project;
