import Link from "next/link";
import type { RecentStudySession } from "@/services/dashboardStatsService";
import { SoftPanel } from "../ui/SoftPanel";

type RecentStudySessionsCardProps = {
  sessions: RecentStudySession[];
  isLoading: boolean;
};

function formatStudyDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getScopeLabel(session: RecentStudySession) {
  return [
    session.level ?? "All levels",
    session.book ?? "All books",
    session.chapter ?? "All chapters",
  ].join(" ・ ");
}

export function RecentStudySessionsCard({
  sessions,
  isLoading,
}: RecentStudySessionsCardProps) {
  return (
    <SoftPanel className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-slate-800">
            Phiên học gần đây
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Các phiên flashcard đã lưu.
          </p>
        </div>

        <Link
          href="/study-history"
          className="rounded-2xl border border-pink-100 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-pink-50"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-pink-50 bg-white px-4 py-6 text-center text-sm font-bold text-slate-400">
          Đang tải phiên học...
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border border-pink-50 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-700">
                    {formatStudyDate(session.createdAt)}
                  </p>

                  <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                    {getScopeLabel(session)}
                  </p>

                  {session.onlyDifficult ? (
                    <p className="mt-1 text-xs font-bold text-amber-500">
                      Only difficult
                    </p>
                  ) : null}
                </div>

                <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-500">
                  {session.reviewedCount} từ
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="rounded-xl bg-slate-50 px-2 py-2 text-slate-600">
                  Reviewed {session.reviewedCount}
                </div>

                <div className="rounded-xl bg-emerald-50 px-2 py-2 text-emerald-600">
                  Remember {session.rememberedCount}
                </div>

                <div className="rounded-xl bg-rose-50 px-2 py-2 text-rose-500">
                  Forgot {session.forgotCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-pink-50 bg-white px-4 py-6 text-center text-sm font-medium text-slate-400">
          Chưa có phiên học nào. Hãy học Flashcard rồi bấm Kết thúc phiên.
        </div>
      )}
    </SoftPanel>
  );
}
