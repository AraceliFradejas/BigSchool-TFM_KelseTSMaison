# Conversación generativa de tAIlor

## Cambio de enfoque

El chat anterior usaba reglas locales para pedir presupuesto, reconocer elecciones y enviar preferencias al selector de looks. La IA, cuando había cuota, ordenaba candidatos; no interpretaba la conversación completa. El modo editorial podía repetir propuestas ante una pregunta que no reconociera. La autora detectó esa limitación en conversaciones de cita, gala y zapatos.

Con IA habilitada, web y app envían directamente el mensaje a `POST /api/v1/stylist/chat`, antes de las reglas del modo editorial. El modelo recibe hasta ocho mensajes anteriores de 500 caracteres, preferencias estructuradas, identificadores públicos de los looks actuales y de las opciones mostradas/elegidas, y un catálogo resumido sin credenciales ni información de cuenta. El mensaje actual admite hasta 1.200 caracteres. El servidor no guarda conversaciones en su base de datos; la retención de cada proveedor sigue sus condiciones. El aviso del chat informa del envío de conversación y preferencias.

El modelo interpreta la intención y devuelve una estructura validada: aclarar, recomendar, completar con una pieza, confirmar una elección, responder sobre estilo, despedirse o redirigir fuera de ámbito. Normaliza presupuesto, ocasión, código de vestimenta, color y tallas. «Mmm, ¿diez mil?» llega al modelo tal cual, con la pregunta de presupuesto anterior. El contexto distingue una cita de la mera referencia temporal al fin de semana y conserva gala cuando se pregunta después por zapatos.

## Catálogo y límites siguen en el servidor

La respuesta del modelo no contiene precios operativos, reservas ni permisos. Solo puede referirse a identificadores conocidos. El backend vuelve a obtener catálogo, variantes y stock, comprueba talla y presupuesto y calcula los totales. Una confirmación no añade a la bolsa ni compra. Las recomendaciones de gala priorizan vestidos de evento, no looks de entrevista por tener más piezas de sastrería.

Los complementos se identifican por tipo: pantalones, zapatos, bolsos, partes de arriba, chaquetas, faldas, vestidos, joyas, belleza y accesorios. Las piezas previamente elegidas se representan por identificadores; el backend consulta sus valores actuales y conserva su coste al añadir otra pieza. No se aceptan precios desde el cliente. La selección reemplaza la pieza de la misma clase cuando corresponde; joyas, belleza y accesorios genéricos se añaden. Los importes mostrados no se convierten en cargos reales.

Si falta IA, caduca o se agota su cuota, el nuevo endpoint lo explica y no rellena la respuesta con tres looks editoriales como si hubiera entendido. Los filtros manuales y el recorrido editorial separado siguen disponibles. Los controles deterministas de temas prohibidos, errores de esquema y catálogo permanecen activos; no son una garantía semántica absoluta frente a todo ataque.

## Proveedores y cuota autorizada

La autora autorizó cien intentos globales de modelos al día UTC, separados de las cien acciones de voz, compartidos entre visitantes. Se conserva Gemini → Claude → OpenAI y el cierre al terminar el 31/12/2026 en Madrid. Cada intento, incluido fallo o respaldo, cuenta en la cuota persistente. No se ha comprado saldo ni activado facturación o recargas. El contador limita intentos, no euros ni los presupuestos de cuenta declarados por la autora.

El intérprete usa hasta 1.024 tokens de salida y un timeout por proveedor de hasta diez segundos. No utiliza herramientas externas, navegación, acceso a cuentas ni operaciones de compra. La forma JSON tiene campos obligatorios, valores nulos para datos no actualizados y ausencia de propiedades adicionales. El servidor valida de nuevo el resultado.

## Verificación

158 comprobaciones correctas: 93 backend, 10 cliente HTTP, 7 frontend y 48 móvil. Cuatro tests de conversación generativa simulada comprueban el presupuesto literal, la secuencia completa gala → zapatos → selección → despedida, cuota agotada sin repetir cards, referencias inventadas, ausencia de secretos y endpoint para visitantes. Build web, exportaciones iOS/Android y smoke local correctos. La prueba generativa real se registra después del despliegue, sin presentarla como prueba de micrófono o audio nativo.

Referencias oficiales usadas: [OpenAI: salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [Gemini: salida estructurada](https://ai.google.dev/gemini-api/docs/structured-output), [Claude: salida estructurada](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

En la primera revisión pública, la petición inicial recibió una aclaración natural sobre el plan, pero la respuesta a «Mmm, ¿diez mil?» terminó como IA no disponible. Antes de dar la prueba por válida se ajustó la separación entre intención y redacción: si el modelo repite un importe en su texto, se sustituye esa redacción por una frase del servidor, sin descartar el presupuesto interpretado ni permitir importes inventados. Se incorpora una regresión específica. Los errores conservan códigos de diagnóstico limitados a causas y campos de esquema, sin cuerpos de proveedor, datos de cuenta ni secretos. La repetición de la prueba real queda pendiente del ajuste desplegado.

Repetición real del presupuesto: HTTP 200, proveedor Gemini, `budgetCents: 1000000`. Esa ejecución también mostró que el modelo podía recomendar ante un plan todavía definido solo como fin de semana. Se añade una comprobación del servidor: con ocasión genérica/fin de semana y vestimenta no definida, se aclara la actividad antes de mostrar propuestas. Esa verificación no interpreta lenguaje mediante otra lista de frases: valida que el estado necesario esté completo. La prueba real completa sigue pendiente.

## Objetivo nuevo y referencias a «las dos»

Una prueba posterior de la autora ya acreditó respuestas de Gemini, pero el cambio de gala a un conjunto reutilizable para entrevista todavía retrocedía a los vestidos anteriores. Se retiró del endpoint generativo la reclasificación editorial por el código de vestimenta previo: la IA selecciona identificadores de looks y el servidor comprueba presupuesto, tallas, stock y color, sin sustituirlos silenciosamente por el ranking antiguo. Un cambio de ocasión permite actualizar la formalidad anterior.

Las propuestas de looks se devuelven como tarjetas con identificadores reales, incluso cuando el modelo las formula inicialmente como una respuesta verbal. No se propone un título de producto como si fuera el nombre de un look. El modelo recibe el coste mínimo actual de cada conjunto para elegir dentro del presupuesto, y el servidor vuelve a comprobar las variantes después de la respuesta. Ante «enséñame las dos», `referToCurrent` liga la petición a `currentLookIds`, mantiene las preferencias de ese objetivo y evita volver a listas antiguas. El servidor no muestra el texto que nombrase otras opciones distintas en una referencia de ese tipo.

161 comprobaciones correctas: 96 backend, 10 cliente HTTP, 7 frontend y 48 móvil. La regresión reproduce gala con 6.000 €, propuesta de Studio Interview y Midnight Presentation para entrevista y «enséñame las dos». Incluso simulando que el modelo vuelve a indicar los IDs de Enchanted y Bejeweled en una referencia a las actuales, el servidor conserva los dos trajes reales y sus importes. La repetición con proveedor real se registra al finalizar el despliegue.

## Comprobación real completada

En producción se han completado cinco turnos consecutivos de un escenario ficticio: cena elegante, detalle de formalidad, presupuesto 6.000 €, reutilización para entrevista y «enséñame las dos». Las cinco respuestas fueron HTTP 200 con `mode: ai` y proveedor Gemini. En la reutilización seleccionó Style y The Man, ambos con total de 438.000 céntimos. El quinto turno conservó exactamente esos IDs y la preferencia de entrevista/elegancia.

Se repitió además el cambio de objetivo partiendo de un contexto de prueba con Enchanted y Bejeweled, gala guardada y 6.000 €. Las dos respuestas reales de Gemini cambiaron a Style y The Man y los mantuvieron al mostrar las dos. El estado inicial de esa segunda comprobación es una fixture, no una respuesta generada adicional. Siete peticiones finales satisfactorias, sin voz, pedidos ni reservas. No se ha comprobado un coste monetario facturado. Las pruebas piloto previas con un fallo se conservan como tales; no se presentan como éxitos. [Respuestas y referencias reales](evidencias/stylist-2026-11-08/06-conversacion-generativa-real.json).

El contexto de opciones visibles también se conserva si entre medias hay una respuesta de estilo sin tarjetas; esa aclaración no borra los IDs para «enséñame las dos». La suite final pasa 162 comprobaciones (96 backend, 10 cliente, 7 frontend y 49 móvil), más build web, exportaciones iOS/Android y smoke local.

## Tallas, compra y cierre contextual

El caso comunicado por la autora mostraba un reinicio de recomendaciones al preguntar cómo comprar el conjunto elegido. Se añaden intenciones generativas `sizes` y `purchase`: la primera consulta variantes con stock de cada pieza, indica si la talla solicitada está disponible y conserva el identificador del conjunto aunque no encaje una talla. La segunda explica el recorrido ficha → variante → bolsa → acceso → pago DEMO sin añadir productos, crear pedidos ni cobrar. El prompt interpreta una talla mayor como un cambio de preferencia, manteniendo el calzado salvo petición explícita.

La selección viaja también como `selectedLookId` en respuestas sin tarjetas y se recupera en el siguiente turno. Se retira de web, app y lectura en voz la pregunta automática «¿Con cuál te ves más?» en modo generativo: el modelo puede formular una pregunta cuando procede, sin un cierre fijo añadido por la interfaz. Las regresiones locales comprueban tallas → M a L → compra conservando el mismo ID y la ausencia de la coletilla en voz. Build web y exportaciones iOS/Android correctos. Estas pruebas utilizan proveedor simulado; no acreditan por sí solas la interpretación de Gemini real.

La comprobación pública posterior completó tres turnos reales desde una fixture de los dos conjuntos ya mostrados: tallas de Studio Interview (Gemini), una talla mayor (Claude mediante respaldo) y cómo comprarlo (Claude mediante respaldo). Los tres conservaron `look-studio-interview`, sin nuevas tarjetas; la talla cambió de M a L y el calzado siguió en 38. El stock público permite M en las prendas de ese conjunto, pero no el 38 en sus mocasines; L tampoco estaba disponible en esas prendas. El chat lo indica sin sustituir el outfit. [Evidencia de los tres turnos](evidencias/stylist-2026-11-08/07-tallas-compra-real.json). No se crearon pedidos ni se añadieron piezas a la bolsa. Se añadió después, con prueba local, un aviso específico de tallas agotadas también en las instrucciones de compra. Suite completa: 164 pruebas (97 backend, 10 cliente HTTP, 7 frontend, 50 móvil), más build web, exportaciones nativas y smoke local.

## Confirmar talla después de elegir: corrección de la conversión implícita

La autora detectó otro caso real: funeral → presupuesto → Noir Premiere → «Me parece perfecto. ¿Te digo y te confirmo mi talla?». El servidor convertía `answer` en `recommend` al recibir cualquier `lookIds`, aunque estos solo aludieran al conjunto ya mostrado. Se elimina esa conversión: solo la acción generativa explícita `recommend` genera nuevas tarjetas. La regla anterior de reconvertir respuestas verbales queda sustituida por esta decisión; el prompt exige `recommend` cuando propone alternativas nuevas y `clarify` al solicitar datos pendientes. Pedir permiso para comunicar talla no es solicitar el inventario de tallas.

La regresión simula una respuesta normal con el ID de Noir Premiere y comprueba que conserva el mensaje para pedir talla/calzado, no devuelve tarjetas y mantiene la referencia en el siguiente turno. Cuando las propuestas concretas no superan filtros, la respuesta tampoco afirma que todo el catálogo carezca de opciones: ofrece buscar otras dentro del presupuesto. No se ha acreditado que el presupuesto inicial de 5.000 € del caso de la autora imposibilite todo el catálogo.
