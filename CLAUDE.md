# PRD — Discombobulate.
### A visual archive of how internet culture codified reality during COVID-19
**Project:** Gaze Economy — Discombobulate Experience  
**Version:** 0.3 (sound + modal + BTS additions)  
**Last updated:** April 2026  
**Author:** Vali  

---

## 1. Overview

**Discombobulate** is an interactive, scroll-driven narrative experience that traces how GIFs — as a cultural medium — became the emotional vocabulary of the COVID-19 era. Grounded in McLuhan's "the medium is the message" and Baudrillard's simulacra theory, it uses Giphy API data across 37+ keywords to argue that internet culture didn't just reflect the pandemic — it *codified* it into a new kind of reality.

The experience is a 7-screen linear story that opens into an explorable data viz. It lives on GitHub Pages, built as a single-page HTML/JS application.

---

## 2. Naming & Branding

| Element | Value |
|---|---|
| Title (hero) | **Discombobulate.** |
| Project / nav label | **Gaze Economy** |
| Subtitle | *A visual archive of how internet culture codified reality during COVID-19* |
| Typefaces | Redaction 10 / 50 / 70 / 100 (display), Space Grotesk (body), Space Grotesk Mono (UI/labels) |
| Colour palette | Black `#0A0A0A` base, Cyan `#4FC3F7` (Screen), Yellow-Green `#AEEA00` (Body), Amber `#FFB300` (Control), Red `#F44336` (Inner Life), Violet `#9C27B0` (Power & Voice), Grey `#9E9E9E` (Simulation) |

---

## 3. Screen Flow & Narrative Arc

```
[01] INTRO          → Discombobulate. — matrix rain, animated title
[02] PRE-COVID      → Sunlight streams for us. — warmth, CRT TV, couple
[03] COVID ENTERS   → The white boxes drown me in. — sinking, blue submersion
[04] COVID PREVAILS → The network is the message. — crowd, phones, signal noise
[05] DISTRICTS      → 03 / Districts — 8-cell interactive grid
                       ↳ [MODAL] District detail — GIF orbit + data (not a separate screen)
[06] CLOSING        → together × loneliness — heart + eye merge
                       ↳ [MODAL] Behind the scenes — research flowmap + editorial notes
```

**Emotional arc:** warmth → submersion → saturation → taxonomy → dissolution

**Navigation:** Arrow keys + scroll + on-screen arrow buttons. Dot pagination (6 dots) persistent at bottom. District detail and Behind the Scenes open as modals — they don't advance the dot pagination.

**Omnipresent UI:** A minimal audio toggle `[♪]` / `[♪̶]` sits in the top-right corner across all 6 screens — always visible, never intrusive. Paired alongside the existing `GAZE ECONOMY` nav label. See Section 8 (Sound Design) for full spec.

---

## 4. Screen Specifications

---

### Screen 01 — INTRO

**Headline:** `Discombobulate.`  
**Subtitle:** A visual archive of how internet culture codified reality during COVID-19  
**Navigation CTA:** `← Use arrow keys to navigate →` (pill, monospace, pulsing border on hover)  
**Accessibility warning:** Gradient-border pill (magenta → yellow), warning icon, text about flashing lights/GIFs  

#### Animations
| Element | Behaviour |
|---|---|
| Background | Matrix-style falling squares (not characters — squares/blocks, ~8×8px), top to bottom, varying opacity `0.1–0.6`, dark green `#00FF41` or cyan tint, CSS canvas |
| Title | **Redaction font cycling** — loops through Redaction 10 → 50 → 70 → 100, each weight held for ~800ms, crossfade 200ms. Creates a blur/sharpen oscillation effect |
| Nav pill | Border pulses opacity 0→1, 1.5s CSS keyframe loop |
| Stars/dots | Static scattered dots in background (low opacity) |
| Entry | All elements fade in staggered, 200ms apart |

#### Notes
- Accessibility warning button should trigger a modal/overlay before user proceeds if they choose to acknowledge
- Font cycling on "Discombobulate" is the single most memorable design moment — nail this first

---

### Screen 02 — CONTEXT / PRE-COVID

**Headline:** `Sunlight streams for us.`  
**Layout:** Text left, GIF/image right  
**Visual:** Pixel-art couple on sofa, CRT TV, warm amber tones  

#### Background MP4
```
src: assets/mp4/Video_02.mp4
autoplay, muted, loop, playsinline
playbackRate: 0.5
object-fit: cover, full viewport
z-index: 0
overlay: rgba(0,0,0,0.45) — keeps text legible, warm tones still bleed through
```
The MP4 should evoke mundane domestic warmth — TV light, stillness, pre-awareness.

#### Copy (to fill in)
> Before the algorithm learned our fear, it fed our leisure. The GIF was a joke. A reaction. A heartbeat sent across a screen. We scrolled not to survive — but to play.

#### Animations
| Element | Behaviour |
|---|---|
| Headline | Soft fade-in, 600ms ease-out |
| Image/GIF | Pixelated reveal — starts at 8×8px block resolution, de-pixelates to full res over 800ms |
| Body copy | Fade in 200ms after headline |

---

### Screen 03 — COVID ENTERS

**Headline:** `The white boxes` *(serif)* `drown me in.` *(italic script)*  
**Layout:** Image left, text right  
**Visual:** Person sinking underwater, blue-teal pixel art  

#### Background MP4
```
src: assets/mp4/Video_03.mp4
autoplay, muted, loop, playsinline
playbackRate: 0.5
object-fit: cover, full viewport
z-index: 0
overlay: rgba(0,0,0,0.5) — blue tones should still come through
```
Tonal shift from screen 02 — cooler, heavier, disorienting. The overlay is slightly denser to reinforce submersion.

#### Copy (to fill in)
> Then the world stopped. And the internet filled every gap. The GIF was no longer play — it became signal. The only way to say *I feel this too* without speaking. The white rectangle. The looping image. The thing that stood in for everything we couldn't say out loud.

#### Animations
- Same pixelated image reveal as screen 02
- Headline: two-part fade — serif line first (400ms), then italic second line (400ms delay)
- Body: fade after headline completes

---

### Screen 04 — COVID PREVAILS

**Headline:** `The network is the message.`  
**Typeset:** "network" in Redaction (glitch weight), rest in serif  
**Layout:** Text left, image right  
**Visual:** Crowd on phones, floating UI elements (skull, heart, code)  

#### Background MP4
```
src: assets/mp4/Video_04.mp4
autoplay, muted, loop, playsinline
playbackRate: 0.5
object-fit: cover, full viewport
z-index: 0
overlay: rgba(0,0,0,0.4) — densest, most saturated screen — let colour through
```
Most visually intense background of the three — the overlay is lightest here to let the noise and crowd energy bleed into the composition.

#### Copy (to fill in)
> McLuhan said the medium shapes the message. But what happens when the medium *becomes* the feeling? By mid-2020, GIFs weren't just describing fear, hope, isolation — they were the primary form those feelings *existed* in. Internet culture had codified reality. The simulation had begun.

#### Animations
- "network" word glitches on entry — cycles through Redaction weights before settling
- Image reveal same pixelated pattern
- This is the conceptual hinge screen — animation should feel slightly more chaotic/dense than previous two

---

### Screen 05 — DISTRICTS

**Label:** `03 / DISTRICTS` (top-left, monospace, low opacity)  
**Instruction:** `hover to reveal · click to enter` (below label, fading in after 1s)

#### Background
Full-viewport looping MP4 — pixel art, lone figure in a messy bedroom, phone glow.
```
src: assets/mp4/Video_05.mp4
autoplay, muted, loop, playsinline
playbackRate: 0.5   ← set via JS after load: video.playbackRate = 0.5
object-fit: cover
z-index: 0
```
The MP4 keeps playing when a modal opens — the world doesn't pause.

#### Districts & Symbols (8 total)

| # | District | Symbol Shape | Colour | Keywords (sample) |
|---|---|---|---|---|
| 01 | The Screen | Eye (iris + orbit) | Cyan `#4FC3F7` | selfie, viral, meme, scrolling, attention |
| 02 | The Body | Virus node (circle + spokes) | Yellow-Green `#AEEA00` | coronavirus, pandemic, vaccine, variant |
| 03 | Control | Padlock | Amber `#FFB300` | lockdown, quarantine, social distancing, censorship |
| 04 | Inner Life | Heart + triangle geometry | Red `#F44336` | loneliness, depression, burnout, hopeless, anxiety |
| 05 | Power & Voice | Rectangle cluster (broadcast) | Violet `#9C27B0` | misinformation, conspiracy, protest, fake news |
| 06 | The Simulation | Broken circle / ring | Grey `#9E9E9E` | deepfake, metaverse, AI, reality, simulation |
| 07 | The Cage | Concentric bars | Deep Orange `#FF5722` | isolation, doomscrolling, cabin fever, zoom fatigue |
| 08 | Respite | Branching form (growth) | Teal `#26A69A` | hope, together, self care, cope, mental health |

#### Card Layout — Scattered Overlay (Predefined Positions)

Cards float over the MP4 as `position: fixed` dark overlay panels (`background: rgba(8,8,8,0.82)`, `backdrop-filter: blur(2px)`). Centre of frame stays deliberately clear — the subject (girl + phone glow) is never obscured.

Card size: `180px × 220px` at 1440px viewport width. Scale proportionally on smaller viewports using `clamp()`.

```js
// Predefined positions as percentage of viewport (top, left)
// Anchor point: top-left corner of each card
// Designed at 1440×900 — cards avoid centre 40% of viewport width

const DISTRICT_POSITIONS = [
  { id: 1, top: '6%',  left: '7%'  },   // The Screen     — top-left
  { id: 2, top: '5%',  left: '24%' },   // The Body       — top, left-centre
  { id: 3, top: '7%',  left: '63%' },   // Control        — top, right-centre
  { id: 4, top: '6%',  left: '80%' },   // Inner Life     — top-right
  { id: 5, top: '36%', left: '5%'  },   // Power & Voice  — mid-left
  { id: 6, top: '38%', left: '79%' },   // The Simulation — mid-right
  { id: 7, top: '65%', left: '7%'  },   // The Cage       — bottom-left
  { id: 8, top: '66%', left: '79%' },   // Respite        — bottom-right
];
```

**Why these positions:**
- Top row: 4 cards spanning left and right thirds — gap in the middle (40%–62% left) is clear
- Mid row: 2 cards hugging the sides — subject's torso area left open
- Bottom row: 2 corner cards — floor/room detail visible in centre
- No card overlaps another at default viewport
- At < 768px: collapse to a simple vertical scroll list (MP4 still plays behind)

#### Card Anatomy (per card)
```
┌─────────────────────┐
│  [SVG Symbol]       │  ← 80×80px, B&W default, colour on hover
│                     │
│  DISTRICT NAME      │  ← Space Grotesk Mono, 10px, uppercase, muted
│  keyword            │  ← Space Grotesk, 9px, lowest opacity keyword
│  ▓▓▓▓▓░░░ score    │  ← codification bar, district colour
└─────────────────────┘
```

#### Interactions

**Hover (any card):**
- Card's SVG symbol animates to full district colour + glow (`box-shadow: 0 0 20px var(--district-colour)`)
- Subtle pixel tick sound (ZzFX)
- Other cards: no change — all remain visible

**Click (any card):**
1. Clicked card stays exactly in place — does NOT move
2. All *other* cards fade out simultaneously (`opacity: 0`, 400ms ease-out)
3. District Detail Modal scales in over the background (300ms, from 0.94 → 1.0)
4. MP4 background continues playing
5. Low thud + glitch sound (Howler sprite: `districtOpen`)

**Modal close:**
1. Modal fades out (200ms)
2. All other cards fade back in (`opacity: 1`, 500ms ease-in, staggered 50ms apart)
3. Focus returns to the card that triggered the modal
4. Soft whoosh sound (Howler sprite: `districtClose`)

**Toggles** (top-left bar, below label):
- `[B&W / Colour]` — forces all symbols to greyscale regardless of hover
- `[⏸ Pause]` — pauses MP4 background + freezes all symbol animations

---

### Modal — District Detail

Triggered by clicking any district card on Screen 05. Overlays the Districts screen with a backdrop blur — the grid remains faintly visible behind it. Does **not** change the URL or dot pagination state.

**Layout:** Full-screen modal, same two-panel structure as the old Screen 06 wireframe.

| Panel | Content |
|---|---|
| Left (55%) | D3 orbit viz — central SVG symbol, keyword boxes orbiting, sized by `giphy_total_count` |
| Right (45%) | District name (large), 60–80 word editorial write-up, 3 data stats, codification bar |

**Modal open animation:** Scale from 0.92 → 1.0, opacity 0 → 1, 300ms ease-out. Backdrop blurs in simultaneously.

**Orbit viz:**
- Central symbol at rest, slow idle pulse
- Keywords orbit at ~30s per revolution, staggered start angles
- Hover a keyword node → tooltip: term, count, codification score, phase label
- Click a keyword node → fetches and plays one GIF (pixelated reveal, see Section 5)
- Codification score bar at bottom of left panel

**Right panel data stats:**
- Total GIFs indexed (sum of `giphy_total_count` for district keywords)
- Average codification score
- Peak phase (which of the 4 phases had highest density)

**Modal navigation:**
- `[←] [→]` arrows inside modal cycle through all 8 districts without closing
- `[✕]` close button top-right dismisses modal, returns focus to Districts grid
- `Escape` key also closes
- Closing plays a soft click/whoosh sound (see Section 8)

---

### Screen 06 — CLOSING

**Visual:** Heart (red, left) overlapping Eye (blue, right) — Venn-style  
**Labels:** `together` (red) × `loneliness` (blue)  
**Subtext:** *two words, one moment, the same screen*  
**Poetic line:** `where does one end` / `and the other begin?`  

**CTAs (bottom of screen, left-aligned, subtle):**
- `↺ Restart experience` — resets to Screen 01
- `↗ Behind the scenes` — opens the BTS modal (see below)

#### Animations
- Heart: CSS keyframe pulse, 1.35s lub-dub rhythm (synced with Howler heartbeat sound if audio on)
- Eye iris: follows cursor position, 0.09 lerp per frame (smooth lag)
- GIF box tiles orbit both shapes simultaneously
- Subtext fades in after 1s
- Poetic line fades in after 2.5s
- CTAs fade in after 4s

---

### Modal — Behind the Scenes

Triggered by `↗ Behind the scenes` on the closing screen. A full-viewport modal with a dark semi-transparent backdrop. Scrollable content within.

**Purpose:** Acknowledge the research process, editorial decisions, and theory underpinning — make the intellectual scaffolding visible without cluttering the experience itself.

#### Structure

**Section 1 — Research Flowmap (visual)**

An SVG/D3 diagram rendered inline showing:

```
[McLuhan: Medium is the Message]     [Baudrillard: Simulacra & Simulation]
            ↓                                       ↓
     [GIF as Medium]              [GIF as Hyperreal Representation]
            ↓                                       ↓
            └──────────────→ [Giphy API as Cultural Archive] ←──────────
                                          ↓
                         [37 Keywords across 7 COVID Phases]
                                          ↓
                    ┌─────────────────────┼─────────────────────┐
               [Pre-COVID]          [COVID Onset]         [COVID Peak]
                    ↓                    ↓                      ↓
             [Codification         [Codification          [Codification
              Score: Low]           Score: Mid]            Score: High]
                                          ↓
                              [8 Thematic Districts]
                         (The Screen / The Body / Control
                          Inner Life / Power & Voice /
                          The Simulation / The Cage / Respite)
```

Nodes are styled with the district colour palette. Connecting lines animate in on modal open (draw-on effect, 800ms GSAP stroke-dashoffset).

**Section 2 — Editorial Decisions (prose)**

Short paragraph blocks, monospace font, acknowledging:
- Why Giphy as a proxy for cultural codification (not sentiment analysis, not Twitter)
- Why the codification score formula was capped at 500
- What the keyword selection excluded and why (e.g. political party names, brand names)
- The limitation of English-only `lang=en` in the API calls
- Acknowledgment that `total_count` is a supply-side metric, not a demand/consumption metric

**Section 3 — Credits**

```
Research & Design     Vali [surname]
Theory                McLuhan (1964) · Baudrillard (1981)
Data Source           Giphy API
Tools                 D3.js · Howler.js · GSAP · ShadCN
Typefaces             Redaction (Forest Graphic) · Space Grotesk (Florian Karsten)
Built with            Vanilla JS · GitHub Pages
```

**Modal close:** `[✕]` top right or `Escape`. Soft fade-out 300ms.

---

## 5. Data Architecture & Giphy API Strategy

### Sources
- **Primary:** Giphy API — Search Endpoint, returns `total_count` per keyword via pagination object
- **Local dataset:** `summary.csv` — 55 terms, pre-fetched counts + codification scores
- **Keywords JSON:** `keywords.json` — full taxonomy with phases, categories, theory anchors

### Codification Score
```
codification_score = (giphy_total_count / 500) * 100
— capped at 500 (API max returned)
— 0 = no cultural codification
— 100 = maximum saturation
```

---

### Giphy API — Search Endpoint Reference

**Base URL:** `https://api.giphy.com/v1/gifs/search`  
**Method:** GET  
**Auth:** `api_key` query param (required)

#### Key Parameters for This Project

| Param | Value | Notes |
|---|---|---|
| `api_key` | `YOUR_API_KEY` | Store in `.env`, never hardcode |
| `q` | keyword term | Max 50 chars. Send exact term — no correction/enhancement |
| `limit` | `1` | **We only need `total_count` from pagination, not actual GIFs** — set limit to 1 to minimise response payload |
| `offset` | `0` | Default, fine for our use |
| `rating` | `pg` | Safe for public/academic context — avoids adult content |
| `lang` | `en` | Locks to English results — important for COVID-era English vocabulary |
| `bundle` | `messaging_non_clips` | **Use this** — limits renditions returned, dramatically reduces response size |

> **Critical optimisation:** Since we only need `pagination.total_count` (the number of GIFs Giphy has indexed for a keyword), set `limit=1`. This means Giphy returns only 1 GIF object in `data[]` but the `pagination` object still gives us the full `total_count`. Zero waste.

#### Example Request (single keyword)
```
GET https://api.giphy.com/v1/gifs/search
  ?api_key=YOUR_KEY
  &q=lockdown
  &limit=1
  &rating=pg
  &lang=en
  &bundle=messaging_non_clips
```

#### Response shape we care about
```json
{
  "data": [ /* 1 GIF object — ignore */ ],
  "pagination": {
    "total_count": 4821,   ← THIS is our data point
    "count": 1,
    "offset": 0
  },
  "meta": {
    "status": 200,
    "msg": "OK"
  }
}
```

---

### API Optimisation Strategy

**Problem:** 55 keywords × 1 API call each = 55 requests on every page load. Unacceptable for performance, risks rate limits, and adds latency.

**Solution — Build-time cache + lazy refresh:**

#### Step 1 — Build-time pre-fetch script (`scripts/fetch-giphy-data.js`)
```js
// Run before deploying: node scripts/fetch-giphy-data.js
// Reads keywords.json, fires 55 requests with limit=1&bundle=messaging_non_clips
// Writes results to data/keywords-cache.json with timestamp

const keywords = require('./keywords.json');
const cache = {};

for (const [phase, { keywords: terms }] of Object.entries(keywords.phases)) {
  for (const { term } of terms) {
    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${KEY}&q=${encodeURIComponent(term)}&limit=1&rating=pg&lang=en&bundle=messaging_non_clips`
    );
    const { pagination } = await res.json();
    cache[term] = { total_count: pagination.total_count, fetched_at: Date.now() };
    await sleep(150); // 150ms between calls — stays well within rate limits
  }
}

fs.writeFileSync('./data/keywords-cache.json', JSON.stringify(cache, null, 2));
```

#### Step 2 — Runtime load (zero API calls on page load)
```js
const data = await fetch('./data/keywords-cache.json').then(r => r.json());
// Instant, local, no network dependency
```

#### Step 3 — Optional lazy refresh (non-blocking)
```js
// Check cache age via localStorage — if >24hrs, silently re-fetch in background
const lastFetched = localStorage.getItem('giphy_cache_ts');
const isStale = !lastFetched || Date.now() - Number(lastFetched) > 86_400_000;

if (isStale) {
  // Background refresh — doesn't block render
  refreshGiphyCache().then(() => {
    localStorage.setItem('giphy_cache_ts', Date.now());
  });
}
```

#### Step 4 — Fallback chain
```js
// Priority: local cache → fresh API → bundled static data (summary.csv baked in)
const data = await loadFromCache() 
  ?? await fetchFromAPI()    // only if cache missing
  ?? staticFallbackData;     // never shows error to user
```

---

### Rendition Guide (from Giphy Docs)

**Core rule:** Never use `.gif` format. Always prefer **MP4** or **WEBP** — they're dramatically smaller and render faster.

| Context | Rendition to use | Format | Why |
|---|---|---|---|
| Keyword count fetch (build-time) | N/A — only need `pagination` | — | Use `fields=pagination` to strip all GIF data |
| Orbit node preview (Screen 06 hover) | `fixed_width` (200px wide) | WEBP or MP4 | Lightweight for showing many nodes at once |
| Pre-load / still placeholder | `fixed_width_still` | GIF (static) | First frame only, shows before animation loads |
| Full GIF on node click/expand | `fixed_width` | WEBP → MP4 fallback | Good quality, manageable size (~2MB cap) |
| Narrative screen GIFs (Screens 02–04) | `original` | WEBP or MP4 | Hero display, needs quality — load lazily |

**Transparency note:** GIFs on narrative screens (Screens 02–04) use pixel-art illustrations with no transparency — use MP4. If any sticker-style overlays are added later, switch to WEBP (only format supporting transparency besides raw GIF).

---

### Fields on Demand — Major Payload Optimisation

Giphy supports a `fields` parameter that strips the response to only what you ask for. This is a significant optimisation we should use everywhere:

**For build-time count fetches (all we need is `pagination.total_count`):**
```
GET /v1/gifs/search
  ?q=lockdown&limit=1&rating=pg&lang=en
  &fields=id          ← strip everything except id (pagination always returns)
```
Response drops from ~50KB to ~2KB per keyword. Across 55 keywords: ~2.7MB → ~110KB total build-time data.

**For runtime orbit display (need a GIF URL + analytics):**
```
GET /v1/gifs/search
  ?q={keyword}&limit=1&rating=pg&lang=en
  &fields=id,images.fixed_width,images.fixed_width_still,analytics
```
Returns only: the fixed_width webp/mp4 URL, a still frame for preloading, and the analytics pingback URL. Nothing else.

**Example lean response shape:**
```json
{
  "data": [{
    "id": "xT4uQ...",
    "images": {
      "fixed_width": {
        "url": "...",        ← GIF fallback
        "webp": "...",       ← use this
        "mp4": "..."         ← or this for non-transparent
      },
      "fixed_width_still": {
        "url": "..."         ← static first frame for preload
      }
    },
    "analytics": {
      "onload": { "url": "..." }
    }
  }],
  "pagination": { "total_count": 4821 }
}
```

---

### GIF Rendering in the District Detail View (Screen 06)

When a keyword node is clicked in the orbit viz, we fetch a single GIF to display. This is the **only runtime API call** in the experience.

```
GET https://api.giphy.com/v1/gifs/search
  ?api_key=YOUR_KEY
  &q={keyword}
  &limit=1
  &rating=pg
  &lang=en
  &fields=id,images.fixed_width,images.fixed_width_still,analytics
```

**Render strategy:**
1. On node hover: immediately show `fixed_width_still` (static first frame, tiny filesize) 
2. On node click: fetch `fixed_width.webp` (or `fixed_width.mp4` as fallback)
3. Apply **pixelated reveal**: render at 8×8 CSS pixel blocks → de-pixelate to full res over 800ms using canvas scaling + `image-rendering: pixelated`
4. Fire `onload` pingback once visible

**Format selection logic:**
```js
const gif = data[0].images.fixed_width;
// Prefer webp → mp4 → gif url as last resort
const src = gif.webp || gif.mp4 || gif.url;
```

---

### Analytics / Pingback (Required by Giphy ToS)

Giphy requires registering view events. Each GIF object returns an `analytics` object. Fire the `onload` pingback when any GIF becomes visible:

```js
// After rendering a GIF in the orbit detail
const pingUrl = new URL(gif.analytics.onload.url);
pingUrl.searchParams.append('ts', Date.now().toString());
pingUrl.searchParams.append('random_id', sessionRandomId); // from /v1/randomid
fetch(pingUrl.toString()); // fire and forget — no await needed
```

Get `sessionRandomId` once per session from `GET api.giphy.com/v1/randomid` — store in memory, reuse for all pings. This is privacy-safe (no PII) and improves Giphy's response quality over time.

---

## 10. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Vanilla HTML/JS + CSS** | GitHub Pages, no build step friction, full animation control |
| Visualisation | **D3.js** | Orbit layout, force simulation for keyword nodes |
| Animation | **CSS Keyframes + GSAP (lite)** | Redaction cycling, page transitions, scroll triggers |
| UI Components | **ShadCN** (customised) | Accessibility-ready, headless, composable |
| Styling | **CSS custom properties** | Token-based colour + spacing system |
| Data | **Local JSON + Giphy API** | Hybrid cache (see Section 5) |
| Fonts | **Redaction** (self-hosted), **Space Grotesk** (Google), **Space Grotesk Mono** (Google) | |
| Hosting | **GitHub Pages** | Existing deployment |

### ShadCN Customisation Tokens
```css
--font-display: 'Redaction', serif;
--font-body: 'Space Grotesk', sans-serif;
--font-mono: 'Space Grotesk Mono', monospace;
--color-bg: #0A0A0A;
--color-surface: #111111;
--color-border: #2A2A2A;
--color-accent-cyan: #4FC3F7;
--color-accent-red: #F44336;
--color-accent-violet: #9C27B0;
--color-text-primary: #EEEEEE;
--color-text-muted: #666666;
--radius: 2px; /* sharp, not rounded */
--transition-soft: 600ms ease-out;
--transition-fast: 200ms ease;
```

---

## 8. Sound Design

### Library: Howler.js

**Why Howler.js:**
- Web Audio API with HTML5 Audio fallback — cross-browser reliable
- Audio sprite support: bundle all sound effects into a single `.webm`/`.mp3` file, referenced by timestamp ranges — **one network request for all sounds**
- Built-in fade in/out, volume control, global mute
- ~7KB gzipped — negligible footprint
- `Howler.mute(true/false)` for global audio toggle

```js
// Install
// npm install howler  OR  <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js">

const SFX = new Howl({
  src: ['assets/audio/sfx-sprite.webm', 'assets/audio/sfx-sprite.mp3'],
  sprite: {
    screenTransition: [0, 800],
    districtHover:    [1000, 150],
    districtOpen:     [1500, 400],
    districtClose:    [2000, 300],
    gifReveal:        [2500, 600],
    heartbeat:        [3200, 1350],  // loops on closing screen
    staticBurst:      [4600, 500],
    dialup:           [5200, 1200],
    modalOpen:        [6500, 350],
    restart:          [7000, 400],
  }
});
```

---

### Audio Toggle — Omnipresent UI

**Position:** Top right of every screen, inline with the `GAZE ECONOMY` wordmark. Always visible, never in the way.

**Appearance:**
```
GAZE ECONOMY                              [♪]   ← audio on
GAZE ECONOMY                              [♪̶]   ← audio off (strikethrough or slash)
```
- Monospace, ~12px, low opacity (0.4) at rest → 0.9 on hover
- No label text — icon only. `aria-label="Toggle sound"` for screen readers
- State persists in `localStorage` across sessions
- Default state: **off** — sound should never surprise someone

**Implementation:**
```js
const audioBtn = document.getElementById('audio-toggle');
let audioEnabled = localStorage.getItem('audio') !== 'false'; // default off

audioBtn.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  Howler.mute(!audioEnabled);
  localStorage.setItem('audio', audioEnabled);
  audioBtn.setAttribute('aria-pressed', audioEnabled);
  audioBtn.textContent = audioEnabled ? '♪' : '♪̶';
});
```

---

### Sound Map — Per Screen & Interaction

| Trigger | Sound | Source | Notes |
|---|---|---|---|
| Screen 01 → 02 | Soft CRT warm hum fading in | Freesound CC0 | Warmth entering |
| Screen 02 → 03 | CRT static burst / signal drop | Freesound CC0 | The break — abrupt |
| Screen 03 → 04 | Dial-up modem handshake fragment | Internet Archive / Freesound | The internet flooding in |
| Screen 04 → 05 | Short digital scan/sweep beep | ZzFX generated | Entering the taxonomy |
| Screen 05 → 06 (closing) | Low resonant tone, fading | ZzFX / Freesound | Dissolving |
| District hover | Subtle pixel tick (50ms) | ZzFX generated | Lightweight, not distracting |
| District card click (modal open) | Low thud + high glitch layer | ZzFX generated | Two-part: weight + dissonance |
| District modal close | Soft whoosh, descending | ZzFX generated | Closing/releasing |
| Keyword node hover (orbit) | Micro-tick, pitched per district colour | ZzFX generated | Each district has its own pitch |
| GIF reveal on node click | Static crackle → resolves | ZzFX / Freesound | Mirrors the pixelated visual reveal |
| Closing screen loop | Heartbeat lub-dub 1.35s loop | Freesound CC0 | Synced to CSS animation |
| Restart button | Rewind/tape-reverse fragment | ZzFX generated | Signals going back |
| Behind the scenes modal open | Paper rustling or soft click | Freesound CC0 | Different register — calm, archival |

---

### Sound Asset Sources

**Freesound.org (CC0 licence — free, no attribution required)**
Search terms: `CRT hum`, `static burst`, `heartbeat`, `paper rustle`, `dial-up modem`
URL: freesound.org — filter by CC0

**Internet Archive — Dial-up sounds**
The actual AOL/modem audio is in the public domain via Internet Archive.
URL: archive.org/search?q=dial+up+modem+sound

**ZzFX — Procedural, zero assets**
Frank Force's 1KB sound generator. Outputs float arrays, plays via Web Audio API. No files needed.
URL: killedbyapixel.github.io/ZzFX/
Use for: all the glitch/tick/beep/sweep effects — keeps total audio asset size under 200KB.

**Asset budget target:** All Freesound samples combined into one sprite file < 500KB total. ZzFX effects are runtime-generated (0KB). Total audio footprint: ~500KB.

---

### Reduced Motion / Audio Sensitivity

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all CSS animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```js
// If user has prefers-reduced-motion, also default audio to off
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  audioEnabled = false;
  Howler.mute(true);
}
```

---

## 9. Accessibility

| Feature | Implementation |
|---|---|
| Flashing lights warning | Full-screen modal on load, must acknowledge |
| Stop animation | Global toggle on Districts screen, pauses all CSS animations + D3 transitions |
| Audio toggle | Omnipresent `[♪]` top-right, defaults to OFF, persists in localStorage |
| B&W mode | CSS filter: `grayscale(1)` on district grid |
| Keyboard navigation | Arrow keys advance screens, Tab through interactive elements, Escape closes modals |
| Reduced motion | `prefers-reduced-motion` disables all animation AND defaults audio to off |
| Screen reader | `aria-label` on all symbols, district cards, modal triggers |
| Focus states | Visible, high contrast, using `--color-accent-cyan` |
| Modal focus trap | Focus locked inside open modals, returns to trigger on close |

---

## 10. Tech Stack

```
Build a single-page interactive narrative experience called "Discombobulate."
hosted on GitHub Pages. Vanilla HTML, CSS, D3.js, GSAP lite, Howler.js, ZzFX.

ASSETS FOLDER — all MP4s are in assets/mp4/. All play at playbackRate=0.5,
autoplay, muted, loop, playsinline, object-fit cover. Dark overlay per screen:
  Video_02.mp4  → rgba(0,0,0,0.45) warm overlay         (Screen 02 — Pre-COVID)
  Video_03.mp4  → rgba(0,0,0,0.50) cool/blue overlay    (Screen 03 — COVID Enters)
  Video_04.mp4  → rgba(0,0,0,0.40) lightest overlay     (Screen 04 — COVID Prevails)
  Video_05.mp4  → no overlay — cards provide own dark bg (Screen 05 — Districts)
MP4s keep playing during modal states — never pause on interaction.
playbackRate must be set via JS after load: video.playbackRate = 0.5

SCREEN FLOW: 6 screens navigated by arrow keys and scroll. Dot pagination
(6 dots) persistent bottom-centre. District detail and Behind the Scenes
open as MODALS — they do not advance pagination.

01 INTRO — black background, matrix falling squares (CSS canvas, 8×8px blocks,
   #00FF41 tint, varying opacity 0.1–0.6). Title "Discombobulate." loops through
   Redaction 10/50/70/100 weights, 800ms hold per weight, 200ms crossfade.
   Nav pill with pulsing border (1.5s loop). Accessibility warning pill with
   magenta→yellow gradient border.

02–04 NARRATIVE SCREENS — serif/script mixed headlines, pixelated image/GIF
   reveal (8×8 block → full res, 800ms), body copy fade 200ms after headline,
   soft 600ms page transitions. Sounds: CRT hum (02 entry), static burst
   (02→03), dial-up fragment (03→04), sweep beep (04→05).

05 DISTRICTS — 2×4 grid (8 districts). SVG symbols, B&W default, hover
   reveals colour + glow + pixel tick sound. Click opens DISTRICT DETAIL MODAL
   (full-screen overlay, backdrop blur, scale-in 300ms). Modal has D3 orbit viz
   left, editorial data right. Modal [←][→] cycle districts, [✕]/Escape closes.
   UI controls: [Stop animation] [B&W/Colour].

06 CLOSING — SVG heart (red, 1.35s CSS heartbeat pulse) overlapping SVG eye
   (blue, iris lerps to cursor 0.09/frame). GIF tiles orbit both. Text fades
   sequenced: subtext 1s, poetic line 2.5s, CTAs 4s.
   CTAs: [↺ Restart experience] [↗ Behind the scenes]
   "Behind the scenes" opens BTS MODAL: D3 research flowmap (draw-on animation),
   editorial decisions prose, credits. Scrollable, [✕]/Escape closes.

OMNIPRESENT AUDIO TOGGLE — top-right corner all screens, inline with
"GAZE ECONOMY" wordmark. [♪]/[♪̶] icon, 12px monospace, opacity 0.4 rest /
0.9 hover. Default: OFF. Persists in localStorage. If prefers-reduced-motion
detected, also force audio off. Uses Howler.js global mute.

AUDIO — Howler.js sprite file for Freesound samples (CRT, static, dial-up,
heartbeat, paper rustle). ZzFX for procedural effects (ticks, glitches, sweeps).
All sounds gated behind audio toggle. Total audio budget < 500KB.

DATA — Load from data/keywords-cache.json (pre-built). Giphy runtime calls
only on keyword node click (fields=id,images.fixed_width,images.fixed_width_still,
analytics, limit=1, rating=pg, lang=en). Pixelated reveal on GIF load.
Fire Giphy onload pingback after GIF renders.

DESIGN TOKENS — Background #0A0A0A. Accent colours per district. ShadCN for
modals/tooltips/toggles. All transitions 600ms ease-out, micro-interactions 200ms.
--font-display: Redaction, --font-body: Space Grotesk, --font-mono: Space Grotesk Mono.
```

---

## 11. Open Questions

1. **Are screens 02–04 GIF replacements final?** Pixel-art illustrations — placeholder or final art direction?
2. **Is "Discombobulate" the final experience title?** Or does "Gaze Economy" remain primary?
3. **Districts 07 (The Cage) and 08 (Respite)** — confirm or cut back to 6?
4. **Copy for screens 02–04** — drafts in Section 4 are starting points. Needs Vali's voice.
5. **Giphy API key** — confirm env var handling for GitHub Pages (use a build-time `.env` + pre-fetch script).
6. **BTS flowmap** — confirm theory nodes and layout before D3 implementation. ASCII diagram in Section 4 is a starting sketch.
7. **Low-count keywords** — `deepfake`, `zoom fatigue`, `cabin fever` have low counts in summary.csv. Include in orbit or exclude?

---

*End of PRD v0.3*
