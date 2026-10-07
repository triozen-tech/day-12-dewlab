// All text + data for Dewlab (a fictional skincare lab, concept website). Written in Round 1 from site/DESIGN.md.

const IMG = "/images/dewlab";

export const brand = {
  name: "dewlab",
  wordmark: "DEWLAB",
  studio: "Triozen Tech",
};

export const nav = {
  links: [
    { label: "Ritual", href: "#ritual" },
    { label: "Actives", href: "#actives" },
    { label: "Results", href: "#results" },
    { label: "Shop", href: "#shop" },
  ],
  bag: "Bag",
};

export const hero = {
  kicker: "Hydrating serum · 3 drops",
  copy: "One drop of morning, made to last all day.",
  product: "Dew Drop Serum",
  from: "from ₹1,149",
  cta: "Shop the serum",
  words: ["Dew.", "Drop.", "Glow."],
  film: "/video/dewlab-hero-loop.mp4",
  poster: `${IMG}/hero-poster.webp`,
  /** where the pipette's tip bead sits in the square film (0–1), measured on the loop's first frame */
  tip: { x: 0.501, y: 0.481 },
};

export const ripple = {
  chapters: [
    { title: "One drop.", caption: "Lands light." },
    { title: "Three depths.", caption: "Water held at three depths of skin." },
    { title: "All-day dew.", caption: "Still dewy at 8 pm." },
  ],
};

export const actives = {
  title: ["Four actives.", "Nothing loud."],
  copy: "Each one does a single job, at a dose you can read on the bottle.",
  items: [
    { name: "Triple hyaluronic", dose: "2%", role: "Three sizes of water-holder, from the surface down.", img: `${IMG}/ing-hyaluronic.webp` },
    { name: "Niacinamide", dose: "4%", role: "Evens tone and calms the look of pores.", img: `${IMG}/ing-niacinamide.webp` },
    { name: "Apricot-kernel peptides", dose: "1%", role: "Soft bounce, without a heavy feel.", img: `${IMG}/ing-apricot.webp` },
    { name: "Petal water", dose: "62%", role: "The calm base the other three dissolve in.", img: `${IMG}/ing-petal-water.webp` },
  ],
};

export const ritual = {
  title: ["Morning. Night.", "Three drops each."],
  morning: `${IMG}/ritual-morning.webp`,
  dusk: `${IMG}/ritual-dusk.webp`,
  steps: [
    { time: "AM", word: "Cleanse", note: "Lukewarm water, a gentle wash." },
    { time: "AM", word: "3 drops", note: "Pressed in while skin is damp." },
    { time: "AM", word: "SPF", note: "Always last in the morning." },
    { time: "PM", word: "Cleanse", note: "Lift the day off first." },
    { time: "PM", word: "3 drops", note: "On damp skin, before bed." },
    { time: "PM", word: "Seal", note: "A thin layer of night balm." },
  ],
};

export const compare = {
  title: ["Twenty-eight mornings,", "side by side."],
  copy: "The same patch of cheek, the same light. Day 1 on the left, day 28 on the right.",
  before: `${IMG}/skin-before.webp`,
  after: `${IMG}/skin-after.webp`,
  labels: { before: "Day 1", after: "Day 28" },
  markers: [
    { name: "Dryness", note: "Tight, flaky patches settle." },
    { name: "Fine lines", note: "Dehydration lines soften." },
    { name: "Glow", note: "A wet-look sheen by midday." },
    { name: "Barrier", note: "Less sting, less redness." },
  ],
  buy: { name: "Dew Drop Serum · 30 ml", price: "₹1,149", cta: "Add" },
};

export const results = {
  title: "Measured softly.",
  copy: "Twenty-eight days, morning and night, on a small sample panel.",
  stats: [
    { value: 92, suffix: "%", label: "felt dewier", note: "within 1 hour" },
    { value: 87, suffix: "%", label: "looked plumper", note: "by day 14" },
    { value: 68, prefix: "+", suffix: "%", label: "more hydration", note: "after 8 hours" },
    { value: 96, suffix: "%", label: "no sticky feel", note: "from day 1" },
  ],
  footnote: "Sample figures for a concept website.",
  cta: "Shop the range",
};

export const reviews = {
  title: "Said softly.",
  copy: "Short notes from people who swapped their serum for three drops.",
  quotes: [
    { text: "My skin looks like I slept ten hours.", name: "Ananya", city: "Pune" },
    { text: "Three drops and it's gone. No film, no shine.", name: "Rhea", city: "Bengaluru" },
    { text: "Finally a serum that doesn't pill under sunscreen.", name: "Kabir", city: "Delhi" },
    { text: "The bottle is too pretty to hide in a drawer.", name: "Meher", city: "Mumbai" },
    { text: "Dry patches gone by the second week.", name: "Isha", city: "Hyderabad" },
    { text: "It smells of nothing, which I love.", name: "Arjun", city: "Chennai" },
    { text: "My makeup sits better on top of it.", name: "Tara", city: "Kochi" },
  ],
  rating: "4.9",
  count: "2,140 reviews",
  from: "from ₹749",
  cta: "Shop",
};

export type Product = {
  key: "serum" | "mist" | "balm";
  name: string;
  tab: string;
  copy: string;
  /** turntable frames folder (48 WebP, 360°, rendered in Blender) */
  frames: string;
  still: string;
  /** where the product's base sits in the square frame (0–1, from the top) and its height there: from the Blender camera */
  base: number;
  stillHeight: number;
  specs: [string, string][];
  sizes: { label: string; price: string }[];
};

export const shop = {
  title: "The range.",
  products: [
    {
      key: "serum",
      name: "Dew Drop Serum",
      tab: "Serum",
      copy: "The daily three drops. A light water-gel that sinks in and leaves skin looking dewy.",
      frames: `${IMG}/turntable/serum`,
      still: `${IMG}/serum-front.webp`,
      base: 0.781,
      stillHeight: 0.562,
      specs: [["Actives", "Hyaluronic 2% · Niacinamide 4%"], ["Texture", "Water-gel, no film"], ["Use", "AM + PM, 3 drops"]],
      sizes: [{ label: "30 ml", price: "₹1,149" }, { label: "50 ml", price: "₹1,690" }],
    },
    {
      key: "mist",
      name: "Morning Mist",
      tab: "Mist",
      copy: "A fine petal-water mist for the moments between. Over makeup, after sun, on a flight.",
      frames: `${IMG}/turntable/mist`,
      still: `${IMG}/mist.webp`,
      base: 0.781,
      stillHeight: 0.563,
      specs: [["Actives", "Petal water · Panthenol"], ["Texture", "Fine mist"], ["Use", "Any time"]],
      sizes: [{ label: "100 ml", price: "₹749" }],
    },
    {
      key: "balm",
      name: "Night Dew Balm",
      tab: "Balm",
      copy: "A soft apricot balm that seals the night's three drops in. Melts on contact.",
      frames: `${IMG}/turntable/balm`,
      still: `${IMG}/balm.webp`,
      base: 0.701,
      stillHeight: 0.402,
      specs: [["Actives", "Apricot-kernel oil · Ceramides"], ["Texture", "Melting balm"], ["Use", "PM, last step"]],
      sizes: [{ label: "50 g", price: "₹1,290" }],
    },
  ] as Product[],
  rating: { stars: 5, text: "4.9 · 2,140 reviews" },
  cta: "Add to bag",
};

export const footer = {
  pitch: "Skin, after rain.",
  columns: [
    { title: "Shop", links: ["Dew Drop Serum", "Morning Mist", "Night Dew Balm", "Gift sets"] },
    { title: "Ritual", links: ["Morning", "Night", "Actives", "Results"] },
    { title: "Help", links: ["Shipping", "Returns", "Contact", "FAQ"] },
  ],
  socials: ["Instagram", "Pinterest", "YouTube"],
  note: `© 2026 Dewlab · Concept website by ${brand.studio}`,
};
