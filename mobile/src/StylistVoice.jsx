import { useEffect, useRef, useState } from 'react';
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
import { voiceError, stylistSpeechText } from '@maison/contracts/stylist-voice';
import { api } from './api';
import Button from './Button';
import VoiceIcon from './VoiceIcon';
const erase = async (uri) => {
  if (uri) await Files.deleteAsync(uri, { idempotent: true }).catch(() => {});
};
export function useStylistSpeech(language) {
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
  async function speak(message, index) {
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
      player.replace({ uri });
      player.play();
      setPlaying(index);
    } catch (err) {
      if (alive.current && err.name !== 'AbortError') setError(voiceError(err.code, language));
    } finally {
      if (alive.current && pending.current === controller) setBusy(null);
    }
  }
  return { speak, stop, busy, playing, error };
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
    try {
      const info = await Files.getInfoAsync(uri.current);
      if (!info.exists || info.size > 2 * 1024 * 1024) throw Error('invalid audio');
      const body = new FormData();
      body.append('language', language);
      body.append('audio', { uri: uri.current, name: 'recording.m4a', type: 'audio/mp4' });
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
      if (alive.current && err.name !== 'AbortError') {
        setError(voiceError(err.code, language));
        setPhase('ready');
      }
    } finally {
      if (alive.current) onBusyChange(false);
    }
  }
  async function chooseVoice() {
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
      {error && (
        <Text accessibilityLiveRegion="polite" style={s.note}>
          {error}
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
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
