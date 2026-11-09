# Pago DEMO y estados · MongoDB · 9/11/2026

Recorrido real desde **Insomnia 13.3.1**, proyecto Local Vault. MongoDB 8.0.16 temporal, replica set de un nodo, base `maison_insomnia_demo`, API `127.0.0.1:3181`. Cuentas y destinatario ficticios; no se carga `.env`, ni se conecta a Atlas, SMTP o proveedores de IA.

Se ejecutaron los **24 casos** de la [colección importable](../../api/Maison-Pago-DEMO-Insomnia.postman_collection.json). Se conserva un primer P11 que devolvió la lista porque su URL acababa en `/orders/`; después se corrigió la ruta con el ID explícito y se repitió con respuesta de detalle. El registro contiene 25 respuestas para 24 casos. Antes de este registro se ejecutaron las primeras peticiones de lectura/rechazo y la captura se interrumpió por timeout de la herramienta; no había ningún pedido creado. Se repitieron esas peticiones y se conserva su resultado completo en esta ronda.

## Resultado contrastado

- Rechazo DEMO (409): cero pedidos y comunicaciones; stock 6.
- Total manipulado (409 `price_changed`): no se acepta el importe del cliente.
- Compra aceptada (201) por **1.850,00 €**, cargo real **0,00 €**. Pedido `b9214811-b0af-4a86-9a96-b3409bae2309`.
- Reintento idéntico (200): mismo pedido/justificante, una sola comunicación y stock 5; lectura directa de la base confirma que no hay duplicado.
- Salto pendiente → entregado (409). Confirmar → enviado → entregado (200); son estados simulados.
- Cancelar tras envío (409): se respeta la política de estados.
- Final: un pedido entregado, cuatro comunicaciones, cuatro registros de correo pendientes y stock 5. SMTP está desactivado; **pendiente no significa recibido en Mailtrap**. Este pedido de prueba no se cancela ni repone tras entregarlo.

Los JSON de contraste proceden de lecturas directas de la base local en tres momentos; sus aserciones pasaron. `registro-ui.json` guarda el texto accesible de la respuesta visible, no una exportación HTTP sin transformar. La columna Tests 0/0 de Insomnia indica que esta ronda es manual; no se presenta como ejecución de scripts de test de Insomnia.

## Casos y códigos observados

| Caso | HTTP |
| --- | --- |
| P01 · Acceder cliente | 200 OK |
| P02 · Stock inicial | 200 OK |
| P03 · Comunicaciones iniciales | 200 OK |
| P04 · Pago DEMO rechazado | 409 Conflict |
| P05 · Pedidos tras rechazo | 200 OK |
| P06 · Correos tras rechazo | 200 OK |
| P07 · Stock tras rechazo | 200 OK |
| P08 · Total manipulado | 409 Conflict |
| P09 · Pago DEMO aceptado | 201 Created |
| P10 · Repetir pago aceptado | 200 OK |
| P11 · Pedido con justificante | 200 OK |
| P12 · Correo único de compra | 200 OK |
| P11 · Pedido con justificante | 200 OK |
| P13 · Cerrar cliente | 200 OK |
| P14 · Acceder Team | 200 OK |
| P15 · Saltar a entregado | 409 Conflict |
| P16 · Confirmar pedido | 200 OK |
| P17 · Marcar enviado simulado | 200 OK |
| P18 · Cancelar tras envío | 409 Conflict |
| P19 · Marcar entregado simulado | 200 OK |
| P20 · Cerrar Team | 200 OK |
| P21 · Volver al comprador | 200 OK |
| P22 · Pedido entregado y justificante | 200 OK |
| P23 · Cuatro comunicaciones finales | 200 OK |
| P24 · Stock final | 200 OK |

## Capturas originales

- [01-stock-inicial.jpg](01-stock-inicial.jpg)
- [02-pago-rechazado.jpg](02-pago-rechazado.jpg)
- [03-sin-pedidos.jpg](03-sin-pedidos.jpg)
- [04-total-manipulado.jpg](04-total-manipulado.jpg)
- [05-pago-aceptado.jpg](05-pago-aceptado.jpg)
- [06-pago-idempotente.jpg](06-pago-idempotente.jpg)
- [07-justificante.jpg](07-justificante.jpg)
- [08-correo-unico.jpg](08-correo-unico.jpg)
- [09-salto-estado-rechazado.jpg](09-salto-estado-rechazado.jpg)
- [10-confirmado.jpg](10-confirmado.jpg)
- [11-enviado-simulado.jpg](11-enviado-simulado.jpg)
- [12-cancelacion-no-permitida.jpg](12-cancelacion-no-permitida.jpg)
- [13-entregado-simulado.jpg](13-entregado-simulado.jpg)
- [14-historico-justificante.jpg](14-historico-justificante.jpg)
- [15-cuatro-comunicaciones.jpg](15-cuatro-comunicaciones.jpg)
- [16-stock-final.jpg](16-stock-final.jpg)

`manifest.json` conserva tamaño y SHA-256. Capturas de escritorio de Insomnia; no se simulan pantallas de base de datos. Las [capturas de Atlas](../atlas-2026-11-09/README.md) son una comprobación independiente de solo lectura, sin estos pedidos locales.
