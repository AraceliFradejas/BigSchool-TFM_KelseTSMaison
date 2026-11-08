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
