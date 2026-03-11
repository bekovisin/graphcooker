"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 group" aria-label="GraphCooker Home">
          <Image src="/graphcooker-icon.svg" alt="GraphCooker" width={22} height={22} />
          <span className="font-shantell text-xl font-normal tracking-tight text-slate-900 relative">
            graph<span className="text-orange-500">cooker</span>
            <span className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-orange-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </span>
        </Link>

        <nav className="flex items-center gap-6" aria-label="Main Navigation">
          <Link
            href="#features"
            className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
          >
            Features
          </Link>
          <Link
            href="#compare"
            className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
          >
            Compare
          </Link>
          <Link
            href="#waitlist"
            className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
          >
            Join Waitlist
          </Link>
          {!isLoading && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="text-[14px] font-medium bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[14px] font-medium bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/20 active:scale-95"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
