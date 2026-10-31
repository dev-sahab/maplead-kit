import { Lead } from '../core/types';

function escapeCSVField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  str = str.replace(/[\r\n\t]+/g, ' ');
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

describe('Export CSV formatting', () => {
  it('should escape CSV fields with quotes and special characters', () => {
    const field = 'Test "Quotes" LLC';
    const result = escapeCSVField(field);
    expect(result).toBe('"Test ""Quotes"" LLC"');
  });

  it('should handle null and undefined values', () => {
    expect(escapeCSVField(null)).toBe('""');
    expect(escapeCSVField(undefined)).toBe('""');
  });

  it('should handle basic strings without special chars', () => {
    expect(escapeCSVField('Hello World')).toBe('"Hello World"');
  });

  it('should trim and normalize whitespace', () => {
    expect(escapeCSVField('  Hello  ')).toBe('"Hello"');
  });

  it('should sort leads by website presence (website-first)', () => {
    const leads: Lead[] = [
      {
        id: '1',
        businessName: 'No Website Co',
        category: null,
        streetAddress: null,
        city: null,
        region: null,
        postalCode: null,
        country: null,
        phone: null,
        websiteUrl: null,
        email: null,
        socialProfiles: [],
        sourceName: 'Google Maps',
        sourceRecordUrl: null,
        collectedAt: new Date().toISOString(),
        emailStatus: 'unknown',
        socialStatus: 'unknown',
        userNotes: '',
        tags: [],
        metadata: {}
      },
      {
        id: '2',
        businessName: 'Has Website LLC',
        category: null,
        streetAddress: null,
        city: null,
        region: null,
        postalCode: null,
        country: null,
        phone: null,
        websiteUrl: 'https://example.com',
        email: null,
        socialProfiles: [],
        sourceName: 'Google Maps',
        sourceRecordUrl: null,
        collectedAt: new Date().toISOString(),
        emailStatus: 'unknown',
        socialStatus: 'unknown',
        userNotes: '',
        tags: [],
        metadata: {}
      }
    ];

    // Sort website-first (descending - ones with website first)
    const sorted = [...leads].sort((a, b) => {
      const aHas = !!a.websiteUrl;
      const bHas = !!b.websiteUrl;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return 0;
    });

    expect(sorted[0].businessName).toBe('Has Website LLC');
    expect(sorted[1].businessName).toBe('No Website Co');
  });
});