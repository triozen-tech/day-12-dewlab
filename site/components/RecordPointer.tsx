"use client";

import { useEffect, useRef } from "react";
import { gsap, isRecording, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { onFogLifting } from "../lib/stage";

/** ?record=1 only (lesson 75): a soft touch ring visits the main buttons and plays their hover by itself, so the details
 *  show on camera without a mouse: the hero CTA (as the words land), the reviews Shop button, the footer CTA. The ring
 *  reads its target LIVE every frame (lesson 83): the page keeps scrolling under it. The shop has its own script. */
type Visit = { sel: string; when: (go: () => void) => () => void };

export default function RecordPointer() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRecording() || prefersReducedMotion()) return;
    const r = ring.current!;
    const pos = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.85 };
    let target: HTMLElement | null = null;
    const place = () => gsap.set(r, { x: pos.x - 22, y: pos.y - 22 });
    const centre = (el: Element) => {
      const b = el.getBoundingClientRect();
      return [b.left + b.width / 2, b.top + b.height / 2] as const;
    };
    // stay on the moving target between moves
    const ticker = () => {
      if (!target || gsap.isTweening(pos)) return;
      [pos.x, pos.y] = centre(target);
      place();
    };
    gsap.ticker.add(ticker);

    const visit = (sel: string) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return;
      const mag = el.closest<HTMLElement>("[data-magnetic]");
      const start = { x: pos.x, y: pos.y };
      const k = { t: 0 };
      gsap
        .timeline()
        .to(r, { opacity: 1, duration: 0.25 })
        .to(k, {
          t: 1,
          duration: 0.6,
          ease: "power2.inOut",
          onUpdate: () => {
            const [tx, ty] = centre(el);
            pos.x = start.x + (tx - start.x) * k.t;
            pos.y = start.y + (ty - start.y) * k.t;
            place();
          },
          onComplete: () => void (target = el),
        }, 0)
        .add(() => {
          el.classList.add("is-demo");
          mag?.dispatchEvent(new CustomEvent("dew:nudge", { detail: { dx: 10, dy: 4 } }));
        })
        .to(r, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 })
        .add(() => {
          el.classList.remove("is-demo");
          mag?.dispatchEvent(new CustomEvent("dew:nudge", { detail: { dx: 0, dy: 0 } }));
        }, "+=1.0")
        .to(r, { opacity: 0, duration: 0.35, onComplete: () => void (target = null) });
    };

    const visits: Visit[] = [
      { sel: '[data-section="hero"] .dw-btn', when: (go) => onFogLifting(() => gsap.delayedCall(1.5, go)) },
      {
        sel: '[data-section="reviews"] .dw-btn',
        when: (go) => {
          const st = ScrollTrigger.create({ trigger: '[data-section="reviews"]', start: "top 30%", once: true, onEnter: go });
          return () => st.kill();
        },
      },
      {
        sel: '[data-section="footer"] .dw-btn',
        when: (go) => {
          const st = ScrollTrigger.create({ trigger: '[data-section="footer"]', start: "top 55%", once: true, onEnter: go });
          return () => st.kill();
        },
      },
    ];
    const offs = visits.map((v) => v.when(() => visit(v.sel)));
    return () => {
      offs.forEach((o) => o());
      gsap.ticker.remove(ticker);
    };
  }, []);

  return <div ref={ring} className="dw-touch pointer-events-none fixed left-0 top-0 z-[61] h-11 w-11 rounded-full opacity-0" aria-hidden="true" />;
}
