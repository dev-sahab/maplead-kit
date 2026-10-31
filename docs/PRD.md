# Product Requirements Document

## Overview
Google Maps Business Scraper is a Chrome extension that helps freelancers and small sales/marketing teams research local businesses by scraping data from Google Maps search results. Users can collect business information, filter by data completeness, and export clean CSV files.

## Goals
1. Scrap business data from Google Maps search results (company name, email, location, address, website, social links)
2. Provide filtering by data presence (website, phone, email, social)
3. Export structured CSV files with customizable sorting
4. Support multiple data sources (Google Maps MVP, then Yelp, YellowPages, etc.)
5. Respect source terms of service and implement collection controls

## Users
### Primary Users
- **Freelancers**: Individuals researching local businesses for sales, marketing, or business development
- **Small teams**: Sales or marketing teams needing to build lead lists for local campaigns

### User Needs
1. Scrap business data directly from Google Maps search results
2. Filter results by data completeness (website present/absent, phone present/absent, etc.)
3. Add/remove visible columns in the lead table
4. Export clean CSV with custom filters (website-first, website-last, original order)
5. Set collection limits (range: 10-10000 records)
6. Add notes and tags to lead records
7. Manage and deduplicate collected leads

## MVP Scope

### Core Features
1. **Google Maps Adapter**: Scrap data from search results with collection controls
2. **Collection Controls**:
   - Start/Pause/Resume/Stop buttons
   - Record limit input (10-10000 range)
   - Progress tracking
   - Collected count, errors display
3. **Lead Management Table**:
   - Configurable visible columns (add/remove)
   - Search functionality
   - Filtering by data presence (website, phone, email, social)
   - Source filter
4. **CSV Export**:
   - Filter-based export (include/exclude records by data presence)
   - Sort options: website-first, website-last, original order
   - Preview before download
   - Safe filename with timestamp
5. **Lead Fields**:
   - Business name, category
   - Street address, city, region, postal code, country
   - Phone, website URL, email
   - Social profiles (Facebook, Instagram, LinkedIn, etc.)
   - User notes, tags
   - Source name, source record URL
   - Collected timestamp
   - Email/social status (unknown, found, verified)

### Source Policy
- Google Maps: Implement scraping with user action only, no automated background collection
- Future sources (Yelp, YellowPages): Add as separate adapters after permission review
- Each adapter must declare permitted access method, supported fields, and export restrictions

## Non-MVP Features (Future)
1. Additional source adapters (Yelp, YellowPages, local directories)
2. Email verification service
3. Bulk tag operations
4. CRM export templates
5. Collection job queue
6. Dark mode

## Success Metrics
1. Users can search, scrap, filter, and export CSV in under 10 minutes
2. Export CSV is clean, properly escaped, readable in Excel/Sheets
3. Collection respects user-set limits without data loss
4. Clear UI feedback during scrap process