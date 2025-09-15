"use client";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  QrCode, 
  Bell, 
  BarChart3, 
  Shield, 
  Zap
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Guest Communication",
    description: "Intelligent chatbot handles requests automatically with smart staff routing",
    metric: "90% automation"
  },
  {
    icon: QrCode,
    title: "QR Code Services",
    description: "Guests access services and place orders instantly via room QR codes",
    metric: "Zero downloads"
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description: "Staff receive instant mobile notifications for urgent requests",
    metric: "3x faster response"
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive insights on satisfaction, performance, and revenue",
    metric: "15+ metrics"
  },
  {
    icon: Shield,
    title: "Secure Multi-Tenant",
    description: "Complete data isolation with dedicated databases per hotel",
    metric: "Bank-level security"
  },
  {
    icon: Zap,
    title: "Quick Deployment",
    description: "Get your hotel online in minutes with automated setup",
    metric: "5-min setup"
  }
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
            AI-powered communication, real-time analytics, and secure multi-tenant 
            architecture designed for modern hospitality operations.
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
              className="bg-stone-50 border border-gray-200 rounded-sm p-6"
            >
              <div className="w-10 h-10 rounded-sm bg-black flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{feature.description}</p>
              <div className="text-xs font-medium text-gray-500">
                {feature.metric}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
