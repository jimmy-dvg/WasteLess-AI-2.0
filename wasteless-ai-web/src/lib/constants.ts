// Site configuration and constants
export const siteConfig = {
  name: "WasteLessAI",
  description:
    "AI-powered food waste reduction platform helping households save money and reduce waste.",
  url: "https://wastelessai.com",
  appUrl: "https://app.wastelessai.com",
  links: {
    twitter: "https://twitter.com/wastelessai",
    instagram: "https://instagram.com/wastelessai",
    linkedin: "https://linkedin.com/company/wastelessai",
    github: "https://github.com/wastelessai",
  },
  contact: {
    email: "support@wastelessai.com",
    phone: "+1 (555) WASTE-LESS",
  },
};

// Navigation links
export const navigationLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#benefits", label: "Benefits" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

// Footer links
export const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Download", href: "/download" },
    { label: "Security", href: "/security" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Help Center", href: "/help" },
    { label: "Community", href: "/community" },
    { label: "Contact", href: "/contact" },
  ],
};

// Feature definitions
export const features = [
  {
    icon: "📦",
    title: "Pantry Tracking",
    description:
      "Add items to your digital pantry instantly. Track what you have, where it is, and when it was purchased.",
  },
  {
    icon: "⏰",
    title: "Expiration Monitoring",
    description:
      "Get smart alerts before items expire. Never miss an expiration date and reduce food waste automatically.",
  },
  {
    icon: "🤖",
    title: "AI Recipe Generation",
    description:
      "Get personalized recipe recommendations based on items in your pantry that are expiring soon.",
  },
  {
    icon: "🛒",
    title: "Shopping Assistance",
    description:
      "Let AI analyze your pantry and suggest what to buy. Avoid duplicates and optimize your shopping list.",
  },
  {
    icon: "📊",
    title: "Waste Analytics",
    description:
      "Track your waste patterns and get insights to reduce spending. See how much you've saved and contributed to sustainability.",
  },
];

// Sustainability goals
export const sustainabilityStats = {
  activeUsers: "50K+",
  itemsTracked: "2.5M+",
  moneySaved: "$10M+",
  wastePrevented: "5M+ lbs",
};
