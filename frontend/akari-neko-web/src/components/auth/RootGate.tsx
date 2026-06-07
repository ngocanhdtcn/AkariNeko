"use client";

import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

const ROOT_AUTH_REDIRECT_DELAY_MS = 3000;

function FullPageLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-pink-50 via-white to-violet-50 px-4 text-center">
      <div className="grid gap-3">
        <LoadingSkeleton variant="card" className="w-[min(92vw,420px)]" />
        <p className="text-sm font-bold text-slate-500">
          Dang kiem tra dang nhap...
        </p>
      </div>
    </main>
  );
}

export function RootGate() {
  const { profile, isLoadingProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      return;
    }

    if (!isLoadingProfile) {
      window.location.replace("/auth");
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.replace("/auth");
    }, ROOT_AUTH_REDIRECT_DELAY_MS);

    return () => window.clearTimeout(redirectTimer);
  }, [isLoadingProfile, profile]);

  if (isLoadingProfile) {
    return <FullPageLoading />;
  }

  if (!profile) {
    return <FullPageLoading />;
  }

  return <DashboardLayout />;
}
