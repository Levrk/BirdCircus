let REVIEWS = [];
const TYPES = ['All', 'Game', 'Album', 'Movie', 'Book'];
const PAGE_SIZE = 9;
let typeFilterIndex = 0;
let currentPage = 1;

// Fetch the separated JSON file on load
async function init() {
  try {
    // Use ./reviews.json so it respects the repository subfolder path on GitHub
    // Pages
    const response = await fetch('./reviews.json');
    if (!response.ok) throw new Error('Network response was not ok');
    REVIEWS = await response.json();
    render();
  } catch (err) {
    console.error('Failed to load reviews.json:', err);
  }
}

function createReviewImage(review) {
  const image = document.createElement('img');
  image.src = `./images/${review.id}.png`;
  image.alt = review.title;
  image.onerror = () => image.style.display = 'none';
  return image;
}

function render() {
  const sortVal = document.getElementById('sort-select').value;
  const typeFilter = TYPES[typeFilterIndex];

  // Filter first so the selected type and sort are applied together.
  const sorted = REVIEWS
      .filter(r => typeFilter === 'All' || r.type === typeFilter)
      .sort((a, b) => {
    if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortVal === 'rating-desc') return b.rating - a.rating;
    if (sortVal === 'rating-asc') return a.rating - b.rating;
  });

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, pageCount || 1);
  const pageReviews = sorted.slice(
      (currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Render Feed
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  pageReviews.forEach(r => {
    const div = document.createElement('div');
    div.className = 'review-item';
    const image = createReviewImage(r);
    image.onclick = () => openModal(r.id);
    div.appendChild(image);
    div.insertAdjacentHTML('beforeend', `
          <div class="review-meta">
              <span class="review-title" onclick="openModal('${r.id}')">${
        r.title}</span>
              <span>${r.rating}</span>
          </div>
          <div class="review-date">${r.date}</div>
          <div class="review-text">${r.snippet || ''}</div>
      `);
    feed.appendChild(div);
  });

  renderPagination(pageCount);

  // Render Sidebar
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  sorted.forEach(r => {
    const div = document.createElement('div');
    div.className = 'sidebar-item';
    div.onclick = () => openModal(r.id);
    const title = document.createElement('span');
    title.textContent = r.title;
    div.appendChild(title);
    sidebar.appendChild(div);
  });
}

function renderPagination(pageCount) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  if (pageCount <= 1) return;

  if (currentPage > 1) {
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = 'PREVIOUS';
    previous.onclick = () => {
      currentPage -= 1;
      render();
    };
    pagination.appendChild(previous);
  }

  for (let page = 1; page <= pageCount; page += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(page);
    button.setAttribute('aria-label', `Page ${page}`);
    button.setAttribute('aria-current', page === currentPage ? 'page' : 'false');
    button.disabled = page === currentPage;
    button.onclick = () => {
      currentPage = page;
      render();
    };
    pagination.appendChild(button);
  }

  if (currentPage < pageCount) {
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = 'NEXT';
    next.onclick = () => {
      currentPage += 1;
      render();
    };
    pagination.appendChild(next);
  }
}

function openModal(id) {
  const r = REVIEWS.find(x => x.id === id);
  if (!r) return;
  document.getElementById('modal-body').innerHTML = marked.parse(r.markdown);
  document.getElementById('modal').classList.remove('hidden');
}

document.getElementById('modal-close').onclick = () => {
  document.getElementById('modal').classList.add('hidden');
};

document.getElementById('sort-select').onchange = () => {
  currentPage = 1;
  render();
};

document.getElementById('type-filter').onclick = event => {
  currentPage = 1;
  typeFilterIndex = (typeFilterIndex + 1) % TYPES.length;
  const typeFilter = TYPES[typeFilterIndex];
  event.currentTarget.textContent = `[ TYPE: ${typeFilter.toUpperCase()} ]`;
  event.currentTarget.setAttribute(
      'aria-label', `Filter by type: ${typeFilter.toLowerCase()}`);
  render();
};

init();