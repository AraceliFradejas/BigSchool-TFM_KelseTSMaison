import { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/state';
import { voiceError, stylistSpeechText } from '@maison/contracts/stylist-voice';

export function SpeakButton({ message, language, available, autoPlay, onAutoStart }) {
  const es = language === 'es';
  const [busy, setBusy] = useState(false),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState('');
  const audio = useRef(null),
    pending = useRef(null),
    uri = useRef(null),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const stop = () => {
      pending.current?.abort();
      audio.current?.pause();
      setBusy(false);
      setPlaying(false);
    };
    window.addEventListener('maison-voice-stop', stop);
    return () => {
      alive.current = false;
      pending.current?.abort();
      audio.current?.pause();
      if (audio.current) audio.current.src = '';
      window.removeEventListener('maison-voice-stop', stop);
    };
  }, []);
  useEffect(() => {
    if (!available) {
      pending.current?.abort();
      audio.current?.pause();
      setBusy(false);
      setPlaying(false);
    }
  }, [available]);
  async function speak() {
    if (busy) {
      pending.current?.abort();
      setBusy(false);
      return;
    }
    if (playing) {
      audio.current?.pause();
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
      if (!audio.current) {
        audio.current = new Audio(uri.current);
        audio.current.onended = () => setPlaying(false);
      }
      await audio.current.play();
      if (alive.current && !audio.current.paused) setPlaying(true);
    } catch (err) {
      if (alive.current && err.name !== 'AbortError')
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
      void speak();
    });
    return () => {
      active = false;
    };
  }, [autoPlay, available]);
  if (!available) return null;
  return (
    <div className="stylist-voice-play">
      <button type="button" className="text-link" onClick={speak}>
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
      if (alive.current && err.name !== 'AbortError') {
        setError(voiceError(err.code, language));
        setPhase('ready');
      }
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  async function chooseVoice() {
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
              ? 'Para usar la voz pediremos permiso de micrófono. No se graba hasta que pulses Dictar.'
              : 'Voice mode asks for microphone permission. Recording starts only when you press Dictate.'
            : es
              ? 'La voz no está disponible ahora. Puedes continuar por escrito.'
              : 'Voice is unavailable now. You can keep typing.'}
        </p>
        {error && <p role="status">{error}</p>}
      </div>
    );
  if (mode === 'text')
    return (
      <div className="stylist-voice-input">
        <span className="fine-print">{es ? 'Modo texto' : 'Text mode'}</span>
        {available && (
          <button
            className="text-link"
            type="button"
            onClick={chooseVoice}
            disabled={disabled || phase === 'permission'}
          >
            {es ? 'Cambiar a voz' : 'Switch to voice'}
          </button>
        )}
        {error && <p role="status">{error}</p>}
      </div>
    );
  if (!available)
    return (
      <div className="stylist-voice-input">
        <p>{es ? 'La voz no está disponible ahora.' : 'Voice is unavailable now.'}</p>
        <button className="text-link" type="button" onClick={chooseText}>
          {es ? 'Continuar escribiendo' : 'Continue typing'}
        </button>
      </div>
    );

  return (
    <div className="stylist-voice-input">
      <div className="stylist-voice-actions">
        <span>{es ? 'Modo voz' : 'Voice mode'}</span>
        <button type="button" className="text-link" onClick={chooseText}>
          {es ? 'Cambiar a texto' : 'Switch to text'}
        </button>
      </div>
      <div className="stylist-voice-actions">
        <button
          type="button"
          className="text-link"
          onClick={phase === 'recording' ? () => stop() : record}
          disabled={disabled || phase === 'busy' || phase === 'permission'}
        >
          {phase === 'recording'
            ? es
              ? 'Detener grabación'
              : 'Stop recording'
            : phase === 'permission'
              ? es
                ? 'Esperando permiso…'
                : 'Waiting for permission…'
              : es
                ? 'Dictar mensaje'
                : 'Dictate message'}
        </button>
        {phase === 'ready' && (
          <>
            <button type="button" className="text-link" onClick={transcribe} disabled={disabled}>
              {es ? 'Transcribir' : 'Transcribe'}
            </button>
            <button
              type="button"
              className="text-link"
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
          ? 'Graba hasta un minuto. Al detener, tu petición se transcribe y se envía automáticamente; tAIlor te responderá con voz. El audio se procesa fuera del dispositivo. Evita incluir datos personales.'
          : 'Record up to one minute. When you stop, your request is transcribed and sent automatically; tAIlor replies with voice. Audio is processed outside your device. Avoid personal details.'}
      </p>
      {error && (
        <p role="status" className="fine-print">
          {error}
        </p>
      )}
    </div>
  );
}
