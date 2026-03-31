/*
 * UCSB SEP Meet Us Page — Official Sigma Eta Pi Brand
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-hero-bg-QdjE5NSyrfDKbv92hvh9eH.webp";

const EXEC_BOARD = [
  { name: "Piam Parekh", role: "Co-President", initials: "PP" },
  { name: "Shiv Dutta", role: "Co-President", initials: "SD" },
  { name: "Kate Heidenga", role: "VP of Recruitment", initials: "KH" },
  { name: "Huy Nguyen", role: "VP of Finance", initials: "HN" },
  { name: "Sally Hu", role: "VP of Operations", initials: "SH" },
  { name: "Julia Jimenea", role: "VP of Public Relations", initials: "JJ" },
  { name: "Saloni Singhal", role: "VP of Programming", initials: "SS" },
  { name: "Christina Sfatcu", role: "VP of Brotherhood", initials: "CS" },
];

export default function MeetUs() {
  return (
    <div className="min-h-screen bg-[#EEEADE] text-[#0C141A]">
      <Navbar />

      {/* Page Hero */}
      <section
        className="relative h-72 md:h-96 flex items-end overflow-hidden pt-24"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
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
            Our Team
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
            Meet the Executive Board
          </h1>
        </div>
      </section>

      {/* Executive Board */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#1B212C",
              }}
            >
              Executive Board
            </div>
            <h2
              className="text-[#1B212C] mb-4"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                textTransform: "uppercase",
              }}
            >
              The Leaders of Epsilon Chapter
            </h2>
            <p className="text-[#0C141A]/60 max-w-2xl mx-auto" style={{ fontFamily: "'Glacial Indifference', serif" }}>
              Our executive board is composed of dedicated students who are passionate about entrepreneurship, leadership, and building a thriving community at UCSB.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {EXEC_BOARD.map((member, i) => (
              <div
                key={i}
                className="group border-4 border-[#1B212C] hover:border-[#D0E4EF] transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-[#D0E4EF] to-[#8FA2C2] flex items-center justify-center relative">
                  <div
                    className="text-[#1B212C] font-bold"
                    style={{
                      fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: "3rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {member.initials}
                  </div>
                  <div className="absolute inset-0 bg-[#1B212C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-4 bg-[#EEEADE]">
                  <div
                    className="text-[#1B212C] font-bold text-sm mb-1"
                    style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                  >
                    {member.name}
                  </div>
                  <div
                    className="text-[#1B212C] text-xs tracking-wide"
                    style={{
                      fontFamily: "'Glacial Indifference', serif",
                      fontSize: "0.7rem",
                    }}
                  >
                    {member.role}
                  </div>
                </div>

                <div className="h-1 bg-[#1B212C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Team CTA */}
      <section className="py-20 bg-[#EEEADE] border-t-4 border-[#1B212C]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              color: "#1B212C",
            }}
          >
            Join Us
          </div>
          <h2
            className="text-[#1B212C] mb-6"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2rem, 5vw, 4rem)",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Be Part of Our Story
          </h2>
          <p className="text-[#0C141A]/70 text-lg mb-10 max-w-2xl mx-auto" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            We're building the founding class of Sigma Eta Pi at UCSB. Join us and become part of a community of entrepreneurs, innovators, and leaders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/recruitment"
              className="px-8 py-4 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              APPLY NOW
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border-2 border-[#1B212C] text-[#1B212C] font-bold rounded-lg transition-all duration-300 hover:bg-[#1B212C] hover:text-[#EEEADE] text-sm"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              LEARN MORE
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
