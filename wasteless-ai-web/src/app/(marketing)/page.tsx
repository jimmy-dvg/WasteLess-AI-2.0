import HeroSection from "@/components/HeroSection";
import QuickAccessSection from "@/components/QuickAccessSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import BenefitsSection from "@/components/BenefitsSection";
import CTASection from "@/components/CTASection";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <HeroSection isAuthenticated={Boolean(user)} />
      <QuickAccessSection isAuthenticated={Boolean(user)} />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CTASection isAuthenticated={Boolean(user)} />
    </>
  );
}
