/*
 * UCSB SEP Home Page — "Silicon Ambition" Design
 * Sections: Hero, Stats, Core Values Carousel, Places We're At (Companies), Footer
 * Mirrors AKPSI UCLA structure with SEP content
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-hero-bg-QdjE5NSyrfDKbv92hvh9eH.webp";
const CAREERS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-careers-bg-5nPxJu5fYFb4Bo8BcBe3he.webp";
const BROTHERHOOD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-values-brotherhood-FBLsWtvH52zdAHRAWhKhwz.webp";
const INNOVATION_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-values-innovation-Y8mrMA9TsjTcWgPnvxRjyd.webp";
const ABOUT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-about-bg-Sx7XK3mHc53GjCcs5HyE2K.webp";

const VALUES = [
  {
    id: 0,
    label: "Innovation",
    title: "Innovation",
    description:
      "Believe that embracing innovation is key to shaping the future and driving meaningful change. We challenge the status quo and build what doesn't yet exist.",
    image: INNOVATION_IMG,
  },
  {
    id: 1,
    label: "Brotherhood",
    title: "Brotherhood",
    description:
      "Support one another through challenges and triumphs, creating a welcoming and inclusive environment where everyone feels valued. Our bond extends beyond campus.",
    image: BROTHERHOOD_IMG,
  },
  {
    id: 2,
    label: "Leadership",
    title: "Leadership",
    description:
      "Fosters personal growth while equipping members to make meaningful impact. We develop the next generation of entrepreneurs, founders, and industry leaders.",
    image: ABOUT_BG,
  },
];

const COMPANIES = [
  "Google", "Amazon", "Apple", "Microsoft", "Meta", "Tesla", "Salesforce",
  "Oracle", "IBM", "Intel", "Deloitte", "PwC", "EY", "KPMG", "Accenture",
  "J.P. Morgan", "Goldman Sachs", "Morgan Stanley", "BlackRock", "Citi",
  "Y Combinator", "Sequoia", "Andreessen Horowitz", "Stripe", "Airbnb",
  "Uber", "Lyft", "Snap", "LinkedIn", "Adobe", "Nvidia", "PayPal", "Visa",
  "SpaceX", "Palantir", "Databricks", "OpenAI", "Figma", "Notion", "Zoom",
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
    <div className="text-center px-8 py-10 border-r border-white/10 last:border-r-0 flex-1">
      <div className="stat-number">
        {count}{suffix}
      </div>
      <div
        className="text-white font-bold mt-2 mb-3 text-lg"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}
      >
        {label}
      </div>
      <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const [activeValue, setActiveValue] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for stats count-up
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveValue((prev) => (prev + 1) % VALUES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Navbar />

      {/* ─── HERO SECTION ─── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Green tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Chapter badge */}
          <div
            className="inline-block mb-6 px-4 py-1.5 border border-green-400/50 text-green-400 text-xs tracking-widest uppercase"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Epsilon Chapter · UCSB
          </div>

          <h1
            className="text-white leading-none mb-4"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3.5rem, 10vw, 8rem)",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            SIGMA ETA PI
          </h1>

          <p
            className="text-white/80 mb-10 max-w-2xl mx-auto"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              fontWeight: 300,
              letterSpacing: "0.05em",
            }}
          >
            The Premier Entrepreneurship Fraternity at UCSB
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/recruitment" className="sep-btn-green text-sm px-8 py-4">
              Join Our Founding Class
            </Link>
            <Link href="/about" className="sep-btn-primary text-sm px-8 py-4">
              Learn More
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-white/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </div>
      </section>

      {/* ─── STATS SECTION ─── */}
      <section ref={statsRef} className="bg-[#111111] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
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
      <section className="py-24 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="sep-label mb-3">Our Core Values</div>
            <h2
              className="text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
              }}
            >
              Here at Sigma Eta Pi, we are committed
              <br className="hidden md:block" /> to our fundamental values.
            </h2>
          </div>

          {/* Carousel */}
          <div className="relative overflow-hidden rounded-none">
            {/* Main image + content */}
            <div
              className="relative h-[500px] md:h-[600px] overflow-hidden"
              style={{
                backgroundImage: `url(${VALUES[activeValue].image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "background-image 0.5s ease",
              }}
            >
              <div className="absolute inset-0 bg-black/60" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

              <div className="relative z-10 h-full flex items-end p-8 md:p-16">
                <div className="max-w-xl">
                  <div className="sep-label mb-3">{VALUES[activeValue].label}</div>
                  <h3
                    className="text-white mb-4"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800,
                      fontSize: "clamp(2rem, 5vw, 3.5rem)",
                      textTransform: "uppercase",
                    }}
                  >
                    {VALUES[activeValue].title}
                  </h3>
                  <p
                    className="text-white/80 text-base leading-relaxed mb-8"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {VALUES[activeValue].description}
                  </p>
                  <Link href="/about" className="sep-btn-primary text-sm px-6 py-3">
                    Learn More
                  </Link>
                </div>
              </div>
            </div>

            {/* Carousel controls */}
            <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3">
              {VALUES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveValue(i)}
                  className={`w-2 h-2 transition-all duration-300 ${
                    i === activeValue ? "bg-green-400 w-6" : "bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to value ${i + 1}`}
                />
              ))}
              <button
                onClick={() => setActiveValue((prev) => (prev - 1 + VALUES.length) % VALUES.length)}
                className="ml-2 w-10 h-10 border border-white/30 flex items-center justify-center text-white hover:border-green-400 hover:text-green-400 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setActiveValue((prev) => (prev + 1) % VALUES.length)}
                className="w-10 h-10 border border-white/30 flex items-center justify-center text-white hover:border-green-400 hover:text-green-400 transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Value tabs */}
          <div className="flex border-t border-white/10">
            {VALUES.map((value, i) => (
              <button
                key={i}
                onClick={() => setActiveValue(i)}
                className={`flex-1 py-5 text-sm font-semibold tracking-widest uppercase transition-all duration-300 border-t-2 ${
                  i === activeValue
                    ? "border-green-400 text-green-400 bg-green-400/5"
                    : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem" }}
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
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="sep-label mb-3">Places We're At</div>
            <h2
              className="text-white mb-4"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                textTransform: "uppercase",
              }}
            >
              Anywhere you want to go,
              <br /> we're probably there!
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              Sigma Eta Pi stays actively connected with its alumni, creating lasting professional support across different industries and companies.
            </p>
          </div>

          {/* Company logo ticker */}
          <div className="overflow-hidden mb-12" ref={tickerRef}>
            <div className="flex gap-8 logo-ticker" style={{ width: "max-content" }}>
              {[...COMPANIES, ...COMPANIES].map((company, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-6 py-3 border border-white/20 bg-white/5 hover:border-green-400/50 hover:bg-green-400/5 transition-all duration-300"
                >
                  <span
                    className="text-white/70 text-sm font-medium whitespace-nowrap"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {company}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Company grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-12">
            {COMPANIES.slice(0, 32).map((company, i) => (
              <div
                key={i}
                className="aspect-square flex items-center justify-center border border-white/15 bg-white/5 hover:border-green-400/40 hover:bg-green-400/5 transition-all duration-300 p-2"
              >
                <span
                  className="text-white/60 text-xs font-medium text-center leading-tight"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.6rem" }}
                >
                  {company}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/careers" className="sep-btn-green text-sm px-8 py-4">
              Our Careers
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ABOUT TEASER SECTION ─── */}
      <section className="py-24 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="sep-label mb-4">About Sigma Eta Pi</div>
              <h2
                className="text-white mb-6"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                UCSB's Premier Co-Ed Entrepreneurship Fraternity
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                Sigma Eta Pi is a co-ed professional business entrepreneurship fraternity dedicated to cultivating innovative, action-oriented leaders. Our members, representing a diverse range of academic disciplines, engage in a community that emphasizes collaboration, mentorship, and the practical application of entrepreneurial skills.
              </p>
              <p className="text-white/70 text-base leading-relaxed mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
                Founded in 2010 at UCLA as the first entrepreneurship fraternity on the West Coast, Sigma Eta Pi maintains strong connections to prominent startup ecosystems, including Silicon Valley and Silicon Beach.
              </p>
              <Link href="/about" className="sep-btn-primary text-sm px-8 py-4">
                Learn More About Us
              </Link>
            </div>
            <div className="relative">
              <div
                className="aspect-[4/3] overflow-hidden"
                style={{
                  backgroundImage: `url(${ABOUT_BG})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              {/* Accent border */}
              <div
                className="absolute -bottom-4 -right-4 w-full h-full border-2 border-green-400/30 -z-10"
              />
              {/* Stats overlay */}
              <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm border border-white/20 px-6 py-4">
                <div
                  className="text-green-400 font-bold"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem" }}
                >
                  2026
                </div>
                <div className="text-white/60 text-xs tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Founded at UCSB
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RECRUITMENT CTA ─── */}
      <section className="py-24 bg-[#0D0D0D] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="sep-label mb-4">Recruitment</div>
          <h2
            className="text-white mb-6"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Join Our Founding Class
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            As we relaunch at UCSB, we can't wait to meet our founding class — the leaders, builders, and innovators who will define SEP's future on campus. Step forward, write your next chapter, and be part of something from the very beginning.
          </p>
          <Link href="/recruitment" className="sep-btn-green text-sm px-10 py-5">
            Winter 2026 Application
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
