/*
 * UCSB SEP Meet Us Page — "Silicon Ambition" Design
 * Executive board members with photo cards
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

// Placeholder colors for member cards (in absence of real photos)
const CARD_COLORS = [
  "from-green-900/60 to-green-800/30",
  "from-emerald-900/60 to-emerald-800/30",
  "from-teal-900/60 to-teal-800/30",
  "from-green-900/60 to-emerald-800/30",
  "from-emerald-900/60 to-green-800/30",
  "from-teal-900/60 to-green-800/30",
  "from-green-900/60 to-teal-800/30",
  "from-emerald-900/60 to-teal-800/30",
];

export default function MeetUs() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Navbar />

      {/* Page Hero */}
      <section
        className="relative h-72 md:h-96 flex items-end overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <div className="sep-label mb-2">Our Team</div>
          <h1
            className="text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
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
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="sep-label mb-3">Executive Board</div>
            <h2
              className="text-white mb-4"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                textTransform: "uppercase",
              }}
            >
              The Leaders of Epsilon Chapter
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              Our executive board is composed of dedicated students who are passionate about entrepreneurship, leadership, and building a thriving community at UCSB.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {EXEC_BOARD.map((member, i) => (
              <div
                key={i}
                className="group relative overflow-hidden border border-white/10 hover:border-green-400/50 transition-all duration-300"
              >
                {/* Member photo placeholder */}
                <div
                  className={`aspect-[3/4] bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} flex items-center justify-center relative`}
                >
                  {/* Initials */}
                  <div
                    className="text-white/80 font-bold"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "3rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {member.initials}
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Member info */}
                <div className="p-4 bg-[#1A1A1A]">
                  <div
                    className="text-white font-semibold text-sm mb-1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {member.name}
                  </div>
                  <div
                    className="text-green-400 text-xs tracking-wide"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem" }}
                  >
                    {member.role}
                  </div>
                </div>

                {/* Green accent bottom border on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Team CTA */}
      <section className="py-20 bg-[#0D0D0D] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="sep-label mb-4">Join Us</div>
          <h2
            className="text-white mb-6"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2rem, 5vw, 4rem)",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Be Part of Our Story
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            We're building the founding class of Sigma Eta Pi at UCSB. Join us and become part of a community of entrepreneurs, innovators, and leaders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/recruitment" className="sep-btn-green text-sm px-8 py-4">
              Apply Now
            </Link>
            <Link href="/about" className="sep-btn-primary text-sm px-8 py-4">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
