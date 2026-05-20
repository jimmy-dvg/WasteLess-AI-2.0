export const DASHBOARD_MODES = ["low_waste", "meal_planning", "shopping", "inventory"] as const;

export type DashboardMode = (typeof DASHBOARD_MODES)[number];

export const DEFAULT_DASHBOARD_MODE: DashboardMode = "low_waste";

export const DASHBOARD_MODE_LABELS: Record<DashboardMode, string> = {
  low_waste: "Low-waste mode",
  meal_planning: "Meal planning mode",
  shopping: "Shopping mode",
  inventory: "Inventory mode",
};

export const DASHBOARD_MODE_DESCRIPTIONS: Record<DashboardMode, string> = {
  low_waste: "Prioritize items that expire soon before planning your next grocery run.",
  meal_planning: "Plan meals from what the household already has on hand.",
  shopping: "Focus on low-stock essentials and missing meal-plan ingredients.",
  inventory: "Keep pantry, fridge, and freezer records clean and up to date.",
};

export function isDashboardMode(value: unknown): value is DashboardMode {
  return typeof value === "string" && DASHBOARD_MODES.includes(value as DashboardMode);
}
