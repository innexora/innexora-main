import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import Footer from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service - Innexora Hotel Management Platform",
  description:
    "Terms and conditions for using Innexora's hotel management software platform. Review our service agreement and usage policies.",
  keywords: [
    "terms of service",
    "user agreement",
    "hotel software terms",
    "SaaS terms",
  ],
  openGraph: {
    title: "Terms of Service - Innexora Hotel Management Platform",
    description:
      "Terms and conditions for using Innexora's hotel management platform.",
    url: "https://innexora.app/terms",
    type: "website",
  },
  alternates: {
    canonical: "https://innexora.app/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20">
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Terms of Service
            </h1>

            <div className="space-y-8 text-sm text-gray-600">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">📋</span>
                  </span>
                  Service Agreement
                </h2>
                <p>
                  By using Innexora's hotel management platform, you agree to
                  these terms. Our service provides comprehensive hotel
                  management tools including booking systems, guest management,
                  and analytics.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">💳</span>
                  </span>
                  Payment Terms
                </h2>
                <p>
                  Subscription fees are billed monthly or annually in advance.
                  All payments are non-refundable except as required by law.
                  Prices may change with 30 days notice.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">👤</span>
                  </span>
                  User Responsibilities
                </h2>
                <p>
                  You are responsible for maintaining account security, ensuring
                  data accuracy, and complying with applicable laws. Misuse of
                  the platform may result in account suspension.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">📊</span>
                  </span>
                  Data Ownership
                </h2>
                <p>
                  You retain ownership of your data. We provide tools to export
                  your information at any time. Upon termination, your data will
                  be deleted within 30 days unless legally required to retain
                  it.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🔒</span>
                  </span>
                  Service Availability
                </h2>
                <p>
                  We strive for 99.9% uptime but cannot guarantee uninterrupted
                  service. Scheduled maintenance will be announced in advance.
                  We are not liable for damages from service interruptions.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">⚖️</span>
                  </span>
                  Limitation of Liability
                </h2>
                <p>
                  Our liability is limited to the amount paid for the service in
                  the preceding 12 months. We are not liable for indirect,
                  incidental, or consequential damages.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🔄</span>
                  </span>
                  Termination
                </h2>
                <p>
                  Either party may terminate this agreement with 30 days notice.
                  Upon termination, access to the service will be revoked and
                  data will be made available for download for 30 days.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-8 mt-8">
                <p className="text-xs text-gray-500">
                  Last updated: September 2024. For questions about these terms,
                  contact legal@innexora.app
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
