"use client";

import { motion } from "framer-motion";
import { Star, Quote, Building2, MapPin } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    position: "General Manager",
    company: "The Grand Palace Hotel",
    location: "Mumbai, India",
    image: "RK",
    rating: 5,
    text: "Innexora has revolutionized our guest service. QR-based ordering reduced our reception calls by 85%, and our guest satisfaction scores jumped from 4.2 to 4.8 stars. The AI routing is incredibly smart!",
    results: "85% fewer calls, 4.8★ rating",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Sarah Mitchell",
    position: "Operations Director",
    company: "Luxury Suites International",
    location: "London, UK",
    image: "SM",
    rating: 5,
    text: "The staff efficiency improvement is remarkable. Our housekeeping response time went from 45 minutes to 12 minutes. The real-time notifications and analytics dashboard are game-changers.",
    results: "73% faster response time",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Ahmed Al-Rashid",
    position: "Hotel Owner",
    company: "Desert Oasis Resort",
    location: "Dubai, UAE",
    image: "AR",
    rating: 5,
    text: "We saved the equivalent of 3 staff salaries in the first year. The system pays for itself within 2 months. Our revenue increased by 28% due to better service and guest reviews.",
    results: "28% revenue increase",
    color: "from-orange-500 to-red-500",
  },
  {
    name: "Maria Rodriguez",
    position: "Guest Relations Manager",
    company: "Coastal Paradise Resort",
    location: "Barcelona, Spain",
    image: "MR",
    rating: 5,
    text: "Guests love the instant service requests. No more waiting on hold or walking to reception. Our TripAdvisor reviews improved dramatically, and we're now ranked #1 in our area.",
    results: "#1 ranked hotel locally",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "David Chen",
    position: "IT Director",
    company: "Metropolitan Hotel Group",
    location: "Singapore",
    image: "DC",
    rating: 5,
    text: "The security and data isolation is exceptional. Each property has complete control over their data. Setup took just 2 hours, and staff training was completed in one day.",
    results: "2-hour setup, 1-day training",
    color: "from-indigo-500 to-blue-500",
  },
  {
    name: "Lisa Thompson",
    position: "Revenue Manager",
    company: "Boutique Hotels Collection",
    location: "New York, USA",
    image: "LT",
    rating: 5,
    text: "The analytics insights helped us optimize our service offerings. We identified peak request times and adjusted staffing accordingly. Our operational costs dropped by 22%.",
    results: "22% cost reduction",
    color: "from-teal-500 to-cyan-500",
  },
];

const trustedCompanies = [
  "Marriott International",
  "Hilton Worldwide",
  "IHG Hotels & Resorts",
  "Accor Group",
  "Hyatt Hotels",
  "Radisson Hotel Group",
  "Wyndham Hotels",
  "Choice Hotels",
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-stone-50">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-sm text-xs font-medium mb-6">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Trusted by Leading Hotels
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              See how hotels worldwide are transforming operations and boosting
              revenue.
            </p>
          </motion.div> */}

          {/* Testimonials Grid */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-sm p-6"
              >
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="text-xs font-medium text-gray-500 mb-4">
                  {testimonial.results}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center text-white text-xs font-bold">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {testimonial.position}
                    </p>
                    <p className="text-xs text-gray-500">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div> */}

          {/* Why Hotels Switch Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white border border-gray-200 rounded-sm p-4"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Why Hotels Switch to Innexora
            </h3>
            <div className="overflow-hidden border border-gray-200 rounded-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-stone-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Traditional Management
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      With Innexora
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Manual phone-based requests
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Instant QR-based requests
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Delayed response times
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      AI-powered fast responses
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      High staff costs (₹50,000+/month)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Low monthly cost (₹15,999/month)
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Poor guest satisfaction
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      5-star guest experiences
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
