import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "WasteLessAI - AI-Powered Food Waste Reduction",
  description:
    "Smart inventory tracking, expiration monitoring, and AI-powered recipe recommendations to reduce food waste and save money.",
  keywords:
    "food waste, meal planning, AI recipes, pantry tracking, sustainability",
  openGraph: {
    title: "WasteLessAI - Reduce Food Waste with AI",
    description:
      "Smart inventory tracking and AI-powered recipe recommendations to reduce food waste.",
    type: "website",
    url: "https://wastelessai.com",
    images: [
      {
        url: "https://wastelessai.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "WasteLessAI Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WasteLessAI - AI-Powered Food Waste Reduction",
    description:
      "Smart inventory tracking and AI-powered recipe recommendations to reduce food waste.",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-white text-gray-900 dark:bg-slate-950 dark:text-gray-50">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
