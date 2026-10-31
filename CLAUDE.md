# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Google Maps Business Scraper Chrome extension.

## Overview

The repository implements a Chrome extension that scrapes business data from Google Maps search results, allows filtering by data completeness, and exports clean CSV files. The architecture is modular with clear separation between UI, data layer, adapters, and services.

## Quick Start

### Prerequisites
- Node.js (v18+)
- TypeScript (v5+)
- Chrome or Edge browser

### Installation
```bash
# Clone or navigate to the repository
cd Google Maps Business Scraper

# Install dependencies
npm install
```

### Development Commands

#### Build
```bash
# Compile TypeScript to JavaScript
npm run build
```

#### Run in Development Mode
```bash
# Start the extension in development mode (opens in a new tab)
npm run dev
```

#### Run Tests
```bash
# Run all tests
npm test

# Run a specific test file
npm test -- --testPathPattern=import

# Run tests with coverage
npm test -- --coverage
```

#### Lint
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

#### Format Code
```bash
# Format TypeScript code
npm run format
```

#### Clean Build Artifacts
```bash
# Clean dist folder
npm run clean
```

## Architecture Overview

### Layer Structure

```
/scraper/
├── manifest.json           # Chrome extension manifest (V3)
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── core/              # Core data models and storage
│   │   └── types.ts       # Lead model, filter types, interfaces
│   ├── adapters/          # Source-specific scraping adapters
│   │   └── google-maps.ts # Google Maps scraping adapter
│   ├── services/          # Business logic (import/export)
│   │   ├── import.ts      # CSV import with validation
│   │   └── export.ts      # CSV export with filtering/sorting
│   └── ui/                # User interface components
│       ├── popup.html     # Popup UI (search, controls)
│       └── popup.css      # Popup styling
└── docs/                  # Documentation
    ├── PRD.md             # Product requirements
    ├── RULES.md           # Data source policy & guidelines
    ├── ARCHITECTURE.md    # System architecture
    ├── PHASES_TASKS.md    # Implementation phases
    ├── DESIGN.md          # UI/UX design specs
    └── MEMORY.md          # Project memory index
```

### Key Components

#### Core Layer (`src/core`)
- **Types** (`types.ts`): Defines the `Lead` model with all fields (business name, address, phone, website, email, social profiles, tags, etc.) and filter options
- **Store** (`store.ts`): Manages lead persistence using Chrome `chrome.storage.local` with CRUD operations and settings persistence

#### Adapter Layer (`src/adapters`)
- **GoogleMapsAdapter** (`google-maps.ts`): Implements the `SourceAdapter` interface. Currently returns sample data for MVP testing. Future implementation should open a Google Maps search URL and scrape results.

#### Service Layer (`src/services`)
- **ImportService** (`import.ts`): Parses CSV files, maps columns to lead fields, validates rows, and reports errors/warnings
- **ExportService** (`export.ts`): Generates CSV exports with filtering, sorting (website-first/website-last/original), and preview functionality

#### UI Layer (`src/ui`)
- **Popup** (`popup.html`/`popup.css`): Main user interface with search, record limit, start/stop controls, and status indicators

## Common Workflows

### Adding a New Source Adapter
1. Create a new file in `src/adapters/` (e.g., `yelp.ts`)
2. Implement the `SourceAdapter` interface with `collect()` and `getProgress()` methods
3. Register the adapter in `manifest.json` (optional, if needed)
4. Update `PHASES_TASKS.md` with the new adapter in the implementation list

### Running a Single Test
```bash
# Run a specific test file
npm test -- --testPathPattern=import

# Run all tests
npm test
```

### Building the Extension
```bash
# Compile TypeScript
npm run build

# The build output goes to dist/
```

### Linting
```bash
# Check code style
npm run lint

# Fix automatic issues
npm run lint -- --fix
```

## Development Guidelines

### Code Organization
- Each feature should have a corresponding file in the appropriate layer
- Interfaces should be defined in `src/core/types.ts` and consumed by other modules
- Adapters should implement the `SourceAdapter` interface
- Services should be pure functions with clear inputs/outputs
- UI components should be self-contained in the `ui/` directory

### Data Flow
1. User interacts with the popup (search, limit, start)
2. `GoogleMapsAdapter.collect()` returns leads
3. `LeadStore` persists leads
4. `ExportService` generates CSV exports
5. UI displays results and allows filtering

### Testing
- Unit tests should cover filter logic, CSV generation, and duplicate detection
- Integration tests should verify the full scraping → filtering → export flow
- Use the sample data in `google-maps.ts` for initial testing

## Next Steps

1. Implement the Google Maps scraping logic in `google-maps.ts`
2. Add duplicate detection using the deterministic strategy
3. Implement the full UI integration between popup and services
4. Add settings persistence for column visibility and export preferences
5. Create additional source adapters (Yelp, YellowPages) following the same pattern

## References
- **Product Requirements** (`docs/PRD.md`): MVP scope and user needs
- **Architecture** (`docs/ARCHITECTURE.md`): System design and module responsibilities
- **Implementation Plan** (`docs/PHASES_TASKS.md`): Phases and task breakdown
- **Design Specs** (`docs/DESIGN.md`): UI/UX layout and user flow
- **Rules** (`docs/RULES.md`): Data source policy and development guidelines
- **Memory** (`docs/MEMORY.md`): Project index and documentation links
