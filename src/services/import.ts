import { Lead, FilterOptions } from '../core/types';

export interface ParsedRow {
  raw: string[];
  mapping: Record<string, string | null>;
}

export interface ImportResult {
  success: boolean;
  leads: Lead[];
  errors: ImportError[];
  warnings: string[];
}

export interface ImportError {
  row: number;
  message: string;
  field?: string;
}

export class ImportService {
  static async parseCSV(file: File): Promise<{ rows: string[][], headers: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(/,/);
        const dataRows = lines.slice(1).filter(line => line.trim().length > 0);

        resolve({ rows: dataRows, headers });
      };

      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  }

  static mapColumns(
    rows: string[][],
    headers: string[],
    columnMapping: Record<string, string>
  ): ParsedRow[] {
    return rows.map((row, rowIndex) => {
      const mapping: Record<string, string | null> = {};
      headers.forEach((header, colIndex) => {
        const value = colIndex < row.length ? row[colIndex] : '';
        const mappedField = columnMapping[header];
        mapping[mappedField || header] = value;
      });
      return { raw: row, mapping };
    });
  }

  static async importFromCSV(
    file: File,
    columnMapping: Record<string, string>,
    maxRecords?: number
  ): Promise<ImportResult> {
    const { rows, headers } = await this.parseCSV(file);
    const parsedRows = this.mapColumns(rows, headers, columnMapping);

    const leads: Lead[] = [];
    const errors: ImportError[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < parsedRows.length; i++) {
      if (maxRecords && leads.length >= maxRecords) {
        warnings.push(`Stopped after ${maxRecords} records`);
        break;
      }

      const row = parsedRows[i];
      try {
        const lead = this.mapRowToLead(row, i);
        leads.push(lead);
      } catch (error: any) {
        errors.push({
          row: i + 1,
          message: error.message || 'Failed to parse row',
        });
        warnings.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      leads,
      errors,
      warnings,
    };
  }

  private static mapRowToLead(row: ParsedRow, rowIndex: number): Lead {
    const createId = (): string => `imported-${rowIndex}-${Date.now()}`;

    const getField = (fieldName: string): string | null => {
      const value = row.mapping[fieldName];
      return value !== undefined && value !== null ? value.trim() : null;
    };

    const normalizeTags = (tagsField?: string): string[] => {
      if (!tagsField) return [];
      return tagsField
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
    };

    return {
      id: createId(),
      businessName: getField('businessName') || getField('company') || getField('name'),
      category: getField('category') || getField('type') || null,
      streetAddress: getField('streetAddress') || getField('address') || getField('street') || null,
      city: getField('city') || getField('town') || getField('location') || null,
      region: getField('region') || getField('state') || getField('province') || null,
      postalCode: getField('postalCode') || getField('zip') || getField('postal') || null,
      country: getField('country') || getField('nation') || null,
      phone: getField('phone') || getField('telephone') || getField('mobile') || null,
      websiteUrl: getField('website') || getField('url') || getField('web') || null,
      email: getField('email') || getField('eMail') || getField('e_mail') || null,
      socialProfiles: [], // Will be populated if social fields are mapped
      sourceName: getField('source') || 'Imported CSV',
      sourceRecordUrl: null,
      collectedAt: new Date().toISOString(),
      emailStatus: 'found',
      socialStatus: 'unknown',
      userNotes: '',
      tags: normalizeTags(getField('tags') || getField('categories')),
      metadata: {}
    };
  }
}