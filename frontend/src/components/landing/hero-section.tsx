"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, X } from "lucide-react";
import { useState } from "react";

export function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 90;
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  const handleStartTrial = () => {
    scrollToSection("contact");
  };

  const handleWatchDemo = () => {
    setIsVideoOpen(true);
  };

  return (
    <section id="hero" className="pt-30 pb-20 bg-stone-50">
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
            AI-powered guest interaction, QR-based ordering, and real-time staff
            notifications. Complete hotel management solution with secure data
            isolation.
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
              onClick={handleStartTrial}
              className="bg-black text-white hover:bg-gray-800 px-6 py-3 text-sm font-medium rounded-sm transition-all duration-200"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleWatchDemo}
              className="border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-6 py-3 text-sm font-medium rounded-sm transition-all duration-200"
            >
              <Play className="mr-2 w-4 h-4" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Demo Video Modal */}
          {isVideoOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-sm max-w-4xl w-full relative">
                <button
                  onClick={() => setIsVideoOpen(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="aspect-video bg-gray-100 rounded-sm overflow-hidden">
                  {/* Placeholder for demo video */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-black rounded-sm flex items-center justify-center mb-4 mx-auto">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Innexora Platform Demo
                      </h3>
                      <p className="text-gray-600 text-sm max-w-md mx-auto">
                        See how hotels transform their operations with
                        AI-powered guest communication, QR ordering, and
                        real-time analytics.
                      </p>
                      <div className="mt-6 bg-gray-800 text-white px-4 py-2 rounded-sm text-sm inline-block">
                        Demo video will be loaded here
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <div className="bg-white border border-gray-200 rounded-sm p-6">
              <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-sm overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black rounded-sm flex items-center justify-center mb-4 mx-auto">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">
                      Platform Dashboard Preview
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Click "Watch Demo" to see the full platform in action
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            <div className="bg-white border border-gray-200 rounded-sm p-4 text-center">
              <span className="text-sm font-medium text-gray-800">
                2-Hour Setup
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-sm p-4 text-center">
              <span className="text-sm font-medium text-gray-800">
                Secure & Isolated
              </span>
            </div>
            <div className="bg-white border border-gray-200 rounded-sm p-4 text-center">
              <span className="text-sm font-medium text-gray-800">
                85% Efficiency Gain
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
