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
  { name: "Piam Parekh",               role: "Co-President",          initials: "PP", slug: "piamparekh" },
  { name: "Shiv Dutta",                role: "Co-President",          initials: "SD", slug: "shiv-dutta" },
  { name: "Kate Heidenga",             role: "VP of Recruitment",     initials: "KH", slug: "kateheidenga" },
  { name: "Huy Nguyen",                role: "VP of Finance",         initials: "HN", slug: "huynguyen06" },
  { name: "Sally Hu",                  role: "VP of Operations",      initials: "SH", slug: "sally-huu" },
  { name: "Julia Jimenea",             role: "VP of Public Relations",initials: "JJ", slug: "juliajimenea" },
  { name: "Saloni Singhal",            role: "VP of Programming",     initials: "SS", slug: "ssaloni-singhal" },
  { name: "Christina Sfatcu",          role: "VP of Brotherhood",     initials: "CS", slug: "christina-sfatcu" },
  { name: "Vaibhava",                  role: "VP of Internal Affairs",initials: "V",  slug: "" },
  { name: "Matthew Vasques",           role: "VP of External Affairs",initials: "MV", slug: "" },
];

// Original 8 founding exec — shown at the bottom with their roles
const FOUNDERS = [
  { name: "Piam Parekh",    role: "Co-President",          initials: "PP" },
  { name: "Shiv Dutta",     role: "Co-President",          initials: "SD" },
  { name: "Sally Hu",       role: "VP of Operations",      initials: "SH" },
  { name: "Saloni Singhal", role: "VP of Programming",     initials: "SS" },
  { name: "Christina Sfatcu",role: "VP of Brotherhood",    initials: "CS" },
  { name: "Kate Heidenga",  role: "VP of Recruitment",     initials: "KH" },
  { name: "Huy Nguyen",     role: "VP of Finance",         initials: "HN" },
  { name: "Julia Jimenea",  role: "VP of Public Relations",initials: "JJ" },
];

const EXEC_NAMES = new Set(EXEC_BOARD.map(m => m.name));
const FOUNDER_NAMES = new Set(FOUNDERS.map(f => f.name));

// Founding pledge class values (DB may have either spelling)
const FOUNDING_CLASS_VALUES = new Set(['Founder', 'Founding Class', 'founding class', 'founder']);

// Match exec member to profile — handles partial name mismatches
function matchExecProfile(memberName: string, profiles: MemberProfile[]): MemberProfile | undefined {
  const lower = memberName.toLowerCase();
  return profiles.find(p => {
    const pLower = p.name.toLowerCase();
    return pLower === lower || pLower.startsWith(lower) || lower.startsWith(pLower.split(' ')[0]);
  });
}

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

// Small exec chip — compact row card
function ExecChip({ member, photo }: { member: typeof EXEC_BOARD[0]; photo?: string }) {
  const [imgErr, setImgErr] = useState(false);
  const hasPhoto = photo && !imgErr;
  const inner = (
    <div className="flex items-center gap-2 px-3 py-2 border border-[#1B212C]/20 bg-[#FFFFFF] hover:bg-[#EEEADE] hover:border-[#05006C] transition-all duration-200 group">
      <div className="w-10 h-10 rounded-full bg-[#05006C] flex-shrink-0 flex items-center justify-center overflow-hidden">
        {hasPhoto ? (
          <img src={photo} alt={member.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <span className="text-[#EEEADE] text-xs font-black" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif" }}>
            {member.initials}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[#1B212C] font-bold truncate" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "0.7rem" }}>
          {member.name}
        </div>
        <div className="text-[#1B212C]/50 truncate" style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.6rem" }}>
          {member.role}
        </div>
      </div>
    </div>
  );

  if (member.slug) {
    return (
      <a href={`https://www.linkedin.com/in/${member.slug}`} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

// Medium founder card — shown in the Founders section with role
function FounderCard({ founder, photo }: { founder: typeof FOUNDERS[0]; photo?: string }) {
  const [imgErr, setImgErr] = useState(false);
  const hasPhoto = photo && !imgErr;
  return (
    <div className="border-2 border-[#05006C] overflow-hidden">
      <div className="aspect-square bg-[#05006C] flex items-center justify-center relative overflow-hidden">
        {hasPhoto ? (
          <img src={photo} alt={founder.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <span
            className="text-[#EEEADE] font-black select-none"
            style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "2rem" }}
          >
            {founder.initials}
          </span>
        )}
      </div>
      <div className="p-3 bg-[#EEEADE]">
        <div className="text-[#1B212C] font-black leading-tight mb-0.5" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "0.8rem" }}>
          {founder.name}
        </div>
        <div className="text-[#05006C]" style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.65rem", letterSpacing: "0.05em" }}>
          {founder.role}
        </div>
      </div>
      <div className="h-0.5 bg-[#05006C]" />
    </div>
  );
}

// Small member card — founding class grid
function MemberCard({ profile }: { profile: MemberProfile }) {
  const [imgErr, setImgErr] = useState(false);
  const linkedinSlug = profile.linkedin ? extractLinkedinSlug(profile.linkedin) : null;
  const initials = profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const hasPhoto = profile.photoUrl && !imgErr;

  const inner = (
    <>
      <div className="aspect-square bg-gradient-to-br from-[#D0E4EF] to-[#8FA2C2] flex items-center justify-center relative overflow-hidden">
        {hasPhoto ? (
          <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <span className="text-[#1B212C] font-bold" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "1.2rem" }}>
            {initials}
          </span>
        )}
        {linkedinSlug && (
          <div className="absolute inset-0 bg-[#05006C]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-5 h-5 text-white"><LinkedInIcon /></div>
          </div>
        )}
      </div>
      <div className="p-1.5 bg-[#EEEADE]">
        <div className="text-[#1B212C] font-bold text-center leading-tight" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "0.6rem" }}>
          {profile.name}
        </div>
      </div>
    </>
  );

  if (profile.linkedin) {
    return (
      <a href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="group border border-[#1B212C]/30 hover:border-[#05006C] transition-all duration-200 overflow-hidden block">
        {inner}
      </a>
    );
  }
  return <div className="group border border-[#1B212C]/30 overflow-hidden">{inner}</div>;
}

export default function MeetUs() {
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);

  useEffect(() => {
    fetch("/api/profiles")
      .then(r => r.ok ? r.json() : [])
      .then(setProfiles)
      .catch(() => {});
  }, []);

  // Build name → profile map; prefer profiles that have a photo or linkedin over bare ones
  const profileByName = new Map<string, MemberProfile>();
  for (const p of profiles) {
    const existing = profileByName.get(p.name);
    if (!existing || (!existing.photoUrl && !existing.linkedin && (p.photoUrl || p.linkedin))) {
      profileByName.set(p.name, p);
    }
  }

  // Founding class = any founding pledge class value, not an original founder exec — deduplicated by name
  const foundingClassMembers = Array.from(
    profiles
      .filter(p => FOUNDING_CLASS_VALUES.has(p.pledgeClass ?? '') && !FOUNDER_NAMES.has(p.name))
      .reduce((map, p) => {
        const ex = map.get(p.name);
        if (!ex || (!ex.photoUrl && !ex.linkedin && (p.photoUrl || p.linkedin))) map.set(p.name, p);
        return map;
      }, new Map<string, MemberProfile>())
      .values()
  );

  // Future pledge classes = non-founding pledge classes, grouped by name
  const futureClasses = profiles.reduce((acc, p) => {
    if (!p.pledgeClass || FOUNDING_CLASS_VALUES.has(p.pledgeClass)) return acc;
    if (!acc[p.pledgeClass]) acc[p.pledgeClass] = [];
    acc[p.pledgeClass].push(p);
    return acc;
  }, {} as Record<string, MemberProfile[]>);

  return (
    <div className="min-h-screen bg-[#EEEADE] text-[#0C141A]">
      <Navbar />

      {/* Hero */}
      <section
        className="relative h-72 md:h-96 flex items-end overflow-hidden pt-24"
        style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center top" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", color: "#D0E4EF" }}>
            Our Team
          </div>
          <h1 className="text-white" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 5rem)", textTransform: "uppercase", lineHeight: 1 }}>
            Meet the Team
          </h1>
        </div>
      </section>

      {/* Executive Board — compact */}
      <section className="py-10 bg-[#FFFFFF] border-b border-[#1B212C]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", color: "#1B212C" }}>
              Executive Board
            </div>
            <h2 className="text-[#1B212C]" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)", textTransform: "uppercase" }}>
              Current Leadership
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {EXEC_BOARD.map((member, i) => (
              <ExecChip key={i} member={member} photo={matchExecProfile(member.name, profiles)?.photoUrl} />
            ))}
          </div>
        </div>
      </section>

      {/* Future pledge classes — one section per class, newest first */}
      {Object.entries(futureClasses).map(([className, members]) => (
        <section key={className} className="py-12 bg-[#EEEADE] border-b border-[#1B212C]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", color: "#1B212C" }}>
                Pledge Class
              </div>
              <h2 className="text-[#1B212C]" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)", textTransform: "uppercase" }}>
                {className}
              </h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {members.map(p => <MemberCard key={p.id} profile={p} />)}
            </div>
          </div>
        </section>
      ))}

      {/* Founding Class — non-exec founding members */}
      <section className="py-12 bg-[#EEEADE] border-b border-[#1B212C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", color: "#1B212C" }}>
              Pledge Class
            </div>
            <h2 className="text-[#1B212C]" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)", textTransform: "uppercase" }}>
              Founding Class
            </h2>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {foundingClassMembers.map(p => <MemberCard key={p.id} profile={p} />)}
          </div>
        </div>
      </section>

      {/* Founders — original 8 exec with roles */}
      <section className="py-16 bg-[#FFFFFF] border-b-4 border-[#05006C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", color: "#05006C" }}>
              The Beginning
            </div>
            <h2 className="text-[#1B212C]" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", textTransform: "uppercase" }}>
              Founders
            </h2>
            <p className="text-[#0C141A]/50 mt-2 max-w-xl mx-auto" style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.9rem" }}>
              The eight who built Sigma Eta Pi Epsilon Chapter from the ground up.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FOUNDERS.map((founder, i) => (
              <FounderCard key={i} founder={founder} photo={profileByName.get(founder.name)?.photoUrl} />
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 bg-[#EEEADE]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", color: "#1B212C" }}>
            Join Us
          </div>
          <h2 className="text-[#1B212C] mb-6" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 4rem)", textTransform: "uppercase", lineHeight: 1 }}>
            Be Part of Our Story
          </h2>
          <p className="text-[#0C141A]/70 text-lg mb-10 max-w-2xl mx-auto" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            We're building the founder class of Sigma Eta Pi at UCSB. Join us and become part of a community of entrepreneurs, innovators, and leaders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/recruitment" className="px-8 py-4 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", letterSpacing: "0.05em" }}>
              APPLY NOW
            </Link>
            <Link href="/about" className="px-8 py-4 border-2 border-[#1B212C] text-[#1B212C] font-bold rounded-lg transition-all duration-300 hover:bg-[#1B212C] hover:text-[#EEEADE] text-sm" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", letterSpacing: "0.05em" }}>
              LEARN MORE
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
