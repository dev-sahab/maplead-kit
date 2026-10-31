const STORAGE_KEY = 'leads_data';

class LeadManager {
  constructor() {
    this.leads = [];
    this.filters = {
      search: '',
      website: false,
      phone: false,
      email: false,
      social: false
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
        this.leads = res[STORAGE_KEY]?.items || [];
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

    bindPill('filterWeb', 'website');
    bindPill('filterPhone', 'phone');
    bindPill('filterEmail', 'email');
    bindPill('filterSocial', 'social');

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
    const countLabel = document.getElementById('leadCountLabel');
    if (!tbody) return;

    const filtered = this.leads.filter(lead => {
      if (this.filters.website && !lead.websiteUrl) return false;
      if (this.filters.phone && !lead.phone) return false;
      if (this.filters.email && !lead.email) return false;
      if (this.filters.social && (!lead.socialProfiles || lead.socialProfiles.length === 0)) return false;

      if (this.filters.search) {
        const q = this.filters.search;
        const match =
          (lead.businessName && lead.businessName.toLowerCase().includes(q)) ||
          (lead.category && lead.category.toLowerCase().includes(q)) ||
          (lead.city && lead.city.toLowerCase().includes(q)) ||
          (lead.phone && lead.phone.includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    countLabel.textContent = `Showing ${filtered.length} of ${this.leads.length} leads`;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No leads found matching current criteria.</td></tr>`;
      return;
    }

    filtered.forEach(lead => {
      const tr = document.createElement('tr');
      const location = [lead.city, lead.region, lead.country].filter(Boolean).join(', ');
      tr.innerHTML = `
        <td style="font-weight: 500;">${lead.businessName || '—'}</td>
        <td><span class="tag-badge">${lead.category || 'General'}</span></td>
        <td>${lead.phone || '—'}</td>
        <td>${lead.websiteUrl ? `<a href="${lead.websiteUrl}" target="_blank" style="color: #2563eb; text-decoration: none;">Visit ↗</a>` : '—'}</td>
        <td>${lead.email || '—'}</td>
        <td>${location || '—'}</td>
        <td>${lead.sourceName || '—'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  exportFiltered() {
    const filtered = this.leads.filter(lead => {
      if (this.filters.website && !lead.websiteUrl) return false;
      if (this.filters.phone && !lead.phone) return false;
      if (this.filters.email && !lead.email) return false;
      if (this.filters.social && (!lead.socialProfiles || lead.socialProfiles.length === 0)) return false;
      return true;
    });

    const columns = ['Business Name', 'Category', 'Phone', 'Website', 'Email', 'City', 'Region', 'Source'];
    const rows = filtered.map(l => [
      l.businessName || '',
      l.category || '',
      l.phone || '',
      l.websiteUrl || '',
      l.email || '',
      l.city || '',
      l.region || '',
      l.sourceName || ''
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

    const csv = [columns.join(','), ...rows].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
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
      const text = evt.target?.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length <= 1) return;

      const newLeads = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        newLeads.push({
          id: `import-${i}-${Date.now()}`,
          businessName: parts[0] || 'Unknown Business',
          category: parts[1] || 'General',
          phone: parts[2] || null,
          websiteUrl: parts[3] || null,
          email: parts[4] || null,
          city: parts[5] || null,
          region: parts[6] || null,
          sourceName: parts[7] || 'CSV Import',
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
    };
    reader.readAsText(file);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LeadManager();
});
