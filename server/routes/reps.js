import { Router } from 'express';
import { reps } from '../db/queries.js';
import { hashPassword, requireAuth, requireAdmin } from '../services/auth.js';

const router = Router();

// Get all active reps (for dropdown) - requires auth
router.get('/', requireAuth, (req, res) => {
  try {
    const allReps = reps.getActive();
    res.json(allReps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reps including inactive (admin only)
router.get('/all', requireAdmin, (req, res) => {
  try {
    const allReps = reps.getAll();
    res.json(allReps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single rep
router.get('/:id', requireAuth, (req, res) => {
  try {
    const rep = reps.getById(req.params.id);
    if (!rep) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    res.json(rep);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create rep (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, phone, email, password, is_admin } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'Name, phone, email, and password are required' });
  }

  try {
    const password_hash = await hashPassword(password);
    const rep = reps.create({ name, phone, email, password_hash, is_admin: is_admin ? 1 : 0 });
    res.status(201).json(rep);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update rep (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, phone, email, is_active, is_admin, password } = req.body;

  try {
    // Update password if provided
    if (password) {
      const password_hash = await hashPassword(password);
      reps.updatePassword(req.params.id, password_hash);
    }

    const rep = reps.update(req.params.id, {
      name,
      phone,
      email,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : undefined,
      is_admin: is_admin !== undefined ? (is_admin ? 1 : 0) : undefined
    });

    if (!rep) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    res.json(rep);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
