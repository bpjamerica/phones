import db from './schema.js';

// Rep queries
export const reps = {
  getAll: () => {
    return db.prepare(`
      SELECT id, name, phone, email, is_active, is_admin, created_at
      FROM reps
      ORDER BY name
    `).all();
  },

  getActive: () => {
    return db.prepare(`
      SELECT id, name, phone, email, is_admin, created_at
      FROM reps
      WHERE is_active = 1
      ORDER BY name
    `).all();
  },

  getById: (id) => {
    return db.prepare(`
      SELECT id, name, phone, email, is_active, is_admin, created_at
      FROM reps
      WHERE id = ?
    `).get(id);
  },

  getByEmail: (email) => {
    return db.prepare(`
      SELECT * FROM reps WHERE email = ?
    `).get(email);
  },

  create: ({ name, phone, email, password_hash, is_admin = 0, must_change_password = 0 }) => {
    const stmt = db.prepare(`
      INSERT INTO reps (name, phone, email, password_hash, is_admin, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, phone, email, password_hash, is_admin, must_change_password);
    return { id: result.lastInsertRowid, name, phone, email, is_admin };
  },

  update: (id, { name, phone, email, is_active, is_admin }) => {
    const stmt = db.prepare(`
      UPDATE reps
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          is_active = COALESCE(?, is_active),
          is_admin = COALESCE(?, is_admin)
      WHERE id = ?
    `);
    stmt.run(name, phone, email, is_active, is_admin, id);
    return reps.getById(id);
  },

  updatePassword: (id, password_hash) => {
    const stmt = db.prepare(`UPDATE reps SET password_hash = ?, must_change_password = 0 WHERE id = ?`);
    stmt.run(password_hash, id);
  }
};

// Call queries
export const calls = {
  create: ({ logged_by_rep_id, customer_rep_id, customer_name, customer_phone, notes }) => {
    const stmt = db.prepare(`
      INSERT INTO calls (logged_by_rep_id, customer_rep_id, customer_name, customer_phone, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(logged_by_rep_id, customer_rep_id, customer_name, customer_phone, notes);
    return { id: result.lastInsertRowid };
  },

  getAll: ({ startDate, endDate, customerRepId } = {}) => {
    let sql = `
      SELECT
        c.id,
        c.customer_name,
        c.customer_phone,
        c.notes,
        c.created_at,
        c.logged_by_rep_id,
        c.customer_rep_id,
        lr.name as logged_by_name,
        cr.name as customer_rep_name,
        cr.phone as customer_rep_phone,
        (SELECT status FROM sms_log WHERE call_id = c.id ORDER BY sent_at DESC LIMIT 1) as sms_status
      FROM calls c
      JOIN reps lr ON c.logged_by_rep_id = lr.id
      JOIN reps cr ON c.customer_rep_id = cr.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ` AND c.created_at >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND c.created_at <= ?`;
      params.push(endDate);
    }
    if (customerRepId) {
      sql += ` AND c.customer_rep_id = ?`;
      params.push(customerRepId);
    }

    sql += ` ORDER BY c.created_at DESC`;

    return db.prepare(sql).all(...params);
  },

  getById: (id) => {
    return db.prepare(`
      SELECT
        c.*,
        lr.name as logged_by_name,
        cr.name as customer_rep_name
      FROM calls c
      JOIN reps lr ON c.logged_by_rep_id = lr.id
      JOIN reps cr ON c.customer_rep_id = cr.id
      WHERE c.id = ?
    `).get(id);
  },

  getGroupedByRep: ({ startDate, endDate } = {}) => {
    let sql = `
      SELECT
        c.id,
        c.customer_name,
        c.customer_phone,
        c.notes,
        c.created_at,
        c.customer_rep_id,
        lr.name as logged_by_name,
        cr.name as customer_rep_name,
        cr.id as rep_id,
        (SELECT status FROM sms_log WHERE call_id = c.id ORDER BY sent_at DESC LIMIT 1) as sms_status
      FROM calls c
      JOIN reps lr ON c.logged_by_rep_id = lr.id
      JOIN reps cr ON c.customer_rep_id = cr.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ` AND c.created_at >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND c.created_at <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY cr.name, c.created_at DESC`;

    return db.prepare(sql).all(...params);
  }
};

// SMS log queries
export const smsLog = {
  create: ({ call_id, to_rep_id, message, twilio_sid, status }) => {
    const stmt = db.prepare(`
      INSERT INTO sms_log (call_id, to_rep_id, message, twilio_sid, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(call_id, to_rep_id, message, twilio_sid, status);
    return { id: result.lastInsertRowid };
  },

  updateStatus: (twilio_sid, status) => {
    const stmt = db.prepare(`UPDATE sms_log SET status = ? WHERE twilio_sid = ?`);
    stmt.run(status, twilio_sid);
  },

  getAll: ({ limit = 100 } = {}) => {
    return db.prepare(`
      SELECT
        s.*,
        r.name as to_rep_name,
        r.phone as to_rep_phone,
        c.customer_name
      FROM sms_log s
      JOIN reps r ON s.to_rep_id = r.id
      JOIN calls c ON s.call_id = c.id
      ORDER BY s.sent_at DESC
      LIMIT ?
    `).all(limit);
  },

  getByCallId: (callId) => {
    return db.prepare(`
      SELECT s.*, r.name as to_rep_name
      FROM sms_log s
      JOIN reps r ON s.to_rep_id = r.id
      WHERE s.call_id = ?
      ORDER BY s.sent_at DESC
    `).all(callId);
  }
};

export default { reps, calls, smsLog };
