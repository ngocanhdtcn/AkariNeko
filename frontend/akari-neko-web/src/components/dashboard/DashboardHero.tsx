"use client";

import { motion } from "motion/react";
import { AkariNekoWordmark } from "../branding/AkariNekoWordmark";

export function DashboardHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="akari-dashboard-hero relative min-h-60 overflow-hidden rounded-[28px] border border-pink-100/80 bg-white px-5 py-6 shadow-[0_18px_50px_rgba(236,72,153,0.10)] sm:min-h-65 sm:rounded-4xl sm:px-9 sm:py-8"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/akari-assets/hero-bg.png')",
        }}
        aria-hidden="true"
      />
      <div className="akari-dashboard-hero-overlay absolute inset-0 bg-gradient-to-r from-white/78 via-white/28 to-white/0" />
      <div className="absolute inset-0 bg-gradient-to-t from-pink-50/20 via-transparent to-transparent" />

      <motion.div
        animate={{ x: [0, 16, 0], y: [0, -8, 0], rotate: [0, 6, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute right-[18%] top-8 hidden text-2xl text-pink-300 sm:block"
        aria-hidden="true"
      >
        ✿
      </motion.div>

      <motion.div
        animate={{ x: [0, -18, 0], y: [0, 10, 0], rotate: [0, -8, 0] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute right-[8%] top-28 hidden text-xl text-pink-300 sm:block"
        aria-hidden="true"
      >
        ✿
      </motion.div>

      <div className="relative z-10 max-w-140">
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.05,
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl"
        >
          ようこそ、Ngọc Ánhさん！🌸
        </motion.p>

        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.1,
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-3 text-sm font-medium text-slate-700 sm:text-base"
        >
          Hôm nay bạn muốn học gì nào?
        </motion.p>

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.15,
            duration: 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-6"
        >
          <AkariNekoWordmark
            size="lg"
            subtitle="Thắp sáng tiếng Nhật mỗi ngày ✨"
          />
        </motion.div>

        <motion.button
          type="button"
          whileHover={{
            y: -2,
            scale: 1.015,
            boxShadow: "0 14px 30px rgba(236,72,153,0.16)",
          }}
          whileTap={{ scale: 0.985 }}
          transition={{
            duration: 0.16,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="akari-dashboard-hero-cta mt-6 rounded-2xl bg-white/95 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
        >
          Continue studying N3 〉
        </motion.button>
      </div>
    </motion.section>
  );
}
