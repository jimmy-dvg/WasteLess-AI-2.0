import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 dark:bg-slate-950 dark:text-gray-50">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
