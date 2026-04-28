type ProgressRingProps = {
  percent: number;
  label?: string;
};

export function ProgressRing({
  percent,
  label = "Hoàn thành",
}: ProgressRingProps) {
  return (
    <div
      className="grid h-34 w-34 place-items-center rounded-full shadow-[0_14px_34px_rgba(236,72,153,0.16)]"
      style={{
        background: `conic-gradient(#f53f86 0 ${percent}%, #f8dce9 ${percent}% 100%)`,
      }}
    >
      <div className="grid h-25 w-25 place-items-center rounded-full bg-white">
        <div className="text-center">
          <p className="text-3xl font-black text-slate-800">{percent}%</p>
          <p className="mt-1 text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
