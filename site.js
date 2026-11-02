const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
}

// The public mirror stores photographs as text so they can be maintained in GitHub's web editor.
async function loadPhoto(name) {
  const response = await fetch(`./assets/${name}.b64`);
  if (!response.ok) throw new Error(`Photo ${name}: HTTP ${response.status}`);
  return `data:image/jpeg;base64,${(await response.text()).replace(/\s+/g, '')}`;
}

const hero = document.querySelector('.hero');
const heroNames = {
  'hero--home': 'home-hero',
  'hero--publications': 'publications-hero',
  'hero--cv': 'cv-hero',
  'hero--interests': 'interests-hero',
};
for (const [className, name] of Object.entries(heroNames)) {
  if (hero?.classList.contains(className)) {
    loadPhoto(name)
      .then(src => hero.style.setProperty('--hero-image', `url("${src}")`))
      .catch(error => console.error('Unable to load hero photo:', error));
    break;
  }
}

for (const img of document.querySelectorAll('img[src^="./assets/"]')) {
  const name = img.getAttribute('src').split('/').at(-1).replace(/\.jpg$/, '');
  loadPhoto(name)
    .then(src => { img.src = src; })
    .catch(error => console.error('Unable to load page photo:', error));
}

async function renderPublications() {
  const targets = {
    published: document.querySelector('#published-list'),
    preprints: document.querySelector('#preprints-list'),
    projects: document.querySelector('#projects-list'),
  };
  if (!targets.published) return;

  try {
    const response = await fetch('./data/publications.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    for (const [key, target] of Object.entries(targets)) {
      target.replaceChildren();
      for (const paper of data[key] || []) {
        const item = document.createElement('li');
        item.className = 'publication-item';
        const body = document.createElement('div');
        const title = document.createElement('span');
        title.className = 'publication-title';
        title.textContent = paper.title;
        body.append(title);
        if (paper.authors) {
          const authors = document.createElement('span');
          authors.className = 'publication-authors';
          let previous = 0;
          for (const match of paper.authors.matchAll(/\bCe Wang\b/g)) {
            authors.append(paper.authors.slice(previous, match.index));
            const name = document.createElement('strong');
            name.textContent = match[0];
            authors.append(name);
            previous = match.index + match[0].length;
          }
          authors.append(paper.authors.slice(previous));
          body.append(authors);
        }
        const venueText = [paper.venue, paper.year].filter(Boolean).join(' · ');
        if (venueText) {
          const venue = document.createElement('span');
          venue.className = 'publication-venue';
          venue.textContent = venueText;
          body.append(venue);
        }
        if (paper.links?.length) {
          const links = document.createElement('span');
          links.className = 'publication-links';
          for (const link of paper.links) {
            if (!/^https?:\/\//.test(link.url)) continue;
            const anchor = document.createElement('a');
            anchor.href = link.url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.textContent = link.label;
            links.append(anchor);
          }
          body.append(links);
        }
        item.append(body);
        target.append(item);
      }
    }
  } catch (error) {
    for (const target of Object.values(targets)) {
      target.innerHTML = '<li class="small">The publication list is temporarily unavailable. Please visit the Google Scholar profile linked above.</li>';
    }
    console.error('Unable to load publications:', error);
  }
}

renderPublications();
