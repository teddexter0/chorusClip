import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { trimSection } from '../src/utils/studioPlayback.mjs';

const section = { start: 15, end: 35, loopCount: 2, youtubeVideoId: 'video' };

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
