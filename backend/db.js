import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load env vars early — ES module imports are hoisted above dotenv.config() in server.js
dotenv.config();

// Create Turso database connection
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
    // Rooms table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        sort_order INTEGER DEFAULT 0
      )
    `);

    // Items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image_url TEXT,
        source_url TEXT,
        room TEXT,
        category TEXT CHECK(category IN ('potential_purchase', 'inspiration', 'owned', 'room_photo')),
        color TEXT,
        notes TEXT,
        price REAL,
        focal_point_x REAL,
        focal_point_y REAL,
        starred INTEGER DEFAULT 0,
        queued INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Note: price, focal_point_x, focal_point_y columns already exist in CREATE TABLE above.
    // Removed runtime PRAGMA/ALTER TABLE migration — PRAGMA can lock tables on Turso.

    // Seed rooms (INSERT OR IGNORE so it only runs once)
    for (let i = 0; i < SEED_ROOMS.length; i++) {
      const name = SEED_ROOMS[i];
      const slug = slugify(name);
      await db.execute({
        sql: 'INSERT OR IGNORE INTO rooms (name, slug, sort_order) VALUES (?, ?, ?)',
        args: [name, slug, i],
      });
    }

    console.log('Database tables initialized');
    console.log('Rooms seeded');
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
