"use client";

import React from "react";
import Button from "./Button";
import SectionWrapper from "./SectionWrapper";

export default function HeroSection() {
  return (
    <SectionWrapper className="pt-20 sm:pt-32 lg:pt-40">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Column - Content */}
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full dark:bg-emerald-900/30">
            <span className="text-2xl">🤖</span>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              AI-Powered Platform
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Stop Wasting Food,{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                Start Saving Money
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              WasteLessAI uses artificial intelligence to help you track your
              pantry, monitor expiration dates, and get personalized recipe
              recommendations. Reduce food waste, cut grocery costs, and eat
              smarter.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                window.open("https://app.wastelessai.com/signup", "_blank")
              }
            >
              Start Free Trial
              <span>→</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const element = document.getElementById("how-it-works");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="space-y-3 pt-8 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Trusted by thousands of households
            </p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-2xl font-bold text-emerald-600">50K+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Active Users
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">2M+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Items Tracked
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">$10M+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Saved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Visual */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-md">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-blue-200 dark:from-emerald-900 dark:to-blue-900 rounded-3xl blur-3xl opacity-30"></div>

            {/* Phone Mockup */}
            <div className="relative">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl h-96 flex items-center justify-center">
                  <div className="text-center text-white space-y-4 px-4">
                    <div className="text-5xl">🥕</div>
                    <p className="text-sm font-semibold">Smart Inventory</p>
                    <p className="text-xs opacity-90">
                      Track expiration dates & get alerts
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -left-12 -bottom-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border border-slate-200 dark:border-slate-700 max-w-xs">
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                  AI Recipe Suggestion
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tomato Basil Pasta uses 3 items expiring soon
                </p>
              </div>

              <div className="absolute -right-12 bottom-24 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border border-slate-200 dark:border-slate-700 max-w-xs">
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                  📊 Weekly Savings
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  You saved <span className="font-bold text-emerald-600">$12.50</span> this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
