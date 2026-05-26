import Link from "next/link";
import {
  ArrowRight,
  Barcode,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Leaf,
  ShoppingBasket,
} from "lucide-react";
import SectionWrapper from "./SectionWrapper";

const heroActions = [
  { label: "Inventory", href: "/dashboard/inventory", icon: ClipboardList },
  { label: "Scanner", href: "/dashboard/scanning", icon: Barcode },
  { label: "Recipes", href: "/dashboard/recipes", icon: ChefHat },
  { label: "Shopping", href: "/dashboard/shopping", icon: ShoppingBasket },
];

const previewRows = [
  { label: "Greek yogurt", meta: "Use today", status: "Recipe match", tone: "amber" },
  { label: "Spinach", meta: "2 days left", status: "Meal plan", tone: "emerald" },
  { label: "Rice", meta: "Pantry staple", status: "In stock", tone: "slate" },
];

const workflowLinks = [
  { label: "Add product", href: "/dashboard/inventory" },
  { label: "Generate recipe", href: "/dashboard/recipes" },
  { label: "Plan week", href: "/dashboard/meal-plan" },
];

export default function HeroSection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const primaryHref = isAuthenticated ? "/dashboard" : "/register";
  const primaryLabel = isAuthenticated ? "Open dashboard" : "Start free";
  const secondaryHref = isAuthenticated ? "/dashboard/inventory" : "/login";
  const secondaryLabel = isAuthenticated ? "Manage inventory" : "Log in";

  return (
    <SectionWrapper className="pt-16 sm:pt-24 lg:pt-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:items-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
            <Leaf className="h-4 w-4" aria-hidden="true" />
            AI household waste assistant
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            WasteLessAI
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Track what is in your kitchen, act before food expires, generate recipes from available ingredients, and shop with less guesswork.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              {secondaryLabel}
            </Link>
            <Link
              href="/dashboard/scanning"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              Scan products
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {heroActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">Today in your kitchen</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Use-first workflow</h2>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                AI ready
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-3">
              {previewRows.map((row) => (
                <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{row.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.meta}</p>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        row.tone === "amber"
                          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
                          : row.tone === "emerald"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            : "bg-white text-slate-700 ring-1 ring-slate-200"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {workflowLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border border-slate-200 px-3 py-3 text-center text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                <p className="text-sm leading-6 text-emerald-900">
                  Suggested next step: cook the spinach bowl tonight, add rice to the plan, and skip duplicate shopping items.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-950">7</p>
                <p className="text-xs text-slate-500">expiring soon</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">3</p>
                <p className="text-xs text-slate-500">recipe ideas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-950">12</p>
                <p className="text-xs text-slate-500">items saved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
