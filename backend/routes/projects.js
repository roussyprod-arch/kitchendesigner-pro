/* ═════════════════════════════════════════════════════
   ROUTES PROJETS
═════════════════════════════════════════════════════ */

import express from 'express';
import Project from '../models/Project.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateProject, validate } from '../middleware/validation.js';
import { body, param } from 'express-validator';

const router = express.Router();

// ═════════════════════════════════════════════════════
// CRÉER UN PROJET
// ═════════════════════════════════════════════════════

router.post('/', protect, validateCreateProject, async (req, res) => {
  try {
    const { name, description, width, height, depth, budget, style } = req.body;

    const project = await Project.create({
      userId: req.userId,
      name,
      description,
      dimensions: { width, height, depth },
      budget,
      style,
      status: 'draft',
    });

    res.status(201).json({
      message: 'Projet créé avec succès',
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// OBTENIR TOUS LES PROJETS DE L'UTILISATEUR
// ═════════════════════════════════════════════════════

router.get('/', protect, async (req, res) => {
  try {
    const { status, sortBy = '-createdAt', page = 1, limit = 10 } = req.query;

    let filter = { userId: req.userId };
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// OBTENIR UN PROJET
// ═════════════════════════════════════════════════════

router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('materials');

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// METTRE À JOUR UN PROJET
// ═════════════════════════════════════════════════════

router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, budget, style, materials } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    if (project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Mettre à jour les champs
    if (name) project.name = name;
    if (description) project.description = description;
    if (budget) project.budget = budget;
    if (style) project.style = style;
    if (materials) project.materials = materials;

    await project.save();

    res.json({
      message: 'Projet mis à jour avec succès',
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// AJOUTER UN MATÉRIAU AU PROJET
// ═════════════════════════════════════════════════════

router.post('/:id/materials', protect, async (req, res) => {
  try {
    const { materialId, quantity } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    if (project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    project.materials.push({ materialId, quantity });
    await project.save();

    res.json({
      message: 'Matériau ajouté avec succès',
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// SUPPRIMER UN PROJET
// ═════════════════════════════════════════════════════

router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    if (project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═════════════════════════════════════════════════════
// EXPORTER UN PROJET EN PDF
// ═════════════════════════════════════════════════════

router.get('/:id/export', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('materials.materialId');

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    if (project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // TODO: Générer un PDF
    res.json({
      message: 'Export en cours de préparation',
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
