import { getCurrentProfile } from "@/services/authService";

export async function getStudentLockedJlptLevel(): Promise<string | null> {
  const profile = await getCurrentProfile();

  if (profile?.role !== "student") {
    return null;
  }

  return profile.currentJlptLevel?.toUpperCase() || "N5";
}

export async function getStudentLockedContentLevel<TLevel extends string>(
  normalizeLevel: (level: string) => TLevel | null,
): Promise<TLevel | null> {
  const lockedLevel = await getStudentLockedJlptLevel();

  return lockedLevel ? normalizeLevel(lockedLevel) : null;
}

export async function requireAdminContentAccess(): Promise<void> {
  const profile = await getCurrentProfile();

  if (profile?.role !== "admin") {
    throw new Error("Chỉ quản trị viên mới có thể cập nhật nội dung học.");
  }
}
