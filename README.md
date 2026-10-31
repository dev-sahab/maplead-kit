# Google Maps Business Scraper

A Chrome extension for scraping business data from Google Maps search results. Collect, filter, and export business leads with configurable columns and sorting options.

## Features

- **Google Maps Scraping**: Extract business data from Google Maps search results
- **Collection Controls**: Set record limits (10-10,000), start/pause/resume/stop collection
- **Filtering**: Filter leads by data presence (website, phone, email, social profiles)
- **CSV Export**: Export with custom filters and sorting (website-first, website-last, original order)
- **Lead Management**: Add notes, tags, and manage collected leads
- **Local Storage**: All data stored locally in your browser

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/dev-sahab/maplead-kit.git
cd maplead-kit
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the project directory

## Usage

### Scraping Google Maps

1. Click the extension icon
2. Enter a search query (e.g., "glass fixer in New York")
3. Set the record limit (10-10,000)
4. Click "Start Scraping"
5. Monitor progress in the popup

### Managing Leads

1. Click "Open Lead Manager" in the popup
2. View all collected leads in a table
3. Use filters to find specific leads:
   - Website present/absent
   - Phone present/absent
   - Email present/absent
   - Social profiles present/absent
4. Add/remove visible columns
5. Search across all fields

### Exporting Data

1. Open the Lead Manager
2. Click "Export"
3. Configure export options:
   - Filter by data presence
   - Sort order (original, website-first, website-last)
   - Preview before download
4. Click "Download CSV"

## Development

### Project Structure

```
/scraper/
├── manifest.json           # Chrome extension manifest (V3)
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── src/
│   ├── core/              # Core data models and storage
│   ├── adapters/          # Source-specific scraping adapters
│   ├── services/          # Business logic (import/export)
│   └── ui/                # User interface components
└── docs/                  # Documentation
```

### Build Commands

```bash
# Build for production
npm run build

# Development mode (auto-rebuild on changes)
npm run dev

# Run tests
npm test

# Run specific test
npm test -- --testPathPattern=import

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

### Adding New Source Adapters

1. Create a new file in `src/adapters/` (e.g., `yelp.ts`)
2. Implement the `SourceAdapter` interface:
```typescript
export class YelpAdapter implements SourceAdapter {
  id = 'yelp';
  name = 'Yelp';
  // ... implement required methods
}
```
3. Register in the adapter registry

## Architecture

The extension uses a modular architecture with clear separation:

- **Core Layer**: Data models, storage (Chrome storage API)
- **Adapter Layer**: Source-specific scraping logic
- **Service Layer**: Import/export, filtering, duplicate detection
- **UI Layer**: Popup, main view, dialogs

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Data Model

Each lead includes:
- Business name, category
- Full address (street, city, region, postal code, country)
- Contact info (phone, website, email)
- Social profiles (Facebook, Instagram, LinkedIn, etc.)
- Source metadata
- User notes and tags
- Email/social verification status

## Privacy

- All data is stored locally using Chrome's storage API
- No data is transmitted to external servers
- Extension requires minimal permissions:
  - `storage`: Local data persistence
  - `activeTab`: Reading Google Maps page content
  - `downloads`: CSV export functionality
  - `tabs`: Opening result pages

## Roadmap

### MVP (Current)
- [x] Google Maps adapter (sample data)
- [x] CSV import/export
- [x] Filtering by data presence
- [x] Collection controls
- [x] Local storage

### Future
- [ ] Real Google Maps scraping implementation
- [ ] Duplicate detection
- [ ] Additional source adapters (Yelp, YellowPages)
- [ ] Email verification
- [ ] Dark mode
- [ ] Bulk operations
- [ ] CRM export templates

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design Specs](docs/DESIGN.md)
- [Rules & Guidelines](docs/RULES.md)
- [Implementation Plan](docs/PHASES_TASKS.md)
- [Development Guide (CLAUDE.md)](CLAUDE.md)

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
