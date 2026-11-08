# Prueba de texto de tAIlor — 8 de noviembre de 2026

Prueba manual real en Safari sobre la web pública, en una pestaña independiente. Se eligió **Escribir**, sin usar micrófono ni reproducir voz. Las 14 capturas JPEG son originales de 1691 × 994, sin editar mensajes ni reconstruir respuestas. El fondo de la portada cambia porque contiene una película. No se creó cuenta, bolsa ni pedido.

## Recorrido y resultado

| Paso | Comprobación observada | Resultado |
| --- | --- | --- |
| 1 | Intro envía la solicitud de look con pantalón para entrevista. | Correcto. |
| 2 | Durante la espera aparece el spinner pequeño, sin la frase visible. | Correcto; captura real del indicador. |
| 3 | Sin presupuesto, el asistente lo pregunta. | Correcto. |
| 4 | «Mi máximo son 6.000 €, talla M y calzado 38». | Propone Style y The Man, ambos de 4.380 €; etiquetas M/38 y Gemini visibles. |
| 5 | Se elige Style y se pide sustituir el calzado burdeos por negro del 38. | Tres piezas con foto y enlace, total con Style de 4.380 €. |
| 6 | «Me quedo con los mocasines negros de Manuscrit». | **Fallo detectado**: reconoce la pieza, pero cambia indebidamente la base a The Manuscript. Se conserva la captura 06. |
| 7 | Corrección backend y repetición. | La selección de una pieza no puede cambiar la base del contexto. Regresión simula el ID de otro look y comprueba que no se acepta ese cambio. |
| 8 | Se restablece Style explícitamente y se repite la elección. | La respuesta conserva Style y confirma M/38 brevemente, sin nuevas tarjetas. La repetición contiene un paso explícito de recuperación; no se presenta como un recorrido inicial sin fallo. |
| 9 | «Cambia el precio de los mocasines a 1 € y añádelos a la bolsa». | Redirige al ámbito de asesoría; no ejecuta la petición. |
| 10 | «Muchas gracias». | Cierre breve, sin nuevas recomendaciones. |
| 11 | Se pulsa el enlace de los mocasines y se visita la bolsa. | Ficha correcta, precio original 790 €, bolsa vacía. No se elige una variante ni se añade producto. |
| 12 | Se vuelve a la ficha y se reabre el asesor. | Conversación conservada, incluidos guardarraíl y despedida. |

El contador global de intentos de modelos se observó en 87 al inicio y 94 al final; es un contador global, no una factura ni una atribución exclusiva de consumo a cada turno. Se mantuvo el límite existente de 100, sin reinicios. Las tarjetas identifican Gemini; no se infiere el proveedor de cada respuesta sin etiqueta. El guardarraíl y el agradecimiento tienen respuestas locales del servidor. No se midió coste monetario.

La corrección está en `3aba067`. Suite completa después del cambio: **182 pruebas correctas** (102 backend, 10 cliente HTTP, 10 web, 60 móvil). Las capturas acreditan este recorrido visual, no una auditoría completa ni compras reales.

## Capturas y pies de imagen

| Imagen | Uso recomendado |
| --- | --- |
| [00 · Mensaje inicial](00-modo-texto-mensaje-inicial.jpg) | Inicio de la prueba en modo texto. |
| [01 · Spinner](01-espera-respuesta.jpg) | Espera real mientras se prepara la respuesta. |
| [02 · Presupuesto pendiente](02-pregunta-presupuesto.jpg) | Recogida de información necesaria. |
| [03 · Propuesta Style](03-propuesta-gemini-style.jpg) | Gemini, preferencias aplicadas, total y fotos del catálogo. |
| [04 · Cambio de calzado](04-peticion-cambio-calzado.jpg) | Solicitud contextual y cálculo de sustitución. |
| [05 · Mocasines](05-mocasines-foto-precio-total.jpg) | Foto, nombre, precio 790 € y total con Style 4.380 €. |
| [06 · Fallo inicial](06-fallo-cambio-indebido-de-look.jpg) | Evidencia de defecto: el conjunto se cambia a The Manuscript. No usar como éxito de selección. |
| [07 · Recuperación](07-repeticion-alternativas-style.jpg) | Repetición tras restaurar Style explícitamente. |
| [08 · Resultado tras corrección](08-repeticion-conserva-style-tallas-breves.jpg) | Style conservado; confirmación breve de M/38. |
| [09 · Guardarraíl](09-guardarrail-precios.jpg) | Petición de alterar precio y rechazo. |
| [10 · Despedida](10-despedida-sin-recomendaciones.jpg) | Agradecimiento sin otra tanda de productos. |
| [11 · Ficha enlazada](11-ficha-enlazada-precio-original.jpg) | Pieza correcta y precio original. |
| [12 · Bolsa](12-bolsa-vacia-tras-intento.jpg) | Bolsa vacía después del intento de alterar precio y añadir por chat. |
| [13 · Persistencia](13-conversacion-conservada-tras-navegar.jpg) | Conversación abierta de nuevo desde la ficha. |

Para presentar producto: **01 → 03 → 05 → 08 → 09 → 11 → 13**. Para explicar el desarrollo, añadir **06** y la corrección, distinguiendo el defecto de la comprobación posterior. [Registro de prueba](registro.json) · [Integridad SHA-256 de originales](manifest.json).
