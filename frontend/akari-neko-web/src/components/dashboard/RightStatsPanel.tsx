import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LineChart,
  Target,
} from "lucide-react";
import { DAILY_FLASHCARD_REVIEW_GOAL } from "@/config/studyGoalConfig";
import { studyStatistics } from "@/data/dashboardData";
import type { DashboardStats } from "@/services/dashboardStatsService";
import { DailyGoalCard } from "./DailyGoalCard";
import { ProgressRing } from "./ProgressRing";
import { RecentStudySessionsCard } from "./RecentStudySessionsCard";
import { StatisticCard } from "./StatisticCard";
import { IconBadge } from "../ui/IconBadge";
import { SoftPanel } from "../ui/SoftPanel";
import { OnlineUsersCard } from "./OnlineUsersCard";

type RightStatsPanelProps = {
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
};

export function RightStatsPanel({
  dashboardStats,
  isLoading,
  errorMessage,
  onRefresh,
}: RightStatsPanelProps) {
  const totalVocabularyCount = dashboardStats?.totalVocabularyCount ?? 0;
  const todayReviewedCount =
    dashboardStats?.todayFlashcardStudyStats.reviewedCount ?? 0;
  const todayQuizCount = dashboardStats?.todayQuizStats.quizCount ?? 0;
  const recentStudySessions = dashboardStats?.recentStudySessions ?? [];
  const dailyGoalPercent = Math.min(
    100,
    Math.round((todayReviewedCount / DAILY_FLASHCARD_REVIEW_GOAL) * 100),
  );

  const displayStudyStatistics = studyStatistics.map((statistic) => {
    if (statistic.label === "Từ vựng đã học") {
      return {
        ...statistic,
        value: isLoading ? "..." : String(totalVocabularyCount),
      };
    }

    if (statistic.label === "Bài kiểm tra") {
      return {
        ...statistic,
        value: isLoading ? "..." : String(todayQuizCount),
      };
    }

    if (statistic.label === "Ôn hôm nay") {
      return {
        ...statistic,
        value: isLoading ? "..." : String(todayReviewedCount),
      };
    }

    return statistic;
  });

  return (
    <aside className="hidden gap-4 xl:grid xl:content-start">
      <SoftPanel className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <IconBadge icon={Target} />

          <h3 className="text-xl font-black text-slate-800">
            Tiến độ hôm nay
          </h3>
        </div>

        <div className="flex items-center gap-5">
          <ProgressRing percent={isLoading ? 0 : dailyGoalPercent} />

          <div className="grid flex-1 gap-4 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <BookOpen size={17} className="text-emerald-500" />
                {isLoading
                  ? "..."
                  : `${todayReviewedCount} / ${DAILY_FLASHCARD_REVIEW_GOAL} lượt`}
              </span>
              <span className="text-xs text-slate-500">Flashcard</span>
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

          <button
            type="button"
            disabled={isLoading}
            className="ml-auto rounded-2xl border border-pink-100 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onRefresh}
          >
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {displayStudyStatistics.map((statistic) => (
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

      <RecentStudySessionsCard
        sessions={recentStudySessions}
        isLoading={isLoading}
      />

      <OnlineUsersCard />

      <DailyGoalCard
        reviewedCount={todayReviewedCount}
        goalCount={DAILY_FLASHCARD_REVIEW_GOAL}
        isLoading={isLoading}
      />
    </aside>
  );
}
