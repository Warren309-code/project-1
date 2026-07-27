# Affinity Institute Website

Static, framework-free build. No dependencies, no build step. HTML, CSS and vanilla JavaScript only.

## Pages

- `index.html` - homepage
- `graduates.html` - graduate stories, outcomes and Trustpilot quotes
- `programmes.html` - programme catalogue and upcoming pathways
- `mentors.html` - coaching model and mentor team
- `how-it-works.html` - curriculum stages, disciplines and placement

## Design system

Defined entirely in `css/main.css`.

- Type: Cabinet Grotesk (display/headings, medium weight, tight tracking, imported from Fontshare) and Manrope (body/UI). Cabinet Grotesk is a free Fontshare typeface (Indian Type Foundry) imported via `api.fontshare.com`; the family includes a variable instance so the odd tuned `--display` weights (480/490/560) render exactly. Headings use weight 500 (emphasis words 600) — deliberately mid-weight, not bold. Manrope stands in for the commercial DIN Pro / PolySans — swap the `@import` and `--sans` stack for licensed files if available. Heading emphasis words use an Irish two-tone orange→green gradient (`--grad-irish`).
- Palette: warm cream paper, deep forest green, sage, warm orange. All tokens are CSS custom properties in `:root`.
- Motion: scroll reveals with stagger, marquee belts, counter animations. All respect `prefers-reduced-motion`.

## Assets

- `assets/brand-mark.png` - the Affinity mark, background removed.
- `assets/photos/` - photography cropped from the recruitment deck and current site (events, workshops, trips).
- `assets/portraits/` - graduate photos from the deck plus placeholder human portraits (from randomuser.me) used in review cards, avatar stacks and mentor cards until real photos arrive.

## Replacing media later

- Film section: the `.film-frame` block in `index.html`. Swap the play button area for an embedded video when the file arrives.
- Community collage: the `.comm-collage` block in `index.html` includes one reserved placeholder tile for Lake Como and football photos.
- Partner logo belt: currently refined text wordmarks inside `.marquee-track` in `index.html`. When official transparent PNG logos arrive, drop them in `assets/logos/` and swap each `<span class="wordmark">` for `<img src="assets/logos/name.png" alt="Name">`. The image styling is already in the stylesheet.
- Portraits: replace files in `assets/portraits/` with real member photos, keeping the same filenames, and every card updates automatically.

## Running locally

Serve the folder (needed so fonts and images load consistently):

```sh
python -m http.server 4173
```

Then open http://localhost:4173 in a browser.

## Deploying to Vercel

The site is plain static files, so no framework preset or build step is needed. Push the repo to GitHub, import it in Vercel, and leave every build setting empty (framework: Other, no build command, output directory: root).

- `vercel.json` enables clean URLs, so `/graduates` serves `graduates.html` in production. The `.html` links keep working too.
- `.vercelignore` keeps the reference HTML captures, the recruitment deck PDF and the screenshots folder out of the deployment.
- `.gitignore` keeps the same reference material out of the public repo. If you want those files on GitHub anyway, delete the matching lines from `.gitignore`.

The Apply buttons point to the existing Typeform:

```text
https://form.typeform.com/to/mUzyHsig
```
