export const DASHBOARD_MODES = ["overview", "rescue", "planning", "insights"] as const;

export type DashboardMode = (typeof DASHBOARD_MODES)[number];

export const DEFAULT_DASHBOARD_MODE: DashboardMode = "overview";

export const DASHBOARD_MODE_LABELS: Record<DashboardMode, string> = {
  overview: "Overview / Control",
  rescue: "Rescue",
  planning: "Planning",
  insights: "Insights",
};

export const DASHBOARD_MODE_BADGES: Record<DashboardMode, string> = {
  overview: "Overview Mode",
  rescue: "Rescue Mode",
  planning: "Planning Mode",
  insights: "Insights Mode",
};

export const DASHBOARD_MODE_DESCRIPTIONS: Record<DashboardMode, string> = {
  overview: "A clean control view for inventory, expiration dates, shopping, and waste status.",
  rescue: "Prioritize items expiring soon, quick recipes, and products that need action today.",
  planning: "Center the dashboard around meal planning, missing ingredients, and shopping flow.",
  insights: "Surface waste habits, savings signals, and patterns worth improving.",
};

export const DASHBOARD_MODE_THEMES: Record<
  DashboardMode,
  {
    appShellClass: string;
    sidebarClass: string;
    headerClass: string;
    headerBadgeClass: string;
    searchInputClass: string;
    switcherClass: string;
    switcherLabelClass: string;
    switcherSelectClass: string;
    switcherDescriptionClass: string;
    switcherStatusClass: string;
    sidebarActiveLinkClass: string;
    sidebarActiveMarkerClass: string;
    sidebarInactiveLinkClass: string;
    sidebarInactiveMarkerClass: string;
    primaryButtonClass: string;
    secondaryButtonClass: string;
    linkClass: string;
    statsCardClass: string;
    statsMarkerClass: string;
    quickActionCardClass: string;
    quickActionIconClass: string;
    panelBadgeClass: string;
  }
> = {
  overview: {
    appShellClass: "bg-emerald-50",
    sidebarClass: "border-emerald-100 bg-white/95",
    headerClass: "border-emerald-100 bg-emerald-50/95",
    headerBadgeClass: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    searchInputClass:
      "border-emerald-100 bg-white/80 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100",
    switcherClass: "border-emerald-100 bg-emerald-50",
    switcherLabelClass: "text-emerald-700",
    switcherSelectClass:
      "border-emerald-200 bg-white text-emerald-950 focus:border-emerald-500 focus:ring-emerald-100",
    switcherDescriptionClass: "text-emerald-800",
    switcherStatusClass: "text-emerald-800",
    sidebarActiveLinkClass: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100",
    sidebarActiveMarkerClass: "bg-emerald-600 text-white",
    sidebarInactiveLinkClass: "text-slate-600 hover:bg-emerald-50/70 hover:text-slate-950",
    sidebarInactiveMarkerClass: "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:text-emerald-700",
    primaryButtonClass: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondaryButtonClass: "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
    linkClass: "text-emerald-700 hover:text-emerald-800",
    statsCardClass: "hover:border-emerald-200",
    statsMarkerClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    quickActionCardClass: "hover:border-emerald-200 hover:bg-emerald-50",
    quickActionIconClass: "bg-white text-emerald-700 ring-1 ring-slate-200 group-hover:ring-emerald-200",
    panelBadgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
  rescue: {
    appShellClass: "bg-amber-50",
    sidebarClass: "border-amber-100 bg-white/95",
    headerClass: "border-amber-100 bg-amber-50/95",
    headerBadgeClass: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    searchInputClass:
      "border-amber-100 bg-white/85 focus:border-amber-500 focus:bg-white focus:ring-amber-100",
    switcherClass: "border-amber-100 bg-amber-50",
    switcherLabelClass: "text-amber-800",
    switcherSelectClass:
      "border-amber-200 bg-white text-amber-950 focus:border-amber-500 focus:ring-amber-100",
    switcherDescriptionClass: "text-amber-900",
    switcherStatusClass: "text-amber-800",
    sidebarActiveLinkClass: "bg-amber-50 text-amber-900 ring-1 ring-amber-100",
    sidebarActiveMarkerClass: "bg-amber-500 text-slate-950",
    sidebarInactiveLinkClass: "text-slate-600 hover:bg-amber-50/80 hover:text-slate-950",
    sidebarInactiveMarkerClass: "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:text-amber-700",
    primaryButtonClass: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    secondaryButtonClass: "border border-amber-200 bg-white text-amber-900 hover:bg-amber-50",
    linkClass: "text-amber-800 hover:text-amber-900",
    statsCardClass: "hover:border-amber-200",
    statsMarkerClass: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
    quickActionCardClass: "hover:border-amber-200 hover:bg-amber-50",
    quickActionIconClass: "bg-white text-amber-700 ring-1 ring-slate-200 group-hover:ring-amber-200",
    panelBadgeClass: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  },
  planning: {
    appShellClass: "bg-cyan-50",
    sidebarClass: "border-cyan-100 bg-white/95",
    headerClass: "border-cyan-100 bg-cyan-50/95",
    headerBadgeClass: "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200",
    searchInputClass: "border-cyan-100 bg-white/85 focus:border-cyan-500 focus:bg-white focus:ring-cyan-100",
    switcherClass: "border-cyan-100 bg-cyan-50",
    switcherLabelClass: "text-cyan-800",
    switcherSelectClass: "border-cyan-200 bg-white text-cyan-950 focus:border-cyan-500 focus:ring-cyan-100",
    switcherDescriptionClass: "text-cyan-900",
    switcherStatusClass: "text-cyan-800",
    sidebarActiveLinkClass: "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-100",
    sidebarActiveMarkerClass: "bg-cyan-600 text-white",
    sidebarInactiveLinkClass: "text-slate-600 hover:bg-cyan-50/80 hover:text-slate-950",
    sidebarInactiveMarkerClass: "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:text-cyan-700",
    primaryButtonClass: "bg-cyan-600 text-white hover:bg-cyan-700",
    secondaryButtonClass: "border border-cyan-200 bg-white text-cyan-900 hover:bg-cyan-50",
    linkClass: "text-cyan-800 hover:text-cyan-900",
    statsCardClass: "hover:border-cyan-200",
    statsMarkerClass: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100",
    quickActionCardClass: "hover:border-cyan-200 hover:bg-cyan-50",
    quickActionIconClass: "bg-white text-cyan-700 ring-1 ring-slate-200 group-hover:ring-cyan-200",
    panelBadgeClass: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100",
  },
  insights: {
    appShellClass: "bg-slate-100",
    sidebarClass: "border-violet-100 bg-white/95",
    headerClass: "border-violet-100 bg-slate-100/95",
    headerBadgeClass: "bg-violet-100 text-violet-800 ring-1 ring-violet-200",
    searchInputClass:
      "border-violet-100 bg-white/85 focus:border-violet-500 focus:bg-white focus:ring-violet-100",
    switcherClass: "border-violet-100 bg-violet-50",
    switcherLabelClass: "text-violet-800",
    switcherSelectClass:
      "border-violet-200 bg-white text-violet-950 focus:border-violet-500 focus:ring-violet-100",
    switcherDescriptionClass: "text-violet-900",
    switcherStatusClass: "text-violet-800",
    sidebarActiveLinkClass: "bg-violet-50 text-violet-900 ring-1 ring-violet-100",
    sidebarActiveMarkerClass: "bg-violet-600 text-white",
    sidebarInactiveLinkClass: "text-slate-600 hover:bg-violet-50/80 hover:text-slate-950",
    sidebarInactiveMarkerClass: "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:text-violet-700",
    primaryButtonClass: "bg-violet-600 text-white hover:bg-violet-700",
    secondaryButtonClass: "border border-violet-200 bg-white text-violet-900 hover:bg-violet-50",
    linkClass: "text-violet-800 hover:text-violet-900",
    statsCardClass: "hover:border-violet-200",
    statsMarkerClass: "bg-violet-50 text-violet-800 ring-1 ring-violet-100",
    quickActionCardClass: "hover:border-violet-200 hover:bg-violet-50",
    quickActionIconClass: "bg-white text-violet-700 ring-1 ring-slate-200 group-hover:ring-violet-200",
    panelBadgeClass: "bg-violet-50 text-violet-800 ring-1 ring-violet-100",
  },
};

const LEGACY_DASHBOARD_MODE_MAP: Record<string, DashboardMode> = {
  low_waste: "rescue",
  meal_planning: "planning",
  shopping: "planning",
  inventory: "overview",
};

export function isDashboardMode(value: unknown): value is DashboardMode {
  return typeof value === "string" && DASHBOARD_MODES.includes(value as DashboardMode);
}

export function normalizeDashboardMode(value: unknown): DashboardMode {
  if (isDashboardMode(value)) return value;
  if (typeof value === "string" && LEGACY_DASHBOARD_MODE_MAP[value]) {
    return LEGACY_DASHBOARD_MODE_MAP[value];
  }

  return DEFAULT_DASHBOARD_MODE;
}
