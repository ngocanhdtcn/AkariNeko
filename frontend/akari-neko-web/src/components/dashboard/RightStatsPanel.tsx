import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LineChart,
  Target,
} from "lucide-react";
import { DailyGoalCard } from "./DailyGoalCard";
import { ProgressRing } from "./ProgressRing";
import { StatisticCard } from "./StatisticCard";
import { IconBadge } from "../ui/IconBadge";
import { SoftPanel } from "../ui/SoftPanel";
import { studyStatistics } from "@/data/dashboardData";

export function RightStatsPanel() {
  return (
    <aside className="hidden gap-4 xl:grid xl:content-start">
      <SoftPanel className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <IconBadge icon={Target} />

          <h3 className="text-xl font-black text-slate-800">Tiến độ hôm nay</h3>
        </div>

        <div className="flex items-center gap-5">
          <ProgressRing percent={75} />

          <div className="grid flex-1 gap-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <BookOpen size={17} className="text-emerald-500" />
                30 / 40 từ
              </span>
              <span className="text-xs text-slate-500">Từ vựng</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <GraduationCap size={17} className="text-violet-500" />
                18 / 20 câu
              </span>
              <span className="text-xs text-slate-500">Ngữ pháp</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <ClipboardList size={17} className="text-pink-500" />3 / 5 bài
              </span>
              <span className="text-xs text-slate-500">Bài kiểm tra</span>
            </div>
          </div>
        </div>
      </SoftPanel>

      <SoftPanel className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <IconBadge
            icon={LineChart}
            className="bg-violet-50 text-violet-500"
          />

          <h3 className="text-xl font-black text-slate-800">
            Thống kê học tập
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {studyStatistics.map((statistic) => (
            <StatisticCard
              key={statistic.label}
              label={statistic.label}
              value={statistic.value}
              icon={statistic.icon}
              iconClassName={statistic.iconClassName}
              chartClassName={statistic.chartClassName}
            />
          ))}
        </div>
      </SoftPanel>

      <DailyGoalCard />
    </aside>
  );
}
