# Validación de la entrega final de Maison

He contrastado la aplicación con pruebas automatizadas, recorridos en navegador, servicios publicados y evidencias en dispositivos reales. Distingo las pruebas aisladas de las operaciones realizadas contra producción.

## Pruebas automatizadas e instalación

Mi suite completa reúne **192 comprobaciones correctas y ninguna omitida**: 112 backend, 10 cliente HTTP, 10 web y 60 móvil. Incluye SQLite y un replica set temporal de MongoDB, sin utilizar Atlas para las pruebas destructivas.

He comprobado permisos, aislamiento de cuentas, sesiones web y nativas, precios del servidor, stock, concurrencia, idempotencia, estados de pedido, cancelación, edición de Team, normalización de imágenes, conversaciones de tAIlor, cuotas, voz y comunicaciones. Los dobles de proveedores utilizados en estas pruebas no equivalen a llamadas reales a esos servicios.

He verificado una instalación limpia con `npm ci` en una copia temporal sin secretos y he compilado la web desde ella. También he comprobado el build servido con configuración de producción y datos desechables, y he exportado los bundles Hermes de iOS y Android. Expo confirma la compatibilidad de los módulos instalados con SDK 58.

## Web y API publicadas

He comprobado por HTTPS las rutas de la SPA, recursos, cabeceras de seguridad, salud, catálogo, imágenes y rechazo de accesos privados sin sesión. La lectura completa del catálogo publicado confirma 190 productos, 996 variantes, 16 colecciones y 57 conjuntos completos; las 190 imágenes de producto responden correctamente.

He revisado las referencias locales de la documentación y no he encontrado archivos enlazados ausentes. El análisis de patrones de secretos en los archivos de texto versionados no ha encontrado coincidencias; esta comprobación no sustituye una auditoría especializada de secretos o una revisión histórica completa del repositorio.

## Cuenta de evaluación

He probado las credenciales entregadas para `profesor@maison.example` tanto por HTTP como en Chrome. La cuenta accede a su espacio, pedidos y comunicaciones. La API devuelve 403 al intentar acceder a Team y 401 a los recursos privados tras cerrar la sesión.

He recorrido el catálogo, la búsqueda, la ficha, las variantes, favoritos, bolsa y revisión de entrega con esta cuenta. Los datos de acceso se mantienen fuera de Git y no se incluyen aquí.

## Compra, estados y correo

He recorrido visualmente una compra DEMO completa con una cuenta local desechable: variante disponible, bolsa, acceso, entrega ficticia, consentimiento, confirmación y justificante con cargo real cero. El pedido y su comunicación aparecen en la cuenta y se pueden consultar en inglés.

Las comprobaciones automatizadas contrastan rechazo sin efectos, importes manipulados, reintentos sin duplicados, estados válidos, cancelación y reposición única de stock. Las rondas manuales de Insomnia conservan sus registros originales:

- [24 casos con SQLite](evidencias/insomnia-checkout-2026-11-09/README.md).
- [24 casos con MongoDB local](evidencias/insomnia-mongodb-2026-11-09/README.md).
- [Consulta de Atlas en solo lectura](evidencias/atlas-2026-11-09/README.md).

He verificado previamente recepciones reales de compra y cancelación en Mailtrap Sandbox, en castellano e inglés, con logo, imágenes, variantes e importe del catálogo. La integración no envía a destinatarios reales. Conservo [las muestras bilingües](evidencias/emails-2026-11-09/README.md) y [la recepción desde Vercel](evidencias/mailtrap-vercel-2026-11-09/README.md). Las pruebas aisladas actuales no se presentan como nuevas recepciones de Mailtrap.

## tAIlor y voz

He reproducido y corregido la pantalla en blanco de la web: el efecto de desplazamiento del chat ya no devuelve a React el resultado de `scrollIntoView`. He verificado recomendaciones reales, apertura de piezas y conservación del historial al reabrir el asesor. Una regresión en ES/EN comprueba que pedir el presupuesto en euros no desvía la respuesta hacia precios de producto.

He comprobado el servicio de voz publicado con tres acciones reales: una síntesis breve en castellano, otra en inglés y la transcripción del audio sintético en castellano. Las tres responden con 200 y la transcripción conserva el plan y el presupuesto. Estas peticiones verifican el servicio, no una nueva grabación con micrófono físico.

Las cuotas configuradas son 100 intentos globales de modelo y 200 acciones de voz al día UTC. IA y voz están configuradas hasta finalizar el 31/12/2026 en Madrid. Los límites son de acciones, no contadores de euros. Véanse [chat generativo](CHAT-GENERATIVO-TAILOR.md) y [voz](VOZ-TAILOR.md).

## Dispositivos y límites de la evidencia

Mis [grabaciones de dispositivos](evidencias/videos-2026-11-09/README.md) muestran recorridos en iPhone, iPad y Android. He comprobado voz en iOS y Android durante esas sesiones. La exportación actual de bundles no sustituye repetir físicamente todos los recorridos en cada dispositivo. La app se distribuye para la demostración mediante Expo Go; el enlace LAN necesita un servidor de desarrollo accesible.

## Dependencias y seguridad

He aplicado las actualizaciones compatibles de seguridad y los parches oficiales recomendados de Expo SDK 58. La auditoría npm resultante no registra avisos altos ni críticos. Permanecen tres avisos moderados asociados a la dependencia indirecta `minimatch` de `@expo/fingerprint`, utilizada por las herramientas de Expo. No he aplicado la propuesta automática de bajar de SDK 58 a SDK 52, porque supone un cambio incompatible. Este hallazgo se conserva como límite conocido de la revisión.

Las verificaciones descritas no constituyen una prueba de penetración exhaustiva ni garantizan ausencia de defectos en cualquier conversación o dispositivo.
