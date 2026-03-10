'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  BarChart3,
  Palette,
  Share2,
  Zap,
  FileDown,
  Layout,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Animation helpers ──────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Mock chart SVG ─────────────────────────────────────────
function MockChart() {
  const bars = [
    { h: 65, color: '#f97316' },
    { h: 90, color: '#fb923c' },
    { h: 45, color: '#fdba74' },
    { h: 78, color: '#f97316' },
    { h: 55, color: '#fb923c' },
    { h: 95, color: '#ea580c' },
    { h: 70, color: '#fdba74' },
    { h: 85, color: '#f97316' },
  ];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" fill="none">
      <rect x="0" y="0" width="320" height="180" rx="8" fill="white" />
      <line x1="40" y1="160" x2="300" y2="160" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="40" y1="130" x2="300" y2="130" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="4" />
      <line x1="40" y1="100" x2="300" y2="100" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="4" />
      <line x1="40" y1="70" x2="300" y2="70" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="4" />
      {bars.map((bar, i) => (
        <motion.rect
          key={i}
          x={48 + i * 32}
          width="22"
          rx="3"
          fill={bar.color}
          initial={{ y: 160, height: 0 }}
          animate={{ y: 160 - bar.h, height: bar.h }}
          transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      <text x="16" y="16" fontSize="8" fontWeight="600" fill="#374151">Monthly Revenue</text>
      <text x="16" y="26" fontSize="6" fill="#9ca3af">Q1-Q2 2026</text>
    </svg>
  );
}

function MockLineChart() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" fill="none">
      <rect x="0" y="0" width="320" height="180" rx="8" fill="white" />
      <line x1="40" y1="160" x2="300" y2="160" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="40" y1="120" x2="300" y2="120" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="4" />
      <line x1="40" y1="80" x2="300" y2="80" stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="4" />
      <motion.path
        d="M50,130 C80,120 100,90 130,95 C160,100 180,60 210,70 C240,80 260,40 290,50"
        stroke="#f97316"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M50,150 C80,140 100,125 130,130 C160,135 180,110 210,115 C240,120 260,100 290,105"
        stroke="#fdba74"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <text x="16" y="16" fontSize="8" fontWeight="600" fill="#374151">Growth Trends</text>
      <text x="16" y="26" fontSize="6" fill="#9ca3af">Year over year</text>
    </svg>
  );
}

function MockPieChart() {
  return (
    <svg viewBox="0 0 180 180" className="w-full h-full" fill="none">
      <rect x="0" y="0" width="180" height="180" rx="8" fill="white" />
      <motion.circle cx="90" cy="100" r="55" fill="none" stroke="#f97316" strokeWidth="24"
        strokeDasharray="120 226" strokeDashoffset="0" strokeLinecap="round"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} />
      <motion.circle cx="90" cy="100" r="55" fill="none" stroke="#fb923c" strokeWidth="24"
        strokeDasharray="80 266" strokeDashoffset="-120" strokeLinecap="round"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} />
      <motion.circle cx="90" cy="100" r="55" fill="none" stroke="#fdba74" strokeWidth="24"
        strokeDasharray="60 286" strokeDashoffset="-200" strokeLinecap="round"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} />
      <text x="14" y="18" fontSize="8" fontWeight="600" fill="#374151">Market Share</text>
      <text x="14" y="28" fontSize="6" fill="#9ca3af">By segment</text>
    </svg>
  );
}

// ── Features data ──────────────────────────────────────────
const features = [
  { icon: BarChart3, title: 'Beautiful Charts', desc: 'Bar, line, pie and more — pixel-perfect out of the box.' },
  { icon: Palette, title: 'Customizable Themes', desc: 'Create and save your own color palettes and styles.' },
  { icon: Share2, title: 'Easy Sharing', desc: 'Share templates and visualizations with your team.' },
  { icon: Zap, title: 'Real-time Preview', desc: 'See changes instantly as you edit data and settings.' },
  { icon: FileDown, title: 'Export Anywhere', desc: 'Download as PNG, SVG, PDF or embeddable HTML.' },
  { icon: Layout, title: 'Template Library', desc: 'Start fast with pre-built templates and save your own.' },
];

// ── Main component ─────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ShowcaseSection />
        <BetaBanner />
        <WaitlistSection />
      </main>
      <Footer />
    </div>
  );
}

// ── Navbar ──────────────────────────────────────────────────
function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100"
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/graphcooker-icon.svg" alt="GraphCooker" width={24} height={24} />
          <span className="font-shantell text-lg">
            graph<span className="text-orange-500">cooker</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="#waitlist"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
          >
            Join Waitlist
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Login
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

// ── Hero ────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-orange-50 text-orange-600 rounded-full border border-orange-200 mb-6">
                <Sparkles className="w-3 h-3" />
                Free during beta
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight"
            >
              Cook your data into{' '}
              <span className="text-orange-500">stunning</span>{' '}
              visualizations
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg"
            >
              Turn raw spreadsheets into beautiful, interactive charts — bar, line, pie and more. No design skills needed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex items-center gap-3"
            >
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                Join the Waitlist
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </motion.div>
          </div>

          {/* Hero chart mockups */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main chart */}
              <div className="rounded-xl shadow-2xl shadow-orange-500/10 border border-gray-100 overflow-hidden">
                <MockChart />
              </div>
              {/* Floating line chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -bottom-8 -left-8 w-56 rounded-lg shadow-xl border border-gray-100 overflow-hidden"
              >
                <MockLineChart />
              </motion.div>
              {/* Floating pie chart */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="absolute -top-6 -right-6 w-36 rounded-lg shadow-xl border border-gray-100 overflow-hidden"
              >
                <MockPieChart />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Features ────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Everything you need to visualize data
          </h2>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            A full-featured toolkit for creating professional charts and dashboards.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08}>
              <div className="bg-white rounded-xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                  <f.icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Showcase ────────────────────────────────────────────────
function ShowcaseSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            From data to dashboard in minutes
          </h2>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            Paste your data, pick a chart type, customize the look — done.
          </p>
        </FadeUp>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* App window mockup */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/60 overflow-hidden bg-white">
            {/* Window title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-md border border-gray-200 text-xs text-gray-400">
                  <Image src="/graphcooker-icon.svg" alt="" width={12} height={12} />
                  graphcooker.com
                </div>
              </div>
            </div>
            {/* App content mockup */}
            <div className="grid grid-cols-[200px_1fr] min-h-[360px]">
              {/* Sidebar mockup */}
              <div className="border-r border-gray-100 p-4 space-y-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settings</div>
                {['Chart Type', 'Colors', 'Labels', 'Layout', 'Axes', 'Legend'].map((item, i) => (
                  <div
                    key={item}
                    className={`text-sm px-3 py-1.5 rounded-md ${
                      i === 1 ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Chart area */}
              <div className="p-6 flex items-center justify-center bg-gray-50/50">
                <div className="w-full max-w-md">
                  <MockChart />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Beta banner ─────────────────────────────────────────────
function BetaBanner() {
  return (
    <section className="py-16 px-6">
      <FadeUp>
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-10 text-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-white/20 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            Beta Program
          </div>
          <h2 className="text-3xl font-bold mb-3">Currently in Beta — 100% Free</h2>
          <p className="text-orange-100 max-w-lg mx-auto leading-relaxed">
            We&apos;re building GraphCooker in the open. Join our early access program and get full access to every feature at no cost while we shape the product together.
          </p>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-orange-600 text-sm font-medium rounded-xl hover:bg-orange-50 transition-colors"
          >
            Join the Waitlist
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </FadeUp>
    </section>
  );
}

// ── Waitlist form ───────────────────────────────────────────
function WaitlistSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, message: message.trim() || undefined }),
      });

      if (res.status === 429) {
        toast.error('Too many submissions. Please try again later.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Something went wrong');
        return;
      }

      setSubmitted(true);
      toast.success("You're on the list!");
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 px-6 bg-gray-50/50">
      <div className="max-w-xl mx-auto">
        <FadeUp className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Join the Waitlist
          </h2>
          <p className="mt-3 text-gray-500">
            Be the first to know when we launch. Early users get free access.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          {submitted ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">You&apos;re on the list!</h3>
              <p className="text-sm text-gray-500">We&apos;ll notify you as soon as GraphCooker is ready.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4 shadow-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 555 123 4567"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you'd like to see in GraphCooker..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Join the Waitlist
                  </>
                )}
              </button>
            </form>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/graphcooker-icon.svg" alt="" width={16} height={16} />
          <span className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} GraphCooker. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#waitlist" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Waitlist
          </a>
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
