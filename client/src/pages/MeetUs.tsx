/*
 * UCSB SEP Meet Us Page — Official Sigma Eta Pi Brand
 * Static roster: headshots live in @/images/headshots, LinkedIn URLs inline.
 */

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import execHeroBg from "@/images/exec.png";

const HERO_BG = execHeroBg;

// Headshots keyed by kebab-case name: client/src/images/headshots/<slug>.jpg
const HEADSHOTS = import.meta.glob<string>("@/images/headshots/*.jpg", {
  eager: true,
  import: "default",
});

function photoFor(slug: string): string | undefined {
  const hit = Object.entries(HEADSHOTS).find(([p]) => p.endsWith(`/${slug}.jpg`));
  return hit?.[1];
}

interface Member {
  name: string;
  role?: string;
  photoSlug?: string;
  linkedin?: string;
}

const EXEC_BOARD: Member[] = [
  { name: "Mariana França Pires", role: "Co-President",                   photoSlug: "mariana-franca-pires", linkedin: "https://www.linkedin.com/in/mariana-franca-pires-33b001280" },
  { name: "Kate Heidenga",        role: "Co-President",                   photoSlug: "kate-heidenga",        linkedin: "https://www.linkedin.com/in/kateheidenga" },
  { name: "Matthew Chang",        role: "VP of Recruitment",              photoSlug: "matthew-chang",        linkedin: "https://www.linkedin.com/in/matthewzchang" },
  { name: "Kai Abutin",           role: "VP of Operations",               photoSlug: "kai-abutin",           linkedin: "https://www.linkedin.com/in/kai-abutin" },
  { name: "Nirvaan Patel",        role: "VP of Finance",                  photoSlug: "nirvaan-patel",        linkedin: "https://www.linkedin.com/in/nirvaan-patel" },
  { name: "Amaya Bratcher",       role: "VP of Professional Development", photoSlug: "amaya-bratcher",       linkedin: "https://www.linkedin.com/in/aabratcher" },
  { name: "Nina Rossi",           role: "VP of Marketing",                photoSlug: "nina-rossi",           linkedin: "https://www.linkedin.com/in/ninarossii" },
  { name: "Preston Chung",        role: "VP of Brotherhood",              photoSlug: "preston-chung" },
  { name: "Brooke Namie Bradley", role: "VP of Brotherhood",              photoSlug: "brooke-bradley",       linkedin: "https://www.linkedin.com/in/brooke-bradley-562183395" },
  { name: "Vaibhava Raja",        role: "VP of Internal Affairs",         photoSlug: "vaibhava-raja",        linkedin: "https://www.linkedin.com/in/vaibhava-rajesh-0674a5210" },
  { name: "Matthew Vasquez",      role: "VP of External Affairs",         photoSlug: "matthew-vasquez",      linkedin: "https://www.linkedin.com/in/matthewrvasquez" },
  { name: "Piam Parekh",          role: "Chapter Advisor",                photoSlug: "piam-parekh",          linkedin: "https://www.linkedin.com/in/piamparekh" },
  { name: "Shiv Dutta",           role: "Chapter Advisor",                photoSlug: "shiv-dutta",           linkedin: "https://www.linkedin.com/in/shiv-dutta" },
];

// Founding pledge class — full roster (founders are listed only in the Founders section)
const FOUNDING_CLASS: Member[] = [
  { name: "Aaron Ramirez",             photoSlug: "aaron-ramirez",        linkedin: "https://www.linkedin.com/in/aaron-ramirez-ucsb" },
  { name: "Amaya Bratcher",            photoSlug: "amaya-bratcher",       linkedin: "https://www.linkedin.com/in/aabratcher" },
  { name: "Ariana Tran",                photoSlug: "ariana-tran" },
  { name: "Brooke Namie Bradley",      photoSlug: "brooke-bradley",       linkedin: "https://www.linkedin.com/in/brooke-bradley-562183395" },
  { name: "Clay Griffin",              photoSlug: "clay-griffin",         linkedin: "https://www.linkedin.com/in/clay-griffin-aaa567363" },
  { name: "Daysi Recinos",             photoSlug: "daysi-recinos" },
  { name: "Deepthy Mukkara",           photoSlug: "deepthy-mukkara",      linkedin: "https://www.linkedin.com/in/deepthymukkara" },
  { name: "Henry Snow",                photoSlug: "henry-snow",          linkedin: "https://www.linkedin.com/in/henry-snow-787892381" },
  { name: "Jean Kalaw",                photoSlug: "jean-merrill-kalaw" },
  { name: "Julio Bermudez",            photoSlug: "julio-bermudez",       linkedin: "https://www.linkedin.com/in/julio-fernando-bermudez-868a9327b" },
  { name: "Kai Abutin",                photoSlug: "kai-abutin",           linkedin: "https://www.linkedin.com/in/kai-abutin" },
  { name: "Katelyn Nguyen",            photoSlug: "katelyn-nguyen",       linkedin: "https://www.linkedin.com/in/katelyn-nguyen-755884271" },
  { name: "Kyra Chagarlamudi",         photoSlug: "kyra-chagarlamudi",    linkedin: "https://www.linkedin.com/in/kyra-chagarlamudi-54428138a" },
  { name: "Luke Patterson",            photoSlug: "luke-patterson" },
  { name: "Madigan Escobar",           photoSlug: "madigan-escobar",      linkedin: "https://www.linkedin.com/in/madigan-escobar-b6b2b628b" },
  { name: "Mariana França Pires",      photoSlug: "mariana-franca-pires", linkedin: "https://www.linkedin.com/in/mariana-franca-pires-33b001280" },
  { name: "Matthew Chang",             photoSlug: "matthew-chang",        linkedin: "https://www.linkedin.com/in/matthewzchang" },
  { name: "Matthew Roman Vasquez",     photoSlug: "matthew-vasquez",      linkedin: "https://www.linkedin.com/in/matthewrvasquez" },
  { name: "Nina Rossi",                photoSlug: "nina-rossi",           linkedin: "https://www.linkedin.com/in/ninarossii" },
  { name: "Nirvaan Patel",             photoSlug: "nirvaan-patel",       linkedin: "https://www.linkedin.com/in/nirvaan-patel" },
  { name: "Noah de la Rionda",         photoSlug: "noah-de-la-rionda",    linkedin: "https://www.linkedin.com/in/noah-de-la-rionda-41a27b303" },
  { name: "Om Kulkarni",               photoSlug: "om-kulkarni",          linkedin: "https://www.linkedin.com/in/om77" },
  { name: "Preston Chung",             photoSlug: "preston-chung" },
  { name: "Raiyan Khan",               photoSlug: "raiyan-khan",          linkedin: "https://www.linkedin.com/in/raiyankhan1" },
  { name: "Rohan Kamdar",              photoSlug: "rohan-kamdar" },
  { name: "Ryan Nguyen",               photoSlug: "ryan-nguyen",          linkedin: "https://www.linkedin.com/in/ryanlamnguyen03" },
  { name: "Samrita Sivakumar",         photoSlug: "samrita-sivakumar" },
  { name: "Savannah Rivera",           photoSlug: "savannah-rivera" },
  { name: "Sudiksha Kaushik",          photoSlug: "sudiksha-kaushik",     linkedin: "https://www.linkedin.com/in/sudikshakaushik" },
  { name: "Tyler Pintor",              photoSlug: "tyler-pintor" },
  { name: "Vaibhava Sri Rajesh Khanna", photoSlug: "vaibhava-raja",       linkedin: "https://www.linkedin.com/in/vaibhava-rajesh-0674a5210" },
];

// Original 8 founding exec — shown at the bottom with their founding roles
const FOUNDERS: Member[] = [
  { name: "Piam Parekh",     role: "Co-President",           photoSlug: "piam-parekh",      linkedin: "https://www.linkedin.com/in/piamparekh" },
  { name: "Shiv Dutta",      role: "Co-President",           photoSlug: "shiv-dutta",       linkedin: "https://www.linkedin.com/in/shiv-dutta" },
  { name: "Sally Hu",        role: "VP of Operations",       photoSlug: "sally-hu",         linkedin: "https://www.linkedin.com/in/sally-huu" },
  { name: "Saloni Singhal",  role: "VP of Programming",      photoSlug: "saloni-singhal",   linkedin: "https://www.linkedin.com/in/ssaloni-singhal" },
  { name: "Christina Sfatcu",role: "VP of Brotherhood",      photoSlug: "christina-sfatcu", linkedin: "https://www.linkedin.com/in/christina-sfatcu" },
  { name: "Kate Heidenga",   role: "VP of Recruitment",      photoSlug: "kate-heidenga",    linkedin: "https://www.linkedin.com/in/kateheidenga" },
  { name: "Huy Nguyen",      role: "VP of Finance",          photoSlug: "huy-nguyen",       linkedin: "https://www.linkedin.com/in/huynguyen06" },
  { name: "Julia Jimenea",   role: "VP of Public Relations", photoSlug: "julia-jimenea",    linkedin: "https://www.linkedin.com/in/juliajimenea" },
];

function initialsOf(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function LinkedInIcon() {
  return (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const PRESIDENTS = EXEC_BOARD.filter(m => m.role === "Co-President");
const ADVISORS = EXEC_BOARD.filter(m => m.role === "Chapter Advisor");
const VPS = EXEC_BOARD.filter(m => m.role !== "Co-President" && m.role !== "Chapter Advisor");

// Leadership avatar — circular face crop with name/role below
function LeaderAvatar({ member, size }: { member: Member; size: "lg" | "md" | "sm" }) {
  const [imgErr, setImgErr] = useState(false);
  const photo = member.photoSlug ? (photoFor(`${member.photoSlug}-face`) ?? photoFor(member.photoSlug)) : undefined;
  const hasPhoto = photo && !imgErr;
  const dim = size === "lg" ? "w-24 h-24 md:w-28 md:h-28" : size === "md" ? "w-16 h-16 md:w-20 md:h-20" : "w-12 h-12 md:w-14 md:h-14";
  const rootW = size === "lg" ? "w-40" : size === "md" ? "w-24 md:w-28" : "w-24";

  const inner = (
    <div className={`flex flex-col items-center text-center group ${rootW}`}>
      <div className={`${dim} rounded-full overflow-hidden bg-gradient-to-br from-[#D0E4EF] to-[#8FA2C2] ring-2 ring-[#1B212C]/10 group-hover:ring-[#05006C] transition-all duration-200 flex items-center justify-center`}>
        {hasPhoto ? (
          <img src={photo} alt={member.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <span className="text-[#1B212C] font-black" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: size === "lg" ? "1.5rem" : "1rem" }}>
            {initialsOf(member.name)}
          </span>
        )}
      </div>
      <div className="mt-2 text-[#1B212C] font-black uppercase leading-tight" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: size === "lg" ? "0.85rem" : size === "md" ? "0.72rem" : "0.65rem" }}>
        {member.name}
      </div>
      <div className="text-[#1B212C]/60 leading-tight mt-0.5" style={{ fontFamily: "'Glacial Indifference', serif", fontSize: size === "lg" ? "0.75rem" : size === "md" ? "0.65rem" : "0.6rem" }}>
        {member.role}
      </div>
    </div>
  );

  if (member.linkedin) {
    return (
      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

// Small exec chip — compact row card
function ExecChip({ member }: { member: Member }) {
  const [imgErr, setImgErr] = useState(false);
  const photo = member.photoSlug ? (photoFor(`${member.photoSlug}-face`) ?? photoFor(member.photoSlug)) : undefined;
  const hasPhoto = photo && !imgErr;

  const inner = (
    <div className="flex items-center gap-2 px-3 py-2 border border-[#1B212C]/20 bg-[#FFFFFF] hover:bg-[#EEEADE] hover:border-[#05006C] transition-all duration-200 group">
      <div className="w-12 h-12 rounded-full bg-[#05006C] flex-shrink-0 flex items-center justify-center overflow-hidden">
        {hasPhoto ? (
          <img src={photo} alt={member.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <span className="text-[#EEEADE] text-xs font-black" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif" }}>
            {initialsOf(member.name)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[#1B212C] font-bold leading-tight" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "0.75rem" }}>
          {member.name}
        </div>
        <div className="text-[#1B212C]/50 leading-tight" style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.65rem" }}>
          {member.role}
        </div>
      </div>
    </div>
  );

  if (member.linkedin) {
    return (
      <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

// Small member card — founding class + founders grid
function MemberCard({ member }: { member: Member }) {
  const [imgErr, setImgErr] = useState(false);
  const photo = member.photoSlug ? photoFor(member.photoSlug) : undefined;
  const hasPhoto = photo && !imgErr;
  const inner = (
    <>
      <div className="aspect-square bg-gradient-to-br from-[#D0E4EF] to-[#8FA2C2] flex items-center justify-center relative overflow-hidden">
        {hasPhoto ? (
          <img src={photo} alt={member.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <span className="text-[#1B212C] font-bold" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "1.2rem" }}>
            {initialsOf(member.name)}
          </span>
        )}
        {member.linkedin && (
          <div className="absolute inset-0 bg-[#05006C]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-5 h-5 text-white"><LinkedInIcon /></div>
          </div>
        )}
      </div>
      <div className="p-2 bg-[#EEEADE]">
        <div className="text-[#1B212C] font-bold text-center leading-tight" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontSize: "0.7rem" }}>
          {member.name}
        </div>
      </div>
    </>
  );

  if (member.linkedin) {
    return (
      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="group border border-[#1B212C]/30 hover:border-[#05006C] transition-all duration-200 overflow-hidden block">
        {inner}
      </a>
    );
  }
  return <div className="group border border-[#1B212C]/30 overflow-hidden">{inner}</div>;
}

export default function MeetUs() {
  return (
    <div className="min-h-screen bg-[#EEEADE] text-[#0C141A]">
      <Navbar />

      {/* Hero */}
      <section
        className="relative h-72 md:h-96 flex items-end overflow-hidden pt-24"
        style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center 25%" }}
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
      <section className="py-8 bg-[#FFFFFF] border-b border-[#1B212C]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", color: "#1B212C" }}>
              Executive Board
            </div>
            <h2 className="text-[#1B212C]" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)", textTransform: "uppercase" }}>
              Current Leadership
            </h2>
          </div>
          {/* Co-Presidents */}
          <div className="flex justify-center gap-x-10 md:gap-x-14 mb-6">
            {PRESIDENTS.map((member, i) => (
              <LeaderAvatar key={i} member={member} size="lg" />
            ))}
          </div>

          {/* Vice Presidents */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-5 max-w-2xl mx-auto">
            {VPS.map((member, i) => (
              <LeaderAvatar key={i} member={member} size="md" />
            ))}
          </div>

          {/* Chapter Advisors */}
          <div className="flex justify-center gap-x-8 mt-6">
            {ADVISORS.map((member, i) => (
              <LeaderAvatar key={i} member={member} size="sm" />
            ))}
          </div>
        </div>
      </section>

      {/* Founding Class — non-exec founding members */}
      <section className="py-12 bg-[#EEEADE] border-b border-[#1B212C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-[#1B212C]" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)", textTransform: "uppercase" }}>
              Founding Class
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {FOUNDING_CLASS.map((member, i) => <MemberCard key={i} member={member} />)}
          </div>
        </div>
      </section>

      {/* Founders — original 8 exec */}
      <section className="py-12 bg-[#EEEADE] border-b border-[#1B212C]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-[#1B212C]" style={{ fontFamily: "'Helvetica Now', -apple-system, sans-serif", fontWeight: 900, fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)", textTransform: "uppercase" }}>
              Founders
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {FOUNDERS.map((member, i) => <MemberCard key={i} member={member} />)}
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
            Sigma Eta Pi is UCSB's premier entrepreneurship fraternity — a community of builders, founders, and leaders shaping the future of business and technology.
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
