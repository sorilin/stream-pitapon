const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mediaType, normalizeSettings, nextItemId, parseByteRange, isSafeMediaName
} = require('../src/core');

test('mediaType recognizes supported image formats case-insensitively', () => {
  for (const file of ['photo.png', 'photo.JPG', 'graphic.webp', 'anim.GIF', 'image.avif']) {
    assert.equal(mediaType(file), 'image');
  }
});

test('mediaType recognizes supported video formats and rejects other files', () => {
  for (const file of ['clip.mp4', 'clip.WEBM', 'clip.mov', 'clip.m4v', 'clip.ogv']) {
    assert.equal(mediaType(file), 'video');
  }
  assert.equal(mediaType('notes.txt'), null);
  assert.equal(mediaType('no-extension'), null);
});

test('normalizeSettings clamps numbers and accepts only strict booleans', () => {
  const current = { width: 1920, height: 1080, imageDuration: 8, transitionMs: 250, volume: 1 };
  assert.deepEqual(normalizeSettings({
    width: 99999, height: 10, imageDuration: '12', transitionMs: -5,
    volume: 0.45, autoAdvance: true, loopPlaylist: 'true', muted: false,
    unexpected: 'ignored'
  }, current), {
    width: 7680, height: 100, imageDuration: 12, transitionMs: 0,
    volume: 0.45, autoAdvance: true, loopPlaylist: false, muted: false
  });
});

test('normalizeSettings keeps current numeric value when input is invalid', () => {
  assert.deepEqual(normalizeSettings({ width: 'nope', volume: Infinity }, { width: 1280, volume: 0.7 }), { width: 1280, volume: 0.7 });
});

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

test('nextItemId moves forward and backward', () => {
  assert.equal(nextItemId(items, 'b', 1, true), 'c');
  assert.equal(nextItemId(items, 'b', -1, true), 'a');
});

test('nextItemId loops or stops at playlist boundaries', () => {
  assert.equal(nextItemId(items, 'c', 1, true), 'a');
  assert.equal(nextItemId(items, 'a', -1, true), 'c');
  assert.equal(nextItemId(items, 'c', 1, false), 'c');
  assert.equal(nextItemId(items, 'a', -1, false), 'a');
});

test('nextItemId handles empty and unknown selections', () => {
  assert.equal(nextItemId([], null), null);
  assert.equal(nextItemId(items, 'missing', 1), 'a');
  assert.equal(nextItemId(items, 'missing', -1), 'c');
});

test('parseByteRange parses bounded, open-ended and suffix ranges', () => {
  assert.deepEqual(parseByteRange('bytes=10-19', 100), { start: 10, end: 19 });
  assert.deepEqual(parseByteRange('bytes=90-', 100), { start: 90, end: 99 });
  assert.deepEqual(parseByteRange('bytes=-10', 100), { start: 90, end: 99 });
  assert.deepEqual(parseByteRange('bytes=90-200', 100), { start: 90, end: 99 });
});

test('parseByteRange rejects malformed or unsatisfiable ranges', () => {
  for (const range of ['items=0-1', 'bytes=20-10', 'bytes=100-101', 'bytes=-0', 'bytes=a-b', 'bytes=0-1,4-5']) {
    assert.equal(parseByteRange(range, 100), false);
  }
  assert.equal(parseByteRange(undefined, 100), null);
});

test('isSafeMediaName blocks directory traversal', () => {
  assert.equal(isSafeMediaName('abc-123.mp4'), true);
  assert.equal(isSafeMediaName('../secret.txt'), false);
  assert.equal(isSafeMediaName('folder/file.png'), false);
  assert.equal(isSafeMediaName('folder\\file.png'), false);
  assert.equal(isSafeMediaName(''), false);
});
