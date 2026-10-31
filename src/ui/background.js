// Background Service Worker for MapLead Kit

chrome.runtime.onInstalled.addListener(() => {
  console.log('MapLead Kit installed successfully');
});

// Relay messages between content script and popup if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrape_completed') {
    // Save to storage
    chrome.storage.local.get('maplead_leads', (res) => {
      const existing = res.maplead_leads?.items || [];
      const updated = [...existing, ...(request.leads || [])];
      chrome.storage.local.set({
        maplead_leads: {
          items: updated,
          lastUpdated: new Date().toISOString()
        }
      });
    });
  }
});
