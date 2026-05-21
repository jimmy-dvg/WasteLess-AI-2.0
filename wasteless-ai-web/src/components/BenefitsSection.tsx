import { BookOpen, Leaf, PiggyBank, ShoppingBasket, Star, type LucideIcon } from "lucide-react";
import SectionWrapper from "./SectionWrapper";

type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
  stats: string;
};

const benefits: Benefit[] = [
  {
    icon: PiggyBank,
    title: "Save money",
    description: "Reduce duplicate purchases and make better use of products already in the kitchen.",
    stats: "Fewer wasted groceries",
  },
  {
    icon: Leaf,
    title: "Reduce waste",
    description: "Use expiration visibility and meal planning to keep good food out of the trash.",
    stats: "Use-first habits",
  },
  {
    icon: ShoppingBasket,
    title: "Shop smarter",
    description: "Build shopping lists from real pantry gaps instead of memory or guesswork.",
    stats: "Cleaner lists",
  },
  {
    icon: BookOpen,
    title: "Stay organized",
    description: "Find what you own, where it is stored, and what needs attention next.",
    stats: "Faster planning",
  },
];

export default function BenefitsSection() {
  return (
    <SectionWrapper id="benefits" dark className="py-16 sm:py-20 lg:py-24">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-normal text-emerald-300">Why it matters</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">A calmer way to run the household kitchen</h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-300">
          The goal is not another chore. The goal is a lightweight system that makes waste-reducing decisions obvious.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <article key={benefit.title} className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{benefit.description}</p>
                  <p className="mt-4 inline-flex rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                    {benefit.stats}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 grid gap-4 rounded-lg border border-slate-700 bg-slate-800 p-6 text-center sm:grid-cols-4">
        <div>
          <p className="text-3xl font-bold text-emerald-300">4</p>
          <p className="mt-1 text-sm text-slate-300">core workflows</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-emerald-300">7</p>
          <p className="mt-1 text-sm text-slate-300">dashboard areas</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-emerald-300">3</p>
          <p className="mt-1 text-sm text-slate-300">scanner inputs</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-emerald-300">1</p>
          <p className="mt-1 text-sm text-slate-300">shared kitchen view</p>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
        <div className="flex justify-center gap-1 text-amber-300">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-5 w-5 fill-current" aria-hidden="true" />
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
          WasteLessAI is designed around the moments that usually create waste: forgotten items, duplicate shopping, and late meal planning.
        </p>
      </div>
    </SectionWrapper>
  );
}
