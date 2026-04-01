/*
 * UCSB SEP Meet Us Page — Official Sigma Eta Pi Brand
 */

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-hero-bg-QdjE5NSyrfDKbv92hvh9eH.webp";

// LinkedIn slugs are best-guess from names — update if a person's actual slug differs
const EXEC_BOARD = [
  { name: "Piam Parekh", role: "Co-President", initials: "PP", slug: "piam-parekh" },
  { name: "Shiv Dutta", role: "Co-President", initials: "SD", slug: "shiv-dutta" },
  { name: "Kate Heidenga", role: "VP of Recruitment", initials: "KH", slug: "kate-heidenga" },
  { name: "Huy Nguyen", role: "VP of Finance", initials: "HN", slug: "huy-nguyen" },
  { name: "Sally Hu", role: "VP of Operations", initials: "SH", slug: "sally-hu" },
  { name: "Julia Jimenea", role: "VP of Public Relations", initials: "JJ", slug: "julia-jimenea" },
  { name: "Saloni Singhal", role: "VP of Programming", initials: "SS", slug: "saloni-singhal" },
  { name: "Christina Sfatcu", role: "VP of Brotherhood", initials: "CS", slug: "christina-sfatcu" },
];

const FOUNDING_CLASS = [
  { name: "Aaron Ramirez", initials: "AR", slug: "aaron-ramirez" },
  { name: "Amaya Bratcher", initials: "AB", slug: "amaya-bratcher" },
  { name: "Ariana Tran", initials: "AT", slug: "ariana-tran" },
  { name: "Brooke Namie Bradley", initials: "BB", slug: "brooke-namie-bradley" },
  { name: "Clay Griffin", initials: "CG", slug: "clay-griffin" },
  { name: "Daysi Recinos", initials: "DR", slug: "daysi-recinos" },
  { name: "Deepthy Mukkara", initials: "DM", slug: "deepthy-mukkara" },
  { name: "Henry Snow", initials: "HS", slug: "henry-snow" },
  { name: "Jack Larson", initials: "JL", slug: "jack-larson" },
  { name: "Jean Kalaw", initials: "JK", slug: "jean-kalaw" },
  { name: "Julio Bermudez", initials: "JB", slug: "julio-bermudez" },
  { name: "Kai Abutin", initials: "KA", slug: "kai-abutin" },
  { name: "Katelyn Nguyen", initials: "KN", slug: "katelyn-nguyen" },
  { name: "Kyra Chagarlamudi", initials: "KC", slug: "kyra-chagarlamudi" },
  { name: "Luke Patterson", initials: "LP", slug: "luke-patterson" },
  { name: "Madigan Escobar", initials: "ME", slug: "madigan-escobar" },
  { name: "Mariana França Pires", initials: "MP", slug: "mariana-franca-pires" },
  { name: "Matthew Chang", initials: "MC", slug: "matthew-chang" },
  { name: "Matthew Roman Vasquez", initials: "MV", slug: "matthew-roman-vasquez" },
  { name: "Nina Rossi", initials: "NR", slug: "nina-rossi" },
  { name: "Nirvaan Patel", initials: "NP", slug: "nirvaan-patel" },
  { name: "Noah de la Rionda", initials: "NR", slug: "noah-de-la-rionda" },
  { name: "Om Kulkarni", initials: "OK", slug: "om-kulkarni" },
  { name: "Preston Chung", initials: "PC", slug: "preston-chung" },
  { name: "Raiyan Khan", initials: "RK", slug: "raiyan-khan" },
  { name: "Rohan Kamdar", initials: "RK", slug: "rohan-kamdar" },
  { name: "Ryan Nguyen", initials: "RN", slug: "ryan-nguyen" },
  { name: "Samrita Sivakumar", initials: "SS", slug: "samrita-sivakumar" },
  { name: "Savannah Rivera", initials: "SR", slug: "savannah-rivera" },
  { name: "Sudiksha Kaushik", initials: "SK", slug: "sudiksha-kaushik" },
  { name: "Tyler Pintor", initials: "TP", slug: "tyler-pintor" },
  { name: "Vaibhava Sri Rajesh Khanna", initials: "VK", slug: "vaibhava-sri-rajesh-khanna" },
];

function ExecCard({ member }: { member: typeof EXEC_BOARD[0] }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <a
      href={`https://www.linkedin.com/in/${member.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group border-4 border-[#1B212C] hover:border-[#05006C] transition-all duration-300 overflow-hidden block"
    >
      <div className="aspect-[3/4] bg-gradient-to-br from-[#D0E4EF] to-[#8FA2C2] flex items-center justify-center relative overflow-hidden">
        {!imgErr ? (
          <img
            src={`https://unavatar.io/linkedin/${member.slug}`}
            alt={member.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
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
        )}
        {/* LinkedIn hover overlay */}
        <div className="absolute inset-0 bg-[#05006C]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </div>
      </div>

      <div className="p-4 bg-[#EEEADE]">
        <div
          className="text-[#1B212C] font-bold text-sm mb-1"
          style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        >
          {member.name}
        </div>
        <div
          className="text-[#1B212C]/60 text-xs tracking-wide"
          style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.7rem" }}
        >
          {member.role}
        </div>
      </div>

      <div className="h-1 bg-[#05006C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </a>
  );
}

function FoundingCard({ member }: { member: typeof FOUNDING_CLASS[0] }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <a
      href={`https://www.linkedin.com/in/${member.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group border-2 border-[#1B212C] hover:border-[#05006C] transition-all duration-300 overflow-hidden block"
    >
      <div className="aspect-square bg-gradient-to-br from-[#D0E4EF] to-[#8FA2C2] flex items-center justify-center relative overflow-hidden">
        {!imgErr ? (
          <img
            src={`https://unavatar.io/linkedin/${member.slug}`}
            alt={member.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="text-[#1B212C] font-bold"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "1.5rem",
            }}
          >
            {member.initials}
          </div>
        )}
        <div className="absolute inset-0 bg-[#05006C]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </div>
      </div>
      <div className="p-2 bg-[#EEEADE]">
        <div
          className="text-[#1B212C] font-bold text-center leading-tight"
          style={{
            fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "0.7rem",
          }}
        >
          {member.name}
        </div>
      </div>
    </a>
  );
}

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
            Meet the Team
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
              Our executive board is composed of dedicated students passionate about entrepreneurship, leadership, and building a thriving community at UCSB.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {EXEC_BOARD.map((member, i) => (
              <ExecCard key={i} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Founding Class */}
      <section className="py-20 bg-[#EEEADE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#1B212C",
              }}
            >
              Founding Class
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
              Building Something New
            </h2>
            <p className="text-[#0C141A]/60 max-w-2xl mx-auto" style={{ fontFamily: "'Glacial Indifference', serif" }}>
              The members who started it all — the founding class of Sigma Eta Pi at UC Santa Barbara.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {FOUNDING_CLASS.map((member, i) => (
              <FoundingCard key={i} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 bg-[#FFFFFF] border-t-4 border-[#1B212C]">
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
