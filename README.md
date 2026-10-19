# ASM Lemon — Professional Dynamic Portfolio
### Site is live at [Abu-Salah-Musha-Lemon](https://abu-salah-musha-lemon.github.io/Personal-Portfolio/)

This version is a **JSON-driven static portfolio** designed for GitHub Pages, Netlify, Vercel static hosting, or any normal web server.

## What is dynamic

Edit **`data/content.json`** to update:

- brand/profile/hero
- navigation and focus areas
- about facts
- metrics
- experience
- projects
- dynamic project case studies
- creative/Behance work
- research interests and applied explorations
- media / publications
- education
- skills
- certifications
- contact information and social links

The main HTML files provide layout shells; content comes from JSON.


## Production content

The public portfolio is intentionally kept free of demo/test content. The YouTube, NCS and Pexels media samples used to verify the media renderer are stored in `data/media-examples.json` and are **not shown on the live portfolio**.

The Media section is hidden by default until genuine published material is added. After adding real items to `media.items`, remove `"media"` from `site.hiddenSections` to make the section visible.

## Pages

- `index.html` — recruiter-friendly one-page portfolio
- `project.html?project=stockgenie` — reusable dynamic project case-study page
- `research.html` — dedicated research page generated from the same JSON
- `media.html` — dedicated searchable/filterable media library generated from the same JSON

Legacy project URLs under `projects/` redirect to the dynamic project page so old links do not break.

## Run locally on Windows

Double-click:

`serve.bat`

or use:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`.

**Do not test by double-clicking `index.html`** (`file://`) because browsers block normal JSON `fetch()` behavior on local files.

## Validate JSON before publishing

```bash
python tools/validate.py
```

## Add a new project

Add one object to `projects` in `data/content.json`.

For a normal card:

```json
{
  "title": "New Project",
  "slug": "new-project",
  "category": "web",
  "eyebrow": "Web Application",
  "description": "Short project description.",
  "stack": ["Laravel", "PHP", "MySQL"],
  "demo": "https://example.com",
  "code": "https://github.com/example/repo",
  "accent": "violet"
}
```

For a dynamic case study, also add `caseStudyData`. The card automatically links to `project.html?project=<slug>`; no `caseStudy` field is required:

```json
"caseStudyData": {
  "slug": "new-project",
  "year": "2026",
  "role": "Full-stack developer",
  "status": "Published",
  "focus": "Product + Engineering",
  "lead": "Longer project introduction.",
  "sections": [
    {
      "kicker": "01 · Context",
      "title": "The problem",
      "paragraphs": ["Problem paragraph."]
    },
    {
      "kicker": "02 · Approach",
      "title": "How it was approached",
      "paragraphs": ["Approach paragraph."],
      "cards": [
        {"title": "Feature", "description": "What it does."}
      ]
    },
    {
      "kicker": "03 · Technology",
      "title": "Implementation stack",
      "stack": ["Laravel", "PHP", "MySQL"]
    }
  ]
}
```

No new HTML case-study file is required.

# Media & Publications system

Add media under:

`data/content.json` → `media.items`

For most sources, `title` + `url` is enough.

## Supported automatic players

- YouTube video, Shorts, Live, playlist
- YouTube `/channel/UC...` public uploads playlist
- Vimeo
- Dailymotion
- Instagram public post/Reel (when Instagram permits embedding)
- TikTok public video (when TikTok permits embedding)
- Facebook video links (when Facebook permits embedding)
- Spotify tracks, albums, playlists, shows, episodes
- SoundCloud
- Mixcloud
- direct MP4/WebM/MOV/M4V
- direct MP3/WAV/M4A/AAC/FLAC/OGG/Opus
- direct image URLs
- public PDF URLs
- public Google Drive file previews
- any other URL as an external resource card

Some platforms intentionally block third-party iframe playback. The site cannot bypass the platform's policy. In that case **Open original** remains available.

## YouTube video

```json
{
  "title": "Project Demo",
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "description": "Project walkthrough",
  "date": "2026",
  "tags": ["Laravel", "Demo"]
}
```

## Direct audio

```json
{
  "title": "Podcast Episode",
  "url": "https://example.com/podcast.mp3"
}
```

## Direct video

```json
{
  "title": "Product Demo",
  "url": "https://example.com/demo.mp4",
  "poster": "https://example.com/poster.jpg"
}
```

## PDF / paper

```json
{
  "title": "Research Paper",
  "url": "https://example.com/paper.pdf",
  "kind": "document"
}
```

## Custom platform

If a platform publishes an official iframe/player URL:

```json
{
  "title": "Custom Player",
  "url": "https://platform.example/item/123",
  "embedUrl": "https://platform.example/embed/123",
  "kind": "video",
  "platform": "Platform Name"
}
```

## Optional media fields

- `title`
- `url`
- `description`
- `date`
- `platform`
- `kind`: `video`, `audio`, `image`, `document`, `link`
- `thumbnail` / `poster`
- `alt`
- `embedUrl`
- `filename` (useful for Drive hints)
- `tags`
- `lazy`: load the third-party iframe only after visitor clicks

Global media behavior is under `media.settings`.

## Important hosting rule

All media must be public. A private Drive file, private social post, authenticated stream, or provider-disabled embed cannot be made playable by client-side code.


## Dynamic visual design (JSON only)

The site appearance is controlled by `data/content.json` under the `design` object. You can change the entire palette, typography, spacing, card radii, shadows, project columns, motion and component style without editing CSS.

```json
"design": {
  "defaultTheme": "dark",
  "allowThemeToggle": true,
  "palette": {
    "dark": { "background": "#07111f", "primary": "#7c5cff", "secondary": "#4fd1ff" },
    "light": { "background": "#f6f8fc", "primary": "#6d4aff", "secondary": "#0284c7" }
  },
  "typography": {
    "bodyFont": "Inter, system-ui, sans-serif",
    "headingFont": "Inter, system-ui, sans-serif",
    "baseSize": "16px",
    "lineHeight": "1.65"
  },
  "layout": {
    "containerWidth": "1180px",
    "sectionSpacing": "116px",
    "projectColumns": 2
  },
  "components": {
    "surfaceStyle": "glass",
    "buttonStyle": "gradient",
    "shapeStyle": "rounded",
    "motion": "full"
  }
}
```

Allowed component presets:
- `surfaceStyle`: `glass`, `solid`, `flat`
- `buttonStyle`: `gradient`, `solid`, `outline`
- `shapeStyle`: `rounded`, `soft`, `square`
- `motion`: `full`, `reduced`, `none`

`projectColumns` accepts 1–3 on desktop and automatically becomes one column on small screens. `projectMinHeight` directly controls the desktop project-card minimum height.


### Dynamic section order and visibility

`site.sectionOrder` controls the order of main sections. `site.hiddenSections` can hide any section by ID without deleting its content. Set `site.alternateSectionBackgrounds` to `true` to automatically recalculate alternating section backgrounds after reordering.

```json
"sectionOrder": ["home", "about", "research", "work", "media", "experience", "skills", "learning", "contact"],
"hiddenSections": ["creative"],
"alternateSectionBackgrounds": true
```

For custom web fonts, set `design.typography.fontStylesheet` to an HTTPS stylesheet URL (for example a Google Fonts CSS URL) and set `bodyFont` / `headingFont` to the matching CSS font-family.


## Media settings

`media.settings` controls the media UI:

```json
"settings": {
  "showFilters": true,
  "lazyEmbeds": false,
  "showProvider": true,
  "showOpenOriginal": true
}
```

- `showFilters`: show/hide the type filters.
- `lazyEmbeds`: load third-party iframe players only after a click.
- `showProvider`: show/hide provider names.
- `showOpenOriginal`: show/hide the separate source link.

Unknown social/video URLs are **not** forced into an HTML `<video>` element. If the platform is not supported and no official `embedUrl` is supplied, the site safely falls back to an external-resource card.

## Automatic section numbering

Set:

```json
"autoSectionNumbers": true
```

When sections are reordered or hidden, the eyebrow numbers are recalculated automatically, so labels do not become stale.

## Strong validation

Run:

```bash
python tools/validate.py
```

It now checks:

- JSON structure and design settings
- project slugs
- media item configuration
- navigation/section IDs
- duplicate HTML IDs
- missing local files
- required DOM containers
- CSS self-referencing variables
- JavaScript syntax
- media/link unit tests

You can also run the media/link tests directly:

```bash
node tools/test_core.js
```


## Real media playback test data

The default `data/content.json` now contains three real production-format test items:

1. **YouTube Mix** — the exact `RDB2xCioFEeCQ` playlist supplied for testing. The media engine detects `RD...` Mix IDs and embeds the seed video with the list preserved.
2. **NCS audio** — Elektronomia & JJD — Free. The `ncs.io/track/download/...` endpoint is recognized as native audio even though the URL has no `.mp3` suffix. `sourceUrl` points the visitor back to the official NCS track page.
3. **Pexels image** — a direct `images.pexels.com` asset. `sourceUrl` points back to its official Pexels photo page.

You can use an optional `sourceUrl` in any media item when the playable asset URL and the human-facing original page are different:

```json
{
  "title": "My audio",
  "url": "https://cdn.example.com/audio-stream",
  "sourceUrl": "https://example.com/my-audio-page",
  "kind": "audio"
}
```

`url` is used for playback. `sourceUrl` is used by **Open original**.


## YouTube exact embed URLs

For maximum reliability, you can provide the normal YouTube page in `url` and YouTube's copied embed `src` in `embedUrl`:

```json
{
  "title": "YouTube demo",
  "url": "https://www.youtube.com/watch?v=B2xCioFEeCQ",
  "embedUrl": "https://www.youtube-nocookie.com/embed/B2xCioFEeCQ?start=286",
  "alternateEmbedUrl": "https://www.youtube.com/embed/B2xCioFEeCQ?start=286",
  "kind": "video",
  "platform": "YouTube"
}
```

If you copy a URL from iframe HTML with `&amp;`, the site now normalizes it to `&` automatically. For YouTube, `alternateEmbedUrl` provides an optional standard-player fallback button when the privacy-enhanced player is blocked by a network or browser configuration.


## YouTube playback compatibility update

This build uses the standard `youtube.com/embed/...` player as the primary YouTube embed, adds the current hosted site origin automatically, keeps `strict-origin-when-cross-origin`, and loads YouTube only after the visitor clicks **Play video**. The click-to-play approach improves compatibility with browser autoplay/privacy rules.

If a particular YouTube video has **Allow embedding** disabled, is age-restricted, or is blocked by the viewer's network/region, no portfolio code can force it to play. The media card therefore always keeps an **Open on YouTube** fallback.


# v5 notes

- Project cards read an optional `image` field. The current files in `assets/img/projects/` are generated wireframe covers. Replace each with a real screenshot (16:9) and keep the same path, or change the `image` value in `data/content.json`.
- Creative cards also read an optional `image` field. Save a thumbnail (4:3) in `assets/img/creative/` and set `"image": "assets/img/creative/name.jpg"` on each item.
- `profile.cvUrl` points to `assets/Abu-Salah-Musha-Lemon-CV.pdf`. This PDF was generated from the site content. Replace it with your own CV if you have one, keeping the file name.
- Inter is now loaded from Google Fonts in every page head.
