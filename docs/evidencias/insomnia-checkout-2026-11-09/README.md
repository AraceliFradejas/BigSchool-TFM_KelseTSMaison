# Pago DEMO y estados · SQLite · 9/11/2026

Recorrido real desde **Insomnia 13.3.1**, proyecto Local Vault. SQLite aislado, archivo temporal `maison-insomnia-checkout-20261109.sqlite`, API `127.0.0.1:3179`. Cuentas y destinatario ficticios; no se carga `.env`, ni se conecta a Atlas, SMTP o proveedores de IA.

Se ejecutaron los **24 casos** de la [colección importable](../../api/Maison-Pago-DEMO-Insomnia.postman_collection.json). Las 24 peticiones se enviaron desde Insomnia. Se conservan 15 capturas; el stock inicial y el rechazo están documentados en el registro UI y el contraste SQLite, sin captura original conservada. Los casos con ID usan la ruta explícita del pedido, sin depender de variables de ruta vacías.

## Resultado contrastado

- Rechazo DEMO (409): cero pedidos y comunicaciones; stock 6.
- Total manipulado (409 `price_changed`): no se acepta el importe del cliente.
- Compra aceptada (201) por **1.850,00 €**, cargo real **0,00 €**. Pedido `c6473398-1734-4f1b-96b7-eb335ea7e5a0`.
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

- [03-sin-pedidos-tras-rechazo.jpg](03-sin-pedidos-tras-rechazo.jpg)
- [04-sin-correos-tras-rechazo.jpg](04-sin-correos-tras-rechazo.jpg)
- [05-total-manipulado.jpg](05-total-manipulado.jpg)
- [06-pago-aceptado.jpg](06-pago-aceptado.jpg)
- [07-pago-idempotente.jpg](07-pago-idempotente.jpg)
- [08-justificante-demo.jpg](08-justificante-demo.jpg)
- [09-correo-unico.jpg](09-correo-unico.jpg)
- [10-salto-estado-rechazado.jpg](10-salto-estado-rechazado.jpg)
- [11-pedido-confirmado.jpg](11-pedido-confirmado.jpg)
- [12-pedido-enviado-simulado.jpg](12-pedido-enviado-simulado.jpg)
- [13-cancelacion-no-permitida.jpg](13-cancelacion-no-permitida.jpg)
- [14-pedido-entregado.jpg](14-pedido-entregado.jpg)
- [15-historico-con-justificante.jpg](15-historico-con-justificante.jpg)
- [16-comunicaciones-finales.jpg](16-comunicaciones-finales.jpg)
- [17-stock-final.jpg](17-stock-final.jpg)

`manifest.json` conserva tamaño y SHA-256. Capturas de escritorio de Insomnia; no se simulan pantallas de base de datos. Las [capturas de Atlas](../atlas-2026-11-09/README.md) son una comprobación independiente de solo lectura, sin estos pedidos locales.
