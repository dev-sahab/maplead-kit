# Phases and Tasks

## Project Phases

### Phase 1: Foundation (MVP Core)
**Goal**: Establish the extension structure with basic import/export and lead management

- [x] Create project structure and manifest
- [x] Implement lead data model and types
- [x] Set up Chrome storage persistence layer
- [x] Build basic CSV import with column mapping
- [x] Create leads table UI with configurable columns
- [x] Implement basic filters (data presence)
- [x] Build CSV export with preview
- [x] Add duplicate detection logic (deterministic: source ID → website → phone → name+address)

### Phase 2: Collection Features
**Goal**: Add source adapter interface and collection controls

- [ ] Define source adapter interface
- [ ] Implement collection controls (Start, Pause, Resume, Stop)
- [ ] Add progress tracking UI
- [ ] Create demo/sample adapter for testing
- [ ] Add CSV import adapter

### Phase 3: Advanced Features
**Goal**: Enhance filtering, sorting, and export options

- [ ] Implement filter combination UI
- [ ] Add website-first/last sorting
- [ ] Build advanced export filters
- [ ] Add source and category filters
- [ ] Implement tag management

### Phase 4: Polish
**Goal**: Refine UX and add documentation

- [x] Add empty/loading/error states
- [x] Improve accessibility with semantic HTML
- [ ] Add keyboard navigation (future)
- [ ] Create user documentation
- [x] Test extension in Chrome

---

## Current Implementation Status (2026-11-01)

### Completed Features

**Google Maps Scraping:**
- Scroll-based lead collection with auto-scroll through results
- Content script injection via `chrome.scripting`
- Real-time progress tracking (count, percentage, latest lead preview)
- Pause/Stop/Resume controls
- Filter by website presence or phone presence
- Handles up to 10,000 lead collection limit
- Robust timeout handling (1600ms scroll delays, 6-retry detection threshold)
- Fallback with smooth scrolling and "More results" button detection

**Data Quality Improvements:**
- Clean address parsing extracting street, city, region, postal code
- Opening hours removal (e.g., "Closes 9 PM", "Open 24 hours")
- Rating deduplication in category field
- Phone verification
- Google ad redirect URL decoding (`/aclk?` → real domain)

**CSV Export:**
- 12-column format: Business Name, Category, Street Address, City, Region, Postal Code, Country, Phone, Website, Rating, Reviews, Google Maps URL
- UTF-8 BOM for Excel compatibility
- RFC-4180 compliant quoting (handles commas in values like `"Kramer & Pollack, LLP"`)
- Filename format: `maplead_${searchquery}_${date}.csv`
- Sorting options: website-first, website-last, original order

**CSV Import:**
- RFC-4180 compliant parser with quote handling
- Dynamic header-based column mapping (supports custom CSV formats)
- Coordinates in address field mapping to respective columns
- Validation and error reporting

**UI/UX:**
- Clean, modern popup with design tokens (`#2563eb` primary, `#10b981` success)
- Lead Manager table view with responsive tables
- Search and filter pills (has website, has phone, has email)
- Real-time lead count
- Local-first messaging (no data leaves browser)
- Empty states and user-friendly alerts

**Storage:**
- Chrome `storage.local` API for persistence
- Auto-save upon scraping completion
- Responsive fallback to `localStorage` when API unavailable

**Technical:**
- TypeScript for type safety
- esbuild for bundling
- Jest for unit tests (5 tests pass)
- Manifest V3 with required permissions
- Background service worker

---

## Task Checklist

### Phase 1 Tasks

#### 1.1 Project Setup
- [ ] Initialize TypeScript configuration
- [ ] Create manifest.json (Manifest V3)
- [ ] Set up build tooling (esbuild or similar)
- [ ] Create background service worker
- [ ] Create popup.html and popup.ts
- [ ] Create main.html and main.ts

#### 1.2 Data Model
- [ ] Define Lead interface in /core/types.ts
- [ ] Define SourceAdapter interface in /adapters/base.ts
- [ ] Create LeadStore class for CRUD operations
- [ ] Implement Chrome storage integration

#### 1.3 Import Service
- [ ] Create CSV parser
- [ ] Build column mapping UI
- [ ] Implement validation with error reporting
- [ ] Add import confirmation dialog

#### 1.4 Lead Table UI
- [ ] Build table with configurable columns
- [ ] Add column visibility toggle
- [ ] Implement pagination (if needed)
- [ ] Add search functionality

#### 1.5 Filter System
- [ ] Create filter bar UI
- [ ] Implement website/phone/email presence filters
- [ ] Add filter combination logic
- [ ] Show active filter indicators

#### 1.6 Export Service
- [ ] Implement CSV generation with proper escaping
- [ ] Add UTF-8 BOM for Excel compatibility
- [ ] Build export dialog with options
- [ ] Implement website-first/last sorting
- [ ] Add preview functionality
- [ ] Create safe filename generation

#### 1.7 Duplicate Detection
- [ ] Implement deterministic dedup strategy
- [ ] Show duplicate groups for review
- [ ] Do NOT auto-merge; let user decide

---

## Implementation Order

1. **manifest.json** - Extension entry point
2. **core/types.ts** - Data models
3. **core/store.ts** - Storage layer
4. **services/import.ts** - CSV import
5. **services/export.ts** - CSV export
6. **services/filter.ts** - Filter logic
7. **services/dedup.ts** - Duplicate detection
8. **adapters/base.ts** - Adapter interface
9. **adapters/csv-import.ts** - Import adapter
10. **adapters/demo.ts** - Demo source
11. **ui/popup.html** - Quick actions popup
12. **ui/main.html** - Main table view
13. **ui/styles.css** - Shared styles
14. **ui/components/** - Reusable components
15. **background.ts** - Service worker

---

## Notes

- Each task should be testable in isolation where possible
- Update this file as tasks are completed or priorities change
- Document any blockers or decisions in task comments
- Keep MVP scope focused - avoid feature creep