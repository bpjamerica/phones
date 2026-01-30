import { Router } from 'express';
import { reps } from '../db/queries.js';
import { hashPassword, requireAdmin } from '../services/auth.js';

const router = Router();

// Bulk import page
router.get('/', requireAdmin, (req, res) => {
  res.send(`
    <html>
      <head><title>Bulk Import Reps</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1>Bulk Import Reps</h1>
        <p>Enter one rep per line in this format:<br>
        <code>Name, Email, Phone</code></p>
        <p>Example:</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">John Smith, john@example.com, +14155551234
Jane Doe, jane@example.com, +14155555678
Bob Wilson, bob@example.com, +14155559999</pre>
        <form method="POST" action="/api/bulk">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Default Password (for all new reps)</label>
            <input type="text" name="password" required value="changeme123" style="width: 100%; padding: 8px; box-sizing: border-box;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Reps List</label>
            <textarea name="reps" rows="15" required style="width: 100%; padding: 8px; box-sizing: border-box; font-family: monospace;" placeholder="Name, Email, Phone"></textarea>
          </div>
          <button type="submit" style="background: #4F46E5; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
            Import Reps
          </button>
          <a href="/" style="margin-left: 15px;">Cancel</a>
        </form>
      </body>
    </html>
  `);
});

// Process bulk import
router.post('/', requireAdmin, async (req, res) => {
  const { reps: repsList, password } = req.body;

  if (!repsList || !password) {
    return res.status(400).send('Reps list and password are required');
  }

  const lines = repsList.split('\n').filter(line => line.trim());
  const results = { success: [], failed: [] };
  const password_hash = await hashPassword(password);

  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());

    if (parts.length < 3) {
      results.failed.push({ line, error: 'Need name, email, and phone' });
      continue;
    }

    const [name, email, phone] = parts;

    if (!name || !email || !phone) {
      results.failed.push({ line, error: 'Missing required field' });
      continue;
    }

    try {
      reps.create({ name, phone, email, password_hash, is_admin: 0, must_change_password: 1 });
      results.success.push(name);
    } catch (error) {
      results.failed.push({ line, error: error.message });
    }
  }

  res.send(`
    <html>
      <head><title>Import Results</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1>Import Complete</h1>
        <h2 style="color: green;">Successfully Added (${results.success.length})</h2>
        <ul>
          ${results.success.map(name => `<li>${name}</li>`).join('')}
        </ul>
        ${results.failed.length > 0 ? `
          <h2 style="color: red;">Failed (${results.failed.length})</h2>
          <ul>
            ${results.failed.map(f => `<li><code>${f.line}</code> - ${f.error}</li>`).join('')}
          </ul>
        ` : ''}
        <p><a href="/">Go to App</a> | <a href="/api/bulk">Import More</a></p>
      </body>
    </html>
  `);
});

export default router;
