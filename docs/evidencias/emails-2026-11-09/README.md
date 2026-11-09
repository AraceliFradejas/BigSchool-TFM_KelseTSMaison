# Correos DEMO y pruebas en Insomnia · 9/11/2026

Previsualización interna implementada en web y app. Cada mensaje nuevo conserva asunto y cuerpo ES/EN con destinatario ficticio, referencia y líneas históricas del pedido, total y cargo real de cero euros. Estados: pending, confirmed, dispatched, delivered y cancelled. Los mensajes antiguos no se regeneran con datos actuales.

## Evidencia observada

- `01-compra-es.jpg`: correo de registro de pedido en Safari local.
- `02-cancelacion-es.jpg`: cancelación y reposición simulada.
- `03-cancelacion-en.jpg`: misma comunicación traducida.
- `insomnia/04` a `15`: peticiones/respuestas capturadas en Insomnia 13.3.1, proyecto Local Vault independiente de Cars/Talks.
- `insomnia/registro-ui.json`: texto obtenido de las respuestas visibles, sin cookies ni tokens.
- `insomnia/contraste-sqlite.json`: lectura directa posterior de la base aislada y aserciones correctas.

Pedido local: `de879cf8-3c7b-46c6-acc0-bd0cd5e1523f`. Precio por servidor: 185000 céntimos; una unidad. Estado final cancelled, stock final 6 (igual al inicial visible en catálogo), un pedido y dos comunicaciones: pending y cancelled. Otra cuenta: cero comunicaciones y 404 al consultar el pedido ajeno. Reintento de creación: 200 y mismo ID; manipulación de precio: 400; cliente en ruta Team: 403; segunda cancelación: 409.

Se detectó que la variable de ruta vacía importada no se resolvía como se esperaba: la primera petición 08 devolvió una lista, no el detalle. Se corrigieron las URLs con el ID explícito antes de comprobar el detalle, aislamiento y cancelación. El registro conserva ambas respuestas. La colección publicada utiliza `REEMPLAZAR_ID_PEDIDO` para que se sustituya explícitamente en las cinco URLs indicadas; no confundir la generación/importación de una colección con su ejecución.

Este recorrido usa `/orders`, la ruta básica DEMO, sin pasarela ni justificante de pago (`payment: null`). El pago aceptado/rechazado de `/checkout/demo`, concurrencia, rollback y MongoDB se verifican por separado en las pruebas automatizadas existentes. No presentar estas capturas como una compra física en móvil ni como un envío SMTP.

## Captura externa real en Mailtrap Sandbox

La autora solicitó un buzón de pruebas y configuró SMTP privado. El adaptador definitivo utiliza Nodemailer y Mailtrap Sandbox con TLS obligatorio, no la API inicialmente considerada. Se han completado compra y cancelación ES/EN de Studio Interview: cuatro piezas y total del catálogo de 4.840,00 €, ropa M y mocasines 37 disponibles. Logo e imágenes se adjuntan por CID y se han observado en el buzón.

- `smtp-outfit-bilingual.json`: cuatro envíos aceptados, dos pedidos aislados cancelados, stock repuesto y sin duplicados en replay.
- `smtp-outfit-en-mobile.json`: pareja inglesa posterior que verifica el ajuste de ancho móvil.
- `mailtrap/outfits/01` a `08`: cabeceras y detalles de compra/cancelación ES/EN. Las fotos son del catálogo propio.
- `mailtrap/outfits/09`: desbordamiento móvil inicial conservado como evidencia del hallazgo.
- `mailtrap/outfits/10` y `11`: fotografías y total en vista móvil corregida, sin barra horizontal observada.
- `mailtrap/01` a `04` y `smtp-real.json`: plantillas preliminares anteriores al rediseño; no usarlas como muestra final.

[Funcionamiento, configuración y límites](../../CORREOS-DEMO.md). Los primeros intentos incluyeron un ajuste de formato SMTP y rechazos por frecuencia 550; no fueron recorridos completos correctos. La prueba espaciada posterior sí completó los dos eventos. No se borraron manualmente muestras anteriores; Mailtrap aplica retención FIFO según el plan. No se han enviado mensajes a clientes reales.

191 pruebas automatizadas correctas (111 backend, 10 API client, 10 web, 60 móvil). Build web y exportaciones iOS/Android correctos tras añadir previsualización. La vista móvil de correo se ha comprobado mediante emulación de Mailtrap, no en clientes de correo físicos. Activación de los secretos SMTP en Vercel y revisión física de comunicaciones Expo Go pendientes.
