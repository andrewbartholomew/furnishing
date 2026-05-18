import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { uploadToR2 } from '../r2.js';

const router = express.Router();

// Configure multer with memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Guess file extension from content type
function extensionFromContentType(contentType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/heic': '.heic',
    'image/heif': '.heif',
  };
  return map[contentType] || '.jpg';
}

// POST / - Multipart file upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const ext = extensionFromContentType(req.file.mimetype);
    const filename = `${uuidv4()}${ext}`;

    const imageUrl = await uploadToR2(req.file.buffer, filename, req.file.mimetype);

    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /from-url - Fetch image from URL, upload to R2
router.post('/from-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch the image
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch image from URL: ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    const ext = extensionFromContentType(contentType);
    const filename = `${uuidv4()}${ext}`;

    const imageUrl = await uploadToR2(buffer, filename, contentType);

    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error uploading from URL:', error);
    res.status(500).json({ error: 'Failed to upload image from URL' });
  }
});

// POST /from-base64 - Decode base64 image, upload to R2
router.post('/from-base64', async (req, res) => {
  try {
    const { data, filename: originalFilename } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Base64 data is required' });
    }

    // Strip data URI prefix if present (e.g., "data:image/png;base64,")
    let base64Data = data;
    let contentType = 'image/jpeg';

    const dataUriMatch = data.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUriMatch) {
      contentType = dataUriMatch[1];
      base64Data = dataUriMatch[2];
    } else if (originalFilename) {
      // Try to infer content type from filename
      const ext = originalFilename.split('.').pop()?.toLowerCase();
      const extToType = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        heic: 'image/heic',
      };
      contentType = extToType[ext] || 'image/jpeg';
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const ext = extensionFromContentType(contentType);
    const filename = `${uuidv4()}${ext}`;

    const imageUrl = await uploadToR2(buffer, filename, contentType);

    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error uploading from base64:', error);
    res.status(500).json({ error: 'Failed to upload image from base64' });
  }
});

export default router;
