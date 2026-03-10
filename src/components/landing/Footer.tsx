"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";

export default function Footer() {
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    <footer className="bg-white border-t border-slate-100 py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-slate-500">
          <Image src="/graphcooker-icon.svg" alt="GraphCooker" width={20} height={20} className="text-orange-400" />
          <span className="text-sm">
            © {new Date().getFullYear()} GraphCooker. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
          <Link
            href="#waitlist"
            className="hover:text-orange-500 transition-colors"
          >
            Waitlist
          </Link>
          {!isLoading && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="hover:text-orange-500 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hover:text-orange-500 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
