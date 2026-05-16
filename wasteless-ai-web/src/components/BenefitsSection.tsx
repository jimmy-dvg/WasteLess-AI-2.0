import React from "react";
import SectionWrapper from "./SectionWrapper";

const benefits = [
  {
    title: "💰 Save Money",
    description:
      "Users save an average of $50-100 per month by reducing food waste and avoiding duplicate purchases.",
    stats: "Save $600-1,200/year",
  },
  {
    title: "🌍 Reduce Waste",
    description:
      "Cut your household food waste by up to 60%. Every item tracked is food saved from the landfill.",
    stats: "Prevent 500+ lbs/year",
  },
  {
    title: "🛒 Smarter Shopping",
    description:
      "AI-powered shopping lists that know what you need. Stop buying what you already have.",
    stats: "30% fewer impulse buys",
  },
  {
    title: "📚 Better Organization",
    description:
          "Know exactly what is in your kitchen. Find items faster, plan meals better, stress less.",
    stats: "5 min to find anything",
  },
];

export default function BenefitsSection() {
  return (
    <SectionWrapper id="benefits" dark>
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
          Real Benefits for Real Families
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Join thousands of households reducing waste and saving money every
          day.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="group p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-emerald-500 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20"
          >
            {/* Icon & Title */}
            <h3 className="text-2xl font-bold mb-3 group-hover:text-emerald-400 transition-colors">
              {benefit.title}
            </h3>

            {/* Description */}
            <p className="text-slate-300 mb-6 leading-relaxed">
              {benefit.description}
            </p>

            {/* Stats Highlight */}
            <div className="inline-block">
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-4 py-2">
                <p className="text-sm font-bold text-emerald-400">
                  {benefit.stats}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Impact Stats */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-slate-800 border border-slate-700 rounded-2xl">
        <div className="text-center">
          <p className="text-3xl md:text-4xl font-bold text-emerald-400">50K+</p>
          <p className="text-sm text-slate-300 mt-2">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-3xl md:text-4xl font-bold text-emerald-400">2.5M</p>
          <p className="text-sm text-slate-300 mt-2">Items Tracked</p>
        </div>
        <div className="text-center">
          <p className="text-3xl md:text-4xl font-bold text-emerald-400">10M+</p>
          <p className="text-sm text-slate-300 mt-2">Dollars Saved</p>
        </div>
        <div className="text-center">
          <p className="text-3xl md:text-4xl font-bold text-emerald-400">5M+</p>
          <p className="text-sm text-slate-300 mt-2">Lbs Waste Prevented</p>
        </div>
      </div>

      {/* Testimonial */}
      <div className="mt-16 bg-slate-800 border border-slate-700 rounded-2xl p-8 md:p-12 text-center space-y-6">
        <div className="flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-lg italic text-slate-300 max-w-2xl mx-auto">
          WasteLessAI has completely changed how our family shops. We save
          money, waste less food, and actually enjoy our meals more. It is like
          having a personal nutritionist in your pocket.
        </p>
        <div>
          <p className="font-semibold">Sarah Johnson</p>
          <p className="text-sm text-slate-400">Mother of 2, Portland, OR</p>
        </div>
      </div>
    </SectionWrapper>
  );
}
