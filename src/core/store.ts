import { Lead, FilterOptions } from './types';

const STORAGE_KEY = 'leads_data';
const SETTINGS_KEY = 'settings_data';

export interface Settings {
  visibleColumns: (keyof Lead)[];
  defaultExportOptions: {
    filters: { field: string; mode: string }[];
    sortOrder: 'original' | 'website-first' | 'website-last';
    includeHeaders: boolean;
  };
}

const DEFAULT_VISIBLE_COLUMNS: (keyof Lead)[] = [
  'businessName',
  'category',
  'phone',
  'websiteUrl',
  'email',
  'streetAddress',
  'city',
  'region',
  'postalCode',
  'country',
  'sourceName',
  'collectedAt',
  'tags',
  'userNotes'
];

export class LeadStore {
  static async getAll(): Promise<Lead[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      return result[STORAGE_KEY]?.items || [];
    } catch (error) {
      console.error('Failed to get leads:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Lead | null> {
    const leads = await this.getAll();
    return leads.find(lead => lead.id === id) || null;
  }

  static async save(lead: Lead): Promise<void> {
    const leads = await this.getAll();
    const index = leads.findIndex(l => l.id === lead.id);
    if (index >= 0) {
      leads[index] = lead;
    } else {
      leads.push(lead);
    }
    await this.saveAll(leads);
  }

  static async saveMany(leads: Lead[]): Promise<void> {
    const existing = await this.getAll();
    const existingMap = new Map(existing.map(l => [l.id, l]));

    for (const lead of leads) {
      existingMap.set(lead.id, lead);
    }

    await this.saveAll(Array.from(existingMap.values()));
  }

  static async saveAll(leads: Lead[]): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          items: leads,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to save leads:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    const leads = await this.getAll();
    const filtered = leads.filter(l => l.id !== id);
    await this.saveAll(filtered);
  }

  static async deleteAll(): Promise<void> {
    try {
      await chrome.storage.local.remove(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to delete all leads:', error);
      throw error;
    }
  }

  static async search(query: string): Promise<Lead[]> {
    const leads = await this.getAll();
    if (!query.trim()) return leads;

    const lowerQuery = query.toLowerCase();
    return leads.filter(lead =>
      (lead.businessName?.toLowerCase().includes(lowerQuery) || false) ||
      (lead.category?.toLowerCase().includes(lowerQuery) || false) ||
      (lead.city?.toLowerCase().includes(lowerQuery) || false) ||
      (lead.region?.toLowerCase().includes(lowerQuery) || false) ||
      (lead.phone?.toLowerCase().includes(lowerQuery) || false) ||
      (lead.websiteUrl?.toLowerCase().includes(lowerQuery) || false) ||
      (lead.email?.toLowerCase().includes(lowerQuery) || false) ||
      (lead.tags?.some(t => t.toLowerCase().includes(lowerQuery)) || false) ||
      (lead.userNotes?.toLowerCase().includes(lowerQuery) || false)
    );
  }

  static async applyFilters(leads: Lead[], filters: FilterOptions): Promise<Lead[]> {
    return leads.filter(lead => {
      if (filters.website !== 'all') {
        const hasWebsite = !!lead.websiteUrl;
        if (filters.website === 'present' && !hasWebsite) return false;
        if (filters.website === 'absent' && hasWebsite) return false;
      }

      if (filters.phone !== 'all') {
        const hasPhone = !!lead.phone;
        if (filters.phone === 'present' && !hasPhone) return false;
        if (filters.phone === 'absent' && hasPhone) return false;
      }

      if (filters.email !== 'all') {
        const hasEmail = !!lead.email;
        if (filters.email === 'present' && !hasEmail) return false;
        if (filters.email === 'absent' && hasEmail) return false;
      }

      if (filters.social !== 'all') {
        const hasSocial = lead.socialProfiles && lead.socialProfiles.length > 0;
        if (filters.social === 'present' && !hasSocial) return false;
        if (filters.social === 'absent' && hasSocial) return false;
      }

      if (filters.source && lead.sourceName !== filters.source) return false;

      if (filters.category && lead.category !== filters.category) return false;

      if (filters.tags && filters.tags.length > 0) {
        const leadTags = lead.tags || [];
        const hasTag = filters.tags.some(t => leadTags.includes(t));
        if (!hasTag) return false;
      }

      if (filters.searchQuery) {
        const lowerQuery = filters.searchQuery.toLowerCase();
        const matches =
          (lead.businessName?.toLowerCase().includes(lowerQuery) || false) ||
          (lead.category?.toLowerCase().includes(lowerQuery) || false) ||
          (lead.city?.toLowerCase().includes(lowerQuery) || false) ||
          (lead.region?.toLowerCase().includes(lowerQuery) || false) ||
          (lead.phone?.toLowerCase().includes(lowerQuery) || false) ||
          (lead.websiteUrl?.toLowerCase().includes(lowerQuery) || false) ||
          (lead.email?.toLowerCase().includes(lowerQuery) || false) ||
          (lead.tags?.some(t => t.toLowerCase().includes(lowerQuery)) || false) ||
          (lead.userNotes?.toLowerCase().includes(lowerQuery) || false);
        if (!matches) return false;
      }

      return true;
    });
  }

  static async getSettings(): Promise<Settings> {
    try {
      const result = await chrome.storage.local.get(SETTINGS_KEY);
      return result[SETTINGS_KEY] || {
        visibleColumns: DEFAULT_VISIBLE_COLUMNS,
        defaultExportOptions: {
          filters: [],
          sortOrder: 'original',
          includeHeaders: true
        }
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return {
        visibleColumns: DEFAULT_VISIBLE_COLUMNS,
        defaultExportOptions: {
          filters: [],
          sortOrder: 'original',
          includeHeaders: true
        }
      };
    }
  }

  static async saveSettings(settings: Settings): Promise<void> {
    try {
      await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  static async updateVisibleColumns(columns: (keyof Lead)[]): Promise<void> {
    const settings = await this.getSettings();
    settings.visibleColumns = columns;
    await this.saveSettings(settings);
  }
}