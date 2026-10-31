// MapLead Kit - Popup Controller
// Local business lead scraper with clean CSV export

class PopupScraperController {
  constructor() {
    this.collectedLeads = [];
    this.isScraping = false;
    this.searchQuery = 'search';
    this.rawQueryDisplay = 'Google Maps Search';
    this.init();
  }

  async init() {
    this.bindEvents();
    this.listenToContentScript();
    await this.detectActiveTab();
  }

  async detectActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const targetQueryText = document.getElementById('targetQueryText');
      const targetLabel = document.getElementById('targetLabel');
      const statusDot = document.getElementById('statusDot');

      if (!tab || !tab.url || (!tab.url.includes('google.com/maps') && !tab.url.includes('maps.google.com'))) {
        if (targetQueryText) targetQueryText.textContent = 'Please open Google Maps tab';
        if (targetLabel) targetLabel.textContent = 'Not on Google Maps';
        if (statusDot) {
          statusDot.className = 'indicator-dot warning';
        }
        return;
      }

      const { safeQuery, readableQuery } = this.extractSearchQuery(tab.url);
      this.searchQuery = safeQuery;
      this.rawQueryDisplay = readableQuery;

      if (targetQueryText) targetQueryText.textContent = `"${readableQuery}"`;
      if (targetLabel) targetLabel.textContent = 'Ready on Google Maps';
      if (statusDot) {
        statusDot.className = 'indicator-dot ready';
      }
    } catch (err) {
      console.warn('Tab detection error:', err);
    }
  }

  extractSearchQuery(tabUrl) {
    if (!tabUrl) return { safeQuery: 'search', readableQuery: 'Google Maps' };
    try {
      const parsed = new URL(tabUrl);

      // Check ?q= parameter
      const q = parsed.searchParams.get('q');
      if (q) {
        const decoded = decodeURIComponent(q).trim();
        const safe = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        return { safeQuery: safe || 'search', readableQuery: decoded };
      }

      // Check /maps/search/Query/... in pathname
      const pathMatch = parsed.pathname.match(/\/maps\/search\/([^/@]+)/);
      if (pathMatch && pathMatch[1]) {
        const decoded = decodeURIComponent(pathMatch[1]).replace(/\+/g, ' ').trim();
        const safe = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        return { safeQuery: safe || 'search', readableQuery: decoded };
      }
    } catch {}
    return { safeQuery: 'search', readableQuery: 'Google Maps Search' };
  }

  bindEvents() {
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const openManagerBtn = document.getElementById('openManagerBtn');

    runBtn?.addEventListener('click', () => this.startScraping());
    stopBtn?.addEventListener('click', () => this.stopScraping());
    exportCsvBtn?.addEventListener('click', () => this.exportCSV());

    openManagerBtn?.addEventListener('click', () => {
      const url = chrome.runtime.getURL('src/ui/main.html');
      chrome.tabs.create({ url });
    });
  }

  async startScraping() {
    const limitInput = document.getElementById('leadLimit');
    const limit = parseInt(limitInput?.value, 10) || 50;

    const filterWebsite = document.getElementById('filterWebsite')?.checked || false;
    const filterPhone = document.getElementById('filterPhone')?.checked || false;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || (!tab.url.includes('google.com/maps') && !tab.url.includes('maps.google.com'))) {
      alert('Please open Google Maps search results first, then click Start.');
      return;
    }

    const { safeQuery, readableQuery } = this.extractSearchQuery(tab.url);
    this.searchQuery = safeQuery;
    this.rawQueryDisplay = readableQuery;

    this.isScraping = true;
    this.collectedLeads = [];

    // UI Updates
    document.getElementById('configSection').style.display = 'none';
    document.getElementById('runBtn').style.display = 'none';
    document.getElementById('progressBox').style.display = 'flex';
    document.getElementById('resultsBox').style.display = 'none';

    document.getElementById('progressCount').textContent = `0 / ${limit}`;
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressStatusText').textContent = 'Connecting to Google Maps page...';
    document.getElementById('latestLeadPreview').textContent = '—';

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/scraper/content-script.js']
      });

      chrome.tabs.sendMessage(tab.id, {
        action: 'start_scrape',
        limit,
        filters: { hasWebsite: filterWebsite, hasPhone: filterPhone },
        searchQuery: safeQuery
      });
    } catch (err) {
      console.error('Failed to inject scraper:', err);
      alert('Failed to start scraping on this page. Try refreshing Google Maps.');
      this.resetUI();
    }
  }

  stopScraping() {
    this.isScraping = false;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'stop_scrape' });
      }
    });
    this.finishCollection();
  }

  finishCollection() {
    this.isScraping = false;
    document.getElementById('progressBox').style.display = 'none';
    document.getElementById('configSection').style.display = 'flex';
    document.getElementById('runBtn').style.display = 'flex';

    if (this.collectedLeads.length > 0) {
      document.getElementById('resultsBox').style.display = 'flex';
      document.getElementById('collectedTotal').textContent = `${this.collectedLeads.length} leads collected`;
    }
  }

  resetUI() {
    this.isScraping = false;
    document.getElementById('configSection').style.display = 'flex';
    document.getElementById('runBtn').style.display = 'flex';
    document.getElementById('progressBox').style.display = 'none';
  }

  listenToContentScript() {
    chrome.runtime.onMessage.addListener(async (message) => {
      if (!this.isScraping && message.action !== 'scrape_completed') return;

      if (message.action === 'scrape_progress') {
        const { collected, target, latestLead } = message.data;
        const percent = Math.min(Math.round((collected / target) * 100), 100);

        document.getElementById('progressCount').textContent = `${collected} / ${target}`;
        document.getElementById('progressBar').style.width = `${percent}%`;

        if (latestLead) {
          const loc = [latestLead.city, latestLead.region].filter(Boolean).join(', ');
          document.getElementById('progressStatusText').textContent = 'Collecting leads...';
          document.getElementById('latestLeadPreview').textContent = `${latestLead.businessName}${loc ? ` (${loc})` : ''}`;
        }
      } else if (message.action === 'scrape_completed') {
        this.collectedLeads = message.leads || [];
        try {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ leads_data: { items: this.collectedLeads } });
          } else {
            localStorage.setItem('leads_data', JSON.stringify(this.collectedLeads));
          }
        } catch (e) {
          console.warn('Failed to save leads to storage:', e);
        }
        this.finishCollection();
      } else if (message.action === 'scrape_error') {
        alert(message.message || 'Scraping error occurred.');
        this.resetUI();
      }
    });
  }

  cleanCsvField(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    str = str.replace(/[\r\n\t]+/g, ' ');
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }

  exportCSV() {
    if (this.collectedLeads.length === 0) {
      alert('No leads collected to export.');
      return;
    }

    const sortOrder = document.getElementById('exportSort')?.value || 'website-first';
    let leads = [...this.collectedLeads];

    if (sortOrder === 'website-first') {
      leads.sort((a, b) => (b.websiteUrl ? 1 : 0) - (a.websiteUrl ? 1 : 0));
    } else if (sortOrder === 'website-last') {
      leads.sort((a, b) => (a.websiteUrl ? 1 : 0) - (b.websiteUrl ? 1 : 0));
    }

    const headers = [
      'Business Name', 'Category', 'Street Address', 'City', 'Region',
      'Postal Code', 'Country', 'Phone', 'Website', 'Rating', 'Reviews', 'Google Maps URL'
    ];

    const rows = leads.map(l => [
      this.cleanCsvField(l.businessName),
      this.cleanCsvField(l.category),
      this.cleanCsvField(l.streetAddress),
      this.cleanCsvField(l.city),
      this.cleanCsvField(l.region),
      this.cleanCsvField(l.postalCode),
      this.cleanCsvField(l.country || 'US'),
      this.cleanCsvField(l.phone),
      this.cleanCsvField(l.websiteUrl),
      this.cleanCsvField(l.rating),
      this.cleanCsvField(l.reviews),
      this.cleanCsvField(l.sourceRecordUrl)
    ].join(','));

    // UTF-8 BOM + CSV rows
    const csvContent = '﻿' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    // Filename: maplead_{searchquery}_{date}.csv
    const date = new Date().toISOString().slice(0, 10);
    const safeQuery = this.searchQuery || 'search';
    a.download = `maplead_${safeQuery}_${date}.csv`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupScraperController();
});
