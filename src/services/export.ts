import { Lead, ExportOptions, ExportFilter } from '../core/types';

export interface ExportResult {
  success: boolean;
  csv: string;
  filename: string;
  rowCount: number;
  preview: string[];
}

export class ExportService {
  static async exportLeads(
    leads: Lead[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const {
      filters = [],
      sortOrder = 'original',
      includeHeaders = true
    } = options;

    // Apply filters
    const filteredLeads = this.applyFilters(leads, filters);

    // Apply sorting
    const sortedLeads = this.sortLeads(filteredLeads, sortOrder);

    // Generate CSV
    const csvContent = this.generateCSV(sortedLeads, includeHeaders);

    // Generate filename
    const filename = this.generateFilename();

    // Generate preview (first 5 rows)
    const preview = this.generatePreview(sortedLeads, Math.min(5, sortedLeads.length));

    return {
      success: true,
      csv: csvContent,
      filename,
      rowCount: sortedLeads.length,
      preview
    };
  }

  private static applyFilters(
    leads: Lead[],
    filters: ExportFilter[]
  ): Lead[] {
    if (filters.length === 0) return leads;

    return leads.filter(lead => {
      for (const filter of filters) {
        const value = this.getLeadValue(lead, filter.field);
        const hasValue = value !== null && value !== undefined && value !== '';

        switch (filter.mode) {
          case 'all':
            // Include all records - no filtering
            break;
          case 'present':
            if (!hasValue) return false;
            break;
          case 'absent':
            if (hasValue) return false;
            break;
        }
      }
      return true;
    });
  }

  private static getLeadValue(lead: Lead, field: string): unknown {
    switch (field) {
      case 'website':
        return lead.websiteUrl;
      case 'phone':
        return lead.phone;
      case 'email':
        return lead.email;
      case 'social':
        return lead.socialProfiles && lead.socialProfiles.length > 0;
      default:
        return null;
    }
  }

  private static sortLeads(
    leads: Lead[],
    sortOrder: 'original' | 'website-first' | 'website-last'
  ): Lead[] {
    if (sortOrder === 'original') {
      return leads;
    }

    const hasWebsite = (lead: Lead): boolean => !!lead.websiteUrl;

    if (sortOrder === 'website-first') {
      return [...leads].sort((a, b) => {
        const aHas = hasWebsite(a);
        const bHas = hasWebsite(b);
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });
    }

    if (sortOrder === 'website-last') {
      return [...leads].sort((a, b) => {
        const aHas = hasWebsite(a);
        const bHas = hasWebsite(b);
        if (!aHas && bHas) return -1;
        if (aHas && !bHas) return 1;
        return 0;
      });
    }

    return leads;
  }

  private static generateCSV(leads: Lead[], includeHeaders: boolean): string {
    if (leads.length === 0) return '';

    // Define column order and headers
    const columnOrder: (keyof Lead)[] = [
      'businessName',
      'category',
      'streetAddress',
      'city',
      'region',
      'postalCode',
      'country',
      'phone',
      'websiteUrl',
      'email',
      'socialProfiles',
      'sourceName',
      'sourceRecordUrl',
      'collectedAt',
      'emailStatus',
      'socialStatus',
      'userNotes',
      'tags'
    ];

    const headers = columnOrder.map(key => this.escapeHeader(key));

    const rows = leads.map(lead => {
      const values = columnOrder.map(key => {
        const value = lead[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (Array.isArray(value)) return value.join('; ');
        return String(value);
      });
      return values.join(',');
    });

    if (!includeHeaders) return rows.join('\n');

    return [headers, ...rows].join('\n');
  }

  private static escapeHeader(header: string): string {
    // Replace underscores with spaces and title case
    return header.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private static generateFilename(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `google_maps_leads_${year}-${month}-${day}_${hours}-${minutes}.csv`;
  }

  private static generatePreview(leads: Lead[], maxRows: number): string[] {
    if (leads.length === 0) return ['No leads to display'];

    const columnHeaders = [
      'Business Name', 'Category', 'Phone', 'Website', 'Email', 'Source'
    ];

    const rows = leads.slice(0, maxRows).map(lead => [
      lead.businessName || '',
      lead.category || '',
      lead.phone || '',
      lead.websiteUrl || '',
      lead.email || '',
      lead.sourceName || ''
    ]);

    return [columnHeaders, ...rows].map(row => row.join(' | '));
  }
}