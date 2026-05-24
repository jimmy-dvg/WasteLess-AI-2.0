import EmptyState from "@/components/dashboard/EmptyState";
import ErrorState from "@/components/dashboard/ErrorState";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getDashboardOverview } from "@/db/queries/dashboard";
import {
  DASHBOARD_MODE_BADGES,
  DASHBOARD_MODE_THEMES,
  DEFAULT_DASHBOARD_MODE,
  type DashboardMode,
} from "@/features/dashboard-mode/constants";
import { getDashboardModeForUser } from "@/features/dashboard-mode/services/dashboard-mode.service";
import { requireUser } from "@/lib/auth";
import { formatDate, formatRelativeExpiration } from "@/lib/dashboard-utils";
import { Barcode, CalendarClock, ChefHat, ClipboardList, Leaf, ShoppingBasket } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardOverviewData = Awaited<ReturnType<typeof getDashboardOverview>>;
type StatCardKey = "totalProducts" | "expiringSoon" | "expiredItems" | "categoriesCount";
type QuickActionKey = "addInventory" | "reviewExpiring" | "scanProducts" | "generateRecipes" | "planWeek" | "shopGaps" | "reviewWaste";

const STAT_CARD_ORDER: Record<DashboardMode, StatCardKey[]> = {
  overview: ["totalProducts", "expiringSoon", "expiredItems", "categoriesCount"],
  rescue: ["expiringSoon", "expiredItems", "totalProducts", "categoriesCount"],
  planning: ["totalProducts", "categoriesCount", "expiringSoon", "expiredItems"],
  insights: ["expiredItems", "expiringSoon", "categoriesCount", "totalProducts"],
};

const QUICK_ACTION_ORDER: Record<DashboardMode, QuickActionKey[]> = {
  overview: ["addInventory", "scanProducts", "generateRecipes", "planWeek", "shopGaps", "reviewWaste"],
  rescue: ["generateRecipes", "reviewExpiring", "planWeek", "scanProducts", "shopGaps", "reviewWaste"],
  planning: ["planWeek", "shopGaps", "generateRecipes", "addInventory", "scanProducts", "reviewWaste"],
  insights: ["reviewWaste", "reviewExpiring", "generateRecipes", "planWeek", "shopGaps", "scanProducts"],
};

const DASHBOARD_COPY: Record<
  DashboardMode,
  {
    description: string;
    primaryCta: { href: string; label: string };
    secondaryCta: { href: string; label: string };
    quickActionsTitle: string;
    quickActionsDescription: string;
    quickActionsLink: { href: string; label: string };
    inventoryTitle: string;
    inventoryDescription: string;
    inventoryEmptyTitle: string;
    inventoryEmptyDescription: string;
    inventoryAction: { href: string; label: string };
    insightsTitle: string;
    insightsDescription: string;
    modeInsight: (data: DashboardOverviewData) => string;
  }
> = {
  overview: {
    description:
      "Keep your household inventory visible, act on expiration dates, and plan meals from what you already own.",
    primaryCta: { href: "/dashboard/inventory", label: "Manage inventory" },
    secondaryCta: { href: "/dashboard/scanning", label: "Scan products" },
    quickActionsTitle: "Quick actions",
    quickActionsDescription: "Start the most common waste-reduction workflows from one place.",
    quickActionsLink: { href: "/dashboard/recipes", label: "Smart suggestions" },
    inventoryTitle: "Recent inventory",
    inventoryDescription: "Latest items and expiration status",
    inventoryEmptyTitle: "No inventory yet",
    inventoryEmptyDescription: "Add products to start tracking quantities, locations, and expiration dates.",
    inventoryAction: { href: "/dashboard/inventory", label: "Add product" },
    insightsTitle: "Smart insights",
    insightsDescription: "Generated from household activity",
    modeInsight: (data) =>
      `${data.stats.totalProducts} product${data.stats.totalProducts === 1 ? "" : "s"} are tracked across your household.`,
  },
  rescue: {
    description:
      "Focus on items that expire soon, find fast recipe ideas, and move priority products out of the risk zone.",
    primaryCta: { href: "/dashboard/recipes", label: "Generate rescue recipes" },
    secondaryCta: { href: "/dashboard/inventory?status=expiring", label: "Review expiring items" },
    quickActionsTitle: "Rescue actions",
    quickActionsDescription: "Use what is closest to expiring before planning the next shop.",
    quickActionsLink: { href: "/dashboard/inventory?status=expiring", label: "Expiring queue" },
    inventoryTitle: "Priority products",
    inventoryDescription: "Items expiring soon, ordered by the nearest date",
    inventoryEmptyTitle: "No rescue items right now",
    inventoryEmptyDescription: "Nothing expires in the next 7 days. Keep scanning new products so the queue stays accurate.",
    inventoryAction: { href: "/dashboard/recipes", label: "Open recipes" },
    insightsTitle: "Rescue notes",
    insightsDescription: "Signals for what to use first",
    modeInsight: (data) =>
      data.expiringSoonItems[0]
        ? `${data.expiringSoonItems[0].name} should be used first: ${formatRelativeExpiration(
            data.expiringSoonItems[0].expirationDate
          ).toLowerCase()}.`
        : "The next 7 days look clear, so this is a good time to plan meals around older pantry items.",
  },
  planning: {
    description:
      "Build meals around current inventory, turn missing ingredients into shopping tasks, and keep the week organized.",
    primaryCta: { href: "/dashboard/meal-plan", label: "Plan meals" },
    secondaryCta: { href: "/dashboard/shopping", label: "Open shopping list" },
    quickActionsTitle: "Planning actions",
    quickActionsDescription: "Move from meals to missing ingredients without losing inventory context.",
    quickActionsLink: { href: "/dashboard/meal-plan", label: "Smart meal plan" },
    inventoryTitle: "Inventory anchors",
    inventoryDescription: "Recent products to consider while planning meals",
    inventoryEmptyTitle: "No planning inventory yet",
    inventoryEmptyDescription: "Add pantry, fridge, or freezer items so meal planning can use real household stock.",
    inventoryAction: { href: "/dashboard/inventory", label: "Add inventory" },
    insightsTitle: "Planning insights",
    insightsDescription: "Signals for meals and shopping",
    modeInsight: (data) =>
      `${data.stats.expiringSoon} expiring item${data.stats.expiringSoon === 1 ? "" : "s"} can shape the next meal plan before you shop.`,
  },
  insights: {
    description:
      "Review waste habits, expiration pressure, and organization patterns so the household can improve over time.",
    primaryCta: { href: "/dashboard/waste", label: "Review waste" },
    secondaryCta: { href: "/dashboard/inventory?status=expired", label: "Check expired items" },
    quickActionsTitle: "Insight actions",
    quickActionsDescription: "Jump into the workflows that explain where waste starts and how to reduce it.",
    quickActionsLink: { href: "/dashboard/waste", label: "Waste dashboard" },
    inventoryTitle: "Inventory signals",
    inventoryDescription: "Recent products that may explain changing household patterns",
    inventoryEmptyTitle: "No inventory signals yet",
    inventoryEmptyDescription: "Add inventory and log waste events to build stronger household insights.",
    inventoryAction: { href: "/dashboard/inventory", label: "Add product" },
    insightsTitle: "Behavior insights",
    insightsDescription: "Waste, expiration, and organization signals",
    modeInsight: (data) =>
      data.stats.expiredItems > 0
        ? `${data.stats.expiredItems} expired item${data.stats.expiredItems === 1 ? "" : "s"} may point to a planning or shopping habit worth adjusting.`
        : "No expired tracked items are currently pressuring the household.",
  },
};

export default async function DashboardPage() {
  const user = await requireUser();
  let data: DashboardOverviewData;
  let dashboardMode = DEFAULT_DASHBOARD_MODE;

  try {
    [data, dashboardMode] = await Promise.all([
      getDashboardOverview(user.id),
      getDashboardModeForUser(user.id),
    ]);
  } catch {
    return <ErrorState />;
  }

  const theme = DASHBOARD_MODE_THEMES[dashboardMode];
  const copy = DASHBOARD_COPY[dashboardMode];
  const firstName = user.name.split(" ")[0] || user.name;

  const statCardsByKey = {
    totalProducts: {
      label: "Total products",
      value: data.stats.totalProducts,
      description: "Tracked across pantry, fridge, and freezer",
      marker: "P",
    },
    expiringSoon: {
      label: "Expiring soon",
      value: data.stats.expiringSoon,
      description: "Items with dates in the next 7 days",
      marker: "E",
    },
    expiredItems: {
      label: "Expired items",
      value: data.stats.expiredItems,
      description: "Needs review before meal planning",
      marker: "X",
    },
    categoriesCount: {
      label: "Categories",
      value: data.stats.categoriesCount,
      description: "Categories used to organize products",
      marker: "C",
    },
  };

  const statCards = STAT_CARD_ORDER[dashboardMode].map((key) => statCardsByKey[key]);

  const quickActionsByKey = {
    addInventory: {
      label: "Add inventory",
      description: "Track a new pantry, fridge, or freezer item.",
      href: "/dashboard/inventory#add-inventory-item",
      icon: ClipboardList,
    },
    reviewExpiring: {
      label: "Use soon",
      description: "Review products closest to their expiration date.",
      href: "/dashboard/inventory?status=expiring",
      icon: CalendarClock,
    },
    scanProducts: {
      label: "Scan products",
      description: "Use barcode, receipt, or photo import.",
      href: "/dashboard/scanning",
      icon: Barcode,
    },
    generateRecipes: {
      label: dashboardMode === "rescue" ? "Rescue recipes" : "Generate recipes",
      description:
        dashboardMode === "rescue"
          ? "Turn expiring ingredients into quick meal ideas."
          : "Use available ingredients in meal ideas.",
      href: "/dashboard/recipes",
      icon: ChefHat,
    },
    planWeek: {
      label: "Plan week",
      description: "Build meals around current inventory.",
      href: "/dashboard/meal-plan",
      icon: CalendarClock,
    },
    shopGaps: {
      label: "Shop gaps",
      description: "Review missing ingredients and open items.",
      href: "/dashboard/shopping",
      icon: ShoppingBasket,
    },
    reviewWaste: {
      label: "Review waste",
      description: "Find patterns in discarded products.",
      href: "/dashboard/waste",
      icon: Leaf,
    },
  };

  const quickActions = QUICK_ACTION_ORDER[dashboardMode].map((key) => quickActionsByKey[key]);
  const inventoryItems = dashboardMode === "rescue" ? data.expiringSoonItems : data.recentInventory;
  const inventoryHref = dashboardMode === "rescue" ? "/dashboard/inventory?status=expiring" : "/dashboard/inventory";
  const insightItems = [copy.modeInsight(data), ...data.insights];

  const inventoryPanel = (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{copy.inventoryTitle}</h2>
          <p className="text-sm text-slate-500">{copy.inventoryDescription}</p>
        </div>
        <Link href={inventoryHref} className={`text-sm font-semibold ${theme.linkClass}`}>
          View all
        </Link>
      </div>

      {inventoryItems.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title={copy.inventoryEmptyTitle}
            description={copy.inventoryEmptyDescription}
            action={
              <Link
                href={copy.inventoryAction.href}
                className={`inline-flex rounded-lg px-4 py-2 text-sm font-semibold transition ${theme.primaryButtonClass}`}
              >
                {copy.inventoryAction.label}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {inventoryItems.map((item) => (
            <article key={item.id} className="flex items-center gap-4 p-4 transition hover:bg-slate-50">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold ${theme.statsMarkerClass}`}>
                {item.name[0]?.toUpperCase() ?? "I"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="truncate text-sm font-semibold text-slate-950">{item.name}</h3>
                    <p className="text-xs capitalize text-slate-500">
                      {item.quantity} in {item.location}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(item.expirationDate)} - {formatRelativeExpiration(item.expirationDate)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const insightsPanel = (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{copy.insightsTitle}</h2>
          <p className="text-sm text-slate-500">{copy.insightsDescription}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.panelBadgeClass}`}>
          {DASHBOARD_MODE_BADGES[dashboardMode]}
        </span>
      </div>
      <ul className="mt-5 space-y-3">
        {insightItems.map((insight) => (
          <li key={insight} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {insight}
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={DASHBOARD_MODE_BADGES[dashboardMode]}
        eyebrowClassName={theme.linkClass}
        title={`Welcome back, ${firstName}`}
        description={copy.description}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={copy.primaryCta.href}
              className={`inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${theme.primaryButtonClass}`}
            >
              {copy.primaryCta.label}
            </Link>
            <Link
              href={copy.secondaryCta.href}
              className={`inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${theme.secondaryButtonClass}`}
            >
              {copy.secondaryCta.label}
            </Link>
          </div>
        }
      />

      <section aria-label="Dashboard overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatsCard
            key={card.label}
            {...card}
            className={theme.statsCardClass}
            markerClassName={theme.statsMarkerClass}
          />
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{copy.quickActionsTitle}</h2>
            <p className="text-sm text-slate-500">{copy.quickActionsDescription}</p>
          </div>
          <Link href={copy.quickActionsLink.href} className={`text-sm font-semibold ${theme.linkClass}`}>
            {copy.quickActionsLink.label}
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group rounded-lg border border-slate-200 bg-slate-50 p-4 transition ${theme.quickActionCardClass}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${theme.quickActionIconClass}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">{action.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        {dashboardMode === "insights" ? (
          <>
            {insightsPanel}
            {inventoryPanel}
          </>
        ) : (
          <>
            {inventoryPanel}
            {insightsPanel}
          </>
        )}
      </div>
    </div>
  );
}
