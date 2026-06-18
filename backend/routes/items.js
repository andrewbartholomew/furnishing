import express from 'express';
import { runQuery, getOne, getAll } from '../db.js';
import { deleteFromR2 } from '../r2.js';

const router = express.Router();

// Split columns into two groups to work around Turso hanging on wide selects with many rows
const LIST_COLS_A = 'id, title, image_url, room, category, price';
const LIST_COLS_B = 'id, focal_point_x, focal_point_y, starred, queued, created_at';
// Detail columns — for single-item fetches (few rows, so this is fine)
const DETAIL_COLS = 'id, title, image_url, source_url, room, category, color, notes, price, focal_point_x, focal_point_y, starred, queued, created_at';

// Merge two partial row arrays by id
function mergeRows(rowsA, rowsB) {
  const bMap = new Map(rowsB.map((r) => [r.id, r]));
  return rowsA.map((a) => ({ ...a, ...bMap.get(a.id) }));
}

// GET / - List all non-queued items with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      room,
      category,
      color,
      sort = 'created_at',
      order = 'DESC',
      starred,
    } = req.query;

    let sqlA = `SELECT ${LIST_COLS_A} FROM items WHERE queued = 0`;
    let sqlB = `SELECT ${LIST_COLS_B} FROM items WHERE queued = 0`;
    const paramsA = [];
    const paramsB = [];

    if (room) {
      sqlA += ' AND room = ?';
      sqlB += ' AND room = ?';
      paramsA.push(room);
      paramsB.push(room);
    }

    if (category) {
      sqlA += ' AND category = ?';
      sqlB += ' AND category = ?';
      paramsA.push(category);
      paramsB.push(category);
    }

    if (color) {
      sqlA += ' AND color = ?';
      sqlB += ' AND color = ?';
      paramsA.push(color);
      paramsB.push(color);
    }

    if (starred === '1') {
      sqlA += ' AND starred = 1';
      sqlB += ' AND starred = 1';
    }

    // Run both queries in parallel, merge results, then sort in JS
    const [rowsA, rowsB] = await Promise.all([
      getAll(sqlA, paramsA),
      getAll(sqlB, paramsB),
    ]);

    let items = mergeRows(rowsA, rowsB);

    // Sort in JS (avoids subquery sort that can also hang on Turso)
    const sortColumn = ['created_at', 'title', 'room'].includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 1 : -1;

    if (sortColumn === 'room') {
      // Fetch room sort orders once
      const rooms = await getAll('SELECT slug, sort_order FROM rooms', []);
      const roomOrder = new Map(rooms.map((r) => [r.slug, r.sort_order]));
      items.sort((a, b) => ((roomOrder.get(a.room) || 999) - (roomOrder.get(b.room) || 999)) * sortOrder);
    } else {
      items.sort((a, b) => {
        const av = a[sortColumn] || '';
        const bv = b[sortColumn] || '';
        return (av > bv ? 1 : av < bv ? -1 : 0) * sortOrder;
      });
    }

    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});


// GET /queue - List all queued items
router.get('/queue', async (req, res) => {
  try {
    const items = await getAll(
      `SELECT ${DETAIL_COLS} FROM items WHERE queued = 1 ORDER BY created_at DESC`,
      []
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching queued items:', error);
    res.status(500).json({ error: 'Failed to fetch queued items' });
  }
});

// GET /:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getOne(`SELECT ${DETAIL_COLS} FROM items WHERE id = ?`, [id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST / - Create item
router.post('/', async (req, res) => {
  try {
    const { title, image_url, source_url, room, category, color, notes, price, focal_point_x, focal_point_y, starred, queued } = req.body;

    const result = await runQuery(
      `INSERT INTO items (title, image_url, source_url, room, category, color, notes, price, focal_point_x, focal_point_y, starred, queued)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || null,
        image_url || null,
        source_url || null,
        room || null,
        category || null,
        color || null,
        notes || null,
        price != null ? price : null,
        focal_point_x != null ? focal_point_x : null,
        focal_point_y != null ? focal_point_y : null,
        starred ? 1 : 0,
        queued ? 1 : 0,
      ]
    );

    const newItem = await getOne(`SELECT ${DETAIL_COLS} FROM items WHERE id = ?`, [result.id]);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PATCH /:id - Update item fields
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await getOne(`SELECT ${DETAIL_COLS} FROM items WHERE id = ?`, [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const allowedFields = ['title', 'image_url', 'source_url', 'room', 'category', 'color', 'notes', 'price', 'focal_point_x', 'focal_point_y', 'starred', 'queued'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'starred' || field === 'queued') {
          values.push(req.body[field] ? 1 : 0);
        } else {
          values.push(req.body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await runQuery(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await getOne(`SELECT ${DETAIL_COLS} FROM items WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// POST /:id/star - Toggle star
router.post('/:id/star', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await getOne(`SELECT ${DETAIL_COLS} FROM items WHERE id = ?`, [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newStarred = item.starred ? 0 : 1;
    await runQuery('UPDATE items SET starred = ? WHERE id = ?', [newStarred, id]);

    const updated = await getOne(`SELECT ${DETAIL_COLS} FROM items WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error) {
    console.error('Error toggling star:', error);
    res.status(500).json({ error: 'Failed to toggle star' });
  }
});

// DELETE /:id - Delete item (and R2 image if applicable)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await getOne(`SELECT ${DETAIL_COLS} FROM items WHERE id = ?`, [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // If the image is stored in R2, delete it
    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    if (item.image_url && r2PublicUrl && item.image_url.startsWith(r2PublicUrl)) {
      try {
        const filename = item.image_url.replace(`${r2PublicUrl}/`, '');
        await deleteFromR2(filename);
      } catch (r2Error) {
        console.error('Error deleting image from R2:', r2Error);
      }
    }

    const result = await runQuery('DELETE FROM items WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
