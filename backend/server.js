/* ═════════════════════════════════════════════════════
   KITCHENDESIGNER PRO - SERVEUR
═════════════════════════════════════════════════════ */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const SECRET_KEY = 'your-secret-key-2024';

// Base de données simulée (EN MÉMOIRE)
let users = [];

// ════════════════════════════════════════════
// ROUTE : INSCRIPTION
// ════════════════════════════════════════════
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' });
  }

  // Vérifier si l'email existe
  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ error: 'Cet email est déjà utilisé' });
  }

  // Créer l'utilisateur
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password, // ⚠️ EN PRODUCTION : hasher le mot de passe !
    createdAt: new Date()
  };

  users.push(newUser);

  // Créer le token
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    SECRET_KEY,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'Utilisateur créé avec succès',
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
});

// ════════════════════════════════════════════
// ROUTE : CONNEXION
// ════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    SECRET_KEY,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Connecté avec succès',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// ════════════════════════════════════════════
// ROUTE : VÉRIFIER LE TOKEN
// ════════════════════════════════════════════
app.post('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

// ════════════════════════════════════════════
// ROUTE : PAGE D'ACCUEIL
// ════════════════════════════════════════════
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
