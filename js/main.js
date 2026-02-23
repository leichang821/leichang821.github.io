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
  const entryRegex = /@(\w+)\s*\{([^,]+),\s*([\s\S]*?)\n\}/g;
  let match;
  while ((match = entryRegex.exec(text)) !== null) {
    const type = match[1].toLowerCase();
    const citekey = match[2].trim();
    const fields = {};
    const fieldRegex = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let fm;
    while ((fm = fieldRegex.exec(match[3])) !== null) {
      fields[fm[1].toLowerCase()] = fm[2].replace(/\{|\}/g, '').trim();
    }
    entries.push({ type, citekey, ...fields });
  }
  return entries;
}

// Format a single BibTeX author string "Last, First and Last, First"
function formatAuthors(authorStr) {
  if (!authorStr) return '';
  return authorStr.split(' and ').map(a => {
    const parts = a.split(',').map(s => s.trim());
    if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
    return a.trim();
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
  section.innerHTML = `
    <div class="container">
      <div class="about-wrapper">
        <div class="about-photo-placeholder">
          <!-- PHOTO: Replace assets/photo.jpg with your photo (400x400px) -->
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="30" r="18" fill="#c8b8b8"/>
            <ellipse cx="40" cy="72" rx="28" ry="18" fill="#c8b8b8"/>
          </svg>
        </div>
        <div class="about-info">
          <h1>${meta.name || 'Lei Chang'}</h1>
          <p class="subtitle">${meta.title || ''}</p>
          <p class="affiliation">${meta.affiliation || ''}</p>
          <div class="about-links">
            ${meta.email ? `<a href="mailto:${meta.email}">✉ ${meta.email}</a>` : ''}
            ${meta.google_scholar && meta.google_scholar !== '[URL placeholder]'
              ? `<a href="${meta.google_scholar}" target="_blank" rel="noopener">Google Scholar</a>` : ''}
          </div>
          <p class="research-focus">${body}</p>
        </div>
      </div>
    </div>`;
}

function renderProjects(projects) {
  const section = document.getElementById('projects');
  const cards = projects.map(p => {
    const bullets = p.bullets.map(b => `<li>${b}</li>`).join('');
    return `
      <div class="project-card">
        <h3>${p.title}</h3>
        <div class="meta">${p.role ? `${p.role}` : ''}${p.period ? ` &nbsp;·&nbsp; ${p.period}` : ''}</div>
        ${bullets ? `<ul>${bullets}</ul>` : ''}
      </div>`;
  }).join('');

  section.innerHTML = `
    <div class="container">
      <h2>Research Experience</h2>
      <div class="projects-grid">${cards}</div>
    </div>`;
}

function renderPublications(entries) {
  const section = document.getElementById('publications');

  const firstAuthor = entries.filter(e => e.keywords === 'first-author');
  const coAuthor = entries.filter(e => e.keywords === 'co-author');

  function renderGroup(title, items) {
    if (!items.length) return '';
    const lis = items.map(e => {
      const authors = highlightSelf(formatAuthors(e.author || ''));
      const journal = e.journal ? `<span class="journal">${e.journal}</span>` : '';
      const year = e.year ? `, ${e.year}` : '';
      const note = e.note ? ` <em>(${e.note})</em>` : '';
      return `<li>${authors}. "${e.title}"${journal ? '. ' + journal : ''}${year}.${note}</li>`;
    }).join('');
    return `<div class="pub-group"><h2>${title}</h2><ol class="pub-list">${lis}</ol></div>`;
  }

  section.innerHTML = `
    <div class="container">
      ${renderGroup('First Author &amp; Co-First Author Papers', firstAuthor)}
      ${renderGroup('Co-Author Papers (Selected)', coAuthor)}
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
