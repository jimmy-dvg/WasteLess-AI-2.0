# WasteLessAI Public Website Documentation

## Overview

This is the public-facing website for WasteLessAI, built with Next.js 16, React, and Tailwind CSS. The site is mobile-first, accessible, and optimized for SEO.

## Project Structure

```
/src
  /app
    layout.tsx                 # Root app layout and metadata
    globals.css                # Global styles & Tailwind configuration
    /(marketing)
      layout.tsx               # Marketing layout with Navbar & Footer
      page.tsx                 # Landing page (main entry point)
    /(marketing)/about
      page.tsx                 # About page
    /(marketing)/privacy
      page.tsx                 # Privacy policy page
    /(marketing)/terms
      page.tsx                 # Terms of service page
  /components
    Navbar.tsx                 # Sticky navigation with mobile menu
    Footer.tsx                 # Footer with links and social media
    Button.tsx                 # Reusable button component
    SectionWrapper.tsx         # Reusable section container
    HeroSection.tsx            # Hero banner with headline and CTA
    FeaturesSection.tsx        # Features showcase (5 features)
    HowItWorksSection.tsx      # 3-step process explanation
    BenefitsSection.tsx        # Benefits with stats
    CTASection.tsx             # Final call-to-action
  /lib
    constants.ts               # Site configuration and constants
```

## Key Components

### Layout & Navigation

- **Navbar**: Sticky header with logo, navigation links, and CTA buttons. Mobile-responsive with hamburger menu.
- **Footer**: Multi-column footer with brand info, links, social media, and copyright.

### Page Sections

- **HeroSection**: Large headline, description, CTA buttons, and trust indicators with stats.
- **FeaturesSection**: 5-card grid showcasing main platform features with icons and descriptions.
- **HowItWorksSection**: 3-step process with detailed information and connector lines.
- **BenefitsSection**: Benefits cards, impact stats, and customer testimonial.
- **CTASection**: Prominent call-to-action with backup support options.

### Reusable Components

- **Button**: Supports 3 variants (primary, secondary, outline) and 3 sizes (sm, md, lg).
- **SectionWrapper**: Manages section padding, background colors, and max-width container logic.

## Design System

### Colors

- **Primary**: Emerald (600) - Used for primary actions and highlights
- **Secondary**: Slate (900) - Used for text and backgrounds
- **Dark Mode**: Slate-950 background with slate-50 text

### Typography

- **Font**: Geist Sans (system font fallback)
- **Scale**: Responsive sizes using Tailwind's SM, MD, LG breakpoints
- **Font Weights**: Light (300), Normal (400), Medium (500), Semibold (600), Bold (700)

### Spacing & Layout

- Container max-width: 7xl (1280px)
- Responsive padding: 4px (mobile) → 8px (tablet) → 8px (desktop)
- Grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)

### Animation & Transitions

- Smooth scroll: `scroll-smooth` class
- Transitions: 200ms-300ms duration for hover and focus states
- Hover effects: Color shifts, shadows, and scale transforms

## Features

### Mobile-First Design

All components are built mobile-first and scale up to larger screens using Tailwind's responsive prefixes (sm:, md:, lg:).

### Dark Mode Ready

Complete dark mode support using Tailwind's dark: prefix on all components.

### Accessibility

- Semantic HTML (header, nav, main, section, footer)
- ARIA labels for interactive elements
- Proper contrast ratios for text and buttons
- Keyboard navigation support

### SEO

- Metadata configured in layout.tsx
- Open Graph tags for social sharing
- Twitter Card support
- Proper heading hierarchy (h1, h2, h3)

### Performance

- Image optimization (use Next.js Image component)
- Component code splitting
- Lazy loading support
- CSS optimization with Tailwind

## Development

### Installation

```bash
npm install
```

### Running Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

### Linting & Formatting

```bash
npm run lint
```

## Component Usage Examples

### Button

```jsx
import Button from "@/components/Button";

<Button variant="primary" size="md">
  Click Me
</Button>
```

**Props:**
- `variant`: "primary" | "secondary" | "outline" (default: "primary")
- `size`: "sm" | "md" | "lg" (default: "md")
- `children`: React.ReactNode (required)
- Supports all HTML button attributes

### SectionWrapper

```jsx
import SectionWrapper from "@/components/SectionWrapper";

<SectionWrapper id="section-id" dark={true}>
  <h2>Section Title</h2>
  <p>Section content</p>
</SectionWrapper>
```

**Props:**
- `id`: string (optional)
- `dark`: boolean (default: false)
- `className`: string (additional classes)
- `children`: React.ReactNode (required)

## Constants

Configuration values are stored in `/src/lib/constants.ts`:

- `siteConfig`: Site name, URL, contact info
- `navigationLinks`: Header navigation menu items
- `footerLinks`: Footer link sections
- `features`: Feature definitions
- `sustainabilityStats`: Key metrics and statistics

## Adding New Pages

1. Create a new folder in `/app` (e.g., `/pricing`)
2. Create a `page.tsx` file
3. Add metadata export for SEO
4. Wrap content with `SectionWrapper` for consistency
5. Import and use existing components

Example:

```tsx
import SectionWrapper from "@/components/SectionWrapper";

export const metadata = {
  title: "Pricing - WasteLessAI",
  description: "View our flexible pricing plans.",
};

export default function PricingPage() {
  return (
    <SectionWrapper>
      <h1>Pricing Plans</h1>
      {/* Page content */}
    </SectionWrapper>
  );
}
```

## Deployment

The site is configured to deploy on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically on push to main branch

Environment variables (if needed) go in `.env.local`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- [ ] Blog section with mdx-based articles
- [ ] Pricing page with subscription tiers
- [ ] Download page with app store links
- [ ] Contact form with email integration
- [ ] Analytics dashboard
- [ ] AI chat support widget
- [ ] API documentation
- [ ] Customer success stories/case studies

## Troubleshooting

### Styles not applying

- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run dev`

### Components not found

- Ensure `@/` alias is configured in `tsconfig.json`
- Restart dev server

### Dark mode not working

- Check that `dark` class is applied to `html` element in layout.tsx
- Verify Tailwind config has dark mode enabled

## Support

For questions or issues, contact: support@wastelessai.com
