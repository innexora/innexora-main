"use client";

import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "₹8,999",
    period: "/month",
    description: "Perfect for boutique hotels and small properties",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    popular: false,
    features: [
      "Up to 25 rooms",
      "Basic QR service requests",
      "Staff mobile notifications",
      "Guest communication",
      "Basic analytics",
      "Email support",
      "Standard integrations"
    ],
    savings: "Save ₹25,000/month vs hiring staff"
  },
  {
    name: "Professional",
    price: "₹15,999",
    period: "/month",
    description: "Most popular choice for mid-size hotels",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    popular: true,
    features: [
      "Up to 100 rooms",
      "Advanced AI request routing",
      "Real-time staff dashboard",
      "Advanced analytics & insights",
      "Custom branding",
      "Priority support",
      "All integrations included",
      "Staff training included"
    ],
    savings: "Save ₹45,000/month vs hiring staff"
  },
  {
    name: "Enterprise",
    price: "₹29,999",
    period: "/month",
    description: "For large hotels and hotel chains",
    icon: Rocket,
    color: "from-orange-500 to-red-500",
    popular: false,
    features: [
      "Unlimited rooms",
      "Multi-property management",
      "Custom AI training",
      "Advanced reporting suite",
      "White-label solution",
      "24/7 dedicated support",
      "Custom integrations",
      "On-site training & setup"
    ],
    savings: "Save ₹80,000/month vs hiring staff"
  }
];

const comparison = [
  {
    category: "Traditional Hotel Management",
    items: [
      "Manual phone-based requests",
      "Delayed response times",
      "High staff costs (₹50,000+/month)",
      "Poor guest satisfaction",
      "No real-time insights",
      "Paper-based processes"
    ],
    color: "text-red-600 bg-red-50"
  },
  {
    category: "With Innexora",
    items: [
      "Instant QR-based requests",
      "AI-powered fast responses",
      "Low monthly cost (₹15,999/month)",
      "5-star guest experiences",
      "Real-time analytics",
      "Fully digital operations"
    ],
    color: "text-green-600 bg-green-50"
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-sm text-xs font-medium mb-6">
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6">
              All plans cost less than hiring one staff member, but deliver the efficiency of an entire team.
            </p>
            <div className="text-xs text-gray-500">
              30-day money-back guarantee • No setup fees • Cancel anytime
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'ring-2 ring-black' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-sm text-xs font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="bg-white border border-gray-200 rounded-sm p-6 h-full">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-600">{plan.period}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {plan.savings}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-black flex items-center justify-center flex-shrink-0">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full py-2 text-sm font-medium rounded-sm ${
                      plan.popular
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-white border border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    {plan.popular ? 'Start Free Trial' : 'Get Started'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ROI Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-stone-50 border border-gray-200 rounded-sm p-8 text-center"
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-900">
              Calculate Your Savings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="text-2xl font-bold mb-1 text-gray-900">₹50,000</div>
                <div className="text-sm text-gray-600">Monthly staff cost</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="text-2xl font-bold mb-1 text-gray-900">₹15,999</div>
                <div className="text-sm text-gray-600">Innexora cost</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="text-2xl font-bold mb-1 text-gray-900">₹34,001</div>
                <div className="text-sm text-gray-600">Monthly savings</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              That's ₹4,08,012 saved per year, plus increased revenue from better guest satisfaction.
            </p>
            <Button
              className="bg-black text-white hover:bg-gray-800 px-6 py-2 text-sm font-medium rounded-sm"
            >
              Schedule Demo
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
