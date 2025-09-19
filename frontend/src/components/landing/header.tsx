"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Hotel, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

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
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { name: "Features", id: "features" },
    { name: "Testimonials", id: "testimonials" },
    { name: "Pricing", id: "pricing" },
    { name: "Contact", id: "contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white border-b border-gray-200" : "bg-white"
      }`}
    >
      {" "}
      <div className="flex justify-center gap-4 items-center bg-stone-50 text-black text-center text-sm py-1">
        <p>
          Enjoy a <span className="font-bold">7-day</span> free trial for every
          new hotel.
          <span className="hidden md:inline"> No credit card required.</span>
        </p>
        <button
          onClick={() => scrollToSection("contact")}
          className="text-sm bg-stone-900 text-white cursor-pointer px-2 py-1 rounded-xs"
        >
          Click here
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href={"/"}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToSection("hero")}
          >
            {/* <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center">
              <Hotel className="w-4 h-4 text-white" />
            </div> */}
            <span className="text-lg font-semibold bg-orange-50 text-black border-2 px-2 border-black">
              Innexora
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("contact")}
              className="text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50"
            >
              Demo
            </Button>
            <Button
              size="sm"
              onClick={() => scrollToSection("pricing")}
              className="bg-black text-white hover:bg-gray-800 text-sm font-medium rounded-sm"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-black"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-sm"
                >
                  {item.name}
                </button>
              ))}
              <div className="px-4 pt-3 space-y-2 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection("contact")}
                  className="w-full text-sm"
                >
                  Demo
                </Button>
                <Button
                  size="sm"
                  onClick={() => scrollToSection("pricing")}
                  className="w-full bg-black text-white hover:bg-gray-800 text-sm rounded-sm"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
