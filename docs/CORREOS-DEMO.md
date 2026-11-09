# Correos de Maison · simulación y Mailtrap Sandbox

**Mailtrap publicado · 9/11/2026:** activado en Production de `kelsets-maison-api`, despliegue `FH94XhjDT`. Compra DEMO de Studio Interview por 4.840,00 €, cargo real 0,00 €, reintento sin duplicado y cancelación del mismo pedido; dos correos recibidos y stock repuesto. [Registro y siete capturas](evidencias/mailtrap-vercel-2026-11-09/README.md).


## Qué está implementado

Cada pedido nuevo y cada transición válida crea una comunicación ES/EN y su registro de entrega en la misma transacción de SQLite o MongoDB. La comunicación guarda las líneas, nombres, variantes e importes del pedido, sin recalcular su precio desde el catálogo actual. Los eventos son registro, confirmación, envío simulado, entrega simulada y cancelación.

Mis comunicaciones permite desplegar una previsualización en web y app. El envío opcional usa Nodemailer con SMTP exclusivamente a `sandbox.smtp.mailtrap.io`, TLS obligatorio y tiempos máximos de conexión. El destinatario siempre es ficticio. No existe una configuración para activar un servidor de correo real ni se ejecutan cobros o reembolsos bancarios.

La plantilla de correo incorpora el logo propio, tonos marfil/burdeos, nombre del outfit cuando coincide exactamente con una selección editorial, fotografías, variantes, cantidades, precios unitarios, subtotales y total. En cancelación muestra el importe cancelado. La aclaración académica queda en el pie; el total visible utiliza los precios del catálogo registrados por el servidor, no cero euros.

Logo PNG y 190 miniaturas JPEG se derivan de los recursos propios existentes mediante `node scripts/prepare-email-assets.mjs`. Se adjuntan como imágenes CID; no se descargan imágenes desde URLs proporcionadas por usuarios ni se permiten adjuntos de archivos arbitrarios. Una miniatura solo se usa si la imagen histórica coincide con la fuente del manifiesto; las piezas de Team con otra imagen conservan su información textual sin sustituirla por una foto antigua. Los archivos de email se incluyen explícitamente en la función de Vercel.

El cuerpo HTML escapa el texto del catálogo y tiene alternativa de texto plano. Las fotos y nombres enlazan a la ficha y el botón al pedido. Una muestra aislada no existe en la base pública: su enlace sirve para comprobar el destino, no para afirmar que el evaluador podrá consultar ese pedido ficticio en producción.

## Configuración privada

`backend/.env.example` contiene nombres y valores públicos; `SMTP_USER` y `SMTP_PASSWORD` deben permanecer vacíos allí. Las credenciales están solo en `backend/.env` privado. Se usan MAIL_ENABLED, MAIL_FROM, PUBLIC_APP_URL, SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER y SMTP_PASSWORD. El remitente de Maison utiliza `@maison.example`. MAIL_LANGUAGE es opcional (es por defecto, en para inglés).

La muestra prueba ambos idiomas explícitamente. El idioma de envío de la integración actual se configura en el servidor; no se ha implementado todavía una preferencia persistente de correo por cliente. Las previsualizaciones conservan siempre ambas traducciones.

Activar con MAIL_ENABLED=true solo en el entorno autorizado. El adaptador comprueba host Sandbox, puerto/TLS, remitente ficticio y credenciales sin imprimirlas. La configuración local no crea secretos automáticamente en Vercel. La activación SMTP en Production fue autorizada y comprobada el 9/11/2026; véase el registro de producción enlazado al inicio.

## Reintentos y límites reales

`email_deliveries` guarda pending, sending, captured o failed_or_unknown. El cambio pending → sending es atómico; los reintentos del checkout y las llamadas concurrentes no vuelven a enviar un mensaje ya reclamado. Los errores de correo no revierten una compra ya registrada. No se registra la respuesta completa del proveedor ni sus credenciales.

No se promete entrega exactamente una vez: si el proceso termina tras reclamar un mensaje o se pierde una respuesta SMTP, puede quedar sending o failed_or_unknown. No hay worker de recuperación ni reenvío automático ambiguo; requiere revisión. Un mensaje pending no acredita envío. Los eventos que existían antes de esta integración no se reenvían por reconstrucción del catálogo.

Mailtrap limita la frecuencia por ventanas de diez segundos según el plan y puede responder 550 al excederla. El script de demostración separa los envíos doce segundos. Una transición rápida en la aplicación puede conservar el correo interno y registrar fallo Sandbox; la compra continúa. [Límites oficiales](https://docs.mailtrap.io/email-sandbox/help/features-and-limits).

El buzón compartido My Sandbox conserva también muestras anteriores. No se borraron manualmente ni se modificaron credenciales de Cars/Talks. Mailtrap aplica su propia retención FIFO al alcanzar el máximo de mensajes; las capturas de Maison se guardan fuera del buzón para conservar las evidencias.

## Verificaciones del 9/11/2026

- 191 pruebas automatizadas correctas: 111 backend (incluido MongoDB aislado), 10 cliente API, 10 web y 60 móvil. Último log local: `/tmp/maison-email-final-tests.log`.
- Build web y exportaciones iOS/Android correctos tras añadir la previsualización. La revisión física de esta nueva vista en Expo Go sigue pendiente.
- Recorrido real en Insomnia contra SQLite aislado: compra, reintento, precio manipulado, permisos, aislamiento entre clientes, cancelación y reposición única. [Colección e instrucciones](api/README.md).
- SMTP real: compra y cancelación en español e inglés de Studio Interview, cuatro piezas, ropa M y calzado 37 disponible, total 4.840,00 €. Cuatro capturas aceptadas; cero envíos adicionales al repetir el checkout; stock de las cuatro variantes repuesto.
- Logo y fotos observados dentro del correo recibido; revisión de escritorio y vista móvil emulada de Mailtrap. Un desbordamiento inicial de nombres se corrigió con miniaturas más estrechas y ajuste de palabras; se verificó después con otra pareja inglesa. Esto no acredita todos los clientes de correo ni una app de correo física.
- Hubo intentos iniciales fallidos: adaptación de formato del destinatario y rechazo SMTP 550 al enviar estados demasiado seguidos. También llegaron dos muestras de compra preliminares; no se describen esas rondas como correctas completas. La pareja espaciada y la muestra ilustrada posteriores sí completaron sus aserciones.

[Evidencias y capturas originales](evidencias/emails-2026-11-09/README.md).

Para repetir la muestra de cuatro correos con datos aislados: `node --env-file=backend/.env backend/scripts/check-mail-sandbox.js`. Consume cuatro mensajes Sandbox; no ejecutarlo como prueba rutinaria. Con MAIL_SAMPLE_LANGUAGES=en se limita a una pareja inglesa. El script fuerza el envío solo en esa ejecución y no activa el correo del servidor ni modifica datos públicos.
