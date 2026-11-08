// Keep the same media element from the user's gesture through asynchronous TTS.
// No microphone or provider request is made when priming playback.
const silence =
  'data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export function createWebVoicePlayer(createAudio = () => new Audio()) {
  let audio,
    owner = null,
    generation = 0;
  const get = () => (audio ||= createAudio());
  return {
    prime() {
      if (owner) return;
      const element = get();
      element.src = silence;
      const ticket = ++generation;
      try {
        // Invoke play synchronously inside the click, before any permission/network await.
        Promise.resolve(element.play())
          .then(() => {
            if (generation === ticket && !owner) element.pause();
          })
          .catch(() => {}); // Actual playback still reports a browser rejection to the UI.
      } catch {
        /* The normal Listen control remains available. */
      }
    },
    async play(token, uri, onended) {
      const element = get();
      element.pause();
      ++generation;
      owner = token;
      element.src = uri;
      element.onended = () => {
        if (owner === token) onended();
      };
      await element.play();
    },
    isPlaying(token) {
      return owner === token && !get().paused;
    },
    pause(token, release = false) {
      if (owner !== token) return;
      ++generation;
      get().pause();
      if (release) {
        get().src = '';
        get().onended = null;
      }
      if (release) owner = null;
    },
  };
}
export const webVoicePlayer = createWebVoicePlayer();
