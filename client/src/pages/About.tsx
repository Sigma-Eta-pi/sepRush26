/*
 * UCSB SEP About Page — "Silicon Ambition" Design
 * Organization history, mission, values
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const ABOUT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-about-bg-Sx7XK3mHc53GjCcs5HyE2K.webp";
const BROTHERHOOD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-values-brotherhood-FBLsWtvH52zdAHRAWhKhwz.webp";
const INNOVATION_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663496422464/dGt4dCdYBbjRUK2GvANG9U/sep-values-innovation-Y8mrMA9TsjTcWgPnvxRjyd.webp";

const VALUES = [
  {
    icon: "💡",
    title: "Innovation",
    description: "Believe that embracing innovation is key to shaping the future and driving meaningful change. We challenge the status quo and build what doesn't yet exist.",
    color: "oklch(0.723 0.219 142.495)",
  },
  {
    icon: "🤝",
    title: "Brotherhood",
    description: "Support one another through challenges and triumphs, creating a welcoming and inclusive environment where everyone feels valued and empowered.",
    color: "oklch(0.769 0.188 70.08)",
  },
  {
    icon: "🚀",
    title: "Leadership",
    description: "Fosters personal growth while equipping members to make meaningful impact. We develop the next generation of entrepreneurs, founders, and industry leaders.",
    color: "oklch(0.723 0.219 142.495)",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Navbar />

      {/* Page Hero */}
      <section
        className="relative h-72 md:h-96 flex items-end overflow-hidden"
        style={{
          backgroundImage: `url(${ABOUT_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <div className="sep-label mb-2">About Us</div>
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
            All About Our Chapter
          </h1>
        </div>
      </section>

      {/* Chapter Description */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="sep-label mb-4">Our Story</div>
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
                Empowering the Next Generation of Entrepreneurs
              </h2>
              <div className="space-y-5 text-white/70 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p>
                  Sigma Eta Pi at UCSB is a student-led business entrepreneurship co-ed fraternity that empowers members to take initiative, think big, and turn dreams to realities. Bringing together students from a wide range of majors, our UCSB chapter fosters a supportive community where collaboration, mentorship, and professional growth are central.
                </p>
                <p>
                  Founded in 2026, Sigma Eta Pi at UCSB provides opportunities to engage with startup ecosystems, connect with experienced entrepreneurs, and gain hands-on experience in business and innovation.
                </p>
                <p>
                  At UCSB, our events reflect the balance between professionalism and brotherhood. From date parties and retreats to senior send-offs, entrepreneurship panels, and professional workshops, Sigma Eta Pi offers a vibrant and enriching experience for its members, preparing them to succeed academically, professionally, and personally.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div
                className="aspect-video overflow-hidden"
                style={{
                  backgroundImage: `url(${BROTHERHOOD_IMG})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A1A1A] border border-white/10 p-6">
                  <div
                    className="text-green-400 font-bold mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.5rem" }}
                  >
                    2010
                  </div>
                  <div className="text-white/60 text-xs tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Founded at UCLA
                  </div>
                </div>
                <div className="bg-[#1A1A1A] border border-white/10 p-6">
                  <div
                    className="text-green-400 font-bold mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.5rem" }}
                  >
                    21+
                  </div>
                  <div className="text-white/60 text-xs tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Ventures Launched
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* National Organization */}
      <section className="py-20 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div
              className="aspect-video overflow-hidden order-2 lg:order-1"
              style={{
                backgroundImage: `url(${INNOVATION_IMG})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="order-1 lg:order-2">
              <div className="sep-label mb-4">National Organization</div>
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
                A Legacy of Entrepreneurial Excellence
              </h2>
              <div className="space-y-4 text-white/70 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                <p>
                  Sigma Eta Pi is a co-ed professional business entrepreneurship fraternity dedicated to cultivating innovative, action-oriented leaders. Our members, representing a diverse range of academic disciplines, engage in a community that emphasizes collaboration, mentorship, and the practical application of entrepreneurial skills.
                </p>
                <p>
                  Founded in 2010 at UCLA as the first entrepreneurship fraternity on the West Coast, Sigma Eta Pi maintains strong connections to prominent startup ecosystems, including Silicon Valley and Silicon Beach.
                </p>
                <p>
                  Across its chapters, members have launched over 21 ventures, including projects backed by Y Combinator, ventures acquired for $90 million, and initiatives that hosted the nation's largest hackathon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="sep-label mb-3">Our Values</div>
            <h2
              className="text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                textTransform: "uppercase",
              }}
            >
              What We Stand For
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((value, i) => (
              <div
                key={i}
                className="bg-[#1A1A1A] border border-white/10 p-8 hover:border-green-400/40 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3
                  className="text-white mb-3 group-hover:text-green-400 transition-colors"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {value.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {value.description}
                </p>
                <div
                  className="mt-6 h-0.5 w-0 group-hover:w-full transition-all duration-500"
                  style={{ background: "oklch(0.723 0.219 142.495)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0D0D0D] border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2
            className="text-white mb-6"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              textTransform: "uppercase",
            }}
          >
            Ready to Be Part of Something?
          </h2>
          <p className="text-white/60 mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            Join our founding class and help shape the future of entrepreneurship at UCSB.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/recruitment" className="sep-btn-green text-sm px-8 py-4">
              Apply Now
            </Link>
            <Link href="/meet-us" className="sep-btn-primary text-sm px-8 py-4">
              Meet the Team
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
