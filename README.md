# jpweb

Website for a classical / opera singer (soprano): a digital calling card she can
send to agencies, opera houses and promoters to win engagements. Black and white
like a grand piano, with motion. Static HTML/CSS/JS, hosted on GitHub Pages under
a custom domain.

## Status: concept round 2

**Concept D · Fünf Linien** is the chosen direction and is the homepage (`index.html`). It is
online as a hidden preview (`noindex`) at https://mackseb.github.io/jpweb/ until the real content is in. It combines
Resonanz (sound and frequencies) with Clavier (drifting notes, repertoire on a staff), without the
piano: her voice is the instrument. Her name sits on five staff lines (E4 G4 B4 D5 F5). When a
recording plays, the staff flows into a single line drawn from her voice: the strength of each
overtone shapes the wave, the pitch sets its density, the loudness its height. It runs live in the
browser via the Web Audio `AnalyserNode` (no server); the audio files only need to be served from
the same site. The listening room has a prototype-only switch between four visualisations:

| Visualisation | What it shows |
| --- | --- |
| Notenlinien | The five lines resonate with the sung pitch |
| Melodiespur | The melody is written onto the staff; held notes become note heads |
| Klangschrift | Scrolling spectrogram as engraving, staff lines at their true frequency |
| Obertöne | Harmonic comb of the sung note, singer's formant marked |

Round 1, kept for comparison: three prototypes with the same placeholder content, staged differently:

| Concept | Idea | What moves |
| --- | --- | --- |
| **A · Clavier** (`concepts/clavier/`) | The keyboard is the navigation | Keys go down (and can sound), a music staff draws itself between chapters, the current chapter's key stays held, the player's key strip follows the music |
| **B · Premiere** (`concepts/premiere/`) | Opera house; the page reads like a programme booklet | Curtain opens on load, follow-spot tracks the mouse, role marquee, acts light up while scrolling, curtain closes at the end |
| **C · Resonanz** (`concepts/resonanz/`) | Her voice made visible | Hairline strings part around the cursor and vibrate live with the recording, kinetic name, sideways repertoire band |

The earlier concepts and the chooser page live under `entwuerfe/`.

Except her name (Julia Planitz), all texts, dates, venues and press quotes are **placeholders**.
Instead of her recordings, a synthesized demo melody plays (`concepts/shared/demo-audio.js`).

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html                     the site (Concept D · Fünf Linien)
assets/js/content.js           all site content (DE/EN), shared by every page
assets/js/i18n.js              DE/EN switch (data-i18n attributes, remembers the choice)
assets/js/demo-audio.js        placeholder audio + analyser + current sung pitch
assets/js/staff.js             five-line staff renderer and the visualisations
entwuerfe/index.html           concept chooser
entwuerfe/clavier/index.html   Concept A
entwuerfe/premiere/index.html  Concept B
entwuerfe/resonanz/index.html  Concept C
```

Content lives in one place: edit `assets/js/content.js` and every page
updates. Strings are either plain text or `{ de: "…", en: "…" }` pairs.

## Before going live (after a concept is chosen)

- Replace placeholders with real content: photos, MP3 recordings, YouTube/Vimeo
  links, CV, press quotes, dates.
- Real audio: play an `<audio>` element and connect it to the same analyser via
  `AudioContext.createMediaElementSource()`, so the visuals follow her voice.
- Pitch for the melody trace and line resonance: pre-compute a pitch track per recording
  offline (e.g. pYIN) and serve it through the same `DemoAudio.pitch()` API. Live pitch
  detection is unreliable once an orchestra or piano plays along.
- Videos: keep the click-to-load facade (no YouTube/Vimeo requests before a click).
- Self-host the fonts instead of loading them from Google Fonts (GDPR).
- Add Impressum and Datenschutzerklärung pages (mandatory in Germany).
- Add a share image (`og:image`), so links look good in WhatsApp and email.
- Remove the preview notice and the `noindex` meta tag from `index.html` so search engines list the site.
- Remove the visualisation switch in the listening room once one view is chosen.
- Press kit: real PDF and ZIP downloads.

## GitHub Pages and custom domain

1. Repository **Settings → Pages**: Source "Deploy from a branch", branch `main`, folder `/ (root)`.
2. Enter the custom domain there (this creates a `CNAME` file in the repo root).
3. At the domain registrar, set DNS:
   - apex domain (`example.de`): four `A` records to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (optionally `AAAA` to `2606:50c0:8000::153`, `…8001::153`, `…8002::153`, `…8003::153`)
   - `www`: `CNAME` to `mackseb.github.io`
4. Once the certificate is issued, enable **Enforce HTTPS**.

DNS changes can take up to a day to propagate.
