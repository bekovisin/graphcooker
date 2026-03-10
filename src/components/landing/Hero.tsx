"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-600 text-sm font-semibold mb-6 border border-orange-200"
            >
              <Sparkles size={16} />
              <span>Free during beta</span>
            </motion.div>

            <h1 className="text-[38px] lg:text-[48px] font-outfit font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              <span className="relative inline-block">
                <span className="font-shantell text-orange-500 font-normal relative z-10">Cook your data</span>
                <svg className="absolute w-full h-4 -bottom-2 left-0 text-orange-400 z-0 overflow-visible" viewBox="0 -5 100 20" preserveAspectRatio="none">
                  <path d="M2,8 Q25,15 50,5 T98,10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{" "}
              into{" "}
              <span className="text-slate-900">
                stunning
              </span>{" "}
              visualizations
            </h1>

            <p className="text-[16px] text-slate-600 mb-8 leading-relaxed max-w-xl">
              Turn raw spreadsheets into beautiful, interactive charts — bar,
              line, pie and more. No design skills needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#waitlist"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-95"
              >
                Join the Waitlist
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-[6px] font-semibold text-base hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95"
              >
                Sign in
              </Link>
            </div>
          </motion.div>

          {/* Visual Content / Mockups */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative h-[400px] lg:h-[500px] w-full"
          >
            {/* Main Dashboard Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] sm:w-[90%] bg-white rounded-xl shadow-2xl border border-slate-100 p-6 z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-outfit font-bold text-lg text-slate-900">
                    Monthly Revenue
                  </h3>
                  <p className="text-xs text-slate-500">Q1-Q2 2026</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                </div>
              </div>

              {/* Animated Bar Chart with Grid Lines */}
              <div className="relative h-48 mt-4 flex items-end gap-3">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full border-t border-slate-100/80 border-dashed" />
                  ))}
                </div>

                {/* Bars */}
                {[40, 70, 45, 90, 60, 85, 50, 75].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{
                      duration: 1,
                      delay: 0.5 + i * 0.1,
                      ease: "easeOut",
                    }}
                    className={`w-full rounded-t-md relative z-10 ${i % 2 === 0 ? "bg-orange-400" : "bg-orange-500"}`}
                  />
                ))}
              </div>
              {/* X-Axis Labels */}
              <div className="flex justify-between mt-2 px-1">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((month) => (
                  <span key={month} className="text-[10px] text-slate-400 font-medium">{month}</span>
                ))}
              </div>
            </motion.div>

            {/* Floating Pie Chart Card */}
            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, 2, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -top-4 -right-4 sm:-right-12 w-52 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-20"
            >
              <div className="mb-4">
                <h4 className="font-outfit font-bold text-sm text-slate-900">
                  Market Share
                </h4>
                <p className="text-[10px] text-slate-500">By region</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <motion.circle
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{ strokeDasharray: "75 100" }}
                      transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#F97316"
                      strokeWidth="20"
                    />
                    <motion.circle
                      initial={{ strokeDasharray: "0 100" }}
                      animate={{ strokeDasharray: "25 100" }}
                      transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#fed7aa"
                      strokeWidth="20"
                      strokeDashoffset="-75"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-orange-500" />
                    <span className="text-[10px] text-slate-600">NA (75%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm bg-orange-200" />
                    <span className="text-[10px] text-slate-600">EU (25%)</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Line Chart Card */}
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, -2, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute -bottom-8 -left-4 sm:-left-8 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-20"
            >
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h4 className="font-outfit font-bold text-sm text-slate-900">
                    Growth Trends
                  </h4>
                  <p className="text-[10px] text-slate-500">Year over year</p>
                </div>
                <div className="text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  +24%
                </div>
              </div>
              <div className="relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-full border-t border-slate-100/80 border-dashed" />
                  ))}
                </div>
                <svg
                  viewBox="0 0 100 40"
                  className="w-full h-16 overflow-visible relative z-10"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 1.5, ease: "easeInOut" }}
                    d="M0,30 Q20,30 40,20 T80,10 T100,5"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 1.7, ease: "easeInOut" }}
                    d="M0,35 Q30,35 50,25 T90,15 T100,10"
                    fill="none"
                    stroke="#fed7aa"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />
                  {/* Data Points */}
                  <motion.circle initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.2 }} cx="40" cy="20" r="2.5" fill="white" stroke="#F97316" strokeWidth="1.5" />
                  <motion.circle initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.4 }} cx="80" cy="10" r="2.5" fill="white" stroke="#F97316" strokeWidth="1.5" />
                  <motion.circle initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3.5 }} cx="100" cy="5" r="2.5" fill="white" stroke="#F97316" strokeWidth="1.5" />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
