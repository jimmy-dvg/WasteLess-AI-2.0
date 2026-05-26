import Link from "next/link";
import { ArrowRight, Barcode, ChefHat, ClipboardList } from "lucide-react";
import SectionWrapper from "./SectionWrapper";

const actionLinks = [
  {
    label: "Add inventory",
    href: "/dashboard/inventory",
    icon: ClipboardList,
  },
  {
    label: "Scan items",
    href: "/dashboard/scanning",
    icon: Barcode,
  },
  {
    label: "Generate recipes",
    href: "/dashboard/recipes",
    icon: ChefHat,
  },
];

export default function CTASection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const primaryHref = isAuthenticated ? "/dashboard/inventory" : "/register";
  const primaryLabel = isAuthenticated ? "Add inventory" : "Create account";
  const secondaryHref = isAuthenticated ? "/dashboard" : "/login";
  const secondaryLabel = isAuthenticated ? "Open dashboard" : "Log in";

  return (
    <SectionWrapper className="py-16 sm:py-20 lg:py-24">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">Ready when you are</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              Start with one product, then let the system connect the rest.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-emerald-900">
              Add a few ingredients, generate recipes from what is available, and use the shopping list only for the gaps.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {actionLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white p-4 text-sm font-bold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
