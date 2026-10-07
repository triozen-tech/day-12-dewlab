"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { results } from "../content";
import DewBeads from "./DewBeads";

/** ST09 restyled + M156 (liquid level rises, velocity slosh): four round glass gauges fill with apricot liquid as you
 *  scroll; the wavy surface flows sideways on the clock and tilts against the scroll speed on a spring, settling when the
 *  page stops; each number counts with its level. The drop falls into gauge 2 and becomes its liquid (traveller).
 *  ?static=1: every gauge at its value. */
function Wave() {
  return (
    <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 7 Q 12.5 0 25 7 T 50 7 T 75 7 T 100 7 T 125 7 T 150 7 T 175 7 T 200 7 V 14 H 0 Z" fill="rgba(246,180,138,0.92)" />
    </svg>
  );
}

export default function Results() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const sec = section.current!;
    const gauges = Array.from(sec.querySelectorAll<HTMLElement>("[data-gauge]"));
    const nums = Array.from(sec.querySelectorAll<HTMLElement>("[data-gauge-num]"));
    const tilt = { a: 0, v: 0 };
    const state = { p: 0 };
    const draw = () => {
      gauges.forEach((g, i) => {
        const s = results.stats[i];
        const k = Math.min(1, Math.max(0, state.p * 1.25 - i * 0.08)); // a slight stagger across the row
        g.style.setProperty("--level", String(Math.min(s.value, 100) * 0.88 * k));
        nums[i].textContent = String(Math.round(s.value * k));
      });
    };
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 85%",
      end: "top 20%",
      scrub: true,
      onUpdate: (self) => {
        state.p = self.progress;
        draw();
      },
    });
    // slosh: the surface leans against the scroll speed on a damped spring and settles when the page stops
    const tick = () => {
      const vel = Math.max(-1, Math.min(1, st.getVelocity() / 2500));
      const target = -vel * 9;
      tilt.v += (target - tilt.a) * 0.08;
      tilt.v *= 0.86;
      tilt.a += tilt.v;
      sec.style.setProperty("--slosh", `${tilt.a.toFixed(2)}deg`);
    };
    gsap.ticker.add(tick);
    draw();
    return () => {
      st.kill();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <section
      ref={section}
      id="results"
      className="pane pane-sea relative z-10 px-[72px] pb-[88px] pt-[100px]"
      data-section="results"
      data-record-time="2.0"
      data-record-offset="-24"
      data-record-label="Results"
    >
      {/* X90 · a still frosted band at the seam: the slider's pane scrolls under it, softened, then clears */}
      <span className="dw-frost-band" aria-hidden="true" />
      <DewBeads beads={[[9, 13], [33, 9], [61, 12], [86, 16]]} />
      <div className="flex items-end justify-between gap-16">
        <h2 className="dw-display text-[76px] text-[var(--ink)]">{results.title}</h2>
        <p className="dw-body max-w-[380px] pb-3">{results.copy}</p>
      </div>

      <ul className="mt-16 grid grid-cols-4 gap-10">
        {results.stats.map((s, i) => (
          <li key={s.label} className="flex flex-col items-center text-center">
            <div className="relative">
              {i === 1 && <span data-drop-anchor="gauge" className="absolute left-1/2 top-0 h-0 w-0" />}
              <div className="gauge aspect-square w-[236px] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.9),0_30px_60px_-34px_rgba(15,42,46,0.45)]" data-gauge={i} style={{ ["--level" as string]: Math.min(s.value, 100) * 0.88 }}>
                <div className="gauge-liquid">
                  <Wave />
                </div>
                <span className="bead-shine" aria-hidden="true" />
                <span className="absolute inset-0 z-10 grid place-items-center">
                  <span className="dw-num text-[56px] font-[650] leading-none tracking-[-0.03em] text-[var(--ink)]">
                    {s.prefix}
                    <span data-gauge-num>{s.value}</span>
                    <span className="text-[34px]">{s.suffix}</span>
                  </span>
                </span>
              </div>
            </div>
            <p className="dw-display mt-7 text-[28px] text-[var(--ink)]">{s.label}</p>
            <p className="mt-1 text-[16px] text-[var(--muted-ink)]">{s.note}</p>
          </li>
        ))}
      </ul>

      <div className="mt-14 flex items-center justify-between border-t border-[rgba(15,42,46,0.12)] pt-6">
        <p className="text-[14px] text-[var(--muted-ink)]">{results.footnote}</p>
        <a href="#shop" className="dw-link text-[16px]">
          {results.cta}
        </a>
      </div>
    </section>
  );
}
