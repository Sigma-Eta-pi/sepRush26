/*
 * UCSB SEP Meet Us Page — Official Sigma Eta Pi Brand
 */

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import execHeroBg from "@/images/exec.png";

const HERO_BG = execHeroBg;

const EXEC_BOARD = [
  { name: "Piam Parekh", role: "Co-President", initials: "PP", slug: "piamparekh" },
  { name: "Shiv Dutta", role: "Co-President", initials: "SD", slug: "shiv-dutta" },
  { name: "Kate Heidenga", role: "VP of Recruitment", initials: "KH", slug: "kateheidenga" },
  { name: "Huy Nguyen", role: "VP of Finance", initials: "HN", slug: "huynguyen06" },
  { name: "Sally Hu", role: "VP of Operations", initials: "SH", slug: "sally-huu" },
  { name: "Julia Jimenea", role: "VP of Public Relations", initials: "JJ", slug: "juliajimenea" },
  { name: "Saloni Singhal", role: "VP of Programming", initials: "SS", slug: "ssaloni-singhal" },
  { name: "Christina Sfatcu", role: "VP of Brotherhood", initials: "CS", slug: "christina-sfatcu" },
  { name: "Vaibhava", role: "VP of Internal Affairs", initials: "V", slug: "" },
  { name: "Matthew Vasques", role: "VP of External Affairs", initials: "MV", slug: "" },
];

interface MemberProfile {
  id: string;
  userId: string;
  name: string;
  photoUrl?: string;
  major?: string;
  pledgeClass?: string;
  linkedin?: string;
}

function extractLinkedinSlug(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
  if (match) return match[1].replace(/\/$/, "");
  return url.trim().replace(/\/$/, "");
}

function LinkedInIcon() {
  return (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function useLinkedinPhoto(slug: string, overrideUrl?: string) {
  const [photo, setPhoto] = useState<string | null>(overrideUrl || null);

  useEffect(() => {
    if (overrideUrl) { setPhoto(overrideUrl); return; }
    fetch(`/api/proxy/linkedin-photo/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.url) setPhoto(d.url); })
      .catch(() => {});
  }, [slug, overrideUrl]);

  return photo;
}

function ExecCard({ member, profilePhoto }: { member: typeof EXEC_BOARD[0]; profilePhoto?: string }) {
  const photo = useLinkedinPhoto(member.slug, profilePhoto);
  const [imgErr, setImgErr] = useState(false);

  return (
    <a
      href={`https://www.linkedin.com/in/${member.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group border-4 border-[#1B212C] hover:border-[#05006C] transition-all duration-300 overflow-hidden block"
    >
      <div className="aspect-square bg-[#05006C] flex items-center justify-center relative overflow-hidden">
        {photo && !imgErr ? (
          <img
            src={photo}
            alt={member.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="text-[#EEEADE] font-bold select-none"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "2rem",
              letterSpacing: "0.05em",
            }}
          >
            {member.initials}
          </div>
        )}
        <div className="absolute inset-0 bg-[#05006C]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-8 h-8 text-white">
            <LinkedInIcon />
          </div>
        </div>
      </div>
      <div className="p-3 bg-[#EEEADE]">
        <div
          className="text-[#1B212C] font-bold leading-tight mb-0.5"
          style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: "0.75rem" }}
        >
          {member.name}
        </div>
        <div
          className="text-[#1B212C]/60 tracking-wide"
          style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.65rem" }}
        >
          {member.role}
        </div>
      </div>
      <div className="h-1 bg-[#05006C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </a>
  );
}

function DynamicMemberCard({ profile }: { profile: MemberProfile }) {
  const [imgErr, setImgErr] = useState(false);
  const linkedinSlug = profile.linkedin ? extractLinkedinSlug(profile.linkedin) : null;
  const proxyPhoto = useLinkedinPhoto(linkedinSlug || '', profile.photoUrl);
  const photoSrc = proxyPhoto || null;
  const initials = profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const CardInner = (
    <>
      <div className="aspect-square bg-gradient-to-br from-[#D0E4EF] to-[#8FA2C2] flex items-center justify-center relative overflow-hidden">
        {photoSrc && !imgErr ? (
          <img
            src={photoSrc}
            alt={profile.name}
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
            {initials}
          </div>
        )}
        {linkedinSlug && (
          <div className="absolute inset-0 bg-[#05006C]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-7 h-7 text-white">
              <LinkedInIcon />
            </div>
          </div>
        )}
      </div>
      <div className="p-2 bg-[#EEEADE]">
        <div
          className="text-[#1B212C] font-bold text-center leading-tight"
          style={{
            fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "0.7rem",
          }}
        >
          {profile.name}
        </div>
        {profile.pledgeClass && (
          <div
            className="text-[#1B212C]/50 text-center mt-0.5"
            style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.6rem" }}
          >
            {profile.pledgeClass}
          </div>
        )}
      </div>
    </>
  );

  if (profile.linkedin) {
    return (
      <a
        href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group border-2 border-[#1B212C] hover:border-[#05006C] transition-all duration-300 overflow-hidden block"
      >
        {CardInner}
      </a>
    );
  }

  return (
    <div className="group border-2 border-[#1B212C] transition-all duration-300 overflow-hidden">
      {CardInner}
    </div>
  );
}

export default function MeetUs() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);

  useEffect(() => {
    fetch("/api/profiles")
      .then(r => r.ok ? r.json() : [])
      .then(setProfiles)
      .catch(() => {});
  }, []);

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

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {EXEC_BOARD.map((member, i) => {
              const matched = profiles.find(p => {
                if (!p.linkedin) return false;
                const m = p.linkedin.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
                return m && m[1].replace(/\/$/, '') === member.slug;
              });
              return <ExecCard key={i} member={member} profilePhoto={matched?.photoUrl} />;
            })}
          </div>
        </div>
      </section>

      {/* Founder Class */}
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
              Founder Class
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
              The members who started it all — the founder class of Sigma Eta Pi at UC Santa Barbara.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {profiles.filter(p => p.pledgeClass === 'Founder').map((profile) => (
              <DynamicMemberCard key={profile.id} profile={profile} />
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
            We're building the founder class of Sigma Eta Pi at UCSB. Join us and become part of a community of entrepreneurs, innovators, and leaders.
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
