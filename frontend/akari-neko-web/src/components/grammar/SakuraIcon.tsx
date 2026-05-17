"use client";

type SakuraIconProps = {
  className?: string;
  size?: number;
};

export function SakuraIcon({ className = "", size = 22 }: SakuraIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <ellipse cx="16" cy="8.2" rx="4.1" ry="6.1" />
        <ellipse
          cx="22.7"
          cy="13.1"
          rx="4.1"
          ry="6.1"
          transform="rotate(72 22.7 13.1)"
        />
        <ellipse
          cx="20.1"
          cy="21"
          rx="4.1"
          ry="6.1"
          transform="rotate(144 20.1 21)"
        />
        <ellipse
          cx="11.9"
          cy="21"
          rx="4.1"
          ry="6.1"
          transform="rotate(216 11.9 21)"
        />
        <ellipse
          cx="9.3"
          cy="13.1"
          rx="4.1"
          ry="6.1"
          transform="rotate(288 9.3 13.1)"
        />
      </g>
      <circle cx="16" cy="16" r="3.2" fill="#fff7fb" />
      <circle cx="16" cy="16" r="1.35" fill="currentColor" opacity="0.78" />
    </svg>
  );
}
