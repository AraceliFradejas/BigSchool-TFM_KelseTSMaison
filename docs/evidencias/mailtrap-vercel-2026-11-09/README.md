# Mailtrap desde Vercel · 9/11/2026

Activación autorizada por Araceli en Production del proyecto `kelsets-maison-api`. Ocho variables de correo guardadas como Secret, incluida la credencial SMTP; `PUBLIC_APP_URL` como Config pública. No se han añadido secretos al repositorio ni al frontend. Vercel ha solicitado verificación de identidad, completada personalmente por la autora.

Despliegue [FH94XhjDTyv4NMjKRPcqPMo1uxRQ](https://vercel.com/aracelis-projects-ac8a2b1b/kelsets-maison-api/FH94XhjDTyv4NMjKRPcqPMo1uxRQ), fuente `62d26cc`, Ready y dominio de producción asignado. Comprobación pública posterior correcta: cinco rutas SPA, tres assets, cabeceras, salud, catálogo, imagen, acceso privado y 404 de asset inexistente.

## Prueba realizada

Peticiones HTTPS a la API publicada, con cuenta Team existente y destinatario ficticio. No es una ejecución desde la interfaz de compra ni desde Insomnia. No se muestran credenciales ni cookies. Un primer intento sin la cabecera de protección `X-Maison-Request` recibió 403 `origin_denied`, sin iniciar sesión ni crear pedido; se corrigió el cliente de prueba y se ejecutó el recorrido.

- Pedido DEMO **f350052c-7f6c-4443-a7ba-d49cc3a60cdc**: Studio Interview, cuatro piezas, ropa M y mocasines 37 disponibles.
- Total **4.840,00 €**, cargo real **0,00 €**. Creación 201 y repetición idéntica 200: mismo pedido, una sola comunicación de compra.
- Registro SMTP de compra `captured` a las 15:40:50 UTC (16:40:50 Madrid).
- Cancelación del mismo pedido, separada por al menos doce segundos; registro SMTP `captured` a las 15:41:07 UTC (16:41:07 Madrid).
- Lecturas de catálogo antes/después confirman reposición de las cuatro variantes. Estado final cancelado. La sesión de comprobación se cerró.
- Ambos correos observados en My Sandbox en Safari con logo, fotografías y precios históricos correctos. No se envían correos a clientes reales ni se realizan cobros o reembolsos bancarios.

`verificacion-api.json` conserva aserciones y respuestas seleccionadas sin secretos. La prueba crea un pedido cancelado y sus comunicaciones en la base publicada de Maison; no se ha borrado el historial. A diferencia de las rondas aisladas anteriores, **esta sí verifica el despliegue público con su persistencia real**.

## Capturas originales

| Archivo | Contenido |
| --- | --- |
| [01](01-variables-production.jpg) | Variables en Production, sin valores revelados. |
| [02](02-vercel-ready.jpg) | Despliegue Ready y dominio asignado. |
| [03](03-mailtrap-compra.jpg) | Compra recibida, identificación del pedido y logo. |
| [04](04-mailtrap-compra-piezas.jpg) | Piezas y fotografías de la compra. |
| [05](05-mailtrap-compra-total.jpg) | Total y pie académico. |
| [06](06-mailtrap-cancelacion.jpg) | Correo de cancelación del mismo pedido. |
| [07](07-mailtrap-cancelacion-total.jpg) | Importe cancelado y aclaración de demostración. |

JPG originales de escritorio de Safari, sin montaje; SHA-256 en manifest.json. Esta ronda está en castellano; las muestras inglesas y vistas móviles emuladas están en [la prueba local anterior](../emails-2026-11-09/README.md). La comprobación física de Mis comunicaciones en Expo Go sigue pendiente.

Enlaces autenticados de Mailtrap (sujetos a retención del buzón): [compra](https://mailtrap.io/sandboxes/4907610/messages/5802770488), [cancelación](https://mailtrap.io/sandboxes/4907610/messages/5802770981). No se han borrado mensajes manualmente ni cambiado credenciales compartidas. En el momento de las capturas, el panel mostraba 14/50 envíos y 10 mensajes retenidos; es un estado observado, no una cuota garantizada para el futuro.
