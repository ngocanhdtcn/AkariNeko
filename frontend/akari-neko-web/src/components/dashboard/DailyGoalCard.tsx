"use client";

import { Check, Target } from "lucide-react";
import { motion } from "motion/react";
import { IconBadge } from "../ui/IconBadge";
import { SoftPanel } from "../ui/SoftPanel";

export function DailyGoalCard() {
  return (
    <SoftPanel className="relative min-h-[230px] overflow-hidden bg-gradient-to-br from-white to-pink-50 p-5">
      <div className="mb-3 flex items-center gap-3">
        <IconBadge icon={Target} />

        <h3 className="text-xl font-black text-slate-800">Mục tiêu mỗi ngày</h3>
      </div>

      <div className="flex items-end gap-2">
        <p className="text-4xl font-black text-slate-800">40</p>
        <p className="pb-1 text-base font-bold text-slate-500">/ 40 từ</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-pink-100">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 text-white shadow-md">
          <Check size={20} strokeWidth={3} />
        </div>
      </div>

      <div className="mt-6 w-[62%] rounded-2xl border border-pink-100 bg-white/85 p-3 text-sm font-semibold leading-6 text-slate-600 shadow-sm">
        Yay! Bạn đã hoàn thành mục tiêu hôm nay! Cố gắng tiếp tục nhé! ✨
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ rotate: -5, scale: 1.08 }}
        className="absolute bottom-2 right-2 text-8xl drop-shadow-sm"
      >
        🐱
      </motion.div>

      <div className="pointer-events-none absolute bottom-8 right-28 text-xl text-pink-300">
        🌸
      </div>
    </SoftPanel>
  );
}
