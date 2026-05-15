import React from "react";

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}

export default function SectionWrapper({
  children,
  className = "",
  id,
  dark = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`${
        dark
          ? "bg-slate-900 text-white dark:bg-slate-950"
          : "bg-white dark:bg-slate-900 dark:text-slate-50"
      } py-16 sm:py-24 lg:py-32 transition-colors duration-200 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
