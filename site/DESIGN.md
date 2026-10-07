# Dewlab · design direction (Day 12, Round 0)

**Brand:** Dewlab, a fictional skincare lab (concept website). **Sells:** a hydrating serum plus two companions, priced in ₹. **Mood:** bright, fresh, dewy, calm, premium: glass, water, light, petals. **Reel line:** "Skincare, but make it cinematic."
**Desktop only:** 1440×900. **Traveller day:** yes (Day 12). One apricot serum drop travels the whole page.

**The idea in one line:** the whole site is one cool, misty morning, and one apricot-gold drop of serum moves through it. The drop forms on a floating pipette, falls into still water, splits into beads, fills the ritual bar, becomes the slider handle, fills the gauges, lands in the bag and ends as the full stop of the footer wordmark.

---

## 1. Choices

| Menu | Pick | Why it fits this site |
|---|---|---|
| Look | **L25 Surreal product world: "the dew world"** (with L16 glass materials) | The product lives in one impossible morning: a pipette floats by itself, petals and droplets hang in the air, one drop obeys its own gentle physics from top to bottom. Glass panes, water and light are the only materials. |
| Palette | **Dew & apricot** (custom): bg mist `#F2F6F4` · surface `#FFFFFF` · text lagoon ink `#0F2A2E` · muted `#557170` (≈ 4.7:1 on bg) · **accent apricot `#EE7A3B`** (the serum: drop, fills, large type, buttons with ink text) · band sea-glass `#D7EAE5` · one dusk band `#16263B` (ritual PM) with mist text `#E7EFEC` | Cool mist + clear glass keeps it fresh and bright; the warm apricot serum is the one accent, so the drop is always visible on a light page (a clear water drop would vanish). Category-reflex check: no blush pink, no beige-and-black, no clinical white-and-blue. |
| Type | **T22 Gloock + Urbanist** | Gloock's high-contrast serif reads like light through glass in big headlines; Urbanist is round, clean and calm for body, prices and labels. |
| Nav | **N2 floating pill, built as NV04**: full transparent header over the hero → lifts into a frosted "dew capsule" (wordmark · Ritual · Actives · Results · Shop · Bag) | The capsule is a bead of glass floating over the page; the Bag inside it is where the drop delivers the add-to-bag. |
| Hero | **"Inside the dew bead"** (HR15): the film plays inside one giant round water bead (a circle that stays a circle, never grows); copy left, three stacked words right ("Dew. / Drop. / Glow.") condense out of the mist; the drop swells on the pipette tip and falls out through the bead's rim | Shows the product, the dewy world and the traveller's birth in the first screen. Not a portal: the bead never expands. |
| Section shape | **S5 rounded panels as glass panes**: each section is an inset rounded pane with a soft bevel highlight and a few code-drawn dew beads resting on its top edge | Glass + condensation, calm and premium; the panes give the drop edges to fall from and land on. |
| Cards | **C8 circles → "beads"**: every card is round (ingredient beads, ring gauges, product disc, review focus) | One shape language: the drop's shape. No square cards on the whole site. |
| Signature | **The Ripple** (SY08 + M562): the drop falls into a still sea-glass water surface; rings spread with the scroll, caustic light crawls, and the chapter words lie *under* the water and bend as each ring passes | The "cinematic" moment, drawn entirely in code (no Flow credits), bright instead of dark. |
| Loader | **I11 Fog clears onto the hero** | Morning mist thins from the thin patches first and the bright hero appears through it; the wordmark and % sit in the fog. |

Uniqueness: **8 of 8 different**, see the sites log. Layout codes and motion codes: none used on the last 3 sites, and no motion code used on any earlier day.

**Motion feel:** slow, liquid, calm. Arrivals `cubic-bezier(0.22,1,0.36,1)` (expo-out-like), 0.9–1.4 s; the drop moves on `sine.inOut` between anchors with a gravity ease (`power2.in`) only while it falls; nothing bounces. Stagger 60–80 ms. One main thing moves at a time; the drop is always the calmest-but-continuous thing on screen (surface-tension wobble + a moving highlight, so it is never frozen).

---

## 2. Section plan (9 sections + loader + nav)

| # | Section | Layout | Starts from | How it is restyled here |
|---|---|---|---|---|
| 0 | **Loader** "Morning mist" | — | `components/fx` I11 fog | Mist tinted to the page (`#F2F6F4` → white), "dewlab" wordmark in Gloock condensing in the middle, small % in Urbanist. |
| 1 | **Nav** "Dew capsule" | **NV04** | `components/sections` NV04 | Transparent full header over the hero; after the hero it lifts into a frosted round capsule with an apricot progress line along its bottom edge; Bag count inside. |
| 2 | **Hero** "Inside the dew bead" | **HR15** | HR15 (copy · subject on a colour disc · stacked words) | The "disc" is a giant water bead (≈ 680 px, centred-right) holding the hero film (bottle + floating pipette + petals + droplets); refraction rim + specular highlight drawn in code. Left: small copy "One drop of morning, made to last all day." + **Dew Drop Serum · from ₹1,149** + Shop button. Right: stacked Gloock words **Dew. / Drop. / Glow.** |
| 3 | **Signature** "The Ripple" | **SY08** | SY08 (fixed title that swaps per chapter) | Full-width sea-glass water surface (OGL); the fixed title lies under the water and swaps per chapter: **One drop.** → **Three depths.** → **All-day dew.**; caustic light; the drop's impact sends the rings. Small caption top-left per chapter. |
| 4 | **Ingredients** "Four actives" | **ST02** | ST02 ingredient dossier | Four round glass beads in a row instead of spec cards, each a window onto its own looping macro still (A7–A10, animated in code), name + % + one line below: **Triple hyaluronic 2%** (three depths of water) · **Niacinamide 4%** (even tone) · **Apricot-kernel peptides 1%** (bounce) · **Petal water 62%** (calm). Heading: "Four actives. Nothing loud." |
| 5 | **Ritual** "Morning / Night" | **PD05** | PD05 segmented phase bar | One long glass bar with 6 segments: AM Cleanse · 3 drops · SPF │ PM Cleanse · 3 drops · Seal. Pinned over the code light transition (the bottle on a glass ledge, morning sun → dusk blue, A5 → A6, scrubbed); the page around it shifts from mist to the dusk band `#16263B` with the film. Big step word swaps on the left. |
| 6 | **Before → after** "Day 1 / Day 28" | **CP04** | CP04 compare slider + highlights sidebar | Full-height skin macro slider (no face) in a rounded pane: Day 1 still on the left, the code dew transition (dry → dewy) on the right; sidebar of 4 round markers: Dryness · Fine lines · Glow · Barrier, each ticking as the handle passes. Heading: "Twenty-eight mornings, side by side." |
| 7 | **Results** "In numbers" | **ST09** | ST09 ring gauge row | Four round glass gauges that fill with apricot liquid: **92%** dewier in 1 hour · **87%** plumper by day 14 · **+68%** hydration after 8 h · **96%** no sticky feel. Footnote: "Sample figures for a concept website." |
| 8 | **Reviews** "Said softly" | **SP12** | SP12 quote cloud with focus blur | 7 short quotes scattered like droplets on glass at three depths (blurred), one sharp at a time; fake first names + city only. Bottom bar: ★ 4.9 · 2,140 reviews · from ₹749 [Shop]. |
| 9 | **Shop** "The range" | **PS04** | PS04 spotlight + buy box | Left: the selected product as **live 3D glass** (Blender GLB, R3F) standing on a big sea-glass disc (C8). Right: three product tabs (Dew Drop Serum · Morning Mist · Night Dew), size chips (30 ml ₹1,149 / 50 ml ₹1,690), qty, **Add to bag**. Others: Morning Mist 100 ml ₹749 · Night Dew balm 50 g ₹1,290. Self-plays in `?record=1`: switches to the serum, picks 50 ml, adds to bag. |
| 10 | **Footer** "Dewlab." | **FO01** | FO01 giant cropped wordmark + 3 link columns | Pitch line "Skin, after rain." · columns Shop / Ritual / Help (no fake addresses) · "Concept website by Triozen Tech" · giant outlined **DEWLAB** cropped at the bottom that fills with apricot liquid; the drop becomes its full stop. |

1 hero + 3 cinematic (Ripple, Ritual, Before → after) + 5 shop-style (Ingredients, Results, Reviews, Shop, Footer). No layout code twice; none from the last 3 sites.

---

## 3. Motion map

| # | Section | Layout | Motion | How it plays here | Record mode |
|---|---|---|---|---|---|
| 0 | Loader | — | **I11** fog clears onto the hero | Two drifting noise fogs cover the screen from the first paint (CSS drift before JS); the wordmark condenses in the fog with the real load %; on ready the fog's threshold rises so thin patches clear first and the hero shows through. Fires the "loader lifting" event at the START of the clear (lesson 80). | ~2 s, fog always drifting |
| 1 | Nav | NV04 | **M471** nav detaches into a floating pill | Past the hero the full header lifts off the top and shrinks into the centred frosted capsule (shadow tinted lagoon); the apricot line along its bottom is the scroll progress; Bag count bumps when the drop delivers. | scroll-driven, plays on camera |
| 2 | Hero | HR15 | **M291** vapour text (words condense) | "Dew. / Drop. / Glow." condense one by one out of a loose mist cloud into crisp Gloock (the last of the loader's fog becomes the words) while the locked-camera film loops inside the bead (only petals and droplets move) and the scroll drives a slow push-in (scale ≈ 1 → 1.14 on the film, the bead itself never grows), and the drop swells on the pipette tip. The film loops from the first paint after the loader, so the hero is never still (lesson 4). | intro on the clock, then scrub |
| 3 | Signature: The Ripple | SY08 | **M562** caustic pool with ripples | Pinned ~2.5 screens. The drop hits the centre; analytic ring ripples (scroll = time since impact, so it scrubs both ways) spread, bounce faintly off the pane edges and bend the caustic light and the under-water title; each big ring swaps the title (One drop. → Three depths. → All-day dew.). Caustics crawl on the clock so the stage is never still. A rebound droplet rises from the centre at the end. | scrub + clock caustics |
| 4 | Ingredients | ST02 | **M325** fluid ink morph text | Each bead is a round window onto its own macro **code loop** (one still each, A7–A10, animated by a small shader): hyaluronic gel flows, niacinamide crystals glint, apricot oil slides, petals turn on ripples. As the drop's four beads land, each loop fades up inside its bead and the active's name below blooms in like a drop of dye in water (SVG turbulence settles to crisp, apricot tint → ink), bead by bead; the % rolls in as support. | once on entry; the four code loops always run while on screen (seamless, no video files) |
| 5 | Ritual | PD05 | **M151** sticky copy + colour + card swap | Pinned ~2 screens. The pane is the **code light transition** on the morning/dusk stills (A5 → A6), driven by the pinned scroll: the sunlight, the bottle shadow and the caustics fade first, then the dusk blue rises, and a warm glow stays on the serum; a slow drift of the glow keeps it alive during holds. The left step word swaps per segment (Cleanse → 3 drops → SPF → Cleanse → 3 drops → Seal) at fixed points of the transition (AM steps while the sun is still on the wall, PM steps once the blue has risen), the bar fills segment by segment behind the drop, and the page colour around the pane follows the film from mist to the dusk band. (The transition is the medium; M27 is not a code on this site.) | scrub + the film's own light drift; shimmer on the bar's liquid |
| 6 | Before → after | CP04 | **M502** compare slider intro sweep | Left of the divider: the Day 1 still (A3). Right of it: the **code dew transition** on the two pixel-aligned stills: skin-after soaks in over skin-before through a soft organic noise mask spreading from the upper left, with a light lift on the moving front, its progress driven by the sweep, so the skin turns dewy exactly as the handle passes. On entry the divider sweeps by itself 0 → 100 → 50 % (~2.4 s) with the drop as its handle; at rest a slow highlight drift keeps the dewy side alive. Sidebar markers tick as the handle passes. Dragging takes over in normal mode. | self-plays once on screen; film tail keeps moving |
| 7 | Results | ST09 | **M156** liquid level rises (velocity slosh) | Four round glass gauges fill with apricot liquid to their values as you scroll; the wavy surface tilts against scroll speed on a spring and settles; small bubbles rise; the numbers roll with the level and turn white where the liquid covers them. | scrub + clock wave |
| 8 | Reviews | SP12 | **M141** true-focus sweep | All quotes blurred but one; the focus (a soft round lens with the drop at its corner) glides quote to quote every ~1.1 s and brings that quote sharp; the others stay soft at their depth. | auto-cycles while on screen |
| 9 | Shop | PS04 | **M452** depth stack, next comes forward | The spotlight is a **Blender turntable** (48 frames, 360°, transparent glass, approved render materials) on a canvas: slow auto-spin with neighbour frames blended, drag to turn. Switching product: the current one recedes into depth (scale down, blur, fade), then the next comes forward from behind (~0.8 s); the name clip-wipes in whole (lesson 85). A sea-glass light glides across the disc. `?static=1`: the turntable's first frame. | record-only script (a touch ring follows each target live): Mist → Serum → 50 ml → Add to bag → a drop arcs into the nav Bag, count 0 → 1 (F8); spin a little faster on camera |
| 10 | Footer | FO01 | **M322** fill-up text | The drop falls into the outlined DEWLAB; apricot liquid with a waving top edge rises inside the letters to ~85 % and keeps gently waving; the drop settles as the full stop. Plays on the clock once on screen (lesson 77), starts `onEnter`, stops only `onLeaveBack` (lesson 89). | clock, wave never stops |
| F | **Traveller: the drop** | — | **F1** waypoint travel (+ **F8** land in UI) | One driver, many states (lesson 31): position, scale, shape (morph between hang · fall · bead · flat · sphere · dot), highlight angle. Calm `sine.inOut` between anchors, `power2.in` only while falling. Route below. | scroll + idle wobble, never pauses |

**Checklist:** every section has a layout code and a motion code · no code twice (I11 M471 M291 M562 M325 M151 M502 M156 M141 M452 M322 F1 F8) · no plain fades · hero and signature repeat no earlier site's (all rows of the log checked) · the hero is not a shape growing to full screen (the bead stays a fixed circle).

---

## 4. The traveller: one drop, the full route

**Carrier:** F1 waypoint driver (`components/fx/travel/useTravel.ts`) with a **code-drawn renderer** instead of PNG angles: an SVG drop (apricot body gradient, white specular highlight, a soft caustic glow under it, refraction tint at the rim) whose outline morphs between six shapes with MorphSVG. No cut-out PNG and no Flow image needed (the drop is never a photo, so it can change shape). Size 22–64 px. The drop layer sits **under** all text (text z above it); every anchor is in free space (gutters, empty corners, the slider line).

| Section | Where the drop is | What it does | Hand-over to the next |
|---|---|---|---|
| Loader | not shown | — | — |
| Hero | on the floating pipette's tip inside the bead (the camera is locked, so the tip is one measured point; it only moves with the code push-in scale, which the drop follows) | grows from a small meniscus bump into a full hanging drop during the intro + first scroll (shape morph, never from scale 0); at ~65 % of the hero it detaches and falls, stretching into a teardrop, out through the bead's lower rim (it breaks the frame) | keeps falling through the seam between the hero pane and the water |
| Ripple | centre of the water | hits the surface = the impact that starts the rings; **hidden** (absorbed) during rings 1–3; at the end a rebound droplet rises from the centre | the rebound drop floats up and left to the ingredients |
| Ingredients | above the four beads | splits into four small beads (one per active), each sliding onto the top edge of its ingredient bead and dissolving into it (~0.4 s, lesson 62), lighting it apricot | at the section's end four small beads rise off the cards and merge back into one drop |
| Ritual | the left end of the phase bar | becomes the bar's leading edge: rides the bar as it fills (the liquid trail behind it), glows on the dusk half | falls off the bar's right end down to the slider |
| Before → after | the compare slider's divider | is the slider handle (largest size, 64 px): sweeps 0 → 100 → 50 % and the skin turns dewy where it passes | leaves the handle, falls into gauge 2 |
| Results | inside gauge 2 | merges into gauge 2's liquid surface (~0.4 s) as all four gauges fill; **hidden** while the gauges fill | beads up out of gauge 4's surface at the end and floats up to the quote cloud |
| Reviews | at the corner of the sharp quote | rides the focus lens from quote to quote (3 hops), small | glides down to the shop disc |
| Shop | on the sea-glass disc beside the product (the selected-size dot) | in record mode: size 50 ml picked, **Add to bag**: a small copy of the drop arcs into the nav capsule's Bag (F8, count 0 → 1 bumps); the main drop slides to the pane's bottom edge | the pane's bottom edge bows down under it like a hanging drop (X3), then snaps flat as the drop falls |
| Footer | inside the outlined DEWLAB → after the last letter | falls into the wordmark, which fills with apricot liquid (M322); a last droplet settles as the **full stop** of "DEWLAB." and keeps a slow wobble on the reel's last screen | end |

Where it hides: inside the water during the Ripple (rings 1–3), inside the gauges while they fill, and (as its copy) inside the Bag. It never pauses in record mode (idle wobble + moving highlight at every anchor).

---

## 5. Transitions between sections

| From → to | Code | How it plays |
|---|---|---|
| Loader → Hero | (I11) | fog clears from thin patches onto the bright hero; the words condense from the last of it |
| Hero → Ripple | **X22** feathered gradient mask wipe | the water surface rises from the bottom with a soft feathered edge to meet the falling drop |
| Ripple → Ingredients | **X1** overlap slide | the ingredients pane (solid) pulls up 40vh over the last of the pinned water, which recedes a little (scale + soft fade, never darkened); the rings finish before the overlap |
| Ingredients → Ritual | **X2** colour wash | the page bg washes from mist to the pale dawn tint of the AM half |
| Ritual → Before → after | **X14** atmospheric bleed | the night band dissolves into rising morning haze that clears onto the bright skin pane |
| Before → after → Results | **X90** frosted glass divider band | a still frosted band (a static milky gradient + fine noise texture) sits at the seam; the panes pass under it and clear. A live full-width backdrop blur stalled the recorder for 0.5 s, so the frost is a texture (lesson 59) |
| Results → Reviews | **X29** curved-edge cover swipe | the reviews pane slides up with a curved top edge (like a water surface) that flattens as it covers |
| Reviews → Shop | **X18** stamp-pop dissolve | a short crossfade while the drop pops 1 → 1.05 → 1 as it lands on the shop disc |
| Shop → Footer | **X3** edge shape morph | the shop pane's bottom edge bows down under the drop like a hanging drop and snaps flat as the drop falls into the footer |

**Details (Round 4):** **U55 drop liquid button** on Add to bag and Shop (fill rises, a small drop swells from the bottom edge and detaches; hands-free once on camera) · magnetic Shop/Add buttons · nav links underline like a waterline · `data-cursor="Drag"` on the slider, `"Turn"` on the 3D product · Bag count bump · size chips: a bead slides between them. Every one also plays once by itself in `?record=1`.

**Never frozen (record mode):** caustics on the clock in the Ripple, liquid waves in the bar, gauges and footer, fog drift in the loader, film inside the bead, drop wobble everywhere. The reel's last screen keeps the footer liquid waving (coarse enough for frame-diff, lesson 55).

---

## 6. Assets

**Rules for every AI asset:** no hands anywhere (the pipette floats by itself, nobody squeezes it) · no faces (skin macro only: no eyes, lips, nose, hair) · no logos · no readable text on bottles (our text is added in code) · the Dewlab bottle is NOT a plain white clinical bottle with a formula label: it is a **squat, rounded pebble-shaped bottle in clear sea-glass (pale aqua tint), apricot-gold serum visible inside, a tall slender glass pipette with a frosted pale-aqua glass bulb (no rubber teat), a thin etched ring around the shoulder, no label** · one mood and grade for all: bright cool morning light, pale mist backdrop `#EEF3F1`, soft shadows, fresh, dewy · **check the ratio chip in Flow before generating** (it keeps the last one used) · keep the bottom-right corner of every film free (Veo watermark, we paint it out).

**Order (so every asset shows the same bottle):** 1) run the Blender script with `--render` → 2) A1 with the Blender render attached as reference → 3) everything else.

### 6a. 3D products (Blender, code: `scripts/blender/dewlab-products.py`)

| # | File | What | Used in |
|---|---|---|---|
| B1 | `public/models/dewlab-serum.glb` | pebble sea-glass bottle (≈ 58 × 42 mm pebble body, 101 mm tall with the pipette) + frosted collar + glass pipette with frosted bulb + apricot serum (also a little serum in the pipette) | shop spotlight (live 3D) |
| B2 | `public/models/dewlab-mist.glb` | slim rounded sea-glass spray (≈ 43 mm Ø × 131 mm) + frosted overcap + dip tube + pale apricot mist | shop |
| B3 | `public/models/dewlab-balm.glb` | low thick-walled sea-glass jar (≈ 68 mm Ø × 50 mm) + frosted domed lid + apricot balm | shop |
| R1 | `raw/blender/{serum-front,serum-34,mist,balm,balm-open}-ref.png` | Cycles renders on a seamless #EEF3F1 sweep (1080²) | references for A1, A5 (so the AI bottle = the 3D bottle) |
| R2 | `raw/blender/{serum-front,serum-34,mist,balm,balm-open}-cut.png` | the same renders with a transparent background (transparent glass) | `?static=1` fallback + poster while the 3D loads (→ WebP in Round 1) |

Real-world scale (metres), origin at the centre of each product's base, Y-up in the GLB, Draco-compressed, no textures (pure materials, so files stay small). Glass = Principled BSDF transmission 1, IOR 1.45, pale aqua tint, exported as `KHR_materials_transmission` / `ior` / `volume`. Serum, mist and balm are **non-transmissive** on purpose: three.js's transmission pass only sees opaque objects through glass, so a transmissive liquid inside the bottle would vanish on the web. Every part carries a `dew_role` extra (glass · inner_glass · frost · etch · liquid) so the web loader can tune materials by role (inner glass parts → thin transparent glass for the same reason).

**On the web (as built, Round 1 review):** the live three.js version was replaced by **Blender turntables**: `blender -b -P scripts/blender/dewlab-products.py -- --turntable` renders 48 frames (7.5° apart, 720², transparent background + transparent glass) per product into `raw/blender/turntable/<product>/`, and `python3 scripts/turntable_webp.py serum mist balm` makes the 640² WebP frames in `public/images/dewlab/turntable/` (2.8 MB for all three). No three.js, R3F or Draco on the page; the GLBs stay in `public/models/` as the master models.

### 6b. Flow stills (Nano Banana Pro, `.jpg`)

| # | File | Ratio | Shows | Feeds |
|---|---|---|---|---|
| A1 | `raw/dewlab-key.jpg` | 16:9 | the hero key image (P1), **serum-front-ref.png attached as reference** | start frame of V1 |
| A2 | `raw/skin-after.jpg` ✅ | 16:9 | dewy skin macro, warm medium-brown (P3) | dewy side of the slider (code transition) |
| A3 | `raw/skin-before.jpg` ✅ | 16:9 | **edit of A2**: same crop, dry and dull (P4) + matte pass in code (`scripts/matte_skin.py`, raw edit kept as `skin-before-raw.jpg`) | start frame of V2 + the slider's left side (identical framing, lesson 78) |
| A5 | `raw/ritual-morning.jpg` ✅ | 16:9 | bottle on a glass ledge, cool morning sun (P6), serum-front-ref.png attached | morning end of the code light transition |
| A6 | `raw/ritual-dusk.jpg` ✅ | 16:9 | **edit of A5**: same frame, dusk-blue light (P7) | dusk end of the code light transition |
| A7 | `raw/ing-hyaluronic.jpg` ✅ | 16:9 | hyaluronic gel macro (P9) | still for the gel code loop (bead 1) |
| A8 | `raw/ing-niacinamide.jpg` ✅ | 16:9 | niacinamide crystals macro (P10); ✦ painted out (`scripts/clean_mark.py`, original `-raw`) | still for the crystal code loop (bead 2); **bead crop centred on the cluster (x ≈ 1560), not the image centre** |
| A9 | `raw/ing-apricot.jpg` ✅ | 16:9 | apricot kernels + split pits in a golden oil pool (P11); ✦ painted out (original `-raw`) | still for the oil code loop (bead 3); **bead crop centred on the kernels (x ≈ 1000, y ≈ 650)** |
| A10 | `raw/ing-petal-water.jpg` | 16:9 | petals on water macro (P12) | still for the petal code loop (bead 4) |

(A4, the range photo, is dropped: the shop is live 3D now.)

**Ratio note:** A7–A10 are made at **16:9** (they are textures that fill the frame; each bead crops the centre square, so the best detail goes in the centre). With the loops in code, no 1:1 video is needed.

### 6c. Flow films (Veo, image → video)

| # | File | Ratio · length | Start / end frame | Shows | Used in → how |
|---|---|---|---|---|---|
| V1 | `raw/dewlab-hero.mp4` ✅ | 16:9 · 8 s | **start = end A1** (locked camera, loopable) | only petals + droplets move; bottle, pipette and tip bead stay perfectly still; no drop forms or falls | hero, inside the bead → plays on the clock as a loop (12-frame crossfade baked into the seam, lesson 68), the push-in is done in code (scroll-driven scale); Veo mark bottom-right painted out |
| ~~V2~~ | — (Veo take failed, lesson 91) | — | — | **now code**: skin-after revealed over skin-before through a soft organic noise mask soaking in from the upper left + a light lift on the moving front (preview `raw/skin-dew-preview.mp4`, made by the same maths) | before → after: the slider's handle position drives the mask progress (WebGL/canvas shader on the two pixel-aligned stills) |
| ~~V3~~ | — (skipped, lesson 91) | — | — | **now code**: morning → dusk on the pixel-aligned A5/A6 pair (aligned to ≤ 0.2 px; raw edit kept as `ritual-dusk-raw.jpg`): 1) the sunlight, bottle shadow and caustics fade off the wall first (through a sun-free frame = dusk's light structure painted in morning's colours, vignette softened), 2) the dusk blue rises after (overlapping, never a flat pause), 3) a soft warm glow stays on the serum (screen blend) · preview `raw/ritual-light-preview.mp4` | ritual pane → shader, progress = the pinned scroll |
| ~~V4–V7~~ | — (code, approved) | — | — | **four code loops** from the stills A7–A10, one small WebGL shader per bead, seamless (flow-map with staggered phase: two copies half a cycle apart, crossfaded, each region resetting at its own moment) + per-ingredient life: **gel** flows slowly along a swirl field with bubbles drifting up and fading · **crystals** stay put and glint (a slow light sweep across the facets + sparkle points that flare and fade) · **apricot oil** slides slowly in one direction with gliding highlights · **petals** turn gently on rippling water (ripple displacement + slow rotation drift) · preview of the gel loop `raw/ing-loop-preview.mp4` | the four ingredient beads; they render only while on screen. **Veo fallback** for ONE ingredient only if its code loop doesn't convince on the built page (prompts P9v–P12v kept for that) |

V1 (the only film): contact sheet (lesson 43), the measured pipette tip point for the code drop, the Veo mark painted out (lesson 7), a 12-frame crossfade baked into the start = end seam (measured 14× a normal step, lessons 68, 90), frames < 15 MB. Every Flow still is checked for the Gemini ✦ mark and painted out where found.

**Drawn in code (no AI):** the skin dew transition (A3 → A2) · the ritual morning → dusk light (A5 → A6) · the four ingredient loops (A7–A10) · the hero push-in (scale on V1) · the traveller drop · the loader fog · the water surface, ripples and caustics (OGL) · the dew bead around the hero film (rim, highlight) · glass panes + dew beads on their edges · the bead frames around the ingredient loops · the phase bar · ring gauges and their liquid · the quote cloud · the shop disc · the footer liquid wordmark · all text, prices and labels.

### Prompts

**P1 · A1 hero key image (16:9) · attach `raw/blender/serum-front-ref.png` as reference**
> Keep the bottle and the pipette exactly as in the reference image: the same squat, rounded pebble-shaped bottle of clear sea-glass, near-clear on its face with a pale aqua tint at its thick edges and base, filled about three quarters with rich translucent apricot serum (#EE7A3B), a very fine etched line around the shoulder just under the neck, no label. The pipette assembly (its frosted pale-aqua collar with three soft grooves, its rounded frosted pale-aqua glass bulb, and its slim clear glass tube with a little apricot serum inside) floats by itself in mid-air a few centimetres above the open bottle neck, perfectly vertical and centred over the neck, nobody holding it. Small clear water droplets and a few soft white and pale apricot petals hang weightless in the air around the bottle at different depths. Bright cool morning light from the upper left, fresh dewy atmosphere, soft mist, pale mist-green backdrop (#EEF3F1), a soft contact shadow under the bottle. The bottle is centred in the frame with generous empty space all around it. Photorealistic, crisp glass, shallow depth of field, premium and calm. No hands, no people, no text, no logos.

**P2 · V1 hero film (start frame A1 = `raw/dewlab-key.jpg`, no end frame, 16:9, 8 s)**
> Start exactly from the reference image. Keep the bottle, its open threaded glass neck, the apricot serum inside and the floating pipette exactly as they are: unchanged, perfectly still, vertical and centred over the neck. The small bead of serum at the tip of the pipette tube stays exactly the same size and does not drip, swell or fall. Very slow, smooth, continuous camera push-in toward the bottle for the whole shot, the bottle stays centred. The white and pale apricot petals and the clear water droplets drift slowly in mid-air and gently turn in slow motion, a few droplets glint as they pass through the light, soft morning light and mist move gently across the backdrop. Calm, premium, weightless. One continuous shot, no cuts, no camera shake, no sudden movement, nothing touches the bottle or the pipette. No hands, no people, no text, no logos.
> Timeline: 0–1 s petals and droplets begin to drift, push-in starts · 1–5 s steady push-in, petals turn and drift past, droplets glint, light moves softly over the glass · 5–8 s the push-in continues at the same speed (we use the first ~6 s). The pipette tip never drips: the drop is added in code.

**P3 · A2 skin after (16:9)**
> Extreme macro photograph of healthy, deeply hydrated human skin with a warm medium-brown skin tone, a smooth area of a cheek filling the whole frame, fine natural skin texture and tiny pores, a soft dewy glow, many tiny clear water beads resting on the surface catching the light. Bright cool morning light, soft and even, fresh pale tones. No face features (no eyes, no lips, no nose, no hair), no hands, no makeup, no text, no logos. Photorealistic, sharp focus across the frame.

**P4 · A3 skin before (edit of A2 = `raw/skin-after.jpg`, 16:9)**
> Edit this exact image. Keep the framing, crop, camera angle, focus, lighting direction and the warm medium-brown skin tone exactly the same; every pore, fold and contour stays in the same place. Change only the condition of the skin: make it dry, dull and dehydrated, completely matte with no glow and no shine, the bright highlight in the upper left becomes a soft flat sheen, fine dehydration lines across the surface, a few tiny dry flakes, slightly uneven tone. Remove every water bead and droplet. No face features, no hands, no text, no logos. Photorealistic.

**P5 · V2 skin dew film · NOT USED (the Veo take failed, the transition is code now, lesson 91) (start A3 = `raw/skin-before.jpg` → end A2 = `raw/skin-after.jpg`, 16:9, 8 s)**
> Start frame to end frame. Locked camera: no camera movement, no zoom, no pan, no change of focus. The skin itself stays perfectly still: the framing, every pore, fold and contour, the skin tone and the direction of the light stay exactly the same for the whole shot. Only two things change, slowly and evenly: tiny clear water beads appear on the surface by themselves, first a few in the upper left, then spreading gently across the frame until they match the end frame; and the matte surface gradually takes on a soft fresh glow, the highlight in the upper left brightening into a gentle sheen. Nothing is poured, sprayed or wiped, nothing touches the skin, nothing moves across the frame. Calm and slow, one continuous shot, no cuts, no flicker. No hands, no face features, no text, no logos.
> Timeline: 0–0.5 s dry and still · 0.5–4 s beads appear from the upper left and spread across the frame while the glow rises · 4–6 s the last beads appear and catch the light · 6–8 s settles exactly on the end frame. (The slider drives the film's time, so the change must be even across the frame: no sudden pops.)

**P6 · A5 ritual morning (16:9) · attach `raw/blender/serum-front-ref.png` (shape) + `raw/dewlab-key.jpg` (the same bottle as already shown in the hero)**
> Keep the bottle exactly as in the reference images: the squat, rounded pebble-shaped bottle of clear sea-glass with apricot serum, now closed, with its frosted pale-aqua collar (three soft grooves) screwed onto the neck and the rounded frosted pale-aqua bulb on top, the glass tube going down into the serum. The bottle stands upright, perfectly still, on a thick clear glass ledge in front of a plain pale sage-green wall, placed in the right third of the frame with calm empty space on the left. Cool early morning sunlight comes low from the left through an unseen window: crisp soft-edged light, a long pale shadow to the right, the glass ledge throws gentle caustic light patterns on the wall, the apricot serum glows where the sun passes through it. Clean, quiet, premium, nothing else in the scene. Photorealistic. No hands, no people, no plants, no petals, no text, no logos.

**P7 · A6 ritual dusk (edit of A5 = `raw/ritual-morning.jpg`, 16:9)**
> Edit this exact image. Keep the framing, camera angle, focus and every object exactly the same and in the same place: the bottle (its shape, glass, frosted aqua collar and bulb, the serum level and the tube), the thick glass ledge and the wall. Change only the light to blue hour at dusk: the low morning sunlight is gone, so the long bottle-shaped shadow and the caustic patterns on the wall fade away almost completely; the wall becomes a soft deep dusk blue (from #16263B in the corners to #2C4766 behind the bottle), lit by cool even blue ambient light; the glass picks up quiet blue reflections along its edges and on the ledge; the apricot serum keeps one last faint warm glow from inside. Calm, quiet evening. No new objects, no lamps, no window, no hands, no people, no text, no logos.

**P8 · V3 ritual light film · NOT USED (skipped, the transition is code now, lesson 91) (start A5 → end A6, 16:9, 8 s)**
> Start frame to end frame. Locked camera, no camera movement, the bottle and ledge do not move. Time passes from early morning to dusk in one smooth continuous shot: the low morning sunlight and its caustic patterns slowly travel across the wall and the bottle, warm to golden, then fade, and the room settles into soft dusk-blue light while the apricot serum keeps a faint glow. Smooth, even pace, no flicker, no cuts. No hands, no people, no text, no logos.
> Timeline: 0–2 s cool morning sun, caustics drift · 2–4.5 s light swings across the bottle, golden · 4.5–6.5 s sun fades, the wall cools to blue · 6.5–8 s calm dusk end frame.

**P9 · A7 hyaluronic gel (16:9: the texture fills the frame, the bead crops the centre square; same ratio as its loop V4)**
> Extreme macro of a clear hyaluronic gel, a glossy transparent hydrating gel folding over itself with tiny suspended air bubbles, filling the whole frame, bright cool morning light shining through it, pale aqua and soft white tones with a hint of apricot reflection. Fresh, clean, premium, photorealistic. No containers, no hands, no text, no logos.
**P9v · V4 · FALLBACK ONLY (the loops are code; use for one ingredient only if its code loop doesn't convince) (start = end A7, 6–8 s)** > Start and end on the reference image so the clip loops seamlessly. Locked camera. The clear gel slowly folds and flows in slow motion, the tiny bubbles drift upward and the light ripples through the gel, returning to the exact starting state at the end. One continuous shot, no cuts, no hands, no text, no logos.

**P10 · A8 niacinamide crystals (16:9: the crystals fill the frame, the most detailed part in the centre; attach `raw/ing-hyaluronic.jpg` as a style reference for light and colour only)**
> Match the light, colour and mood of the reference image exactly (bright, soft, clear aqua and soft white with warm apricot reflections), but not its subject. Extreme macro of fine white niacinamide crystals and a few half-dissolved crystal grains lying in a thin layer of clear water, filling the whole frame edge to edge, sparkling facets catching the light, the most detailed cluster in the centre of the frame, bright cool morning light from the upper left, soft white and pale aqua tones with tiny apricot glints. Fresh, clean, premium, photorealistic, sharp focus in the centre. No containers, no gel, no hands, no text, no logos.

**P10v · V5 · FALLBACK ONLY (the loops are code; use for one ingredient only if its code loop doesn't convince) (start = end A8, 6–8 s)** > Start and end on the reference image so the clip loops seamlessly. Locked camera. Light slowly travels across the crystals so their facets glint in turn, the thin water layer shimmers gently, returning to the exact starting state at the end. One continuous shot, no cuts, no hands, no text, no logos.

**P11 · A9 apricot kernels (16:9: the subject in the centre of the frame, it fills the frame; attach `raw/ing-hyaluronic.jpg` + `raw/ing-niacinamide.jpg` as style references for light and colour only)**
> Match the light, colour and mood of the reference images exactly (bright, soft, clear aqua and soft white with warm apricot reflections), but not their subjects. Extreme macro of a few apricot kernels and two halved apricot pits resting in a shallow pool of clear golden apricot-kernel oil on pale aqua glass, the oil glossy and translucent with small round oil droplets, the kernels grouped in the exact centre of the frame with calm space around them, bright cool morning light from the upper left, warm apricot-gold oil against soft white and pale aqua. Fresh, clean, premium, photorealistic, sharp focus in the centre. No fruit flesh, no leaves, no containers, no hands, no text, no logos.

**P11v · V6 · FALLBACK ONLY (the loops are code; use for one ingredient only if its code loop doesn't convince) (start = end A9, 6–8 s)** > Start and end on the reference image so the clip loops seamlessly. Locked camera. A thin film of golden oil drifts slowly over the kernels, small oil droplets glide and catch the light, returning to the exact starting state at the end. One continuous shot, no cuts, no hands, no text, no logos.

**P12 · A10 petals on water (16:9: the petals in the centre of the frame; attach `raw/ing-hyaluronic.jpg` + `raw/ing-niacinamide.jpg` + `raw/ing-apricot.jpg` as style references for light and colour only)**
> Match the light, colour and mood of the reference images exactly (bright, soft, clear aqua and soft white with warm apricot reflections), but not their subjects. Top-down macro of three or four soft white and pale apricot rose petals floating on clear, still water over pale aqua glass, a few tiny water beads resting on the petals, the petals grouped in the exact centre of the frame with calm open water around them, soft caustic light patterns on the glass below the water, bright cool morning light from the upper left. Fresh, calm, premium, photorealistic, sharp focus on the petals. No flowers or stems, no leaves, no containers, no hands, no text, no logos.

**P12v · V7 · FALLBACK ONLY (the loops are code; use for one ingredient only if its code loop doesn't convince) (start = end A10, 6–8 s)** > Start and end on the reference image so the clip loops seamlessly. Locked camera, top-down. The petals turn and drift very slowly on gently rippling water, soft caustic light moves over the glass below, returning to the exact starting state at the end. One continuous shot, no cuts, no hands, no text, no logos.

### Still to decide / generate
- Run the Blender script first and check the three models from all sides (lesson: check a model before using it). A1 and A5 copy that bottle; regenerate A1 before spending V1 if the bottle drifts.
- Total: 10 Nano Banana stills + 1 Veo film (V1; V2, V3 and V4–V7 are code) + 3 Blender models.

## 7. Copy (draft)

- **Hero:** Dew. / Drop. / Glow. · "One drop of morning, made to last all day." · Dew Drop Serum · from ₹1,149 · [Shop the serum]
- **Ripple chapters:** One drop. / Three depths. / All-day dew. · captions: "Lands light." · "Water held at three depths of skin." · "Still dewy at 8 pm."
- **Ingredients:** "Four actives. Nothing loud."
- **Ritual:** "Morning. Night. Three drops each." · AM Cleanse · 3 drops · SPF │ PM Cleanse · 3 drops · Seal
- **Before → after:** "Twenty-eight mornings, side by side." · Day 1 / Day 28
- **Results:** "Measured softly." · footnote "Sample figures for a concept website."
- **Reviews:** "Said softly." · first names + cities only (e.g. "Ananya, Pune")
- **Shop:** "The range." · Dew Drop Serum 30 ml ₹1,149 / 50 ml ₹1,690 · Morning Mist 100 ml ₹749 · Night Dew balm 50 g ₹1,290
- **Footer:** "Skin, after rain." · DEWLAB. · "Concept website by Triozen Tech"

---

## 8. Record timeline (`?record=1`, as built in Round 2)

| Stop | Move (s) | Hold (s) | What plays |
|---|---|---|---|
| Hero | 0 | 1.0 | fog lift, words condense, film loop, glide light on the bead |
| Ripple (top → pin end) | 2.0 → 5.6 | | rings + chapter swaps + caustics; the drop falls into the centre |
| Actives | 2.2 | | the drop's rebound splits into four beads |
| Ritual (top → pin end) | 1.8 → 4.6 | | morning → dusk, steps swap, the drop rides the bar |
| Before / after | 1.8 | 2.0 | the sweep (starts during the arrival) flows into a small resting drift |
| Results · Reviews | 2.0 · 1.8 | | the drop fills gauge 2, then sits by the sharp review |
| Shop | 2.0 | 3.6 | the hands-free script + Add to bag → Bag 1 |
| Footer (bottom) | 2.2 | 1.2 | the drop lands as the full stop; the liquid breathes and a sheen sweeps the letters |

About 34 s after the loader (37 s reel). Every resting screen has coarse motion (lessons 55, 70): broad light bands glide over the loader fog, the hero bead, the shop disc and the footer.

**Round 3 notes (as built):** the Ripple title bends with its own gentle lens wave (low strength, low frequency, slope well under 1 px/px), separate from the water's ring wave, so letters never tear. Every pane that can rest on camera carries a slow sea-glass light glide **behind** its content (loader fog, hero bead, before/after, reviews, shop disc, footer): coarse enough for the record check, never over text.

---

## 9. Final (Round 5)

- **Reel:** `recordings/day-12-dewlab-final.mp4`, 1440×900, 37.9 s (scroll 34.4 s after the loader), PASS (freezedetect + frame-diff, ~58 fps).
- **Cover:** `recordings/day-12-cover.jpg` (niche SKINCARE, accent #EE7A3B → #D26C35 for contrast, object = the Blender serum cut-out rendered at 2160² for a sharp 2× print, hero = the `?static=1` screenshot).
- **Polish in Round 5:** the before/after soak only brightens (Day 28 is lifted to at least Day 1's brightness where its photo is darker; max darkening vs Day 1 in any sweep frame ≈ 7/255 = the divider's soft shadow); shop titles crossfade whole; the turntable stops drawing off screen.
- **Weight:** images 3.4 MB (all WebP), hero loop 0.47 MB, turntables 2.8 MB of that, no three.js on the page.
- **After the final review:** the Day 28 still's low-frequency tone was evened out (`scripts/skin_webp.py`: the photo's big brown shadow patches flattened, shading spread 31 → 11 grey levels, pores and beads kept; same crop, still pixel-aligned), and the shop turntable spins one turn in ~4 s on camera only. Final reel re-recorded: 38.0 s, PASS. The Blender turntable PNGs are git-ignored (they re-render with `--turntable`); the WebP frames on the site are tracked.

