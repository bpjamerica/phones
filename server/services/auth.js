import bcrypt from 'bcryptjs';
import { reps } from '../db/queries.js';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email, password) {
  const rep = reps.getByEmail(email);

  if (!rep) {
    return { success: false, error: 'Invalid email or password' };
  }

  if (!rep.is_active) {
    return { success: false, error: 'Account is deactivated' };
  }

  const valid = await verifyPassword(password, rep.password_hash);
  if (!valid) {
    return { success: false, error: 'Invalid email or password' };
  }

  return {
    success: true,
    user: {
      id: rep.id,
      name: rep.name,
      email: rep.email,
      is_admin: rep.is_admin
    }
  };
}

// Middleware to require authentication
export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware to require admin
export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.session.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
