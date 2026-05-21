import Link from "next/link";

const footerLinks = {
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
  Company: [
    { label: "About", href: "/about" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                WL
              </span>
              WasteLessAI
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
              AI-assisted inventory, meal planning, shopping, and waste tracking for households.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h2 className="text-sm font-bold text-slate-950">{section}</h2>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-600 hover:text-emerald-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} WasteLessAI. All rights reserved.</p>
          <p>Built for practical household waste reduction.</p>
        </div>
      </div>
    </footer>
  );
}
