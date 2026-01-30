import { Router } from 'express';
import { reps } from '../db/queries.js';
import { hashPassword } from '../services/auth.js';

const router = Router();

// Check if setup is needed
router.get('/', (req, res) => {
  const allReps = reps.getAll();
  if (allReps.length > 0) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; max-width: 500px; margin: 0 auto;">
          <h1>Setup Complete</h1>
          <p>Admin user already exists. <a href="/">Go to app</a></p>
        </body>
      </html>
    `);
  }

  res.send(`
    <html>
      <body style="font-family: sans-serif; padding: 40px; max-width: 500px; margin: 0 auto;">
        <h1>Create Admin User</h1>
        <form method="POST" action="/setup">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Name</label>
            <input type="text" name="name" required style="width: 100%; padding: 8px; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Email</label>
            <input type="email" name="email" required style="width: 100%; padding: 8px; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Phone (for SMS)</label>
            <input type="tel" name="phone" required placeholder="+1234567890" style="width: 100%; padding: 8px; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Password</label>
            <input type="password" name="password" required minlength="6" style="width: 100%; padding: 8px; box-sizing: border-box;">
          </div>
          <button type="submit" style="background: #4F46E5; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
            Create Admin
          </button>
        </form>
      </body>
    </html>
  `);
});

// Create admin user
router.post('/', async (req, res) => {
  const allReps = reps.getAll();
  if (allReps.length > 0) {
    return res.status(400).send('Setup already complete');
  }

  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    const password_hash = await hashPassword(password);
    reps.create({
      name,
      phone,
      email,
      password_hash,
      is_admin: 1
    });

    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; max-width: 500px; margin: 0 auto;">
          <h1>Admin Created!</h1>
          <p>You can now <a href="/">log in</a> with your email and password.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Error creating user: ' + error.message);
  }
});

export default router;
