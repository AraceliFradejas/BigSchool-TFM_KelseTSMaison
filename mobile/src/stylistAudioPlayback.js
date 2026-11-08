// Wait for the native player to load and actually start, including its first source.
export function playStylistAudio(player, source, { signal, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    let subscription,
      timer,
      replaced = false,
      started = false,
      settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.remove();
      signal?.removeEventListener('abort', abort);
      if (error) {
        player.pause();
        reject(error);
      } else resolve();
    };
    const abort = () => {
      const error = new Error('Playback cancelled');
      error.name = 'AbortError';
      finish(error);
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    const update = (status) => {
      if (!replaced || settled) return;
      if (status.error) {
        finish(new Error('Audio playback failed'));
        return;
      }
      if (!started && status.isLoaded && player.isLoaded) {
        started = true;
        try {
          player.play();
        } catch (error) {
          finish(error);
          return;
        }
      }
      if (started && status.playing) finish();
    };
    subscription = player.addListener('playbackStatusUpdate', update);
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(new Error('Audio playback did not start')), timeoutMs);
    try {
      player.replace(source);
      replaced = true;
      update(player.currentStatus);
    } catch (error) {
      finish(error);
    }
  });
}
