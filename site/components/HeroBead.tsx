"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { loading } from "@/lib/loading";
import { hero } from "../content";
import { onFogLifting } from "../lib/stage";
import DewBeads from "./DewBeads";
import Drop from "./Drop";
import DewMagnetic from "./DewMagnetic";

/** HR15 restyled + M291 (vapour text): copy left · the scene inside one giant water bead (a fixed circle, it never
 *  grows) · stacked words right that condense out of a drifting particle cloud as the fog lifts. The film is a
 *  locked-camera loop; the push-in is code (the scroll scales the film inside the fixed bead). The drop swells on the
 *  pipette's measured tip and follows the push-in; the travelling drop takes over from here. */

const PUSH = 0.14; // film scale 1.02 → 1.16 across the hero

/** Particles condense into each word, then hand over to the crisp DOM text. */
function condenseWords(h1: HTMLElement) {
  const words = Array.from(h1.querySelectorAll<HTMLElement>("[data-hero-word]"));
  const box = h1.getBoundingClientRect();
  const PAD = 140;
  const c = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = (box.width + PAD * 2) * dpr;
  c.height = (box.height + PAD * 2) * dpr;
  Object.assign(c.style, { position: "absolute", left: `${-PAD}px`, top: `${-PAD}px`, width: `${box.width + PAD * 2}px`, height: `${box.height + PAD * 2}px`, pointerEvents: "none" });
  h1.style.position = "relative";
  h1.appendChild(c);
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // sample every word's glyphs in the same font and place
  type P = { sx: number; sy: number; tx: number; ty: number; d: number; w: number };
  const parts: P[] = [];
  const font = getComputedStyle(words[0]).font;
  words.forEach((el, wi) => {
    const r = el.getBoundingClientRect();
    const off = document.createElement("canvas");
    off.width = Math.ceil(r.width);
    off.height = Math.ceil(r.height);
    const o = off.getContext("2d")!;
    o.font = font;
    o.textAlign = "right";
    o.textBaseline = "middle";
    o.fillStyle = "#000";
    o.fillText(el.textContent || "", r.width, r.height / 2 + r.height * 0.04);
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const ox = r.left - box.left + PAD;
    const oy = r.top - box.top + PAD;
    for (let y = 0; y < off.height; y += 3) {
      for (let x = 0; x < off.width; x += 3) {
        if (data[(y * off.width + x) * 4 + 3] > 140) {
          const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
          parts.push({ tx: ox + x, ty: oy + y, sx: ox + x + g() * 110, sy: oy + y + g() * 70 + 46, d: Math.random() * 0.35, w: wi });
        }
      }
    }
  });

  const st = { t: 0 };
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#0f2a2e";
    for (const p of parts) {
      const local = (st.t - p.w * 0.28 - p.d) / 1.15;
      if (local <= 0) continue;
      const k = Math.min(1, local);
      const e = 1 - Math.pow(1 - k, 3);
      const x = p.sx + (p.tx - p.sx) * e;
      const y = p.sy + (p.ty - p.sy) * e - Math.sin(Math.PI * k) * 8; // a soft lift as it condenses, like vapour
      ctx.globalAlpha = Math.min(1, k * 1.4) * (1 - Math.max(0, (st.t - 2.1) / 0.5));
      ctx.fillRect(x, y, 1.9, 1.9);
    }
  };
  const tl = gsap.timeline({ onUpdate: draw, onComplete: () => c.remove() });
  tl.to(st, { t: 2.6, duration: 2.6, ease: "none" });
  // the crisp words fade in under the particles as each word lands
  words.forEach((el, i) => tl.to(el, { opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power2.out" }, 0.75 + i * 0.28));
  return tl;
}

export default function HeroBead() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const h1 = useRef<HTMLHeadingElement>(null);
  const film = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const drop = useRef<HTMLSpanElement>(null);

  // the film is the fog loader's real progress
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (prefersReducedMotion()) {
      v.pause();
      return;
    }
    loading.register("hero-film");
    const done = () => loading.update("hero-film", 1);
    const prog = () => {
      if (v.buffered.length && v.duration) loading.update("hero-film", Math.min(0.99, v.buffered.end(v.buffered.length - 1) / v.duration));
    };
    if (v.readyState >= 4) done();
    v.addEventListener("canplaythrough", done, { once: true });
    v.addEventListener("progress", prog);
    v.play().catch(() => {});
    return () => v.removeEventListener("progress", prog);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const words = h1.current!.querySelectorAll<HTMLElement>("[data-hero-word]");
    gsap.set(words, { opacity: 0, filter: "blur(6px)" });
    gsap.set(drop.current, { scale: 0.5, transformOrigin: "50% 0%" });

    let intro: gsap.core.Timeline | undefined;
    const off = onFogLifting(() => {
      // start once the fog has thinned enough to see the words condense
      intro = condenseWords(h1.current!);
      intro.delay(0.1);
      // the drop starts gathering on the tip on the clock, so the hero is never still before the scroll (lesson 4)
      gsap.to(drop.current, { scale: 0.68, duration: 4, ease: "none" });
    });

    const ctx = gsap.context(() => {
      // push-in: the film scales inside the fixed bead; the tip anchor follows (the drop stays on the pipette)
      const st = { p: 0 };
      const place = () => {
        const s = 1.02 + PUSH * st.p;
        gsap.set(film.current, { scale: s });
        const tx = 0.5 + (hero.tip.x - 0.5) * s;
        const ty = 0.5 + (hero.tip.y - 0.5) * s;
        if (tip.current) Object.assign(tip.current.style, { left: `${tx * 100}%`, top: `${ty * 100}%` });
      };
      gsap.to(st, {
        p: 1,
        ease: "none",
        onUpdate: place,
        scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
      });
      // the drop keeps swelling with the scroll until it is ready to fall (the traveller takes it from ~60 %)
      gsap.fromTo(drop.current, { scale: 0.68 }, { scale: 1, ease: "none", immediateRender: false, scrollTrigger: { trigger: section.current, start: "top top", end: "60% top", scrub: true } });
      place();
    }, section.current!);

    return () => {
      off();
      intro?.kill();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={section} id="top" className="pane pane-clip mt-[var(--pane-gap)] h-[calc(100vh-var(--pane-gap)*2)] min-h-[820px]" data-section="hero" data-record-time="0" data-record-hold="1.0" data-record-offset="-16" data-record-label="Hero">
      <DewBeads beads={[[8, 14], [21, 9], [63, 11], [77, 16], [91, 8]]} />

      <div className="grid h-full grid-cols-[300px_minmax(0,1fr)_300px] items-center gap-10 px-16 pt-[84px] pb-12">
        {/* left: copy */}
        <div className="self-end pb-10">
          <p className="dw-label">{hero.kicker}</p>
          <p className="dw-display mt-6 text-[32px] text-[var(--ink)]">{hero.copy}</p>
          <p className="mt-8 text-[18px] text-[var(--muted-ink)]">
            <span className="font-[650] text-[var(--ink)]">{hero.product}</span> · <span className="dw-num">{hero.from}</span>
          </p>
          <div className="mt-6 flex items-center gap-3">
            <DewMagnetic>
              <a href="#shop" className="dw-btn">
                {hero.cta}
                <span className="dw-btn-dot" aria-hidden="true" />
              </a>
            </DewMagnetic>
          </div>
        </div>

        {/* centre: the bead */}
        <div className="relative grid place-items-center">
          <div className="bead aspect-square w-[min(560px,62vh)] shadow-[0_50px_90px_-40px_rgba(15,42,46,0.45)]" data-hero-bead data-cursor="Dew">
            <div ref={film} className="absolute inset-0 scale-[1.02]">
              <video ref={video} src={hero.film} poster={hero.poster} muted loop playsInline autoPlay preload="auto" className="h-full w-full object-cover" data-hero-film />
            </div>
            {/* morning light gliding over the bead's glass: coarse, slow, never still (lessons 4, 55) */}
            <span className="dw-glide-light" style={{ borderRadius: "50%", zIndex: 3 }} aria-hidden="true" />
            <span className="bead-shine" aria-hidden="true" />
            {/* the drop's first anchor: the pipette tip; the traveller lifts the drop from here */}
            <span ref={tip} data-drop-anchor="hero-tip" className="absolute z-[4] -translate-x-1/2" style={{ left: `${hero.tip.x * 100}%`, top: `${hero.tip.y * 100}%` }}>
              <span ref={drop} className="block" data-hero-drop>
                <Drop shape="hang" size={22} id="hero" />
              </span>
            </span>
          </div>
        </div>

        {/* right: stacked words that condense out of the mist (M291) */}
        <h1 ref={h1} className="dw-display justify-self-end text-right text-[104px] leading-[1] text-[var(--ink)]" aria-label="Dew. Drop. Glow.">
          {hero.words.map((w, i) => (
            <span key={w} className="block" data-hero-word={i}>
              {w}
            </span>
          ))}
        </h1>
      </div>
    </section>
  );
}
