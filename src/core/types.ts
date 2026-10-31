export interface SocialProfile {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'other';
  url: string;
}

export type EmailStatus = 'unknown' | 'found' | 'verified';
export type SocialStatus = 'unknown' | 'found' | 'verified';

export interface Lead {
  id: string;
  businessName: string | null;
  category: string | null;
  streetAddress: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  websiteUrl: string | null;
  email: string | null;
  socialProfiles: SocialProfile[];
  sourceName: string;
  sourceRecordUrl: string | null;
  collectedAt: string;
  emailStatus: EmailStatus;
  socialStatus: SocialStatus;
  userNotes: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ExportOptions {
  filters: ExportFilter[];
  sortOrder: 'original' | 'website-first' | 'website-last';
  includeHeaders: boolean;
}

export interface ExportFilter {
  field: 'website' | 'phone' | 'email' | 'social';
  mode: 'all' | 'present' | 'absent';
}

export interface FilterOptions {
  website: 'all' | 'present' | 'absent';
  phone: 'all' | 'present' | 'absent';
  email: 'all' | 'present' | 'absent';
  social: 'all' | 'present' | 'absent';
  source?: string;
  category?: string;
  tags?: string[];
  searchQuery?: string;
}

export interface CollectionProgress {
  collected: number;
  skipped: number;
  errors: number;
  isComplete: boolean;
  currentRecord?: Partial<Lead>;
}

export type ProgressCallback = (progress: CollectionProgress) => void;

export interface SourceAdapter {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  accessMethod: 'scraping' | 'manual' | 'api';
  supportedFields: (keyof Lead)[];
  nonExportableFields: (keyof Lead)[];
  collect(maxRecords: number, onProgress: ProgressCallback): Promise<Lead[]>;
  getProgress(): CollectionProgress;
  pause?(): void;
  resume?(): void;
  stop?(): void;
}

export interface ColumnConfig {
  key: keyof Lead;
  label: string;
  visible: boolean;
  order: number;
}