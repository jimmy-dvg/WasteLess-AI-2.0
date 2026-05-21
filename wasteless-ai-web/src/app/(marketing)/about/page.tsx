import Link from "next/link";
import SectionWrapper from "@/components/SectionWrapper";

export const metadata = {
  title: "About WasteLessAI",
  description: "Learn about our mission to reduce food waste and save money for households worldwide.",
};

export default function AboutPage() {
  return (
    <SectionWrapper className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-emerald-700">About</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950 sm:text-5xl">WasteLessAI</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            We are building a household assistant that helps people see what they already have, cook it in time, and buy with less waste.
          </p>
        </div>

        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-2xl font-bold text-emerald-950">Our mission</h2>
          <p className="mt-3 leading-7 text-emerald-900">
            Empower every household to make sustainable choices with practical tools for inventory, expiration tracking, meal planning, shopping, and waste analysis.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-950">Our story</h2>
          <div className="space-y-4 leading-7 text-slate-600">
            <p>
              WasteLessAI started from a simple problem: most food waste happens because people lose track of what is already at home.
            </p>
            <p>
              The app connects inventory, AI recipes, meal planning, and shopping so each feature reinforces the same goal: fewer forgotten products and fewer unnecessary purchases.
            </p>
            <p>
              We focus on clear workflows, accessible UI, and useful AI that supports everyday decisions instead of adding more work.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-950">Our values</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                title: "Practical sustainability",
                description: "Small household decisions should add up without feeling like a lecture.",
              },
              {
                title: "Simplicity",
                description: "The fastest path should be the most useful path.",
              },
              {
                title: "Trust",
                description: "Inventory, household, and AI features must be clear about what they do.",
              },
              {
                title: "Continuous improvement",
                description: "The product should learn from real kitchen workflows and reduce friction over time.",
              },
            ].map((value) => (
              <article key={value.title} className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-950">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{value.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-600">Ready to join the mission?</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Create account
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100"
            >
              Open dashboard
            </Link>
          </div>
        </section>
      </div>
    </SectionWrapper>
  );
}
