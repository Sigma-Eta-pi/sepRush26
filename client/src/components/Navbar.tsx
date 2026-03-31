/*
 * UCSB SEP Navbar — Official Sigma Eta Pi Brand
 * Floating navbar with navy background, light text
 * Logo: Official eagle emblem + "Sigma Eta Pi" text
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
        <div className="bg-[#05006C] rounded-full shadow-lg border-2 border-[#05006C]">
          <div className="flex items-center justify-between h-16 px-6 sm:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 flex-shrink-0">
                <SepLogo />
              </div>
              <div className="hidden sm:block">
                <div
                  className="text-[#EEEADE] font-bold leading-none"
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "0.95rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  SIGMA ETA PI
                </div>
                <div
                  className="text-xs leading-none mt-0.5"
                  style={{
                    color: "#D0E4EF",
                    fontFamily: "'Glacial Indifference', serif",
                    letterSpacing: "0.1em",
                    fontSize: "0.6rem",
                  }}
                >
                  EPSILON CHAPTER
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-bold tracking-widest uppercase transition-colors duration-200 ${
                    location === link.href
                      ? "text-[#D0E4EF]"
                      : "text-[#EEEADE]/80 hover:text-[#EEEADE]"
                  }`}
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "0.7rem",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Apply Button */}
            <div className="hidden lg:block">
              <Link
                href="/recruitment"
                className="px-6 py-2 bg-[#EEEADE] text-[#05006C] font-bold rounded-full transition-all duration-300 hover:bg-[#D0E4EF] text-sm"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                APPLY
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden text-[#EEEADE] p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden mx-4 sm:mx-6 mt-2 bg-[#05006C] rounded-2xl shadow-lg border-2 border-[#05006C]">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-3 px-4 text-sm font-bold tracking-widest uppercase transition-colors rounded-lg ${
                  location === link.href
                    ? "text-[#D0E4EF] bg-[#0C141A]/30"
                    : "text-[#EEEADE]/80 hover:text-[#EEEADE] hover:bg-[#EEEADE]/10"
                }`}
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "0.7rem",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href="/recruitment"
                className="block text-center py-3 px-4 bg-[#EEEADE] text-[#05006C] font-bold rounded-lg text-sm"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
                onClick={() => setMobileOpen(false)}
              >
                APPLY NOW
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
      {/* Official Sigma Eta Pi Eagle Logo */}
      <g>
        {/* Shield outline */}
        <path
          d="M50 8 L85 22 L85 55 Q85 78 50 92 Q15 78 15 55 L15 22 Z"
          fill="none"
          stroke="#EEEADE"
          strokeWidth="2"
        />
        {/* Wings */}
        <path d="M50 45 L20 25 L15 35 L35 50 Z" fill="#EEEADE" opacity="0.95" />
        <path d="M50 45 L80 25 L85 35 L65 50 Z" fill="#EEEADE" opacity="0.95" />
        {/* Body */}
        <ellipse cx="50" cy="58" rx="12" ry="18" fill="#EEEADE" opacity="0.95" />
        {/* Head */}
        <circle cx="50" cy="38" r="8" fill="#EEEADE" />
        {/* Beak */}
        <path d="M50 41 L55 44 L50 46 Z" fill="#05006C" />
        {/* Eye */}
        <circle cx="53" cy="37" r="1.5" fill="#05006C" />
        {/* Tail feathers */}
        <path d="M44 74 L50 82 L56 74" fill="#EEEADE" opacity="0.9" />
        {/* Greek letters ΣΗΠ */}
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fill="#05006C"
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
