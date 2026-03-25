# AI Learning — Project Context

## Project

Japanese language learning web app for Vietnamese learners.
Monorepo: `/frontend` (Next.js 14, App Router, TypeScript, Tailwind) + `/backend` (Rails 7 API-only, PostgreSQL, Redis, Sidekiq).

## Architecture Rules

- **ALL Claude API calls must go through Rails backend** — never from Next.js directly
- Frontend communicates with backend via REST API at `/api/v1/...`
- Auth: Devise + devise-jwt on Rails; NextAuth.js on frontend
- Background jobs: Sidekiq
- Cache: Redis (AI responses with 30-day TTL)
- AI responses must be streamed via Server-Sent Events (Rails → Next.js)

## Domain Language

| Term | Meaning |
|------|---------|
| JLPT | Japanese Language Proficiency Test — N5 (beginner) → N1 (advanced) |
| SRS | Spaced Repetition System using SM-2 algorithm |
| Furigana | Small kana displayed above kanji |

- All AI explanations must be written **in Vietnamese**

## Code Conventions

### Rails (backend)
- Service objects in `app/services/`
- Serializers using `jsonapi-serializer`
- API responses in **JSON:API format**
- Tests: **RSpec**

### Next.js (frontend)
- Server components by default; use client components only when needed
- API responses: JSON:API format
- Tests: **Jest + Testing Library**

## Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API access (Rails only) |
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `NEXTAUTH_SECRET` | NextAuth.js secret |
| `NEXT_PUBLIC_API_URL` | Rails API base URL for frontend |
