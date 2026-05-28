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

// Test: exact same query as items route, bypassing router
import { getAll } from './db.js';
app.get('/test-items', async (req, res) => {
  try {
    console.log('[test-items] Starting...');
    const items = await getAll(
      'SELECT id, title, image_url, source_url, room, category, color, notes, price, focal_point_x, focal_point_y, starred, queued, created_at FROM items WHERE queued = 0 ORDER BY created_at DESC',
      []
    );
    console.log('[test-items] Got', items.length, 'rows');
    res.json(items);
  } catch (err) {
    console.error('[test-items] Error:', err);
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
