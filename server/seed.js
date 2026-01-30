// Seed script to create initial admin user
import 'dotenv/config';
import { reps } from './db/queries.js';
import { hashPassword } from './services/auth.js';

async function seed() {
  // Check if admin exists
  const existing = reps.getByEmail('admin@example.com');
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const password_hash = await hashPassword('admin123');
  const admin = reps.create({
    name: 'Admin User',
    phone: '+1234567890',
    email: 'admin@example.com',
    password_hash,
    is_admin: 1
  });

  console.log('Created admin user:', admin);

  // Create a sample rep
  const repHash = await hashPassword('rep123');
  const rep = reps.create({
    name: 'John Smith',
    phone: '+1987654321',
    email: 'john@example.com',
    password_hash: repHash,
    is_admin: 0
  });

  console.log('Created sample rep:', rep);

  // Create another sample rep
  const rep2Hash = await hashPassword('rep123');
  const rep2 = reps.create({
    name: 'Jane Doe',
    phone: '+1555555555',
    email: 'jane@example.com',
    password_hash: rep2Hash,
    is_admin: 0
  });

  console.log('Created sample rep:', rep2);

  console.log('\nSeed completed!');
  console.log('Login with: admin@example.com / admin123');
}

seed().catch(console.error);
