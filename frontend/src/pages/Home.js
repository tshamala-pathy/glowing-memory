import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Globe,
  Layout,
  LineChart,
  Play,
  Smartphone,
  Star,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Newsletter from "../components/Newsletter";
import Testimonials from "../components/Testimonials";
import AboutSection from "../components/AboutSection";
import StatsSection from "../components/StatsSection";
import SiteFooter from "../components/SiteFooter";

const CONTAINER = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

const IMAGES = {
  heroMain: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
  heroAccent: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=85",
  heroDetail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=85",
  showcase: "https://images.unsplash.com/photo-1524758631624-f6584a0d3600?auto=format&fit=crop&w=1920&q=85",
  spotlight: [
    { src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85", label: "Web Apps" },
    { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85", label: "Dashboards" },
    { src: "https://images.unsplash.com/photo-1618005182382-a83a8bd57fbe?auto=format&fit=crop&w=900&q=85", label: "Design Systems" },
  ],
  newsletter: "https://images.unsplash.com/photo-1573497019148-b8d87734a5a2?auto=format&fit=crop&w=800&q=85",
  cta: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1920&q=85",
};

const MARQUEE_ITEMS = [
  "React", "Django", "PostgreSQL", "AWS", "Tailwind CSS", "REST APIs",
  "Docker", "TypeScript", "UI/UX", "Cloud Hosting",
];

const BENTO_ITEMS = [
  { title: "Projects", desc: "Portfolio of shipped products", to: "/projects", span: "lg:col-span-2", accent: "from-teal-500 to-teal-700" },
  { title: "Services", desc: "Web, API & business systems", to: "/services", span: "", accent: "from-slate-600 to-slate-800" },
  { title: "Pricing", desc: "Clear packages & plans", to: "/pricing", span: "", accent: "from-amber-500 to-amber-700" },
  { title: "Request Quote", desc: "Free tailored estimate", to: "/request-quote", span: "", accent: "from-orange-500 to-orange-700", protected: true },
  { title: "About", desc: "Our story & team", to: "/about", span: "", accent: "from-slate-500 to-slate-700" },
  { title: "Blog", desc: "Insights & tutorials", to: "/blog", span: "lg:col-span-2", accent: "from-emerald-500 to-emerald-700", auth: true },
  { title: "Contact", desc: "Start a conversation", to: "/contact", span: "", accent: "from-sky-500 to-sky-700" },
  { title: "Case Studies", desc: "Real results", to: "/case-studies", span: "", accent: "from-violet-500 to-violet-700", auth: true },
];

const PROCESS = [
  { num: "1", title: "Discover", text: "Goals, users, and success metrics defined together." },
  { num: "2", title: "Design", text: "Wireframes and prototypes you can react to early." },
  { num: "3", title: "Develop", text: "Iterative builds with visible progress each sprint." },
  { num: "4", title: "Deliver", text: "Launch, handover docs, and optional ongoing support." },
];

const HIGHLIGHTS = [
  { icon: Layout, title: "Product-grade UI", text: "Interfaces clients love to use — polished, accessible, responsive." },
  { icon: Globe, title: "Full-stack delivery", text: "Frontend, backend, APIs, and deployment handled end-to-end." },
  { icon: LineChart, title: "Business outcomes", text: "Built to convert, retain, and scale — not just look good." },
  { icon: Smartphone, title: "Mobile-first", text: "Every experience optimized for phones, tablets, and desktop." },
];

const FAQ_ITEMS = [
  { q: "How long does a typical project take?", a: "A landing page may take 2–4 weeks; a full application often runs 8–16 weeks. We share a clear timeline after discovery." },
  { q: "Do you work with small businesses?", a: "Yes — from MVPs and marketing sites to larger platforms. We tailor scope to your budget and stage." },
  { q: "What happens after launch?", a: "Documentation, training, and optional support plans for maintenance and new features." },
  { q: "How do I get a quote?", a: "Create a free account, then use Request a Quote from your profile or the quote form. We respond within one business day." },
];

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handleNav = (e, item) => {
    if ((item.protected || item.auth) && !isAuthenticated) {
      e.preventDefault();
      navigate("/login");
    }
  };

  return (
    <div className="bg-[#faf9f7] text-slate-800 w-full overflow-x-hidden min-w-0">

      {/* —— Hero: split editorial layout —— */}
      <section className="relative pt-10 sm:pt-14 lg:pt-20 pb-16 sm:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-bl from-amber-50 via-[#faf9f7] to-teal-50/40 pointer-events-none hidden lg:block" />
        <div className={`${CONTAINER} relative`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Trusted digital partner
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-6">
                Software &amp; web
                <span className="block text-teal-700">built for clients</span>
                who move fast
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                PathyCode turns ideas into production-ready websites and applications — with transparent delivery and a team that stays with you after launch.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={user?.is_superuser ? "/admin" : "/profile"}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 shadow-lg transition"
                    >
                      {user?.is_superuser ? "Admin Dashboard" : "My Profile"}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/projects"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-semibold hover:border-teal-300 hover:text-teal-800 transition"
                    >
                      View Projects
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 transition"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/services"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-semibold hover:border-teal-300 transition"
                    >
                      <Play className="w-4 h-4 text-teal-600" />
                      Explore Services
                    </Link>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-slate-500">
                <span><strong className="text-slate-900 font-bold">100+</strong> projects</span>
                <span><strong className="text-slate-900 font-bold">98%</strong> satisfaction</span>
                <span><strong className="text-slate-900 font-bold">&lt;24h</strong> response</span>
              </div>

              {/* Mobile hero image */}
              <div className="sm:hidden mt-8 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200/80">
                <img
                  src={IMAGES.heroMain}
                  alt="Modern digital workspace"
                  className="w-full aspect-[4/3] object-cover"
                />
              </div>
            </div>

            {/* Image collage */}
            <div className="relative hidden sm:grid grid-cols-12 gap-3 lg:gap-4 fade-in" style={{ animationDelay: "0.15s" }}>
              <div className="col-span-7 row-span-2 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200/80">
                <img src={IMAGES.heroMain} alt="Modern workspace" className="w-full h-full min-h-[280px] lg:min-h-[380px] object-cover" />
              </div>
              <div className="col-span-5 rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/80">
                <img src={IMAGES.heroAccent} alt="Team collaboration" className="w-full h-36 lg:h-44 object-cover" />
              </div>
              <div className="col-span-5 relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/80 bg-teal-800 p-5 flex flex-col justify-end min-h-[140px]">
                <img src={IMAGES.heroDetail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" aria-hidden />
                <p className="relative text-white font-bold text-lg leading-snug">From concept to launch — one dedicated team.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* —— Tech marquee —— */}
      <section className="py-4 border-y border-slate-200/80 bg-white overflow-hidden">
        <div className="flex animate-[marquee_28s_linear_infinite] whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="mx-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* —— Bento navigation —— */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className={CONTAINER}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2">Explore PathyCode</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Everything in one place</h2>
            </div>
            <Link to="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800">
              Talk to us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {BENTO_ITEMS.map((item) => {
              const locked = (item.protected || item.auth) && !isAuthenticated;
              const Wrap = locked ? "button" : Link;
              const props = locked
                ? { type: "button", onClick: (e) => handleNav(e, item) }
                : { to: item.to };
              return (
                <Wrap
                  key={item.title}
                  {...props}
                  className={`group text-left rounded-2xl p-6 bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${item.span}`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.accent} mb-4 opacity-90 group-hover:opacity-100 transition`} />
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-800 transition">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                  <span className="inline-flex items-center mt-3 text-xs font-semibold text-teal-700">
                    {locked ? "Sign in" : "Open"} <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </Wrap>
              );
            })}
          </div>
        </div>
      </section>

      {/* —— Spotlight gallery —— */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className={CONTAINER}>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">What we build</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Craft that clients notice</h2>
            <p className="text-slate-400">Websites, dashboards, and platforms designed to impress users and drive results.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {IMAGES.spotlight.map((item, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[4/3] ring-1 ring-white/10">
                <img src={item.src} alt={item.label} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Capability</p>
                  <p className="text-xl font-bold">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-amber-50 transition"
            >
              See all projects <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* —— Process timeline —— */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className={CONTAINER}>
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">How we work</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">A process you can follow</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-teal-200 via-amber-200 to-teal-200" aria-hidden />
            {PROCESS.map((step) => (
              <div key={step.num} className="relative text-center lg:text-left">
                <div className="w-16 h-16 mx-auto lg:mx-0 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center text-2xl font-black shadow-lg mb-5 relative z-10">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* —— Showcase band —— */}
      <section className="relative h-72 sm:h-80 lg:h-[28rem] overflow-hidden">
        <img
          src={IMAGES.showcase}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/85 via-slate-900/70 to-amber-900/40" />
        <div className={`${CONTAINER} relative h-full flex items-center`}>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300 mb-3">Built with care</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug">
              Design and engineering, delivered as one polished experience.
            </p>
          </div>
        </div>
      </section>

      {/* —— Highlights —— */}
      <section className="py-16 sm:py-20 bg-[#faf9f7] border-y border-slate-200/60">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{h.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{h.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <AboutSection />

      <section className="bg-white pt-16 sm:pt-20">
        <div className={`${CONTAINER} text-center mb-8`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">By the numbers</h2>
          <p className="text-slate-600">Experience you can measure.</p>
        </div>
        <StatsSection />
      </section>

      <Testimonials />

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-[#faf9f7]">
        <div className={`${CONTAINER} max-w-2xl`}>
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">Questions &amp; answers</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-slate-900"
                    aria-expanded={open}
                  >
                    {item.q}
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && <p className="px-5 pb-4 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 sm:py-20 bg-white">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200">
                <img src={IMAGES.newsletter} alt="Stay in the loop" loading="lazy" className="w-full h-64 lg:h-80 object-cover" />
              </div>
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2">
              <Newsletter />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${IMAGES.cta}')` }} />
        <div className="absolute inset-0 bg-slate-900/85" />
        <div className={`${CONTAINER} relative text-center`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5">Ready to start your project?</h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            {isAuthenticated
              ? "Request a tailored quote from your account, or reach out if you have questions before you scope."
              : "Create a free account to request a quote. General questions? Contact us anytime — no account required."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/request-quote"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 shadow-lg transition"
                >
                  Request a Quote
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition"
                >
                  Contact Us
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 shadow-lg transition"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  state={{ from: '/request-quote' }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition"
                >
                  Sign In to Request a Quote
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Home;
