type AkariNekoWordmarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  subtitle?: string;
  className?: string;
};

const wordmarkSizeClasses = {
  sm: {
    text: "text-[28px]",
    pawWrapper: "-right-2 top-1 scale-[0.5]",
    sparkleOne: "right-0 -top-1",
    sparkleTwo: "right-2 top-5",
    subtitle: "text-xs",
  },
  md: {
    text: "text-[40px]",
    pawWrapper: "right-0 top-2.5 scale-[0.75]",
    sparkleOne: "right-0 top-0",
    sparkleTwo: "right-3 top-8",
    subtitle: "text-sm",
  },
  lg: {
    text: "text-[52px]",
    pawWrapper: "-right-0 top-3 scale-[0.92]",
    sparkleOne: "-right-0 -top-0",
    sparkleTwo: "right-3 top-9",
    subtitle: "text-base",
  },
  xl: {
    text: "text-[64px]",
    pawWrapper: "right-0 top-4 scale-105",
    sparkleOne: "right-0 top-1",
    sparkleTwo: "right-4 top-11",
    subtitle: "text-base",
  },
};

function GoldenPawAccent() {
  return (
    <span className="relative block h-6 w-6">
      <span className="absolute left-[8px] top-[10px] h-[10px] w-[10px] rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]" />
      <span className="absolute left-[2px] top-[2px] h-[5px] w-[5px] rounded-full bg-gradient-to-br from-yellow-100 to-amber-300" />
      <span className="absolute left-[9px] top-0 h-[5px] w-[5px] rounded-full bg-gradient-to-br from-yellow-100 to-amber-300" />
      <span className="absolute right-[2px] top-[2px] h-[5px] w-[5px] rounded-full bg-gradient-to-br from-yellow-100 to-amber-300" />
      <span className="absolute left-[15px] top-[7px] h-[4px] w-[4px] rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 opacity-90" />
    </span>
  );
}

function GoldSparkles({
  sparkleOneClassName,
  sparkleTwoClassName,
}: {
  sparkleOneClassName: string;
  sparkleTwoClassName: string;
}) {
  return (
    <>
      <span
        className={`pointer-events-none absolute text-[10px] text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.75)] ${sparkleOneClassName}`}
        aria-hidden="true"
      >
        ✦
      </span>

      <span
        className={`pointer-events-none absolute text-[9px] text-amber-300 drop-shadow-[0_0_5px_rgba(250,204,21,0.65)] ${sparkleTwoClassName}`}
        aria-hidden="true"
      >
        ✧
      </span>
    </>
  );
}

export function AkariNekoWordmark({
  size = "md",
  subtitle,
  className = "",
}: AkariNekoWordmarkProps) {
  const currentSize = wordmarkSizeClasses[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="relative inline-block w-fit pr-5">
        <span
          className={`${currentSize.text} inline-block font-extrabold tracking-tight`}
        >
          <span className="bg-gradient-to-r from-pink-500 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">
            AkariNek
          </span>

          <span className="bg-gradient-to-tr from-violet-500 via-pink-400 via-45% to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(250,204,21,0.18)]">
            o
          </span>
        </span>

        <span
          className={`absolute ${currentSize.pawWrapper}`}
          aria-hidden="true"
        >
          <GoldenPawAccent />
        </span>

        <GoldSparkles
          sparkleOneClassName={currentSize.sparkleOne}
          sparkleTwoClassName={currentSize.sparkleTwo}
        />
      </div>

      {subtitle ? (
        <p
          className={`${currentSize.subtitle} mt-1 font-medium tracking-wide text-slate-600`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
