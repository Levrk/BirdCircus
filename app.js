let REVIEWS = [];
let is3Col = false;

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

function render() {
  const sortVal = document.getElementById('sort-select').value;

  // Sort array copy
  const sorted = [...REVIEWS].sort((a, b) => {
    if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortVal === 'rating-desc') return b.rating - a.rating;
    if (sortVal === 'rating-asc') return a.rating - b.rating;
  });

  // Render Feed
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  sorted.forEach(r => {
    const div = document.createElement('div');
    div.className = 'review-item';
    div.innerHTML = `
          <img src="${r.image}" onclick="openModal('${
        r.id}')" onerror="this.style.display='none'">
          <div class="review-meta">
              <span class="review-title" onclick="openModal('${r.id}')">${
        r.title}</span>
              <span>${r.rating}</span>
          </div>
          <div class="review-date">${r.date}</div>
          <div class="review-text">${r.snippet || ''}</div>
      `;
    feed.appendChild(div);
  });

  // Render Sidebar
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  sorted.forEach(r => {
    const div = document.createElement('div');
    div.className = 'sidebar-item';
    div.onclick = () => openModal(r.id);
    div.innerHTML = `
          <img src="${r.image}" onerror="this.style.display='none'">
          <span>${r.title}</span>
      `;
    sidebar.appendChild(div);
  });
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

document.getElementById('sort-select').onchange = render;

document.getElementById('col-toggle').onclick = () => {
  is3Col = !is3Col;
  const feed = document.getElementById('feed');
  feed.className = is3Col ? 'col-3' : 'col-1';
  document.getElementById('col-toggle').textContent =
      is3Col ? '[ 3 COL ]' : '[ 1 COL ]';
};

init();