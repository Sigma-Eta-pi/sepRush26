/*
 * UCSB SEP Navbar — Official Sigma Eta Pi Brand
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/images/logo.png";

const NAV_BG = "#203354";

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
  const { isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
        <div className="rounded-full shadow-lg" style={{ background: NAV_BG }}>
          <div className="flex items-center justify-between h-16 px-6 sm:px-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 flex-shrink-0">
                <img
                  src={logoImg}
                  alt="Sigma Eta Pi"
                  className="w-full h-full object-contain"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
              <div className="hidden sm:block">
                <div
                  className="text-white leading-none"
                  style={{
                    fontFamily: "'The Youngest', cursive",
                    fontSize: "1.1rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  Sigma Eta Pi
                </div>
                <div
                  className="leading-none mt-0.5"
                  style={{
                    color: "#D0E4EF",
                    fontFamily:
                      "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-bold tracking-widest uppercase transition-colors duration-200 ${
                    location === link.href
                      ? "text-[#D0E4EF]"
                      : "text-[#EEEADE]/80 hover:text-[#EEEADE]"
                  }`}
                  style={{
                    fontFamily:
                      "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "0.7rem",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/recruitment"
                className="px-6 py-2 bg-[#EEEADE] font-bold rounded-full transition-all duration-300 hover:bg-white text-sm"
                style={{
                  color: NAV_BG,
                  fontFamily:
                    "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                APPLY
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-[#EEEADE]/10 text-[#EEEADE] hover:bg-[#EEEADE]/20 font-bold rounded-full text-xs tracking-widest transition-all border border-[#EEEADE]/30"
                >
                  DASHBOARD
                </Link>
              ) : (
                <Link
                  href="/active-login"
                  className="px-4 py-2 border border-[#EEEADE]/40 text-[#EEEADE]/80 hover:text-[#EEEADE] hover:border-[#EEEADE] font-bold rounded-full text-xs tracking-widest transition-all"
                >
                  ACTIVE LOGIN
                </Link>
              )}
            </div>

            {/* Mobile toggle */}
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
        <div
          className="lg:hidden mx-4 sm:mx-6 mt-2 rounded-2xl shadow-lg"
          style={{ background: NAV_BG }}
        >
          <div className="px-6 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-3 px-4 font-bold tracking-widest uppercase transition-colors rounded-lg ${
                  location === link.href
                    ? "text-[#D0E4EF] bg-white/10"
                    : "text-[#EEEADE]/80 hover:text-[#EEEADE] hover:bg-[#EEEADE]/10"
                }`}
                style={{
                  fontFamily:
                    "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "0.7rem",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              <Link
                href="/recruitment"
                className="block text-center py-3 px-4 bg-[#EEEADE] font-bold rounded-lg text-sm"
                style={{
                  color: NAV_BG,
                  fontFamily:
                    "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
                onClick={() => setMobileOpen(false)}
              >
                APPLY NOW
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="block text-center py-3 px-4 bg-[#EEEADE]/10 text-[#EEEADE] font-bold rounded-lg text-xs tracking-widest border border-[#EEEADE]/30"
                  onClick={() => setMobileOpen(false)}
                >
                  DASHBOARD
                </Link>
              ) : (
                <Link
                  href="/active-login"
                  className="block text-center py-3 px-4 border border-[#EEEADE]/40 text-[#EEEADE]/80 font-bold rounded-lg text-xs tracking-widest"
                  onClick={() => setMobileOpen(false)}
                >
                  ACTIVE LOGIN
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
