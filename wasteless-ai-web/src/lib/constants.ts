export const siteConfig = {
  name: "WasteLessAI",
  description:
    "AI-powered food waste reduction platform helping households save money and reduce waste.",
  url: "https://wastelessai.com",
  appUrl: "/dashboard",
  contact: {
    email: "support@wastelessai.com",
    phone: "+1 (555) WASTE-LESS",
  },
};

export const navigationLinks = [
  { href: "#quick-access", label: "Quick access" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#benefits", label: "Benefits" },
];

export const footerLinks = {
  Product: [
    { label: "Inventory", href: "/dashboard/inventory" },
    { label: "Scanner", href: "/dashboard/scanning" },
    { label: "AI recipes", href: "/dashboard/recipes" },
    { label: "Meal plan", href: "/dashboard/meal-plan" },
  ],
  Workflows: [
    { label: "Shopping list", href: "/dashboard/shopping" },
    { label: "Waste tracking", href: "/dashboard/waste" },
    { label: "Household", href: "/dashboard/household" },
    { label: "Settings", href: "/dashboard/settings" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export const features = [
  {
    key: "inventory",
    title: "Inventory control",
    description:
      "Add items to your digital pantry and track what you have, where it is, and when it expires.",
    href: "/dashboard/inventory",
  },
  {
    key: "expiration",
    title: "Expiration monitoring",
    description:
      "Use smart alerts and dashboard queues before products pass their best date.",
    href: "/dashboard",
  },
  {
    key: "recipes",
    title: "AI recipe generation",
    description:
      "Get personalized recipe recommendations based on products that should be used soon.",
    href: "/dashboard/recipes",
  },
  {
    key: "shopping",
    title: "Shopping assistance",
    description:
      "Build lists around real gaps and avoid duplicate purchases.",
    href: "/dashboard/shopping",
  },
  {
    key: "waste",
    title: "Waste analytics",
    description:
      "Track waste patterns and connect insights back to inventory and meal planning.",
    href: "/dashboard/waste",
  },
];

export const sustainabilityStats = {
  coreWorkflows: "4",
  dashboardAreas: "7",
  scannerInputs: "3",
  sharedKitchen: "1",
};
