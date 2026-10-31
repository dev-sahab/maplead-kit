import { GoogleMapsAdapter } from '../adapters/google-maps';
import { LeadStore } from '../core/store';
import { ExportService } from '../services/export';

class PopupController {
  private adapter = new GoogleMapsAdapter();
  private isCollecting = false;

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    const openManagerBtn = document.getElementById('openManagerBtn');
    const startScrapeBtn = document.getElementById('startScrapeBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const stopBtn = document.getElementById('stopBtn');

    openManagerBtn?.addEventListener('click', () => this.openMainView());
    startScrapeBtn?.addEventListener('click', () => this.startScraping());
    pauseBtn?.addEventListener('click', () => this.pause());
    resumeBtn?.addEventListener('click', () => this.resume());
    stopBtn?.addEventListener('click', () => this.stop());
  }

  private async openMainView(): Promise<void> {
    const url = chrome.runtime.getURL('ui/main.html');
    chrome.tabs.create({ url });
  }

  private async startScraping(): Promise<void> {
    const searchQuery = (document.getElementById('searchQuery') as HTMLInputElement)?.value;
    const recordLimitInput = (document.getElementById('recordLimit') as HTMLInputElement)?.value;
    const recordLimit = parseInt(recordLimitInput, 10) || 100;

    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    if (recordLimit < 10 || recordLimit > 10000) {
      alert('Record limit must be between 10 and 10000');
      return;
    }

    this.isCollecting = true;
    this.updateUI(true);

    try {
      const leads = await this.adapter.collect(recordLimit, (progress) => {
        this.updateProgress(progress);
      });

      await LeadStore.saveMany(leads);

      // Show completion
      const status = document.getElementById('status');
      if (status) {
        const message = document.createElement('div');
        message.textContent = `✓ Collected ${leads.length} leads`;
        message.style.color = '#34a853';
        message.style.marginTop = '8px';
        status.appendChild(message);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      alert('Failed to scrape data. Check console for details.');
    } finally {
      this.isCollecting = false;
      this.updateUI(false);
    }
  }

  private updateProgress(progress: { collected: number; skipped: number; errors: number }): void {
    const collectedCount = document.getElementById('collectedCount');
    const skippedCount = document.getElementById('skippedCount');
    const errorsCount = document.getElementById('errorsCount');
    const progressFill = document.getElementById('progressFill');

    if (collectedCount) collectedCount.textContent = String(progress.collected);
    if (skippedCount) skippedCount.textContent = String(progress.skipped);
    if (errorsCount) errorsCount.textContent = String(progress.errors);

    if (progressFill) {
      const percentage = Math.min((progress.collected / 100) * 100, 100);
      progressFill.style.width = `${percentage}%`;
    }
  }

  private updateUI(isCollecting: boolean): void {
    const status = document.getElementById('status');
    const startBtn = document.getElementById('startScrapeBtn') as HTMLButtonElement;
    const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
    const resumeBtn = document.getElementById('resumeBtn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;

    if (status) status.style.display = isCollecting ? 'flex' : 'none';
    if (startBtn) startBtn.disabled = isCollecting;
    if (pauseBtn) pauseBtn.disabled = !isCollecting;
    if (resumeBtn) resumeBtn.disabled = !isCollecting;
    if (stopBtn) stopBtn.disabled = !isCollecting;
  }

  private pause(): void {
    if (this.adapter.pause) this.adapter.pause();
  }

  private resume(): void {
    if (this.adapter.resume) this.adapter.resume();
  }

  private stop(): void {
    if (this.adapter.stop) this.adapter.stop();
    this.isCollecting = false;
    this.updateUI(false);
  }
}

// Initialize the controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
