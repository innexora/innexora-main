"use client";

import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const contactMethods = [
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak with our hotel tech experts",
    value: "+91 98765 43210",
    action: "Call Now",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "Get detailed information via email",
    value: "hello@innexora.com",
    action: "Send Email",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Book Demo",
    description: "See Innexora in action",
    value: "15-minute live demo",
    action: "Schedule Now",
    color: "from-green-500 to-emerald-500",
  },
];

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    hotelName: "",
    email: "",
    phone: "",
    roomCount: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.hotelName.trim())
      newErrors.hotelName = "Hotel name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.roomCount) newErrors.roomCount = "Room count is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setIsSubmitted(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          hotelName: "",
          email: "",
          phone: "",
          roomCount: "",
          message: "",
        });
      }, 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      // You can add error state handling here if needed
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactMethod = (method: string) => {
    switch (method) {
      case "phone":
        window.open("tel:+919876543210", "_self");
        break;
      case "email":
        window.open("mailto:hello@innexora.com", "_self");
        break;
      case "demo":
        // Scroll to form
        const formElement = document.getElementById("contact-form");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth" });
        }
        break;
    }
  };

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
              Join hotels using Innexora to deliver exceptional guest
              experiences.
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
              id="contact-form"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Get Your Free Demo
              </h3>

              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-sm flex items-center justify-center mb-4 mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Thank You!
                  </h4>
                  <p className="text-gray-600 mb-4">
                    We've received your request and will contact you within 24
                    hours.
                  </p>
                  <p className="text-sm text-gray-500">
                    In the meantime, feel free to explore our features above.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Your name"
                        className={`rounded-sm border ${
                          errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hotel Name *
                      </label>
                      <Input
                        value={formData.hotelName}
                        onChange={(e) =>
                          handleInputChange("hotelName", e.target.value)
                        }
                        placeholder="Hotel name"
                        className={`rounded-sm border ${
                          errors.hotelName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.hotelName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.hotelName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="your@email.com"
                        className={`rounded-sm border ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="+91 98765 43210"
                        className={`rounded-sm border ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Rooms *
                    </label>
                    <select
                      value={formData.roomCount}
                      onChange={(e) =>
                        handleInputChange("roomCount", e.target.value)
                      }
                      className={`w-full rounded-sm border p-2 text-sm ${
                        errors.roomCount ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select room count</option>
                      <option value="1-25">1-25 rooms</option>
                      <option value="26-50">26-50 rooms</option>
                      <option value="51-100">51-100 rooms</option>
                      <option value="100+">100+ rooms</option>
                    </select>
                    {errors.roomCount && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.roomCount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Message (Optional)
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      placeholder="Tell us about your specific needs..."
                      className="rounded-sm border border-gray-300 min-h-[100px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white hover:bg-gray-800 py-2 text-sm font-medium rounded-sm transition-all duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Get Free Demo"}
                    {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    No spam. Just a genuine conversation about your needs.
                  </p>
                </form>
              )}
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
              Ready to Join Successful Hotels?
            </h3>
            <p className="text-sm text-gray-300 mb-6 max-w-xl mx-auto">
              Stop losing money on inefficient operations. Start delivering
              experiences that guests love.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => handleContactMethod("demo")}
                className="bg-white text-black hover:bg-gray-100 px-6 py-2 text-sm font-medium rounded-sm transition-all duration-200"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleContactMethod("demo")}
                className="border border-white text-white hover:bg-white hover:text-black px-6 py-2 text-sm font-medium rounded-sm transition-all duration-200"
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
