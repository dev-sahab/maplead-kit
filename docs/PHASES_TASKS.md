# Phases and Tasks

## Project Phases

### Phase 1: Foundation (MVP Core)
**Goal**: Establish the extension structure with basic import/export and lead management

- [x] Create project structure and manifest
- [ ] Implement lead data model and types
- [ ] Set up Chrome storage persistence layer
- [ ] Build basic CSV import with column mapping
- [ ] Create leads table UI with configurable columns
- [ ] Implement basic filters (data presence)
- [ ] Build CSV export with preview
- [ ] Add duplicate detection logic

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

- [ ] Add empty/loading/error states
- [ ] Improve accessibility
- [ ] Add keyboard navigation
- [ ] Create user documentation
- [ ] Test extension in Chrome

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