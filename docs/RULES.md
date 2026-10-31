# Rules and Guidelines

## Data Source Policy

### Permitted Collection
- Google Maps: Scraping requires explicit user action; no automated background collection
- Future sources (Yelp, YellowPages): Add only after permission review
- Each source adapter must declare:
  - Permitted access method (page scraping with user action)
  - Supported fields
  - Known storage/export restrictions
- Document the legal basis for each source in the adapter

### Prohibited Behaviors
- **No automated collection**: Never scrap in background without user action
- **No stealth behavior**: No proxy rotation, browser fingerprint manipulation, or evasion of limits
- **No CAPTCHAs**: Do not attempt to solve or bypass CAPTCHAs
- **No rate limit evasion**: Do not implement controls designed to bypass rate limits
- **No access control bypass**: Do not collect data behind login walls or paywalls without explicit permission

### Assumption Policy
- Do NOT assume a source is permitted just because its pages are public
- If permission is unclear, leave the adapter disabled and document the question
- When in doubt, ask the user for clarification before enabling any collection

## Data Handling Rules

### Privacy
- **Local storage only**: Lead data stays in the user's browser via Chrome storage API
- **No external transmission**: Do not send lead data to any server or third party
- **No sensitive data collection**: Do not collect passwords, authentication tokens, or private user data
- **Treat imports as untrusted**: Sanitize all imported text to prevent HTML/script injection

### Export Restrictions
- Do not include fields prohibited by the source's terms in exports
- Each adapter can mark fields as non-exportable
- Respect source-specific export restrictions

## Extension Permissions

### Manifest V3 Requirements
- Request only the minimum permissions necessary
- Document why each permission is needed in the manifest
- Use `activeTab` permission when possible instead of `<all_urls>`

### Current Permissions Needed
- `storage`: For persisting lead data locally
- `activeTab`: For reading Google Maps page content
- `downloads`: For CSV export functionality
- `tabs`: For opening Google Maps search URLs

## User-Facing Rules

### Collection Behavior
- Never collect in the background without explicit user action
- Show progress, collected count, skipped duplicates, errors, and completion state
- Respect user-set record limits
- Stop safely when access is denied or limits are reached

### Interface Guidelines
- Clear empty, loading, error, and no-results states
- Provide visible feedback for active filters
- Show duplicate detection conflicts for user review
- Do not silently merge conflicting records

## Development Standards

### Code Quality
- Use TypeScript for type safety
- Follow Chrome extension best practices (Manifest V3)
- Modular architecture with clear separation between layers

### Testing
- Unit tests for core logic (filtering, sorting, CSV handling)
- Manual browser testing for UI/UX verification

### Documentation
- Document source adapter interface clearly
- Keep all Markdown documents in sync with implementation
- Include README for extension loading instructions