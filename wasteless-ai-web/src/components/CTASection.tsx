
"use client";

import React from "react";
import Button from "./Button";
import SectionWrapper from "./SectionWrapper";

export default function CTASection() {
  return (
    <SectionWrapper className="py-20 sm:py-28 lg:py-36">
      <div className="max-w-3xl mx-auto">
        {/* Main CTA Card */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-12 md:p-16 text-center space-y-8 shadow-2xl">
          {/* Icon */}
          <div className="text-6xl inline-block">✨</div>

          {/* Headline */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Ready to Stop Wasting Food?
            </h2>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
              Join thousands of families reducing waste and saving money. Start
              your free trial today—no credit card required.
            </p>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8 border-y border-emerald-400/30">
            <div className="space-y-1">
              <p className="font-semibold text-white text-lg">Free Forever</p>
              <p className="text-emerald-100 text-sm">Basic features at no cost</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white text-lg">No Ads</p>
              <p className="text-emerald-100 text-sm">Clean, focused experience</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white text-lg">AI-Powered</p>
              <p className="text-emerald-100 text-sm">Smart recommendations</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                window.open("https://app.wastelessai.com/signup", "_blank")
              }
            >
              Get Started Free
              <span>→</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                window.open("https://calendly.com/wastelessai/demo", "_blank");
              }}
            >
              Book a Demo
            </Button>
          </div>

          {/* Trust Footer */}
          <div className="text-emerald-100 text-sm">
            <p>💪 100% no credit card required</p>
            <p>✓ Cancel anytime with one click</p>
          </div>
        </div>

        {/* Backup CTA */}
        <div className="mt-12 p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Questions? We're here to help
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Our team is available 24/7 to help you get started and answer
                any questions.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  window.location.href = "mailto:support@wastelessai.com";
                }}
              >
                Email Us
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  window.open("https://chat.wastelessai.com", "_blank");
                }}
              >
                Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
