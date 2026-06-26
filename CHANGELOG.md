# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-25

### Added
- Contract method `list_recent_posts(limit, offset)` for paginated on-chain feed reading
- Contract method `get_feed_stats()` returning verified/flagged counters
- `post_ids: DynArray[str]` storage for ordered post tracking
- Frontend `fetchFeed` + polling every 15s
- Landing-page stats now read from chain
- `scripts/seed_demo_posts.ts` for demo data seeding

### Removed
- Hardcoded MOCK_POSTS from runtime; feed is now 100% on-chain
- Dead code: unused `verdict_is_valid()` helper

### Fixed
- Anti-pattern where feed was static mock data despite wallet connection (blocking issue for Builder Program review)
