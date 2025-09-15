"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Loader2,
  Hotel,
  Users,
  MessageSquare,
  Shield,
  LogIn,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
} from "lucide-react";
import { useTenantContext } from "@/components/tenant/tenant-provider";
import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ContactSection } from "@/components/landing/contact-section";
import Footer from "@/components/landing/footer";

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { isMainDomain, hotel, loading } = useTenantContext();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle navigation for tenant domains
  useEffect(() => {
    if (isClient && !loading && hotel && !isMainDomain) {
      router.push("/auth/login");
    }
  }, [isClient, loading, hotel, isMainDomain, router]);

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Main domain - Show public Innexora landing page
  if (isMainDomain) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <ContactSection />
        <Footer />
      </div>
    );
  }

  // Tenant domain - This should not be reached due to RouteGuard and the useEffect above
  if (hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Fallback - should not be reached
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    </div>
  );
}
