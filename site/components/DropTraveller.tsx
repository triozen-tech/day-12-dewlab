"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import Drop from "./Drop";

/** F1 · the travelling drop (site/DESIGN.md §4). One fixed layer, driven by the scroll, in legs between named anchors
 *  ([data-drop-anchor]). Positions are read LIVE every frame (lesson 83), so the drop follows pinned and moving anchors
 *  (the ritual bar's filling edge, the sweeping slider handle). Where a section draws its own drop (the pipette tip,
 *  the slider handle, the footer's full stop), the traveller lands on it and dissolves into it (lesson 62), so two
 *  drops never show at once. Calm easing, a small wobble so it is never frozen (record mode), never over text. */

type Sec = { top: number; h: number };
type Geo = { vh: number; max: number; s: Record<string, Sec> };
type Leg = {
  from: string | string[];
  to: string | string[];
  start: (g: Geo) => number;
  end: (g: Geo) => number;
  ease?: (t: number) => number;
  arc?: number; // px of upward bow mid-flight
  size?: [number, number];
  shape?: "hang" | "bead";
  fadeIn?: boolean; // appears out of its source over the first 15 %
  fadeOut?: boolean; // dissolves into its target over the last 15 %
  goneBy?: number; // fully faded out by this fraction of the leg (it never crosses the text beyond)
  formIn?: number; // forms (fades in) over this first fraction of the leg
  rest?: boolean; // after the leg, it rests on its target until the next leg (and glides when the target moves)
  pop?: boolean; // a small 1 → 1.06 → 1 pop as it lands (X18 stamp-pop)
  ride?: (g: Geo, y: number) => number; // optional 0..1 along the target's width (ritual bar)
};

const sine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const fall = (t: number) => t * t;
const pin = (s: Sec, g: Geo, p: number) => s.top + p * (s.h - g.vh); // scroll for a pinned section's progress p
const at = (s: Sec, g: Geo, y: number) => s.top - y * g.vh; // scroll where the section's top sits at y × viewport
const BEADS = ["active-0", "active-1", "active-2", "active-3"];

const LEGS: Leg[] = [
  // 1 · the drop leaves the pipette and falls into the centre of the water (it hides in the rings)
  { from: "hero-tip", to: "ripple-centre", start: (g) => g.s.hero.top + g.s.hero.h * 0.55, end: (g) => pin(g.s.ripple, g, 0.06), ease: fall, size: [22, 26], shape: "hang" },
  // 2 · a rebound drop rises from the centre and splits into four beads that spread and fade over the open water
  //     (before the actives text arrives: drops never cross text)
  { from: "ripple-centre", to: ["split-0", "split-1", "split-2", "split-3"], start: (g) => pin(g.s.ripple, g, 0.7), end: (g) => pin(g.s.ripple, g, 0.86), ease: sine, arc: 70, size: [18, 14], shape: "bead", fadeIn: true, goneBy: 0.85 },
  // 2b · four beads form in the empty gap above their ingredient beads and drop the last few px into them
  { from: ["gap-0", "gap-1", "gap-2", "gap-3"], to: BEADS, start: (g) => at(g.s.actives, g, 0.42), end: (g) => at(g.s.actives, g, 0.12), ease: fall, size: [14, 14], shape: "bead", formIn: 0.3, fadeOut: true },
  // 3 · they rise off the beads and merge sideways inside that same gap as they fade (never up into the copy)
  { from: BEADS, to: BEADS.map(() => "actives-merge"), start: (g) => at(g.s.actives, g, -0.32), end: (g) => pin(g.s.ritual, g, 0), ease: sine, arc: 0, size: [14, 18], shape: "bead", fadeIn: true, goneBy: 0.55 },
  // 4 · the drop forms again at the start of the ritual bar and rides its filling edge, morning to night
  { from: "ritual-bar", to: "ritual-bar", start: (g) => pin(g.s.ritual, g, 0), end: (g) => pin(g.s.ritual, g, 1), size: [20, 20], shape: "bead", formIn: 0.06, ride: (g, y) => Math.min(1, Math.max(0, (y - g.s.ritual.top) / (g.s.ritual.h - g.vh))) },
  // 5 · off the end of the bar, down onto the slider: it becomes the handle
  { from: "ritual-bar-end", to: "compare-handle", start: (g) => pin(g.s.ritual, g, 1), end: (g) => at(g.s.compare, g, 0.1), ease: sine, arc: 40, size: [20, 40], shape: "bead", fadeOut: true },
  // 6 · out of the handle, into the second gauge (it becomes the liquid)
  { from: "compare-handle", to: "gauge", start: (g) => at(g.s.compare, g, -0.42), end: (g) => at(g.s.results, g, 0.18), ease: sine, arc: 50, size: [40, 22], shape: "bead", fadeIn: true, fadeOut: true },
  // 7 · it beads up again and settles beside the sharp review (then follows the focus from quote to quote)
  { from: "gauge", to: "review-focus", start: (g) => at(g.s.results, g, -0.3), end: (g) => at(g.s.reviews, g, 0.22), ease: sine, arc: 70, size: [16, 22], shape: "bead", fadeIn: true, rest: true },
  // 8 · from the review to the shop disc, where it rests by the product
  { from: "review-focus", to: "shop-disc", start: (g) => at(g.s.reviews, g, -0.38), end: (g) => at(g.s.shop, g, 0.08), ease: sine, arc: 60, size: [22, 26], shape: "bead", rest: true, pop: true },
  // 9 · the last fall: into the footer, where it becomes the full stop of DEWLAB.
  { from: "shop-disc", to: "footer-period", start: (g) => at(g.s.shop, g, -0.5), end: (g) => g.max - 2, ease: sine, arc: 30, size: [26, 0], shape: "bead", fadeOut: true },
];

export default function DropTraveller() {
  const layer = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLDivElement>(null);
  const clones = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    document.documentElement.classList.add("dw-traveller");
    const anchor = (name: string) => document.querySelector<HTMLElement>(`[data-drop-anchor="${name}"]`);
    const centre = (name: string): [number, number] | null => {
      if (name === "actives-merge") {
        // in the empty gap above the middle of the four beads, where the four copies meet
        const a = anchor("active-1"), b = anchor("active-2");
        if (!a || !b) return null;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return [(ra.left + rb.left) / 2, Math.min(ra.top, rb.top) - 30];
      }
      if (name.startsWith("gap-")) {
        // 34 px above an ingredient bead: inside the 80 px gap between the intro row and the beads
        const a = anchor(`active-${name.slice(4)}`);
        if (!a) return null;
        const r = a.getBoundingClientRect();
        return [r.left, r.top - 34];
      }
      if (name.startsWith("split-")) {
        // four points spread around the impact, over the open water
        const c = anchor("ripple-centre");
        if (!c) return null;
        const r = c.getBoundingClientRect();
        const i = Number(name.slice(6));
        return [r.left + (i - 1.5) * 150, r.top - 40 - (i % 2) * 30];
      }
      if (name === "ritual-bar-end") {
        const bar = document.querySelector<HTMLElement>("[data-ritual-bar]");
        const a = anchor("ritual-bar");
        if (!bar || !a) return null;
        const rb = bar.getBoundingClientRect(), ra = a.getBoundingClientRect();
        return [rb.right, ra.top];
      }
      const el = anchor(name);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    };
    const geo = (): Geo => {
      const s: Record<string, Sec> = {};
      document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
        const r = el.getBoundingClientRect();
        s[el.dataset.section!] = { top: r.top + window.scrollY, h: r.height };
      });
      return { vh: window.innerHeight, max: document.documentElement.scrollHeight - window.innerHeight, s };
    };
    let g = geo();
    const onResize = () => (g = geo());
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);

    const heroDrop = document.querySelector<HTMLElement>("[data-hero-drop]");
    const handleDrop = document.querySelector<HTMLElement>("[data-handle-drop]");
    const toHandle = LEGS.findIndex((l) => l.to === "compare-handle");
    const period = document.querySelector<HTMLElement>('[data-drop-anchor="footer-period"]');
    const place = (el: HTMLElement, x: number, y: number, size: number, alpha: number, shape: "hang" | "bead", t: number) => {
      const wob = 1 + 0.04 * Math.sin(t * 2.3) + 0.02 * Math.sin(t * 3.7 + 1);
      el.style.opacity = String(alpha);
      el.style.transform = `translate3d(${x - size / 2}px, ${y - size * 0.65}px, 0) scale(${(size / 40) * wob})`;
      el.dataset.shape = shape;
    };

    let raf = 0;
    const restPos = { x: 0, y: 0, on: false };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now / 1000;
      const y = window.scrollY;
      const leg = LEGS.find((l) => y >= l.start(g) && y < l.end(g));
      // the pipette's own drop shows until the fall begins; the full stop shows once the drop has landed in it
      if (heroDrop) heroDrop.style.opacity = y < LEGS[0].start(g) ? "1" : "0";
      // the slider handle's own drop appears only as the traveller lands in it (lesson 62: never two drops at once)
      if (handleDrop) {
        const l = LEGS[toHandle];
        const k = (y - l.start(g)) / (l.end(g) - l.start(g));
        handleDrop.style.opacity = String(Math.min(1, Math.max(0, (k - 0.82) / 0.16)));
      }
      if (period) {
        const last = LEGS[LEGS.length - 1];
        const k = (y - last.start(g)) / (last.end(g) - last.start(g));
        period.style.opacity = String(Math.min(1, Math.max(0, (k - 0.82) / 0.16)));
      }
      const hideAll = () => {
        main.current!.style.opacity = "0";
        clones.current.forEach((c) => c && (c.style.opacity = "0"));
      };
      if (!leg) {
        // between legs: rest on the last target (if that leg rests there), gliding when the anchor moves
        const prev = [...LEGS].reverse().find((l) => y >= l.end(g));
        const target = prev?.rest ? centre(prev.to as string) : null;
        if (!prev || !target) return (restPos.on = false), hideAll();
        if (!restPos.on) ((restPos.x = target[0]), (restPos.y = target[1]), (restPos.on = true));
        restPos.x += (target[0] - restPos.x) * 0.1;
        restPos.y += (target[1] - restPos.y) * 0.1;
        clones.current.forEach((c) => c && (c.style.opacity = "0"));
        const z = (prev.size ?? [22, 22])[1];
        return place(main.current!, restPos.x, restPos.y, z, 1, prev.shape ?? "bead", t);
      }
      restPos.on = false;
      const s0 = leg.start(g), s1 = leg.end(g);
      const raw = Math.min(1, Math.max(0, (y - s0) / Math.max(1, s1 - s0)));
      const k = (leg.ease ?? sine)(raw);
      const [z0, z1] = leg.size ?? [22, 22];
      const size = z0 + (z1 - z0) * k;
      let alpha = 1;
      if (leg.fadeIn) alpha *= Math.min(1, raw / 0.15);
      if (leg.fadeOut) alpha *= Math.min(1, (1 - raw) / 0.15);
      if (leg.goneBy) alpha *= Math.min(1, Math.max(0, (leg.goneBy - raw) / 0.2));
      if (leg.formIn) alpha *= Math.min(1, raw / leg.formIn);
      const shape = leg.shape ?? "bead";
      const from = Array.isArray(leg.from) ? leg.from : [leg.from];
      const to = Array.isArray(leg.to) ? leg.to : [leg.to];
      const n = Math.max(from.length, to.length);
      if (n === 1) {
        clones.current.forEach((c) => c && (c.style.opacity = "0"));
        let a = centre(from[0]), b = centre(to[0]);
        if (!a || !b) return hideAll();
        if (leg.ride) {
          const bar = document.querySelector<HTMLElement>("[data-ritual-bar]")!.getBoundingClientRect();
          const p = leg.ride(g, y);
          a = b = [bar.left + p * bar.width, b[1]];
        }
        const x = a[0] + (b[0] - a[0]) * k;
        const yy = a[1] + (b[1] - a[1]) * k - (leg.arc ?? 0) * Math.sin(Math.PI * raw);
        const pop = leg.pop ? 1 + 0.06 * Math.sin(Math.PI * Math.min(1, Math.max(0, (raw - 0.84) / 0.16))) : 1;
        place(main.current!, x, yy, size * pop, alpha, shape, t);
      } else {
        main.current!.style.opacity = "0";
        for (let i = 0; i < 4; i++) {
          const a = centre(from[Math.min(i, from.length - 1)]), b = centre(to[Math.min(i, to.length - 1)]);
          const el = clones.current[i];
          if (!el || !a || !b) continue;
          const x = a[0] + (b[0] - a[0]) * k;
          const yy = a[1] + (b[1] - a[1]) * k - (leg.arc ?? 0) * Math.sin(Math.PI * raw);
          place(el, x, yy, size, alpha, shape, t + i);
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      document.documentElement.classList.remove("dw-traveller");
    };
  }, []);

  return (
    <div ref={layer} className="pointer-events-none fixed inset-0 z-[45]" aria-hidden="true" data-drop-layer>
      <div ref={main} className="dw-traveller-drop absolute left-0 top-0 h-[52px] w-[40px] origin-[50%_65%] opacity-0 will-change-transform">
        <Drop shape="hang" size={40} id="tr-hang" className="dw-tr-hang absolute inset-0" />
        <Drop shape="bead" size={40} id="tr-bead" className="dw-tr-bead absolute inset-0" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} ref={(el) => void (clones.current[i] = el)} className="dw-traveller-drop absolute left-0 top-0 h-[52px] w-[40px] origin-[50%_65%] opacity-0 will-change-transform" data-shape="bead">
          <Drop shape="bead" size={40} id={`tr-clone-${i}`} className="dw-tr-bead absolute inset-0" />
        </div>
      ))}
    </div>
  );
}
