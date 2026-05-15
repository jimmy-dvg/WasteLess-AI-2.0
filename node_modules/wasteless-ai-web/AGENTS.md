# AGENTS.md — Web Application

## Stack

- Next.js
- React
- Tailwind CSS
- Neon DB
- Drizzle ORM

---

# Web App Goals

The web app focuses on:
- Inventory management
- Dashboard analytics
- Recipe generation
- Product organization
- Waste tracking
- Account management

---

# Next.js Rules

## Architecture

Use:
- App Router
- Server Components by default
- Route groups
- Loading and error boundaries

Prefer:
- Server Actions when appropriate
- Modular route handlers
- Shared layouts

Avoid:
- Excessive Client Components
- Large page files
- Database logic inside UI components

---

# Folder Structure

Example:

/src
/app
/features
/components
/ui
/hooks
/lib
/services
/db
/schema
/queries
/utils
/validations

---

# Database Rules

## Neon + Drizzle

Always:
- Use migrations
- Keep schema modular
- Use typed queries
- Validate inputs

Avoid:
- Raw SQL unless necessary
- Duplicated queries
- Unindexed search fields

---

# Tailwind Rules

Use:
- Utility-first styling
- Shared design patterns
- Responsive layouts
- Accessible components

Avoid:
- Inline styles
- Duplicated class groups
- Overly long class chains

---

# API Rules

Use:
- Route handlers
- Zod validation
- Consistent response structure

Example:

{
success: true,
data: {}
}

or

{
success: false,
error: "Message"
}

---

# Performance Rules

Optimize:
- Database queries
- Rendering
- Bundle size
- Image loading

Use:
- Dynamic imports
- Pagination
- Lazy loading

Avoid:
- Unnecessary rerenders
- Oversized dependencies

---

# Web UI Rules

Always include:
- Loading states
- Empty states
- Error handling
- Responsive behavior

Design goals:
- Clean
- Minimal
- Fast
- Accessible

---

# Testing Priorities

Critical flows:
- Authentication
- Inventory management
- Recipe generation
- Expiration tracking

Recommended:
- Vitest
- React Testing Library
- Playwright