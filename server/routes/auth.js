import { Router } from 'express';
import { authenticateUser, hashPassword, verifyPassword, requireAuth } from '../services/auth.js';
import { reps } from '../db/queries.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await authenticateUser(email, password);

  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  req.session.user = result.user;
  res.json({ user: result.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Refresh user data from database
  const rep = reps.getByEmail(req.session.user.email);
  if (rep) {
    req.session.user.must_change_password = rep.must_change_password;
  }
  res.json({ user: req.session.user });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const rep = reps.getByEmail(req.session.user.email);
  if (!rep) {
    return res.status(404).json({ error: 'User not found' });
  }

  const valid = await verifyPassword(current_password, rep.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const password_hash = await hashPassword(new_password);
  reps.updatePassword(rep.id, password_hash);

  // Update session
  req.session.user.must_change_password = 0;

  res.json({ success: true });
});

export default router;
