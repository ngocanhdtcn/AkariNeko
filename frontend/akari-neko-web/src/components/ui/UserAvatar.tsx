"use client";

type UserAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
};

function getInitial(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "A";
}

export function UserAvatar({
  name,
  avatarUrl,
  className = "h-10 w-10 rounded-2xl text-sm",
  imageClassName = "h-full w-full object-cover",
}: UserAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-pink-100 bg-pink-50 font-black text-pink-500 shadow-sm ${className}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name || "Akari user"} className={imageClassName} />
      ) : (
        getInitial(name)
      )}
    </div>
  );
}
