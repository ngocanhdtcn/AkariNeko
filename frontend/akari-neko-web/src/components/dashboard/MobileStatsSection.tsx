"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { mobileStatistics } from "@/data/dashboardData";

export function MobileStatsSection() {
  return (
    <section className="grid gap-4 lg:hidden">
      <div className="rounded-[26px] border border-pink-100/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.09)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800">Tiến độ hôm nay</h3>

          <ChevronRight size={20} className="text-slate-400" />
        </div>

        <div className="grid grid-cols-[130px_1fr] items-center gap-4">
          <div className="grid h-30 w-30 place-items-center rounded-full bg-[conic-gradient(#8b5cf6_0_72%,#f1eaf6_72%_100%)]">
            <div className="grid h-22 w-22 place-items-center rounded-full bg-white">
              <p className="text-3xl font-black text-slate-800">72%</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-600">
            <div className="flex justify-between border-b border-pink-50 pb-2">
              <span>Đã học</span>
              <b>36 từ</b>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-2">
              <span>Còn lại</span>
              <b>14 từ</b>
            </div>
            <div className="flex justify-between">
              <span>Thời gian</span>
              <b>28 phút</b>
            </div>
          </div>
        </div>
      </div>

      <div className="relative min-h-[170px] overflow-hidden rounded-[26px] border border-pink-100/80 bg-gradient-to-br from-pink-50 to-white p-5 shadow-[0_18px_50px_rgba(236,72,153,0.09)]">
        <h3 className="text-xl font-black text-slate-800">継続は力なり。</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Kiên trì là sức mạnh.
        </p>

        <div className="mt-5 inline-flex gap-2 rounded-2xl bg-white/80 p-3 shadow-sm">
          {["✓", "✓", "✓", "✓", "T", "T"].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="grid h-7 w-7 place-items-center rounded-full bg-pink-300 text-xs font-black text-white"
            >
              {item}
            </span>
          ))}
        </div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ rotate: -5, scale: 1.08 }}
          className="absolute bottom-0 right-4 text-8xl"
        >
          🐱
        </motion.div>
      </div>

      <section className="rounded-[26px] border border-pink-100/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.09)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800">Thống kê</h3>

          <button
            type="button"
            className="rounded-2xl border border-pink-100 bg-white px-3 py-2 text-sm font-bold text-slate-600"
          >
            Tuần này⌄
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mobileStatistics.map((statistic) => (
            <div
              key={statistic.label}
              className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">
                {statistic.label}
              </p>

              <p className="mt-1 text-xl font-black text-slate-800">
                {statistic.value}{" "}
                <span className="text-sm text-emerald-500">
                  {statistic.trend}
                </span>
              </p>

              <div className="mt-3 h-6 rounded-lg bg-gradient-to-r from-violet-100 via-white to-pink-100" />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
