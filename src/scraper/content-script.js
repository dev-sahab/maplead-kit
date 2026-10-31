// Content Script for scraping Google Maps results panel

(() => {
  // Prevent double injection
  if (window.__maplead_scraper_injected) return;
  window.__maplead_scraper_injected = true;

  let isScrapingActive = false;
  let isScrapingPaused = false;
  let scrapedLeads = [];
  let scrapedLeadNames = new Set();

  // Helper delay
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Find scrollable container for Google Maps left sidebar
  function getScrollContainer() {
    // Selector for feed in Google Maps (role="feed")
    const feed = document.querySelector('div[role="feed"]');
    if (feed) return feed;

    // Fallbacks
    const ariaList = document.querySelector('div[aria-label*="Results for"], div[aria-label*="results"]');
    if (ariaList) return ariaList;

    // General scrollable parent of business items
    const businessCard = document.querySelector('div.Nv2PK, a.hfpxzc');
    if (businessCard) {
      let parent = businessCard.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
    return null;
  }

  // Extract details from a single business card (div.Nv2PK)
  function extractCardData(card) {
    try {
      // 1. Business Name
      const nameEl = card.querySelector('div.qBF1Pd, div.fontHeadlineSmall, [aria-label]');
      const businessName = nameEl ? (nameEl.innerText || nameEl.getAttribute('aria-label') || '').trim() : '';
      if (!businessName) return null;

      // 2. Link / URL
      const linkEl = card.querySelector('a.hfpxzc, a[href*="/maps/place/"]');
      const placeUrl = linkEl ? linkEl.href : '';

      // 3. Rating & Reviews
      const ratingEl = card.querySelector('span.MW4etd');
      const rating = ratingEl ? ratingEl.innerText.trim() : '';

      const reviewsEl = card.querySelector('span.UY7F9');
      const reviews = reviewsEl ? reviewsEl.innerText.replace(/[()]/g, '').trim() : '';

      // 4. Secondary texts (Category, Address, Phone, Open hours)
      // Google Maps groups these in div.W4Efsd
      const textContainers = card.querySelectorAll('div.W4Efsd');
      let category = '';
      let address = '';
      let phone = '';

      textContainers.forEach((tc) => {
        const text = tc.innerText.trim();
        // Check for phone number pattern: digits, dashes, parens
        const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch && !phone) {
          phone = phoneMatch[0].trim();
        }

        // Split by middle dot "·"
        const parts = text.split('·').map((p) => p.trim());
        if (parts.length >= 2) {
          if (!category) category = parts[0];
          if (!address && parts[1]) address = parts[1];
        } else if (text && !category) {
          category = text;
        }
      });

      // 5. Website URL
      // Check for website button link
      const websiteBtn = card.querySelector('a[data-value="Website"], a.lcr4fd, a[aria-label*="Website"]');
      let websiteUrl = '';
      if (websiteBtn && websiteBtn.href) {
        websiteUrl = websiteBtn.href;
      }

      return {
        id: `gmap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        businessName,
        category,
        streetAddress: address,
        city: '',
        region: '',
        postalCode: '',
        country: '',
        phone,
        websiteUrl,
        email: '',
        socialProfiles: [],
        rating,
        reviews,
        sourceName: 'Google Maps',
        sourceRecordUrl: placeUrl,
        collectedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Error parsing card:', err);
      return null;
    }
  }

  // Core Scraping & Scrolling loop
  async function startScrapingLoop(maxRecords, filters) {
    isScrapingActive = true;
    isScrapingPaused = false;
    scrapedLeads = [];
    scrapedLeadNames = new Set();

    chrome.runtime.sendMessage({
      action: 'scrape_progress',
      data: { collected: 0, target: maxRecords, status: 'running' }
    });

    const scrollContainer = getScrollContainer();
    if (!scrollContainer) {
      chrome.runtime.sendMessage({
        action: 'scrape_error',
        message: 'Could not find the Google Maps results list. Make sure search results are visible on the left.'
      });
      isScrapingActive = false;
      return;
    }

    let previousHeight = 0;
    let sameHeightCount = 0;

    while (isScrapingActive && scrapedLeads.length < maxRecords) {
      // Handle Pause
      while (isScrapingPaused) {
        await sleep(400);
        if (!isScrapingActive) break;
      }

      // Collect current visible cards
      const cards = document.querySelectorAll('div.Nv2PK');
      for (const card of cards) {
        if (scrapedLeads.length >= maxRecords || !isScrapingActive) break;

        const lead = extractCardData(card);
        if (lead && lead.businessName && !scrapedLeadNames.has(lead.businessName)) {
          // Check filters if specified during collection
          let matches = true;
          if (filters.hasWebsite && !lead.websiteUrl) matches = false;
          if (filters.hasPhone && !lead.phone) matches = false;

          // Add to set to prevent duplicates
          scrapedLeadNames.add(lead.businessName);

          if (matches) {
            scrapedLeads.push(lead);
            // Broadcast progress
            chrome.runtime.sendMessage({
              action: 'scrape_progress',
              data: {
                collected: scrapedLeads.length,
                target: maxRecords,
                latestLead: lead,
                status: 'running'
              }
            });
          }
        }
      }

      if (scrapedLeads.length >= maxRecords || !isScrapingActive) break;

      // Scroll down the container
      const currentHeight = scrollContainer.scrollHeight;
      scrollContainer.scrollTop = currentHeight;
      await sleep(1200);

      // Check if end of list reached
      const endNotice = document.querySelector('span.HlvSq, div.fontTitleSmall');
      if (endNotice && endNotice.innerText.includes("You've reached the end of the list")) {
        console.log('Reached the end of Google Maps results.');
        break;
      }

      if (scrollContainer.scrollHeight === previousHeight) {
        sameHeightCount++;
        if (sameHeightCount >= 4) {
          // Try scrolling by a delta
          scrollContainer.scrollBy(0, 1000);
          await sleep(1500);
          if (scrollContainer.scrollHeight === previousHeight) {
            console.log('No more results loading.');
            break;
          }
        }
      } else {
        sameHeightCount = 0;
      }
      previousHeight = scrollContainer.scrollHeight;
    }

    isScrapingActive = false;

    // Send completed results
    chrome.runtime.sendMessage({
      action: 'scrape_completed',
      leads: scrapedLeads
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start_scrape') {
      const maxRecords = request.limit || 50;
      const filters = request.filters || {};
      startScrapingLoop(maxRecords, filters);
      sendResponse({ status: 'started' });
    } else if (request.action === 'pause_scrape') {
      isScrapingPaused = true;
      sendResponse({ status: 'paused' });
    } else if (request.action === 'resume_scrape') {
      isScrapingPaused = false;
      sendResponse({ status: 'resumed' });
    } else if (request.action === 'stop_scrape') {
      isScrapingActive = false;
      sendResponse({ status: 'stopped', count: scrapedLeads.length });
    }
    return true;
  });
})();
