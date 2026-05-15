# WasteLessAI

WasteLessAI is an AI-powered platform focused on reducing household food and product waste through smart inventory management, expiration tracking, and intelligent recipe recommendations.

The project consists of:
- Web application (`Next.js`)
- Mobile application (`Expo / React Native`)
- Shared backend infrastructure (`Neon PostgreSQL + Drizzle ORM`)

---

# Vision

WasteLessAI helps users:
- Organize pantry and household products
- Track expiration dates
- Reduce unnecessary shopping
- Generate recipes from available ingredients
- Build sustainable consumption habits
- Reduce food waste using AI assistance

---

# Tech Stack

## Frontend

### Web
- Next.js
- React
- Tailwind CSS

### Mobile
- Expo
- React Native

---

## Backend

- Neon DB (PostgreSQL)
- Drizzle ORM
- Next.js Route Handlers / Server Actions

---

## AI Features

Planned AI capabilities:
- Recipe generation
- Ingredient analysis
- Smart shopping suggestions
- Expiration prediction
- Waste analytics

---

# Monorepo Structure

```
wasteless-ai-2.0/
│
├── wasteless-ai-web/          # Next.js web application
│   ├── src/
│   │   ├── app/               # App Router structure
│   │   └── public/            # Static assets (at root level for Next.js)
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── wasteless-ai-mobile/       # Expo/React Native mobile app
│   ├── src/
│   │   ├── app/               # Expo Router structure
│   │   ├── components/
│   │   ├── assets/            # Images and icons
│   │   ├── constants/
│   │   ├── hooks/
│   │   └── scripts/
│   ├── package.json
│   ├── app.json
│   └── tsconfig.json
│
├── wasteless-ai-shared/       # Shared utilities and types
│   ├── src/
│   └── package.json
│
├── package.json               # Monorepo root
├── .gitignore
└── README.md
```

## Projects Overview

### Web Application

**Location:** `wasteless-ai-web/`

**Stack:**
- Next.js 16
- React 19
- Tailwind CSS
- TypeScript

**Responsibilities:**
- User dashboard
- Inventory management
- Analytics and insights
- AI recipe generation
- Product organization
- User authentication

### Mobile Application

**Location:** `wasteless-ai-mobile/`

**Stack:**
- Expo
- React Native
- TypeScript

**Responsibilities:**
- Quick product entry
- On-the-go inventory updates
- Push notifications
- Barcode/QR scanning
- Cross-platform deployment

### Shared Package

**Location:** `wasteless-ai-shared/`

**Contents:**
- Shared types and interfaces
- Utility functions
- Constants
- API client

---

# Getting Started

## Requirements

- Node.js 20+
- npm or pnpm
- Git

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd wasteless-ai-2.0
```

### Install Dependencies

```bash
npm install
```

or

```bash
pnpm install
```

### Environment Variables

Create `.env.local` files in each project where needed:

**Web** (`wasteless-ai-web/.env.local`):
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NEXTAUTH_SECRET=your-secret-key
```

**Mobile** (`wasteless-ai-mobile/.env.local`):
```
API_URL=http://localhost:3000
```

⚠️ Never commit secrets to git.

---

# Development

## Running Applications

### Web Application

```bash
npm -w wasteless-ai-web run dev
```

Runs on `http://localhost:3000`

### Mobile Application

```bash
npm -w wasteless-ai-mobile run start
```

Options:
- `--android` - Run on Android emulator
- `--ios` - Run on iOS simulator
- `--web` - Run in web browser

### Both Concurrently

```bash
npm run dev
```

## Building

### Web

```bash
npm -w wasteless-ai-web run build
npm -w wasteless-ai-web run start
```

### Mobile

```bash
npm -w wasteless-ai-mobile run build
```

---

# Features

## MVP Features

- ✅ User authentication
- ✅ Pantry inventory management
- ✅ Product management
- ✅ Expiration date tracking
- ✅ Shopping list
- ✅ AI recipe recommendations
- ✅ Ingredient matching

## Planned Features

- 🔄 OCR receipt scanning
- 🔄 Barcode scanner
- 🔄 AI meal planning
- 🔄 Sustainability analytics
- 🔄 Shared household inventories
- 🔄 Push notifications
- 🔄 Smart waste insights

---

# Architecture & Code Standards

See [AGENTS.md](./AGENTS.md) for detailed development guidelines.

### Key Principles

- **Feature-based architecture** - Code organized by features, not layers
- **TypeScript** - Full type safety
- **Functional programming** - Pure functions and composition
- **Modular components** - Reusable, single-responsibility components
- **Server-first** - Server components by default (Next.js), server actions where appropriate

### Project Structure

Each project follows this pattern:

```
src/
├── app/                 # Next.js App Router / Expo Router
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # External API calls, business logic
├── utils/              # Helper functions
├── types/              # TypeScript interfaces
└── constants/          # App constants
```

---

# Database

Using **Neon PostgreSQL** with **Drizzle ORM**.

### Migrations

Generate:
```bash
npx drizzle-kit generate
```

Run:
```bash
npx drizzle-kit migrate
```

---

# Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes following [AGENTS.md](./AGENTS.md) guidelines
3. Commit with conventional commits: `feat(scope): description`
4. Push and create a Pull Request

---

# License

ISC - See LICENSE file

---

# Author

Didi Georgiev

npx drizzle-kit migrate
Running Development Servers
Web App
cd apps/web
npm run dev
Mobile App
cd apps/mobile
npm start
Development Principles

The project follows:

Modular architecture
Feature-based organization
Functional programming patterns
Reusable components
Scalable database design
Mobile-first UX
Secure backend practices
Coding Standards
Preferred Practices
Small reusable functions
Pure business logic
Async/await
Clear naming
Consistent folder structure
Avoid
Monolithic files
Duplicate logic
Tight coupling
Unnecessary dependencies
Business logic inside UI components
Security

Always:

Validate inputs
Sanitize payloads
Use environment variables
Protect authenticated routes

Never:

Commit secrets
Expose API keys
Trust frontend validation alone
Performance Goals

Optimize:

Bundle size
Database queries
Rendering performance
Mobile responsiveness

Use:

Lazy loading
Dynamic imports
Pagination
Efficient query patterns
Testing

Recommended tools:

Vitest
React Testing Library
Playwright
React Native Testing Library

Critical flows:

Authentication
Inventory management
Recipe generation
Expiration tracking
Git Workflow
Branch Naming
feature/<name>
fix/<name>
refactor/<name>

Examples:

feature/recipe-generator
fix/mobile-auth
Commit Convention
type(scope): short description

Examples:

feat(web): add inventory dashboard
fix(api): repair auth validation
UI / UX Goals

The platform should feel:

Fast
Minimal
Clean
Accessible
Mobile-friendly

Always include:

Loading states
Error handling
Empty states
Responsive layouts
Long-Term Vision

WasteLessAI aims to evolve into:

An AI-powered household assistant
A sustainability-focused ecosystem
A smart food management platform
A cross-platform productivity tool for reducing waste
License

Private project — all rights reserved.