# Discombobulate — Claude Code Build Chunks
### Feed these in order. Wait for each chunk to complete before sending the next.
### Start session with: `claude --model opusplan`

---

## ⚠️ Before You Start

Drop your full PRD file into the repo root as `CLAUDE.md` before the first prompt. Claude Code reads this automatically as project context on every step — you won't need to re-explain the project between chunks.

```bash
cp discombobulate-PRD.md CLAUDE.md
```

---

## CHUNK 01 — Project Scaffold + Design System

> **Goal:** Repo structure, all design tokens, font loading, CSS reset, global utilities. Nothing visual yet — just the foundation everything else builds on.

```
You are building "Discombobulate." — a single-page interactive narrative 
experience for GitHub Pages. Vanilla HTML, CSS, JS only. No framework, 
no build step.

Set up the full project scaffold:

FOLDER STRUCTURE:
discombobulate/
├── index.html
├── assets/
│   ├── mp4/          (empty — MP4s added manually)
│   ├── audio/        (empty — audio sprite added manually)
│   └── fonts/        (Redaction font files go here)
├── data/
│   └── keywords-cache.json   (placeholder empty object {} for now)
├── css/
│   ├── tokens.css    (all design tokens)
│   ├── reset.css     (minimal reset)
│   └── main.css      (global layout, typography)
├── js/
│   ├── main.js       (app init, screen manager)
│   ├── nav.js        (keyboard + scroll navigation)
│   ├── audio.js      (Howler setup — stubbed, no sounds yet)
│   └── data.js       (data loading — stubbed)
└── CLAUDE.md

DESIGN TOKENS (css/tokens.css):
--font-display: 'Redaction', serif;
--font-body: 'Space Grotesk', sans-serif;
--font-mono: 'Space Grotesk Mono', monospace;
--color-bg: #0A0A0A;
--color-surface: #111111;
--color-border: #2A2A2A;
--color-text-primary: #EEEEEE;
--color-text-muted: #666666;
--color-accent-cyan: #4FC3F7;      /* The Screen */
--color-accent-green: #AEEA00;     /* The Body */
--color-accent-amber: #FFB300;     /* Control */
--color-accent-red: #F44336;       /* Inner Life */
--color-accent-violet: #9C27B0;    /* Power & Voice */
--color-accent-grey: #9E9E9E;      /* The Simulation */
--color-accent-orange: #FF5722;    /* The Cage */
--color-accent-teal: #26A69A;      /* Respite */
--radius: 2px;
--transition-soft: 600ms ease-out;
--transition-fast: 200ms ease;
--transition-modal: 300ms ease-out;

FONTS:
Load Redaction 10, 50, 70, 100 from assets/fonts/ as @font-face.
Load Space Grotesk and Space Grotesk Mono from Google Fonts.

INDEX.HTML STRUCTURE:
- <head> with all CSS, font preloads
- <body> with:
  - #global-nav (top bar: "GAZE ECONOMY" left, audio toggle [♪] right)
  - #screen-container (holds all 6 screens as sections)
  - #dot-nav (6 dots, bottom centre, persistent)
  - #modal-overlay (hidden, for district + BTS modals)
- All screen sections present as empty <section id="screen-0N"> placeholders
- Scripts loaded at bottom

SCREEN MANAGER (js/main.js):
- currentScreen = 0
- totalScreens = 6
- goTo(n) function: adds/removes .active class, updates dot nav
- Screens transition with opacity 0→1, 600ms ease-out
- Only one screen visible at a time

NAV (js/nav.js):
- Arrow key left/right: previous/next screen
- Scroll down/up: next/previous screen (debounced 800ms)
- On-screen arrow buttons (rendered inside each screen)
- Dot clicks navigate directly

AUDIO TOGGLE (js/audio.js stub):
- Button #audio-toggle in #global-nav
- Default state: OFF (muted)
- Reads/writes localStorage key 'discombobulate_audio'
- If prefers-reduced-motion detected → force OFF
- Toggle switches between ♪ and ♪̶ icon
- Howler not loaded yet — just the toggle state logic

Do not add any screen content yet. Scaffold only.
Confirm the folder structure and all files created.
```

---

## CHUNK 02 — Screen 01: Intro

> **Goal:** The opening screen. Matrix rain canvas, Redaction weight cycling, nav pill, accessibility warning modal. This screen has no MP4 background — it's pure CSS/canvas.

```
Build Screen 01 — the INTRO screen.

BACKGROUND — Matrix Rain Canvas:
- Full-viewport <canvas id="matrix-canvas"> behind all content
- Falling squares (NOT characters) — 8×8px blocks
- Colour: #00FF41 with varying opacity 0.08–0.55 per column
- New blocks spawn at top, fall at varying speeds (2–5px per frame)
- Each column independent, randomised start delay
- Runs as requestAnimationFrame loop
- Stops if global animation toggle is OFF or prefers-reduced-motion

HEADLINE — Redaction Weight Cycling:
- Text: "Discombobulate."
- Cycles through: Redaction 10 → Redaction 50 → Redaction 70 → Redaction 100
- Each weight held for 800ms, crossfade between weights 200ms
  (opacity out/in on two overlaid <span> elements)
- Loop is infinite
- Font size: clamp(4rem, 8vw, 9rem)
- Colour: var(--color-text-primary)
- Effect reads as: blur/pixelated → sharp → blurrier again

SUBTITLE:
- "A visual archive of how internet culture codified reality during COVID-19"
- Font: var(--font-body), 1rem, var(--color-text-muted)
- Fades in 400ms after page load, 600ms delay

NAV PILL:
- Text: "← Use arrow keys to navigate →"
- Font: var(--font-mono), 0.85rem
- Pill border: 1px solid var(--color-accent-cyan)
- On hover: border pulses opacity 0→1, 1.5s CSS keyframe loop
- Click or keyboard → goTo(1)

ACCESSIBILITY WARNING:
- Gradient-border pill: magenta #FF00FF → yellow #FFFF00
- Warning triangle icon (Unicode ⚠ or inline SVG)
- Text: "This experience contains flashing lights and looping images."
- On click → opens full-screen modal #a11y-modal
- Modal has: warning text, [I understand, continue] button, [reduce motion] toggle
- [reduce motion] toggle adds class .reduced-motion to <body>
  which disables all CSS animations globally via:
  body.reduced-motion *, body.reduced-motion *::before, 
  body.reduced-motion *::after { animation: none !important; 
  transition: none !important; }
- Modal must be acknowledged before user can navigate forward
  (disable nav pill and arrow keys until modal is dismissed)

ENTRY ANIMATION sequence (on page load):
0ms    — matrix rain starts
300ms  — headline fades in
700ms  — subtitle fades in  
1000ms — nav pill fades in
1300ms — accessibility warning fades in

All elements: position centred, flex column layout.
```

---

## CHUNK 03 — Screens 02, 03, 04: Narrative Screens

> **Goal:** The three story build-up screens. Each has a looping MP4 background at 0.5x speed, mixed-typeface headline, body copy, and a GIF/image panel with pixelated reveal. Build all three in one pass — they share the same component pattern.

```
Build Screens 02, 03, and 04 — the three narrative screens.
These share a common layout pattern with per-screen content and MP4 backgrounds.

SHARED COMPONENT — Video Background:
- Full-viewport <video> per screen: autoplay, muted, loop, playsinline
- object-fit: cover, position: absolute, z-index: 0
- After load: video.playbackRate = 0.5 (must be JS, not HTML attribute)
- Dark overlay <div> sits above video, below content:
  Screen 02: rgba(0,0,0,0.45)  ← warm tones bleed through
  Screen 03: rgba(0,0,0,0.50)  ← heavier, submersion feel
  Screen 04: rgba(0,0,0,0.40)  ← lightest, most colour visible
- Video sources:
  Screen 02: assets/mp4/Video_02.mp4
  Screen 03: assets/mp4/Video_03.mp4
  Screen 04: assets/mp4/Video_04.mp4
- If video fails to load, fall back to plain var(--color-bg) background

SHARED LAYOUT — Content Layer (z-index: 1, above video):
- Two-column flex: text column (left or right per screen) + media column
- Screen 02: text LEFT, media RIGHT
- Screen 03: text RIGHT, media LEFT (swap columns)
- Screen 04: text LEFT, media RIGHT
- Columns: ~45% / 55% split, aligned centre vertically
- Full viewport height, padding 8vw horizontal

TEXT COLUMN:
- Eyebrow label: screen number + phase
  e.g. "01 / PRE-COVID" — font-mono, 10px, muted, uppercase
- Headline: mixed typeface (see per-screen below)
- Body copy: ~60–80 words, font-body, 1rem, line-height 1.7
  (placeholder lorem text for now — copy to be filled in later)
- All text: fade in on screen entry (600ms ease-out)
  Headline first, body 200ms after

MEDIA COLUMN — Pixelated Reveal:
- <canvas> element used for the reveal effect (not <img> directly)
- On screen entry:
  1. Draw the image/GIF onto canvas at 8×8px effective resolution
     (scale down to 8px grid, scale back up with imageSmoothingEnabled: false)
  2. Over 800ms, interpolate pixel block size from 8px → 1px (full res)
     Use requestAnimationFrame, ease-out curve
  3. Final state: full resolution image rendered on canvas
- Image sources: same pixel-art assets from Figma (placeholder PNGs for now)
  Screen 02: assets/img/screen-02-still.png
  Screen 03: assets/img/screen-03-still.png
  Screen 04: assets/img/screen-04-still.png
- Canvas sized to: max 560px wide, aspect-ratio preserved

SCREEN 02 — PRE-COVID:
Eyebrow: "01 / PRE-COVID"
Headline: 
  <span class="serif">Sunlight streams</span>
  <span class="italic-script">for us.</span>
  Font sizes: clamp(2.8rem, 4.5vw, 5rem)
  "Sunlight streams" → Redaction 100
  "for us." → Redaction 70, italic, slightly smaller

SCREEN 03 — COVID ENTERS:
Eyebrow: "02 / COVID ENTERS"
Headline:
  <span class="serif">The white boxes</span>
  <span class="italic-script">drown me in.</span>
  "The white boxes" → Redaction 100
  "drown me in." → Redaction 50, italic, indented 2rem

SCREEN 04 — COVID PREVAILS:
Eyebrow: "03 / COVID PREVAILS"
Headline:
  "The " → Redaction 100
  <span class="glitch-word">network</span> → cycles Redaction weights 
    on screen entry (same mechanism as Screen 01 title, 3 cycles then settles 
    on Redaction 70)
  " is the message." → Redaction 100
Body: slightly denser — this is the conceptual pivot screen. 
  Background overlay is 0.40 (lightest) — let the chaos through.

SCREEN TRANSITIONS:
- Entering a narrative screen: video starts playing immediately
- Text and media animate in sequence (headline → body → media, 200ms apart)
- Leaving: simple opacity fade 600ms — no special exit animation
- Dot nav updates on entry
```

---

## CHUNK 04 — Screen 05: Districts

> **Goal:** The main data viz screen. MP4 background at 0.5x, 8 district cards floating at predefined positions, hover/click interactions, fade-out-others on click behaviour. No modal content yet — that's Chunk 05.

```
Build Screen 05 — DISTRICTS screen.

VIDEO BACKGROUND:
- src: assets/mp4/Video_05.mp4
- Same pattern as Chunk 03: autoplay, muted, loop, playsinline,
  playbackRate = 0.5, object-fit cover
- NO dark overlay — cards carry their own dark backgrounds
- Video keeps playing when district modal opens (do not pause)

SCREEN LABEL (top-left, z-index: 2):
- "GAZE ECONOMY" already in #global-nav (persistent)
- Add below it: "03 / DISTRICTS" — font-mono, 10px, uppercase, opacity 0.6
- Instruction text: "hover to reveal · click to enter"
  font-mono, 9px, opacity 0.4, fades in 1s after screen entry

UI CONTROLS (top-left below instruction):
- [⏸ Pause] toggle: pauses Video_05.mp4 + sets .animations-paused on container
  body.animations-paused * { animation-play-state: paused !important; }
- [B&W] toggle: adds .bw-mode class
  .bw-mode .district-card { filter: grayscale(1); }
  Hover still works — remove grayscale on hover even in bw-mode

DISTRICT CARDS — 8 total:
Each card: position: fixed (relative to viewport)
Size: 180px × 220px at 1440px viewport
Use clamp() to scale: width: clamp(140px, 12.5vw, 180px)

Card structure:
  <div class="district-card" data-district="N" style="top:X%; left:Y%">
    <div class="card-symbol">  ← SVG symbol, 80×80px </div>
    <div class="card-name">DISTRICT NAME</div>
    <div class="card-keyword">primary keyword</div>
    <div class="card-bar">
      <div class="bar-fill" style="width: {codification_score}%"></div>
      <span>codification score</span>
    </div>
  </div>

Card styling:
  background: rgba(8,8,8,0.82)
  backdrop-filter: blur(2px)
  border: 1px solid rgba(255,255,255,0.06)
  padding: 16px
  cursor: pointer

PREDEFINED POSITIONS (top %, left %):
  District 1 — The Screen:      top: 6%,  left: 7%
  District 2 — The Body:        top: 5%,  left: 24%
  District 3 — Control:         top: 7%,  left: 63%
  District 4 — Inner Life:      top: 6%,  left: 80%
  District 5 — Power & Voice:   top: 36%, left: 5%
  District 6 — The Simulation:  top: 38%, left: 79%
  District 7 — The Cage:        top: 65%, left: 7%
  District 8 — Respite:         top: 66%, left: 79%

DISTRICT DATA (hardcode for now, data layer added in Chunk 07):
  1: name="THE SCREEN",      colour=#4FC3F7, keyword="selfie",          score=78
  2: name="THE BODY",        colour=#AEEA00, keyword="pandemic",        score=94
  3: name="CONTROL",         colour=#FFB300, keyword="lockdown",        score=88
  4: name="INNER LIFE",      colour=#F44336, keyword="loneliness",      score=71
  5: name="POWER & VOICE",   colour=#9C27B0, keyword="misinformation",  score=83
  6: name="THE SIMULATION",  colour=#9E9E9E, keyword="deepfake",        score=52
  7: name="THE CAGE",        colour=#FF5722, keyword="isolation",       score=86
  8: name="RESPITE",         colour=#26A69A, keyword="hope",            score=61

SVG SYMBOLS — draw in outline style, stroke only (no fill), 
strokeWidth 1.5, colour = district colour on hover / #444 default:
  1 The Screen:      Eye shape — ellipse iris + pupil circle + eyelid curves
  2 The Body:        Virus — circle centre + 8 spoke lines + small circles at tips
  3 Control:         Padlock — rectangle body + arch top
  4 Inner Life:      Heart outline + small triangle inside lower half
  5 Power & Voice:   3 stacked rectangles, decreasing width (broadcast/signal)
  6 The Simulation:  Circle with a gap (broken ring) + small offset inner ring
  7 The Cage:        4 concentric square outlines
  8 Respite:         Branching lines from a central point (3 levels, organic)

HOVER INTERACTION:
- Symbol: stroke colour → district colour, transition 200ms
- Card: box-shadow: 0 0 20px {district-colour-at-30%-opacity}
- Cursor: pointer
- Other cards: no change

CLICK INTERACTION:
1. Add class .card-selected to clicked card (stays in place, no movement)
2. All other cards: opacity → 0, transition 400ms ease-out
   (add class .card-hidden to each)
3. Open District Detail Modal (built in Chunk 05)
   Pass district ID to modal

MODAL CLOSE → RESTORE:
- Remove .card-hidden from all cards
- Cards fade back in: opacity → 1, 500ms ease-in
- Stagger: each card 50ms apart (use transition-delay)
- Remove .card-selected from clicked card
- Return focus to clicked card

RESPONSIVE (below 768px):
- Switch to vertical scroll list (cards stack, fixed position disabled)
- MP4 still plays in background
- Modal becomes full-screen sheet

ENTRY ANIMATION:
On Screen 05 activation:
- Cards start at opacity 0, translateY(8px)
- Stagger in: each card 80ms apart, 400ms ease-out
- Total stagger across 8 cards: ~640ms
```

---

## CHUNK 05 — District Detail Modal

> **Goal:** The modal that opens when a district card is clicked. D3 orbit visualisation left, editorial data right. Navigation between districts inside the modal.

```
Build the DISTRICT DETAIL MODAL.
This overlays Screen 05. The MP4 background behind it keeps playing.

MODAL STRUCTURE (#district-modal):
  position: fixed, inset: 0, z-index: 100
  display: grid, grid-template-columns: 55fr 45fr
  background: rgba(8,8,8,0.94)
  backdrop-filter: blur(12px)

MODAL OPEN ANIMATION:
  transform: scale(0.94) → scale(1.0)
  opacity: 0 → 1
  duration: 300ms, ease-out
  Backdrop blurs in simultaneously

MODAL CLOSE:
  Triggered by: [✕] button, Escape key
  Animation: opacity 1 → 0, 200ms
  On complete: restore district cards (see Chunk 04 restore logic)
  Focus returns to the card that triggered open

MODAL HEADER (top of modal, full width):
  Left: district number + name  e.g. "01 / THE SCREEN"
         font-mono, 11px, uppercase, district colour
  Right: [✕] close button — font-mono, 16px, opacity 0.6 → 1 on hover
  Bottom border: 1px solid var(--color-border)

MODAL NAVIGATION (inside modal, below header):
  [←] prev district    [→] next district
  Cycles through districts 1→8→1 without closing modal
  Transition between districts: content fades out/in 200ms
  District card on Screen 05 behind: updates .card-selected accordingly

LEFT PANEL — D3 Orbit Visualisation:
  padding: 40px
  height: 100%
  position: relative

  Central symbol:
  - Same SVG symbol as the district card, but 120×120px
  - District colour fill (not just stroke)
  - Subtle idle pulse: scale 1.0→1.04→1.0, 3s loop

  Keyword nodes orbit the central symbol:
  - Use D3 force simulation with a custom circular orbit layout
  - Each keyword in the district = one node
  - Node size (radius): scaled by giphy_total_count
    min radius: 20px, max radius: 50px
    (use hardcoded counts from keywords-cache.json — Chunk 07 wires real data)
  - Nodes rotate around centre: ~30s per full revolution
    Animate using requestAnimationFrame + angle offset per node
    Stagger start angles evenly: angle = (i / total) * 2π
  - Node appearance:
    Rectangle (not circle): width proportional to radius, height 28px
    background: rgba(255,255,255,0.06)
    border: 1px solid district-colour at 40% opacity
    Text inside: keyword term, font-mono, 9px
  - On node hover:
    Tooltip appears: term, count, codification score, phase label
    Node border → full district colour

  Codification score bar (bottom of left panel):
    Label: "CODIFICATION SCORE" font-mono 9px muted
    Bar: full width, height 3px, background var(--color-border)
    Fill: district colour, width = score%
    Animated fill on modal open: 0% → score%, 800ms ease-out

RIGHT PANEL — Data:
  padding: 40px
  border-left: 1px solid var(--color-border)

  District name: font-display (Redaction 100), clamp(2.5rem,3.5vw,4rem)
  District colour applied to name

  Editorial write-up: 
    ~70 words, font-body, 1rem, line-height 1.75
    Placeholder text for now — will be filled per district later
    Format: "District {N} explores how the GIF became..."

  Three data stat columns:
    Stat 1: TOTAL GIFs INDEXED   → sum of giphy_total_count for district keywords
    Stat 2: AVG CODIFICATION     → average score across keywords
    Stat 3: PEAK PHASE           → which phase had highest density
    
    Each stat:
      Value: font-mono, 2rem, district colour
      Label: font-mono, 9px, muted, uppercase
      Separator: 1px solid var(--color-border)

  Phase timeline strip (below stats):
    4 phase labels in a row: PRE-COVID / ONSET / PEAK / AFTERMATH
    Active phase highlighted in district colour
    font-mono, 8px

HARDCODED DISTRICT CONTENT (placeholder, real data in Chunk 07):
  Use keywords from PRD Section 4 districts table.
  Counts: use the score field × 50 as a rough total_count proxy for now.
  Write-ups: single placeholder sentence per district.

KEYBOARD TRAP:
  While modal is open:
  - Tab cycles through: [←] [→] node elements [✕]
  - Arrow keys: ← → navigate districts (not screens)
  - Escape: closes modal
  - Prevent arrow keys from firing screen navigation while modal open
```

---

## CHUNK 06 — Screen 06: Closing + Behind the Scenes Modal

> **Goal:** The final screen — heart + eye animation, text sequence, two CTAs. Plus the BTS modal with D3 research flowmap.

```
Build Screen 06 — CLOSING screen — and the BEHIND THE SCENES MODAL.

SCREEN 06 — CLOSING:

Background: plain var(--color-bg) — no MP4. 
The visual IS the content.

CENTRE COMPOSITION — Heart + Eye overlap (SVG):
  Container: 500px wide, centred on screen
  
  Heart SVG (left, z-index: 1):
    Colour: #F44336 (stroke + 20% fill opacity)
    Size: ~280px
    CSS animation: heartbeat
      @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        14%       { transform: scale(1.08); }
        28%       { transform: scale(1); }
        42%       { transform: scale(1.05); }
        70%       { transform: scale(1); }
      }
      animation-duration: 1.35s, infinite
    Position: left half of container, overlapping centre by 30%

  Eye SVG (right, z-index: 2):
    Colour: #4FC3F7 (stroke + 10% fill opacity)
    Size: ~220px wide (eye is wider than tall)
    Iris: separate circle element, follows cursor
      On mousemove: calculate angle from eye centre to cursor
      Move iris max 18px from eye centre
      Use lerp: irisPos += (target - irisPos) * 0.09 each frame
      requestAnimationFrame loop while screen is active
    Position: right half, overlapping heart by 30%

  GIF tile boxes:
    Small rectangles (40×30px) orbit the combined shape
    8 boxes total, slow rotation (~45s revolution)
    background: rgba(255,255,255,0.04)
    border: 1px solid rgba(255,255,255,0.1)
    No content inside (placeholder for actual GIF thumbnails later)

LABELS below composition:
  <span style="color:#F44336">together</span>
  <span style="color:var(--color-text-muted)"> × </span>
  <span style="color:#4FC3F7">loneliness</span>
  font-display Redaction 70, 1.8rem

  Subtext: "two words, one moment, the same screen"
  font-body, 0.9rem, muted, italic

  Poetic line: "where does one end" / "and the other begin?"
  font-display Redaction 50, 1.4rem, centre-aligned
  Line break between the two phrases

FADE-IN SEQUENCE (on screen entry):
  0ms    — heart + eye composition fades in (600ms)
  1000ms — labels fade in (400ms)
  2000ms — subtext fades in (400ms)
  2500ms — poetic line fades in (400ms)
  4000ms — CTAs fade in (400ms)

CTAs (bottom-left, subtle):
  [↺ Restart experience]
    font-mono, 0.8rem, opacity 0.5 → 0.9 on hover
    On click: goTo(0), reset all state

  [↗ Behind the scenes]
    font-mono, 0.8rem, opacity 0.5 → 0.9 on hover
    On click: open #bts-modal

---

BEHIND THE SCENES MODAL (#bts-modal):

Triggered by [↗ Behind the scenes] CTA.
Full-viewport, scrollable, dark background.

  position: fixed, inset: 0, z-index: 100
  background: rgba(8,8,8,0.97)
  overflow-y: auto
  padding: 80px clamp(40px,8vw,160px)

Open animation: opacity 0→1, 400ms ease-out (no scale — this is archival, calm)

SECTION 1 — Research Flowmap (D3):
  Header: "RESEARCH FRAMEWORK" — font-mono, 10px, muted, uppercase, 
          letter-spacing 0.15em
  
  D3 SVG diagram, ~700px wide, centred:
  
  Nodes (use D3 force layout, then fix positions manually):
    [McLuhan: Medium is the Message]   ← top-left
    [Baudrillard: Simulacra]           ← top-right
    [GIF as Medium]                    ← mid-left
    [GIF as Hyperreal]                 ← mid-right
    [Giphy API as Cultural Archive]    ← centre
    [37 Keywords / 4 Phases]           ← below centre
    [8 Thematic Districts]             ← bottom centre
    3 phase nodes branching from districts:
      [Pre-COVID] [COVID Onset] [COVID Peak / Aftermath]

  Node styling:
    Rectangles, rounded 2px, background var(--color-surface)
    Border: 1px solid var(--color-border)
    Text: font-mono, 9px, var(--color-text-primary)
    Theory nodes (McLuhan, Baudrillard): border colour var(--color-accent-cyan)
    District node: border colour var(--color-accent-violet)
    Phase nodes: border colour var(--color-accent-amber)

  Edges (connecting lines):
    SVG <path> elements, stroke var(--color-border), strokeWidth 1
    DRAW-ON ANIMATION on modal open:
      Use stroke-dasharray + stroke-dashoffset technique
      All edges draw simultaneously over 800ms, ease-out
      Nodes fade in after edges complete (200ms stagger)

SECTION 2 — Editorial Decisions:
  Header: "EDITORIAL DECISIONS" — same mono header style
  
  5 short paragraphs (font-body, 0.95rem, line-height 1.8, max-width 680px):
  
  Para 1 — Why Giphy:
  "We chose Giphy's total_count as our primary metric because it represents 
  the supply-side of cultural codification — how many GIFs the internet 
  produced for a feeling, not how many times those GIFs were viewed. 
  Supply reflects collective urgency: when millions of people independently 
  create GIFs for 'loneliness', the act of creation is itself the signal."

  Para 2 — The codification score:
  "The codification score (total_count / 500 × 100) is deliberately simple. 
  We capped at 500 — the maximum Giphy returns per query — not because more 
  GIFs don't exist, but because 500 already signals cultural saturation. 
  The score is not a measure of emotion. It is a measure of how thoroughly 
  a feeling has been processed into image."

  Para 3 — Keyword selection:
  "37 keywords were selected through iterative refinement. We excluded 
  political party names, brand names, and proper nouns — not because they 
  weren't culturally significant, but because they conflate political identity 
  with emotional expression. We were tracking feeling, not faction."

  Para 4 — Language limitation:
  "All API calls used lang=en. This is a significant editorial constraint: 
  it renders the archive anglophone by default. COVID was not an anglophone 
  experience. The data presented here is a window, not a mirror."

  Para 5 — Supply vs demand:
  "total_count is supply. We do not know how many times any given GIF was 
  actually viewed, shared, or felt. The archive tells us what was made. 
  What was received remains unmeasured."

SECTION 3 — Credits:
  Header: "CREDITS" — mono header style
  
  Simple two-column list, font-mono, 0.85rem:
  Research & Design     [Your name]
  Theory                McLuhan (1964) · Baudrillard (1981)
  Data Source           Giphy API · Giphy Search Endpoint
  Visualisation         D3.js v7
  Animation             GSAP · CSS Keyframes
  Audio                 Howler.js · ZzFX (Frank Force)
  Typefaces             Redaction (Forest Graphic) · Space Grotesk (Florian Karsten)
  Hosting               GitHub Pages

  Separator line above credits: 1px solid var(--color-border)

Close button [✕]: top-right, fixed inside modal
Escape key: closes modal
On close: opacity 1→0, 300ms
```

---

## CHUNK 07 — Data Layer + Giphy API

> **Goal:** Wire up the real keyword data from keywords-cache.json. Add the build-time pre-fetch script. Add runtime GIF fetching on keyword node click. Replace all hardcoded placeholder values in the orbit viz and data stats.

```
Build the DATA LAYER for Discombobulate.

PART A — keywords-cache.json structure:
The file at data/keywords-cache.json should have this shape:
{
  "fetched_at": 1234567890000,
  "keywords": {
    "lockdown": { 
      "total_count": 4821, 
      "codification_score": 96.4,
      "phase": "covid_onset",
      "district": 3,
      "district_name": "Control"
    },
    "loneliness": { ... },
    ...
  }
}

Create a complete keywords-cache.json with ALL 37 keywords from the 
project's summary.csv data. Use the giphy_total_count and 
codification_score values from that file.
Map each keyword to its correct district (1–8) per the PRD district table.

PART B — data.js (js/data.js):
loadData() function:
  1. Try fetch('data/keywords-cache.json')
  2. On success: parse and return
  3. On failure: return STATIC_FALLBACK (inline object with same shape,
     use the values from summary.csv baked in — user never sees error)

  Check cache age via localStorage:
  const lastFetched = localStorage.getItem('discombobulate_cache_ts');
  const isStale = !lastFetched || Date.now() - Number(lastFetched) > 86_400_000;
  if (isStale) backgroundRefresh(); // non-blocking, see below

  backgroundRefresh():
    Fetches from Giphy API for each keyword silently in background
    Uses: limit=1, rating=pg, lang=en, 
          fields=id (pagination.total_count always returns regardless)
    150ms gap between each keyword request (rate limit safety)
    On complete: update keywords-cache.json via… 
    Note: GitHub Pages is static — background refresh updates in-memory only,
    does not write to file. Log a console.info() with updated values.
    localStorage.setItem('discombobulate_cache_ts', Date.now())

PART C — Wire data into District Detail Modal:
In js/modal-district.js (or extend existing modal code):

  When modal opens for district N:
  1. Filter keywords where district === N
  2. Pass to D3 orbit: node radius = scale(total_count, [0, 5000], [20, 50])
  3. Calculate and display:
     - Total GIFs: sum of total_count for district keywords
     - Avg codification: mean of codification_score values
     - Peak phase: phase with highest avg codification_score
  4. Replace placeholder text in right panel stats

PART D — Runtime GIF fetch on keyword node click:
When user clicks a keyword node in the orbit:

  GET https://api.giphy.com/v1/gifs/search
    ?api_key={GIPHY_API_KEY}
    &q={keyword}
    &limit=1
    &rating=pg
    &lang=en
    &fields=id,images.fixed_width,images.fixed_width_still,analytics

  API key: read from window.GIPHY_API_KEY 
  (set this as a global var in a separate <script> in index.html
  that Claude Code should leave empty: window.GIPHY_API_KEY = '';
  User fills this in manually before deploying)

  On response:
  1. Extract gif = data[0]
  2. Show gif.images.fixed_width_still.url immediately (static first frame)
  3. Fetch gif.images.fixed_width.webp (or .mp4 as fallback)
  4. Apply pixelated reveal: same canvas technique as narrative screen images
     8×8px block resolution → full res over 800ms
  5. Fire analytics pingback (fire-and-forget):
     const pingUrl = new URL(gif.analytics.onload.url);
     pingUrl.searchParams.append('ts', Date.now().toString());
     fetch(pingUrl.toString());

  Show GIF in a small panel below the keyword node tooltip.
  Close panel on click-away or next node click.

  Random ID for session (call once on app init):
  GET https://api.giphy.com/v1/randomid?api_key={KEY}
  Store in window.giphySessionId, append to all pingback calls.

PART E — Build-time pre-fetch script (scripts/fetch-giphy-data.js):
  Node.js script, run manually before deploying: 
  node scripts/fetch-giphy-data.js

  Reads all keywords from a local keywords-list.js array
  For each keyword:
    fetch Giphy search with limit=1, rating=pg, lang=en, fields=id
    Extract pagination.total_count
    Calculate codification_score = Math.min((total_count / 500) * 100, 100)
    await sleep(150) between requests
  Write result to data/keywords-cache.json with fetched_at timestamp
  
  Requires env var: GIPHY_API_KEY=your_key_here
  Add .env to .gitignore
  Add README note: "Run node scripts/fetch-giphy-data.js before deploy"
```

---

## CHUNK 08 — Sound Design

> **Goal:** Howler.js sprite integration + ZzFX procedural effects. Wire all sounds to their triggers. Audio toggle fully functional.

```
Build the SOUND LAYER for Discombobulate.

SETUP:
Load Howler.js from CDN in index.html:
<script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>

Load ZzFX inline (it's a single small function):
<script>
// ZzFX by Frank Force — https://killedbyapixel.github.io/ZzFX/
// Paste the minified zzfx() function here
</script>

HOWLER SPRITE (js/audio.js):
The sprite file assets/audio/sfx-sprite.webm (+ .mp3 fallback) 
will be provided by the user. For now, stub out the Howl object with 
sprite timestamps as comments — Claude Code should generate the full 
Howler setup so it's ready to wire once the audio file exists:

const SFX = new Howl({
  src: ['assets/audio/sfx-sprite.webm', 'assets/audio/sfx-sprite.mp3'],
  sprite: {
    crtHum:          [0,    1200],  // Screen 01→02: warm CRT hum
    staticBurst:     [1500, 500],   // Screen 02→03: signal drop
    dialup:          [2200, 1200],  // Screen 03→04: modem fragment
    sweepBeep:       [3600, 600],   // Screen 04→05: digital scan
    dissolve:        [4400, 1000],  // Screen 05→06: low resonant fade
    districtOpen:    [5600, 400],   // District modal open
    districtClose:   [6200, 300],   // District modal close
    heartbeat:       [6700, 1350],  // Closing screen loop (loop: true)
    paperRustle:     [8200, 500],   // BTS modal open
    restart:         [8900, 400],   // Restart button
  },
  onloaderror: () => console.warn('Audio sprite failed to load — continuing silently')
});

ZZFX SOUNDS (generated, no file needed):
Define these as named functions:

const sfxDistrictHover = () => 
  zzfx(...[.4,,220,,,.01,3,1.2,,,,,,1]); // subtle tick

const sfxNodeHover = (districtIndex) => {
  // pitch varies by district 0–7 → maps to frequencies 200–480Hz
  const freq = 200 + (districtIndex * 40);
  zzfx(...[.3,,freq,,,.01,3,.8,,,,,,1]);
};

const sfxGifReveal = () =>
  zzfx(...[.5,,80,.05,.1,.15,4,.5,,,,,,.3,,.1]); // static crackle

const sfxRewind = () =>
  zzfx(...[.4,,440,.1,.05,.05,3,2,,,-300,.1]); // descending sweep

AUDIO TRIGGER MAP — wire these calls throughout the codebase:

Screen transitions (in nav.js goTo() function):
  goTo(0→1): play nothing (first nav)
  goTo(1→2): SFX.play('crtHum')
  goTo(2→3): SFX.play('staticBurst')
  goTo(3→4): SFX.play('dialup')
  goTo(4→5): SFX.play('sweepBeep')
  goTo(5→0 or 5→any close): SFX.play('dissolve')

District interactions:
  Card hover: sfxDistrictHover()
  Card click (modal open): SFX.play('districtOpen')
  Modal [✕] close: SFX.play('districtClose')
  Keyword node hover: sfxNodeHover(districtIndex)
  GIF reveal on node click: sfxGifReveal()

Screen 06 closing:
  On screen entry: SFX.play('heartbeat') with loop:true option
    Store howlId = SFX.play('heartbeat')
    On screen exit: SFX.stop(howlId)

BTS modal:
  Modal open: SFX.play('paperRustle')
  Modal close: SFX.play('districtClose') (reuse, same register)

Restart:
  On restart click: sfxRewind()

AUDIO GATE — ALL sound calls must be wrapped:
function playSound(fn) {
  if (!audioEnabled) return;
  try { fn(); } catch(e) { /* silent fail */ }
}

Replace all direct SFX.play() and sfxX() calls above with:
playSound(() => SFX.play('crtHum'))
playSound(() => sfxDistrictHover())
etc.

AUDIO TOGGLE (finalise js/audio.js — was stubbed in Chunk 01):
- Connect toggle to Howler.mute() and audioEnabled flag
- Ensure ZzFX calls also respect audioEnabled
- Ensure heartbeat loop stops correctly when audio is toggled off mid-screen
```

---

## CHUNK 09 — Accessibility Pass + Polish

> **Goal:** Final pass — keyboard nav, focus management, ARIA labels, reduced motion, responsive tweaks, performance. No new features — just making everything solid.

```
Perform a full ACCESSIBILITY AND POLISH pass on Discombobulate.

KEYBOARD NAVIGATION audit:
- Verify: Arrow keys navigate screens (left/right) everywhere EXCEPT 
  when a modal is open (modal should trap arrow keys for district cycling)
- Verify: Tab order is logical on every screen
- Verify: Escape closes any open modal
- Verify: All interactive elements reachable by keyboard
- Verify: Dot nav dots are keyboard-focusable and activatable with Enter/Space
- Add visible focus ring: outline: 2px solid var(--color-accent-cyan), 
  outline-offset: 3px on all :focus-visible elements

ARIA LABELS:
- #audio-toggle: aria-label="Toggle sound", aria-pressed={true/false}
- Each district card: 
  role="button", aria-label="Open {district name} district"
- District modal: role="dialog", aria-modal="true", 
  aria-labelledby={district name heading id}
- BTS modal: role="dialog", aria-modal="true", aria-label="Behind the scenes"
- [✕] close buttons: aria-label="Close"
- Dot nav: role="tablist", each dot role="tab", aria-label="Screen {n}"
- Canvas elements (matrix rain, orbit viz): aria-hidden="true"
- SVG symbols: aria-hidden="true" (decorative)
- D3 orbit nodes: role="button", aria-label="{keyword} — {count} GIFs"

FOCUS MANAGEMENT:
- When district modal opens: move focus to modal [✕] button
- When district modal closes: return focus to card that triggered it
- When BTS modal opens: move focus to first focusable element inside
- When BTS modal closes: return focus to [↗ Behind the scenes] button
- Use a focusTrap() utility: 
  Intercept Tab inside modal, cycle through modal's focusable elements only

REDUCED MOTION:
Verify @media (prefers-reduced-motion: reduce) correctly:
- Stops matrix rain canvas
- Disables Redaction weight cycling (show Redaction 100 static)
- Disables pixelated reveal (show image at full res immediately)
- Disables card fade-in stagger (show all cards immediately)
- Disables D3 orbit rotation (nodes static, positioned correctly)
- Disables heartbeat CSS animation (heart shown static)
- Disables iris cursor follow (eye shown static, centred iris)
- Disables BTS flowmap draw-on animation (paths shown fully drawn)
- Forces audio OFF regardless of localStorage

PERFORMANCE:
- Verify all <video> elements have preload="none" — only load when screen 
  is about to be activated (preload on screen N-1 entry using preload="auto")
- Verify canvas loops (matrix rain, orbit) stop when screen is not active
  Use Intersection Observer or check currentScreen to pause/resume
- Verify Redaction weight cycling pauses when screen 01 is not active
- Add loading="lazy" to any <img> elements
- Ensure Howler sprite only loads after first user interaction
  (avoids autoplay policy issues in Safari)

RESPONSIVE (768px and below):
- Screen 01: headline scales down to 3rem, pill stacks vertically
- Screens 02–04: single column layout (image above, text below)
- Screen 05: district cards switch from fixed position to scrollable list
  Each card: full width, 80px height, horizontal layout (symbol left, text right)
  MP4 still plays behind
- Screen 06: composition scales to 80vw, CTAs stack vertically
- All modals: full-screen, no two-column split

FINAL CHECKS:
- Confirm all MP4 src paths resolve correctly: assets/mp4/Video_0N.mp4
- Confirm GIPHY_API_KEY placeholder is empty string in index.html 
  with a clear HTML comment: <!-- Add your Giphy API key here -->
- Confirm keywords-cache.json is populated with real data from summary.csv
- Confirm audio sprite paths are correct and gracefully handled if file missing
- Run through all 6 screens + 2 modals manually, check console for errors
- Add a simple README.md with: setup instructions, how to add API key,
  how to run the pre-fetch script, how to deploy to GitHub Pages
```

---

## Handoff Notes for Each Chunk

| Chunk | Blocks until... | Key output to verify before next |
|---|---|---|
| 01 | Nothing | Folder structure exists, tokens load, screen container visible |
| 02 | Chunk 01 | Screen 01 renders, matrix runs, font cycles, a11y modal works |
| 03 | Chunk 02 | All 3 narrative screens render with video + text layout |
| 04 | Chunk 03 | 8 cards float at correct positions, hover + click interactions work |
| 05 | Chunk 04 | Modal opens/closes correctly, D3 orbit renders with placeholder data |
| 06 | Chunk 05 | Closing screen animations work, BTS modal opens with flowmap |
| 07 | Chunk 06 | Real keyword data drives orbit node sizes + stats |
| 08 | Chunk 07 | Sounds fire on correct interactions (even if sprite file is stub) |
| 09 | Chunk 08 | Full keyboard nav works, focus traps, reduced motion respected |

---

## Quick-Reference Start Commands

```bash
# Start session
claude --model opusplan

# First message (after CLAUDE.md is in place)
"Read CLAUDE.md first, then execute Chunk 01."

# Subsequent chunks
"Chunk 01 is complete. Execute Chunk 02."

# If something breaks mid-chunk
"Stop. The [X] isn't working correctly — [describe issue]. 
Fix that before continuing the rest of Chunk N."

# Switch to Sonnet mid-session for mechanical work
/model sonnet

# Switch back to Opus for a complex problem
/model opus
```

---

*Feed one chunk at a time. Don't skip ahead.*
*If a chunk produces errors, fix them in the same session before moving on.*
*Chunk 07 requires your Giphy API key to be set before running the pre-fetch script.*
