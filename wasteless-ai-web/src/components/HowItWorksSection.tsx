import { BellRing, Camera, CheckCircle2, Sparkles, type LucideIcon } from "lucide-react";
import SectionWrapper from "./SectionWrapper";

type Step = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  details: string[];
};

const steps: Step[] = [
  {
    number: "01",
    title: "Capture what you have",
    description: "Add products manually or use barcode, receipt, and photo scanning to build an accurate kitchen inventory.",
    icon: Camera,
    details: ["Barcode scanning", "Receipt OCR", "Photo recognition", "Manual entry"],
  },
  {
    number: "02",
    title: "Prioritize use-first items",
    description: "Expiration status, low stock, and household activity turn the inventory into an actionable queue.",
    icon: BellRing,
    details: ["Use-today alerts", "Expiring soon queue", "Location filters", "Household activity"],
  },
  {
    number: "03",
    title: "Turn inventory into meals",
    description: "Generate recipes, add missing items to shopping, and save a meal plan that updates as you cook.",
    icon: Sparkles,
    details: ["AI recipes", "Missing ingredients", "Weekly plan", "Waste insights"],
  },
];

export default function HowItWorksSection() {
  return (
    <SectionWrapper id="how-it-works" className="py-16 sm:py-20 lg:py-24">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">How it works</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl lg:text-5xl">
          From kitchen visibility to less waste
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
          The product flow is intentionally simple: capture products, act on urgency, then plan meals and shopping from the same data.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <article key={step.number} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-slate-400">{step.number}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              <ul className="mt-5 space-y-2">
                {step.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {detail}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
