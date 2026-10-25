---
name: agency-site-builder
description: Build and ship a premium, animation-led marketing site for a creative/video agency as a plain static site (no build step) — branded particle intro, giant condensed type, autoplaying reel previews, native quote form that posts to a Google Form, cPanel Git deploy, and mobile/iOS hardening. Use when asked to recreate a reference agency site, add an intro animation, embed reels/YouTube, rebuild an inquiry form in-site, or go live on cPanel hosting.
---

# Agency site builder (static, no build step)

Learned building froznmedia.com (Toronto video agency). Everything below worked in production; the **Pitfalls** section is the expensive part — read it first.

## 0. Working agreement
- Reference site = **inspiration for layout, motion and typography only**. Never copy its code, assets, copy or fonts. WebFetch cannot see visuals: **open the reference in the browser pane, read computed styles, and screenshot frame-by-frame** (the "glass break" was actually a loader/intro, which text fetch missed entirely).
- Never invent claims. Credits, numbers, "leading/top agency" lines come from the owner; ask before adding anything unverifiable. Capability lists should show film-first positioning (AI = one tool in the arsenal, not the headline) unless told otherwise.
- Push only when the owner has said pushing to that repo is OK. Never put secrets in the repo. Don't submit real form entries while testing.
- Clean up: stop dev servers, delete test media/data, don't commit `.claude/`.

## 1. Stack & file layout
Plain static site, absolute paths (`/assets/...`), deployable to any host:
```
index.html  styles.css  main.js  config.js   # config.js = all editable content
assets/ (logos, photos, reels/*.mp4+jpg)
inquiry/index.html + inquiry.js              # standalone form page (also embedded on home)
.cpanel.yml                                  # cPanel deploy (see §8)
```
- `config.js` holds reels, YouTube IDs, marquee words, services → owner edits one file, never code.
- Fonts: free lookalike for a paid display face (Anton for condensed caps) + Inter for body. Palette via CSS variables (`--blue`, `--navy`, `--paper`, `--cyan`).
- **Cache-bust** your own assets (`document.write('<script src="/main.js?v='+Date.now()+'">')`) so owners never see a stale config after a deploy.

## 2. Design system (the "reference-agency" look)
- Giant uppercase condensed headlines, stacked, alternating left/right alignment; one accent line in navy per block.
- Colour-block sections with rounded top corners overlapping the previous section (`margin-top:-36px; border-radius:36px 36px 0 0; z-index` stacking).
- Full-screen menu overlay (circle `clip-path` reveal from the Menu pill), pill buttons, hover lift, `IntersectionObserver` `.reveal` fade-ups.
- Nav: white logo on dark/blue, switches to coloured logo + dark pill over pale sections (`on-light`), and becomes a slim translucent blurred bar after ~120px scroll so it never disappears over white cards.
- Dark statement section = white text, accent colour on 2–3 key words, small grey supporting columns, outlined tags. Avoid big pastel blocks with heavy body text — it reads cheap.

## 3. The intro (particle logo + pixie-dust vanish) — canvas 2D, no libs
Recreate the brand's own outro film, don't use a generic loader. Extract frames with `ffmpeg -vf fps=2,scale=480:-1,tile=3x6` and study the beats.

Sequence (design ms; real playback is scaled):
1. Black panel. Lens-flare head (radial sprites + 1.5px horizontal streak) sweeps left→right, 0–1250ms.
2. Sample the logo PNG's alpha on a grid (STEP 2 desktop / 3 phone → ~5k particles). Each particle appears just behind the flare head (delay ∝ x), flies from a stream near the centre-line to its target with ease-out + small swirl.
3. Solid logo fades in (1500–2400ms) with a shadow glow + a second `lighter` pass at ~0.4 alpha to match the film's luminous gradient. Add ~36 ambient twinkles during the hold.
4. Vanish: a soft-edged mask erodes the solid logo left→right (`destination-out` linear gradient on an offscreen copy); particles at the front lift off, drift up/right, twinkle (sin), fade, shrink.
5. As the dust starts: loader background → transparent (CSS transition 2.6s), **page content pans up from below** (all top-level sections `translateY(100vh)` → none, 4s ease-out) while the particles finish.

Tuning that mattered:
- Timeline remap: `t = tr<TDR ? tr*SPEED_IN : tD+(tr-TDR)*SPEED_OUT` — set speeds as `tD/1200` (build 1.2s) and `(WIPE+3600)/3000` (vanish 3s) so durations are exact real-time numbers the owner can ask for.
- "Sharp/premium" = smaller sprites with a 1.2px bright core fillRect, tight gradient stops (0, .18, .45, 1), thin streak, restrained glow. Big soft blobs look cheap.
- Additive blending: `globalCompositeOperation='lighter'`; keep alpha low or overlapping particles blow out to white.
- Logo size: owner specified exact px (403px = 310×1.3). Use `min(403, 78vw)`.
- Guardrails: `startReveal` fallback timer (9s), cap font wait (700ms), `prefers-reduced-motion` hides the loader entirely, always `history.scrollRestoration='manual'` + `scrollTo(0,0)` so the page opens at the top.
- **Do not** wait for `window.load` (videos/iframes delay it); wait only for logo decode + capped fonts.

Earlier iterations that were replaced (don't repeat): Three.js 3D ice-shard scroll hero (heavy, off-brief), canvas triangle shatter with motion-blur sub-samples (owner wanted dust, not glass).

## 4. Hero video background (YouTube)
- Use the IFrame API: `mute=1 autoplay=1 controls=0 playsinline=1`, hide with `pointer-events:none`.
- "Stop N seconds before the end and loop": poll `getCurrentTime()` every 200ms; if `>= duration-N` → `seekTo(0)`.
- Pin it: `position:fixed; inset:0` **outside** the hero (a transformed ancestor breaks `fixed`, and it would rise with the text during the page-pan). Fade to ~28% opacity under a blue gradient; `is-off` when the hero leaves the viewport; pause then.
- Cover sizing with container units: `width:max(100cqw,177.78cqh); height:max(56.25cqw,100cqh)` on a `container-type:size` parent, anchored `top:0`.
- **Skip on phones** (`(max-width:760px) and (hover:none)`): autoplay is unreliable and YouTube's pause glyph shows through.

## 5. Reels as autoplaying previews
- Instagram embeds look off-brand (white chrome, "View profile") and can't autoplay. Use **owner-supplied mp4s**.
- Compress per clip: `ffmpeg -t 15 -vf scale=720:1280:flags=lanczos -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -an -movflags +faststart x.mp4` + poster `-ss 1 -frames:v 1 -vf scale=540:960 -q:v 4`. ~1–3 MB each (4K originals were 100–250 MB).
- Markup: `<video muted loop playsinline preload="metadata" poster>` in 9:16 rounded cards in a horizontally-scrolling flex row; `IntersectionObserver` (threshold .4) plays/pauses.
- Keep the Instagram-embed grid as fallback when `config.reels` is empty. Put "See more @handle →" button at the **top** of the section.

## 6. Quote/inquiry form → existing Google Form (no backend)
- Read the live Google Form from the browser: `FB_PUBLIC_LOAD_DATA_[1]` gives every question + **entry IDs** (inner id of each item's `[[id,…]]`).
- POST `application/x-www-form-urlencoded` to `/forms/d/e/<id>/formResponse` with `fetch(..., {mode:'no-cors'})`. Mapping rules:
  - text/radio/dropdown → `entry.ID=value`; checkboxes → repeat the key.
  - "Other" option → value `__other_option__` + `entry.ID.other_option_response=text`.
  - Date → `entry.ID_year/_month/_day` (convert `yyyy-mm-dd`, strip leading zeros); Time → `entry.ID_hour/_minute` (24h).
  - Add `fvv=1&pageHistory=0`.
- Response is **opaque** — you cannot confirm success. Show the thank-you optimistically, include phone/WhatsApp/email fallbacks, and have the owner send one real test and check Responses + notification setting.
- Google rejects values that aren't options. New website-only choices (e.g. "AI Generations", per-edit quantities) are **appended to the details textarea** under `--- From the website ---`. Offer to add real questions to the Google Form later.
- UX: pill chips for radios/checkboxes (visually-hidden inputs + `:checked + span`), conditional "How many?" dropdowns (1–10, 10+) per ticked edit length, required-field validation with scroll-to-error, honeypot input, disabled button while sending.
- Test by **mocking `window.fetch`** and inspecting the body — never submit for real.

## 7. Mobile & iOS Safari hardening (all of these bit us)
- `<input type=date|time>` on iOS ignores width rules and renders blank/overflowing: grid tracks `minmax(0,1fr)`, `min-width:0; max-width:100%; box-sizing:border-box; appearance:none; min-height:3.3rem`, left-align `::-webkit-date-and-time-value`, add a visible "tap to choose" hint, custom select arrow.
- Hero: `12.4vw` type so each line fits; flex column with a fixed gap (not stretched to 100svh) and ≥90px bottom padding so the next section's `-36px` overlap doesn't cover the last line.
- Test at 375 **and** 390 wide; check `scrollWidth === innerWidth` (no horizontal scroll); real device for date pickers.
- Use `svh` not `vh` for full-height blocks.

## 8. Hosting: cPanel Git Version Control
- Clone URL = the public GitHub `https://…git` (private repos need an SSH deploy key).
- Repository Path **must be an empty folder** (`repositories/<name>`); file-manager "delete everything" leaves a hidden `.git` → "directory already contains files". Either enable *Show Hidden Files* and delete `.git`, or just use a new path (`repositories/<name>-site`).
- `.cpanel.yml` (must be committed; working tree must be clean). Prefer plain `cp` over `rsync` (rsync may not exist on shared hosting):
```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/<user>/public_html/
    - /bin/mkdir -p $DEPLOYPATH
    - /bin/cp -R index.html main.js config.js styles.css assets inquiry $DEPLOYPATH
```
  Listing files explicitly keeps `skills/`, README, `.git`, notes out of `public_html`. **Add any new file/folder to this list** or it won't ship.
- "Last Deployed" in cPanel only proves the button ran. Verify with `curl -I https://domain/index.html` (404 on everything = wrong document root or failed copy). Check *Domains → Document Root*; addon domains don't use `public_html`.
- Back up `public_html` first; the deploy overwrites `index.html` and `/inquiry/` but doesn't delete old files or `.htaccess`.
- Update flow: push → cPanel *Update from Remote* → *Deploy HEAD Commit* → hard-refresh.

## 9. Dev server & verification workflow
- Python's `http.server` caches aggressively → owners see stale config/reels. Use a tiny handler that sends `Cache-Control: no-store`. Bind `0.0.0.0` only when the owner wants to test on a phone (LAN IP via `ipconfig getifaddr en0`); stop it when done.
- The browser-pane screenshot lags the page by seconds; for animations **query state with JS** (`body.className`, element rects, computed styles) and use a temporary `?introT=3700` freeze-frame param to inspect a specific moment — remove it afterwards.
- Check computed styles/geometry (card rect vs input rect) instead of eyeballing.
- Emulate sizes with `resize_window`, **always reset to `desktop`** afterwards.

## 10. Pitfalls checklist (each cost us time)
1. **Regex/sed edits on CSS can silently eat neighbouring rules** (removing the floating card left a stray `body.is-ready body.is-ready` that broke the whole projects section). After any scripted CSS removal, `git diff` the stylesheet and eyeball every changed hunk; prefer deleting exact known blocks.
2. Browser caching masked new content (5th reel "missing"). Cache-bust + `no-store` dev server.
3. Scroll restoration dropped users into section 2 after the intro → disable and force top.
4. `position:fixed` inside a transformed ancestor behaves as absolute (the video rose with the hero).
5. Page `overflow:hidden` during the intro + smooth-scroll `html{scroll-behavior}` swallows scripted scrolls in tests (set `auto` first).
6. GitHub/cPanel: public repo + HTTPS clone is the zero-config path.
7. Don't claim a form submission succeeded — Google gives no response to `no-cors`.
8. Ask before replacing existing live content; confirm what the old URL served (the old `/inquiry/` was an embedded Google Form).

## 11. Delivery checklist
- [ ] Intro plays once, ≤ ~4–5s total, reduced-motion safe, lands at top
- [ ] Hero fits on 375/390px; no horizontal scroll anywhere
- [ ] Reels autoplay muted in view, pause out of view; files ≤ ~3 MB each
- [ ] Form: required validation, conditional fields, mocked-send payload verified, real test entry received
- [ ] Nav readable over every section (light/dark/white card)
- [ ] Footer: social pills with icons for every handle
- [ ] `.cpanel.yml` lists every shipped file; deployed + `curl -I` returns 200
- [ ] Dev server stopped, temp media removed, everything pushed
