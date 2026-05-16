import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="py-16">
      <h1 className="text-2xl font-bold text-center">Login</h1>
      <div className="mt-8 px-4">
        <LoginForm />
      </div>
    </div>
  );
}
