# jpweb

Website for a classical / opera singer (soprano): a digital calling card she can
send to agencies, opera houses and promoters to win engagements. Black and white
like a grand piano, with motion. Static HTML/CSS/JS, hosted on GitHub Pages under
a custom domain.

## Status: concept round 1

Three clickable prototypes with the same placeholder content, staged differently:

| Concept | Idea | What moves |
| --- | --- | --- |
| **A · Clavier** (`concepts/clavier/`) | The keyboard is the navigation | Keys go down (and can sound), a music staff draws itself between chapters, the current chapter's key stays held, the player's key strip follows the music |
| **B · Premiere** (`concepts/premiere/`) | Opera house; the page reads like a programme booklet | Curtain opens on load, follow-spot tracks the mouse, role marquee, acts light up while scrolling, curtain closes at the end |
| **C · Resonanz** (`concepts/resonanz/`) | Her voice made visible | Hairline strings part around the cursor and vibrate live with the recording, kinetic name, sideways repertoire band |

`index.html` is the chooser page that links to all three.

All names, texts, dates, venues and press quotes are **placeholders**. Instead of
her recordings, a synthesized demo melody plays (`concepts/shared/demo-audio.js`).

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html                     concept chooser
concepts/shared/content.js     all site content (DE/EN), shared by the concepts
concepts/shared/i18n.js        DE/EN switch (data-i18n attributes, remembers the choice)
concepts/shared/demo-audio.js  placeholder audio + analyser for the visualizers
concepts/clavier/index.html    Concept A
concepts/premiere/index.html   Concept B
concepts/resonanz/index.html   Concept C
```

Content lives in one place: edit `concepts/shared/content.js` and every concept
updates. Strings are either plain text or `{ de: "…", en: "…" }` pairs.

## Before going live (after a concept is chosen)

- Replace placeholders with real content: photos, MP3 recordings, YouTube/Vimeo
  links, CV, press quotes, dates.
- Real audio: play an `<audio>` element and connect it to the same analyser via
  `AudioContext.createMediaElementSource()`, so the visuals follow her voice.
- Videos: keep the click-to-load facade (no YouTube/Vimeo requests before a click).
- Self-host the fonts instead of loading them from Google Fonts (GDPR).
- Add Impressum and Datenschutzerklärung pages (mandatory in Germany).
- Add Open Graph tags and a share image, so links look good in WhatsApp and email.
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
