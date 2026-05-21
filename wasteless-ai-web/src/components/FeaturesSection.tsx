import Link from "next/link";
import {
  Barcode,
  BellRing,
  CalendarClock,
  ChefHat,
  ClipboardList,
  Leaf,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import SectionWrapper from "./SectionWrapper";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight: string;
  href: string;
  action: string;
};

const features: Feature[] = [
  {
    icon: ClipboardList,
    title: "Inventory control",
    description: "Track quantities, storage locations, purchase dates, and expiration dates across the household.",
    highlight: "Core workflow",
    href: "/dashboard/inventory",
    action: "Open inventory",
  },
  {
    icon: BellRing,
    title: "Expiration monitoring",
    description: "Surface use-today and expiring-soon items before they become waste.",
    highlight: "Smart alerts",
    href: "/dashboard",
    action: "View overview",
  },
  {
    icon: ChefHat,
    title: "AI recipe generation",
    description: "Generate recipes around current inventory, saved preferences, and missing ingredients.",
    highlight: "AI powered",
    href: "/dashboard/recipes",
    action: "Generate recipes",
  },
  {
    icon: ShoppingBasket,
    title: "Shopping assistance",
    description: "Build lists from missing recipe ingredients and avoid buying what is already at home.",
    highlight: "Lean lists",
    href: "/dashboard/shopping",
    action: "Open shopping",
  },
  {
    icon: CalendarClock,
    title: "Meal planning",
    description: "Plan a week of meals that uses urgent inventory first and keeps shopping focused.",
    highlight: "Weekly planning",
    href: "/dashboard/meal-plan",
    action: "Plan meals",
  },
  {
    icon: Barcode,
    title: "Receipt and barcode scanning",
    description: "Import products faster from barcodes, receipts, and AI photo recognition.",
    highlight: "Fast capture",
    href: "/dashboard/scanning",
    action: "Open scanner",
  },
  {
    icon: Leaf,
    title: "Waste analytics",
    description: "Log discarded products and learn which habits or categories create avoidable loss.",
    highlight: "Reduce waste",
    href: "/dashboard/waste",
    action: "Review waste",
  },
];

export default function FeaturesSection() {
  return (
    <SectionWrapper id="features" dark className="py-16 sm:py-20 lg:py-24">
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm font-bold uppercase tracking-normal text-emerald-300">Product map</p>
        <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Features that connect into one kitchen flow</h2>
        <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300">
          WasteLessAI works best when inventory, recipes, meal planning, shopping, and waste tracking feed each other.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-lg border border-slate-700 bg-slate-800 p-6 transition hover:border-emerald-400 hover:bg-slate-800/80"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-emerald-300 ring-1 ring-slate-700">
                  {feature.highlight}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
              <p className="mt-3 min-h-20 text-sm leading-6 text-slate-300">{feature.description}</p>
              <span className="mt-5 inline-flex text-sm font-bold text-emerald-300 group-hover:text-emerald-200">
                {feature.action}
              </span>
            </Link>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
