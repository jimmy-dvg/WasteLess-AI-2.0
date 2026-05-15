import React from "react";
import SectionWrapper from "./SectionWrapper";

const features = [
  {
    icon: "📦",
    title: "Pantry Tracking",
    description:
      "Add items to your digital pantry instantly. Track what you have, where it is, and when it was purchased.",
    highlight: "Real-time inventory",
  },
  {
    icon: "⏰",
    title: "Expiration Monitoring",
    description:
      "Get smart alerts before items expire. Never miss an expiration date and reduce food waste automatically.",
    highlight: "Smart notifications",
  },
  {
    icon: "🤖",
    title: "AI Recipe Generation",
    description:
      "Get personalized recipe recommendations based on items in your pantry that are expiring soon.",
    highlight: "AI-powered ideas",
  },
  {
    icon: "🛒",
    title: "Shopping Assistance",
    description:
      "Let AI analyze your pantry and suggest what to buy. Avoid duplicates and optimize your shopping list.",
    highlight: "Smart lists",
  },
  {
    icon: "📊",
    title: "Waste Analytics",
    description:
      "Track your waste patterns and get insights to reduce spending. See how much you've saved and contributed to sustainability.",
    highlight: "Data-driven insights",
  },
];

export default function FeaturesSection() {
  return (
    <SectionWrapper id="features" dark>
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
          Powerful Features for Smart Living
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Everything you need to reduce food waste and save money on groceries.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative p-8 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all duration-300 border border-slate-700 hover:border-emerald-500 dark:bg-slate-800 dark:border-slate-600"
          >
            {/* Accent Line */}
            <div className="absolute top-0 left-0 w-0 h-1 bg-emerald-500 rounded-full group-hover:w-12 transition-all duration-300"></div>

            {/* Icon */}
            <div className="text-5xl mb-4">{feature.icon}</div>

            {/* Content */}
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-slate-300 mb-4 leading-relaxed">
              {feature.description}
            </p>

            {/* Highlight Badge */}
            <div className="inline-block">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                ✨ {feature.highlight}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <p className="text-slate-300 mb-4">
          All features included in every plan
        </p>
        <div className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
          <span>✓ No limitations</span>
          <span className="text-slate-500">•</span>
          <span>✓ Always free</span>
          <span className="text-slate-500">•</span>
          <span>✓ Forever updated</span>
        </div>
      </div>
    </SectionWrapper>
  );
}
