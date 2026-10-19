# Resume Builder (ATS-friendly)

A no-install, offline-capable resume builder with a clean single-column,
ATS-friendly layout. "Load sample" fills it with a fictional example resume.

## Use

1. Open `index.html` in Chrome or Edge (double-click is fine — no server needed).
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

## Why it is ATS-friendly

- Single column, real text, standard headings, no tables, images or icons.
- Contact details are in the body of the page, not in the page header or footer.
- The browser generates the PDF with embedded fonts, so the text can be selected and parsed in reading order.

## Files

- `index.html`: app shell
- `css/resume.css`: resume look, shared by the preview and the PDF
- `css/app.css`: editor UI
- `js/render.js`: data → resume HTML / plain text
- `js/ats.js`: ATS checks and keyword matching
- `js/app.js`: editor, preview, export
- `js/sample.js`: sample data
