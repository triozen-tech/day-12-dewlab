"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";

/** The hand-overs between sections (X codes, site/DESIGN.md §5), all scroll-scrubbed so they play both ways:
 *    hero → ripple      X22 feathered mask wipe: the water rises from the bottom with a soft edge to meet the falling drop
 *    ripple → actives   X1  overlap slide: the actives pane slides up over the pinned water, which recedes slightly
 *    actives → ritual   X2  colour wash: the page behind the panes washes from mist to a pale dawn sage
 *    ritual → compare   X14 atmospheric bleed: a morning haze rises over the dusk and clears onto the bright skin pane
 *    compare → results  X90 frosted glass band (markup in Results)
 *    results → reviews  X29 curved-edge cover: the reviews pane arrives with a bowed top edge that flattens
 *    reviews → shop     X18 stamp-pop dissolve: a short crossfade, the drop pops as it lands (traveller)
 *    shop → footer      X3  edge shape morph: the shop pane's bottom edge bows down under the drop, then snaps flat
 *  ?static=1: nothing here runs; every section shows its final state. */
const ss = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default function Transitions() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const q = (s: string) => document.querySelector<HTMLElement>(`[data-section="${s}"]`)!;
    const triggers: ScrollTrigger[] = [];
    const add = (vars: ScrollTrigger.Vars) => triggers.push(ScrollTrigger.create(vars));

    // X22 · the water rises with a feathered edge (mask on the pinned stage)
    const rippleStage = q("ripple").querySelector<HTMLElement>("[data-ripple-stage]")!;
    const setRise = (p: number) => {
      const edge = -25 + 150 * p; // % from the bottom
      const m = `linear-gradient(to top, #000 ${edge - 25}%, transparent ${edge}%)`;
      rippleStage.style.maskImage = m;
      rippleStage.style.webkitMaskImage = m;
    };
    setRise(0);
    add({ trigger: q("ripple"), start: "top bottom", end: "top 15%", scrub: true, onUpdate: (s) => setRise(s.progress), onLeave: () => setRise(1) });

    // X1 · the actives pane slides over the pinned water, which recedes a little (scale + soft fade, never darkened)
    add({
      trigger: q("actives"),
      start: "top bottom",
      end: "top 15%",
      scrub: true,
      onUpdate: (s) => gsap.set(rippleStage, { scale: 1 - 0.05 * s.progress, opacity: 1 - 0.35 * s.progress, transformOrigin: "50% 30%" }),
    });

    // X2 · colour wash behind the panes: mist → pale dawn sage across actives → ritual, back to mist after
    const wash = gsap.utils.interpolate("#f2f6f4", "#e3ebe4");
    const main = document.querySelector<HTMLElement>("main")!;
    add({ trigger: q("actives"), start: "center center", end: "bottom top", scrub: true, onUpdate: (s) => (main.style.backgroundColor = wash(s.progress)) });
    add({ trigger: q("compare"), start: "top bottom", end: "top 40%", scrub: true, onUpdate: (s) => (main.style.backgroundColor = wash(1 - s.progress)) });

    // X14 · atmospheric bleed: a morning haze rises over the end of the night and clears onto the skin pane
    const haze = document.querySelector<HTMLElement>("[data-haze]")!;
    add({
      trigger: q("compare"),
      start: "top 130%",
      end: "top 25%",
      scrub: true,
      onUpdate: (s) => {
        const p = s.progress;
        haze.style.opacity = String(0.62 * Math.sin(Math.PI * p)); // never a mostly blank frame (lesson 88)
        haze.style.transform = `translate3d(0, ${(1 - p) * 18}%, 0)`;
      },
    });

    // X29 · the reviews pane arrives with a bowed top edge that flattens as it covers
    const rev = q("reviews");
    add({
      trigger: rev,
      start: "top bottom",
      end: "top 30%",
      scrub: true,
      onUpdate: (s) => {
        const k = 1 - ss(0, 1, s.progress);
        const ry = 34 + 150 * k;
        rev.style.borderTopLeftRadius = `${34 + 46 * k}% ${ry}px`;
        rev.style.borderTopRightRadius = `${34 + 46 * k}% ${ry}px`;
      },
    });

    // X18 · a short crossfade into the shop (the drop's landing pop is in the traveller)
    const shop = q("shop");
    add({ trigger: shop, start: "top bottom", end: "top 82%", scrub: true, onUpdate: (s) => gsap.set(shop, { opacity: 0.35 + 0.65 * s.progress }) });

    // X3 · the shop pane's bottom edge bows down under the drop as it leaves, then snaps flat
    const bow = shop.querySelector<SVGPathElement>("[data-bow] path")!;
    const svg = shop.querySelector<SVGSVGElement>("[data-bow]")!;
    const drawBow = (p: number) => {
      const disc = shop.querySelector<HTMLElement>('[data-drop-anchor="shop-disc"]')!.getBoundingClientRect();
      const box = shop.getBoundingClientRect();
      const cx = disc.left - box.left;
      const depth = 34 * Math.sin(Math.PI * Math.min(1, p / 0.8)) * (p < 0.8 ? 1 : 0);
      svg.setAttribute("viewBox", `0 0 ${box.width} 60`);
      bow.setAttribute("d", `M ${cx - 120} 0 C ${cx - 60} 0 ${cx - 34} ${depth} ${cx} ${depth} C ${cx + 34} ${depth} ${cx + 60} 0 ${cx + 120} 0 Z`);
    };
    drawBow(0);
    add({ trigger: shop, start: "bottom 85%", end: "bottom 35%", scrub: true, onUpdate: (s) => drawBow(s.progress) });

    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <div
      data-haze
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[44] opacity-0"
      style={{ background: "radial-gradient(120% 70% at 50% 100%, rgba(242,246,244,0.95), rgba(242,246,244,0.55) 55%, rgba(242,246,244,0) 85%)" }}
    />
  );
}
