import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="py-16">
      <h1 className="text-2xl font-bold text-center">Create your account</h1>
      <div className="mt-8 px-4">
        <RegisterForm />
      </div>
    </div>
  );
}
