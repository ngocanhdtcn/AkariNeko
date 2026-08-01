"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { studyShortcutCards } from "@/data/dashboardData";

type StudyShortcutCardsProps = {
  showKaiwa?: boolean;
};

export function StudyShortcutCards({ showKaiwa = true }: StudyShortcutCardsProps) {
  const visibleCards = showKaiwa
    ? studyShortcutCards
    : studyShortcutCards.filter((card) => card.href !== "/kaiwa");

  return (
    <section className="akari-study-shortcuts grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-5">
      {visibleCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Link key={card.title} href={card.href} className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.035,
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                y: -4,
                scale: 1.012,
                boxShadow: "0 18px 38px rgba(236,72,153,0.14)",
              }}
              whileTap={{
                scale: 0.985,
              }}
              className={`akari-study-shortcut-card group min-h-36 rounded-[24px] border border-pink-100/80 bg-gradient-to-br ${card.cardClassName} p-4 text-left shadow-[0_14px_34px_rgba(236,72,153,0.08)] sm:min-h-40 sm:p-5`}
            >
              <motion.div
                whileHover={{
                  rotate: -3,
                  scale: 1.04,
                }}
                transition={{
                  duration: 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${card.iconClassName} shadow-[0_10px_22px_rgba(236,72,153,0.18)] sm:mb-4 sm:h-14 sm:w-14`}
              >
                <Icon size={24} strokeWidth={2.4} />
              </motion.div>

              <div className="flex min-h-[78px] flex-col">
                <p className="text-base font-black text-slate-800 sm:text-lg">
                  {card.title}
                </p>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  {card.description}
                </p>
              </div>

              <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-500 shadow-sm group-hover:border-pink-200 group-hover:bg-pink-50 group-hover:text-pink-500">
                <ChevronRight size={17} strokeWidth={2.6} />
              </div>
            </motion.div>
          </Link>
        );
      })}
    </section>
  );
}
