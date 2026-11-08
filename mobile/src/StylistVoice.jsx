import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, Text, View, StyleSheet, Pressable } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as Files from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import { createStylistRecordingForm } from './stylistRecordingUpload';
import {
  voiceError,
  stylistSpeechText,
  voiceQuotaReached,
  markVoiceQuotaReached,
  subscribeVoiceQuota,
  refreshVoiceQuotaStatus,
} from '@maison/contracts/stylist-voice';
import { api } from './api';
import Button from './Button';
import VoiceIcon from './VoiceIcon';
import { playStylistAudio } from './stylistAudioPlayback';
const erase = async (uri) => {
  if (uri) await Files.deleteAsync(uri, { idempotent: true }).catch(() => {});
};
function useVoiceQuotaHint(language) {
  const blocked = useSyncExternalStore(subscribeVoiceQuota, voiceQuotaReached, () => false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [visible]);
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
  return {
    blocked,
    allow,
    show: () => setVisible(true),
    hint: visible ? voiceError('voice_daily_limit', language) : '',
  };
}
export function useStylistSpeech(language) {
  const quota = useVoiceQuotaHint(language);
  const player = useAudioPlayer(null),
    status = useAudioPlayerStatus(player);
  const [busy, setBusy] = useState(null),
    [playing, setPlaying] = useState(null),
    [error, setError] = useState('');
  const cache = useRef(new Map()),
    pending = useRef(null),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        pending.current?.abort();
        player.pause();
        setBusy(null);
        setPlaying(null);
      }
    });
    return () => {
      alive.current = false;
      pending.current?.abort();
      listener.remove();
      for (const uri of cache.current.values()) void erase(uri);
    };
  }, []);
  useEffect(() => {
    if (status.didJustFinish) setPlaying(null);
  }, [status.didJustFinish]);
  const stop = () => {
    pending.current?.abort();
    player.pause();
    setBusy(null);
    setPlaying(null);
  };
  async function speak(message, index, automatic = false) {
    if (quota.blocked && !cache.current.has(stylistSpeechText(message, language))) {
      if (automatic || !(await quota.allow())) return;
    }
    if (playing === index) {
      stop();
      return;
    }
    stop();
    setError('');
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(index);
    try {
      const text = stylistSpeechText(message, language);
      let uri = cache.current.get(text);
      if (!uri) {
        const result = await api.request('/stylist/voice/speech', {
          method: 'POST',
          signal: controller.signal,
          body: { text, language },
        });
        if (!alive.current || controller.signal.aborted) return;
        uri =
          Files.cacheDirectory +
          'maison-voice-' +
          Date.now() +
          '-' +
          Math.random().toString(36).slice(2) +
          '.mp3';
        await Files.writeAsStringAsync(uri, result.audioBase64, {
          encoding: Files.EncodingType.Base64,
        });
        if (!alive.current || controller.signal.aborted) {
          await erase(uri);
          return;
        }
        cache.current.set(text, uri);
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
      });
      if (!alive.current || controller.signal.aborted) return;
      await playStylistAudio(player, { uri }, { signal: controller.signal });
      if (alive.current && !controller.signal.aborted) setPlaying(index);
    } catch (err) {
      if (err.code === 'voice_daily_limit') {
        markVoiceQuotaReached();
        if (!automatic) quota.show();
      } else if (alive.current && err.name !== 'AbortError')
        setError(voiceError(err.code, language));
    } finally {
      if (alive.current && pending.current === controller) setBusy(null);
    }
  }
  return { speak, stop, busy, playing, error, quotaReached: quota.blocked, hint: quota.hint };
}
export function VoiceInput({
  mode,
  onModeChange,
  language,
  available,
  onTranscript,
  onBusyChange,
  onRecord,
  disabled,
}) {
  const es = language === 'es';
  const quota = useVoiceQuotaHint(language);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY),
    recorderState = useAudioRecorderState(recorder, 200);
  const [phase, setPhase] = useState('idle'),
    [error, setError] = useState('');
  const uri = useRef(null),
    timer = useRef(null),
    pending = useRef(null),
    alive = useRef(true),
    recording = useRef(false);
  useEffect(() => {
    alive.current = true;
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        pending.current?.abort();
        if (recording.current) void stop(false);
        onBusyChange(false);
        setPhase('idle');
      }
    });
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      pending.current?.abort();
      listener.remove();
      if (recording.current) void recorder.stop().catch(() => {});
      void erase(uri.current);
    };
  }, []);
  async function stop(submit = true) {
    if (!recording.current) return;
    recording.current = false;
    clearTimeout(timer.current);
    try {
      await recorder.stop();
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
      });
      const file = recorder.uri;
      if (!alive.current || modeRef.current !== 'voice' || !submit) {
        await erase(file);
        return;
      }
      uri.current = file;
      setPhase(file ? 'ready' : 'idle');
      if (file) {
        onBusyChange(false);
        await transcribe();
      }
    } catch {
      if (alive.current) {
        setError(voiceError('', language));
        setPhase('idle');
      }
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  async function record() {
    if (!(await quota.allow())) return;
    setError('');
    onBusyChange(true);
    setPhase('permission');
    onRecord();
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!alive.current || modeRef.current !== 'voice') return;
      if (!permission.granted) {
        setError(
          es
            ? 'No hay permiso de micrófono. Puedes escribir tu mensaje.'
            : 'Microphone permission was not granted. You can type your message.',
        );
        setPhase('idle');
        onBusyChange(false);
        return;
      }
      await erase(uri.current);
      uri.current = null;
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        allowsBackgroundRecording: false,
        shouldPlayInBackground: false,
      });
      if (!alive.current || modeRef.current !== 'voice') return;
      await recorder.prepareToRecordAsync();
      if (!alive.current || modeRef.current !== 'voice') return;
      recorder.record();
      recording.current = true;
      setPhase('recording');
      timer.current = setTimeout(() => void stop(), 60000);
    } catch {
      if (alive.current) {
        setError(voiceError('', language));
        setPhase('idle');
        onBusyChange(false);
      }
    }
  }
  async function transcribe() {
    if (!uri.current) return;
    setError('');
    setPhase('busy');
    onBusyChange(true);
    const controller = new AbortController();
    pending.current = controller;
    let step = 'read_recording';
    try {
      const body = createStylistRecordingForm(new File(uri.current), language);
      step = 'upload_recording';
      const result = await api.request('/stylist/voice/transcribe', {
        method: 'POST',
        multipart: true,
        body,
        signal: controller.signal,
      });
      if (!alive.current || controller.signal.aborted || modeRef.current !== 'voice') return;
      onTranscript(result.text);
      await erase(uri.current);
      uri.current = null;
      setPhase('idle');
    } catch (err) {
      if (err.code === 'voice_daily_limit') {
        markVoiceQuotaReached();
        quota.show();
        await erase(uri.current);
        uri.current = null;
        setPhase('idle');
      } else if (alive.current && err.name !== 'AbortError') {
        // Diagnostic metadata only: never log the audio, file URI, transcript or credentials.
        console.warn('Maison voice upload', {
          step,
          code: err.code || err.name,
          status: err.status,
        });
        setError(
          step === 'read_recording'
            ? es
              ? 'No he podido leer la grabación. Descártala y graba un mensaje nuevo.'
              : 'I could not read the recording. Discard it and record a new message.'
            : err.code === 'network_error'
              ? es
                ? 'No he podido enviar la grabación. Comprueba tu conexión y pulsa Transcribir para reintentarlo.'
                : 'I could not upload the recording. Check your connection and press Transcribe to retry.'
              : err.code === 'rate_limited'
                ? es
                  ? 'Hay demasiadas peticiones seguidas. Espera un minuto y pulsa Transcribir.'
                  : 'Too many requests in a short time. Wait a minute and press Transcribe.'
                : err.code === 'voice_audio_invalid'
                  ? es
                    ? 'No puedo leer el formato de esta grabación. Descártala y graba un mensaje nuevo.'
                    : 'I cannot read this recording format. Discard it and record a new message.'
                  : voiceError(err.code, language),
        );
        setPhase('ready');
      }
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  async function chooseVoice() {
    if (!(await quota.allow())) return;
    setPhase('permission');
    setError('');
    onBusyChange(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!alive.current) return;
      if (!permission.granted) throw Error('denied');
      setPhase('idle');
      onModeChange('voice');
    } catch {
      if (alive.current) {
        setPhase('idle');
        setError(
          es
            ? 'No hay permiso de micrófono. Puedes continuar escribiendo.'
            : 'Microphone access was not granted. You can continue typing.',
        );
      }
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  function chooseText() {
    if (recording.current) void stop(false);
    pending.current?.abort();
    void erase(uri.current);
    uri.current = null;
    setPhase('idle');
    onBusyChange(false);
    onModeChange('text');
  }
  if (mode === null)
    return (
      <View style={s.choice}>
        <Text style={s.title}>
          {es
            ? '¿Prefieres escribir o hablar con tAIlor?'
            : 'Would you rather type or talk to tAIlor?'}
        </Text>
        <Text>
          {es
            ? 'Podrás cambiar de modo cuando quieras.'
            : 'You can switch modes whenever you like.'}
        </Text>
        <Button disabled={phase === 'permission'} onPress={chooseText}>
          {es ? 'Escribir' : 'Type'}
        </Button>
        <Button secondary disabled={!available || phase === 'permission'} onPress={chooseVoice}>
          {phase === 'permission'
            ? es
              ? 'Esperando permiso…'
              : 'Waiting for permission…'
            : es
              ? 'Hablar con mi voz'
              : 'Use my voice'}
        </Button>
        <Text style={s.note}>
          {available
            ? es
              ? 'Pediremos permiso de micrófono. Tu audio se enviará a un servicio externo para transcribirlo, solo cuando grabes y envíes un mensaje.'
              : 'We will ask for microphone permission. Audio is sent to an external service for transcription only when you record and send a message.'
            : es
              ? 'La voz no está disponible ahora. Puedes escribir.'
              : 'Voice is unavailable now. You can type.'}
        </Text>
        {quota.hint ? (
          <Text accessibilityLiveRegion="polite" style={s.tooltip}>
            {quota.hint}
          </Text>
        ) : null}
        {error && <Text accessibilityLiveRegion="polite">{error}</Text>}
      </View>
    );
  if (mode === 'text')
    return (
      <View style={s.actions}>
        <Text style={s.note}>{es ? 'Modo texto' : 'Text mode'}</Text>
        {available && (
          <Button
            secondary
            icon={<VoiceIcon color="#242320" />}
            disabled={disabled || phase === 'permission'}
            onPress={chooseVoice}
          >
            {es ? 'Hablar' : 'Talk'}
          </Button>
        )}
        {quota.hint ? (
          <Text accessibilityLiveRegion="polite" style={s.tooltip}>
            {quota.hint}
          </Text>
        ) : null}
        {error && <Text>{error}</Text>}
      </View>
    );
  if (!available)
    return (
      <View>
        <Text>{es ? 'La voz no está disponible ahora.' : 'Voice is unavailable now.'}</Text>
        <Button secondary onPress={chooseText}>
          {es ? 'Continuar escribiendo' : 'Continue typing'}
        </Button>
      </View>
    );

  return (
    <View style={s.box}>
      <View style={s.modeHeader}>
        <Text style={s.note}>{es ? 'Conversación por voz' : 'Voice conversation'}</Text>
        <Pressable accessibilityRole="button" onPress={chooseText} style={s.modeSwitch}>
          <Text style={s.modeSwitchText}>{es ? 'Cambiar a texto' : 'Switch to text'}</Text>
        </Pressable>
      </View>
      <View style={[s.actions, { justifyContent: 'center' }]}>
        <Button
          color="#821b32"
          icon={<VoiceIcon stop={phase === 'recording'} />}
          disabled={disabled || phase === 'busy' || phase === 'permission'}
          onPress={phase === 'recording' ? () => void stop() : record}
        >
          {phase === 'recording'
            ? es
              ? `Terminar y enviar (${Math.floor(recorderState.durationMillis / 1000)} s)`
              : 'Finish and send'
            : phase === 'permission'
              ? es
                ? 'Esperando permiso…'
                : 'Waiting for permission…'
              : es
                ? 'Hablar ahora'
                : 'Speak now'}
        </Button>
        {phase === 'ready' && (
          <>
            <Button secondary disabled={disabled} onPress={transcribe}>
              {es ? 'Transcribir' : 'Transcribe'}
            </Button>
            <Button
              secondary
              onPress={() => {
                void erase(uri.current);
                uri.current = null;
                setPhase('idle');
              }}
            >
              {es ? 'Descartar' : 'Discard'}
            </Button>
          </>
        )}
        {phase === 'busy' && <Text>{es ? 'Transcribiendo…' : 'Transcribing…'}</Text>}
      </View>
      <Text style={s.note}>
        {es
          ? 'Hasta un minuto por mensaje. Al terminar, se envía automáticamente y tAIlor responde con voz.'
          : 'Up to one minute per message. Finish to send automatically and hear tAIlor’s reply.'}
      </Text>
      {quota.hint ? (
        <Text accessibilityLiveRegion="polite" style={s.tooltip}>
          {quota.hint}
        </Text>
      ) : null}
      {error && (
        <Text accessibilityLiveRegion="polite" style={s.note}>
          {error}
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    zIndex: 4,
    padding: 12,
    backgroundColor: '#332723',
    color: '#fffaf4',
    borderRadius: 12,
    fontSize: 12,
    lineHeight: 18,
  },
  choice: { padding: 18, gap: 14, backgroundColor: '#fffcf7', borderRadius: 18 },
  title: { fontSize: 20, color: '#4b1423', fontFamily: 'Georgia' },
  box: {
    gap: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fffcf7',
    borderColor: '#ddd5ca',
    borderWidth: 1,
    borderRadius: 20,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modeSwitch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d9c5c8',
    borderRadius: 8,
  },
  modeSwitchText: { color: '#6f1527', fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { fontSize: 11, lineHeight: 16, color: '#6c625d' },
});
