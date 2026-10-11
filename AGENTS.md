# AGENTS.md

Guide for coding agents working on `jpweb`. Read this before changing anything; the
user-facing overview and go-live checklist are in `README.md`.

## What this is

A calling-card website for the lyric soprano **Julia Planitz**, sent to agencies, opera houses
and promoters to win engagements. Black and white like a grand piano, with motion.

- **Concept D · Fünf Linien** is the chosen direction and is the homepage (`index.html`): her
  name on five staff lines that flow into one line drawn live from the voice (Web Audio
  `AnalyserNode`).
- Online as a hidden preview (`noindex`) at https://mackseb.github.io/jpweb/ until the real
  content is in.
- Earlier concepts A–C and a chooser page live under `entwuerfe/` (German for "drafts"), kept for
  comparison. They still share the JS in `assets/js/`.

## Stack

- Plain static HTML, CSS and JavaScript. **No build step, no package manager, no dependencies,
  no test suite.** Don't add any of these without asking.
- Hosted on GitHub Pages from `main`, folder `/` (`.nojekyll` disables Jekyll). Deploy = merge to
  `main`.
- Fonts: Bodoni Moda (display) and Schibsted Grotesk (text) from Google Fonts, Noto Music for
  the clef glyph. These are to be self-hosted before launch (GDPR).

## Run and check

```sh
python3 -m http.server 8000   # open http://localhost:8000
```

There is nothing to compile or lint, so check changes in a browser. In cloud sessions Chromium
and Playwright are preinstalled (don't run `playwright install`); use them for screenshots and to
catch console errors. Check:

- both languages (DE/EN switch in the header; the choice is stored in `localStorage` as `jpweb-lang`)
- a phone-width viewport as well as desktop
- `prefers-reduced-motion: reduce`
- after touching anything in `assets/js/`, also open `entwuerfe/` and the three concept pages

Audio only starts after a user gesture (click a play button).

## Map

| Path | What it holds |
| --- | --- |
| `index.html` | The site. Page CSS (custom properties on `:root`), markup, and one inline script with the UI string dictionary `DICT` and all page logic |
| `assets/js/content.js` | `window.SITE`: all site content (name, contact, tracks, videos, repertoire, dates, press, bio, highlights, press kit) |
| `assets/js/i18n.js` | `window.I18N`: DE/EN switch, `L()`, `t()`, `formatDate()`, `set()`, `init(dict)` |
| `assets/js/demo-audio.js` | `window.DemoAudio`: synthesized placeholder melodies, the shared analyser, `play/stop/toggle/progress/pitch/level/onChange/...` |
| `assets/js/staff.js` | `window.Staff`: canvas renderer for the five staff lines; modes `lines`, `score`, `spectrogram`, `overtones`; options such as `trace`, `drift`, `clef`, `mouse` |
| `assets/img/portrait.jpg` | Vita portrait (576 px; shown in black and white via CSS) |
| `entwuerfe/index.html` | Concept chooser |
| `entwuerfe/{clavier,premiere,resonanz}/index.html` | Concepts A, B, C (self-contained pages using `../../assets/js/…`) |

Script load order on every page: `content.js` → `i18n.js` → `demo-audio.js` → `staff.js`
(homepage only) → inline page script.

## Where to edit what

- **Content** (bio, Vita points, repertoire, dates, press, tracks, contact): edit
  `assets/js/content.js` only. Every page reads it. Values are either plain strings (same in both
  languages) or `{ de: "…", en: "…" }` pairs, always read through `I18N.L(value)`. Dates are ISO
  strings and formatted per language by `I18N.formatDate`.
- **UI labels** (navigation, buttons, captions, prototype notes): the page's own `DICT` (`de` and
  `en` blocks in the inline script), wired up with attributes:
  - `data-i18n="key"` → `textContent`
  - `data-i18n-html="key"` → `innerHTML` (only for trusted strings from `DICT`, never content)
  - `data-i18n-aria="key"` → `aria-label`
  - `data-lang="de|en"` on a button switches language
  - parts rendered from `SITE` re-render on the `langchange` document event
- **Changing the shape of `SITE`** (renaming or restructuring fields) affects the three concept
  pages too. Update them in the same change or keep the old shape working.
- **Visualisations**: `assets/js/staff.js`. All `Staff` instances share one animation loop and read
  the same analyser. The five lines are real pitches of the treble staff, E4 G4 B4 D5 F5
  (MIDI 64 67 71 74 77).

## Code style

- ES5 in IIFEs: `(function () { … })();`, `var`, `function` expressions, globals on `window`.
  No modules, classes, arrow functions, frameworks or bundlers. Match the surrounding code.
- Short header comment per file explaining its purpose and API; sparse inline comments.
- CSS lives in each page's `<style>`; reuse the custom properties (`--paper`, `--ink`,
  `--graphite`, `--hair`, `--f-display`, `--f-text`, `--gutter`, `--measure`, …).
- Respect reduced motion: `Staff.reduce` / the `prefers-reduced-motion` media query.
- Keep it accessible: real buttons and links, ARIA labels in both languages, keyboard focus.
- Wrap `localStorage` access in `try/catch` (see `i18n.js`).

## Content rules

- German is the primary language; **always supply the English version alongside** any new text.
- Real so far: her name, the Vita (`bio`, `highlights` in `content.js`), the portrait and the
  YouTube videos (`videos`, each with a `youtube` ID).
  Everything else (dates, venues, press quotes, contact, agency, repertoire, recordings) is a
  **placeholder**. Never invent facts about her or present placeholders as real; keep fake data
  obviously fake (Musterstadt, Beispielstadt, example.com).
- Prototype notes for the client use the `.proto` style (`<b>Prototyp</b>…`) and live in `DICT`.
- Copy tone: plain, factual, no marketing fluff. Match the existing DE and EN strings.

## Audio

`DemoAudio` synthesizes voice-like placeholder melodies through one `AnalyserNode`; each track in
`SITE.tracks` points to one via `demo: <index>`. The planned path for real recordings: an `<audio>`
element connected to the same analyser with `AudioContext.createMediaElementSource()`, plus a
pitch track pre-computed offline (e.g. pYIN) and served through `DemoAudio.pitch()`. Keep that
API stable so the visualisations don't need to change. Audio files must be served from the same
origin (the analyser can't read cross-origin media).

## Privacy and legal (Germany)

- No third-party requests before the visitor asks for them: videos use a click-to-load facade
  (no YouTube request before a click; then an iframe from youtube-nocookie.com). The concept
  pages under `entwuerfe/` only show a placeholder message on click. Don't add trackers,
  analytics or other embeds.
- Google Fonts are a known exception to be removed (self-host before launch).
- Impressum and Datenschutzerklärung pages are mandatory before going live.

## Intentional "unfinished" bits

Until launch, these are on purpose; don't remove them unless asked: the `noindex, nofollow` meta
tag, the preview banner, the four-way visualisation switch in the listening room, `.proto` notes,
the link to `entwuerfe/` in the footer, and placeholder downloads in the press kit. The full
checklist is in `README.md` under "Before going live".

## Workflow

- Small, focused commits with descriptive messages (what changed and why).
- Keep `README.md` (status, structure) and this file in sync when the structure or status changes.
- Don't open pull requests unless asked.
