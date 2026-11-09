# Pruebas de pedidos, permisos y comunicaciones con Insomnia

Importar `Maison-Insomnia.postman_collection.json` desde Import → File → Scan → Import. Es una colección Postman 2.1 compatible con la importación de Insomnia, comprobada en Insomnia 13.3.1. Referencia: [documentación de Kong](https://developer.konghq.com/insomnia/import-export/).

## Entorno aislado

1. Ejecutar `npm run build`.
2. Definir `MAISON_TEST_PASSWORD` en la terminal con una contraseña de pruebas de al menos diez caracteres y arrancar `node scripts/insomnia-sandbox.mjs`. No cargar `backend/.env` ni usar datos de producción.
3. El script crea una base independiente en `/tmp/maison-insomnia.sqlite` y tres cuentas ficticias locales (cliente, otra cuenta y Team). Escucha únicamente en `127.0.0.1:3179`; no hay IA ni correo externo activos en este entorno.
4. Crear un proyecto **Local Vault** en Insomnia e importar la colección. Mantener base_url local. Completar test_password solo en el entorno local, sin exportar contraseña ni cookies.
5. Ejecutar peticiones 01–22 en orden con su cookie jar. La operación 05 devuelve el ID: sustituir `REEMPLAZAR_ID_PEDIDO` en las URLs 08, 10, 13, 17 y 18. Esta sustitución explícita evita el fallo de variable vacía de ruta observado durante la importación.
6. Para otra ronda, cambiar operation_id por otro UUID. La misma clave significa repetición, no una compra nueva. Reutilizar la base conserva cuentas y contraseñas originales; no las modifica.

El recorrido básico usa `/orders`, con `payment: null`; el pago completo `/checkout/demo` se recorre también con la segunda colección descrita debajo. No trasladar este entorno a Vercel ni ejecutar mutaciones contra producción. Los cuerpos y códigos esperados están en la descripción de cada petición.

## Resultados realmente ejecutados

[Capturas, registro UI y contraste de SQLite](../evidencias/emails-2026-11-09/README.md). Un pedido de 185000 céntimos, mismo ID al repetir, rechazo de precio manipulado (400), permisos Team (403), aislamiento del pedido (404), dos comunicaciones y una sola reposición de stock al cancelar (segunda cancelación 409).

La captura externa de correo es una comprobación adicional y necesita configuración propia de Maison. Los tests de adaptador con proveedor simulado no prueban una recepción real en Mailtrap.

## Segunda colección: pago DEMO y ciclo de estados

Importar `Maison-Pago-DEMO-Insomnia.postman_collection.json`. Son 24 casos P01–P24, con el mismo cookie jar y `test_password` local. P09 devuelve el pedido: sustituir `REEMPLAZAR_ID_PEDIDO` en P11, P15–P19 y P22. Un UUID nuevo inicia una compra distinta; repetir la misma operación comprueba idempotencia. No usar pedidos de producción.

Para SQLite se usó una base nueva: definir `MAISON_TEST_DATABASE=/tmp/maison-insomnia-checkout-20261109.sqlite` antes de arrancar `scripts/insomnia-sandbox.mjs`. Para MongoDB, definir solo `MAISON_TEST_PASSWORD` y arrancar `node scripts/insomnia-mongo-sandbox.mjs`: crea un replica set temporal de un nodo y escucha en `127.0.0.1:3181`; cambiar `base_url` a `http://127.0.0.1:3181/api/v1`. Utiliza el binario MongoDB 8.0.16 de la caché temporal o lo obtiene mediante mongodb-memory-server si falta. No usa Atlas, ni importa `.env` ni activa servicios externos. Al detener el proceso se elimina la instancia temporal.

Resultados manuales y contraste directo:

- [24 casos con SQLite y 15 capturas](../evidencias/insomnia-checkout-2026-11-09/README.md).
- [24 casos con MongoDB local y 16 capturas](../evidencias/insomnia-mongodb-2026-11-09/README.md). Se conserva además una petición de detalle con ruta incompleta y su repetición corregida.
- [Cinco capturas de Atlas en Safari](../evidencias/atlas-2026-11-09/README.md): catálogo e índices publicados, consultados sin modificar datos. No contienen los pedidos de estas rondas locales.

Compra rechazada y total cambiado: 409 sin crear pedido. Compra aprobada: 201; reintento: 200 con mismo justificante. Salto de estado y cancelación tras envío: 409. Final: un pedido entregado de 1.850,00 €, cargo real 0,00 €, cuatro comunicaciones, stock 6 → 5 y correos pendientes porque SMTP está desactivado. El resultado se comprobó en ambos motores. Las recepciones reales de Mailtrap corresponden a otra prueba, enlazada arriba.
