// MapLead Kit - Popup Controller for Google Maps Scraping

class PopupScraperController {
  constructor() {
    this.collectedLeads = [];
    this.isScraping = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.listenToContentScript();
  }

  bindEvents() {
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    runBtn?.addEventListener('click', () => this.startScraping());
    stopBtn?.addEventListener('click', () => this.stopScraping());
    exportCsvBtn?.addEventListener('click', () => this.exportCSV());
  }

  async startScraping() {
    const limitInput = document.getElementById('leadLimit');
    const limit = parseInt(limitInput?.value, 10) || 20;

    const filterWebsite = document.getElementById('filterWebsite')?.checked || false;
    const filterPhone = document.getElementById('filterPhone')?.checked || false;

    // Check if active tab is Google Maps
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || (!tab.url.includes('google.com/maps') && !tab.url.includes('maps.google.com'))) {
      alert('Please open Google Maps search results first (Step 1), then click Run.');
      return;
    }

    this.isScraping = true;
    this.collectedLeads = [];

    // Update UI state
    document.getElementById('runBtn').style.display = 'none';
    document.getElementById('progressBox').style.display = 'flex';
    document.getElementById('successBox').style.display = 'none';
    document.getElementById('progressCount').textContent = `0 / ${limit}`;
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('latestLeadPreview').textContent = 'Connecting to Google Maps page...';

    // Inject and start content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/scraper/content-script.js']
      });

      // Send start message
      chrome.tabs.sendMessage(tab.id, {
        action: 'start_scrape',
        limit,
        filters: { hasWebsite: filterWebsite, hasPhone: filterPhone }
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
    this.resetUI();
  }

  resetUI() {
    this.isScraping = false;
    document.getElementById('runBtn').style.display = 'flex';
    document.getElementById('progressBox').style.display = 'none';
  }

  listenToContentScript() {
    chrome.runtime.onMessage.addListener((message) => {
      if (!this.isScraping) return;

      if (message.action === 'scrape_progress') {
        const { collected, target, latestLead } = message.data;
        const percent = Math.min(Math.round((collected / target) * 100), 100);

        document.getElementById('progressCount').textContent = `${collected} / ${target}`;
        document.getElementById('progressBar').style.width = `${percent}%`;

        if (latestLead) {
          document.getElementById('latestLeadPreview').textContent = `Latest: ${latestLead.businessName} (${latestLead.city || 'NY'})`;
        }
      } else if (message.action === 'scrape_completed') {
        this.collectedLeads = message.leads || [];
        this.isScraping = false;

        document.getElementById('progressBox').style.display = 'none';
        document.getElementById('successBox').style.display = 'flex';
        document.getElementById('successSummary').textContent = `${this.collectedLeads.length} leads collected successfully.`;
      } else if (message.action === 'scrape_error') {
        alert(message.message || 'Scraping error occurred.');
        this.resetUI();
      }
    });
  }

  exportCSV() {
    if (this.collectedLeads.length === 0) {
      alert('No leads to export.');
      return;
    }

    const sortOrder = document.getElementById('exportSort')?.value || 'website-first';
    let leads = [...this.collectedLeads];

    if (sortOrder === 'website-first') {
      leads.sort((a, b) => (b.websiteUrl ? 1 : 0) - (a.websiteUrl ? 1 : 0));
    } else if (sortOrder === 'website-last') {
      leads.sort((a, b) => (a.websiteUrl ? 1 : 0) - (b.websiteUrl ? 1 : 0));
    }

    const columns = [
      'Business Name', 'Category', 'Street Address', 'City', 'Region',
      'Postal Code', 'Country', 'Phone', 'Website URL', 'Email', 'Rating', 'Reviews', 'Source'
    ];

    const rows = leads.map(l => [
      l.businessName || '',
      l.category || '',
      l.streetAddress || '',
      l.city || '',
      l.region || '',
      l.postalCode || '',
      l.country || 'US',
      l.phone || '',
      l.websiteUrl || '',
      l.email || '',
      l.rating || '',
      l.reviews || '',
      l.sourceName || 'Google Maps'
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

    const csvContent = [columns.join(','), ...rows].join('\r\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maplead_google_maps_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupScraperController();
});
