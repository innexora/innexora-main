import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TenantProvider } from "@/components/tenant/tenant-provider";
import { RouteGuard } from "@/components/tenant/route-guard";

export const metadata: Metadata = {
  title: "Innexora - Professional Hotel Management Software | SaaS Platform",
  description:
    "Transform your hotel operations with Innexora's comprehensive management platform. Multi-tenant SaaS solution for bookings, guest services, room management, and analytics. Trusted by hospitality professionals worldwide.",
  keywords: [
    "hotel management software",
    "hospitality SaaS",
    "hotel booking system",
    "property management",
    "guest management",
    "hotel operations",
    "multi-tenant platform",
  ],
  authors: [{ name: "Innexora" }],
  creator: "Innexora",
  publisher: "Innexora",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://innexora.app",
    title: "Innexora - Professional Hotel Management Software",
    description:
      "Transform your hotel operations with our comprehensive SaaS platform. Streamline bookings, guest services, and analytics.",
    siteName: "Innexora",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Innexora Hotel Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Innexora - Professional Hotel Management Software",
    description:
      "Transform your hotel operations with our comprehensive SaaS platform.",
    images: ["/og-image.jpg"],
    creator: "@innexora",
  },
  alternates: {
    canonical: "https://innexora.app",
  },
  category: "Business Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TenantProvider>
            <RouteGuard>{children}</RouteGuard>
            <Toaster />
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
