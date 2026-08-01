import type { AuthProfile } from "@/services/authService";

const fallbackAllowedMessageEmails = ["ngocanhdtcn@gmail.com"];

function getAllowedMessageEmails() {
  const configuredEmails = process.env.NEXT_PUBLIC_MESSAGES_ALLOWED_EMAILS;

  if (!configuredEmails) {
    return fallbackAllowedMessageEmails;
  }

  const allowedEmails = configuredEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.length > 0 ? allowedEmails : fallbackAllowedMessageEmails;
}

export function canUseMessages(profile: AuthProfile | null | undefined) {
  if (!profile?.email) {
    return false;
  }

  return getAllowedMessageEmails().includes(profile.email.trim().toLowerCase());
}
