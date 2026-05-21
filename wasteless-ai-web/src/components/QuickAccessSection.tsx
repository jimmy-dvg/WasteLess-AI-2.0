import Link from "next/link";
import {
  Barcode,
  CalendarClock,
  ChefHat,
  ClipboardList,
  Home,
  Leaf,
  ShoppingBasket,
  Users,
  type LucideIcon,
} from "lucide-react";
import SectionWrapper from "./SectionWrapper";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
};

const quickActions: QuickAction[] = [
  {
    title: "Inventory",
    description: "Add pantry, fridge, and freezer products with quantities and expiration dates.",
    href: "/dashboard/inventory",
    cta: "Manage items",
    icon: ClipboardList,
  },
  {
    title: "Scanner",
    description: "Import items from barcodes, receipts, and shelf photos before confirming them.",
    href: "/dashboard/scanning",
    cta: "Scan products",
    icon: Barcode,
  },
  {
    title: "AI recipes",
    description: "Turn expiring ingredients into recipe ideas that fit your preferences.",
    href: "/dashboard/recipes",
    cta: "Generate recipes",
    icon: ChefHat,
  },
  {
    title: "Meal plan",
    description: "Plan a week around what should be used first and what is missing.",
    href: "/dashboard/meal-plan",
    cta: "Plan meals",
    icon: CalendarClock,
  },
  {
    title: "Shopping list",
    description: "Buy only what your household needs and avoid duplicate purchases.",
    href: "/dashboard/shopping",
    cta: "Open list",
    icon: ShoppingBasket,
  },
  {
    title: "Waste tracking",
    description: "Log discarded items and spot repeat patterns that cost money.",
    href: "/dashboard/waste",
    cta: "Review waste",
    icon: Leaf,
  },
  {
    title: "Household",
    description: "Invite members and keep shared kitchen activity visible.",
    href: "/dashboard/household",
    cta: "Manage household",
    icon: Users,
  },
  {
    title: "Dashboard",
    description: "See urgent items, recent inventory, and smart insights in one place.",
    href: "/dashboard",
    cta: "View overview",
    icon: Home,
  },
];

export default function QuickAccessSection() {
  return (
    <SectionWrapper id="quick-access" className="py-12 sm:py-16 lg:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">Quick access</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Jump straight into the app</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Every shortcut opens a real WasteLessAI workflow. New users will be guided through login before the dashboard opens.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Create free account
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-950">{action.title}</h3>
              <p className="mt-2 min-h-16 text-sm leading-6 text-slate-600">{action.description}</p>
              <span className="mt-4 inline-flex text-sm font-bold text-emerald-700 group-hover:text-emerald-800">
                {action.cta}
              </span>
            </Link>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
