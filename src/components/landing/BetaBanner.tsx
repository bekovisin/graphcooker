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
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          className="bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400 bg-[length:200%_auto] rounded-[48px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-orange-400/30"
          style={{ transition: "background-position 3s ease-in-out" }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[50%] -left-[10%] w-[120%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent opacity-70 blur-3xl"
            />
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.2, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-[50%] -right-[10%] w-[120%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-100/50 via-transparent to-transparent opacity-70 blur-3xl"
            />
            <motion.div
              animate={{ y: [-15, 15, -15], rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 left-10 text-white/30"
            >
              <Sparkles size={48} />
            </motion.div>
            <motion.div
              animate={{ y: [15, -15, 15], rotate: [0, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 right-10 text-white/30"
            >
              <Sparkles size={64} />
            </motion.div>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
              animate={{ y: [0, -5, 0] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold mb-8 border border-white/30 shadow-sm"
            >
              <Sparkles size={16} />
              <span>Beta Program</span>
            </motion.div>

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
