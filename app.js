let REVIEWS = [];
const TYPES = ['All', 'Game', 'Album', 'Movie', 'Book'];
const PAGE_SIZE = 9;
const TRACKS = [
  'wished bone - yellowstoned.mp3',
  'kinoue64 - 被害者.mp3',
  'wished bone - spring time lover.mp3',
  'Parannoul - 아날로그 센티멘탈리즘.mp3',
  'kinoue64 - 日常消滅.mp3',
];
let typeFilterIndex = 0;
let currentPage = 1;
let currentTrackIndex = 0;

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
  const sorted =
      REVIEWS.filter(r => typeFilter === 'All' || r.type === typeFilter)
          .sort((a, b) => {
            if (sortVal === 'date-desc')
              return new Date(b.date) - new Date(a.date);
            if (sortVal === 'date-asc')
              return new Date(a.date) - new Date(b.date);
            if (sortVal === 'rating-desc') return b.rating - a.rating;
            if (sortVal === 'rating-asc') return a.rating - b.rating;
          });

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, pageCount || 1);
  const pageReviews =
      sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Render Feed
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  pageReviews.forEach(r => {
    const div = document.createElement('div');
    div.className = 'review-item';
    const imageContainer = document.createElement('div');
    imageContainer.className = 'review-image-container';
    const image = createReviewImage(r);
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Open review: ${r.title}`);
    image.onclick = () => openModal(r.id);
    image.onpointerenter = () => showSnippetTicker(r.snippet);
    image.onpointerleave = hideSnippetTicker;
    image.onfocus = () => showSnippetTicker(r.snippet);
    image.onblur = hideSnippetTicker;
    image.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(r.id);
      }
    };
    imageContainer.appendChild(image);
    div.appendChild(imageContainer);
    div.insertAdjacentHTML(
        'beforeend',
        `
          <div class="review-meta">
              <span class="review-title" onclick="openModal('${r.id}')">${
            r.title}</span>
              <span>${r.rating}</span>
          </div>
          <div class="review-date">${r.date}</div>
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

function showSnippetTicker(snippet = '') {
  if (!snippet) return;
  const ticker = document.getElementById('snippet-ticker');
  const [visibleText, repeatedText] =
      ticker.querySelectorAll('.snippet-ticker-track span');
  visibleText.textContent = snippet;
  repeatedText.textContent = snippet;
  ticker.classList.add('visible');
}

function hideSnippetTicker() {
  document.getElementById('snippet-ticker').classList.remove('visible');
}

function loadTrack(index) {
  currentTrackIndex = (index + TRACKS.length) % TRACKS.length;
  const track = TRACKS[currentTrackIndex];
  document.getElementById('audio-player').src =
      `./music/${encodeURIComponent(track)}`;
  document.getElementById('current-track').textContent = track;
  document.title = track;
}

function updatePlayButton() {
  const audio = document.getElementById('audio-player');
  const button = document.getElementById('play-toggle');
  const isPlaying = !audio.paused;
  button.textContent = isPlaying ? '[ PAUSE ]' : '[ PLAY ]';
  button.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
}

function skipTrack() {
  const audio = document.getElementById('audio-player');
  const shouldPlay = !audio.paused || audio.ended;
  loadTrack(currentTrackIndex + 1);
  if (shouldPlay) {
    audio.play().catch(error => {
      console.error('Failed to play the next track:', error);
    });
  }
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
    button.setAttribute(
        'aria-current', page === currentPage ? 'page' : 'false');
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

async function openModal(id) {
  const r = REVIEWS.find(x => x.id === id);
  if (!r) return;
  try {
    const response = await fetch(`./reviews/${id}.md`);
    if (!response.ok) {
      throw new Error(`Failed to load review ${id}: ${response.status}`);
    }
    const markdown = await response.text();
    document.getElementById('modal-body').innerHTML = marked.parse(markdown);
    document.getElementById('modal').classList.remove('hidden');
  } catch (err) {
    console.error(`Failed to open review ${id}:`, err);
  }
}

document.getElementById('modal-close').onclick = () => {
  document.getElementById('modal').classList.add('hidden');
};

document.getElementById('play-toggle').onclick = () => {
  const audio = document.getElementById('audio-player');
  if (audio.paused) {
    audio.play().catch(error => {
      console.error('Failed to play track:', error);
    });
  } else {
    audio.pause();
  }
};

document.getElementById('skip-button').onclick = skipTrack;
const audioPlayer = document.getElementById('audio-player');
audioPlayer.onended = skipTrack;
audioPlayer.onplay = updatePlayButton;
audioPlayer.onpause = updatePlayButton;

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

if (TRACKS.length > 0) loadTrack(0);
init();