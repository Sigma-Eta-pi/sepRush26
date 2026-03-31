/*
 * UCSB SEP Recruitment Page — Official Sigma Eta Pi Brand
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-hero-bg-QdjE5NSyrfDKbv92hvh9eH.webp";

const RECRUITMENT_EVENTS = [
  {
    date: "January 15, 2026",
    title: "Info Session #1",
    time: "6:00 PM - 7:30 PM",
    location: "Isla Vista Community Center",
    description: "Learn about Sigma Eta Pi and what it means to be part of our founding class.",
  },
  {
    date: "January 22, 2026",
    title: "Info Session #2",
    time: "6:00 PM - 7:30 PM",
    location: "Isla Vista Community Center",
    description: "Second chance to learn about our fraternity and meet the executive board.",
  },
  {
    date: "January 29, 2026",
    title: "Networking Event",
    time: "7:00 PM - 9:00 PM",
    location: "The Arbor",
    description: "Casual networking with current members and alumni. Food and drinks provided.",
  },
  {
    date: "February 5, 2026",
    title: "Speed Networking",
    time: "6:00 PM - 8:00 PM",
    location: "Isla Vista Community Center",
    description: "Meet members one-on-one and learn about different roles and opportunities.",
  },
  {
    date: "February 12, 2026",
    title: "Final Event",
    time: "6:00 PM - 9:00 PM",
    location: "The Arbor",
    description: "Join us for our final recruitment event before applications close.",
  },
];

const FAQ = [
  {
    q: "What is Sigma Eta Pi?",
    a: "Sigma Eta Pi is a co-ed professional business entrepreneurship fraternity dedicated to cultivating innovative, action-oriented leaders. We focus on collaboration, mentorship, and practical entrepreneurial skills.",
  },
  {
    q: "Do I need to be a business major to join?",
    a: "No! Sigma Eta Pi welcomes students from all majors. We believe diversity of thought and background strengthens our community. Whether you're an engineer, designer, marketer, or anything else, you belong here.",
  },
  {
    q: "What is the time commitment?",
    a: "We understand you're busy. Most members commit 5-10 hours per week to chapter activities, events, and professional development. You'll have flexibility to balance your academic and personal responsibilities.",
  },
  {
    q: "Is there a membership fee?",
    a: "Yes, there are membership dues to support chapter operations, events, and resources. We work to keep costs reasonable and offer payment plans if needed. Contact us for specific details.",
  },
  {
    q: "When is the application deadline?",
    a: "Applications for Winter 2026 recruitment close on February 28, 2026. We'll notify applicants of interview dates shortly after.",
  },
  {
    q: "What happens after I apply?",
    a: "After submitting your application, you'll be invited to an interview with members of the executive board. We'll learn about your goals, interests, and why you want to join SEP.",
  },
  {
    q: "Can I rush if I'm a junior or senior?",
    a: "Absolutely! While we welcome freshmen and sophomores, we encourage upperclassmen to apply as well. Your experience and perspective are valuable to our community.",
  },
  {
    q: "How do I stay updated on recruitment?",
    a: "Follow us on Instagram @ucsbsep and check back here for the latest updates. You can also reach out to our VP of Recruitment, Kate Heidenga, with any questions.",
  },
];

function TimelineItem({ event, index, isLast }: {
  event: typeof RECRUITMENT_EVENTS[number]; index: number; isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`relative flex items-start ${isLast ? "" : "pb-12"} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transition: "opacity 0.6s ease, transform 0.6s ease",
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Timeline dot */}
      <div
        className={`absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-[3px] border-[#05006C] z-10 mt-1 transition-colors duration-500 ${
          visible ? "bg-[#05006C]" : "bg-[#EEEADE]"
        }`}
      />

      {/* Content card — alternates sides on md+ */}
      <div
        className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${
          isLeft ? "md:mr-auto md:pr-0" : "md:ml-auto md:pl-0"
        }`}
      >
        <div className="bg-[#FFFFFF] border-2 border-[#05006C] p-6 transition-all duration-300 hover:shadow-lg">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              color: "#05006C",
            }}
          >
            {event.date}
          </div>
          <h3
            className="text-[#05006C] mb-2"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "1.2rem",
              textTransform: "uppercase",
            }}
          >
            {event.title}
          </h3>
          <p className="text-[#0C141A]/70 text-sm mb-3" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            {event.description}
          </p>
          <div className="flex flex-col gap-1 text-xs text-[#0C141A]/60" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            <span>{event.time}</span>
            <span>{event.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-2 border-[#1B212C]">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between bg-[#EEEADE] hover:bg-[#D0E4EF] transition-colors duration-200 group"
      >
        <span
          className="text-left text-[#1B212C] font-bold group-hover:text-[#0C141A] transition-colors"
          style={{
            fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "0.95rem",
          }}
        >
          {q}
        </span>
        <ChevronDown
          size={20}
          className={`text-[#1B212C] flex-shrink-0 ml-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-[#FFFFFF] border-t-2 border-[#1B212C]">
          <p className="text-[#0C141A]/70 text-sm leading-relaxed" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Recruitment() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#EEEADE] text-[#0C141A]">
      <Navbar />

      {/* Page Hero */}
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
            Winter 2026 Recruitment
          </div>

          <h1
            className="text-[#1B212C] leading-none mb-4"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(3rem, 10vw, 7rem)",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Join Our Founding Class
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
            Be part of something from the very beginning. Help us build Sigma Eta Pi's legacy at UCSB.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://forms.gle/your-application-form"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              APPLY NOW
            </a>
            <a
              href="#events"
              className="px-8 py-4 border-2 border-[#1B212C] text-[#1B212C] font-bold rounded-lg transition-all duration-300 hover:bg-[#1B212C] hover:text-[#EEEADE] text-sm"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              VIEW EVENTS
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-[#1B212C]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B212C]" />
        </div>
      </section>

      {/* Events Timeline Section */}
      <section id="events" className="py-20 bg-[#EEEADE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#1B212C",
              }}
            >
              Recruitment Schedule
            </div>
            <h2
              className="text-[#1B212C]"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                textTransform: "uppercase",
              }}
            >
              Winter 2026 Events
            </h2>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Vertical timeline line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-[#05006C]/20 -translate-x-1/2" />

            {RECRUITMENT_EVENTS.map((event, i) => (
              <TimelineItem key={i} event={event} index={i} isLast={i === RECRUITMENT_EVENTS.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#1B212C",
              }}
            >
              Questions?
            </div>
            <h2
              className="text-[#1B212C]"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                textTransform: "uppercase",
              }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
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
            Ready to Join?
          </h2>
          <p className="text-[#0C141A]/70 mb-8" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            Applications for Winter 2026 are now open. Submit your application and attend our recruitment events to learn more about Sigma Eta Pi.
          </p>
          <a
            href="https://forms.gle/your-application-form"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-5 bg-[#1B212C] text-[#EEEADE] font-bold rounded-lg transition-all duration-300 hover:bg-[#0C141A] text-sm"
            style={{
              fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            APPLY NOW
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
