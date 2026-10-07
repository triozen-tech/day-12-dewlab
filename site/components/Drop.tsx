import type { CSSProperties } from "react";

/** The Dewlab drop, drawn in code (never a photo, so it can change shape as it travels).
 *  shape: "hang" teardrop on a tip · "bead" round bead · "dot" small full stop. Same apricot glass look in all. */
export type DropShape = "hang" | "bead" | "dot";

const PATHS: Record<DropShape, string> = {
  hang: "M20 2 C 20 2 5 23 5 35 A 15 15 0 0 0 35 35 C 35 23 20 2 20 2 Z",
  bead: "M20 9 A 15 15 0 1 1 19.99 9 Z",
  dot: "M20 14 A 11 11 0 1 1 19.99 14 Z",
};

export default function Drop({ shape = "hang", size = 40, className = "", style, id = "dw" }: { shape?: DropShape; size?: number; className?: string; style?: CSSProperties; id?: string }) {
  const g = `${id}-${shape}`;
  return (
    <svg className={`dw-drop ${className}`} style={style} width={size} height={size * 1.3} viewBox="0 0 40 52" aria-hidden="true">
      <defs>
        <linearGradient id={`${g}-body`} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#f8c49c" />
          <stop offset="0.45" stopColor="#ee7a3b" />
          <stop offset="1" stopColor="#c9551f" />
        </linearGradient>
        <radialGradient id={`${g}-glow`} cx="0.5" cy="0.72" r="0.5">
          <stop offset="0" stopColor="#ffd9b8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd9b8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={PATHS[shape]} fill={`url(#${g}-body)`} />
      <path d={PATHS[shape]} fill={`url(#${g}-glow)`} />
      {/* specular highlight + rim light */}
      <ellipse cx="14" cy={shape === "hang" ? 30 : shape === "bead" ? 19 : 21} rx="4.2" ry="6.2" fill="#fff" opacity="0.85" transform={`rotate(-20 14 ${shape === "hang" ? 30 : 20})`} />
      <path d="M27 42 A 12 12 0 0 1 31 34" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}
