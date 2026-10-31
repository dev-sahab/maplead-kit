# Architecture Document

## Overview
Google Maps Business Scraper is a Chrome extension with a modular architecture. It scrapes business data from Google Maps search results, organizes leads, filters by data completeness, and exports clean CSV files.

## Tech Stack
- **Manifest V3**: Chrome extension manifest version
- **TypeScript**: Type safety and better code organization
- **Vanilla JavaScript**: No heavy framework dependencies
- **Chrome Storage API**: Local data persistence
- **Chrome Downloads API**: CSV export functionality

## Architecture Layers

### 1. UI Layer (`/ui`)
- **Popup View**: Quick actions for opening main view and starting import
- **Main Table View**: Full leads management interface
- **Export Dialog**: Filter controls, preview, and download
- **Components**: Reusable UI components (table, filters, dialogs)

### 2. Data Layer (`/core`)
- **Lead Model**: TypeScript interfaces for normalized lead data
- **Lead Store**: CRUD operations for leads using Chrome storage
- **Validation**: Lead field validation and sanitization

### 3. Service Layer (`/services`)
- **Import Service**: CSV parsing, column mapping, validation
- **Export Service**: CSV generation with proper escaping and headers
- **Filter Service**: Apply and combine multiple filters
- **Sort Service**: Sorting logic including website-first/last options
- **Dedup Service**: Duplicate detection using deterministic strategy

### 4. Adapter Layer (`/adapters`)
- **Source Adapter Interface**: Defines contract for all adapters
- **Google Maps Adapter**: Scrapes business data from search results
- **CSV Import Adapter**: For manual file imports
- **Future Adapters**: Placeholder structure for Yelp, YellowPages, etc.

## Data Flow

```
User Action → UI Layer → Service Layer → Data Layer → Chrome Storage
                    ↑                      ↓
              Adapter Layer ←──────────────┘
```

## Key Interfaces

### Lead Model
```typescript
interface Lead {
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
  emailStatus: 'unknown' | 'found' | 'verified';
  socialStatus: 'unknown' | 'found' | 'verified';
  userNotes: string;
  tags: string[];
  metadata: Record<string, unknown>;
}
```

### Source Adapter Interface
```typescript
interface SourceAdapter {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  accessMethod: 'scraping' | 'manual' | 'api';
  supportedFields: string[];
  nonExportableFields: string[];
  collect(maxRecords: number, onProgress: ProgressCallback): Promise<Lead[]>;
  getProgress(): CollectionProgress;
}
```

## Module Responsibilities

### LeadStore
- `getAll(): Promise<Lead[]>`
- `getById(id: string): Promise<Lead | null>`
- `save(lead: Lead): Promise<void>`
- `saveMany(leads: Lead[]): Promise<void>`
- `delete(id: string): Promise<void>`
- `deleteAll(): Promise<void>`
- `search(query: string): Promise<Lead[]>`

### ImportService
- `parseCSV(file: File): Promise<ParsedRow[]>`
- `mapColumns(mapping: ColumnMapping, rows: ParsedRow[]): Lead[]`
- `validate(rows: Lead[]): ValidationResult`
- `commit(leads: Lead[]): Promise<void>`

### ExportService
- `generateCSV(leads: Lead[], options: ExportOptions): string`
- `preview(leads: Lead[], options: ExportOptions): ExportPreview`
- `download(csv: string, filename: string): Promise<void>`

### FilterService
- `applyFilters(leads: Lead[], filters: Filter[]): Lead[]`
- `combineFilters(filters: Filter[]): Filter`

### DedupService
- `detectDuplicates(leads: Lead[]): DuplicateGroup[]`
- `normalizeForComparison(lead: Lead): NormalizedLead`

## Persistence Strategy

### Chrome Storage Structure
```json
{
  "leads": {
    "items": [...],
    "lastUpdated": "ISO timestamp"
  },
  "settings": {
    "visibleColumns": [...],
    "defaultExportOptions": {...}
  }
}
```

## Extension Entry Points

1. **popup.html**: Quick actions (open main view, start import)
2. **main.html**: Full leads table interface
3. **background.ts**: Service worker for Chrome runtime events

## Future Extensibility

### Adding New Adapters
1. Create new file in `/adapters/`
2. Implement `SourceAdapter` interface
3. Register in adapter registry
4. Update UI to include source selection

### Adding New Features
- New filter types in FilterService
- New export formats in ExportService
- New validation rules in validation module