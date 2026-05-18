// Background service worker for Furnishing Helper extension

// Listen for messages from content script and relay to popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.action);

  if (message.action === 'imageSelected') {
    // Store the selected image data so the popup can retrieve it when it opens
    chrome.storage.local.set({ pendingImage: message.data }, () => {
      console.log('Image data stored for popup');

      // Try to open the popup programmatically (Chrome 99+)
      // If this fails, the user can click the extension icon manually
      if (chrome.action.openPopup) {
        chrome.action.openPopup().catch(() => {
          console.log('Could not auto-open popup - user will click the icon');
        });
      }
    });
  }
});

console.log('Furnishing Helper background script loaded');
