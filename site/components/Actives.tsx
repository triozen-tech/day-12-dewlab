"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { actives } from "../content";
import BeadLoop, { type BeadMode } from "./BeadLoop";
import DewBeads from "./DewBeads";

/** ST02 restyled + M325 (fluid ink morph text): four round glass beads, each a window onto its ingredient still with a
 *  seamless code loop (gel flows · crystals glint · oil slides · petals turn). As the drop's four beads land, each name
 *  blooms in like a drop of dye in water: an SVG turbulence displacement settles to crisp while the colour shifts from
 *  apricot to ink, bead by bead; the % rolls in. ?static=1: crisp ink names, full numbers. */
const MODES: BeadMode[] = ["gel", "crystal", "oil", "petal"];

export default function Actives() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const sec = section.current!;
    const names = sec.querySelectorAll<HTMLElement>("[data-active-name]");
    const doses = sec.querySelectorAll<HTMLElement>("[data-active-dose]");
    const ink = gsap.utils.interpolate("#ee7a3b", "#0f2a2e");
    const states = Array.from(names).map(() => ({ k: 0 }));
    const draw = (i: number) => {
      const k = states[i].k;
      const disp = sec.querySelector<SVGFEDisplacementMapElement>(`#dye-${i} feDisplacementMap`);
      const turb = sec.querySelector<SVGFETurbulenceElement>(`#dye-${i} feTurbulence`);
      disp?.setAttribute("scale", String(38 * (1 - k)));
      turb?.setAttribute("baseFrequency", `${0.012 + 0.02 * (1 - k)} ${0.03 + 0.03 * (1 - k)}`);
      names[i].style.color = ink(k);
      names[i].style.opacity = String(Math.min(1, 0.15 + k * 1.6));
      names[i].style.filter = k > 0.995 ? "none" : `url(#dye-${i})`;
      const d = doses[i];
      const target = Number(d.dataset.value);
      d.firstChild!.textContent = String(Math.round(target * Math.min(1, k * 1.15)));
    };
    states.forEach((_, i) => draw(i));
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 55%",
      once: true,
      onEnter: () => states.forEach((s, i) => gsap.to(s, { k: 1, duration: 1.3, delay: i * 0.18, ease: "power2.out", onUpdate: () => draw(i) })),
    });
    return () => st.kill();
  }, []);

  return (
    <section
      ref={section}
      id="actives"
      className="pane pane-solid relative z-10 px-[72px] pb-[96px] pt-[104px]"
      style={{ marginTop: "-40vh" }} /* X1: slides up over the last 40vh of the pinned water */
      data-section="actives"
      data-record-time="2.2"
      data-record-offset="-24"
      data-record-label="Actives"
    >
      <DewBeads beads={[[6, 11], [29, 8], [70, 14], [88, 10]]} />
      {/* one dye filter per name (feTurbulence → feDisplacementMap), driven per frame */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        {actives.items.map((_, i) => (
          <filter key={i} id={`dye-${i}`} x="-10%" y="-40%" width="120%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed={i * 7 + 3} />
            <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </svg>
      <div className="flex items-end justify-between gap-16">
        <h2 className="dw-display text-[76px] text-[var(--ink)]">
          {actives.title.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h2>
        <p className="dw-body max-w-[380px] pb-3">{actives.copy}</p>
      </div>

      <ul className="mt-20 grid grid-cols-4 gap-10">
        {actives.items.map((a, i) => (
          <li key={a.name} className="flex flex-col items-center text-center">
            <div className="relative">
              <span data-drop-anchor={`active-${i}`} className="absolute left-1/2 top-0 h-0 w-0" />
              <div className="bead aspect-square w-[248px] shadow-[0_30px_60px_-30px_rgba(15,42,46,0.4)]" data-active-bead={i} data-cursor={MODES[i] === "gel" ? "Gel" : MODES[i] === "crystal" ? "Crystal" : MODES[i] === "oil" ? "Oil" : "Petal"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={a.name} draggable={false} />
                <BeadLoop src={a.img} mode={MODES[i]} />
                <span className="bead-shine" aria-hidden="true" />
              </div>
            </div>
            <p className="dw-num mt-9 flex items-center gap-3 text-[44px] font-[650] leading-none tracking-[-0.02em] text-[var(--ink)]">
              <span className="h-[14px] w-[14px] rounded-full bg-[var(--apricot)] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.15)]" aria-hidden="true" />
              <span data-active-dose data-value={parseFloat(a.dose)}>
                {parseFloat(a.dose)}
                <span>%</span>
              </span>
            </p>
            <h3 className="dw-display mt-3 text-[28px] text-[var(--ink)]" data-active-name={i}>
              {a.name}
            </h3>
            <p className="mt-3 max-w-[240px] text-[16px] leading-[1.5] text-[var(--muted-ink)]">{a.role}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
