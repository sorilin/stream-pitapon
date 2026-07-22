const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);

const SETTING_RULES = {
  width: [100, 7680, 1920],
  height: [100, 4320, 1080],
  imageDuration: [1, 3600, 8],
  transitionMs: [0, 3000, 250],
  volume: [0, 1, 1]
};

function mediaType(filePath) {
  const extension = path.extname(String(filePath)).toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return null;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeSettings(input, current) {
  const result = {};
  for (const [key, [min, max, fallback]] of Object.entries(SETTING_RULES)) {
    if (Object.hasOwn(input, key)) result[key] = clampNumber(input[key], min, max, current[key] ?? fallback);
  }
  for (const key of ['autoAdvance', 'loopPlaylist', 'muted']) {
    if (Object.hasOwn(input, key)) result[key] = input[key] === true;
  }
  return result;
}

function nextItemId(items, currentId, direction = 1, loop = true) {
  if (!items.length) return null;
  let index = items.findIndex((item) => item.id === currentId);
  if (index < 0) return direction < 0 ? items.at(-1).id : items[0].id;
  const candidate = index + (direction < 0 ? -1 : 1);
  if (loop) return items[(candidate + items.length) % items.length].id;
  return items[Math.max(0, Math.min(items.length - 1, candidate))].id;
}

function parseByteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size <= 0) return false;
  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return false;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= size) return false;
  end = Math.min(end, size - 1);
  return { start, end };
}

function isSafeMediaName(fileName) {
  return typeof fileName === 'string' && fileName.length > 0 && path.basename(fileName) === fileName && !fileName.includes('\0');
}

module.exports = {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  mediaType,
  normalizeSettings,
  nextItemId,
  parseByteRange,
  isSafeMediaName
};
