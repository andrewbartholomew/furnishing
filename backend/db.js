import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load env vars early — ES module imports are hoisted above dotenv.config() in server.js
dotenv.config();

// Create Turso database connection
console.log('Turso URL:', process.env.TURSO_DATABASE_URL);
console.log('Turso token starts with:', process.env.TURSO_AUTH_TOKEN?.substring(0, 20));
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Room seed data — grouped by floor, order matches sort_order
const SEED_ROOMS = [
  // Ground floor
  'ground',
  'front hall',
  'living room',
  'dining room',
  'kitchen',
  "butler's pantry",
  'powder room',
  // Second floor
  'second',
  'landing',
  'family room',
  'main bedroom',
  'main bath',
  "grace's room",
  "poppy's room",
  'bathroom 2',
  // Third floor
  'third',
  'guest bedroom',
  'guest bathroom',
  "anna's office",
  "andrew's office",
  'guest living room',
  'guest kitchen',
  // Basement
  'basement',
  // Exterior
  'exterior',
];

// Generate slug from room name (lowercase, spaces to hyphens)
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '-');
}

// Initialize database schema and seed rooms
async function initializeDatabase() {
  try {
    // Tables and seed data already exist in Turso — just verify connectivity
    const test = await db.execute('SELECT count(*) as cnt FROM rooms');
    console.log('Database connected, rooms:', test.rows[0].cnt);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize on startup
initializeDatabase();

// Helper function to run queries
export async function runQuery(sql, params = []) {
  const result = await db.execute({
    sql,
    args: params,
  });
  return { id: result.lastInsertRowid, changes: result.rowsAffected };
}

// Helper function to get single row
export async function getOne(sql, params = []) {
  const result = await db.execute({
    sql,
    args: params,
  });
  return result.rows[0] || null;
}

// Helper function to get all rows
export async function getAll(sql, params = []) {
  const result = await db.execute({
    sql,
    args: params,
  });
  return result.rows;
}

export default db;
