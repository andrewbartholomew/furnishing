// API configuration - loaded from config.js
const API_URL = CONFIG.API_URL;

// DOM elements
const selectMode = document.getElementById('select-mode');
const formMode = document.getElementById('form-mode');
const selectBtn = document.getElementById('select-btn');
const saveBtn = document.getElementById('save-btn');
const previewImg = document.getElementById('preview-img');
const imageSource = document.getElementById('image-source');
const roomSelect = document.getElementById('room');
const categorySelect = document.getElementById('category');
const titleInput = document.getElementById('title');
const priceInput = document.getElementById('price');
const focalContainer = document.getElementById('focal-container');
const focalMarker = document.getElementById('focal-marker');
const errorEl = document.getElementById('error');
const successEl = document.getElementById('success');

// Selected image data
let selectedImageData = null;

// Focal point (0-1 normalized coordinates, null if not set)
let focalPointX = null;
let focalPointY = null;

// On popup load, check if there's a pending image from a previous selection
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.local.get('pendingImage');
    if (result.pendingImage) {
      selectedImageData = result.pendingImage;
      displayImageForm(selectedImageData);

      // Clear the pending data so it doesn't show again next time
      await chrome.storage.local.remove('pendingImage');
    }
  } catch (err) {
    console.error('Error checking for pending image:', err);
  }
});

// "Select Image" button - inject the content script into the active tab
selectBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showError('No active tab found.');
      return;
    }

    // Inject the image selection content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-select.js']
    });

    // Close the popup - the user will interact with the page overlay
    // When they click an image, the content script stores the data via background.js
    // and the popup will load with it next time it opens
    window.close();
  } catch (err) {
    console.error('Error injecting content script:', err);
    showError('Could not access this page. Try a different tab.');
  }
});

// Display the selected image and show the form
function displayImageForm(data) {
  // Show image preview
  previewImg.src = data.src;
  imageSource.textContent = data.pageUrl;

  // Pre-fill title with alt text if available
  if (data.alt) {
    titleInput.value = data.alt;
  }

  // Pre-fill price if detected
  if (data.detectedPrice) {
    priceInput.value = data.detectedPrice;
  }

  // Default room to living room
  roomSelect.value = 'living-room';

  // Switch to form mode
  selectMode.classList.add('hidden');
  formMode.classList.remove('hidden');
}

// Focal point click handler
focalContainer.addEventListener('click', (e) => {
  const rect = previewImg.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  // Clamp to 0-1
  focalPointX = Math.max(0, Math.min(1, x));
  focalPointY = Math.max(0, Math.min(1, y));

  // Position marker
  focalMarker.style.left = (focalPointX * 100) + '%';
  focalMarker.style.top = (focalPointY * 100) + '%';
  focalMarker.classList.add('active');
});

// Save button - upload image and create item
saveBtn.addEventListener('click', async () => {
  if (!selectedImageData) return;

  const room = roomSelect.value;
  if (!room) {
    showError('Please select a room.');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    hideError();

    // Step 1: Upload the image URL to the backend (backend fetches & stores in R2)
    const uploadResponse = await fetch(`${API_URL}/upload/from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: selectedImageData.src })
    });

    if (!uploadResponse.ok) {
      const errData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to upload image');
    }

    const uploadResult = await uploadResponse.json();
    const imageUrl = uploadResult.image_url;

    // Step 2: Create the furnishing item with the stored image URL
    const itemPayload = {
      title: titleInput.value || null,
      image_url: imageUrl,
      source_url: selectedImageData.pageUrl,
      room: room,
      category: categorySelect.value,
      price: priceInput.value ? parseFloat(priceInput.value) : null,
      focal_point_x: focalPointX,
      focal_point_y: focalPointY
    };

    const itemResponse = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemPayload)
    });

    if (!itemResponse.ok) {
      const errData = await itemResponse.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save item');
    }

    // Success
    showSuccess('Saved to your collection!');
    saveBtn.textContent = 'Saved!';

    // Auto-close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1500);

  } catch (err) {
    console.error('Error saving item:', err);
    showError(err.message || 'Failed to save. Is the backend server running?');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save to Collection';
  }
});

// UI helper functions
function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function hideError() {
  errorEl.classList.add('hidden');
}

function showSuccess(message) {
  successEl.textContent = message;
  successEl.classList.remove('hidden');
}
