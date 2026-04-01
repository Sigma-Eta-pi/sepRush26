/*
 * UCSB SEP Home Page — Official Sigma Eta Pi Brand
 * Light backgrounds, navy accents, elegant typography
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBg from "@/images/hikephoto.png";
import careersBg from "@/images/bruintank.png"

const HERO_BG = heroBg;
const CAREERS_BG = careersBg;
const BROTHERHOOD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-values-brotherhood-FBLsWtvH52zdAHRAWhKhwz.webp";
const INNOVATION_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-values-innovation-Y8mrMA9TsjTcWgPnvxRjyd.webp";
const ABOUT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-about-bg-Sx7XK3mHc53GjCcs5HyE2K.webp";

const VALUES = [
  {
    id: 0,
    label: "Innovation",
    title: "Innovation",
    description: "Believe that embracing innovation is key to shaping the future and driving meaningful change. We challenge the status quo and build what doesn't yet exist.",
    image: INNOVATION_IMG,
  },
  {
    id: 1,
    label: "Brotherhood",
    title: "Brotherhood",
    description: "Support one another through challenges and triumphs, creating a welcoming and inclusive environment where everyone feels valued. Our bond extends beyond campus.",
    image: BROTHERHOOD_IMG,
  },
  {
    id: 2,
    label: "Leadership",
    title: "Leadership",
    description: "Fosters personal growth while equipping members to make meaningful impact. We develop the next generation of entrepreneurs, founders, and industry leaders.",
    image: ABOUT_BG,
  },
];

const COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Tesla", domain: "tesla.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "IBM", domain: "ibm.com" },
  { name: "Intel", domain: "intel.com" },
  { name: "Deloitte", domain: "deloitte.com" },
  { name: "PwC", domain: "pwc.com" },
  { name: "EY", domain: "ey.com" },
  { name: "KPMG", domain: "kpmg.com" },
  { name: "Accenture", domain: "accenture.com" },
  { name: "J.P. Morgan", domain: "jpmorgan.com" },
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "Morgan Stanley", domain: "morganstanley.com" },
  { name: "BlackRock", domain: "blackrock.com" },
  { name: "Citi", domain: "citi.com" },
  { name: "Y Combinator", domain: "ycombinator.com" },
  { name: "Sequoia", domain: "sequoiacap.com" },
  { name: "a16z", domain: "a16z.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Lyft", domain: "lyft.com" },
  { name: "Snap", domain: "snap.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Nvidia", domain: "nvidia.com" },
  { name: "PayPal", domain: "paypal.com" },
  { name: "Visa", domain: "visa.com" },
  { name: "SpaceX", domain: "spacex.com" },
  { name: "Palantir", domain: "palantir.com" },
  { name: "Databricks", domain: "databricks.com" },
  { name: "OpenAI", domain: "openai.com" },
  { name: "Figma", domain: "figma.com" },
  { name: "Notion", domain: "notion.so" },
  { name: "Zoom", domain: "zoom.us" },
];

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, description, startCount }: {
  value: number; suffix: string; label: string; description: string; startCount: boolean;
}) {
  const count = useCountUp(value, 1800, startCount);
  return (
    <div className="text-center px-8 py-10 border-r border-[#1B212C]/20 last:border-r-0 flex-1">
      <div
        className="text-[#1B212C] font-bold mb-2"
        style={{
          fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: "3rem",
          letterSpacing: "-0.02em",
        }}
      >
        {count}{suffix}
      </div>
      <div
        className="text-[#1B212C] font-bold mt-2 mb-3 text-lg"
        style={{
          fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <p className="text-[#0C141A]/60 text-sm leading-relaxed max-w-xs mx-auto" style={{ fontFamily: "'Glacial Indifference', serif" }}>
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const [activeValue, setActiveValue] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveValue((prev) => (prev + 1) % VALUES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#EEEADE] text-[#0C141A]">
      <Navbar />

      {/* ─── HERO SECTION ─── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#EEEADE]" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div
            className="inline-block mb-6 px-4 py-1.5 border-2 border-[#1B212C] text-[#1B212C] text-xs tracking-widest uppercase"
            style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
          >
            Epsilon Chapter · UCSB
          </div>

          <h1
            className="text-white leading-none mb-4"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3.5rem, 10vw, 8rem)",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            SIGMA ETA PI
          </h1>

          <p
            className="text-[#0C141A]/80 mb-10 max-w-2xl mx-auto"
            style={{
              fontFamily: "'Glacial Indifference', serif",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              fontWeight: 400,
              letterSpacing: "0.05em",
            }}
          >
            The Premier Entrepreneurship Fraternity at UCSB
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/recruitment"
              className="px-8 py-4 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              JOIN OUR FOUNDING CLASS
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

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-[#1B212C]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B212C]" />
        </div>
      </section>

      {/* ─── STATS SECTION ─── */}
      <section ref={statsRef} className="bg-[#FFFFFF] border-y-4 border-[#1B212C]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#1B212C]/20">
            <StatCard
              value={21}
              suffix="+"
              label="Ventures Launched"
              description="Across all chapters, members have launched over 21 ventures, including Y Combinator-backed projects and initiatives acquired for $90 million."
              startCount={statsVisible}
            />
            <StatCard
              value={90}
              suffix="M+"
              label="Acquisition Value"
              description="Member-founded ventures have been acquired for over $90 million, demonstrating the real-world impact of our entrepreneurship community."
              startCount={statsVisible}
            />
            <StatCard
              value={350}
              suffix="+"
              label="Chapters Nationwide"
              description="Sigma Eta Pi spans hundreds of chapters across the country, offering a powerful network of entrepreneurs, founders, and innovators."
              startCount={statsVisible}
            />
          </div>
        </div>
      </section>

      {/* ─── CORE VALUES SECTION ─── */}
      <section className="py-24 bg-[#EEEADE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#1B212C",
              }}
            >
              Our Core Values
            </div>
            <h2
              className="text-[#1B212C]"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              Here at Sigma Eta Pi, we are committed
              <br className="hidden md:block" /> to our fundamental values.
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-2xl border-4 border-[#1B212C]">
            <div
              className="relative h-[500px] md:h-[600px] overflow-hidden"
              style={{
                backgroundImage: `url(${VALUES[activeValue].image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "background-image 0.5s ease",
              }}
            >
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />

              <div className="relative z-10 h-full flex items-end p-8 md:p-16">
                <div className="max-w-xl">
                  <div
                    className="text-xs font-bold tracking-widest uppercase mb-3"
                    style={{
                      fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      color: "#D0E4EF",
                    }}
                  >
                    {VALUES[activeValue].label}
                  </div>
                  <h3
                    className="text-white mb-4"
                    style={{
                      fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(2rem, 5vw, 3.5rem)",
                      textTransform: "uppercase",
                    }}
                  >
                    {VALUES[activeValue].title}
                  </h3>
                  <p
                    className="text-white/90 text-base leading-relaxed mb-8"
                    style={{ fontFamily: "'Glacial Indifference', serif" }}
                  >
                    {VALUES[activeValue].description}
                  </p>
                  <Link
                    href="/about"
                    className="inline-block px-6 py-3 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#EEEADE] hover:text-[#1B212C] text-sm"
                    style={{
                      fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3">
              {VALUES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveValue(i)}
                  className={`w-2 h-2 transition-all duration-300 ${
                    i === activeValue ? "bg-[#1B212C] w-6" : "bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to value ${i + 1}`}
                />
              ))}
              <button
                onClick={() => setActiveValue((prev) => (prev - 1 + VALUES.length) % VALUES.length)}
                className="ml-2 w-10 h-10 border-2 border-white/30 flex items-center justify-center text-white hover:border-[#D0E4EF] hover:text-[#D0E4EF] transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setActiveValue((prev) => (prev + 1) % VALUES.length)}
                className="w-10 h-10 border-2 border-white/30 flex items-center justify-center text-white hover:border-[#D0E4EF] hover:text-[#D0E4EF] transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex border-t-4 border-[#1B212C] mt-0">
            {VALUES.map((value, i) => (
              <button
                key={i}
                onClick={() => setActiveValue(i)}
                className={`flex-1 py-5 text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
                  i === activeValue
                    ? "bg-[#1B212C] text-[#EEEADE]"
                    : "text-[#1B212C] hover:bg-[#1B212C]/10"
                }`}
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontSize: "0.7rem",
                }}
              >
                {value.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLACES WE'RE AT SECTION ─── */}
      <section
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage: `url(${CAREERS_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#D0E4EF",
              }}
            >
              Places We're At
            </div>
            <h2
              className="text-white mb-4"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                textTransform: "uppercase",
              }}
            >
              Anywhere you want to go,
              <br /> we're probably there!
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto" style={{ fontFamily: "'Glacial Indifference', serif" }}>
              Sigma Eta Pi stays actively connected with its alumni, creating lasting professional support across different industries and companies.
            </p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-12">
            {COMPANIES.slice(0, 32).map((company, i) => (
              <div
                key={i}
                className="aspect-square flex flex-col items-center justify-center border-2 border-white/20 bg-white/5 hover:border-[#D0E4EF]/60 hover:bg-white/10 transition-all duration-300 p-2 group"
              >
                <img
                  src={`https://logo.clearbit.com/${company.domain}`}
                  alt={company.name}
                  className="w-8 h-8 object-contain filter brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <span
                  className="hidden text-white/70 text-xs font-medium text-center leading-tight"
                  style={{ fontFamily: "'Glacial Indifference', serif", fontSize: "0.6rem" }}
                >
                  {company.name}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/careers"
              className="inline-block px-8 py-4 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#EEEADE] hover:text-[#1B212C] text-sm"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              OUR CAREERS
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ABOUT TEASER SECTION ─── */}
      <section className="py-24 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="text-xs font-bold tracking-widest uppercase mb-4"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  color: "#1B212C",
                }}
              >
                About Sigma Eta Pi
              </div>
              <h2
                className="text-[#1B212C] mb-6"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                UCSB's Premier Co-Ed Entrepreneurship Fraternity
              </h2>
              <p className="text-[#0C141A]/70 text-base leading-relaxed mb-6" style={{ fontFamily: "'Glacial Indifference', serif" }}>
                Sigma Eta Pi is a co-ed professional business entrepreneurship fraternity dedicated to cultivating innovative, action-oriented leaders. Our members, representing a diverse range of academic disciplines, engage in a community that emphasizes collaboration, mentorship, and the practical application of entrepreneurial skills.
              </p>
              <p className="text-[#0C141A]/70 text-base leading-relaxed mb-8" style={{ fontFamily: "'Glacial Indifference', serif" }}>
                Founded in 2010 at UCLA as the first entrepreneurship fraternity on the West Coast, Sigma Eta Pi maintains strong connections to prominent startup ecosystems, including Silicon Valley and Silicon Beach.
              </p>
              <Link
                href="/about"
                className="inline-block px-8 py-4 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                LEARN MORE ABOUT US
              </Link>
            </div>
            <div className="relative">
              <div
                className="aspect-[4/3] overflow-hidden border-4 border-[#1B212C]"
                style={{
                  backgroundImage: `url(${ABOUT_BG})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="absolute bottom-6 left-6 bg-[#1B212C] text-[#EEEADE] px-6 py-4 border-4 border-[#EEEADE]">
                <div
                  className="font-bold"
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontSize: "2rem",
                  }}
                >
                  2026
                </div>
                <div className="text-xs tracking-widest uppercase" style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                  Founded at UCSB
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RECRUITMENT CTA ─── */}
      <section className="py-24 bg-[#EEEADE] border-t-4 border-[#1B212C]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              color: "#1B212C",
            }}
          >
            Recruitment
          </div>
          <h2
            className="text-[#1B212C] mb-6"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Join Our Founding Class
          </h2>
          <p className="text-[#0C141A]/70 text-lg mb-10 max-w-2xl mx-auto" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            As we relaunch at UCSB, we can't wait to meet our founding class — the leaders, builders, and innovators who will define SEP's future on campus. Step forward, write your next chapter, and be part of something from the very beginning.
          </p>
          <Link
            href="/recruitment"
            className="inline-block px-10 py-5 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            WINTER 2026 APPLICATION
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
