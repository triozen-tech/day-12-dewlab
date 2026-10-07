"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { brand, footer } from "../content";
import DewBeads from "./DewBeads";
import DewMagnetic from "./DewMagnetic";

/** FO01 restyled + M322 (fill-up text): pitch + three link columns, then the giant DEWLAB. As the footer arrives the drop
 *  falls into the outlined wordmark and apricot liquid rises inside the letters to ~80 %, then keeps breathing; the drop
 *  settles as the full stop (traveller). Plays on the clock once on screen (lesson 77), starts on enter and never stops
 *  at the page end (lesson 89). Static/final: filled to ~85 %, the drop in place as the full stop. */
export default function FooterDew() {
  const word = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = word.current!;
    const st = { fill: 0 };
    el.style.setProperty("--fill", "0");
    const trig = ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () =>
        gsap.to(st, {
          fill: 80,
          duration: 1.8,
          ease: "power1.inOut",
          onUpdate: () => el.style.setProperty("--fill", st.fill.toFixed(2)),
          onComplete: () => el.classList.add("dw-breathing"),
        }),
    });
    return () => trig.kill();
  }, []);

  return (
    <footer className="pane pane-sea pane-clip mb-[var(--pane-gap)] mt-[var(--pane-gap)] px-[72px] pt-[96px]" data-section="footer" data-record-time="2.2" data-record-hold="1.2" data-record-align="bottom" data-record-offset="16" data-record-label="Footer">
      <span className="dw-glide-light" aria-hidden="true" />
      <DewBeads beads={[[13, 12], [44, 9], [69, 15], [90, 10]]} />
      <div className="grid grid-cols-[1fr_auto] gap-20">
        <div>
          <p className="dw-display text-[88px] text-[var(--ink)]">{footer.pitch}</p>
          <div className="mt-10">
            <DewMagnetic>
              <a href="#shop" className="dw-btn">
                Shop the serum
                <span className="dw-btn-dot" aria-hidden="true" />
              </a>
            </DewMagnetic>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-16 pt-4">
          {footer.columns.map((c) => (
            <div key={c.title}>
              <p className="dw-label">{c.title}</p>
              <ul className="mt-5 space-y-3 text-[17px] font-[500] text-[var(--ink)]">
                {c.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 flex items-center justify-between border-t border-[rgba(15,42,46,0.14)] pt-6 text-[15px] text-[var(--muted-ink)]">
        <p>{footer.note}</p>
        <p className="flex gap-6 font-[600] text-[var(--ink)]">
          {footer.socials.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </p>
      </div>

      {/* giant wordmark, shown whole on a clear baseline; the liquid level is a CSS variable (0–100, M322 in Round 3).
          The full stop is the drop: an inline bead whose bottom edge sits exactly on the text baseline. */}
      <div className="mt-14 pb-16 text-center" aria-label={`${brand.wordmark}.`}>
        <p
          ref={word}
          className="dw-display inline-block whitespace-nowrap text-[290px] leading-[0.86] tracking-[-0.04em] text-transparent [-webkit-text-stroke:2px_var(--apricot)]"
          style={{ ["--fill" as string]: 85, backgroundImage: "linear-gradient(0deg, var(--apricot) 0 calc(var(--fill) * 1%), transparent calc(var(--fill) * 1%))", WebkitBackgroundClip: "text", backgroundClip: "text" }}
          data-footer-wordmark
          aria-hidden="true"
        >
          {brand.wordmark}
          <span className="dw-period" data-drop-anchor="footer-period" />
        </p>
      </div>
    </footer>
  );
}
