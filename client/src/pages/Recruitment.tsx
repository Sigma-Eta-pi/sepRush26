/*
 * UCSB SEP Recruitment Page — "Silicon Ambition" Design
 * Winter 2026 recruitment info, schedule, application CTA
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-hero-bg-QdjE5NSyrfDKbv92hvh9eH.webp";

const RUSH_EVENTS = [
  {
    date: "1/20",
    day: "Monday",
    name: "Info Night",
    time: "7–9 PM",
    location: "ILP 1101",
    attire: "Casual Attire",
    description: "Come learn about Sigma Eta Pi, meet the exec board, and find out what makes our fraternity unique.",
  },
  {
    date: "1/21",
    day: "Tuesday",
    name: "Alumni Night",
    time: "7–9 PM",
    location: "ILP 1101",
    attire: "Casual Attire",
    description: "Connect with SEP alumni from top companies and hear about their experiences and career journeys.",
  },
  {
    date: "1/22",
    day: "Wednesday",
    name: "Shark Tank",
    time: "7–9 PM",
    location: "ILP 1101",
    attire: "Business Casual",
    description: "Pitch your startup idea to a panel of judges and showcase your entrepreneurial thinking.",
  },
  {
    date: "1/24",
    day: "Friday",
    name: "Interviews",
    time: "Time TBD",
    location: "Location TBD",
    attire: "Business Formal",
    description: "Final round interviews with the executive board. Selected candidates will be notified beforehand.",
  },
];

const FAQS = [
  {
    question: "Who can apply to Sigma Eta Pi?",
    answer: "Sigma Eta Pi is a co-ed fraternity open to all UCSB students regardless of major, year, or background. We welcome anyone who is passionate about entrepreneurship, innovation, and building a meaningful community.",
  },
  {
    question: "Do I need a business background to join?",
    answer: "Absolutely not! Our members come from a wide range of academic disciplines — engineering, arts, sciences, and more. What matters most is your passion for entrepreneurship and your drive to make an impact.",
  },
  {
    question: "What is the time commitment?",
    answer: "SEP members typically commit to weekly chapter meetings, professional development events, and social activities. We understand that academics come first and work to accommodate busy schedules.",
  },
  {
    question: "What happens during recruitment?",
    answer: "Recruitment consists of several events including an info night, alumni networking night, a Shark Tank pitch competition, and final interviews. We want to get to know you as a person, not just your resume.",
  },
  {
    question: "Is there a GPA requirement?",
    answer: "We do not have a strict GPA requirement. We look for well-rounded individuals who demonstrate leadership potential, entrepreneurial spirit, and a commitment to the SEP community.",
  },
  {
    question: "What does membership cost?",
    answer: "There are dues associated with membership that cover chapter operations, events, and national affiliation. Exact amounts will be discussed during recruitment. We also offer payment plans.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        className="w-full flex items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span
          className="text-white font-medium text-sm pr-4"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {question}
        </span>
        {open ? (
          <ChevronUp size={18} className="text-green-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-white/40 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div
          className="pb-5 text-white/60 text-sm leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Recruitment() {
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
          <div className="sep-label mb-2">Recruitment</div>
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
            Winter Recruitment 2026
          </h1>
        </div>
      </section>

      {/* Recruitment Intro */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="sep-label mb-4">Winter 2026</div>
              <h2
                className="text-white mb-6"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                Join Our Founding Class
              </h2>
              <div className="space-y-4 text-white/70 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p>
                  We're excited to welcome Sigma Eta Pi back to UCSB for Winter 2026 recruitment. As a co-ed fraternity rooted in ambition, growth, and innovation, SEP invites ambitious students to take ownership of their stories and help shape what comes next.
                </p>
                <p>
                  This moment marks a new chapter, not just for SEP, but for the students who will help rebuild it. Our community empowers members to navigate college life, build meaningful connections, and grow both personally and professionally.
                </p>
                <p>
                  As we relaunch at UCSB, we can't wait to meet our founding class — the leaders, builders, and innovators who will define SEP's future on campus. Step forward, write your next chapter, and be part of something from the very beginning.
                </p>
              </div>
              <div className="mt-8">
                <a
                  href="https://www.ucsbsep.org/winterrecruitment2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sep-btn-green text-sm px-8 py-4 inline-block"
                >
                  Winter 2026 Application
                </a>
              </div>
            </div>

            {/* Quick info card */}
            <div className="bg-[#1A1A1A] border border-white/10 p-8">
              <h3
                className="text-white mb-6 text-sm tracking-widest uppercase"
                style={{ fontFamily: "'Inter', sans-serif", color: "oklch(0.723 0.219 142.495)" }}
              >
                Recruitment at a Glance
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <Calendar size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Dates
                    </div>
                    <div className="text-white/60 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      January 20–24, 2026
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Time
                    </div>
                    <div className="text-white/60 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      7–9 PM (most events)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Location
                    </div>
                    <div className="text-white/60 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                      ILP 1101, UCSB Campus
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/50 text-xs mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                  To learn more about Winter Recruitment, complete the interest form and look out for upcoming updates.
                </p>
                <a
                  href="https://www.instagram.com/ucsbsep/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 text-xs font-medium tracking-widest uppercase hover:text-green-300 transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Follow @ucsbsep on Instagram →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rush Schedule */}
      <section className="py-20 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="sep-label mb-3">Schedule</div>
            <h2
              className="text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                textTransform: "uppercase",
              }}
            >
              Recruitment Week Schedule
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RUSH_EVENTS.map((event, i) => (
              <div
                key={i}
                className="bg-[#1A1A1A] border border-white/10 hover:border-green-400/40 transition-all duration-300 group overflow-hidden"
              >
                <div className="flex">
                  {/* Date sidebar */}
                  <div className="w-20 flex-shrink-0 bg-green-400/10 border-r border-white/10 flex flex-col items-center justify-center p-4">
                    <div
                      className="text-green-400 font-bold leading-none"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.8rem" }}
                    >
                      {event.date}
                    </div>
                    <div
                      className="text-white/40 text-xs mt-1 text-center"
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.6rem" }}
                    >
                      {event.day}
                    </div>
                  </div>

                  {/* Event info */}
                  <div className="p-6 flex-1">
                    <h3
                      className="text-white mb-2 group-hover:text-green-400 transition-colors"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: "1.3rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {event.name}
                    </h3>
                    <p className="text-white/60 text-sm mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span
                        className="flex items-center gap-1.5 text-white/50 text-xs"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <Clock size={12} className="text-green-400" />
                        {event.time}
                      </span>
                      <span
                        className="flex items-center gap-1.5 text-white/50 text-xs"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <MapPin size={12} className="text-green-400" />
                        {event.location}
                      </span>
                      <span
                        className="px-2 py-0.5 border border-green-400/30 text-green-400 text-xs"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.65rem" }}
                      >
                        {event.attire}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="sep-label mb-3">FAQ</div>
            <h2
              className="text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                textTransform: "uppercase",
              }}
            >
              Frequently Asked Questions
            </h2>
          </div>
          <div className="divide-y divide-white/10 border-t border-white/10">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#0D0D0D] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="sep-label mb-4">Apply Now</div>
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
            Write Your Next Chapter
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Be part of something from the very beginning. Join the founding class of Sigma Eta Pi at UCSB and help shape the future of entrepreneurship on campus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.ucsbsep.org/winterrecruitment2026"
              target="_blank"
              rel="noopener noreferrer"
              className="sep-btn-green text-sm px-10 py-5 inline-block"
            >
              Winter 2026 Application
            </a>
            <a
              href="mailto:exec@ucsbsep.org"
              className="sep-btn-primary text-sm px-10 py-5 inline-block"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
