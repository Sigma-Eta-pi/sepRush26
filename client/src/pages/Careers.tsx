/*
 * UCSB SEP Careers Page — Official Sigma Eta Pi Brand
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { useState } from "react";

const CAREERS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-careers-bg-5nPxJu5fYFb4Bo8BcBe3he.webp";

const COMPANIES = [
  { name: "Google", category: "Tech", domain: "google.com", icon: "google" },
  { name: "Amazon", category: "Tech", domain: "amazon.com", icon: "amazon" },
  { name: "Apple", category: "Tech", domain: "apple.com", icon: "apple" },
  { name: "Microsoft", category: "Tech", domain: "microsoft.com", icon: "microsoft" },
  { name: "Meta", category: "Tech", domain: "meta.com", icon: "meta" },
  { name: "Tesla", category: "Tech", domain: "tesla.com", icon: "tesla" },
  { name: "Salesforce", category: "Tech", domain: "salesforce.com", icon: "salesforce" },
  { name: "Oracle", category: "Tech", domain: "oracle.com", icon: "oracle" },
  { name: "IBM", category: "Tech", domain: "ibm.com", icon: "ibm" },
  { name: "Intel", category: "Tech", domain: "intel.com", icon: "intel" },
  { name: "Deloitte", category: "Consulting", domain: "deloitte.com", icon: "deloitte" },
  { name: "PwC", category: "Consulting", domain: "pwc.com", icon: "pwc" },
  { name: "EY", category: "Consulting", domain: "ey.com", icon: "ey" },
  { name: "KPMG", category: "Consulting", domain: "kpmg.com", icon: "kpmg" },
  { name: "Accenture", category: "Consulting", domain: "accenture.com", icon: "accenture" },
  { name: "McKinsey", category: "Consulting", domain: "mckinsey.com" },
  { name: "J.P. Morgan", category: "Finance", domain: "jpmorgan.com", icon: "jpmorgan" },
  { name: "Goldman Sachs", category: "Finance", domain: "goldmansachs.com" },
  { name: "Morgan Stanley", category: "Finance", domain: "morganstanley.com" },
  { name: "BlackRock", category: "Finance", domain: "blackrock.com" },
  { name: "Citi", category: "Finance", domain: "citi.com" },
  { name: "Bank of America", category: "Finance", domain: "bankofamerica.com" },
  { name: "Y Combinator", category: "Venture", domain: "ycombinator.com", icon: "ycombinator" },
  { name: "Sequoia", category: "Venture", domain: "sequoiacap.com" },
  { name: "a16z", category: "Venture", domain: "a16z.com" },
  { name: "Stripe", category: "Fintech", domain: "stripe.com", icon: "stripe" },
  { name: "Airbnb", category: "Tech", domain: "airbnb.com", icon: "airbnb" },
  { name: "Uber", category: "Tech", domain: "uber.com", icon: "uber" },
  { name: "LinkedIn", category: "Tech", domain: "linkedin.com", icon: "linkedin" },
  { name: "Adobe", category: "Tech", domain: "adobe.com", icon: "adobe" },
  { name: "Nvidia", category: "Tech", domain: "nvidia.com", icon: "nvidia" },
  { name: "PayPal", category: "Fintech", domain: "paypal.com", icon: "paypal" },
  { name: "SpaceX", category: "Aerospace", domain: "spacex.com", icon: "spacex" },
  { name: "Palantir", category: "Tech", domain: "palantir.com", icon: "palantir" },
  { name: "Databricks", category: "Tech", domain: "databricks.com", icon: "databricks" },
  { name: "OpenAI", category: "AI", domain: "openai.com", icon: "openai" },
  { name: "Figma", category: "Tech", domain: "figma.com", icon: "figma" },
  { name: "Notion", category: "Tech", domain: "notion.so", icon: "notion" },
  { name: "Zoom", category: "Tech", domain: "zoom.us", icon: "zoom" },
  { name: "Snap", category: "Tech", domain: "snap.com", icon: "snapchat" },
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
                color: "#1B212C",
              }}
            >
              Where We Go
            </div>
            <h2
              className="text-[#1B212C] mb-6"
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
                color: "#1B212C",
              }}
            >
              Resources
            </div>
            <h2
              className="text-[#1B212C]"
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
                className="bg-[#FFFFFF] border-4 border-[#1B212C] p-6 hover:bg-[#D0E4EF] transition-all duration-300 group"
              >
                <div className="text-3xl mb-4">{resource.icon}</div>
                <h3
                  className="text-[#1B212C] mb-3 group-hover:text-[#0C141A] transition-colors"
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
                color: "#1B212C",
              }}
            >
              Where We Work
            </div>
            <h2
              className="text-[#1B212C] mb-6"
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
                      ? "border-[#1B212C] bg-[#1B212C] text-[#EEEADE]"
                      : "border-[#1B212C] text-[#1B212C] hover:bg-[#1B212C]/10"
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
                className="aspect-square flex flex-col items-center justify-center border-2 border-[#1B212C] bg-[#EEEADE] hover:border-[#1B212C] hover:bg-white transition-all duration-300 p-3 group"
              >
                {company.icon ? (
                  <img
                    src={`https://cdn.simpleicons.org/${company.icon}`}
                    alt={company.name}
                    className="w-9 h-9 object-contain mb-1"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      (el.nextElementSibling as HTMLElement)?.style.setProperty("display", "flex");
                    }}
                  />
                ) : null}
                <div
                  className="w-9 h-9 rounded bg-[#05006C] items-center justify-center mb-1 flex-shrink-0"
                  style={{ display: company.icon ? "none" : "flex" }}
                >
                  <span className="text-white font-black text-sm" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif" }}>
                    {company.name[0]}
                  </span>
                </div>
                <span
                  className="text-[#1B212C]/50 text-center group-hover:text-[#1B212C] transition-colors"
                  style={{
                    fontFamily: "'Glacial Indifference', serif",
                    fontSize: "0.55rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#EEEADE] border-t-4 border-[#1B212C]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2
            className="text-[#1B212C] mb-6"
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
            className="inline-block px-8 py-4 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
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
