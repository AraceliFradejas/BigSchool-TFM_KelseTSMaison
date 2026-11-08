# Voz de tAIlor · integración preparada

Estado del 8 de noviembre de 2026: elección inicial entre texto y voz implementada en web y app, 154 pruebas correctas y exportaciones iOS/Android correctas. Tres pruebas reales de ElevenLabs (voz ES, voz EN y transcripción de audio generado) respondieron HTTP 200. La autora ha autorizado los secretos de producción y cien acciones diarias; la verificación del despliegue se registra al final de este documento. La grabación y reproducción físicas en los dispositivos siguen pendientes.

## Recorrido

1. Al abrir el chat se pregunta «¿Prefieres escribir o hablar con tAIlor?». Escribir abre el campo sin solicitar micrófono. Elegir voz solicita permiso; la grabación empieza solo al pulsar Dictar, no al conceder el permiso. El modo se conserva durante la navegación y se puede cambiar.
2. La interfaz limita cada grabación a un minuto y permite detenerla antes. Cerrar o pasar a segundo plano no envía la grabación pendiente.
3. Al detener, se transcribe mediante Scribe v2 a través del backend y se envía automáticamente al chat. La petición queda visible como texto; si hay un error se puede volver a intentar o continuar escribiendo.
4. En modo voz, la nueva respuesta se sintetiza automáticamente una sola vez: introducción, nombres, explicaciones, totales, piezas con su variante y precio, y pregunta final. Se puede detener y volver a escuchar. No se reproduce de nuevo automáticamente al reabrir el chat. Safari puede exigir pulsar «Escuchar» cuando bloquea la reproducción automática.


La misma voz puede leer textos ES/EN. Web utiliza MediaRecorder y Audio; la app utiliza los módulos oficiales expo-audio y expo-file-system compatibles con SDK 58 y disponibles en Expo Go. La exportación no acredita permisos ni audio físico de cada dispositivo. El mensaje de permiso personalizado corresponde a un futuro binario propio; Expo Go presenta sus permisos.

## Configuración privada

**Producción actual (08/11/2026): 200 acciones de voz por día UTC**, sin reiniciar consumos y con caducidad al finalizar el 31/12/2026 en Madrid. Los cambios anteriores de cuota se conservan abajo como historial.

Solo backend: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `STYLIST_VOICE_ENABLED=0` por defecto y `STYLIST_VOICE_DAILY_LIMIT=6`. Los valores reales están fuera de Git. Los permisos necesarios son Text to Speech, Speech to Text y lectura de Voices para comprobar la voz; no se necesita administración o borrado de voces.

La autora ha ampliado el máximo global separado a cien intentos de voz por día UTC, compartido entre síntesis y transcripción, incluidos fallos. La cuota se guarda atómicamente en SQLite/MongoDB y no consume la cuota de los modelos de outfits. La fecha de vencimiento del asesor también desactiva las llamadas de voz. La activación está autorizada hasta finalizar el 31/12/2026 en Madrid; disponer de una clave no demuestra saldo ni todos los permisos.

## Límites y datos

El servidor admite archivos de hasta 2 MiB y reconoce firmas MP4, WebM, Ogg, WAV y MP3, sin fiarse del nombre. El minuto se controla en el cliente; no se afirma validar la duración del códec en el servidor. Se admiten transcripciones y mensajes de hasta 1.200 caracteres y síntesis de hasta 6.000 caracteres, sin recortar silenciosamente la respuesta. El audio de salida se limita a 3 MiB; timeout de 45 segundos para síntesis y 30 para transcripción. El modelo Multilingual v2 admite hasta 10.000 caracteres según su [documentación oficial](https://elevenlabs.io/docs/overview/models); Maison mantiene un límite inferior.

La lectura completa consume más créditos que el resumen anterior. Se conserva el máximo global de cien acciones diarias entre transcripción y síntesis, incluidos fallos, sin reintentos automáticos de proveedor. Una intervención hablada con respuesta consume normalmente dos acciones de voz y, si pide nuevas recomendaciones, también un intento de IA de la cuota separada. No equivale a cien conversaciones ni a un tope monetario.

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

## Cuota de cien acciones y aviso bajo demanda

La autora autorizó ampliar la voz a **100 acciones globales por día UTC**, con el mismo vencimiento al terminar el 31/12/2026 en Madrid y créditos existentes. Se conserva el valor por defecto de seis para nuevas instalaciones; el máximo de configuración pasa a cien. No se amplía la cuota independiente de los modelos de looks ni se compra saldo. Las acciones ya usadas en el día no se reinician.

Tras recibir `voice_daily_limit`, los clientes recuerdan el límite durante la carga actual de la aplicación hasta el siguiente día UTC. Se detienen los intentos automáticos de voz y no se añade una frase de aviso a cada respuesta. Al pulsar Hablar o pedir un audio nuevo, aparece un aviso durante cinco segundos; grabaciones en curso que fallen por cuota también lo muestran una vez. El texto sigue disponible. Los audios ya preparados pueden reproducirse sin otra síntesis. Recargar puede requerir una nueva respuesta de cuota para conocerla, pero no restablece el contador del servidor.

Safari se probó con una cuota válida agotada en SQLite aislado: una petición de síntesis recibió el límite, cero llamadas a proveedor; el clic posterior de Hablar mostró y ocultó el tooltip sin nuevas peticiones ni micrófono. La vista temporal se eliminó. [Regresiones y contadores](evidencias/stylist-2026-11-08/05-regresiones-presupuesto-eleccion-cuota.json). El ajuste se guardó en Vercel Production; el estado público se ha verificado tras desplegar: HTTP 200, voz disponible y `dailyActionLimit: 100`, con el nuevo bundle. No se consumió voz real.

## Arranque de la primera respuesta (08/11)

La autora comunica que la primera respuesta no se escucha automáticamente tanto en web como en Expo Go, aunque las siguientes sí. En web se preparaba un elemento Audio nuevo después de esperar la red. Ahora se prepara un reproductor reutilizable de forma síncrona al pulsar Hablar o grabar, antes de pedir permisos o esperar servicios. La preparación reproduce silencio local y no graba ni consulta proveedores. Las respuestas utilizan ese mismo elemento; la pausa y limpieza pertenecen al mensaje propietario para evitar que otro mensaje interrumpa el actual. Se conserva el control Escuchar con audio ya generado si el navegador rechaza autoplay. La política del navegador puede exigir otra interacción: no se promete saltársela. Referencia: [HTMLMediaElement.play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).

En nativo se esperaba la respuesta TTS, pero se llamaba a play inmediatamente tras replace y se marcaba como reproduciendo sin observar el resultado. Ahora se espera carga y evento de reproducción real, con cancelación, tiempo de espera y limpieza de listeners. Al detener la grabación se vuelve al modo de reproducción antes de transcribir. Las pruebas cubren primera carga, cancelación durante carga, fallo de arranque, preparación web síncrona, propiedad del reproductor y recuperación del bloqueo sin otra petición TTS. Son pruebas con reproductores simulados: la escucha de la primera respuesta en Safari y en dispositivos físicos sigue pendiente. Suite: 171 comprobaciones; build web y exportaciones iOS/Android correctos. No se ha gastado cuota de voz ni se ha accedido al micrófono para estas pruebas.

## Ampliación autorizada a 200 acciones — 08/11/2026

La autora solicita ampliar el límite de voz de 100 a 200 acciones diarias para pruebas. La consulta de solo lectura a la base configurada confirmó 100 acciones en `stylist_voice_usage` para el día UTC 2026-11-08; el endpoint público anunciaba límite 100. El saldo de ElevenLabs aportado por la autora (9.106 de 363.000 créditos utilizados) es un dato independiente y no fue auditado mediante su API.

Se permite un máximo configurable de 200 y se conserva el contador: una prueba con proveedor simulado parte de 100 acciones consumidas y comprueba que una petición con límite 200 eleva el total a 101, sin reiniciarlo. Ocho pruebas de voz correctas. El valor privado local y la variable Production STYLIST_VOICE_DAILY_LIMIT pasan a 200. La activación se publica mediante el despliegue normal de Git después de guardar el entorno. Se mantiene el cierre del 31/12/2026, sin recargas ni compra de créditos. El límite de modelos es independiente. Web y Expo Go recuerdan un 429 hasta recargar o cambiar de día UTC; tras la ampliación se debe recargar el cliente. La comprobación pública final se registra después de publicar.


Verificación pública completada: HTTP 200, voz disponible y `dailyActionLimit: 200`. Una única petición real de síntesis, con frase sintética en castellano y sin micrófono, devolvió HTTP 200 y 12.556 bytes de audio MPEG. No se guardó ese audio ni se afirma escucha en el dispositivo físico. [Evidencia del contador, cuota y síntesis](evidencias/stylist-2026-11-08/10-voz-cuota-200.json). Se avisó a la autora para cerrar Expo Go por completo y abrir Maison de nuevo, o recargar en web.

## Revalidación de un bloqueo recordado tras ampliar cuota

La autora comunica que no graba ni transcribe en iPad, Android e iPhone después de ampliar el límite. La consulta de solo lectura confirma 101 acciones consumidas con límite público 200: los intentos no estaban agotando el nuevo margen. La reproducción real en el dispositivo y si se utiliza web o Expo Go no quedan acreditadas por esa lectura.

Se corrige un bloqueo reproducible del cliente: recordar un 429 por día sin volver a consultar podía mantener la grabación deshabilitada tras ampliar el máximo en ese mismo día. El endpoint de estado incorpora `quotaDay` y `quotaAvailable`, leídos del contador sin incrementarlo ni exponer mensajes/audio. Al abrir el chat se sincroniza el estado; un control bloqueado reconsulta antes de impedir la acción. Peticiones simultáneas comparten esa consulta, se ignora un estado de otro día y un fallo de red no elimina el bloqueo conocido. La preparación de audio web permanece dentro del gesto del usuario, antes de la espera de red.

176 comprobaciones correctas (101 backend, 10 cliente HTTP, 10 web y 55 móvil), build web y exportaciones iOS/Android. Las pruebas cubren margen 100/200, cuota agotada 200/200, lectura sin consumo, desbloqueo por respuesta actual y deduplicación. Es una corrección comprobada del mecanismo de cuota, no una prueba física del micrófono ni una afirmación de que sea la única causa del fallo comunicado. No se grabó a la autora ni se consumió síntesis/transcripción para estas comprobaciones.

Tras desplegar, se comprobaron ambas rutas públicas (web y dominio API) con HTTP 200, `quotaDay: 2026-11-08`, `quotaAvailable: true`, `dailyActionLimit: 200` y `Cache-Control: no-store`. La autora concreta que el fallo ocurre dentro de Expo Go y que no graba ni transcribe; Metro registra bundles de iOS y Android. Se le pidió recargar y comunicar qué estado muestra el botón, sin dar por verificado aún el micrófono físico. [Evidencia de la revalidación](evidencias/stylist-2026-11-08/11-revalidacion-cuota-voz.json).
