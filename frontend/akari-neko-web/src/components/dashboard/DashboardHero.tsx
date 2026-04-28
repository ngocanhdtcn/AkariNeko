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
      className="relative min-h-60 overflow-hidden rounded-[28px] border border-pink-100/80 bg-[linear-gradient(105deg,#fff2f7_0%,#fff7fb_42%,#eee8ff_100%)] px-5 py-6 shadow-[0_18px_50px_rgba(236,72,153,0.10)] sm:min-h-65 sm:rounded-4xl sm:px-9 sm:py-8"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-8 h-44 w-44 rounded-full bg-pink-200/35 blur-3xl" />
        <div className="absolute right-10 top-8 h-40 w-40 rounded-full bg-violet-200/35 blur-3xl" />

        <motion.div
          animate={{ y: [0, -5, 0], rotate: [0, 2, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-0 top-0 text-6xl opacity-45 sm:text-7xl"
        >
          🌸
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0], rotate: [0, -2, 0] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-8 top-14 text-5xl opacity-60 sm:text-6xl"
        >
          🌸
        </motion.div>

        <div className="absolute bottom-8 right-[30%] hidden text-4xl opacity-45 sm:block">
          🌸
        </div>

        <div className="absolute bottom-0 right-[18%] hidden h-37.5 w-75 rounded-t-full bg-linear-to-t from-violet-300/45 to-violet-100/20 sm:block" />

        <div className="absolute bottom-0 right-[22%] hidden h-33 w-62.5 rounded-t-full bg-linear-to-t from-slate-400/30 to-white/70 sm:block" />

        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-8 right-[14%] hidden text-8xl opacity-75 sm:block"
        >
          🗻
        </motion.div>

        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 4.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-7 right-8 hidden text-7xl opacity-80 sm:block"
        >
          🏯
        </motion.div>

        <div className="absolute bottom-3 right-[12%] hidden h-2 w-80 rounded-full bg-pink-200/50 blur-sm sm:block" />
      </div>

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
          className="mt-3 text-sm font-medium text-slate-600 sm:text-base"
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
          className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
        >
          Continue studying N3 〉
        </motion.button>
      </div>
    </motion.section>
  );
}
