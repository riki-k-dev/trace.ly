"use client";

export default function AnimatedGridBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        <div
          className="absolute h-px w-32 bg-linear-to-r from-transparent to-emerald-500/80 animate-[flow-x_12s_linear_infinite]"
          style={{ top: "calc(24px * 4)" }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.75 h-0.75 bg-emerald-400 rounded-full shadow-[0_0_10px_2px_#34d399]"></div>
        </div>
        <div
          className="absolute h-px w-48 bg-linear-to-l from-transparent to-zinc-400/80 animate-[flow-x-reverse_16s_linear_infinite]"
          style={{ top: "calc(24px * 12)", animationDelay: "-5s" }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-0.75 bg-zinc-300 rounded-full shadow-[0_0_10px_2px_#d4d4d8]"></div>
        </div>
        <div
          className="absolute h-px w-24 bg-linear-to-r from-transparent to-emerald-500/80 animate-[flow-x_10s_linear_infinite]"
          style={{ top: "calc(24px * 22)", animationDelay: "-2s" }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.75 h-0.75 bg-emerald-400 rounded-full shadow-[0_0_10px_2px_#34d399]"></div>
        </div>
        <div
          className="absolute h-px w-32 bg-linear-to-l from-transparent to-emerald-500/60 animate-[flow-x-reverse_20s_linear_infinite]"
          style={{ top: "calc(24px * 32)", animationDelay: "-12s" }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-0.75 bg-emerald-400 rounded-full shadow-[0_0_10px_2px_#34d399]"></div>
        </div>

        <div
          className="absolute w-px h-32 bg-linear-to-b from-transparent to-zinc-400/80 animate-[flow-y_14s_linear_infinite]"
          style={{ left: "calc(24px * 6)" }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.75 h-0.75 bg-zinc-300 rounded-full shadow-[0_0_10px_2px_#d4d4d8]"></div>
        </div>
        <div
          className="absolute w-px h-40 bg-linear-to-t from-transparent to-emerald-500/80 animate-[flow-y-reverse_18s_linear_infinite]"
          style={{ left: "calc(24px * 18)", animationDelay: "-7s" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.75 h-0.75 bg-emerald-400 rounded-full shadow-[0_0_10px_2px_#34d399]"></div>
        </div>
        <div
          className="absolute w-px h-24 bg-linear-to-b from-transparent to-emerald-500/80 animate-[flow-y_11s_linear_infinite]"
          style={{ left: "calc(24px * 32)", animationDelay: "-4s" }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.75 h-0.75 bg-emerald-400 rounded-full shadow-[0_0_10px_2px_#34d399]"></div>
        </div>
        <div
          className="absolute w-px h-32 bg-linear-to-t from-transparent to-emerald-500/50 animate-[flow-y-reverse_15s_linear_infinite]"
          style={{ left: "calc(24px * 50)", animationDelay: "-9s" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.75 h-0.75 bg-emerald-400 rounded-full shadow-[0_0_10px_2px_#34d399]"></div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes flow-x {
          0% { left: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 120%; opacity: 0; }
        }
        @keyframes flow-x-reverse {
          0% { right: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { right: 120%; opacity: 0; }
        }
        @keyframes flow-y {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }
        @keyframes flow-y-reverse {
          0% { bottom: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { bottom: 120%; opacity: 0; }
        }
      `,
        }}
      />
    </>
  );
}
