# Resume Builder (ATS-friendly)

A free resume builder with a clean, single-column, ATS-friendly layout. It runs entirely in the
browser with no server, so you can host it on GitHub Pages.

**Live site:** https://resumebuilder.innohexit.in/

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

