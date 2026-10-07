"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { createShader, loadImage, type GLHandle } from "@/lib/gl";
import { compare } from "../content";
import DewBeads from "./DewBeads";
import Drop from "./Drop";
import DewMagnetic from "./DewMagnetic";

/** CP04 restyled + M502 (compare slider intro sweep). On entry the divider sweeps 0 → 100 → 50 % by itself with the drop
 *  as its handle; the Day 28 side is the code dew transition (lesson 91): skin-after soaks in over skin-before through a
 *  soft organic noise front from the upper left, with a light lift on the moving front, its progress tied to the sweep.
 *  At rest a slow highlight drift keeps the dewy side alive. Markers tick as the handle passes. Drag takes over.
 *  The CSS clip version underneath is the fallback and the ?static=1 final state (divider at 50 %, all ticked). */

const FRAG = /* glsl */ `
uniform float uSplit;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p * 3.0) + 0.3 * vnoise(p * 7.0) + 0.2 * vnoise(p * 17.0); }
void main() {
  vec2 uv = vUv;
  vec4 before = texture2D(uTex0, cover(uv, uTexRes0));
  vec4 after = texture2D(uTex1, cover(uv, uTexRes1));
  // the soak: an organic front led from the upper left (uv y is up), progress = uProgress
  float lead = length(vec2(uv.x, 1.0 - uv.y) * vec2(1.0, 0.75)) / 1.25;
  float field = 0.62 * lead + 0.38 * fbm(uv * vec2(1.6, 1.0));
  float E = 0.16;
  float t = uProgress * (1.0 + E) - E * 0.5;
  float m = 1.0 - smoothstep(t - E * 0.5, t + E * 0.5, field);
  float front = exp(-pow((field - t) / (E * 0.45), 2.0)) * step(0.02, uProgress) * step(uProgress, 0.98);
  // the soak may only brighten: where the Day 28 photo is darker than Day 1 (its shadowed corner), lift it to at least
  // Day 1's brightness, so the mask never paints dark blotches (only glow, sheen and beads are added)
  float lb = dot(before.rgb, vec3(0.2126, 0.7152, 0.0722));
  float la = dot(after.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 aft = min(after.rgb * max(1.0, lb / max(la, 0.02)), vec3(1.0));
  vec3 col = mix(before.rgb, aft, m);
  // a light lift on the moving front, and a slow glisten drifting over the dewy skin (never frozen at rest)
  float glint = 0.5 + 0.5 * sin((uv.x * 1.6 - uv.y) * 6.0 - uTime * 0.7);
  // a broad glisten band crosses the dewy skin every ~2.6 s, so the resting slider is never still (lessons 55, 70)
  // repeating bands (one every 0.8 of the diagonal), so there is always one on the dewy half
  float bx = fract((uv.x * 0.9 + (1.0 - uv.y) * 0.45) * 1.25 - uTime * 0.4) - 0.5;
  float band = exp(-bx * bx / 0.02);
  float lift = 0.09 * front + 0.035 * m * glint * glint + 0.24 * m * band;
  col = 1.0 - (1.0 - col) * (1.0 - lift);
  // left of the divider stays Day 1
  col = uv.x < uSplit ? before.rgb : col;
  gl_FragColor = vec4(col, 1.0);
}`;

export default function BeforeAfter() {
  const slider = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const markers = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const box = slider.current!;
    const state = { split: 0.5, soak: 1 };
    let gl: GLHandle | null = null;
    let alive = true;
    const apply = () => {
      box.style.setProperty("--split", `${state.split * 100}%`);
      // the CSS fallback mirrors the shader: Day 28 only shows as far as it has soaked in
      const img = box.querySelector<HTMLElement>("[data-compare-after]");
      if (img) img.style.opacity = String(state.soak);
      if (gl) {
        gl.uniforms.uSplit.value = state.split;
        gl.uniforms.uProgress.value = state.soak;
      }
      markers.current?.querySelectorAll("li").forEach((li, i) => li.toggleAttribute("data-on", state.soak > 0.18 + i * 0.2));
    };

    // start from Day 1 everywhere: the handle at the left edge, nothing soaked yet
    state.split = 0;
    state.soak = 0;
    apply();

    (async () => {
      const [b, a] = await Promise.all([loadImage(compare.before), loadImage(compare.after)]);
      if (!alive || !b || !a) return;
      gl = await createShader(canvas.current!, FRAG, { textures: [b, a], uniforms: { uSplit: { value: 0 } }, dpr: 1.5 });
      if (gl) box.setAttribute("data-gl", "on");
      apply();
    })();

    // M502: the sweep plays by itself as the section arrives (a scroll trigger, so it starts during the arrival, lesson 75)
    let tl: gsap.core.Timeline | undefined;
    let idle: gsap.core.Tween | undefined;
    const st = ScrollTrigger.create({
      trigger: box,
      start: "top bottom",
      once: true,
      onEnter: () => {
        tl = gsap
          .timeline({ onUpdate: apply })
          .to(state, { split: 0.82, soak: 1, duration: 1.5, ease: "sine.out" }) // sine on both sides of the turn: a quick turn, no dwell
          // the return flows straight into a small resting drift (no stop at the handover; the drift stays smaller
          // than the sweep, lesson 39), so the slider is never still
          .to(state, { split: 0.5, duration: 0.8, ease: "sine.in" })
          .to(state, { split: 0.43, duration: 0.6, ease: "sine.out" })
          .add(() => {
            idle = gsap.fromTo(state, { split: 0.43 }, { split: 0.57, duration: 1.5, ease: "sine.inOut", yoyo: true, repeat: -1, onUpdate: apply });
          });
      },
    });

    // drag takes over (normal mode)
    let dragging = false;
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const r = box.getBoundingClientRect();
      tl?.kill();
      idle?.kill();
      state.soak = 1;
      state.split = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      apply();
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      box.setPointerCapture(e.pointerId);
      move(e);
    };
    const up = () => (dragging = false);
    box.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", up);

    return () => {
      alive = false;
      st.kill();
      tl?.kill();
      idle?.kill();
      gl?.destroy();
      box.removeEventListener("pointerdown", down);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <section className="pane px-[72px] pb-[80px] pt-[96px]" data-section="compare" data-record-time="1.8" data-record-hold="2.0" data-record-offset="-24" data-record-label="Before / after">
      <span className="dw-glide-light dw-glide-sea" aria-hidden="true" />
      <DewBeads beads={[[16, 12], [47, 8], [74, 15]]} />
      <div className="flex items-end justify-between gap-16">
        <h2 className="dw-display text-[68px] text-[var(--ink)]">
          {compare.title.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h2>
        <p className="dw-body max-w-[400px] pb-2">{compare.copy}</p>
      </div>

      <div className="mt-14 grid grid-cols-[1fr_330px] gap-10">
        {/* slider */}
        <div
          ref={slider}
          className="compare relative aspect-[16/9] cursor-ew-resize touch-none select-none overflow-hidden rounded-[28px] shadow-[0_40px_80px_-46px_rgba(15,42,46,0.5)]"
          data-compare
          data-cursor="Drag"
          style={{ ["--split" as string]: "50%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={compare.before} alt="Skin on day 1: dry and dull" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={compare.after}
            alt="The same skin on day 28: hydrated and dewy"
            className="compare-after absolute inset-0 h-full w-full object-cover [clip-path:inset(0_0_0_var(--split))]"
            data-compare-after
            draggable={false}
          />
          <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden="true" />
          <span className="absolute left-5 top-5 z-10 rounded-full bg-[rgba(15,42,46,0.55)] px-4 py-2 text-[15px] font-[650] text-white backdrop-blur-sm">{compare.labels.before}</span>
          <span className="absolute right-5 top-5 z-10 rounded-full bg-[rgba(255,255,255,0.75)] px-4 py-2 text-[15px] font-[650] text-[var(--ink)] backdrop-blur-sm">{compare.labels.after}</span>
          {/* divider + the drop as the handle */}
          <div className="absolute inset-y-0 left-[var(--split)] z-10 w-0" data-compare-divider>
            <span className="absolute inset-y-0 -left-px w-[2px] bg-[rgba(255,255,255,0.9)] shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
            <span data-drop-anchor="compare-handle" className="absolute left-0 top-1/2 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(255,255,255,0.35)] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.85),0_12px_30px_-10px_rgba(15,42,46,0.45)] backdrop-blur-[2px]">
              <span className="block" data-handle-drop>
                <Drop shape="bead" size={40} id="handle" />
              </span>
            </span>
          </div>
        </div>

        {/* sidebar: four round markers that tick as the handle passes */}
        <div className="flex flex-col justify-between">
          <ul ref={markers} className="compare-markers space-y-7">
            {compare.markers.map((m) => (
              <li key={m.name} className="flex items-start gap-4" data-on="" data-compare-marker>
                <span className="compare-tick mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path d="M4 9.5 L7.5 13 L14 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <p className="dw-display text-[26px] text-[var(--ink)]">{m.name}</p>
                  <p className="mt-1 text-[16px] text-[var(--muted-ink)]">{m.note}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-[24px] bg-[rgba(215,234,229,0.55)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
            <p className="text-[15px] font-[600] text-[var(--muted-ink)]">{compare.buy.name}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="dw-num text-[40px] font-[650] tracking-[-0.02em] text-[var(--ink)]">{compare.buy.price}</span>
              <DewMagnetic>
                <button type="button" className="dw-btn !h-12 !px-6">
                  {compare.buy.cta}
                </button>
              </DewMagnetic>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
