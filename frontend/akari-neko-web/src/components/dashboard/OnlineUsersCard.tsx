import { UsersRound } from "lucide-react";
import { useOnlineUsers } from "@/contexts/OnlineUsersContext";
import { SoftPanel } from "../ui/SoftPanel";

function getInitial(displayName: string) {
  return displayName.trim().charAt(0).toUpperCase() || "A";
}

export function OnlineUsersCard() {
  const { onlineUsers, onlineUserCount } = useOnlineUsers();

  return (
    <SoftPanel className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
          <UsersRound size={22} />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-800">
            Người đang online
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {onlineUserCount} user đang online.
          </p>
        </div>
      </div>

      {onlineUsers.length > 0 ? (
        <div className="grid gap-3">
          {onlineUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-3 rounded-2xl border border-pink-50 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-sm font-black text-pink-500">
                {getInitial(user.displayName)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-700">
                  {user.displayName || "Akari user"}
                </p>

                {user.email ? (
                  <p className="truncate text-xs font-medium text-slate-400">
                    {user.email}
                  </p>
                ) : (
                  <p className="truncate text-xs font-medium text-slate-400">
                    Đang hoạt động
                  </p>
                )}
              </div>

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-pink-50 bg-white px-4 py-6 text-center text-sm font-medium text-slate-400">
          Chưa có user online.
        </div>
      )}
    </SoftPanel>
  );
}
