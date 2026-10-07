"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { brand, nav } from "../content";

/** NV04 + M471 (nav detaches into a floating pill): over the hero it is a full, transparent header; as the hero scrolls
 *  away it lifts and shrinks into the centred frosted capsule (one scroll value, --cap 0 → 1, drives width, glass, shadow
 *  and the progress line). The Bag is where the drop delivers (F8). ?static=1: a plain switch, no in-between. */
export default function DewNav() {
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const hero = document.querySelector<HTMLElement>('[data-section="hero"]');
    const still = prefersReducedMotion();
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = hero ? hero.offsetHeight : 800;
      const raw = (window.scrollY - h * 0.22) / (h * 0.4);
      const k = Math.min(1, Math.max(0, raw));
      const cap = still ? (k >= 0.5 ? 1 : 0) : k * k * (3 - 2 * k); // smoothstep: calm start and landing
      el.style.setProperty("--cap", cap.toFixed(4));
      el.toggleAttribute("data-capsule", cap > 0.5);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.setProperty("--nav-p", String(max > 0 ? window.scrollY / max : 0));
    };
    const queue = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  return (
    <header className="dw-nav">
      <nav ref={bar} className="dw-nav-bar" data-nav-bar aria-label="Main">
        <a href="#top" className="dw-display text-[30px] leading-none tracking-[-0.03em] text-[var(--ink)]">
          {brand.name}
        </a>
        <ul className="flex items-center gap-10 text-[16px] font-[600] text-[var(--ink)]">
          {nav.links.map((l) => (
            <li key={l.label}>
              <a href={l.href} className="dw-navlink opacity-80 transition-opacity hover:opacity-100">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button type="button" className="dw-bag" data-bag aria-label="Bag, 0 items">
          {nav.bag}
          <span className="dw-bag-count dw-num" data-bag-count>
            0
          </span>
        </button>
        <span className="dw-nav-progress" aria-hidden="true">
          <i />
        </span>
      </nav>
    </header>
  );
}
