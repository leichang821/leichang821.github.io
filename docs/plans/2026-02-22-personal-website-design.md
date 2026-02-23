# Personal Website Design — Lei Chang

## Overview
Single-page static site for GitHub Pages (leichang821.github.io). Content in separate markdown files for easy editing. No build step.

## Tech Stack
Pure HTML/CSS/JS. Markdown content loaded at runtime via JS. No frameworks or build tools.

## File Structure
```
leichang821.github.io/
├── index.html
├── css/style.css
├── js/main.js
├── content/
│   ├── about.md
│   ├── projects.md
│   └── publications.md
├── assets/photo-placeholder.png
└── CV_LeiChang.docx
```

## Color Theme (Mindify-inspired)
All colors defined as CSS custom properties in `:root` for easy theming.

| Role           | Hex       |
|----------------|-----------|
| Background     | `#fafafa` |
| Card/Surface   | `#ffffff` |
| Primary text   | `#262626` |
| Secondary text | `#575757` |
| Accent         | `#7a3b3b` |
| Accent hover   | `#8f4a4a` |
| Section alt bg | `#f5f0ed` |

## Layout: Top Nav + Full Width Sections

1. **Sticky nav**: Name left, section links right. Hamburger on mobile.
2. **About**: Photo (placeholder) + name/title/affiliation + research focus. From `about.md`.
3. **Projects**: Card grid (2-col desktop, 1-col mobile). All 4 research experiences. From `projects.md`.
4. **Publications**: Grouped list (first-author, co-first). "Lei Chang" auto-bolded. From `publications.md`.
5. **Footer**: Name, email, last-updated date.

## Content Format
Markdown with simple structure. JS parses headings, metadata lines (`- **key**: value`), and body bullets into HTML components.

## Responsive
Mobile-first CSS. Hamburger nav, single-column cards, readable typography at all sizes.
