import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import Footer from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy - Innexora Hotel Management Platform",
  description:
    "Learn how Innexora protects your privacy and handles data. Our privacy policy covers data collection, usage, and your rights regarding personal information.",
  keywords: [
    "privacy policy",
    "data protection",
    "GDPR compliance",
    "hotel software privacy",
  ],
  openGraph: {
    title: "Privacy Policy - Innexora Hotel Management Platform",
    description:
      "Learn how we protect your privacy and handle data in our hotel management platform.",
    url: "https://innexora.app/privacy",
    type: "website",
  },
  alternates: {
    canonical: "https://innexora.app/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20">
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Privacy Policy
            </h1>

            <div className="space-y-8 text-sm text-gray-600">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">📊</span>
                  </span>
                  Data Collection
                </h2>
                <p>
                  We collect information necessary to provide our hotel
                  management services, including account details, hotel data,
                  guest information, and usage analytics. All data collection is
                  transparent and purposeful.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🔒</span>
                  </span>
                  Data Usage
                </h2>
                <p>
                  Your data is used solely to provide and improve our services.
                  We do not sell personal information to third parties. Data may
                  be processed for service delivery, support, and platform
                  improvements.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🛡️</span>
                  </span>
                  Data Protection
                </h2>
                <p>
                  We implement industry-standard security measures including
                  encryption, access controls, and regular security audits. Your
                  data is protected both in transit and at rest with
                  enterprise-grade security.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">👤</span>
                  </span>
                  Your Rights
                </h2>
                <p>
                  You have the right to access, correct, delete, or export your
                  data. You may also object to certain processing activities.
                  Contact us to exercise these rights or for data-related
                  inquiries.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🍪</span>
                  </span>
                  Cookies
                </h2>
                <p>
                  We use essential cookies for platform functionality and
                  optional cookies for analytics and user experience
                  improvement. You can manage cookie preferences in your browser
                  settings.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🌍</span>
                  </span>
                  International Transfers
                </h2>
                <p>
                  Data may be processed in countries outside your jurisdiction.
                  We ensure appropriate safeguards are in place and comply with
                  applicable data protection laws including GDPR and CCPA.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🗑️</span>
                  </span>
                  Data Retention
                </h2>
                <p>
                  We retain data only as long as necessary for service provision
                  and legal compliance. Upon account termination, personal data
                  is deleted within 30 days unless legal obligations require
                  longer retention.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-8 mt-8">
                <p className="text-xs text-gray-500">
                  Last updated: September 2024. For privacy inquiries, contact
                  privacy@innexora.app
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
