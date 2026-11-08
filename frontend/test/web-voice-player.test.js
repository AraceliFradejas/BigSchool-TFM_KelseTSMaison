import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebVoicePlayer } from '../src/features/catalog/webVoicePlayer.js';
function setup() {
  const calls = [];
  const audio = {
    paused: true,
    src: '',
    play() {
      calls.push(['play', this.src]);
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      calls.push(['pause', this.src]);
      this.paused = true;
    },
  };
  let count = 0;
  return {
    audio,
    calls,
    player: createWebVoicePlayer(() => {
      count++;
      return audio;
    }),
    count: () => count,
  };
}
test('gesture prepares the same player synchronously before the delayed first response', async () => {
  const s = setup();
  s.player.prime();
  assert.equal(s.calls[0][0], 'play');
  assert.match(s.calls[0][1], /^data:audio\/wav/);
  await Promise.resolve();
  const token = Symbol();
  await s.player.play(token, 'response.mp3', () => {});
  assert.equal(s.count(), 1);
  assert.ok(s.player.isPlaying(token));
});
test('late priming completion and cleanup of older responses cannot pause the current answer', async () => {
  const s = setup();
  const old = Symbol(),
    now = Symbol();
  s.player.prime();
  await s.player.play(now, 'first.mp3', () => {});
  s.player.pause(old, true);
  assert.ok(s.player.isPlaying(now));
  assert.equal(s.audio.src, 'first.mp3');
  s.player.pause(now, true);
  assert.equal(s.audio.src, '');
  assert.ok(!s.player.isPlaying(now));
});
test('a browser rejection remains visible and a manual retry reuses the same generated audio', async () => {
  const s = setup();
  const token = Symbol();
  s.audio.play = () =>
    Promise.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
  await assert.rejects(
    s.player.play(token, 'cached.mp3', () => {}),
    { name: 'NotAllowedError' },
  );
  s.audio.play = () => {
    s.audio.paused = false;
    return Promise.resolve();
  };
  await s.player.play(token, 'cached.mp3', () => {});
  assert.ok(s.player.isPlaying(token));
  assert.equal(s.count(), 1);
});
