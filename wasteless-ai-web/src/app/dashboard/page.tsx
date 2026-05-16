import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="py-16">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome back, {user.name} — this is a protected page.</p>
    </div>
  );
}
