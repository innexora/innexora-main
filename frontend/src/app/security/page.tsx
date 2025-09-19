import type { Metadata } from "next";
import { Header } from "@/components/landing/header";
import Footer from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Security - Innexora Hotel Management Platform",
  description:
    "Learn about Innexora's enterprise-grade security measures, data protection, and compliance standards for hotel management software.",
  keywords: [
    "hotel software security",
    "data protection",
    "compliance",
    "enterprise security",
  ],
  openGraph: {
    title: "Security - Innexora Hotel Management Platform",
    description:
      "Enterprise-grade security and compliance for hotel management.",
    url: "https://innexora.app/security",
    type: "website",
  },
  alternates: {
    canonical: "https://innexora.app/security",
  },
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20">
        <section className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Security</h1>

            <div className="space-y-8 text-sm text-gray-600">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🔒</span>
                  </span>
                  Data Encryption
                </h2>
                <p>
                  All data is encrypted at rest using AES-256 encryption and in
                  transit using TLS 1.3. Your hotel and guest information is
                  protected with bank-level security standards.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🛡️</span>
                  </span>
                  Infrastructure Security
                </h2>
                <p>
                  Our platform is hosted on enterprise-grade cloud
                  infrastructure with 99.9% uptime SLA. Regular security audits
                  and penetration testing ensure continuous protection.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                  Compliance
                </h2>
                <p>
                  Innexora complies with GDPR, CCPA, and PCI DSS standards. We
                  maintain SOC 2 Type II certification and undergo regular
                  compliance audits.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">👥</span>
                  </span>
                  Access Control
                </h2>
                <p>
                  Multi-factor authentication and role-based access controls
                  ensure only authorized personnel can access your data. All
                  access is logged and monitored.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">📊</span>
                  </span>
                  Data Backup
                </h2>
                <p>
                  Automated daily backups with point-in-time recovery. Your data
                  is replicated across multiple geographic regions for maximum
                  protection and availability.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">🔍</span>
                  </span>
                  Monitoring
                </h2>
                <p>
                  24/7 security monitoring and incident response. Real-time
                  threat detection and automated security updates protect
                  against emerging vulnerabilities.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-8 mt-8">
                <p className="text-xs text-gray-500">
                  For security inquiries or to report vulnerabilities, contact
                  us at security@innexora.app
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
