# Voz de tAIlor · integración preparada

Estado del 8 de noviembre de 2026: elección inicial entre texto y voz implementada en web y app, 146 pruebas correctas y exportaciones iOS/Android correctas. Tres pruebas reales de ElevenLabs (voz ES, voz EN y transcripción de audio generado) respondieron HTTP 200. La autora ha autorizado los secretos de producción y treinta acciones diarias; la verificación del despliegue se registra al final de este documento. La grabación y reproducción físicas en los dispositivos siguen pendientes.

## Recorrido

1. Al abrir el chat se pregunta «¿Prefieres escribir o hablar con tAIlor?». Escribir abre el campo sin solicitar micrófono. Elegir voz solicita permiso; la grabación empieza solo al pulsar Dictar, no al conceder el permiso. El modo se conserva durante la navegación y se puede cambiar.
2. La interfaz limita cada grabación a un minuto y permite detenerla antes. Cerrar o pasar a segundo plano no envía la grabación pendiente.
3. Al detener, se transcribe mediante Scribe v2 a través del backend y se envía automáticamente al chat. La petición queda visible como texto; si hay un error se puede volver a intentar o continuar escribiendo.
4. En modo voz, la nueva respuesta se sintetiza automáticamente una sola vez: introducción, nombres, explicaciones, totales, piezas con su variante y precio, y pregunta final. Se puede detener y volver a escuchar. No se reproduce de nuevo automáticamente al reabrir el chat. Safari puede exigir pulsar «Escuchar» cuando bloquea la reproducción automática.


La misma voz puede leer textos ES/EN. Web utiliza MediaRecorder y Audio; la app utiliza los módulos oficiales expo-audio y expo-file-system compatibles con SDK 58 y disponibles en Expo Go. La exportación no acredita permisos ni audio físico de cada dispositivo. El mensaje de permiso personalizado corresponde a un futuro binario propio; Expo Go presenta sus permisos.

## Configuración privada

Solo backend: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `STYLIST_VOICE_ENABLED=0` por defecto y `STYLIST_VOICE_DAILY_LIMIT=6`. Los valores reales están fuera de Git. Los permisos necesarios son Text to Speech, Speech to Text y lectura de Voices para comprobar la voz; no se necesita administración o borrado de voces.

La autora ha ampliado el máximo global separado a treinta intentos de voz por día UTC, compartido entre síntesis y transcripción, incluidos fallos. La cuota se guarda atómicamente en SQLite/MongoDB y no consume la cuota de los modelos de outfits. La fecha de vencimiento del asesor también desactiva las llamadas de voz. La activación está autorizada hasta finalizar el 31/12/2026 en Madrid; disponer de una clave no demuestra saldo ni todos los permisos.

## Límites y datos

El servidor admite archivos de hasta 2 MiB y reconoce firmas MP4, WebM, Ogg, WAV y MP3, sin fiarse del nombre. El minuto se controla en el cliente; no se afirma validar la duración del códec en el servidor. Se admiten transcripciones y mensajes de hasta 1.200 caracteres y síntesis de hasta 6.000 caracteres, sin recortar silenciosamente la respuesta. El audio de salida se limita a 3 MiB; timeout de 45 segundos para síntesis y 30 para transcripción. El modelo Multilingual v2 admite hasta 10.000 caracteres según su [documentación oficial](https://elevenlabs.io/docs/overview/models); Maison mantiene un límite inferior.

La lectura completa consume más créditos que el resumen anterior. Se conserva el máximo global de treinta acciones diarias entre transcripción y síntesis, incluidos fallos, sin reintentos automáticos de proveedor. Una intervención hablada con respuesta consume normalmente dos acciones de voz y, si pide nuevas recomendaciones, también un intento de IA de la cuota separada. No equivale a treinta conversaciones ni a un tope monetario.

Se comprueban temas bloqueados, instrucciones maliciosas y permisos, los campos no admitidos se rechazan y los errores externos no se copian a respuestas ni logs. El audio no se guarda en la base de datos de Maison. Se mantiene temporalmente en memoria/caché para grabación y reproducción, con limpieza al terminar o cerrar. El cliente no recibe la clave. La retención de ElevenLabs depende de la cuenta y sus condiciones; no se ha habilitado ni acreditado retención cero del proveedor. La conversación por texto sigue disponible si la voz falla, se deniega el permiso o se agota la cuota.

## Evidencia y pendientes

Los tests usan ElevenLabs simulado: opt-in, caducidad, permisos, límites de archivo/texto, cuota independiente, validación de MP3 y errores sin secretos. Safari local muestra Dictar/Escuchar y el aviso de envío a ElevenLabs; no se grabó el micrófono durante esa revisión. Se comprobó que petición, propuestas y filtros sobreviven a abrir una pieza y que la despedida conserva cena y nombres de looks.

La primera lectura de metadatos devolvió HTTP 401 `missing_permissions` para Voices. Después del ajuste de permisos por la autora, las tres pruebas de audio autorizadas respondieron HTTP 200. Las muestras sintéticas quedan privadas y no se grabó el micrófono. La transcripción escribió la marca de forma fonética; una corrección local normaliza solo variantes conocidas de KelseTS Maison y mantiene Taylor Swift sin cambios. Esa corrección se probó con tests, sin repetir el consumo real. [Resultados y límites](evidencias/voz-2026-11-08.md). Quedan la activación de Vercel y las pruebas físicas en iPhone/iPad/Android.

Referencias oficiales consultadas: [ElevenLabs: crear voz](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), [transcripción](https://elevenlabs.io/docs/api-reference/speech-to-text/convert), [autenticación y permisos](https://elevenlabs.io/docs/api-reference/authentication), [Expo Audio SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/audio/), [MediaRecorder de WebKit](https://webkit.org/blog/11353/).

## Activación pública comprobada

El 08/11/2026 se guardaron las variables de voz como Secret, solo Production, en `kelsets-maison-api`. Vercel publicó `1bbb7c1` como Ready y dominio de producción actual. Tanto la web como la API respondieron HTTP 200 en `/api/v1/stylist/voice/status` con `available: true`, 60 segundos, 2 MiB de entrada y 6.000 caracteres de síntesis. La comprobación pública de cinco rutas SPA, assets, cabeceras, salud, catálogo, imagen y acceso privado pasó. Esta verificación no consume síntesis ni acredita aún el micrófono, altavoz o reproducción automática del dispositivo.


## Correcciones tras la prueba de la autora

La autora recorrió voz y Gemini para una cena de negocios. Su transcripción identifica cuota agotada tras seis acciones y dos falsos rechazos: «Me quedo con el conjunto de Golden Hour» y «gracias esta todo perfecto». Se reconoce la elección solo si coincide con un look presentado y se conserva para la despedida. Las peticiones de cambios adicionales siguen el recorrido normal y las instrucciones maliciosas no se tratan como agradecimientos.

Se sustituyen controles con aspecto de enlace por botones táctiles con micrófono, envío y reproducción. «Terminar y enviar» indica la acción de detener el dictado. Los precios remitidos a síntesis se escriben en palabras completas, con euros y céntimos en ES/EN: 2.395,00 € se convierte en «dos mil trescientos noventa y cinco euros». El precio visible y el valor del backend no cambian. Esta pronunciación está comprobada en el texto generado y tests; no se ha gastado una nueva síntesis para afirmar cómo suena.

La ampliación a 30 acciones diarias en producción fue autorizada expresamente, conservando vencimiento y créditos existentes. No resetea la cuota ya usada y no modifica la cuota de tres intentos de modelos. El valor por defecto para nuevas instalaciones continúa siendo seis. Se ha guardado la configuración; la verificación del nuevo despliegue se registra aparte. [Captura local](evidencias/stylist-2026-11-08/04-eleccion-despedida-botones-local.png).

Verificación de publicación: Vercel mostró `cb6581f` Ready en Production. La web sirve el bundle con botones de micrófono y la nueva respuesta de elección. GET `/api/v1/stylist/voice/status` devolvió HTTP 200 con `available: true` y `dailyActionLimit: 30`. Sin síntesis ni transcripción adicionales; queda escuchar físicamente los nuevos importes.

## Jerarquía visual de los controles

Tras la captura de la autora del 08/11 a las 15:47, el modo voz tiene una sola acción principal: micrófono burdeos dentro de un panel propio. Cambiar a texto usa un control secundario con borde tenue. El campo y envío escritos solo aparecen en modo texto; el borrador se conserva al alternar. La reproducción de respuestas también tiene menor peso visual. En web, una bienvenida ocupa el estado vacío. La app aplica la misma separación de modos y jerarquía del panel. Se verificaron build web y exportaciones iOS/Android; la vista de voz se inspeccionó en Safari con un render estático local del componente real, sin solicitar micrófono ni consumir proveedores. No se presenta esa vista como una prueba funcional de grabación.

## Nombres de looks y aclaración

Se acepta el nombre aislado de un look presentado, también sin espacios («GoldenHour»), además de «me quedo con…». Si un nombre corto se parece de forma acotada a una única propuesta, se pregunta «¿Te refieres a Golden Hour?» sin darlo por elegido. Si la elección no se identifica, se pide escribirla; no se afirman nombres reconocidos por similitud como una selección confirmada. Las peticiones de otra prenda, color o presupuesto continúan como cambios de preferencias. Los temas bloqueados mantienen su redirección. Ante una frase hablada incomprensible, el chat ofrece repetir o cambiar a texto.

El aviso habitual de voz termina en «tAIlor responde con voz». La información sobre el servicio externo se conserva en el paso previo a elegir micrófono. Los tests comprueban el texto de aclaración y reconocimiento local; no se ha grabado ni repetido una transcripción real para validar cómo se reconoce un acento concreto.

La autora ha indicado la pronunciación «Kelsi TiEs Meison». La preparación compartida del texto para síntesis sustituye únicamente la marca KelseTS Maison por esa grafía fonética; el texto visible y los datos del catálogo conservan la marca. Se comprobó la transformación sin consumir una nueva síntesis; la escucha física queda pendiente.
