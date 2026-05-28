import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne } from '../db.js';
import { uploadToR2 } from '../r2.js';

const router = express.Router();

// POST /add - Add item to queue (for iOS shortcut)
// Accepts image_data as base64 or URL, plus optional source_url and title
router.post('/add', async (req, res) => {
  try {
    const { image_data, source_url, title } = req.body;

    let imageUrl = null;

    // If no explicit source_url, but image_data is a page URL, use it as source
    let finalSourceUrl = source_url || null;

    if (image_data) {
      // Determine if image_data is a URL or base64
      if (image_data.startsWith('http://') || image_data.startsWith('https://')) {
        // Try to fetch the URL and check if it's actually an image
        try {
          const response = await fetch(image_data);
          if (!response.ok) {
            // Can't fetch — just save the URL as source
            if (!finalSourceUrl) finalSourceUrl = image_data;
          } else {
            const contentType = response.headers.get('content-type') || '';

            if (contentType.startsWith('image/')) {
              // It's a real image — upload to R2
              const buffer = Buffer.from(await response.arrayBuffer());
              const extMap = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
              };
              const ext = extMap[contentType] || '.jpg';
              const filename = `${uuidv4()}${ext}`;
              imageUrl = await uploadToR2(buffer, filename, contentType);
            } else {
              // Not an image (HTML page, etc.) — save URL as source instead
              if (!finalSourceUrl) finalSourceUrl = image_data;
            }
          }
        } catch (fetchError) {
          console.error('Error fetching URL:', fetchError);
          // Don't fail — just save the URL as source
          if (!finalSourceUrl) finalSourceUrl = image_data;
        }
      } else {
        // Treat as base64
        let base64Data = image_data;
        let contentType = 'image/jpeg';

        const dataUriMatch = image_data.match(/^data:([^;]+);base64,(.+)$/);
        if (dataUriMatch) {
          contentType = dataUriMatch[1];
          base64Data = dataUriMatch[2];
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const extMap = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
        };
        const ext = extMap[contentType] || '.jpg';
        const filename = `${uuidv4()}${ext}`;

        imageUrl = await uploadToR2(buffer, filename, contentType);
      }
    }

    // Create queued item
    const result = await runQuery(
      `INSERT INTO items (title, image_url, source_url, queued)
       VALUES (?, ?, ?, 1)`,
      [title || null, imageUrl, finalSourceUrl]
    );

    const newItem = await getOne('SELECT id, title, image_url, source_url, room, category, color, notes, price, focal_point_x, focal_point_y, starred, queued, created_at FROM items WHERE id = ?', [result.id]);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: 'Failed to add item to queue' });
  }
});

// POST /:id/promote - Move item from queue to main collection
// Allows setting room, category, color at the same time
router.post('/:id/promote', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await getOne('SELECT id, title, image_url, source_url, room, category, color, notes, price, focal_point_x, focal_point_y, starred, queued, created_at FROM items WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (!item.queued) {
      return res.status(400).json({ error: 'Item is not in the queue' });
    }

    const { room, category, color, title, notes } = req.body;

    const updates = ['queued = 0'];
    const values = [];

    if (room !== undefined) {
      updates.push('room = ?');
      values.push(room);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }

    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    values.push(id);
    await runQuery(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await getOne('SELECT id, title, image_url, source_url, room, category, color, notes, price, focal_point_x, focal_point_y, starred, queued, created_at FROM items WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    console.error('Error promoting item:', error);
    res.status(500).json({ error: 'Failed to promote item from queue' });
  }
});

export default router;
