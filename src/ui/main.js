const STORAGE_KEY = 'leads_data';

class LeadManager {
  constructor() {
    this.leads = [];
    this.filters = {
      search: '',
      website: false,
      phone: false,
      email: false
    };

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadLeads();
  }

  async loadLeads() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const res = await chrome.storage.local.get(STORAGE_KEY);
        const data = res[STORAGE_KEY];
        if (Array.isArray(data)) {
          this.leads = data;
        } else if (data && Array.isArray(data.items)) {
          this.leads = data.items;
        } else {
          this.leads = [];
        }
      } else {
        const local = localStorage.getItem(STORAGE_KEY);
        this.leads = local ? JSON.parse(local) : [];
      }
    } catch (e) {
      console.error(e);
      this.leads = [];
    }

    this.render();
  }

  bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.filters.search = e.target.value.toLowerCase();
      this.render();
    });

    const bindPill = (id, key) => {
      const btn = document.getElementById(id);
      btn?.addEventListener('click', () => {
        this.filters[key] = !this.filters[key];
        btn.classList.toggle('active', this.filters[key]);
        this.render();
      });
    };

    bindPill('filterWebsite', 'website');
    bindPill('filterPhone', 'phone');
    bindPill('filterEmail', 'email');

    document.getElementById('exportBtn')?.addEventListener('click', () => {
      this.exportFiltered();
    });

    document.getElementById('importBtn')?.addEventListener('click', () => {
      document.getElementById('csvFileInput')?.click();
    });

    document.getElementById('csvFileInput')?.addEventListener('change', (e) => {
      this.handleImport(e);
    });

    document.getElementById('clearAllBtn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all leads?')) {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.remove(STORAGE_KEY);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        this.leads = [];
        this.render();
      }
    });
  }

  render() {
    const tbody = document.getElementById('leadsBody');
    const countBadge = document.getElementById('leadCountBadge');
    if (!tbody) return;

    const filtered = this.leads.filter(lead => {
      if (this.filters.website && !lead.websiteUrl) return false;
      if (this.filters.phone && !lead.phone) return false;
      if (this.filters.email && !lead.email) return false;

      if (this.filters.search) {
        const q = this.filters.search;
        const match =
          (lead.businessName && lead.businessName.toLowerCase().includes(q)) ||
          (lead.category && lead.category.toLowerCase().includes(q)) ||
          (lead.city && lead.city.toLowerCase().includes(q)) ||
          (lead.streetAddress && lead.streetAddress.toLowerCase().includes(q)) ||
          (lead.phone && lead.phone.includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} of ${this.leads.length} leads`;
    }

    tbody.innerHTML = '';

    if (filtered.length === 0 && this.leads.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <h3>No leads yet</h3>
            <p>Start collecting leads from Google Maps or import a CSV to see them here</p>
          </td>
        </tr>
      `;
      return;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <h3>No matches found</h3>
            <p>Try adjusting your search or filters</p>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(lead => {
      const tr = document.createElement('tr');
      const location = [lead.streetAddress, lead.city, lead.region, lead.postalCode].filter(Boolean).join(', ');

      tr.innerHTML = `
        <td class="cell-business" title="${lead.businessName || ''}">${lead.businessName || '—'}</td>
        <td class="cell-category">${lead.category || 'General'}</td>
        <td>${lead.phone || '—'}</td>
        <td>
          ${lead.websiteUrl
            ? `<a href="${lead.websiteUrl}" target="_blank" class="cell-link" title="${lead.websiteUrl}">${lead.websiteUrl.replace(/^https?:\/\//, '').split('/')[0]}</a>`
            : '—'}
        </td>
        <td>${lead.email || '—'}</td>
        <td class="cell-location" title="${location}">${location || '—'}</td>
        <td><span class="badge badge-source">${lead.sourceName || 'Google Maps'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  parseCSVLine(text) {
    const result = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    result.push(currentVal.trim().replace(/^"|"$/g, ''));
    return result;
  }

  exportFiltered() {
    const filtered = this.leads.filter(lead => {
      if (this.filters.website && !lead.websiteUrl) return false;
      if (this.filters.phone && !lead.phone) return false;
      if (this.filters.email && !lead.email) return false;
      return true;
    });

    if (filtered.length === 0) {
      alert('No leads to export.');
      return;
    }

    const headers = [
      'Business Name', 'Category', 'Street Address', 'City', 'Region',
      'Postal Code', 'Country', 'Phone', 'Website', 'Rating', 'Reviews', 'Google Maps URL'
    ];

    const clean = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).trim();
      str = str.replace(/[\r\n\t]+/g, ' ');
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filtered.map(l => [
      clean(l.businessName),
      clean(l.category),
      clean(l.streetAddress),
      clean(l.city),
      clean(l.region),
      clean(l.postalCode),
      clean(l.country || 'US'),
      clean(l.phone),
      clean(l.websiteUrl),
      clean(l.rating),
      clean(l.reviews),
      clean(l.sourceRecordUrl)
    ].join(','));

    const csvContent = '﻿' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maplead_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('CSV file is empty or missing data rows.');
          return;
        }

        const rawHeaderLine = lines[0].replace(/^﻿/, '');
        const headers = this.parseCSVLine(rawHeaderLine).map(h => h.toLowerCase());

        // Map header indices
        const getIdx = (keywords) => {
          for (const kw of keywords) {
            const idx = headers.findIndex(h => h.includes(kw));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const idxName = getIdx(['business name', 'company', 'name']);
        const idxCategory = getIdx(['category', 'type']);
        const idxStreet = getIdx(['street', 'address']);
        const idxCity = getIdx(['city', 'town']);
        const idxRegion = getIdx(['region', 'state', 'province']);
        const idxPostal = getIdx(['postal', 'zip']);
        const idxCountry = getIdx(['country']);
        const idxPhone = getIdx(['phone', 'telephone', 'mobile']);
        const idxWebsite = getIdx(['website', 'url', 'web']);
        const idxRating = getIdx(['rating']);
        const idxReviews = getIdx(['review']);
        const idxUrl = getIdx(['google maps', 'source url']);

        const newLeads = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = this.parseCSVLine(lines[i]);
          if (cols.length === 0 || !cols.some(Boolean)) continue;

          const val = (idx) => (idx !== -1 && cols[idx] !== undefined ? cols[idx] : null);

          newLeads.push({
            id: `import-${i}-${Date.now()}`,
            businessName: val(idxName) || cols[0] || 'Unknown Business',
            category: val(idxCategory) || cols[1] || 'General',
            streetAddress: val(idxStreet) || cols[2] || null,
            city: val(idxCity) || cols[3] || null,
            region: val(idxRegion) || cols[4] || null,
            postalCode: val(idxPostal) || cols[5] || null,
            country: val(idxCountry) || cols[6] || 'US',
            phone: val(idxPhone) || cols[7] || null,
            websiteUrl: val(idxWebsite) || cols[8] || null,
            rating: val(idxRating) || cols[9] || null,
            reviews: val(idxReviews) || cols[10] || null,
            sourceName: 'CSV Import',
            sourceRecordUrl: val(idxUrl) || cols[11] || null,
            collectedAt: new Date().toISOString()
          });
        }

        this.leads = [...this.leads, ...newLeads];
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ [STORAGE_KEY]: { items: this.leads } });
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.leads));
        }
        this.render();
        alert(`Successfully imported ${newLeads.length} leads!`);
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to parse CSV file. Ensure it is a valid MapLead Kit export.');
      }
    };
    reader.readAsText(file);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LeadManager();
});
