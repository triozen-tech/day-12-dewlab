"use client";

// Dewlab's own "the fog is lifting" signal (lesson 80: with the engine loader off, onSiteReady fires at mount, so the
// hero would play hidden behind our fog). Fired the moment the fog STARTS clearing; ?static=1 fires it at once.

let lifted = false;

export function fireFogLifting() {
  if (lifted) return;
  lifted = true;
  window.dispatchEvent(new Event("dew:lift"));
}

export function onFogLifting(fn: () => void) {
  if (lifted) {
    fn();
    return () => {};
  }
  const h = () => fn();
  window.addEventListener("dew:lift", h, { once: true });
  return () => window.removeEventListener("dew:lift", h);
}

export const hasLifted = () => lifted;
