import { GoogleMapsAdapter } from '../adapters/google-maps';
import { LeadStore } from '../core/store';
import { ExportService } from '../services/export';
import { Lead, ExportFilter } from '../core/types';

class PopupController {
  private adapter = new GoogleMapsAdapter();
  private isCollecting = false;
  private isPaused = false;
  private currentLeads: Lead[] = [];

  // Export filters state
  private exportWebsiteFilter: 'all' | 'present' | 'absent' = 'all';
  private exportPhoneFilter: 'all' | 'present' | 'absent' = 'all';
  private exportEmailFilter: 'all' | 'present' | 'absent' = 'all';
  private exportSocialFilter: 'all' | 'present' | 'absent' = 'all';
  private exportSortOrder: 'original' | 'website-first' | 'website-last' = 'website-first';

  constructor() {
    this.init();
  }

  private async init(): void {
    this.initializeListeners();
    this.currentLeads = await LeadStore.getAll();
    this.updateExportCounts();
  }

  private initializeListeners(): void {
    // Navigation
    document.getElementById('openManagerBtn')?.addEventListener('click', () => this.openMainView());
    document.getElementById('showExportViewBtn')?.addEventListener('click', () => this.switchView('export'));
    document.getElementById('backFromExportBtn')?.addEventListener('click', () => this.switchView('blocked'));

    // Actions
    document.getElementById('startDemoBtn')?.addEventListener('click', () => this.startDemoCollection());
    document.getElementById('searchPermittedBtn')?.addEventListener('click', () => {
      alert('Searching permitted directories (Yelp/YellowPages adapters) will be available in the next release.');
    });

    document.getElementById('importCsvBtn')?.addEventListener('click', () => {
      document.getElementById('csvFileInput')?.click();
    });

    document.getElementById('csvFileInput')?.addEventListener('change', (e) => this.handleCsvImport(e));

    // Collection controls
    document.getElementById('pauseResumeBtn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('reviewExportBtn')?.addEventListener('click', () => this.switchView('export'));

    // Export filters
    document.getElementById('filterWebsiteBtn')?.addEventListener('click', (e) => this.toggleFilterPill(e, 'website'));
    document.getElementById('filterPhoneBtn')?.addEventListener('click', (e) => this.toggleFilterPill(e, 'phone'));
    document.getElementById('filterEmailBtn')?.addEventListener('click', (e) => this.toggleFilterPill(e, 'email'));
    document.getElementById('filterSocialBtn')?.addEventListener('click', (e) => this.toggleFilterPill(e, 'social'));

    document.getElementById('exportSortSelect')?.addEventListener('change', (e) => {
      this.exportSortOrder = (e.target as HTMLSelectElement).value as any;
    });

    document.getElementById('downloadCsvBtn')?.addEventListener('click', () => this.downloadCsv());
  }

  private switchView(view: 'blocked' | 'collecting' | 'export'): void {
    const vBlocked = document.getElementById('viewBlocked');
    const vCollecting = document.getElementById('viewCollecting');
    const vExport = document.getElementById('viewExport');

    if (vBlocked) vBlocked.style.display = view === 'blocked' ? 'flex' : 'none';
    if (vCollecting) vCollecting.style.display = view === 'collecting' ? 'flex' : 'none';
    if (vExport) vExport.style.display = view === 'export' ? 'flex' : 'none';

    if (view === 'export') {
      this.updateExportCounts();
    }
  }

  private async openMainView(): Promise<void> {
    const url = chrome.runtime.getURL('ui/main.html');
    chrome.tabs.create({ url });
  }

  private async startDemoCollection(): Promise<void> {
    this.switchView('collecting');
    this.isCollecting = true;
    this.isPaused = false;

    const maxRecords = 100;
    let collected = 0;
    let skipped = 2; // Simulated duplicates

    const stream = document.getElementById('leadStream');
    if (stream) stream.innerHTML = '';

    // Simulate incremental collection matching Image 2
    const samplePool = await this.adapter.collect(maxRecords);
    this.currentLeads = [];

    const updateInterval = setInterval(async () => {
      if (this.isPaused || !this.isCollecting) return;

      if (collected >= 37 || collected >= maxRecords) {
        clearInterval(updateInterval);
        this.isCollecting = false;
        document.getElementById('statusLabel')!.textContent = 'Completed';
        return;
      }

      collected++;
      const sample = samplePool[(collected - 1) % samplePool.length];
      const lead: Lead = {
        ...sample,
        id: `demo-${collected}-${Date.now()}`,
        businessName: `${sample.businessName} #${collected}`,
      };

      this.currentLeads.push(lead);
      await LeadStore.save(lead);

      // Update progress UI
      const percent = Math.round((collected / maxRecords) * 100);
      document.getElementById('progressPercent')!.textContent = `${percent}%`;
      document.getElementById('progressCounts')!.textContent = `${collected} of ${maxRecords} records collected`;
      document.getElementById('progressBar')!.style.width = `${percent}%`;
      document.getElementById('statsText')!.textContent = `${collected} saved · ${skipped} duplicates skipped`;

      // Add to stream
      if (stream) {
        const item = document.createElement('div');
        item.className = 'lead-item';
        item.innerHTML = `
          <span class="lead-item-name">${lead.businessName}</span>
          <div class="lead-tags">
            ${lead.websiteUrl ? '<span class="lead-tag">Website</span>' : ''}
            ${lead.phone ? '<span class="lead-tag">Phone</span>' : ''}
          </div>
        `;
        stream.prepend(item);
      }
    }, 150);
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById('pauseResumeBtn');
    const label = document.getElementById('statusLabel');
    if (btn) btn.textContent = this.isPaused ? 'Resume' : 'Pause';
    if (label) label.textContent = this.isPaused ? 'Paused' : 'Running';
  }

  private toggleFilterPill(e: Event, type: 'website' | 'phone' | 'email' | 'social'): void {
    const btn = e.currentTarget as HTMLButtonElement;
    const isActive = btn.getAttribute('data-active') === 'true';
    const newState = !isActive;
    btn.setAttribute('data-active', String(newState));
    btn.classList.toggle('active', newState);

    const val = newState ? 'present' : 'all';
    if (type === 'website') this.exportWebsiteFilter = val;
    if (type === 'phone') this.exportPhoneFilter = val;
    if (type === 'email') this.exportEmailFilter = val;
    if (type === 'social') this.exportSocialFilter = val;

    this.updateExportCounts();
  }

  private async updateExportCounts(): Promise<void> {
    this.currentLeads = await LeadStore.getAll();

    const filters: ExportFilter[] = [
      { field: 'website', mode: this.exportWebsiteFilter },
      { field: 'phone', mode: this.exportPhoneFilter },
      { field: 'email', mode: this.exportEmailFilter },
      { field: 'social', mode: this.exportSocialFilter },
    ];

    const result = await ExportService.exportLeads(this.currentLeads, {
      filters,
      sortOrder: this.exportSortOrder,
      includeHeaders: true,
    });

    const totalBadge = document.getElementById('exportTotalBadge');
    const rowCount = document.getElementById('exportRowCount');

    if (totalBadge) totalBadge.textContent = `${result.rowCount} LEADS`;
    if (rowCount) rowCount.textContent = `${result.rowCount} rows`;
  }

  private async downloadCsv(): Promise<void> {
    const filters: ExportFilter[] = [
      { field: 'website', mode: this.exportWebsiteFilter },
      { field: 'phone', mode: this.exportPhoneFilter },
      { field: 'email', mode: this.exportEmailFilter },
      { field: 'social', mode: this.exportSocialFilter },
    ];

    const result = await ExportService.exportLeads(this.currentLeads, {
      filters,
      sortOrder: this.exportSortOrder,
      includeHeaders: true,
    });

    const blob = new Blob(['﻿' + result.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async handleCsvImport(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    alert(`Selected CSV file: ${file.name}. CSV import processing will load leads into the manager.`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
