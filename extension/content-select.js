// Content script for image selection mode
// Injected on demand by popup.js when user clicks "Select Image"
// NOT a persistent content script - runs once per selection

(function() {
  'use strict';

  // Prevent double-injection
  if (window.__furnishingHelperActive) return;
  window.__furnishingHelperActive = true;

  // --- Create the overlay ---
  const overlay = document.createElement('div');
  overlay.id = 'furnishing-helper-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.15);
    z-index: 2147483646;
    cursor: crosshair;
    pointer-events: none;
  `;
  document.body.appendChild(overlay);

  // --- Instruction banner ---
  const banner = document.createElement('div');
  banner.id = 'furnishing-helper-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #4F7F72;
    color: white;
    text-align: center;
    padding: 10px 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    z-index: 2147483647;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    pointer-events: auto;
  `;
  banner.textContent = 'Click any image to save it  |  Press Escape to cancel';
  document.body.appendChild(banner);

  // Track the currently highlighted image
  let highlightedImg = null;
  let originalOutline = '';

  // --- Highlight images on hover ---
  function onMouseOver(e) {
    const img = e.target.closest('img');
    if (!img) return;

    // Remove previous highlight
    if (highlightedImg && highlightedImg !== img) {
      highlightedImg.style.outline = originalOutline;
    }

    // Apply highlight
    originalOutline = img.style.outline;
    img.style.outline = '3px solid #4F7F72';
    img.style.outlineOffset = '2px';
    highlightedImg = img;
  }

  // --- Remove highlight on mouseout ---
  function onMouseOut(e) {
    const img = e.target.closest('img');
    if (img && img === highlightedImg) {
      img.style.outline = originalOutline;
      highlightedImg = null;
      originalOutline = '';
    }
  }

  // --- Try to find a price near the image ---
  function findNearbyPrice(img) {
    // Match $1,234.56, €5,000, £299, USD 99.99, EUR 50, GBP 100, etc.
    const priceRegex = /(?:[\$€£]|(?:USD|EUR|GBP)\s?)[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\s?(?:USD|EUR|GBP)/i;

    // Match "Sold for $4,250" or "Sold for $4,250.00" patterns (auction sites)
    const soldForRegex = /sold\s+for\s+(?:[\$€£]|(?:USD|EUR|GBP)\s?)[\d,]+(?:\.\d{1,2})?/i;

    function extractPrice(text) {
      const match = text.match(priceRegex);
      if (match) {
        return match[0].replace(/[^0-9.]/g, '');
      }
      return null;
    }

    function extractSoldPrice(text) {
      const match = text.match(soldForRegex);
      if (match) {
        return match[0].replace(/[^0-9.]/g, '');
      }
      return null;
    }

    // --- Priority 1: Look for "Sold for $X" anywhere on the page ---
    // On auction detail pages the image and price are often in separate sections,
    // so check specific known containers first, then fall back to full-page scan.
    const bidContainer = document.querySelector('[data-testid="bid-canvas-container"], [class*="bid-canvas"], [class*="sold-price"], [class*="hammer-price"]');
    if (bidContainer) {
      const sp = extractSoldPrice(bidContainer.textContent);
      if (sp) return sp;
    }

    // Also walk up from the image looking for "Sold for" in ancestors
    let walkEl = img.parentElement;
    for (let i = 0; i < 10 && walkEl; i++) {
      const sp = extractSoldPrice(walkEl.textContent);
      if (sp) return sp;
      walkEl = walkEl.parentElement;
    }

    // Broad page-level scan for "Sold for" (auction detail pages typically have one)
    const pageSold = extractSoldPrice(document.body.textContent);
    if (pageSold) return pageSold;

    // --- Priority 2: Structured price elements in a product/card container ---
    const container = img.closest('article, [class*="product"], [class*="card"], [class*="item"], [class*="listing"], [class*="tile"], [class*="lot"], [class*="auction"], [data-product], [data-item], [data-lot]');
    if (container) {
      // Look for elements with price-related classes/attributes
      const priceEl = container.querySelector('[class*="price"], [class*="Price"], [class*="bid"], [class*="estimate"], [data-price], [itemprop="price"], .amount, .cost');
      if (priceEl) {
        const p = extractPrice(priceEl.textContent);
        if (p) return p;
      }
      // Fall back to scanning the container text
      const p = extractPrice(container.textContent);
      if (p) return p;
    }

    // --- Priority 3: Walk up parents looking for any price ---
    let el = img.parentElement;
    for (let i = 0; i < 5 && el; i++) {
      const priceEl = el.querySelector('[class*="price"], [class*="Price"], [class*="bid"], [class*="estimate"], [data-price], [itemprop="price"]');
      if (priceEl) {
        const p = extractPrice(priceEl.textContent);
        if (p) return p;
      }
      const p = extractPrice(el.textContent);
      if (p) return p;
      el = el.parentElement;
    }

    return null;
  }

  // --- Handle image click ---
  function onClick(e) {
    const img = e.target.closest('img');
    if (!img) return;

    // Prevent the default click behavior (e.g., following a link)
    e.preventDefault();
    e.stopPropagation();

    // Try to detect a price
    const detectedPrice = findNearbyPrice(img);

    // Gather image data
    const imageData = {
      src: img.src,
      alt: img.alt || '',
      pageUrl: window.location.href,
      detectedPrice: detectedPrice
    };

    // Send the selected image data to the background script for storage
    chrome.runtime.sendMessage({
      action: 'imageSelected',
      data: imageData
    });

    // Clean up the overlay
    cleanup();

    // Show a brief confirmation message
    showConfirmation();
  }

  // --- Handle escape key to cancel ---
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  // --- Remove all injected elements and listeners ---
  function cleanup() {
    // Remove highlight from current image
    if (highlightedImg) {
      highlightedImg.style.outline = originalOutline;
    }

    // Remove overlay and banner
    overlay.remove();
    banner.remove();

    // Remove event listeners
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout', onMouseOut, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);

    // Clear active flag
    window.__furnishingHelperActive = false;
  }

  // --- Show brief confirmation after image is captured ---
  function showConfirmation() {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4F7F72;
      color: white;
      padding: 14px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: opacity 0.3s;
    `;
    toast.textContent = 'Image captured! Click the extension icon to save.';
    document.body.appendChild(toast);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Attach event listeners (capture phase to intercept before page handlers) ---
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

})();
