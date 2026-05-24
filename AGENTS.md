# AGENTS.md — WasteLessAI

# WasteLessAI 
- WastelessAI is Next.js + Expp app is an AI-assisted web application focused on reducing household food and product waste
- Workspace 'wasteless-ai-web': Next. js-based back-end + Web front-end
- Workspace 'westeless-ai-mobile': Expo-based mobile client app

## Project Overview

WasteLessAI is an AI-assisted web application focused on reducing household food and product waste.

The platform helps users:
- Track household ingredients and products
- Monitor expiration dates
- Organize pantry/fridge/freezer inventory
- Generate recipes from available ingredients
- Reduce unnecessary shopping
- Analyze waste habits
- Improve household sustainability

Primary stack:
- Next.js
- React
- Tailwind CSS
- Neon DB (PostgreSQL)
- Drizzle ORM
- JavaScript

---

# Core Principles

## Development Philosophy

Agents must prioritize:
- Readability
- Simplicity
- Scalability
- Security
- Accessibility
- Maintainability
- Performance

Avoid:
- Overengineering
- Large monolithic files
- Tight coupling
- Duplicate logic
- Premature optimization

---

# Project Architecture

## Folder Structure

Use feature-based architecture.

Example:

/src
/app
/features
/inventory
/recipes
/auth
/shopping
/ai
/components
/ui
/lib
/db
/hooks
/services
/utils
/styles
/types
/validations

Each feature should contain:
- components
- hooks
- services
- utils
- validations

---

# Coding Standards

## JavaScript Rules

Prefer:
- Functional programming
- Pure functions
- Composition over inheritance
- Small reusable utilities
- Immutable state updates

Avoid:
- Massive utility files
- Deeply nested logic
- Side effects inside UI components
- Large anonymous functions

Use:
- async/await
- Early returns
- Descriptive naming
- Modular architecture

---

# React Rules

## Components

Components should:
- Have one responsibility
- Stay reasonably small
- Extract logic into hooks
- Keep JSX clean

Prefer:
- Reusable UI components
- Controlled forms
- Composition patterns
- Server Components when possible

Avoid:
- Prop drilling
- Massive useEffect usage
- Business logic inside JSX
- Duplicate UI patterns

---

# Next.js Rules

## App Router

Use:
- App Router architecture
- Server Actions where appropriate
- Route groups for organization
- Loading and error boundaries

Prefer:
- Server Components by default
- Client Components only when needed

Keep:
- API logic separated
- Database access outside UI components
- Shared utilities centralized

---

# Tailwind CSS Rules

## Styling

Use:
- Utility-first styling
- Reusable component patterns
- Consistent spacing scale
- Responsive design
- Accessible color contrast

Prefer:
- Tailwind composition
- `clsx` or `cn()` helper utilities
- Shared design tokens

Avoid:
- Inline styles
- Excessively long class chains
- Duplicated styling patterns

---

# Neon DB Rules

## Database Guidelines

Database:
- PostgreSQL via Neon DB
- Use connection pooling
- Keep schema normalized
- Use migrations consistently

Always:
- Validate inputs before database operations
- Use parameterized queries
- Design scalable relational structures

Avoid:
- Raw SQL unless necessary
- Business logic inside database queries
- Unindexed frequently queried columns

---

# Drizzle ORM Rules

## ORM Usage

Use:
- Drizzle schema definitions
- Typed database queries
- Modular schema files
- Reusable query utilities

Structure example:

/src/db
/schema
/client
/queries
/migrations

Prefer:
- Explicit relations
- Small query functions
- Centralized database access

Avoid:
- Huge query files
- Duplicated query logic
- Mixing UI and database concerns

---

# Authentication Rules

Preferred:
- Secure cookie-based sessions
- HTTP-only cookies
- Middleware route protection

Always:
- Validate authorization server-side
- Protect sensitive routes
- Sanitize all input

Never:
- Expose secrets to the client
- Trust frontend validation alone

---

# AI Features Guidelines

Possible AI features:
- Recipe generation
- Smart ingredient matching
- Expiration predictions
- Waste analysis
- Shopping recommendations

Agents should:
- Keep prompts modular
- Separate AI services from UI
- Add fallback states
- Handle API failures gracefully

Avoid:
- Hardcoded prompts inside components
- Blocking UI during AI processing

---

# API Rules

## Route Handlers

Use:
- Next.js route handlers
- Zod validation
- Structured API responses

Response pattern:

{
success: boolean,
data?: any,
error?: string
}

Always:
- Validate request bodies
- Return proper HTTP status codes
- Handle edge cases

---

# State Management

Prefer:
- Local state first
- React Context for lightweight shared state
- Server state handling patterns

Optional later:
- Zustand
- TanStack Query

Avoid:
- Global state for everything
- Deep prop chains

---

# Performance Rules

Optimize:
- Database queries
- Bundle size
- Rendering frequency
- Image loading

Use:
- Dynamic imports
- Lazy loading
- Pagination
- Memoization only when needed

Avoid:
- Unnecessary client-side rendering
- Oversized dependencies
- Unoptimized loops

---

# UI / UX Guidelines

Design goals:
- Clean
- Minimal
- Fast
- Mobile-first
- Accessible

Always include:
- Empty states
- Loading states
- Error handling
- Responsive layouts

Avoid:
- Cluttered interfaces
- Hidden important actions
- Overcomplicated navigation

---

# Security Rules

Never:
- Commit secrets
- Expose API keys
- Trust user input

Always:
- Sanitize data
- Validate payloads
- Use environment variables
- Apply least privilege principles

Environment variables example:

DATABASE_URL=
OPENAI_API_KEY=
NEXTAUTH_SECRET=

---

# Git Workflow

## Branch Naming

Use:
feature/<name>
fix/<name>
refactor/<name>

Examples:
feature/recipe-generator
fix/inventory-filter

## Commit Convention

Format:
type(scope): description

Examples:
feat(auth): add login route
fix(db): correct expiration query

---

# Testing Rules

Prioritize testing:
- Database queries
- API routes
- Critical business logic
- Authentication flows

Recommended:
- Vitest
- React Testing Library
- Playwright

Critical flows:
- Inventory management
- Expiration tracking
- Recipe generation
- Authentication

---

# Documentation Rules

Each major feature should document:
- Purpose
- Architecture
- Data flow
- API behavior
- Edge cases

Keep:
- README updated
- Environment setup documented
- Database schema documented

---

# Suggested MVP Features

## Core Features

- User authentication
- Pantry inventory
- Expiration tracking
- Product management
- AI recipe suggestions
- Shopping list
- Notifications/reminders

## Future Features

- OCR receipt scanning
- Barcode scanning
- AI meal planning
- Household sharing
- Sustainability analytics
- Smart purchasing insights

---

# Agent Behavior Rules

Agents should:
- Preserve project architecture
- Prefer incremental improvements
- Generate production-ready code
- Explain important decisions
- Keep implementations modular

Agents must not:
- Rewrite stable systems unnecessarily
- Introduce unnecessary dependencies
- Ignore established structure
- Mix unrelated concerns

---

# Preferred Tooling

Recommended:
- ESLint
- Prettier
- Husky
- Zod
- React Hook Form
- clsx
- Lucide React

Optional later:
- Zustand
- TanStack Query
- Docker
- CI/CD pipelines

---

# Long-Term Vision

WasteLessAI should evolve into:
- An AI-powered household assistant
- A smart food management platform
- A sustainability-focused ecosystem

Primary goals:
- Practical usability
- Excellent UX
- Scalable architecture
- Efficient AI integration
- Reduced household waste