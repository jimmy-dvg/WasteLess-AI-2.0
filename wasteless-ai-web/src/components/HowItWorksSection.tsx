import React from "react";
import SectionWrapper from "./SectionWrapper";

const steps = [
  {
    number: "01",
    title: "Add Products",
    description:
      "Quickly scan barcodes or manually add products to your digital pantry. Organize items by location (pantry, fridge, freezer).",
    icon: "📸",
    details: [
      "Barcode scanning",
      "Manual entry",
      "Auto-detect expiration",
      "Bulk upload",
    ],
  },
  {
    number: "02",
    title: "Track Freshness",
    description:
      "Our AI monitors all your items and alerts you before they expire. Stay on top of what needs to be used soon.",
    icon: "🔔",
    details: [
      "Smart notifications",
      "Custom alerts",
      "Expiry calendar",
      "Usage tips",
    ],
  },
  {
    number: "03",
    title: "Get AI Recommendations",
    description:
      "Receive personalized recipe suggestions and shopping tips to reduce waste and save money on your groceries.",
    icon: "💡",
    details: [
      "Recipe suggestions",
      "Shopping lists",
      "Cost optimization",
      "Meal planning",
    ],
  },
];

export default function HowItWorksSection() {
  return (
    <SectionWrapper id="how-it-works">
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
          How It Works
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Get started in three simple steps and start reducing food waste
          immediately.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            {/* Connector Line (hidden on mobile) */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-24 left-1/2 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent -ml-1/2 -mr-1/2"></div>
            )}

            <div className="relative space-y-6">
              {/* Step Number Circle */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-600 relative z-10">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {step.number}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-4xl">{step.icon}</div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-2 pt-4">
                {step.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-emerald-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Mobile */}
      <div className="md:hidden mt-12 space-y-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
              {index < steps.length - 1 && (
                <div className="w-1 h-12 bg-gradient-to-b from-emerald-600 to-slate-200"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
