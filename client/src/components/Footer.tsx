/*
 * UCSB SEP Footer — Official Sigma Eta Pi Brand
 * Light background with navy text and accents
 */

import { Link } from "wouter";
import { Instagram, Linkedin, Mail, ExternalLink } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Meet Us", href: "/meet-us" },
  { label: "Careers", href: "/careers" },
  { label: "Recruitment", href: "/recruitment" },
];

export default function Footer() {
  return (
    <footer className="bg-[#D2D0D1] border-t-4 border-[#05006C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0">
                <SepLogoFooter />
              </div>
              <div>
                <div
                  className="text-[#05006C] font-bold leading-none"
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "1rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  SIGMA ETA PI
                </div>
                <div
                  className="text-xs leading-none mt-1"
                  style={{
                    color: "#05006C",
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    letterSpacing: "0.1em",
                    fontSize: "0.6rem",
                  }}
                >
                  EPSILON CHAPTER · UCSB
                </div>
              </div>
            </div>
            <p className="text-[#0C141A]/70 text-sm leading-relaxed" style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
              UCSB's premier co-ed entrepreneurship fraternity. Cultivating innovative, action-oriented leaders.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://www.instagram.com/ucsbsep/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0C141A]/50 hover:text-[#05006C] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/ucsbsep/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0C141A]/50 hover:text-[#05006C] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://www.ucsbsep.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0C141A]/50 hover:text-[#05006C] transition-colors"
                aria-label="Website"
              >
                <ExternalLink size={20} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3
              className="text-[#05006C] font-bold mb-6 text-xs tracking-widest uppercase"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              Navigation
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#0C141A]/70 hover:text-[#05006C] text-sm transition-colors"
                    style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="text-[#05006C] font-bold mb-6 text-xs tracking-widest uppercase"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              Contact
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:exec@ucsbsep.org"
                className="flex items-center gap-2 text-[#0C141A]/70 hover:text-[#05006C] text-sm transition-colors"
                style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
              >
                <Mail size={16} className="flex-shrink-0" />
                exec@ucsbsep.org
              </a>
              <p className="text-[#0C141A]/50 text-sm" style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                University of California, Santa Barbara
              </p>
              <p className="text-[#0C141A]/50 text-sm" style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                Santa Barbara, CA 93106
              </p>
            </div>

            <div className="mt-8">
              <Link
                href="/recruitment"
                className="inline-block px-6 py-3 bg-[#05006C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-xs"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                JOIN NOW
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-[#05006C] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-[#0C141A]/50 text-xs"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            © {new Date().getFullYear()} Sigma Eta Pi — Epsilon Chapter at UCSB. All rights reserved.
          </p>
          <p
            className="text-[#0C141A]/50 text-xs"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            UCSB's Premier Co-Ed Entrepreneurship Fraternity
          </p>
        </div>
      </div>
    </footer>
  );
}

function SepLogoFooter() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <g>
        <path d="M50 8 L85 22 L85 55 Q85 78 50 92 Q15 78 15 55 L15 22 Z" fill="none" stroke="#05006C" strokeWidth="2" />
        <path d="M50 45 L20 25 L15 35 L35 50 Z" fill="#05006C" opacity="0.95" />
        <path d="M50 45 L80 25 L85 35 L65 50 Z" fill="#05006C" opacity="0.95" />
        <ellipse cx="50" cy="58" rx="12" ry="18" fill="#05006C" opacity="0.95" />
        <circle cx="50" cy="38" r="8" fill="#05006C" />
        <path d="M50 41 L55 44 L50 46 Z" fill="#EEEADE" />
        <circle cx="53" cy="37" r="1.5" fill="#EEEADE" />
        <path d="M44 74 L50 82 L56 74" fill="#05006C" opacity="0.9" />
        <text x="50" y="68" textAnchor="middle" fill="#EEEADE" fontSize="8" fontFamily="serif" fontWeight="bold" opacity="0.9">ΣΗΠ</text>
      </g>
    </svg>
  );
}
