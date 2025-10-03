"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  QrCode,
  Bell,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Guest Communication",
    description:
      "Intelligent chatbot handles requests automatically with smart staff routing",
    metric: "90% automation",
  },
  {
    icon: QrCode,
    title: "QR Code Services",
    description:
      "Guests access services and place orders instantly via room QR codes",
    metric: "Zero downloads",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description:
      "Staff receive instant mobile notifications for urgent requests",
    metric: "3x faster response",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Comprehensive insights on satisfaction, performance, and revenue",
    metric: "15+ metrics",
  },
  {
    icon: Shield,
    title: "Secure Multi-Tenant",
    description: "Complete data isolation with dedicated databases per hotel",
    metric: "Bank-level security",
  },
  {
    icon: Zap,
    title: "Quick Deployment",
    description: "Get your hotel online in minutes with automated setup",
    metric: "5-min setup",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-sm text-xs font-medium mb-6">
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Complete Hotel Management
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            AI-powered communication, real-time analytics, and secure
            multi-tenant architecture designed for modern hospitality
            operations.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-stone-50 border border-gray-200 rounded-sm p-6 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-sm bg-black flex items-center justify-center mb-4 group-hover:bg-gray-800 transition-colors duration-200">
                <feature.icon className="w-5 h-5 text-white" />
              </div>

              {/* Feature Preview Image */}
              <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm mb-4 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center mb-2 mx-auto opacity-60">
                      <feature.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-500">
                      {feature.title} Preview
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {feature.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-500">
                  {feature.metric}
                </div>
                <button className="text-xs text-black hover:text-gray-700 font-medium">
                  Learn more →
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 bg-stone-50 border border-gray-200 rounded-sm p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              See Innexora in Action
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Watch how hotels transform their operations with our comprehensive
              platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-sm p-4">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm mb-3 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mb-2 mx-auto">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-600">AI Chat Demo</p>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">
                Guest Communication
              </h4>
              <p className="text-sm text-gray-600">
                See how AI handles guest requests automatically
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-sm p-4">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm mb-3 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mb-2 mx-auto">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-600">QR Ordering Demo</p>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">
                QR Code Services
              </h4>
              <p className="text-sm text-gray-600">
                Experience instant room service ordering
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
