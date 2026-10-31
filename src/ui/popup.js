// MapLead Kit - Popup Controller matching the official preview mockup (#147d65 palette)

const STORAGE_KEY = 'leads_data';

const SAMPLE_LEADS = [
  {
    id: 'sample-1',
    businessName: 'Sample Glass Co.',
    category: 'Glass Repair',
    streetAddress: 'Manhattan, NY',
    city: 'New York',
    region: 'NY',
    postalCode: '10018',
    country: 'US',
    phone: '212-555-0100',
    websiteUrl: 'example.com',
    email: 'info@example.com',
    socialProfiles: [{ platform: 'linkedin', url: 'https://linkedin.com' }],
    sourceName: 'Imported CSV',
    collectedAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    businessName: 'Northside Repair',
    category: 'Glass Repair',
    streetAddress: 'Queens, NY',
    city: 'New York',
    region: 'NY',
    postalCode: '11101',
    country: 'US',
    phone: '347-555-0112',
    websiteUrl: null,
    email: null,
    socialProfiles: [],
    sourceName: 'Imported CSV',
    collectedAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    businessName: 'Metro Window Works',
    category: 'Glass Repair',
    streetAddress: 'Brooklyn, NY',
    city: 'New York',
    region: 'NY',
    postalCode: '11201',
    country: 'US',
    phone: '718-555-0140',
    websiteUrl: 'metroworks.test',
    email: 'contact@metroworks.test',
    socialProfiles: [{ platform: 'facebook', url: 'https://facebook.com' }],
    sourceName: 'Imported CSV',
    collectedAt: new Date().toISOString()
  }
];

class PopupController {
  constructor() {
    this.leads = [];
    this.filters = { website: true, phone: true, email: false, social: false };
    this.sortOrder = 'website-first';
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadLeads();
  }

  async loadLeads() {
    try {
      const res = await chrome.storage.local.get(STORAGE_KEY);
      this.leads = res[STORAGE_KEY]?.items || [];
      if (this.leads.length === 0) {
        this.leads = SAMPLE_LEADS;
        await chrome.storage.local.set({ [STORAGE_KEY]: { items: this.leads } });
      }
    } catch (e) {
      this.leads = SAMPLE_LEADS;
    }
  }

  bindEvents() {
    // Open full lead manager
    document.getElementById('openManagerBtn')?.addEventListener('click', () => {
      const url = chrome.runtime.getURL('ui/main.html');
      chrome.tabs.create({ url });
    });

    // Step 1 -> Step 2
    document.getElementById('proceedStep1Btn')?.addEventListener('click', () => {
      this.switchView('viewStep2');
      this.renderCollectedLeads();
    });

    // Step 2 -> Step 3
    document.getElementById('proceedStep2Btn')?.addEventListener('click', () => {
      this.switchView('viewStep3');
    });
    document.getElementById('backStep2Btn')?.addEventListener('click', () => {
      this.switchView('viewStep1');
    });

    // Step 3 -> Step 4
    document.getElementById('proceedStep3Btn')?.addEventListener('click', () => {
      this.switchView('viewStep4');
      this.renderCsvPreview();
    });
    document.getElementById('backStep3Btn')?.addEventListener('click', () => {
      this.switchView('viewStep2');
    });

    // Step 4 -> Back / Download
    document.getElementById('backStep4Btn')?.addEventListener('click', () => {
      this.switchView('viewStep3');
    });
    document.getElementById('downloadCsvFinalBtn')?.addEventListener('click', () => {
      this.downloadCsv();
    });

    // Toggle switches in Step 3
    document.querySelectorAll('.toggle-switch').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const el = e.currentTarget;
        el.classList.toggle('active');
        const key = el.getAttribute('data-filter');
        if (key) {
          this.filters[key] = el.classList.contains('active');
        }
      });
    });

    // Sort select
    document.getElementById('sortOrderSelect')?.addEventListener('change', (e) => {
      this.sortOrder = e.target.value;
    });
  }

  switchView(viewId) {
    ['viewStep1', 'viewStep2', 'viewStep3', 'viewStep4'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === viewId ? 'block' : 'none';
    });
  }

  renderCollectedLeads() {
    const list = document.getElementById('collectedLeadsList');
    if (!list) return;
    list.innerHTML = '';

    this.leads.forEach(lead => {
      const row = document.createElement('div');
      row.className = 'lead-row';
      row.innerHTML = `
        <div>
          <b style="font-size:11px;">${lead.businessName}</b>
          <small style="color:var(--muted);">${lead.streetAddress || ''}</small>
        </div>
        <span style="color: ${lead.websiteUrl ? 'var(--green)' : 'var(--muted)'}; font-weight: 600;">
          ${lead.websiteUrl || '—'}
        </span>
      `;
      list.appendChild(row);
    });

    document.getElementById('step2CountText').textContent = `${this.leads.length} records collected`;
  }

  getFilteredLeads() {
    return this.leads.filter(lead => {
      if (this.filters.website && !lead.websiteUrl) return false;
      if (this.filters.phone && !lead.phone) return false;
      if (this.filters.email && !lead.email) return false;
      if (this.filters.social && (!lead.socialProfiles || lead.socialProfiles.length === 0)) return false;
      return true;
    });
  }

  renderCsvPreview() {
    const filtered = this.getFilteredLeads();
    if (this.sortOrder === 'website-first') {
      filtered.sort((a, b) => (b.websiteUrl ? 1 : 0) - (a.websiteUrl ? 1 : 0));
    } else if (this.sortOrder === 'website-last') {
      filtered.sort((a, b) => (a.websiteUrl ? 1 : 0) - (b.websiteUrl ? 1 : 0));
    }

    const box = document.getElementById('csvPreviewBox');
    document.getElementById('exportTitleSummary').textContent = `${filtered.length} matching records`;

    let html = `Company,Address,Phone,Website,Email<br>`;
    filtered.slice(0, 4).forEach(l => {
      html += `${l.businessName},${l.streetAddress || ''},${l.phone || ''},${l.websiteUrl || ''},${l.email || ''}<br>`;
    });
    box.innerHTML = html;
  }

  downloadCsv() {
    const filtered = this.getFilteredLeads();
    const columns = ['Business Name', 'Address', 'Phone', 'Website', 'Email'];
    const rows = filtered.map(l => [
      l.businessName || '',
      l.streetAddress || '',
      l.phone || '',
      l.websiteUrl || '',
      l.email || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [columns.join(','), ...rows].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maplead_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
