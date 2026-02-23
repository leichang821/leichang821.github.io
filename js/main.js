/* ===== Markdown / BibTeX Parsers & Renderers ===== */

// Parse YAML-like front matter and body from about.md
function parseAboutMd(text) {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { meta: {}, body: text.trim() };
  const meta = {};
  fmMatch[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    meta[key] = val;
  });
  return { meta, body: fmMatch[2].trim() };
}

// Parse projects.md — blocks separated by '---' on its own line
function parseProjectsMd(text) {
  // Split into raw experience blocks, each starts with a ## heading
  const blocks = text.split(/\n---\n/);
  const projects = [];
  let current = null;

  blocks.forEach(block => {
    block = block.trim();
    if (!block) return;

    const headingMatch = block.match(/^##\s+(.+)/m);
    if (headingMatch) {
      // This block contains a heading — it's the header part of an experience
      current = {
        title: headingMatch[1].trim(),
        period: '',
        role: '',
        bullets: []
      };
      // Parse meta lines: - **key**: value
      const metaLines = block.match(/^- \*\*(\w+)\*\*:\s*(.+)$/gm) || [];
      metaLines.forEach(line => {
        const m = line.match(/^- \*\*(\w+)\*\*:\s*(.+)$/);
        if (m) current[m[1].trim()] = m[2].trim();
      });
      projects.push(current);
    } else if (current) {
      // This block is the bullet list for the previous heading
      const bulletLines = block.match(/^- .+$/gm) || [];
      current.bullets = bulletLines.map(l => l.replace(/^- /, '').trim());
    }
  });

  return projects;
}

// Parse BibTeX from publications.bib
function parseBib(text) {
  const entries = [];
  const seen = new Set();
  const entryRegex = /@(\w+)\s*\{([^,]+),\s*([\s\S]*?)\n\}/g;
  let match;
  while ((match = entryRegex.exec(text)) !== null) {
    const type = match[1].toLowerCase();
    if (type === 'comment' || type === 'string' || type === 'preamble') continue;
    const citekey = match[2].trim();
    if (seen.has(citekey)) continue; // skip duplicates
    seen.add(citekey);
    const fields = {};
    const fieldRegex = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let fm;
    while ((fm = fieldRegex.exec(match[3])) !== null) {
      // Strip braces and clean LaTeX escape sequences like {\'a} -> a
      const val = fm[2]
        .replace(/\{\\['`^"~=.]\s*(\w)\}/g, '$1')  // {\'a} -> a
        .replace(/\{(\w)\}/g, '$1')                  // {N} -> N
        .replace(/\{|\}/g, '')                        // remaining braces
        .replace(/\\/g, '')                           // stray backslashes
        .trim();
      fields[fm[1].toLowerCase()] = val;
    }
    entries.push({ type, citekey, ...fields });
  }
  return entries;
}

// Detect if "Chang, Lei" is the first author in a BibTeX author string
function isChangFirstAuthor(authorStr) {
  if (!authorStr) return false;
  const first = authorStr.split(' and ')[0].toLowerCase().trim();
  return first.startsWith('chang,') || first.startsWith('chang ');
}

// Detect if "Chang" (Lei Chang) appears anywhere in author string
function isChangAuthor(authorStr) {
  if (!authorStr) return false;
  return /chang,?\s+l(ei)?[\s,;]/i.test(authorStr + ' ') || /\bchang, lei\b/i.test(authorStr);
}

// Format a single BibTeX author string "Last, First and Last, First" -> "First Last, ..."
function formatAuthors(authorStr) {
  if (!authorStr) return '';
  const parts = authorStr.split(' and ');
  return parts.map((a, i) => {
    a = a.trim();
    if (a === 'others') return 'et al.';
    const nameParts = a.split(',').map(s => s.trim());
    if (nameParts.length === 2) return `${nameParts[1]} ${nameParts[0]}`;
    return a;
  }).join(', ');
}

// Bold "Lei Chang" occurrences in HTML string
function highlightSelf(html) {
  return html.replace(/Lei Chang/g, '<strong class="author-highlight">Lei Chang</strong>');
}

/* ===== Renderers ===== */

function renderAbout(data) {
  const { meta, body } = data;
  const section = document.getElementById('about');

  // Use photo if assets/photo.jpg exists, else SVG placeholder
  const photoHtml = `
    <div class="about-photo-placeholder">
      <!-- PHOTO: drop assets/photo.jpg (400x400px) and replace this div with:
           <img src="assets/photo.jpg" class="about-photo" alt="Lei Chang"> -->
      <svg width="72" height="72" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="30" r="18" fill="#C9BDB5"/>
        <ellipse cx="40" cy="72" rx="28" ry="18" fill="#C9BDB5"/>
      </svg>
    </div>`;

  section.innerHTML = `
    <div class="container">
      <div class="about-wrapper">
        <div class="about-info">
          <h1>${meta.name || 'Lei Chang'}</h1>
          <p class="subtitle">${meta.title || ''}</p>
          <p class="affiliation">${meta.affiliation || ''}</p>
          <div class="about-links">
            ${meta.email ? `<a href="mailto:${meta.email}">${meta.email}</a>` : ''}
            ${meta.google_scholar && meta.google_scholar !== '[URL placeholder]'
              ? `<a href="${meta.google_scholar}" target="_blank" rel="noopener">Google Scholar</a>` : ''}
          </div>
          <p class="research-focus">${body}</p>
        </div>
        ${photoHtml}
      </div>
    </div>`;
}

function renderProjects(projects) {
  const section = document.getElementById('projects');
  const cards = projects.map(p => {
    const bullets = p.bullets.map(b => `<li>${b}</li>`).join('');
    return `
      <div class="project-card">
        <div class="project-card-left">
          <h3>${p.title}</h3>
          <div class="meta">${p.period || ''}${p.role ? '<br>' + p.role : ''}</div>
        </div>
        <div class="project-card-right">
          ${bullets ? `<ul>${bullets}</ul>` : ''}
        </div>
      </div>`;
  }).join('');

  section.innerHTML = `
    <div class="container">
      <h2>Research Experience</h2>
      <div class="projects-grid">${cards}</div>
    </div>`;
}

// Return the 0-based position of Lei Chang in the author list
function changAuthorPosition(authorStr) {
  if (!authorStr) return 999;
  return authorStr.split(' and ').findIndex(a => /chang,?\s+l(ei)?[\s,;]?$/i.test(a.trim() + ' '));
}

function renderPublications(entries) {
  const section = document.getElementById('publications');

  const sorted = entries
    .filter(e => isChangAuthor(e.author || ''))
    .sort((a, b) => {
      const yearDiff = (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
      if (yearDiff !== 0) return yearDiff;
      return changAuthorPosition(a.author) - changAuthorPosition(b.author);
    });

  const lis = sorted.map(e => {
    const authors = highlightSelf(formatAuthors(e.author || ''));
    const journal = e.journal ? `<span class="journal">${e.journal}</span>` : '';
    const volIssuePages = [e.volume, e.number ? `(${e.number})` : '', e.pages].filter(Boolean).join('');
    const year = e.year ? `, ${e.year}` : '';
    return `<li><span>${authors}. ${e.title}${journal ? '. ' + journal : ''}${volIssuePages ? ', ' + volIssuePages : ''}${year}.</span></li>`;
  }).join('');

  section.innerHTML = `
    <div class="container">
      <h2>Publications</h2>
      <ol class="pub-list">${lis}</ol>
    </div>`;
}

/* ===== Navigation ===== */

function initNav() {
  // Hamburger toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Smooth scroll + close mobile menu on click
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      navLinks && navLinks.classList.remove('open');
    });
  });

  // Active link on scroll
  const sections = ['about', 'projects', 'publications'];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav-links a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/* ===== Main ===== */

async function main() {
  try {
    const [aboutText, projectsText, bibText] = await Promise.all([
      fetch('content/about.md').then(r => r.text()),
      fetch('content/projects.md').then(r => r.text()),
      fetch('content/publications.bib').then(r => r.text()),
    ]);

    renderAbout(parseAboutMd(aboutText));
    renderProjects(parseProjectsMd(projectsText));
    renderPublications(parseBib(bibText));
    initNav();
  } catch (err) {
    console.error('Failed to load content:', err);
  }
}

document.addEventListener('DOMContentLoaded', main);
