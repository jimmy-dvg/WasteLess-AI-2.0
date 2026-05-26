import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { appEnv } from "@/env/server";

function getMetadataBaseUrl() {
  const env = appEnv();
  if (env.APP_URL) return env.APP_URL;
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL;
  if (env.VERCEL_URL) return env.VERCEL_URL.startsWith("http") ? env.VERCEL_URL : `https://${env.VERCEL_URL}`;
  return "https://wastelessai.com";
}

const metadataBaseUrl = getMetadataBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: "WasteLessAI - AI-Powered Food Waste Reduction",
  description:
    "Smart inventory tracking, expiration monitoring, and AI-powered recipe recommendations to reduce food waste and save money.",
  keywords:
    "food waste, meal planning, AI recipes, pantry tracking, sustainability",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "WasteLessAI - Reduce Food Waste with AI",
    description:
      "Smart inventory tracking and AI-powered recipe recommendations to reduce food waste.",
    type: "website",
    url: metadataBaseUrl,
  },
  twitter: {
    card: "summary",
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
