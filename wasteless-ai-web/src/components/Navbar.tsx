"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Navbar({ user }: { user?: { id: string; name: string; email: string } | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "#quick-access", label: "Quick access" },
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#benefits", label: "Benefits" },
  ];

  const linkButton =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-bold transition";
  const outlineButton = `${linkButton} border border-slate-200 text-slate-700 hover:bg-slate-50`;
  const primaryButton = `${linkButton} bg-emerald-600 text-white hover:bg-emerald-700`;
  const secondaryButton = `${linkButton} border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-950">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              WL
            </span>
            <span className="hidden sm:inline">WasteLessAI</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <Link href="/login" className={`${outlineButton} hidden sm:inline-flex`}>
                  Login
                </Link>
                <Link href="/register" className={`${primaryButton} hidden sm:inline-flex`}>
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={`${secondaryButton} hidden sm:inline-flex`}>
                  Dashboard
                </Link>
                <UserMenu user={user} />
              </>
            )}

            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="border-t border-slate-200 py-4 md:hidden">
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {!user ? (
                <>
                  <Link href="/login" className={outlineButton} onClick={() => setIsOpen(false)}>
                    Login
                  </Link>
                  <Link href="/register" className={primaryButton} onClick={() => setIsOpen(false)}>
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className={secondaryButton} onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                  <UserMenu user={user} />
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
