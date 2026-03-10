"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BetaBanner() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400 rounded-[48px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-orange-400/30"
        >
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold mb-8 border border-white/30 shadow-sm">
              <Sparkles size={16} />
              <span>Beta Program</span>
            </div>

            <h2 className="text-[38px] font-outfit font-bold text-white mb-6 leading-tight">
              Currently in Beta — 100% Free
            </h2>

            <p className="text-[16px] text-orange-50 mb-10 leading-relaxed">
              We&apos;re building GraphCooker in the open. Join our early access
              program and get full access to every feature at no cost while we
              shape the product together.
            </p>

            <Link
              href="#waitlist"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-lg font-bold text-base hover:bg-orange-50 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95 no-underline w-full sm:w-auto"
            >
              Join the Waitlist
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
