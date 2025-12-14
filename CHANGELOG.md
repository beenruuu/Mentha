# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- Default OpenAI model now `gpt-4-turbo` to reduce analysis cost
- Docker Compose files modernized (removed deprecated version field, added healthchecks)

### Added
- `AnalysisResultsIngestionService` hydrates keywords, competitors, and crawler logs after each analysis
- Business scope and city fields for brands
- Organization support with member management

### Fixed
- Onboarding flow stability improvements
- Content gap analysis translations

## [0.2.0] - 2024-11-27

### Added
- **Backend**: Implemented `OpenRouterService` for multi-LLM support (GPT-4, Claude 3, Perplexity, etc.)
- **Backend**: Created core API endpoints for Brands, Keywords, and Competitors
- **Backend**: Implemented `AnalysisService` for AEO visibility tracking
- **Frontend**: Added Next.js Middleware for route protection and Supabase session management
- **Frontend**: Created Legal Pages (Terms of Service, Privacy Policy, Cookie Policy)
- **Frontend**: Implemented GDPR-compliant Cookie Consent Banner
- **Frontend**: Expanded Landing Page with "GEO vs SEO" comparison and "Detailed Use Cases"
- **Frontend**: Created Blog section with initial SEO/AEO articles
- **Security**: Verified Stripe Webhook signature verification

## [0.1.0] - Initial Release

- Initial import of project files
- Core platform architecture established
