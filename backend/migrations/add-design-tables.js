// Migration: Add design advisor tables
// Run once: node migrations/add-design-tables.js
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('Running design advisor migration...');

  // Room analyses — output of Step 1 (vision analysis of room photos)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS room_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_slug TEXT NOT NULL,
      photos TEXT,
      style_tags TEXT,
      vibe_summary TEXT,
      raw_llm_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  Created room_analyses');

  // Room elements — individual components detected by AI
  await db.execute(`
    CREATE TABLE IF NOT EXISTS room_elements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      material_tags TEXT,
      color_hex TEXT,
      style_tags TEXT,
      texture TEXT,
      pattern TEXT,
      formality REAL,
      ai_description TEXT,
      status TEXT DEFAULT 'keep',
      sort_order INTEGER DEFAULT 0
    )
  `);
  console.log('  Created room_elements');

  // Design projects — a specific design direction for a room
  await db.execute(`
    CREATE TABLE IF NOT EXISTS design_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id INTEGER NOT NULL,
      name TEXT,
      status TEXT DEFAULT 'draft',
      user_context TEXT,
      vibe_refined TEXT,
      palette TEXT,
      recommendations TEXT,
      llm_reasoning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  Created design_projects');

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
