/* ═════════════════════════════════════════════════════
   MIDDLEWARE GESTION DES ERREURS
═════════════════════════════════════════════════════ */

export const notFound = (req, res, next) => {
  const error = new Error(`Non trouvé - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  const message = error.message || 'Erreur serveur';

  console.error(`[${new Date().toISOString()}] ${status} - ${message}`);

  // Erreur Mongoose
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'ID invalide' });
  }

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ errors: messages });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({ error: `${field} doit être unique` });
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
