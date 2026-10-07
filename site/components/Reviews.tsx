"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { reviews } from "../content";
import DewBeads from "./DewBeads";
import DewMagnetic from "./DewMagnetic";

/** SP12 restyled + M141 (true-focus sweep): short quotes scattered like droplets on glass at three depths, all soft but
 *  one. While the section is on screen the focus glides quote to quote every ~1.1 s (the focused one clears, the last one
 *  softens back to its own depth); the drop's anchor moves with the focus, so the drop glides along at its corner.
 *  Plays by itself (no hover). Positions are fixed so nothing overlaps at 1440×900. ?static=1: quote 1 sharp. */
const ORDER = [0, 3, 1, 5, 2, 4, 6]; // a calm zig-zag across the cloud
const SPOTS: { left: string; top: string; size: number; depth: "near" | "mid" | "far" }[] = [
  { left: "34%", top: "34%", size: 46, depth: "near" }, // the sharp one
  { left: "6%", top: "12%", size: 28, depth: "mid" },
  { left: "70%", top: "8%", size: 26, depth: "far" },
  { left: "71%", top: "46%", size: 30, depth: "mid" },
  { left: "4%", top: "58%", size: 26, depth: "far" },
  { left: "40%", top: "72%", size: 26, depth: "far" },
  { left: "63%", top: "80%", size: 24, depth: "far" },
];

export default function Reviews() {
  const cloud = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const box = cloud.current!;
    const quotes = Array.from(box.querySelectorAll<HTMLElement>("[data-quote]"));
    const anchor = box.querySelector<HTMLElement>('[data-drop-anchor="review-focus"]')!;
    let step = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const focus = (i: number) => {
      quotes.forEach((q, j) => q.setAttribute("data-depth", j === i ? "near" : SPOTS[j].depth === "near" ? "mid" : SPOTS[j].depth));
      quotes[i].prepend(anchor); // the drop follows the focus (it reads the anchor live)
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !timer) timer = setInterval(() => focus(ORDER[(step = (step + 1) % ORDER.length)]), 950);
        else if (!e.isIntersecting && timer) (clearInterval(timer), (timer = undefined));
      },
      { threshold: 0.35 },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <section className="pane px-[72px] pb-[56px] pt-[100px]" data-section="reviews" data-record-time="1.8" data-record-offset="-24" data-record-label="Reviews">
      <span className="dw-glide-light dw-glide-sea" aria-hidden="true" />
      <DewBeads beads={[[11, 9], [42, 13], [79, 10]]} />
      <div className="flex items-end justify-between gap-16">
        <h2 className="dw-display text-[76px] text-[var(--ink)]">{reviews.title}</h2>
        <p className="dw-body max-w-[380px] pb-3">{reviews.copy}</p>
      </div>

      <div ref={cloud} className="relative mt-10 h-[520px]" data-quote-cloud data-cursor="Read">
        {reviews.quotes.map((q, i) => {
          const s = SPOTS[i];
          return (
            <blockquote key={q.text} className="quote" data-depth={s.depth} data-quote={i} style={{ left: s.left, top: s.top, fontSize: s.size, maxWidth: s.depth === "near" ? 520 : 340 }}>
              {i === 0 && <span data-drop-anchor="review-focus" className="absolute -left-8 top-2 h-0 w-0" />}
              “{q.text}”
              <cite>
                {q.name}, {q.city}
              </cite>
            </blockquote>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[rgba(15,42,46,0.12)] pt-6">
        <p className="flex items-baseline gap-4 text-[var(--ink)]">
          <span className="text-[22px] tracking-[3px] text-[var(--apricot)]" aria-label="5 out of 5">
            ★★★★★
          </span>
          <span className="dw-num text-[32px] font-[650]">{reviews.rating}</span>
          <span className="text-[17px] text-[var(--muted-ink)]">{reviews.count}</span>
        </p>
        <div className="flex items-center gap-6">
          <span className="dw-num text-[18px] font-[600] text-[var(--ink)]">{reviews.from}</span>
          <DewMagnetic>
            <a href="#shop" className="dw-btn">
              {reviews.cta}
              <span className="dw-btn-dot" aria-hidden="true" />
            </a>
          </DewMagnetic>
        </div>
      </div>
    </section>
  );
}
