"use client";

import { Check, Target } from "lucide-react";
import { motion } from "motion/react";
import { IconBadge } from "../ui/IconBadge";
import { SoftPanel } from "../ui/SoftPanel";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";

type DailyGoalCardProps = {
  reviewedCount: number;
  goalCount: number;
  isLoading: boolean;
};

export function DailyGoalCard({
  reviewedCount,
  goalCount,
  isLoading,
}: DailyGoalCardProps) {
  const progressPercent =
    goalCount > 0
      ? Math.min(100, Math.round((reviewedCount / goalCount) * 100))
      : 0;
  const isCompleted = reviewedCount >= goalCount;
  const remainingCount = Math.max(0, goalCount - reviewedCount);

  if (isLoading) {
    return <LoadingSkeleton variant="card" className="min-h-[250px]" />;
  }

  return (
    <SoftPanel className="relative min-h-[250px] overflow-hidden bg-gradient-to-br from-white via-white to-pink-50 p-5">
      <div className="mb-3 flex items-center gap-3">
        <IconBadge icon={Target} />

        <h3 className="text-xl font-black text-slate-800">
          Mục tiêu mỗi ngày
        </h3>
      </div>

      <div className="relative z-10 flex items-end gap-2">
        <p className="text-4xl font-black text-slate-800">
          {reviewedCount}
        </p>
        <p className="pb-1 text-base font-bold text-slate-500">
          / {goalCount} lượt ôn
        </p>
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-pink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md ${
            isCompleted ? "bg-pink-500" : "bg-slate-300"
          }`}
        >
          <Check size={20} strokeWidth={3} />
        </div>
      </div>

      <div className="relative z-10 mt-6 w-[58%] rounded-2xl border border-pink-100 bg-white/90 p-3 text-sm font-semibold leading-6 text-slate-600 shadow-sm backdrop-blur">
        <p className="font-black text-pink-500">
          {progressPercent}%
        </p>
        <p className="mt-1">
          {isCompleted
              ? "Yay! Bạn đã hoàn thành mục tiêu hôm nay. Cố gắng tiếp tục nhé!"
              : `Còn ${remainingCount} lượt ôn nữa để hoàn thành.`}
        </p>
      </div>

      <motion.img
        src="/akari-assets/cat-goal.png"
        alt=""
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ rotate: -4, scale: 1.05 }}
        className="absolute -bottom-1 right-2 h-[10.5rem] w-[10.5rem] object-contain drop-shadow-sm"
      />

      <span className="absolute bottom-12 right-36 text-lg text-pink-300">
        ✿
      </span>
      {isCompleted ? (
        <span className="absolute right-4 top-4 text-xl text-yellow-300">
          ✦
        </span>
      ) : null}
    </SoftPanel>
  );
}
