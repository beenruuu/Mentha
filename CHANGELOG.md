# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
- **Changed**: Default OpenAI model now `gpt-5-nano-2025-08-07` to reduce analysis cost.
- **Added**: `AnalysisResultsIngestionService` hydrates keywords, competitors, and crawler logs after each analysis.
- **Docs**: README now reflects pnpm usage and explains the new ingestion pipeline.

## [0.2.0] - 2023-10-27
### Added
- **Backend**: Implemented `OpenRouterService` for multi-LLM support (GPT-4, Claude 3, Perplexity, etc.).
- **Backend**: Created core API endpoints for Brands, Keywords, and Competitors.
- **Backend**: Implemented `AnalysisService` for AEO visibility tracking.
- **Frontend**: Added Next.js Middleware for route protection and Supabase session management.
- **Frontend**: Created Legal Pages (Terms of Service, Privacy Policy, Cookie Policy).
- **Frontend**: Implemented GDPR-compliant Cookie Consent Banner.
- **Frontend**: Expanded Landing Page with "GEO vs SEO" comparison and "Detailed Use Cases".
- **Frontend**: Created Blog section with initial SEO/AEO articles.
- **Security**: Verified Stripe Webhook signature verification.

## [0.1.0] - INITIAL
- Initial import of project files
