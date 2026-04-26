/* ═════════════════════════════════════════════════════
   MODÈLE UTILISATEUR
═════════════════════════════════════════════════════ */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      minlength: [2, 'Le nom doit avoir au moins 2 caractères'],
      maxlength: [100, 'Le nom ne doit pas dépasser 100 caractères'],
    },

    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Email invalide',
      ],
    },

    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [8, 'Le mot de passe doit avoir au moins 8 caractères'],
      select: false,
    },

    phone: {
      type: String,
      match: [/^[\d\s\-\+\(\)]+$/, 'Numéro de téléphone invalide'],
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ['user', 'designer', 'admin'],
      default: 'user',
    },

    subscriptionPlan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'premium'],
      default: 'free',
    },

    subscriptionExpire: {
      type: Date,
      default: null,
    },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    company: {
      name: String,
      website: String,
      taxId: String,
    },

    preferences: {
      language: {
        type: String,
        enum: ['fr', 'en', 'es', 'de'],
        default: 'fr',
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'dark',
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: String,
    emailVerificationExpire: Date,

    passwordResetToken: String,
    passwordResetExpire: Date,

    lastLogin: Date,

    loginHistory: [
      {
        date: Date,
        ip: String,
        userAgent: String,
      },
    ],

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: String,

    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'deleted'],
      default: 'active',
    },

    deletedAt: Date,

    stats: {
      projectsCount: { type: Number, default: 0 },
      ordersCount: { type: Number, default: 0 },
      favoritesCount: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ═════════════════════════════════════════════════════
// INDEXES
// ═════════════════════════════════════════════════════

UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ accountStatus: 1 });

// ═════════════════════════════════════════════════════
// MIDDLEWARES
// ═════════════════════════════════════════════════════

// Hasher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ═════════════════════════════════════════════════════
// MÉTHODES
// ═════════════════════════════════════════════════════

// Comparer les mots de passe
UserSchema.methods.comparePassword = async function (passwordToCheck) {
  return await bcrypt.compare(passwordToCheck, this.password);
};

// Obtenir l'URL du profil
UserSchema.virtual('profileUrl').get(function () {
  return `/api/users/${this._id}`;
});

// Vérifier si le compte est actif
UserSchema.methods.isAccountActive = function () {
  return this.accountStatus === 'active';
};

// Vérifier si l'abonnement est valide
UserSchema.methods.hasActiveSubscription = function () {
  if (this.subscriptionPlan === 'free') return true;
  if (!this.subscriptionExpire) return false;
  return new Date() < new Date(this.subscriptionExpire);
};

// Mettre à jour le dernier login
UserSchema.methods.updateLastLogin = async function (ip, userAgent) {
  this.lastLogin = new Date();
  this.loginHistory.push({
    date: new Date(),
    ip,
    userAgent,
  });
  
  // Garder seulement les 50 derniers logins
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  
  await this.save();
};

// Obtenir les données publiques de l'utilisateur
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpire;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpire;
  delete user.twoFactorSecret;
  delete user.loginHistory;
  return user;
};

const User = mongoose.model('User', UserSchema);

export default User;
