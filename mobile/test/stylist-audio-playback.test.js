import test from 'node:test';
import assert from 'node:assert/strict';
import { playStylistAudio } from '../src/stylistAudioPlayback.js';
function setup() {
  let listener;
  const state = { isLoaded: false, playing: false };
  const player = {
    isLoaded: false,
    currentStatus: state,
    plays: 0,
    removed: 0,
    paused: 0,
    addListener(_, fn) {
      listener = fn;
      return { remove: () => player.removed++ };
    },
    replace() {},
    play() {
      player.plays++;
    },
    pause() {
      player.paused++;
    },
  };
  return {
    player,
    emit(update) {
      Object.assign(state, update);
      player.isLoaded = state.isLoaded;
      listener({ ...state });
    },
  };
}
test('first native response waits for loading and actual playback, not just replace()', async () => {
  const s = setup();
  let completed = false;
  const pending = playStylistAudio(s.player, { uri: 'first.mp3' }).then(() => (completed = true));
  assert.equal(s.player.plays, 0);
  s.emit({ isLoaded: true });
  assert.equal(s.player.plays, 1);
  await Promise.resolve();
  assert.equal(completed, false);
  s.emit({ playing: true });
  await pending;
  assert.equal(completed, true);
  assert.equal(s.player.removed, 1);
});
test('closing or recording again cancels pending load and prevents late playback', async () => {
  const s = setup(),
    controller = new AbortController();
  const pending = playStylistAudio(s.player, { uri: 'first.mp3' }, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  s.emit({ isLoaded: true });
  assert.equal(s.player.plays, 0);
  assert.equal(s.player.removed, 1);
});
test('native startup failure releases listeners and does not claim playback', async () => {
  const s = setup();
  await assert.rejects(
    playStylistAudio(s.player, { uri: 'first.mp3' }, { timeoutMs: 5 }),
    /did not start/,
  );
  assert.equal(s.player.plays, 0);
  assert.equal(s.player.removed, 1);
});
