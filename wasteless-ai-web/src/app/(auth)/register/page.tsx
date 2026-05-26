import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 text-lg font-bold text-slate-950">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
            WL
          </span>
          WasteLessAI
        </Link>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-slate-950">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Start with inventory tracking, then connect recipes, scanner imports, and shopping lists.
          </p>
        </div>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
