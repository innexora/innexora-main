"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Calendar, ArrowRight, Zap, Shield, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactMethods = [
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak with our hotel tech experts",
    value: "+91 98765 43210",
    action: "Call Now",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "Get detailed information via email",
    value: "hello@innexora.com",
    action: "Send Email",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Calendar,
    title: "Book Demo",
    description: "See Innexora in action",
    value: "15-minute live demo",
    action: "Schedule Now",
    color: "from-green-500 to-emerald-500"
  }
];

const benefits = [
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Get started in under 2 hours"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security"
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Always here when you need us"
  },
  {
    icon: Users,
    title: "Expert Training",
    description: "Complete staff onboarding included"
  }
];

export function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-stone-50">
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
              Contact
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Get Started Today
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Join 500+ hotels using Innexora to deliver exceptional guest experiences.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white border border-gray-200 rounded-sm p-8 mb-12"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Get Your Free Demo
              </h3>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <Input
                      placeholder="Your name"
                      className="rounded-sm border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Name
                    </label>
                    <Input
                      placeholder="Hotel name"
                      className="rounded-sm border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="rounded-sm border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      className="rounded-sm border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Rooms
                  </label>
                  <select className="w-full rounded-sm border-gray-300 p-2 text-sm">
                    <option>Select room count</option>
                    <option>1-25 rooms</option>
                    <option>26-50 rooms</option>
                    <option>51-100 rooms</option>
                    <option>100+ rooms</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 py-2 text-sm font-medium rounded-sm"
                >
                  Get Free Demo
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  No spam. Just a genuine conversation about your needs.
                </p>
              </form>
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center bg-black rounded-sm p-8 text-white"
          >
            <h3 className="text-2xl font-bold mb-3">
              Ready to Join 500+ Successful Hotels?
            </h3>
            <p className="text-sm text-gray-300 mb-6 max-w-xl mx-auto">
              Stop losing money on inefficient operations. Start delivering experiences that guests love.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="bg-white text-black hover:bg-gray-100 px-6 py-2 text-sm font-medium rounded-sm"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                className="border border-white text-white hover:bg-white hover:text-black px-6 py-2 text-sm font-medium rounded-sm"
              >
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
