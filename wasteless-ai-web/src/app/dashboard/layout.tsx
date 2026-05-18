import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <div className="mb-8">
          <Link href="/" className="text-lg font-bold text-slate-950">
            WasteLessAI
          </Link>
          <p className="mt-1 text-sm text-slate-500">Smart household waste control</p>
        </div>
        <DashboardSidebar />
        <div className="mt-auto rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Low-waste mode</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            Prioritize items that expire soon before planning your next grocery run.
          </p>
        </div>
      </aside>
      <div className="lg:pl-72">
        <DashboardHeader user={user} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
