"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { ritual } from "../content";

/** PD05 restyled + M151 (sticky copy + colour + card swap). The pane pins for ~2 screens over the morning → dusk light
 *  on the bottle (A5 → A6, a code transition: the sunlight, bottle shadow and caustics fade first through a sun-free
 *  frame, then the dusk blue rises, a warm glow stays on the serum). The big step word swaps whole per segment
 *  (lesson 85: the old word lifts out, THEN the new one wipes in), the bar fills segment by segment behind the drop,
 *  and the copy turns from ink to dusk-white with the light. ?static=1: dusk, the whole bar filled, the last step. */

const SUNFREE = "/images/dewlab/ritual-sunfree.webp";
const ss = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default function Ritual() {
  const section = useRef<HTMLElement>(null);
  const sunfree = useRef<HTMLImageElement>(null);
  const dusk = useRef<HTMLImageElement>(null);
  const glow = useRef<HTMLSpanElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLParagraphElement>(null);
  const word = useRef<HTMLParagraphElement>(null);
  const note = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const fills = section.current!.querySelectorAll<HTMLElement>("[data-ritual-fill]");
    const ink = gsap.utils.interpolate("#0f2a2e", "#e7efec");
    const warm = gsap.utils.interpolate("#c4561f", "#f6b48a"); // deeper apricot on the light morning wall (contrast)
    let shown = -1;
    let swap: gsap.core.Timeline | undefined;

    const showStep = (i: number) => {
      if (i === shown) return;
      shown = i;
      const s = ritual.steps[i];
      swap?.kill();
      swap = gsap
        .timeline()
        .to(word.current, { yPercent: -18, opacity: 0, duration: 0.12, ease: "power2.in" })
        .add(() => {
          word.current!.textContent = s.word;
          note.current!.textContent = s.note;
          time.current!.textContent = `${s.time} · step ${i + 1} of ${ritual.steps.length}`;
        })
        .fromTo(word.current, { yPercent: 0, opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.2, ease: "power2.out" });
    };

    const update = (p: number) => {
      const a = ss(0.0, 0.5, p); // 1) sunlight, shadow and caustics fade off the wall first
      const b = ss(0.32, 1.0, p); // 2) the dusk blue rises after (overlapping: never a flat pause)
      sunfree.current!.style.opacity = String(a);
      dusk.current!.style.opacity = String(b);
      glow.current!.style.opacity = String(0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, p * 1.1)) ** 0.8 * (1 - b * 0.4) + b * 0.25);
      const c = ss(0.45, 0.75, p);
      copy.current!.style.color = ink(c);
      word.current!.style.color = warm(c);
      shade.current!.style.opacity = String(c);
      fills.forEach((f, i) => {
        const k = Math.min(1, Math.max(0, p * 6 - i));
        f.style.transform = `scaleX(${k})`;
      });
      showStep(Math.min(5, Math.floor(p * 6)));
    };

    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => update(s.progress),
    });
    update(0);
    return () => {
      st.kill();
      swap?.kill();
    };
  }, []);

  const last = ritual.steps[ritual.steps.length - 1];
  return (
    <section ref={section} id="ritual" className="pane pane-clip relative h-[220vh] bg-[var(--dusk)]" data-section="ritual" data-record-time="1.8" data-record-label="Ritual">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-screen" data-record-time="4.6" data-record-label="Ritual end" />
      <div className="sticky top-0 h-screen overflow-hidden" data-ritual-stage>
        {/* the morning → dusk light: morning underneath, the sun-free frame and dusk fade over it (pixel-aligned) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ritual.morning} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={sunfree} src={SUNFREE} alt="" className="ritual-layer absolute inset-0 h-full w-full object-cover" data-ritual-sunfree draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={dusk} src={ritual.dusk} alt="Dew Drop Serum on a glass ledge, morning to dusk" className="ritual-layer absolute inset-0 h-full w-full object-cover" data-ritual-dusk draggable={false} />
        {/* the warm glow that stays on the serum (screen: light is only added, lesson 72) */}
        <span ref={glow} className="ritual-glow pointer-events-none absolute left-[68.5%] top-[57%] h-[30%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] mix-blend-screen" aria-hidden="true" />
        <div ref={shade} className="ritual-shade absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,rgba(22,38,59,0.55),rgba(22,38,59,0))]" aria-hidden="true" />

        <div ref={copy} className="ritual-copy relative z-10 flex h-full flex-col justify-between px-16 pb-14 pt-[120px]">
          <div>
            <h2 className="dw-display text-[68px]">
              {ritual.title.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <div className="mt-12" data-ritual-step>
              <p ref={time} className="dw-label !text-current opacity-75">
                {last.time} · step 6 of 6
              </p>
              <p ref={word} className="dw-display mt-3 text-[112px] leading-none text-[var(--apricot)] [text-shadow:0_1px_0_rgba(15,42,46,0.08)]">
                {last.word}
              </p>
              <p ref={note} className="mt-4 text-[20px] opacity-85">
                {last.note}
              </p>
            </div>
          </div>

          {/* the phase bar: 6 segments, AM | PM; the drop rides its leading edge */}
          <div className="relative" data-ritual-bar>
            <span data-drop-anchor="ritual-bar" className="absolute left-0 top-[22px] h-0 w-0" />
            <div className="flex gap-2">
              {ritual.steps.map((s, i) => (
                <div key={i} className={`flex-1 ${i === 3 ? "ml-6" : ""}`}>
                  <p className="mb-3 text-[13px] font-[700] uppercase tracking-[0.16em] opacity-70">{i === 0 || i === 3 ? s.time : " "}</p>
                  <div className="relative h-[14px] overflow-hidden rounded-full bg-[rgba(140,160,165,0.22)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <i className="absolute inset-0 origin-left rounded-full bg-[linear-gradient(90deg,#f6b48a,var(--apricot))]" data-ritual-fill={i} />
                  </div>
                  <p className="mt-4 text-[20px] font-[600]">{s.word}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
