/*
 * UCSB SEP Navbar — "Silicon Ambition" Design
 * Dark translucent sticky nav with green accent on active/hover
 * Logo: ΣΗΠ eagle emblem + "SIGMA ETA PI" text
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Meet Us", href: "/meet-us" },
  { label: "Careers", href: "/careers" },
  { label: "Recruitment", href: "/recruitment" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/90 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
              <SepLogo />
            </div>
            <div className="hidden sm:block">
              <div
                className="text-white font-bold leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", letterSpacing: "0.1em" }}
              >
                SIGMA ETA PI
              </div>
              <div
                className="text-xs leading-none mt-0.5"
                style={{ color: "oklch(0.723 0.219 142.495)", fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em", fontSize: "0.65rem" }}
              >
                EPSILON CHAPTER · UCSB
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-widest uppercase transition-colors duration-200 ${
                  location === link.href
                    ? "text-green-400"
                    : "text-white/80 hover:text-white"
                }`}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/recruitment"
              className="sep-btn-green text-xs px-5 py-2.5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Apply Now
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-3 px-4 text-sm font-medium tracking-widest uppercase transition-colors ${
                  location === link.href
                    ? "text-green-400 bg-green-400/10"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href="/recruitment"
                className="block sep-btn-green text-center text-xs"
                onClick={() => setMobileOpen(false)}
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function SepLogo() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Eagle/Phoenix body */}
      <g>
        {/* Shield outline */}
        <path
          d="M50 8 L85 22 L85 55 Q85 78 50 92 Q15 78 15 55 L15 22 Z"
          fill="none"
          stroke="oklch(0.723 0.219 142.495)"
          strokeWidth="2.5"
        />
        {/* Wings */}
        <path
          d="M50 45 L20 25 L15 35 L35 50 Z"
          fill="oklch(0.723 0.219 142.495)"
          opacity="0.9"
        />
        <path
          d="M50 45 L80 25 L85 35 L65 50 Z"
          fill="oklch(0.723 0.219 142.495)"
          opacity="0.9"
        />
        {/* Body */}
        <ellipse cx="50" cy="58" rx="12" ry="18" fill="oklch(0.723 0.219 142.495)" opacity="0.9" />
        {/* Head */}
        <circle cx="50" cy="38" r="8" fill="oklch(0.723 0.219 142.495)" />
        {/* Beak */}
        <path d="M50 41 L55 44 L50 46 Z" fill="oklch(0.769 0.188 70.08)" />
        {/* Eye */}
        <circle cx="53" cy="37" r="1.5" fill="white" />
        {/* Tail feathers */}
        <path d="M44 74 L50 82 L56 74" fill="oklch(0.723 0.219 142.495)" opacity="0.8" />
        {/* Greek letters ΣΗΠ */}
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontFamily="serif"
          fontWeight="bold"
          opacity="0.9"
        >
          ΣΗΠ
        </text>
      </g>
    </svg>
  );
}
