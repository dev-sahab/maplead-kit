// Content Script for scraping Google Maps results panel

(() => {
  // Prevent double injection
  if (window.__maplead_scraper_injected) return;
  window.__maplead_scraper_injected = true;

  let isScrapingActive = false;
  let isScrapingPaused = false;
  let scrapedLeads = [];
  let scrapedLeadNames = new Set();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getScrollContainer() {
    const feed = document.querySelector('div[role="feed"]');
    if (feed) return feed;

    const ariaList = document.querySelector('div[aria-label*="Results for"], div[aria-label*="results"]');
    if (ariaList) return ariaList;

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

  function cleanWebsiteUrl(rawUrl) {
    if (!rawUrl) return '';
    try {
      const parsed = new URL(rawUrl);
      if (parsed.hostname.includes('google.') && (parsed.pathname.includes('/aclk') || parsed.pathname.includes('/url'))) {
        const adurl = parsed.searchParams.get('adurl') || parsed.searchParams.get('url') || parsed.searchParams.get('q');
        if (adurl) {
          return adurl.startsWith('http') ? adurl : 'https://' + adurl;
        }
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

  // Check if a text chunk is purely an opening hours status or closing notice
  function isOpeningHoursStatus(text) {
    if (!text) return false;
    const t = text.toLowerCase().trim();
    return (
      t.startsWith('closes') ||
      t.startsWith('opens') ||
      t.startsWith('closed') ||
      t.startsWith('open 24') ||
      t.startsWith('temporarily') ||
      t.includes('closes soon') ||
      t.includes('opens at') ||
      t === 'closed' ||
      t === 'open'
    );
  }

  function cleanAddress(raw) {
    if (!raw) return '';
    let text = raw.replace(/\r?\n/g, ' ').trim();

    const statusPatterns = [
      /\bclosed(\s*⋅\s*opens|\s*opens)?(\s*\d{1,2}(:\d{2})?\s*(am|pm)?)?/gi,
      /\bopens\s*\d{1,2}(:\d{2})?\s*(am|pm)?(\s*(mon|tue|wed|thu|fri|sat|sun))?/gi,
      /\bopen\s*24\s*hours/gi,
      /\bopen(\s*⋅\s*closes|\s*closes)?(\s*\d{1,2}(:\d{2})?\s*(am|pm)?)?/gi,
      /\bcloses\s*(at)?\s*\d{1,2}(:\d{2})?\s*(am|pm)?/gi,
      /\bcloses\s*soon/gi,
      /\btemporarily\s*closed/gi
    ];

    statusPatterns.forEach(pattern => {
      text = text.replace(pattern, '');
    });

    text = text.replace(/^[⋅·\s-]+|[⋅·\s-]+$/g, '').replace(/\s{2,}/g, ' ').trim();
    return text;
  }

  function parseLocationParts(fullAddress) {
    const res = {
      street: fullAddress || '',
      city: '',
      region: '',
      postalCode: ''
    };

    if (!fullAddress) return res;

    // Pattern: "... City, STATE 12345" or "... City, STATE"
    const zipMatch = fullAddress.match(/,\s*([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)?/);
    if (zipMatch) {
      res.city = (zipMatch[1] || '').trim();
      res.region = (zipMatch[2] || '').trim();
      res.postalCode = (zipMatch[3] || '').trim();
      const idx = fullAddress.indexOf(zipMatch[0]);
      if (idx > 0) {
        res.street = fullAddress.substring(0, idx).trim();
      }
      return res;
    }

    const parts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      res.street = parts[0];
      res.city = parts[1];
      const stateZip = parts[2].trim().split(/\s+/);
      if (stateZip.length >= 1) res.region = stateZip[0];
      if (stateZip.length >= 2) res.postalCode = stateZip[1];
    } else if (parts.length === 2) {
      res.street = parts[0];
      res.city = parts[1];
    }

    return res;
  }

  function extractCardData(card) {
    try {
      const nameEl = card.querySelector('div.qBF1Pd, div.fontHeadlineSmall, [aria-label]');
      const businessName = nameEl ? (nameEl.innerText || nameEl.getAttribute('aria-label') || '').trim() : '';
      if (!businessName) return null;

      const linkEl = card.querySelector('a.hfpxzc, a[href*="/maps/place/"]');
      const placeUrl = linkEl ? linkEl.href : '';

      const ratingEl = card.querySelector('span.MW4etd');
      const rating = ratingEl ? ratingEl.innerText.trim() : '';

      const reviewsEl = card.querySelector('span.UY7F9');
      const reviews = reviewsEl ? reviewsEl.innerText.replace(/[()]/g, '').trim() : '';

      const textContainers = card.querySelectorAll('div.W4Efsd');
      let category = '';
      let rawAddress = '';
      let phone = '';

      textContainers.forEach((tc) => {
        const text = tc.innerText.trim();
        if (!text) return;

        const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch && !phone) {
          phone = phoneMatch[0].trim();
        }

        const parts = text.split('·').map(p => p.trim()).filter(Boolean);

        parts.forEach(part => {
          // Skip if it's rating/reviews
          if (/^\d\.\d\s*\(\d+\)/.test(part) || /^\d\.\d$/.test(part) || /^\(\d+\)$/.test(part)) {
            return;
          }

          // Skip if it matches phone
          if (phoneMatch && part.includes(phoneMatch[0])) {
            return;
          }

          // Skip if it's opening hours status ("Closes 9 PM", "Open 24 hours", etc.)
          if (isOpeningHoursStatus(part)) {
            return;
          }

          // Capture category if not set and doesn't look like an address
          if (!category && !/\d{3,}/.test(part) && part.length < 40 && !/,/.test(part)) {
            category = part;
            return;
          }

          // Capture address if not set
          if (!rawAddress && (/\d+/.test(part) || /,/.test(part) || /street|st|ave|blvd|rd|dr|way|broadway|lane|floor/i.test(part))) {
            rawAddress = part;
          } else if (!rawAddress && part.length > 3) {
            rawAddress = part;
          }
        });
      });

      const cleanAddr = cleanAddress(rawAddress);
      const loc = parseLocationParts(cleanAddr);

      const websiteBtn = card.querySelector('a[data-value="Website"], a.lcr4fd, a[aria-label*="Website"]');
      let websiteUrl = '';
      if (websiteBtn && websiteBtn.href) {
        websiteUrl = cleanWebsiteUrl(websiteBtn.href);
      }

      return {
        id: `gmap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        businessName,
        category: category || 'Local Business',
        streetAddress: loc.street || cleanAddr,
        city: loc.city || '',
        region: loc.region || '',
        postalCode: loc.postalCode || '',
        country: 'US',
        phone,
        websiteUrl,
        email: '',
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
      while (isScrapingPaused) {
        await sleep(400);
        if (!isScrapingActive) break;
      }

      const cards = document.querySelectorAll('div.Nv2PK');
      for (const card of cards) {
        if (scrapedLeads.length >= maxRecords || !isScrapingActive) break;

        const lead = extractCardData(card);
        if (lead && lead.businessName && !scrapedLeadNames.has(lead.businessName)) {
          let matches = true;
          if (filters.hasWebsite && !lead.websiteUrl) matches = false;
          if (filters.hasPhone && !lead.phone) matches = false;

          scrapedLeadNames.add(lead.businessName);

          if (matches) {
            scrapedLeads.push(lead);
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

      const currentHeight = scrollContainer.scrollHeight;
      scrollContainer.scrollTop = currentHeight;
      await sleep(1200);

      const endNotice = document.querySelector('span.HlvSq, div.fontTitleSmall');
      if (endNotice && endNotice.innerText.includes("You've reached the end of the list")) {
        break;
      }

      if (scrollContainer.scrollHeight === previousHeight) {
        sameHeightCount++;
        if (sameHeightCount >= 4) {
          scrollContainer.scrollBy(0, 1000);
          await sleep(1500);
          if (scrollContainer.scrollHeight === previousHeight) {
            break;
          }
        }
      } else {
        sameHeightCount = 0;
      }
      previousHeight = scrollContainer.scrollHeight;
    }

    isScrapingActive = false;

    chrome.runtime.sendMessage({
      action: 'scrape_completed',
      leads: scrapedLeads
    });
  }

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
