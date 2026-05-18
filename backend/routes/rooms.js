import express from 'express';
import { runQuery, getOne, getAll } from '../db.js';

const router = express.Router();

// Generate slug from room name
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '-');
}

// GET / - List all rooms ordered by sort_order
router.get('/', async (req, res) => {
  try {
    const rooms = await getAll('SELECT * FROM rooms ORDER BY sort_order ASC', []);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST / - Create room
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const slug = slugify(name);

    // Get the next sort_order value
    const last = await getOne('SELECT MAX(sort_order) as max_order FROM rooms', []);
    const sortOrder = (last?.max_order ?? -1) + 1;

    const result = await runQuery(
      'INSERT INTO rooms (name, slug, sort_order) VALUES (?, ?, ?)',
      [name, slug, sortOrder]
    );

    const newRoom = await getOne('SELECT * FROM rooms WHERE id = ?', [result.id]);
    res.status(201).json(newRoom);
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Room with this name already exists' });
    }
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PATCH /:id - Update room name/sort_order
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await getOne('SELECT * FROM rooms WHERE id = ?', [id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updates = [];
    const values = [];

    if (req.body.name !== undefined) {
      updates.push('name = ?');
      values.push(req.body.name);
      updates.push('slug = ?');
      values.push(slugify(req.body.name));
    }

    if (req.body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(req.body.sort_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await runQuery(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await getOne('SELECT * FROM rooms WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Room with this name already exists' });
    }
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /:id - Delete room
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await runQuery('DELETE FROM rooms WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
