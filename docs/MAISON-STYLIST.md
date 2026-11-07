# Maison Stylist · prueba de IA activada

## Comportamiento de esta primera versión

Maison Stylist consulta las combinaciones existentes del catálogo y filtra por ocasión, color, presupuesto, exclusión de belleza y tallas opcionales. La IA puede ordenar y explicar hasta tres de un máximo de doce combinaciones válidas. Esta versión no crea conjuntos arbitrarios ni busca imágenes en Internet. Es un recomendador asistido por modelos, sin herramientas de escritura ni un bucle autónomo de agentes.

El orden solicitado por Araceli es **Gemini → Claude → OpenAI**. Solo un fallo técnico permite pasar al siguiente proveedor, con un máximo de un intento por proveedor. Una negativa de seguridad o una respuesta estructurada inválida terminan en modo editorial; no se envían a otro modelo para eludirlas. Si ningún proveedor responde, se muestran combinaciones editoriales con su etiqueta. No se presenta una respuesta simulada como IA real.

El backend conserva la autoridad: la respuesta solo admite identificadores candidatos y explicaciones; rechaza duplicados, identificadores desconocidos, precios o campos adicionales. Después de esperar al proveedor vuelve a consultar stock, variantes, tallas y presupuesto. La bolsa y el pedido solo cambian por acciones explícitas de la persona, fuera del asistente.

Las explicaciones se renderizan como texto, no HTML. El esquema y las reglas protegen los identificadores y los importes; no garantizan por sí solos la calidad estética o la exactitud de toda frase generada. La calidad de los modelos sigue pendiente de evaluación real.

## Activación separada del desarrollo

La integración queda **desactivada por defecto** (`STYLIST_ENABLED=0`). Preparar y probar con dobles no consume APIs. No hay nuevas dependencias de modelos: se utiliza HTTP desde Node con los contratos oficiales consultados el 7/11/2026.

Para el primer ensayo se recomienda configurar solo `STYLIST_PROVIDERS=gemini`. La cadena completa se activa después de configurar sus claves y revisar el consumo permitido. Una cuenta de chat o una suscripción no acredita acceso ni saldo de API.

1. Crear un proyecto y una clave exclusivos de Maison en [Google AI Studio](https://aistudio.google.com/api-keys), sin activar facturación para el ensayo gratuito.
2. Guardar la clave en el archivo privado `backend/.env` como `GEMINI_API_KEY`. No compartirla en chat, Git, capturas ni variables públicas. Revisar en AI Studio la cuota y el acceso al modelo antes del ensayo.
3. Indicar el modelo disponible en `GEMINI_MODEL`. La tabla de precios consultada incluye `gemini-3.1-flash-lite` en el nivel gratuito; esto no confirma su acceso o cuota en una cuenta concreta.
4. Mantener la integración desactivada hasta revisar la configuración y autorizar el ensayo real. Para el ensayo local: `STYLIST_PROVIDERS=gemini`, límite diario pequeño y `STYLIST_ENABLED=1` cuando corresponda.
5. Para Claude, crear una clave propia en [Claude Console](https://platform.claude.com/) y configurar `ANTHROPIC_API_KEY` y `ANTHROPIC_MODEL`. La opción económica consultada es `claude-haiku-5-5`; su acceso y facturación se verifican por separado.
6. Para OpenAI, crear una clave propia en un proyecto Maison de [OpenAI Platform](https://platform.openai.com/), con `OPENAI_API_KEY` y `OPENAI_MODEL`. La opción económica consultada es `gpt-5.6-luna`; requiere comprobar disponibilidad en esa cuenta.
7. Cuando se haya autorizado el uso de los tres: `STYLIST_PROVIDERS=gemini,anthropic,openai`. En Vercel, configurar únicamente en el proyecto **API de Maison**, nunca en Cars o en variables `VITE_*` / `EXPO_PUBLIC_*`. La activación pública necesita comprobación real y revisión del presupuesto, no solo un despliegue correcto.

## Límites y datos

- La asesoría IA activa requiere cuenta Maison. La selección editorial sigue siendo pública.
- Máximo de 8 solicitudes por minuto y dirección en cada instancia. El límite HTTP en memoria no es un contador distribuido.
- Máximo global configurable de 20 intentos de proveedor por día UTC por defecto, compartido y persistente en SQLite/MongoDB. Cada respaldo consume otro intento y los fallos no se devuelven al cupo. Es un límite de llamadas, **no un techo monetario exacto**: deben revisarse también los controles del proveedor.
- Hasta 8 segundos por proveedor, salida máxima configurable de 1.200 tokens por defecto y 64 KiB de respuesta HTTP. El texto de catálogo enviado está acotado a 24 KiB. Sin reintentos automáticos del SDK, herramientas externas o conversaciones almacenadas por la aplicación.
- Solo se envían preferencias de estilo y nombres/categorías de los candidatos. No se envían nombre de cuenta, correo, pedidos, contraseñas, tokens de sesión, imágenes personales ni claves ajenas. El campo libre pide expresamente no incluir datos personales.
- OpenAI y Gemini reciben `store: false`. Esto evita el almacenamiento de estado de conversación solicitado por esas APIs; no equivale a una garantía de retención cero ni cambia las condiciones del proveedor. El nivel gratuito de Gemini indica que sus datos pueden usarse para mejorar productos. Revisar las condiciones vigentes antes de aceptar datos de personas reales.
- El contador conserva día e intentos, sin texto de preferencias ni identificadores personales. No se registran respuestas brutas o claves en logs.

## Evidencias y pendientes

Las pruebas automatizadas utilizan datos ficticios y proveedores simulados. Después se completó un [ensayo real autorizado](evidencias/stylist-2026-11-07.md): una consulta por proveedor, las tres correctas, con catálogo sintético y sin activar la web. Cubren orden de respaldo, rechazo de selecciones inventadas, negativas, agotados durante la espera, tallas, presupuesto, privacidad del payload y cuota persistente. Las pruebas de MongoDB comprueban concurrencia sobre su contador real temporal. No acreditan acceso a los modelos, calidad de estilo, latencia real, coste observado ni aceptación real de cada esquema por el proveedor.

Pendientes antes de describirlo como asesor IA verificado en producción: variables privadas y activación pública autorizada, evaluación ES/EN más amplia, errores reales controlados, cuota/saldo, comprobación web y adaptación nativa si se decide incluirla. Claves propias y un ensayo real por proveedor ya se han comprobado. Documentar los resultados reales y actualizar memoria/slides después. Las lecciones de IA y evaluación se relacionarán con esas evidencias, sin atribuir prácticas no realizadas.

## Documentación oficial consultada

- [Gemini: salidas estructuradas](https://ai.google.dev/gemini-api/docs/structured-output) y [referencia de Interactions](https://ai.google.dev/api/interactions-api-v1). REST `v1beta/interactions`, revisión `2026-05-20`; salida por pasos `model_output`.
- [Gemini: precios](https://ai.google.dev/gemini-api/docs/pricing) y [facturación](https://ai.google.dev/gemini-api/docs/billing/).
- [Claude: salidas estructuradas](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) y [precios](https://platform.claude.com/docs/en/about-claude/pricing).
- [OpenAI: salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [Responses](https://developers.openai.com/api/reference/resources/responses/methods/create) y [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

## Relación con las clases

- [Conceptos básicos de prompting](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/prompting-y-multimodalidad/leccion/conceptos-basicos-de-prompting-como-escribir-prompts/): instrucciones estables, tarea acotada y datos de catálogo separados de las instrucciones.
- [LLM01 · Prompt Injection](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/owasp-genai-llm-top-10-2026-5/leccion/llm01-prompt-injection/): nombres y texto libre se consideran datos no confiables; la validación del servidor limita las acciones e identificadores posibles. Las pruebas no demuestran inmunidad universal a la inyección.
- [LLM02 · Sensitive Information Disclosure](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/owasp-genai-llm-top-10-2026-5/leccion/llm02-sensitive-information-disclosure/): payload mínimo y claves solo en backend.
- [LLM03 · Excessive Agency](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/owasp-genai-llm-top-10-2026-5/leccion/llm03-excessive-agency/): sugerencias sin herramientas de compra, cambios de bolsa ni acceso a pedidos.
- [Mapa de pruebas front/back](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/testing/leccion/setup-mapa-de-pruebas-front-vs-back/): contratos y reglas con pruebas automatizadas; interfaz y proveedores reales se verifican por separado. La evaluación estética con modelos reales está pendiente.

Enlaces procedentes de las notas del curso; su acceso actual en el campus no se ha revalidado en esta implementación.

## Acceso conversacional en web y app

El botón flotante Maison Stylist abre un chat: panel lateral en web y modal en la app. Se puede escribir el plan, estilo, presupuesto y tallas; si falta presupuesto, se pregunta antes de consultar el servicio. Las reglas compartidas reconocen restricciones numéricas habituales, conservan preferencias durante la conversación y muestran las aplicadas para poder corregirlas. No constituyen comprensión universal del lenguaje. El estilo libre se incluye como contexto para el modelo cuando la IA está activada.

Las respuestas muestran fotografías reales del catálogo, precios y enlaces a las fichas. El usuario elige allí las variantes y añade cada pieza a la bolsa. No se generan fotografías ni se ejecutan compras desde el chat. El formulario detallado sigue disponible en `/looks`. Cerrar el chat cancela la solicitud en curso, pero conserva mensajes, preferencias y borrador durante la sesión de navegación.

La revisión local en Safari confirmó petición de presupuesto, respuesta editorial con talla M y sin belleza, dos conjuntos dentro de 3.000 €, fotografías y navegación a la ficha de Enchanted. Esta comprobación no consumió servicios de IA. Las tres consultas reales previas verificaron proveedores individuales, no el nuevo chat completo contra IA en producción. La activación pública se realizó posteriormente con autorización expresa, como se detalla al final de este documento. Esta comprobación local anterior no acredita por sí sola el funcionamiento conversacional con IA en producción.


### Conversación y valoración del outfit
La interfaz utiliza burbujas de mensaje, respuestas alineadas a cada interlocutor y un campo de escritura fijo en web y app, con colores Maison. Tras las propuestas pregunta si gusta la elección y ofrece continuar con cambios. Las valoraciones breves positivas o negativas se responden localmente, sin consumir una consulta a proveedores; las nuevas preferencias siguen el recorrido de recomendación. Safari local confirmó la pregunta y la respuesta a «me gusta». No se ha verificado físicamente esta última revisión visual en la app.


En web, Intro envía y Mayús+Intro introduce un salto de línea; durante la composición de texto no se fuerza el envío. Hay un único ejemplo inicial. Las reglas reconocen presupuestos como «tengo 6000» y respuestas como «6000, talla S y nº 36»; el resumen muestra también el calzado aplicado. Los agradecimientos combinados, como «sí mucho muchas gracias», reciben una respuesta local sin volver a consultar el catálogo o los proveedores.


### Guardarraíles mínimos del asesor · 7 de noviembre de 2026

La política compartida limita la conversación a outfits y estilismo de Maison. Web y app redirigen consultas ajenas al ámbito; sexo, religión y política se incluyen entre los temas excluidos. Una ocasión como una boda en una iglesia sigue siendo válida cuando la consulta trata de ropa. Las reglas detectan expresiones comunes de cambio de instrucciones, revelación de secretos y manipulación de precios o stock. La API repite la comprobación antes de leer el catálogo, reservar cuota o llamar a un proveedor; no depende de que el cliente conserve sus controles. El mensaje actual y el contexto se comprueban por separado.

Las instrucciones del modelo refuerzan el ámbito y tratan los datos del catálogo como contenido no confiable. La salida se limita a identificadores permitidos y explicaciones: campos adicionales como precio no pasan el esquema. Si la explicación contiene temas prohibidos, intentos de instrucciones o afirmaciones monetarias detectadas, se descarta y vuelve al modo editorial sin consultar otro modelo. El total y las variantes se reconstruyen desde el catálogo del backend. El asesor no dispone de herramientas para modificar productos, precios, stock, roles ni pedidos. El checkout mantiene sus propias validaciones y permisos.

Estas reglas léxicas son una defensa mínima adicional, no un clasificador semántico completo ni una garantía frente a todos los ataques u ofuscaciones. No sustituyen autenticación, permisos ni validación de precios en el servidor. Las pruebas usan proveedores simulados y no acreditan moderación general de los tres modelos reales.


El asesor responde localmente a preguntas breves como «¿Eres un robot?» o «¿Quién eres?» con el guiño «Soy tu tAIlor», identificado como estilista personal virtual. La respuesta no consume IA ni cambia preferencias. La coincidencia exige una pregunta de identidad completa; texto adicional con nuevas instrucciones continúa por las comprobaciones de ámbito.


## Prueba pública activada · 7 de noviembre de 2026

Con autorización expresa de Araceli, las tres claves específicas de Maison y su configuración se guardaron como secretos solo en el entorno Production del proyecto `kelsets-maison-api` de Vercel. No se copiaron al frontend, al repositorio ni a informes. La API se redesplegó sobre `f1d0425`. El archivo local conserva el arranque desactivado por defecto.

Configuración de la prueba: Gemini → Claude → OpenAI, máximo global de **3 intentos por día UTC**, timeout de 10 segundos por proveedor y 512 tokens de salida como máximo por respuesta. Los intentos fallidos y los respaldos consumen esa misma cuota; no son tres conversaciones por usuario. Los agradecimientos, preguntas de identidad y bloqueos locales no usan modelos. No se compró saldo ni se activó facturación. Al agotarse la cuota, el servicio devuelve el modo editorial y lo identifica en la respuesta. El límite de intentos no equivale a un presupuesto monetario medido.

Se verificó por HTTPS `available: true`, la exigencia de cuenta y el orden de proveedores. Una petición sin sesión devolvió HTTP 401 antes de contactar con modelos. Estas verificaciones no consumieron intentos de proveedor: se reservaron para la prueba manual de Araceli. La activación no acredita todavía una conversación completa con cuenta en producción ni un fallback real.


## Acceso de visitantes y cierre automático de la prueba

La autora autorizó abrir también el asesor a personas sin cuenta. `STYLIST_REQUIRE_ACCOUNT=0` permite la recomendación sin sesión; el valor por defecto sigue siendo `1` para instalaciones nuevas. Web y app consultan `requiresAccount` antes de exigir acceso. La compra y las áreas privadas conservan sus permisos. El límite global sigue siendo tres intentos de proveedor por día UTC; no se ha aumentado. El limitador adicional por IP vive en cada instancia y no se presenta como una cuota distribuida por visitante.

`STYLIST_EXPIRES_AT=2026-12-31T23:00:00Z` cierra el acceso a modelos al terminar el 31 de diciembre de 2026 en Madrid. La disponibilidad se calcula en cada petición y antes de cada respaldo, sin depender de reiniciar la función. Tras el vencimiento se conserva el modo editorial sin llamadas a proveedores. Esta fecha limita el servicio de Maison; no modifica ni verifica la caducidad real de las claves en los proveedores.

Importes indicados por Araceli: Gemini gratuito, Claude 15 € y OpenAI 10 €. No se han aumentado saldos ni activado facturación. Esos importes no se han contrastado en sus paneles y la aplicación no lleva una contabilidad monetaria de esos presupuestos: su control comprobado es el número de intentos, la longitud de salida y el vencimiento. No se presentan avisos o presupuestos de terceros como bloqueos de gasto verificados.


Los saludos y despedidas breves se responden localmente con el tono de tAIlor; no consumen IA ni alteran filtros. Las valoraciones reconocen también «me ha encantado» y «me ha gustado». Si el mensaje añade una petición de ropa o nuevas restricciones, sigue el recorrido normal. Se reconocen tallas como «mi talla es la M» y calzado como «calzo un 38» o «nº de pie 40».


El saludo refleja la expresión recibida: hola, buenos días, buenas tardes o buenas noches, seguida de la presentación de tAIlor como estilista personal virtual. La despedida utiliza la ocasión y los nombres de los últimos looks mostrados; en una boda desea disfrutar de la celebración y en una entrevista desea suerte. No presupone una elección ni una compra y no toma un plan antiguo cuando la última recomendación corresponde a otro. Todo se resuelve localmente, sin llamadas de IA.
