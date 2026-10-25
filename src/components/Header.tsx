"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, FolderLock, NotebookPen, ShieldCheck } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "File Drop", href: "/drop", icon: FolderLock },
  { label: "Notes", href: "/notes", icon: NotebookPen },
];

export const Header: React.FC = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
      className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 transition-colors shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          {/* Custom Geometric Vault & Drop Portal Logo */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-transparent p-[1px] border border-violet-200 shadow-sm group-hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] group-hover:border-violet-300 transition-all duration-300">
            <div className="w-full h-full bg-slate-50 rounded-[11px] flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
              >
                <defs>
                  <linearGradient id="dropTopGrad" x1="6" y1="4" x2="30" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#DDD6FE" />
                    <stop offset="0.5" stopColor="#A78BFA" />
                    <stop offset="1" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="dropLeftGrad" x1="6" y1="13" x2="17" y2="31" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8B5CF6" />
                    <stop offset="1" stopColor="#6D28D9" />
                  </linearGradient>
                  <linearGradient id="dropRightGrad" x1="19" y1="19.5" x2="30" y2="31" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#4338CA" />
                  </linearGradient>
                </defs>

                {/* Isometric Cube Facets */}
                <path d="M18 4.5L29.5 11.2L18 17.8L6.5 11.2L18 4.5Z" fill="url(#dropTopGrad)" />
                <path d="M6.5 13.2L17.2 19.4V31.5L6.5 25.3V13.2Z" fill="url(#dropLeftGrad)" fillOpacity="0.9" />
                <path d="M18.8 19.4L29.5 13.2V25.3L18.8 31.5V19.4Z" fill="url(#dropRightGrad)" fillOpacity="0.95" />

                {/* Centered Beacon Particle Drop */}
                <path
                  d="M18 10.5L21.5 12.8L18 18.5L14.5 12.8L18 10.5Z"
                  fill="#FFFFFF"
                  className="filter drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                />
                <circle cx="18" cy="22" r="1.6" fill="#EDE9FE" />
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-violet-900 bg-clip-text text-transparent">
                DROP ANYWHERE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 -mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span> Your Keys. Your Files. Complete Privacy. </span>
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center bg-slate-100/90 border border-slate-200/90 p-1 rounded-xl relative shadow-inner">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors z-10 ${
                  active ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_2px_12px_rgba(124,58,237,0.3)] z-[-1]"
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
};
