import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use DATABASE_PATH env var for Railway volume, otherwise use local database folder
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/phones.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS reps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logged_by_rep_id INTEGER NOT NULL,
    customer_rep_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (logged_by_rep_id) REFERENCES reps(id),
    FOREIGN KEY (customer_rep_id) REFERENCES reps(id)
  );

  CREATE TABLE IF NOT EXISTS sms_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id INTEGER NOT NULL,
    to_rep_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    twilio_sid TEXT,
    status TEXT DEFAULT 'pending',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES calls(id),
    FOREIGN KEY (to_rep_id) REFERENCES reps(id)
  );

  CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
  CREATE INDEX IF NOT EXISTS idx_calls_customer_rep_id ON calls(customer_rep_id);
  CREATE INDEX IF NOT EXISTS idx_sms_log_call_id ON sms_log(call_id);
`);

export default db;
