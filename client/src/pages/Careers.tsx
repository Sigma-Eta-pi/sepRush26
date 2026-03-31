/*
 * UCSB SEP Careers Page — Official Sigma Eta Pi Brand
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { useState } from "react";

const CAREERS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-careers-bg-5nPxJu5fYFb4Bo8BcBe3he.webp";

const COMPANIES = [
  { name: "Google", category: "Tech" },
  { name: "Amazon", category: "Tech" },
  { name: "Apple", category: "Tech" },
  { name: "Microsoft", category: "Tech" },
  { name: "Meta", category: "Tech" },
  { name: "Tesla", category: "Tech" },
  { name: "Salesforce", category: "Tech" },
  { name: "Oracle", category: "Tech" },
  { name: "IBM", category: "Tech" },
  { name: "Intel", category: "Tech" },
  { name: "Deloitte", category: "Consulting" },
  { name: "PwC", category: "Consulting" },
  { name: "EY", category: "Consulting" },
  { name: "KPMG", category: "Consulting" },
  { name: "Accenture", category: "Consulting" },
  { name: "McKinsey", category: "Consulting" },
  { name: "J.P. Morgan", category: "Finance" },
  { name: "Goldman Sachs", category: "Finance" },
  { name: "Morgan Stanley", category: "Finance" },
  { name: "BlackRock", category: "Finance" },
  { name: "Citi", category: "Finance" },
  { name: "Bank of America", category: "Finance" },
  { name: "Y Combinator", category: "Venture" },
  { name: "Sequoia", category: "Venture" },
  { name: "a16z", category: "Venture" },
  { name: "Stripe", category: "Fintech" },
  { name: "Airbnb", category: "Tech" },
  { name: "Uber", category: "Tech" },
  { name: "LinkedIn", category: "Tech" },
  { name: "Adobe", category: "Tech" },
  { name: "Nvidia", category: "Tech" },
  { name: "PayPal", category: "Fintech" },
  { name: "SpaceX", category: "Aerospace" },
  { name: "Palantir", category: "Tech" },
  { name: "Databricks", category: "Tech" },
  { name: "OpenAI", category: "AI" },
  { name: "Figma", category: "Tech" },
  { name: "Notion", category: "Tech" },
  { name: "Zoom", category: "Tech" },
  { name: "Snap", category: "Tech" },
];

const CATEGORIES = ["All", "Tech", "Finance", "Consulting", "Venture", "Fintech", "AI", "Aerospace"];

const CAREER_RESOURCES = [
  {
    icon: "🎯",
    title: "Alumni Network",
    description: "Connect with SEP alumni at top companies across Silicon Valley, Silicon Beach, and beyond.",
  },
  {
    icon: "📊",
    title: "Professional Workshops",
    description: "Regular workshops on resume building, interview prep, case studies, and startup pitching.",
  },
  {
    icon: "🤝",
    title: "Industry Panels",
    description: "Hear directly from founders, VCs, and executives about their career journeys and insights.",
  },
  {
    icon: "💼",
    title: "Recruiting Support",
    description: "Access to exclusive job postings, referrals, and recruiting prep from members at top firms.",
  },
];

export default function Careers() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredCompanies = activeCategory === "All"
    ? COMPANIES
    : COMPANIES.filter(c => c.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#EEEADE] text-[#0C141A]">
      <Navbar />

      {/* Page Hero */}
      <section
        className="relative h-72 md:h-96 flex items-end overflow-hidden pt-24"
        style={{
          backgroundImage: `url(${CAREERS_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              color: "#D0E4EF",
            }}
          >
            Careers
          </div>
          <h1
            className="text-white"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Our Careers
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-4"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#05006C",
              }}
            >
              Where We Go
            </div>
            <h2
              className="text-[#05006C] mb-6"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              Sigma Eta Pi Alumni Are Everywhere
            </h2>
            <p className="text-[#0C141A]/70 text-base leading-relaxed" style={{ fontFamily: "'Glacial Indifference', serif" }}>
              Sigma Eta Pi stays actively connected with its alumni, creating lasting professional support in different industries. Our members go on to work at the world's most innovative companies, launch their own startups, and make meaningful impact across every sector.
            </p>
          </div>
        </div>
      </section>

      {/* Career Resources */}
      <section className="py-16 bg-[#EEEADE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#05006C",
              }}
            >
              Resources
            </div>
            <h2
              className="text-[#05006C]"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
                textTransform: "uppercase",
              }}
            >
              What We Offer
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAREER_RESOURCES.map((resource, i) => (
              <div
                key={i}
                className="bg-[#FFFFFF] border-4 border-[#05006C] p-6 hover:bg-[#D0E4EF] transition-all duration-300 group"
              >
                <div className="text-3xl mb-4">{resource.icon}</div>
                <h3
                  className="text-[#05006C] mb-3 group-hover:text-[#0C141A] transition-colors"
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontWeight: 900,
                    fontSize: "1.2rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {resource.title}
                </h3>
                <p className="text-[#0C141A]/70 text-sm leading-relaxed" style={{ fontFamily: "'Glacial Indifference', serif" }}>
                  {resource.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Logos */}
      <section className="py-16 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#05006C",
              }}
            >
              Where We Work
            </div>
            <h2
              className="text-[#05006C] mb-6"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
                textTransform: "uppercase",
              }}
            >
              Companies Our Members Work At
            </h2>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 border-2 ${
                    activeCategory === cat
                      ? "border-[#05006C] bg-[#05006C] text-[#EEEADE]"
                      : "border-[#05006C] text-[#05006C] hover:bg-[#05006C]/10"
                  }`}
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredCompanies.map((company, i) => (
              <div
                key={i}
                className="aspect-square flex flex-col items-center justify-center border-2 border-[#05006C] bg-[#EEEADE] hover:border-[#D0E4EF] hover:bg-[#D0E4EF] transition-all duration-300 p-3 group"
              >
                <span
                  className="text-[#05006C] text-xs font-bold text-center leading-tight group-hover:text-[#0C141A] transition-colors"
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "0.65rem",
                  }}
                >
                  {company.name}
                </span>
                <span
                  className="text-[#05006C]/50 text-center mt-1 group-hover:text-[#05006C] transition-colors"
                  style={{
                    fontFamily: "'Glacial Indifference', serif",
                    fontSize: "0.55rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  {company.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#EEEADE] border-t-4 border-[#05006C]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2
            className="text-[#05006C] mb-6"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              textTransform: "uppercase",
            }}
          >
            Launch Your Career with SEP
          </h2>
          <p className="text-[#0C141A]/70 mb-8" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            Join a network of entrepreneurs and professionals who support each other throughout their careers.
          </p>
          <Link
            href="/recruitment"
            className="inline-block px-8 py-4 bg-[#05006C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            APPLY NOW
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
