import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import VoiceIcon from './VoiceIcon';
import { webVoicePlayer } from './webVoicePlayer';
import { api } from '../../shared/state';
import {
  voiceError,
  stylistSpeechText,
  voiceQuotaReached,
  markVoiceQuotaReached,
  subscribeVoiceQuota,
  refreshVoiceQuotaStatus,
} from '@maison/contracts/stylist-voice';

function useVoiceQuotaHint(language) {
  const blocked = useSyncExternalStore(subscribeVoiceQuota, voiceQuotaReached, () => false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [visible]);
  const tooltip = visible ? (
    <span className="stylist-quota-tooltip" role="status">
      {voiceError('voice_daily_limit', language)}
    </span>
  ) : null;
  async function allow() {
    if (!voiceQuotaReached()) return true;
    try {
      await refreshVoiceQuotaStatus(() => api.request('/stylist/voice/status'));
    } catch {
      /* Keep the known block on a failed check. */
    }
    if (!voiceQuotaReached()) return true;
    setVisible(true);
    return false;
  }
  return { blocked, allow, show: () => setVisible(true), tooltip };
}
export function SpeakButton({ message, language, available, autoPlay, onAutoStart }) {
  const es = language === 'es';
  const quota = useVoiceQuotaHint(language);
  const [busy, setBusy] = useState(false),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState('');
  const playbackOwner = useRef(Symbol('stylist-speech')),
    pending = useRef(null),
    uri = useRef(null),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const stop = () => {
      pending.current?.abort();
      webVoicePlayer.pause(playbackOwner.current);
      setBusy(false);
      setPlaying(false);
    };
    window.addEventListener('maison-voice-stop', stop);
    return () => {
      alive.current = false;
      pending.current?.abort();
      webVoicePlayer.pause(playbackOwner.current, true);
      window.removeEventListener('maison-voice-stop', stop);
    };
  }, []);
  useEffect(() => {
    if (!available) {
      pending.current?.abort();
      webVoicePlayer.pause(playbackOwner.current);
      setBusy(false);
      setPlaying(false);
    }
  }, [available]);
  async function speak(automatic = false) {
    if (!automatic) webVoicePlayer.prime();
    if (quota.blocked && !uri.current) {
      if (automatic || !(await quota.allow())) return;
    }
    if (busy) {
      pending.current?.abort();
      setBusy(false);
      return;
    }
    if (playing) {
      webVoicePlayer.pause(playbackOwner.current);
      setPlaying(false);
      return;
    }
    window.dispatchEvent(new Event('maison-voice-stop'));
    setError('');
    try {
      if (!uri.current) {
        setBusy(true);
        const controller = new AbortController();
        pending.current = controller;
        const result = await api.request('/stylist/voice/speech', {
          method: 'POST',
          signal: controller.signal,
          body: { text: stylistSpeechText(message, language), language },
        });
        if (!alive.current || controller.signal.aborted) return;
        uri.current = `data:audio/mpeg;base64,${result.audioBase64}`;
      }
      await webVoicePlayer.play(playbackOwner.current, uri.current, () => {
        if (alive.current) setPlaying(false);
      });
      if (alive.current && webVoicePlayer.isPlaying(playbackOwner.current)) setPlaying(true);
    } catch (err) {
      if (err.code === 'voice_daily_limit') {
        markVoiceQuotaReached();
        if (!automatic) quota.show();
      } else if (alive.current && err.name !== 'AbortError')
        setError(
          err.name === 'NotAllowedError'
            ? es
              ? 'Audio listo: pulsa Escuchar para reproducirlo.'
              : 'Audio ready: press Listen to play it.'
            : voiceError(err.code, language),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoPlay || !available || autoStarted.current) return;
    let active = true;
    queueMicrotask(() => {
      if (!active || autoStarted.current) return;
      autoStarted.current = true;
      onAutoStart?.();
      void speak(true);
    });
    return () => {
      active = false;
    };
  }, [autoPlay, available, quota.blocked]);
  if (!available) return null;
  return (
    <div className="stylist-voice-play">
      <button
        type="button"
        className="button button-secondary stylist-voice-control"
        onClick={() => void speak(false)}
      >
        <VoiceIcon speaker />
        {busy
          ? es
            ? 'Cancelar voz…'
            : 'Cancel voice…'
          : playing
            ? es
              ? 'Detener voz'
              : 'Stop voice'
            : es
              ? 'Escuchar'
              : 'Listen'}
      </button>
      {quota.tooltip}
      {error && (
        <p role="status" className="fine-print">
          {error}
        </p>
      )}
    </div>
  );
}
export function VoiceInput({
  mode,
  onModeChange,
  language,
  available,
  onTranscript,
  onBusyChange,
  disabled,
}) {
  const es = language === 'es';
  const quota = useVoiceQuotaHint(language);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [phase, setPhase] = useState('idle'),
    [error, setError] = useState('');
  const recorder = useRef(null),
    stream = useRef(null),
    blob = useRef(null),
    timer = useRef(null),
    pending = useRef(null),
    alive = useRef(true),
    submitOnStop = useRef(true);
  useEffect(() => {
    alive.current = true;
    const background = () => {
      if (document.hidden) {
        stop(false);
        pending.current?.abort();
        blob.current = null;
        onBusyChange(false);
        setPhase('idle');
      }
    };
    document.addEventListener('visibilitychange', background);
    return () => {
      alive.current = false;
      document.removeEventListener('visibilitychange', background);
      clearTimeout(timer.current);
      pending.current?.abort();
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state === 'recording') recorder.current.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  function stop(submit = true) {
    submitOnStop.current = submit;
    clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
  }
  async function record() {
    webVoicePlayer.prime();
    if (!(await quota.allow())) return;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        es
          ? 'Este navegador no permite grabar aquí. Puedes escribir tu mensaje.'
          : 'Recording is not available here. You can type your message.',
      );
      return;
    }
    try {
      window.dispatchEvent(new Event('maison-voice-stop'));
      onBusyChange(true);
      setPhase('permission');
      const capture = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current || modeRef.current !== 'voice') {
        capture.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = capture;
      const mime = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recording = new MediaRecorder(capture, {
        ...(mime ? { mimeType: mime } : {}),
        audioBitsPerSecond: 64000,
      });
      recorder.current = recording;
      submitOnStop.current = true;
      const chunks = [];
      let bytes = 0;
      recording.ondataavailable = (event) => {
        if (event.data.size) {
          chunks.push(event.data);
          bytes += event.data.size;
          if (bytes > 2 * 1024 * 1024) stop();
        }
      };
      recording.onstop = () => {
        capture.getTracks().forEach((t) => t.stop());
        clearTimeout(timer.current);
        if (!alive.current) return;
        onBusyChange(false);
        if (modeRef.current !== 'voice' || !submitOnStop.current) {
          blob.current = null;
          setPhase('idle');
          return;
        }
        if (!bytes || bytes > 2 * 1024 * 1024) {
          setError(voiceError('voice_transcript_invalid', language));
          setPhase('idle');
          return;
        }
        blob.current = new Blob(chunks, { type: recording.mimeType });
        void transcribe();
      };
      recording.onerror = () => {
        stop(false);
        if (alive.current) {
          setError(voiceError('', language));
          onBusyChange(false);
          setPhase('idle');
        }
      };
      recording.start(250);
      setPhase('recording');
      timer.current = setTimeout(() => stop(), 60000);
    } catch {
      if (alive.current) {
        setError(
          es
            ? 'No se pudo usar el micrófono. Revisa el permiso del navegador o escribe tu mensaje.'
            : 'Microphone unavailable. Check browser permission or type your message.',
        );
        setPhase('idle');
        onBusyChange(false);
      }
      stream.current?.getTracks().forEach((t) => t.stop());
    }
  }
  async function transcribe() {
    if (!blob.current) return;
    setPhase('busy');
    setError('');
    onBusyChange(true);
    const controller = new AbortController();
    pending.current = controller;
    const data = new FormData();
    data.append('language', language);
    data.append('audio', blob.current, 'recording');
    try {
      const result = await api.request('/stylist/voice/transcribe', {
        method: 'POST',
        multipart: true,
        body: data,
        signal: controller.signal,
      });
      if (alive.current && !controller.signal.aborted && modeRef.current === 'voice') {
        onTranscript(result.text);
        blob.current = null;
        setPhase('idle');
      }
    } catch (err) {
      if (err.code === 'voice_daily_limit') {
        markVoiceQuotaReached();
        quota.show();
        blob.current = null;
        setPhase('idle');
      } else if (alive.current && err.name !== 'AbortError') {
        setError(voiceError(err.code, language));
        setPhase('ready');
      }
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  async function chooseVoice() {
    webVoicePlayer.prime();
    if (!(await quota.allow())) return;
    setError('');
    setPhase('permission');
    onBusyChange(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Error('microphone unavailable');
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach((track) => track.stop());
      if (alive.current) {
        setPhase('idle');
        onModeChange('voice');
      }
    } catch {
      if (alive.current) {
        setPhase('idle');
        setError(
          es
            ? 'No se ha concedido acceso al micrófono. Puedes continuar escribiendo.'
            : 'Microphone access was not granted. You can continue typing.',
        );
      }
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  function chooseText() {
    stop(false);
    pending.current?.abort();
    blob.current = null;
    setPhase('idle');
    onBusyChange(false);
    onModeChange('text');
  }
  if (mode === null)
    return (
      <div className="stylist-voice-input stylist-mode-choice">
        <h3>
          {es
            ? '¿Prefieres escribir o hablar con tAIlor?'
            : 'Would you rather type or talk to tAIlor?'}
        </h3>
        <p>
          {es
            ? 'Tú eliges cómo empezamos. Podrás cambiar de modo cuando quieras.'
            : 'Choose how we start. You can switch modes whenever you like.'}
        </p>
        <div className="stylist-voice-actions">
          <button
            type="button"
            className="button"
            disabled={phase === 'permission'}
            onClick={chooseText}
          >
            {es ? 'Escribir' : 'Type'}
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={!available || phase === 'permission'}
            onClick={chooseVoice}
          >
            {phase === 'permission'
              ? es
                ? 'Esperando permiso…'
                : 'Waiting for permission…'
              : es
                ? 'Hablar con mi voz'
                : 'Use my voice'}
          </button>
        </div>
        <p className="fine-print">
          {available
            ? es
              ? 'Pediremos permiso de micrófono. Tu audio se enviará a un servicio externo para transcribirlo, solo cuando grabes y envíes un mensaje.'
              : 'We will ask for microphone permission. Audio is sent to an external service for transcription only when you record and send a message.'
            : es
              ? 'La voz no está disponible ahora. Puedes continuar por escrito.'
              : 'Voice is unavailable now. You can keep typing.'}
        </p>
        {quota.tooltip}
        {error && <p role="status">{error}</p>}
      </div>
    );
  if (mode === 'text')
    return (
      <div className="stylist-voice-input">
        <span className="fine-print">{es ? 'Modo texto' : 'Text mode'}</span>
        {available && (
          <button
            className="button button-secondary stylist-voice-control"
            type="button"
            onClick={chooseVoice}
            disabled={disabled || phase === 'permission'}
          >
            <VoiceIcon />
            {es ? 'Hablar' : 'Talk'}
          </button>
        )}
        {quota.tooltip}
        {error && <p role="status">{error}</p>}
      </div>
    );
  if (!available)
    return (
      <div className="stylist-voice-input">
        <p>{es ? 'La voz no está disponible ahora.' : 'Voice is unavailable now.'}</p>
        <button
          className="button button-secondary stylist-voice-control"
          type="button"
          onClick={chooseText}
        >
          {es ? 'Continuar escribiendo' : 'Continue typing'}
        </button>
      </div>
    );

  return (
    <div className="stylist-voice-input stylist-voice-panel">
      <div className="stylist-voice-mode-header">
        <span>{es ? 'Conversación por voz' : 'Voice conversation'}</span>
        <button type="button" className="stylist-mode-switch" onClick={chooseText}>
          {es ? 'Cambiar a texto' : 'Switch to text'}
        </button>
      </div>
      <div className="stylist-voice-actions stylist-voice-main-action">
        <button
          type="button"
          className={`button stylist-voice-control stylist-record ${phase === 'recording' ? 'is-recording' : ''}`}
          aria-pressed={phase === 'recording'}
          onClick={phase === 'recording' ? () => stop() : record}
          disabled={disabled || phase === 'busy' || phase === 'permission'}
        >
          <VoiceIcon stop={phase === 'recording'} />
          {phase === 'recording'
            ? es
              ? 'Terminar y enviar'
              : 'Finish and send'
            : phase === 'permission'
              ? es
                ? 'Esperando permiso…'
                : 'Waiting for permission…'
              : es
                ? 'Hablar ahora'
                : 'Speak now'}
        </button>
        {phase === 'ready' && (
          <>
            <button
              type="button"
              className="button button-secondary stylist-voice-control"
              onClick={transcribe}
              disabled={disabled}
            >
              {es ? 'Transcribir' : 'Transcribe'}
            </button>
            <button
              type="button"
              className="button button-secondary stylist-voice-control"
              onClick={() => {
                blob.current = null;
                setPhase('idle');
              }}
            >
              {es ? 'Descartar' : 'Discard'}
            </button>
          </>
        )}
        {phase === 'busy' && <span role="status">{es ? 'Transcribiendo…' : 'Transcribing…'}</span>}
      </div>
      <p className="fine-print">
        {es
          ? 'Hasta un minuto por mensaje. Al terminar, se envía automáticamente y tAIlor responde con voz.'
          : 'Up to one minute per message. Finish to send automatically and hear tAIlor’s reply.'}
      </p>
      {quota.tooltip}
      {error && (
        <p role="status" className="fine-print">
          {error}
        </p>
      )}
    </div>
  );
}
