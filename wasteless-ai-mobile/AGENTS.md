# AGENTS.md — Mobile Application

## Stack

- Expo
- React Native
- React
- JavaScript

Backend:
- Next.js API
- Neon DB
- Drizzle ORM

---

# Mobile App Goals

The mobile app focuses on:
- Quick product entry
- Barcode scanning
- Expiration reminders
- Shopping lists
- Mobile-first inventory access
- Push notifications

---

# React Native Rules

## Components

Components should:
- Stay focused
- Be reusable
- Remain lightweight
- Separate logic into hooks

Avoid:
- Massive screens
- Inline complex logic
- Duplicated layouts

---

# Folder Structure

Example:

/src
/screens
/features
/components
/hooks
/services
/utils
/navigation
/styles

Each feature should contain:
- components
- hooks
- services
- utils

---

# Expo Rules

Use:
- Expo Router or React Navigation
- Secure storage when needed
- Native capabilities through Expo SDK

Avoid:
- Unnecessary native modules
- Heavy dependencies
- Platform-specific duplication

---

# Mobile UX Rules

Prioritize:
- Fast interactions
- Simple navigation
- Thumb-friendly layouts
- Offline-friendly behavior

Always include:
- Loading indicators
- Error states
- Retry behavior

---

# API Rules

Mobile app should:
- Consume centralized API endpoints
- Avoid direct database access
- Handle failed requests gracefully
- Cache lightweight data when useful

---

# State Management

Prefer:
- Local state first
- Context for lightweight shared state

Optional later:
- Zustand
- TanStack Query

Avoid:
- Large global stores
- Overcomplicated state patterns

---

# Performance Rules

Optimize:
- Re-renders
- Image sizes
- Navigation transitions
- API calls

Avoid:
- Heavy animations
- Unnecessary background processing

---

# Mobile Features

Core features:
- Inventory tracking
- Barcode scanning
- Expiration alerts
- Shopping list
- Recipe suggestions

Future features:
- OCR scanning
- Voice input
- Shared family inventory
- AI recommendations

---

# Mobile Security Rules

Never:
- Store secrets insecurely
- Expose tokens
- Trust client validation

Always:
- Validate requests server-side
- Use secure storage
- Protect authenticated routes

---

# Testing Priorities

Critical flows:
- Authentication
- Product creation
- Notifications
- Offline handling

Recommended:
- React Native Testing Library
- Detox