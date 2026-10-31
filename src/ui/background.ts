// Background Service Worker
// Handles extension lifecycle events and background tasks

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Google Maps Business Scraper installed');
  } else if (details.reason === 'update') {
    console.log('Google Maps Business Scraper updated');
  }
});

// Optional: Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLeads') {
    // This can be extended to handle async lead retrieval
    sendResponse({ status: 'ok' });
  }
});
