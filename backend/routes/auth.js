/* ═════════════════════════════════════════════════════
   ROUTES AUTHENTIFICATION
═════════════════════════════════════════════════════ */

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Fonction pour créer un JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ═════════════════════════════════════════════════════
// INSCRIPTION
// ═════════════════════════════════════════════════════

router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
      subscriptionPlan: 'free',
    });

    // Générer le token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// CONNEXION
// ═════════════════════════════════════════════════════

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier l'utilisateur
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }

    // Vérifier le statut du compte
    if (!user.isAccountActive()) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }

    // Mettre à jour le dernier login
    await user.updateLastLogin(req.ip, req.headers['user-agent']);

    // Générer le token
    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// PROFIL UTILISATEUR
// ═════════════════════════════════════════════════════

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// METTRE À JOUR LE PROFIL
// ═════════════════════════════════════════════════════

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, language, theme } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs autorisés
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (language) user.preferences.language = language;
    if (theme) user.preferences.theme = theme;

    await user.save();

    res.json({
      message: 'Profil mis à jour avec succès',
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// CHANGER LE MOT DE PASSE
// ═════════════════════════════════════════════════════

router.post('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Ancien mot de passe invalide' });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// DÉCONNEXION
// ═════════════════════════════════════════════════════

router.post('/logout', protect, (req, res) => {
  res.json({ message: 'Déconnecté avec succès' });
});

// ═════════════════════════════════════════════════════
// RÉINITIALISER LE MOT DE PASSE
// ═════════════════════════════════════════════════════

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    user.passwordResetToken = resetToken;
    user.passwordResetExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // TODO: Envoyer l'email de réinitialisation

    res.json({ message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// RÉINITIALISER LE MOT DE PASSE (AVEC TOKEN)
// ═════════════════════════════════════════════════════

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.passwordResetExpire < new Date()) {
      return res.status(400).json({ error: 'Token expiré ou invalide' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
