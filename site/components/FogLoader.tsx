"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { loading } from "@/lib/loading";
import { brand } from "../content";
import { fireFogLifting } from "../lib/stage";

/** I11 · Morning fog clears onto the hero. CSS fog drifts from the first paint (before JS, lesson 11); a small canvas
 *  draws the fog as a noise field whose threshold rises on exit, so the thin patches clear first and the hero shows
 *  through. The wordmark + real load % sit in the fog. Fires "fog lifting" as the clear STARTS (lesson 80). */
const W = 160;
const H = 100;

function noiseField(seed: number) {
  // smooth value noise, 3 octaves, on a W×H grid (tiny: the canvas is scaled up by CSS, which keeps it soft)
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const octave = (cells: number) => {
    const g = Array.from({ length: (cells + 2) * (cells + 2) }, rnd);
    return (x: number, y: number) => {
      const gx = (x / W) * cells, gy = (y / H) * cells;
      const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const at = (i: number, j: number) => g[(j % (cells + 2)) * (cells + 2) + (i % (cells + 2))];
      return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
    };
  };
  const o = [octave(3), octave(7), octave(15)];
  const f = new Float32Array(W * 2 * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W * 2; x++) f[y * W * 2 + x] = 0.55 * o[0](x, y) + 0.3 * o[1](x, y) + 0.15 * o[2](x, y);
  return f; // twice as wide, so it can drift sideways
}

export default function FogLoader() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const word = useRef<HTMLParagraphElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setGone(true);
      fireFogLifting();
      return;
    }
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    c.width = W;
    c.height = H;
    const img = ctx.createImageData(W, H);
    const fa = noiseField(7);
    const fb = noiseField(31);
    const state = { th: -0.25, t: 0 };
    let raf = 0;
    const draw = (now: number) => {
      state.t = now / 1000;
      const ox = Math.floor((state.t * 6) % W); // the two fog layers drift opposite ways
      const ox2 = Math.floor(W - ((state.t * 4) % W));
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const n = 0.6 * fa[y * W * 2 + x + ox] + 0.4 * fb[y * W * 2 + x + ox2];
          const e = 0.16;
          const a = Math.min(1, Math.max(0, (n - state.th + e) / (2 * e))); // thin patches (low n) clear first
          const i = (y * W + x) * 4;
          img.data[i] = 242;
          img.data[i + 1] = 246;
          img.data[i + 2] = 244;
          img.data[i + 3] = a * 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    let shown = 0;
    let exiting = false;
    let unsub: () => void = () => {};
    let hard: ReturnType<typeof setTimeout> | undefined;
    const minAt = performance.now() + 1700;
    const exit = () => {
      if (exiting) return;
      exiting = true;
      unsub();
      clearTimeout(hard);
      const wait = Math.max(0, minAt - performance.now()) / 1000;
      gsap
        .timeline({ delay: wait })
        .add(() => {
          // lesson 45: the CSS entrance animation (fill: both) would beat GSAP's inline styles, so hand over first
          const w = word.current;
          if (w) {
            const cs = getComputedStyle(w);
            gsap.set(w, { opacity: cs.opacity, filter: cs.filter === "none" ? "blur(0px)" : cs.filter });
            w.style.animation = "none";
          }
          fireFogLifting();
        })
        .to([word.current, pct.current], { opacity: 0, filter: "blur(8px)", y: -10, duration: 0.35, ease: "power2.in" }, 0)
        .to(root.current, { backgroundColor: "rgba(242,246,244,0)", duration: 0.6, ease: "none" }, 0)
        .to(root.current!.querySelectorAll(".dw-fog-css, .dw-fog-band"), { opacity: 0, duration: 1.0, ease: "power1.out" }, 0.1)
        .to(state, { th: 1.25, duration: 1.2, ease: "power1.out" }, 0)
        .add(() => {
          cancelAnimationFrame(raf);
          setGone(true);
        });
    };
    // subscribe one frame later, so the hero film has registered its loading task first
    const sub = requestAnimationFrame(() => {
      unsub = loading.subscribe((p, done) => {
        shown = Math.max(shown, p);
        if (pct.current) pct.current.textContent = `${Math.round(shown * 100)}%`;
        if (done) exit();
      });
    });
    hard = setTimeout(exit, 6500);
    return () => {
      cancelAnimationFrame(sub);
      unsub();
      clearTimeout(hard);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (gone) return null;
  return (
    <div ref={root} data-loader className="dw-fog fixed inset-0 z-[100] overflow-hidden bg-[var(--mist)]" aria-hidden="true">
      <div className="dw-fog-css" />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div className="dw-fog-band" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p ref={word} className="dw-display dw-fog-word text-[clamp(96px,11vw,168px)] leading-none tracking-[-0.03em] text-[var(--ink)]">
            {brand.name}
          </p>
          <span ref={pct} className="dw-num mt-6 block text-[15px] font-[600] tracking-[0.2em] text-[var(--muted-ink)]">
            0%
          </span>
        </div>
      </div>
    </div>
  );
}
