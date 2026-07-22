const stage = document.querySelector('#stage');
let currentId = null;
let advanceTimer = null;
let lastAdvanceId = null;

function requestAdvance(id) {
  if (lastAdvanceId === id) return;
  lastAdvanceId = id;
  fetch('/advance', { method: 'POST' }).catch(() => {});
}

function show(state) {
  document.documentElement.style.setProperty('--transition', `${state.transitionMs}ms`);
  const item = state.items.find((entry) => entry.id === state.currentId);
  if (state.currentId === currentId && item) {
    const video = stage.querySelector('video');
    if (video) { video.muted = state.muted; video.volume = state.volume; }
    return;
  }
  currentId = state.currentId;
  lastAdvanceId = null;
  clearTimeout(advanceTimer);
  const previous = stage.firstElementChild;
  if (!item) {
    if (previous) { previous.classList.remove('visible'); setTimeout(() => previous.remove(), state.transitionMs); }
    return;
  }
  const media = document.createElement(item.type === 'video' ? 'video' : 'img');
  media.src = `/media/${encodeURIComponent(item.fileName)}`;
  media.alt = item.name;
  if (item.type === 'video') {
    media.autoplay = true; media.playsInline = true; media.muted = state.muted; media.volume = state.volume;
    media.addEventListener('ended', () => { if (state.autoAdvance) requestAdvance(item.id); });
    media.addEventListener('canplay', () => media.play().catch(() => {}), { once: true });
  } else if (state.autoAdvance) {
    advanceTimer = setTimeout(() => requestAdvance(item.id), Math.max(1, state.imageDuration) * 1000);
  }
  stage.append(media);
  requestAnimationFrame(() => requestAnimationFrame(() => media.classList.add('visible')));
  if (previous) { previous.classList.remove('visible'); setTimeout(() => previous.remove(), state.transitionMs + 50); }
}

const events = new EventSource('/events');
events.onmessage = (event) => show(JSON.parse(event.data));
