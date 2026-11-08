# Voz de tAIlor · integración preparada

Estado del 8 de noviembre de 2026: elección inicial entre texto y voz implementada en web y app, 144 pruebas correctas y exportaciones iOS/Android correctas. Tres pruebas reales de ElevenLabs (voz ES, voz EN y transcripción de audio generado) respondieron HTTP 200. La voz pública permanece desactivada hasta autorizar sus secretos y cuota en Vercel. La grabación y reproducción físicas en los dispositivos siguen pendientes.

## Recorrido

1. Al abrir el chat se pregunta «¿Prefieres escribir o hablar con tAIlor?». Escribir abre el campo sin solicitar micrófono. Elegir voz solicita permiso; la grabación empieza solo al pulsar Dictar, no al conceder el permiso. El modo se conserva durante la navegación y se puede cambiar.
2. La interfaz limita la grabación a veinte segundos. Se puede detener antes.
3. «Transcribir» envía el audio a ElevenLabs Scribe v2 a través de la API de Maison. Se puede descartar antes. El texto se incorpora al borrador para revisarlo antes de «Enviar»; no crea automáticamente una consulta de outfit.
4. «Escuchar» convierte en voz la respuesta y los nombres de los looks mostrados mediante Eleven Multilingual v2. Es un resumen, no una lectura de todos los precios y variantes. La reproducción es voluntaria; Safari puede exigir otro toque tras preparar el audio.

La misma voz puede leer textos ES/EN. Web utiliza MediaRecorder y Audio; la app utiliza los módulos oficiales expo-audio y expo-file-system compatibles con SDK 58 y disponibles en Expo Go. La exportación no acredita permisos ni audio físico de cada dispositivo. El mensaje de permiso personalizado corresponde a un futuro binario propio; Expo Go presenta sus permisos.

## Configuración privada

Solo backend: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `STYLIST_VOICE_ENABLED=0` por defecto y `STYLIST_VOICE_DAILY_LIMIT=6`. Los valores reales están fuera de Git. Los permisos necesarios son Text to Speech, Speech to Text y lectura de Voices para comprobar la voz; no se necesita administración o borrado de voces.

Se propone un máximo global separado de seis intentos de voz por día UTC, compartido entre síntesis y transcripción, incluidos fallos. La cuota se guarda atómicamente en SQLite/MongoDB y no consume la cuota de los modelos de outfits. La fecha de vencimiento del asesor también desactiva las llamadas de voz. La activación de producción y el consumo real requieren autorización; disponer de una clave no demuestra saldo ni todos los permisos.

## Límites y datos

El servidor admite un archivo de hasta 768 KiB y reconoce firmas MP4, WebM, Ogg, WAV y MP3, sin fiarse de su nombre. La duración de veinte segundos se controla en el cliente; no se afirma una validación de duración del códec en el servidor. Transcripciones de más de 400 caracteres se rechazan; voz de salida limitada a 600 caracteres y respuesta de audio de hasta 1 MiB. Los destinos externos son fijos, las redirecciones se rechazan y hay timeout de veinte segundos.

Se comprueban temas bloqueados, instrucciones maliciosas y permisos, los campos no admitidos se rechazan y los errores externos no se copian a respuestas ni logs. El audio no se guarda en la base de datos de Maison. Se mantiene temporalmente en memoria/caché para grabación y reproducción, con limpieza al terminar o cerrar. El cliente no recibe la clave. La retención de ElevenLabs depende de la cuenta y sus condiciones; no se ha habilitado ni acreditado retención cero del proveedor. La conversación por texto sigue disponible si la voz falla, se deniega el permiso o se agota la cuota.

## Evidencia y pendientes

Los tests usan ElevenLabs simulado: opt-in, caducidad, permisos, límites de archivo/texto, cuota independiente, validación de MP3 y errores sin secretos. Safari local muestra Dictar/Escuchar y el aviso de envío a ElevenLabs; no se grabó el micrófono durante esa revisión. Se comprobó que petición, propuestas y filtros sobreviven a abrir una pieza y que la despedida conserva cena y nombres de looks.

La primera lectura de metadatos devolvió HTTP 401 `missing_permissions` para Voices. Después del ajuste de permisos por la autora, las tres pruebas de audio autorizadas respondieron HTTP 200. Las muestras sintéticas quedan privadas y no se grabó el micrófono. La transcripción escribió la marca de forma fonética; una corrección local normaliza solo variantes conocidas de KelseTS Maison y mantiene Taylor Swift sin cambios. Esa corrección se probó con tests, sin repetir el consumo real. [Resultados y límites](evidencias/voz-2026-11-08.md). Quedan la activación de Vercel y las pruebas físicas en iPhone/iPad/Android.

Referencias oficiales consultadas: [ElevenLabs: crear voz](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), [transcripción](https://elevenlabs.io/docs/api-reference/speech-to-text/convert), [autenticación y permisos](https://elevenlabs.io/docs/api-reference/authentication), [Expo Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio/), [MediaRecorder de WebKit](https://webkit.org/blog/11353/).
