import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itemsRouter from './routes/items.js';
import roomsRouter from './routes/rooms.js';
import uploadRouter from './routes/upload.js';
import queueRouter from './routes/queue.js';

// Load environment variables
dotenv.config();

// Import db to trigger initialization
import './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// JSON body parser with 50mb limit (for base64 images from extension/iOS)
app.use(express.json({ limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes — serve at both /api/... and /... for flexibility
app.use('/api/items', itemsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/queue', queueRouter);
app.use('/items', itemsRouter);
app.use('/rooms', roomsRouter);
app.use('/upload', uploadRouter);
app.use('/queue', queueRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Diagnostic endpoint - check items table for issues
import { getAll } from './db.js';
app.get('/debug/items', async (req, res) => {
  try {
    // Test each column group to find which one hangs
    const test = req.query.cols || 'basic';
    let sql;
    if (test === 'basic') {
      sql = 'SELECT id, title, room, category, queued, created_at FROM items';
    } else if (test === 'urls') {
      sql = 'SELECT id, image_url, source_url FROM items';
    } else if (test === 'extras') {
      sql = 'SELECT id, color, notes, price, focal_point_x, focal_point_y, starred FROM items';
    } else if (test === 'all') {
      sql = 'SELECT * FROM items';
    } else if (test === 'filtered') {
      sql = 'SELECT id, title, room, category FROM items WHERE queued = 0';
    }
    console.log('[debug] Running:', sql);
    const rows = await Promise.race([
      getAll(sql, []),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), 10000))
    ]);
    res.json({ count: rows.length, rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Furnishing API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
