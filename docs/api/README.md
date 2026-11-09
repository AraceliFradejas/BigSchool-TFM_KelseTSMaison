# Pruebas de pedidos, permisos y comunicaciones con Insomnia

Importar `Maison-Insomnia.postman_collection.json` desde Import → File → Scan → Import. Es una colección Postman 2.1 compatible con la importación de Insomnia, comprobada en Insomnia 13.3.1. Referencia: [documentación de Kong](https://developer.konghq.com/insomnia/import-export/).

## Entorno aislado

1. Ejecutar `npm run build`.
2. Definir `MAISON_TEST_PASSWORD` en la terminal con una contraseña de pruebas de al menos diez caracteres y arrancar `node scripts/insomnia-sandbox.mjs`. No cargar `backend/.env` ni usar datos de producción.
3. El script crea una base independiente en `/tmp/maison-insomnia.sqlite` y tres cuentas ficticias locales (cliente, otra cuenta y Team). Escucha únicamente en `127.0.0.1:3179`; no hay IA ni correo externo activos en este entorno.
4. Crear un proyecto **Local Vault** en Insomnia e importar la colección. Mantener base_url local. Completar test_password solo en el entorno local, sin exportar contraseña ni cookies.
5. Ejecutar peticiones 01–22 en orden con su cookie jar. La operación 05 devuelve el ID: sustituir `REEMPLAZAR_ID_PEDIDO` en las URLs 08, 10, 13, 17 y 18. Esta sustitución explícita evita el fallo de variable vacía de ruta observado durante la importación.
6. Para otra ronda, cambiar operation_id por otro UUID. La misma clave significa repetición, no una compra nueva. Reutilizar la base conserva cuentas y contraseñas originales; no las modifica.

El recorrido básico usa `/orders`, con `payment: null`; el pago completo `/checkout/demo` dispone de pruebas automatizadas distintas. No trasladar este entorno a Vercel ni ejecutar mutaciones contra producción. Los cuerpos y códigos esperados están en la descripción de cada petición.

## Resultados realmente ejecutados

[Capturas, registro UI y contraste de SQLite](../evidencias/emails-2026-11-09/README.md). Un pedido de 185000 céntimos, mismo ID al repetir, rechazo de precio manipulado (400), permisos Team (403), aislamiento del pedido (404), dos comunicaciones y una sola reposición de stock al cancelar (segunda cancelación 409).

La captura externa de correo es una comprobación adicional y necesita configuración propia de Maison. Los tests de adaptador con proveedor simulado no prueban una recepción real en Mailtrap.
