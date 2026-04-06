/*
 * UCSB SEP About Page — Official Sigma Eta Pi Brand
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { useSiteContent } from "@/hooks/useSiteContent";

import brotherhoodImg from "@/images/brotherhood.png";
import innovationImg from "@/images/innovation.png";
import leadershipImg from "@/images/leadership.JPG";

const ABOUT_BG = leadershipImg;
const BROTHERHOOD_IMG = brotherhoodImg;
const INNOVATION_IMG = innovationImg;

const defaultAboutContent = {
  hero: { title: "All About Our Chapter", label: "About Us", bg_image: "" },
  story: {
    label: "Our Story",
    title: "Empowering the Next Generation of Entrepreneurs",
    p1: "Sigma Eta Pi at UCSB is a student-led business entrepreneurship co-ed fraternity that empowers members to take initiative, think big, and turn dreams to realities. Bringing together students from a wide range of majors, our UCSB chapter fosters a supportive community where collaboration, mentorship, and professional growth are central.",
    p2: "Founded in 2026, Sigma Eta Pi at UCSB provides opportunities to engage with startup ecosystems, connect with experienced entrepreneurs, and gain hands-on experience in business and innovation.",
    p3: "At UCSB, our events reflect the balance between professionalism and brotherhood. From date parties and retreats to senior send-offs, entrepreneurship panels, and professional workshops, Sigma Eta Pi offers a vibrant and enriching experience for its members, preparing them to succeed academically, professionally, and personally.",
    founded_year: "2010",
    founded_label: "Founded at UCLA",
    ventures_count: "21+",
    ventures_label: "Ventures Launched",
    brotherhood_image: "",
  },
  national: {
    label: "National Organization",
    title: "A Legacy of Entrepreneurial Excellence",
    p1: "Sigma Eta Pi is a co-ed professional business entrepreneurship fraternity dedicated to cultivating innovative, action-oriented leaders. Our members, representing a diverse range of academic disciplines, engage in a community that emphasizes collaboration, mentorship, and the practical application of entrepreneurial skills.",
    p2: "Founded in 2010 at UCLA as the first entrepreneurship fraternity on the West Coast, Sigma Eta Pi maintains strong connections to prominent startup ecosystems, including Silicon Valley and Silicon Beach.",
    p3: "Across its chapters, members have launched over 21 ventures, including projects backed by Y Combinator, ventures acquired for $90 million, and initiatives that hosted the nation's largest hackathon.",
    innovation_image: "",
  },
  values: {
    label: "Our Values",
    title: "What We Stand For",
    items: [
      {
        title: "Innovation",
        description: "Believe that embracing innovation is key to shaping the future and driving meaningful change. We challenge the status quo and build what doesn't yet exist.",
      },
      {
        title: "Brotherhood",
        description: "Support one another through challenges and triumphs, creating a welcoming and inclusive environment where everyone feels valued and empowered.",
      },
      {
        title: "Leadership",
        description: "Fosters personal growth while equipping members to make meaningful impact. We develop the next generation of entrepreneurs, founders, and industry leaders.",
      },
    ],
  },
  cta: {
    title: "Ready to Be Part of Something?",
    description: "Join our founder class and help shape the future of entrepreneurship at UCSB.",
    cta_primary: "APPLY NOW",
    cta_secondary: "MEET THE TEAM",
  },
};

export default function About() {
  const { content } = useSiteContent("about", defaultAboutContent);

  return (
    <div className="min-h-screen bg-[#EEEADE] text-[#0C141A]">
      <Navbar />

      {/* Page Hero */}
      <section
        className="relative h-72 md:h-96 flex items-end overflow-hidden pt-24"
        style={{
          backgroundImage: `url(${content.hero?.bg_image || ABOUT_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
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
            {content.hero.label}
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
            {content.hero.title}
          </h1>
        </div>
      </section>

      {/* Chapter Description */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <div
                className="text-xs font-bold tracking-widest uppercase mb-4"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  color: "#1B212C",
                }}
              >
                {content.story.label}
              </div>
              <h2
                className="text-[#1B212C] mb-6"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                {content.story.title}
              </h2>
              <div className="space-y-5 text-[#0C141A]/70 leading-relaxed" style={{ fontFamily: "'Glacial Indifference', serif" }}>
                <p>{content.story.p1}</p>
                <p>{content.story.p2}</p>
                <p>{content.story.p3}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div
                className="aspect-video overflow-hidden border-4 border-[#1B212C]"
                style={{
                  backgroundImage: `url(${content.story?.brotherhood_image || BROTHERHOOD_IMG})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1B212C] text-[#EEEADE] border-4 border-[#1B212C] p-6">
                  <div
                    className="font-bold mb-1"
                    style={{
                      fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: "2.5rem",
                    }}
                  >
                    {content.story.founded_year}
                  </div>
                  <div className="text-xs tracking-widest uppercase" style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                    {content.story.founded_label}
                  </div>
                </div>
                <div className="bg-[#1B212C] text-[#EEEADE] border-4 border-[#1B212C] p-6">
                  <div
                    className="font-bold mb-1"
                    style={{
                      fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      fontSize: "2.5rem",
                    }}
                  >
                    {content.story.ventures_count}
                  </div>
                  <div className="text-xs tracking-widest uppercase" style={{ fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                    {content.story.ventures_label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* National Organization */}
      <section className="py-20 bg-[#EEEADE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div
              className="aspect-video overflow-hidden border-4 border-[#1B212C] order-2 lg:order-1"
              style={{
                backgroundImage: `url(${content.national?.innovation_image || INNOVATION_IMG})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="order-1 lg:order-2">
              <div
                className="text-xs font-bold tracking-widest uppercase mb-4"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  color: "#1B212C",
                }}
              >
                {content.national.label}
              </div>
              <h2
                className="text-[#1B212C] mb-6"
                style={{
                  fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                  textTransform: "uppercase",
                  lineHeight: 1.1,
                }}
              >
                {content.national.title}
              </h2>
              <div className="space-y-4 text-[#0C141A]/70 leading-relaxed" style={{ fontFamily: "'Glacial Indifference', serif" }}>
                <p>{content.national.p1}</p>
                <p>{content.national.p2}</p>
                <p>{content.national.p3}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
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
              {content.values.label}
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
              {content.values.title}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.values.items.map((value, i) => (
              <div
                key={i}
                className="bg-[#EEEADE] border-4 border-[#1B212C] p-8 hover:bg-[#D0E4EF] transition-all duration-300 group"
              >
                <h3
                  className="text-[#1B212C] mb-3 group-hover:text-[#0C141A] transition-colors"
                  style={{
                    fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontWeight: 900,
                    fontSize: "1.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {value.title}
                </h3>
                <p className="text-[#0C141A]/70 text-sm leading-relaxed" style={{ fontFamily: "'Glacial Indifference', serif" }}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
            {content.cta.title}
          </h2>
          <p className="text-[#0C141A]/70 mb-8" style={{ fontFamily: "'Glacial Indifference', serif" }}>
            {content.cta.description}
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
              {content.cta.cta_primary}
            </Link>
            <Link
              href="/meet-us"
              className="px-8 py-4 border-2 border-[#1B212C] text-[#1B212C] font-bold rounded-lg transition-all duration-300 hover:bg-[#1B212C] hover:text-[#EEEADE] text-sm"
              style={{
                fontFamily: "'Helvetica Now', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              {content.cta.cta_secondary}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
