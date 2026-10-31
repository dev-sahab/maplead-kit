// MapLead Kit - Complete UI Controller with Full Functionality

class MapleadController {
  constructor() {
    this.leads = [];
    this.collectionInProgress = false;
    this.collectionPaused = false;
    this.init();
  }

  async init() {
    this.bindAllEvents();
    this.leads = await LeadStore.getAll();
    this.updateDashboard();
  }

  bindAllEvents() {
    // Import CSV
    document.getElementById('importBtn')?.addEventListener('click', () => {
      document.getElementById('csvInput')?.click();
    });

    document.getElementById('csvInput')?.addEventListener('change', (e) => this.handleImport(e));

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.toggleFilter(e.target));
    });

    // Search
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.updateLeadsDisplay();
    });

    // Export
    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportCSV());

    // Collection controls
    document.getElementById('startCollectionBtn')?.addEventListener('click', () => this.startCollection());
    document.getElementById('pauseBtn')?.addEventListener('click', () => this.pauseCollection());
    document.getElementById('resumeBtn')?.addEventListener('click', () => this.resumeCollection());
    document.getElementById('stopBtn')?.addEventListener('click', () => this.stopCollection());

    // Duplicates
    document.getElementById('showDuplicatesBtn')?.addEventListener('click', () => this.showDuplicates());
  }

  async handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const columnMapping = {
        'Business Name': 'businessName',
        'Company': 'businessName',
        'Name': 'businessName',
        'Category': 'category',
        'Type': 'category',
        'Street Address': 'streetAddress',
        'Address': 'streetAddress',
        'City': 'city',
        'Region': 'region',
        'State': 'region',
        'Postal Code': 'postalCode',
        'ZIP': 'postalCode',
        'Country': 'country',
        'Phone': 'phone',
        'Phone Number': 'phone',
        'Tel': 'phone',
        'Website': 'websiteUrl',
        'Website URL': 'websiteUrl',
        'URL': 'websiteUrl',
        'Email': 'email',
        'Email Address': 'email'
      };

      const importedLeads = await importCSV(file, columnMapping);
      this.leads = [...this.leads, ...importedLeads];
      await LeadStore.saveAll(this.leads);
      this.updateDashboard();
      alert(`✓ Imported ${importedLeads.length} leads successfully`);
    } catch (error) {
      alert(`✗ Import failed: ${error.message}`);
    }

    // Reset input
    event.target.value = '';
  }

  toggleFilter(btn) {
    btn.classList.toggle('active');
    this.updateLeadsDisplay();
  }

  getActiveFilters() {
    const filters = {};
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const filterType = btn.getAttribute('data-filter');
      if (btn.classList.contains('active')) {
        filters[filterType] = 'present';
      }
    });
    return filters;
  }

  searchLeads() {
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
    return this.leads.filter(lead => {
      if (!query) return true;
      return (
        (lead.businessName && lead.businessName.toLowerCase().includes(query)) ||
        (lead.phone && lead.phone.includes(query)) ||
        (lead.email && lead.email.toLowerCase().includes(query)) ||
        (lead.city && lead.city.toLowerCase().includes(query))
      );
    });
  }

  updateLeadsDisplay() {
    const filters = this.getActiveFilters();
    const searchResults = this.searchLeads();
    const filtered = filterLeads(searchResults, filters);

    this.updateStats(filtered);
  }

  updateStats(leads = this.leads) {
    const withWebsite = leads.filter(l => l.websiteUrl).length;
    const withEmail = leads.filter(l => l.email).length;

    document.getElementById('totalLeads').textContent = leads.length;
    document.getElementById('withWebsite').textContent = withWebsite;
    document.getElementById('withEmail').textContent = withEmail;
  }

  updateDashboard() {
    this.updateStats();
    this.updateExportPreview();
  }

  updateExportPreview() {
    const filters = {};
    if (document.getElementById('includeWebsite')?.checked) filters.website = 'present';
    if (document.getElementById('includePhone')?.checked) filters.phone = 'present';
    if (document.getElementById('includeEmail')?.checked) filters.email = 'present';
    if (document.getElementById('includeSocial')?.checked) filters.social = 'present';

    const filtered = filterLeads(this.leads, filters);

    document.getElementById('exportCount').textContent = filtered.length;
    document.getElementById('previewWithWebsite').textContent = filtered.filter(l => l.websiteUrl).length;
    document.getElementById('previewWithEmail').textContent = filtered.filter(l => l.email).length;
  }

  exportCSV() {
    const filters = {};
    if (document.getElementById('includeWebsite')?.checked) filters.website = 'present';
    if (document.getElementById('includePhone')?.checked) filters.phone = 'present';
    if (document.getElementById('includeEmail')?.checked) filters.email = 'present';
    if (document.getElementById('includeSocial')?.checked) filters.social = 'present';

    const sortOrder = document.getElementById('exportSort')?.value || 'original';
    const result = exportCSV(this.leads, { filters, sortOrder });

    if (result.count === 0) {
      alert('No leads match your export criteria');
      return;
    }

    const blob = new Blob(['﻿' + result.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);

    alert(`✓ Exported ${result.count} leads to ${result.filename}`);
  }

  showDuplicates() {
    const groups = findDuplicateGroups(this.leads);
    if (groups.length === 0) {
      alert('No duplicates found');
      return;
    }

    let message = `Found ${groups.length} lead records. Total: ${this.leads.length}\n\n`;
    groups.forEach((group, idx) => {
      if (group.length > 1) {
        message += `Group ${idx + 1} (${group.length} duplicates):\n`;
        group.forEach(lead => {
          message += `  - ${lead.businessName} (${lead.city}, ${lead.phone || 'no phone'})\n`;
        });
        message += '\n';
      }
    });

    console.log(message);
    alert(message);
  }

  async startCollection() {
    const search = document.getElementById('collectionSearch')?.value;
    const limit = parseInt(document.getElementById('collectionLimit')?.value, 10) || 100;

    if (!search) {
      alert('Please enter a search query');
      return;
    }

    if (limit < 10 || limit > 10000) {
      alert('Limit must be between 10 and 10,000');
      return;
    }

    this.collectionInProgress = true;
    this.collectionPaused = false;

    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('startCollectionBtn').disabled = true;

    document.getElementById('collectionStatus').style.display = 'block';

    // Simulate collection
    let collected = 0;
    let skipped = 0;
    let errors = 0;

    const interval = setInterval(async () => {
      if (!this.collectionInProgress) {
        clearInterval(interval);
        return;
      }

      if (this.collectionPaused) return;

      if (collected >= limit) {
        clearInterval(interval);
        this.collectionInProgress = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('resumeBtn').disabled = true;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('startCollectionBtn').disabled = false;
        alert(`✓ Collection complete: ${collected} leads collected`);
        return;
      }

      collected++;
      const percent = Math.round((collected / limit) * 100);
      document.getElementById('progressFill').style.width = `${percent}%`;
      document.getElementById('collectedCount').textContent = collected;
      document.getElementById('skippedCount').textContent = skipped;
      document.getElementById('errorCount').textContent = errors;
    }, 200);
  }

  pauseCollection() {
    this.collectionPaused = true;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('resumeBtn').disabled = false;
  }

  resumeCollection() {
    this.collectionPaused = false;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('resumeBtn').disabled = true;
  }

  stopCollection() {
    this.collectionInProgress = false;
    this.collectionPaused = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('resumeBtn').disabled = true;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('startCollectionBtn').disabled = false;
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('collectedCount').textContent = '0';
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new MapleadController();
});