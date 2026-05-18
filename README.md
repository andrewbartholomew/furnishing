# Furnishing — Andrew & Anna

A home furnishing inspiration and purchase planning app. Save images of furniture, room inspiration, and potential purchases — organized by room with filtering, starring, and multiple input methods.

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
# Fill in your Turso and Cloudflare R2 credentials in .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env  # Optional — defaults to localhost:3001
npm install
npm run dev
```

### Chrome Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` folder
4. Update `config.js` with your backend URL if not localhost

### iOS Shortcut
See [IOS_SHORTCUT_SETUP.md](./IOS_SHORTCUT_SETUP.md) for setup instructions.

## Architecture

Same stack as the house-hunting app:
- **Backend**: Express.js + Turso (serverless SQLite) + Cloudflare R2 (image storage)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Chrome Extension**: Manifest V3, works on any webpage
- **iOS Shortcut**: Share sheet → queue endpoint

## Features

- **Browse**: Tile grid of images grouped by room, with filters (room, category, color, starred) and sorting
- **Upload**: Drag-and-drop image upload with metadata assignment
- **Queue**: Review items shared from iOS or other sources
- **Chrome Extension**: Select any image from any webpage, assign room + category, save
- **Star**: Simple shared star/favorite system
