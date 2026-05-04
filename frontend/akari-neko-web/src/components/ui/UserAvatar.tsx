"use client";

import { useState } from "react";

type UserAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
};

function getInitial(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "A";
}

function getSafeAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) {
    return null;
  }

  try {
    const { protocol } = new URL(avatarUrl);
    return protocol === "http:" || protocol === "https:" ? avatarUrl : null;
  } catch {
    return null;
  }
}

export function UserAvatar({
  name,
  avatarUrl,
  className = "h-10 w-10 rounded-2xl text-sm",
  imageClassName = "h-full w-full object-cover",
}: UserAvatarProps) {
  const safeAvatarUrl = getSafeAvatarUrl(avatarUrl);
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = safeAvatarUrl && !hasImageError;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-pink-100 bg-pink-50 font-black text-pink-500 shadow-sm ${className}`}
    >
      {shouldShowImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeAvatarUrl}
          alt={name || "Akari user"}
          className={imageClassName}
          referrerPolicy="no-referrer"
          onError={() => setHasImageError(true)}
        />
      ) : (
        getInitial(name)
      )}
    </div>
  );
}
