import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { getChorusSuggestion, getSectionTime, restoreStudioCheckpoint, trimSection } from '../src/utils/studioPlayback.mjs';

const section = { start: 15, end: 35, loopCount: 2, youtubeVideoId: 'video' };

test('Chorus Mode can suggest a section as soon as a song length is available', () => {
  assert.equal(getChorusSuggestion(0), null);
  assert.deepEqual(getChorusSuggestion(200.8), { start: 50, end: 80 });
  assert.deepEqual(getChorusSuggestion(12.3), { start: 3, end: 12 });
});

test('moving Start preserves End and leaves at least one second', () => {
  assert.deepEqual(trimSection(section, 'start', 50, 120), { ...section, start: 34 });
  assert.deepEqual(trimSection(section, 'start', 20, 120), { ...section, start: 20 });
});

test('moving End preserves Start and shares the same song timeline', () => {
  assert.deepEqual(trimSection(section, 'end', 52, 120), { ...section, end: 52 });
  assert.deepEqual(trimSection(section, 'end', 5, 120), { ...section, end: 16 });
  assert.deepEqual(trimSection(section, 'end', 100, 120), { ...section, end: 60 });
});

test('trims fit short sources and ignore invalid edits', () => {
  assert.deepEqual(trimSection(section, 'end', 35, 12), { ...section, start: 11, end: 12 });
  assert.equal(trimSection(section, 'end', '', 120), section);
});

test('adjacent snippets can share a timestamp without moving their other boundaries', () => {
  const first = trimSection({ start: 50, end: 74 }, 'end', 80, 200);
  const second = trimSection({ start: 84, end: 100 }, 'start', 80, 200);
  assert.deepEqual(first, { start: 50, end: 80 });
  assert.deepEqual(second, { start: 80, end: 100 });
});

test('interrupted timestamps stay within the current section', () => {
  assert.equal(getSectionTime(section, null), 15);
  assert.equal(getSectionTime(section, 29.875), 29.875);
  assert.equal(getSectionTime(section, 40), 35);
});

test('a restored draft keeps its selected section and safe position', () => {
  const sections = [{ start: 0, end: 20 }, section];
  const checkpoint = { index: 1, time: 42, iteration: 1, selection: 1 };
  assert.deepEqual(restoreStudioCheckpoint(checkpoint, sections), { ...checkpoint, time: 35 });
  assert.equal(restoreStudioCheckpoint({ ...checkpoint, index: 2 }, sections), null);
  assert.equal(restoreStudioCheckpoint({ ...checkpoint, time: null }, sections), null);
});

const playerSource = await readFile(new URL('../src/utils/playlistUtils.js', import.meta.url), 'utf8');
const { PlaylistPlayer } = await import('data:text/javascript;base64,' + Buffer.from(playerSource).toString('base64'));

test('playlist handoff stays in standby during Studio editing', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const events = [];
  let mayAdvance = true;
  const clips = [{ youtubeVideoId: 'first' }, { youtubeVideoId: 'second' }];
  const player = new PlaylistPlayer({ clips }, { current: {
    loadVideoById: ({ videoId }) => events.push(videoId),
    pauseVideo() {},
    playVideo: () => events.push('forced autoplay')
  } }, { canAdvance: () => mayAdvance, showNotification() {} });

  await player.playNext();
  player.advanceToNextClip();
  mayAdvance = false;
  context.mock.timers.tick(2000);
  assert.deepEqual(events, ['first']);
});

test('stopping a playlist cancels its pending handoff', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const played = [];
  const clips = [{ youtubeVideoId: 'first' }, { youtubeVideoId: 'second' }];
  const player = new PlaylistPlayer({ clips }, { current: {
    loadVideoById: ({ videoId }) => played.push(videoId),
    pauseVideo() {}
  } }, { showNotification() {} });
  await player.playNext();
  player.advanceToNextClip();
  player.stop(false);
  context.mock.timers.tick(1000);
  assert.deepEqual(played, ['first']);
});
