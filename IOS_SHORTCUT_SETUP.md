# iOS Shortcut Setup — Furnishing App

This shortcut lets you share any image from any iOS app (Safari, Instagram, Pinterest, etc.) directly to the furnishing app's queue for later review.

## Setup Instructions

1. Open the **Shortcuts** app on your iPhone
2. Tap **+** to create a new shortcut
3. Name it **"Save to Furnishing"**
4. Configure it as a **Share Sheet** shortcut:
   - Tap the **ⓘ** button at the top
   - Enable **Show in Share Sheet**
   - Set **Share Sheet Types** to: **Images**, **URLs**

## Shortcut Actions

### Step 1: Receive Input
- Action: **Receive** what is shared (Images, URLs)

### Step 2: Check Input Type
- Action: **If** — Input **is** Image
  - Action: **Base64 Encode** the image
  - Action: **Get Contents of URL** (POST request)
    - URL: `https://YOUR_BACKEND_URL/api/queue/add`
    - Method: POST
    - Headers: `Content-Type: application/json`
    - Request Body (JSON):
      ```json
      {
        "image_data": "[Base64 Encoded Image]",
        "source_url": "",
        "title": ""
      }
      ```
- **Otherwise** (it's a URL):
  - Action: **Get Contents of URL** (POST request)
    - URL: `https://YOUR_BACKEND_URL/api/queue/add`
    - Method: POST
    - Headers: `Content-Type: application/json`
    - Request Body (JSON):
      ```json
      {
        "image_data": "[Shortcut Input]",
        "source_url": "[Shortcut Input]",
        "title": ""
      }
      ```

### Step 3: Show Result
- Action: **Show Notification** — "Saved to Furnishing queue!"

## How It Works

1. You see something inspiring in any app
2. Tap the **Share** button
3. Select **"Save to Furnishing"**
4. The image/URL is sent to the backend queue endpoint
5. It appears in the Queue tab of the web app
6. You or Anna review it later — assign a room, category, and save

## Notes

- Replace `YOUR_BACKEND_URL` with your actual deployed backend URL
- Images shared from the share sheet are base64-encoded and uploaded to R2
- URLs are fetched server-side and the image is stored in R2
- All items enter the queue with `queued: 1` — they need manual review to be promoted to the main grid
