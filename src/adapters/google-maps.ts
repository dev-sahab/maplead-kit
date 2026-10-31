import { SourceAdapter, Lead, CollectionProgress, ProgressCallback } from '../core/types';

const SAMPLE_LEADS: Lead[] = [
  {
    id: 'sample-1',
    businessName: 'Joe\'s Pizza',
    category: 'Restaurant',
    streetAddress: '123 Main St',
    city: 'New York',
    region: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '(212) 555-0100',
    websiteUrl: 'https://joespizza.com',
    email: null,
    socialProfiles: [],
    sourceName: 'Google Maps',
    sourceRecordUrl: 'https://maps.google.com/?q=joe%27s+pizza+new+york',
    collectedAt: new Date().toISOString(),
    emailStatus: 'unknown',
    socialStatus: 'unknown',
    userNotes: '',
    tags: ['restaurant', 'food'],
    metadata: {}
  },
  {
    id: 'sample-2',
    businessName: 'Metro Tech Solutions',
    category: 'Services',
    streetAddress: '456 Broadway',
    city: 'New York',
    region: 'NY',
    postalCode: '10003',
    country: 'US',
    phone: null,
    websiteUrl: 'https://metrotech.com',
    email: 'contact@metrotech.com',
    socialProfiles: [
      { platform: 'linkedin', url: 'https://linkedin.com/company/metrotech' }
    ],
    sourceName: 'Google Maps',
    sourceRecordUrl: 'https://maps.google.com/?q=metro+tech+new+york',
    collectedAt: new Date().toISOString(),
    emailStatus: 'found',
    socialStatus: 'found',
    userNotes: 'High-value B2B client',
    tags: ['b2b', 'services'],
    metadata: {}
  },
  {
    id: 'sample-3',
    businessName: 'Green Leaf Spa',
    category: 'Health',
    streetAddress: '789 Park Ave',
    city: 'New York',
    region: 'NY',
    postalCode: '10010',
    country: 'US',
    phone: '(212) 555-0199',
    websiteUrl: null,
    email: 'info@greenleafspa.com',
    socialProfiles: [
      { platform: 'instagram', url: 'https://instagram.com/greenleafspa' }
    ],
    sourceName: 'Google Maps',
    sourceRecordUrl: 'https://maps.google.com/?q=green+leaf+spa+new+york',
    collectedAt: new Date().toISOString(),
    emailStatus: 'found',
    socialStatus: 'found',
    userNotes: '',
    tags: ['spa', 'wellness'],
    metadata: {}
  }
];

export class GoogleMapsAdapter implements SourceAdapter {
  id = 'google-maps';
  name = 'Google Maps';
  description = 'Scrape business data from Google Maps search results';
  isEnabled = true;
  accessMethod = 'scraping';
  supportedFields: (keyof Lead)[] = [
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
    'socialProfiles'
  ];
  nonExportableFields: (keyof Lead)[] = [];

  async collect(maxRecords: number, onProgress?: ProgressCallback): Promise<Lead[]> {
    // In MVP, return sample data for testing
    // Production implementation will scrape Google Maps search results
    const leads = SAMPLE_LEADS.filter(l => leads.length < maxRecords);

    if (onProgress) {
      onProgress({
        collected: leads.length,
        skipped: 0,
        errors: 0,
        isComplete: true
      });
    }

    return leads;
  }

  getProgress(): CollectionProgress {
    return {
      collected: 0,
      skipped: 0,
      errors: 0,
      isComplete: true
    };
  }

  pause?(): void {
    // No-op for static adapter
  }

  resume?(): void {
    // No-op for static adapter
  }

  stop?(): void {
    // No-op for static adapter
  }
}