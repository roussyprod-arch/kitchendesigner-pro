/* ═════════════════════════════════════════════════════
   MIDDLEWARE VALIDATION
═════════════════════════════════════════════════════ */

import { validationResult, body, param, query } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ═════════════════════════════════════════════════════
// VALIDATIONS D'AUTHENTIFICATION
// ═════════════════════════════════════════════════════

export const validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Le nom doit avoir au moins 2 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit avoir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir une majuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir un chiffre')
    .matches(/[!@#$%^&*]/)
    .withMessage('Le mot de passe doit contenir un caractère spécial'),
  validate,
];

export const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  validate,
];

// ═════════════════════════════════════════════════════
// VALIDATIONS DE PROJET
// ═════════════════════════════════════════════════════

export const validateCreateProject = [
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Le nom doit avoir au moins 3 caractères'),
  body('width')
    .isFloat({ min: 0.5, max: 10 })
    .withMessage('La largeur doit être entre 0.5m et 10m'),
  body('height')
    .isFloat({ min: 1, max: 4 })
    .withMessage('La hauteur doit être entre 1m et 4m'),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('Le budget doit être positif'),
  validate,
];

// ═════════════════════════════════════════════════════
// VALIDATIONS DE MATÉRIAU
// ═════════════════════════════════════════════════════

export const validateCreateMaterial = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('La description doit avoir au moins 10 caractères'),
  body('category')
    .isIn([
      'Countertops',
      'Cabinets',
      'Backsplash',
      'Flooring',
      'Hardware',
      'Appliances',
      'Lighting',
      'Accessories',
    ])
    .withMessage('Catégorie invalide'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Le prix doit être supérieur à 0'),
  body('color').trim().notEmpty().withMessage('La couleur est requise'),
  validate,
];

// ═════════════════════════════════════════════════════
// VALIDATIONS DE COMMANDE
// ═════════════════════════════════════════════════════

export const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Au moins un article est requis'),
  body('items.*.materialId').notEmpty().withMessage('materialId est requis'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être au moins 1'),
  body('shippingAddress.street').notEmpty().withMessage('La rue est requise'),
  body('shippingAddress.city').notEmpty().withMessage('La ville est requise'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Le code postal est requis'),
  body('shippingAddress.country').notEmpty().withMessage('Le pays est requis'),
  validate,
];
