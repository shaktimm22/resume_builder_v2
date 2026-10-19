# Resume Builder (ATS-friendly)

A free resume builder with a clean, single-column, ATS-friendly layout. It runs entirely in the
browser with no server, so you can host it on GitHub Pages.

**Live site:** https://shaktimm22.github.io/resume_builder_v2/

## Use

1. Open the site (or `index.html` locally) and click **Build my resume**.
2. Edit on the left; the A4 preview on the right updates live. Your work autosaves in the browser.
3. **Download PDF** → choose **Save as PDF**, and turn **Headers and footers** off.

| Button | What it does |
|---|---|
| Export JSON / Import JSON | Save or load your resume data (keep one file per job you apply to) |
| Copy text / .txt | Plain-text version for pasting into job-portal forms |
| New blank / Load sample | Start over (export first — this replaces current content) |

Tabs:
- **Content**: header, contact details, and sections. You can add, reorder, hide, rename or delete sections, and add or reorder entries. Bullets are one per line, and `**bold**` is supported.
- **Design**: page size (A4/Letter), font, size, spacing, margins, accent colour, skills layout, and *Fit to 1/2 pages*.
- **ATS check**: format and content checks with a readiness score. Paste a job description to see which keywords match and which are missing.

`builder.html?start=blank` opens an empty resume. If you already have a saved resume, it asks before replacing it.

## Deploy on GitHub Pages

1. Push to the `main` branch.
2. In the repo, open **Settings → Pages → Build and deployment**, set *Source: Deploy from a branch*, and choose *Branch: `main` / `(root)`*.
3. The site goes live at `https://shaktimm22.github.io/resume_builder_v2/`.

If the repo name or username changes, update the absolute URLs in `index.html`, `builder.html`,
`sitemap.xml` and `404.html`.

## SEO checklist

The pages already have titles and descriptions, canonical URLs, Open Graph and Twitter tags with a
share image, structured data (`WebApplication` and `FAQPage`), `sitemap.xml`, a favicon, a 404 page
and a mobile-friendly layout. To get indexed:

1. Add the site in [Google Search Console](https://search.google.com/search-console) as a
   *URL prefix* property: `https://shaktimm22.github.io/resume_builder_v2/`. Verify it with the
   HTML-tag method by pasting the `<meta name="google-site-verification" …>` tag into the `<head>`
   of `index.html`.
2. Submit `sitemap.xml` in Search Console, then use **URL Inspection → Request indexing** on the
   home page.
3. Do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters), which can import from Google.
4. Share the link on LinkedIn, GitHub and Reddit. Backlinks are what move rankings most.

A `robots.txt` file only works at the domain root (`shaktimm22.github.io/robots.txt`), so a
project site can't use one. Submit the sitemap through Search Console instead.

## Files

- `index.html` + `css/landing.css`: welcome page (guide, features, ATS tips, FAQ)
- `builder.html`: the builder app
- `css/resume.css`: resume look, shared by the preview and the PDF
- `css/app.css`: builder UI
- `js/render.js`: data → resume HTML / plain text
- `js/ats.js`: ATS checks and keyword matching
- `js/app.js`: editor, preview, export
- `js/sample.js`: sample data (fictional)
- `assets/`: favicon, share image, resume preview
- `sitemap.xml`, `404.html`, `.nojekyll`: GitHub Pages / SEO support
