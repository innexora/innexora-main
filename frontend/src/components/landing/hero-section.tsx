"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section id="hero" className="pt-24 pb-20 bg-stone-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-sm px-4 py-2 mb-8"
          >
            <span className="text-xs font-medium text-gray-700">
              Hotel Management Platform
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight"
          >
            Transform Your Hotel Operations
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            AI-powered guest interaction, QR-based ordering, and real-time staff notifications. 
            Complete hotel management solution with secure data isolation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16"
          >
            <Button
              size="lg"
              className="bg-black text-white hover:bg-gray-800 px-6 py-3 text-sm font-medium rounded-sm"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border border-gray-300 hover:border-gray-400 px-6 py-3 text-sm font-medium rounded-sm"
            >
              <Play className="mr-2 w-4 h-4" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            <div className="bg-white border border-gray-200 rounded-sm p-4 text-center">
              <span className="text-sm font-medium text-gray-800">2-Hour Setup</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-sm p-4 text-center">
              <span className="text-sm font-medium text-gray-800">Secure & Isolated</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-sm p-4 text-center">
              <span className="text-sm font-medium text-gray-800">85% Efficiency Gain</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
