# Guion de presentación de KelseTS Maison

Borrador de contenido del 7 de noviembre de 2026. Presentación PDF disponible en [output/pdf](../output/pdf/KelseTS-Maison-Presentacion-TFM.pdf); este guion conserva las notas para la narración. Antes de grabar o presentar hay que contrastar el alcance con la versión publicada y actualizar los resultados físicos. Duración orientativa: 8–10 minutos, más demostración si el formato de entrega lo permite.

## 1 · KelseTS Maison

En pantalla: nombre, logo, «Tu estilo cuenta una historia», autora y TFM BigSchool. Elegir una imagen propia ya acreditada en [Recursos](RECURSOS.md).

Qué explicar: la continuidad de Universo KelseTS, desde una landing de moda y Cars hacia una boutique con reglas de catálogo y pedidos. La motivación personal está en combinar moda, música e historias mediante un recorrido funcional.

No atribuir ventas, clientes o resultados comerciales a una boutique ficticia.

## 2 · De una pieza a una selección coherente

En pantalla: descubrir → elegir variante → combinar → confirmar una simulación.

Qué explicar: el público busca una selección cuidada por ocasión, estilo y presupuesto. Maison organiza piezas, variantes y combinaciones editoriales; el recorrido termina en un pedido de demostración claro y recuperable.

Base: [memoria](../MEMORIA.md), [criterios de aceptación](REVISION-Y-CIERRE.md). No presentar una necesidad asumida como resultado de entrevistas o investigación de usuarios que no se hayan realizado.

## 3 · Recorrido de producto

En pantalla: portada, ficha y un look, con pocas capturas legibles de las [evidencias](evidencias/produccion-2026-10-18/README.md).

Qué demostrar: búsqueda o filtro → producto → variante disponible → bolsa. Mostrar también una talla agotada y el cambio ES/EN. Las capturas históricas deben conservar su fecha; la demostración en vivo corresponde a la versión que se identifique al presentar.

Los nombres musicales forman parte de la identidad del catálogo, con el tipo de pieza visible. Los productos, precios y operaciones son ficticios.

## 4 · Una API para web y app

En pantalla: diagrama de [Arquitectura](ARQUITECTURA.md): React / React Native → cliente y contratos compartidos → Express → MongoDB; imágenes gestionadas en Cloudinary. SQLite es una alternativa local independiente.

Qué explicar: los clientes no acceden a la base ni conocen las claves. El backend valida permisos, cantidades, precios y existencias. Las bolsas web y móvil son independientes; compartir contratos y reglas no implica sincronizarlas automáticamente.

Decisión defendible: se conservan tecnologías y responsabilidades concretas; no se añaden microservicios o agentes sin una necesidad medida.

## 5 · Qué ocurre al confirmar

En pantalla: secuencia reducida del checkout: sesión y esquema → intento por cuenta → stock condicional → copia de líneas y cálculo → pedido y comunicación en transacción.

Qué explicar con un ejemplo: si se pierde una respuesta y se reintenta con la misma petición, debe devolverse el mismo pedido. Si falla una pieza, se revierte el conjunto. El precio viene del servidor, y cambiar el catálogo no cambia el histórico del pedido.

La confirmación conserva justificante DEMO y cargo real cero. No mostrar datos bancarios ni insinuar integración con un proveedor de pagos.

## 6 · Calidad: un fallo y su corrección

En pantalla: cookie malformada → prueba que falla → validación del token → prueba correcta. Como segundo ejemplo breve: respuesta JSON incompleta → error controlado del cliente compartido.

Qué explicar: primero se reprodujo el comportamiento, después se corrigió y se ejecutó la regresión. El resultado actual es de **111 comprobaciones**, con su desglose y límites en [Validación](VALIDACION.md). No confundir cantidad de pruebas con porcentaje de cobertura o ausencia de fallos.

Referencia académica: [TDD con IA](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/testing/leccion/tdd-con-ia/) y [mapa de pruebas](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/testing/leccion/setup-mapa-de-pruebas-front-vs-back/).

## 7 · Refactorización con un motivo concreto

En pantalla: dos ejemplos antes/después: MongoDB deja de importar rutas para obtener textos de estado; web y móvil comparten la fusión de bolsas.

Qué explicar: separar una política del pedido de HTTP/persistencia y evitar que una misma regla de cantidades diverja entre plataformas. Las transacciones permanecen en cada adaptador. No describir el cambio como una reescritura completa a arquitectura limpia.

Referencia: [SRP/OCP, solución, 01:45–14:30](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/buenas-practicas-y-principios-de-diseno/leccion/ejercicio-srp-ocp-solucion-5/) y [DIP, solución](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/buenas-practicas-y-principios-de-diseno/leccion/ejercicio-dip-solucion-5/).

## 8 · App y compatibilidad real

En pantalla: una captura física real cuando esté disponible, identificada por dispositivo, fecha y versión. Mientras no exista, no sustituirla por una captura web presentada como nativa.

Qué explicar: Expo/React Native comparte la API, no usa WebView. El 7/11 se detectó incompatibilidad SDK 57/Expo Go 58, se actualizó y se resolvieron duplicados de React/React Native. Expo Doctor pasa 20/20 y las exportaciones iOS/Android son correctas. Araceli confirma apertura y catálogo en iPhone.

Actualizar aquí el registro de acceso, pedido, rechazo, reapertura, iPad y Android **solo después de comprobarlos**. Metro por LAN requiere el Mac y no es distribución permanente para un evaluador.

## 9 · Uso de IA y supervisión

En pantalla: problema → propuesta asistida → revisión → prueba → cambio aceptado o descartado.

Casos reales de esta revisión: diagnóstico del tratamiento de cookies, diseño de pruebas de regresión, extracción de políticas compartidas y contraste entre documentos y código. Explicar herramientas realmente utilizadas y cómo se detectó que una propuesta o una suite no bastaban para acreditar una propiedad.

Separar dos cosas: IA utilizada en el desarrollo y un modelo generativo integrado en el producto. El selector actual de looks es editorial; el asesor generativo continúa pendiente. Las imágenes y recursos generados se describen y acreditan en [Recursos](RECURSOS.md).

No inventar prompts históricos, horas ahorradas, porcentajes de productividad o resultados de un asesor todavía no implementado.

## 10 · Límites, aprendizaje y acceso

En pantalla: enlaces al repositorio y web, tres aprendizajes y límites vigentes de la versión elegida.

Aprendizajes que se pueden explicar con código: autoridad del servidor sobre precio/stock, coherencia transaccional frente a reintentos y separación entre implementación, compilación y verificación real.

Actualizar los pendientes reales antes de presentar: restauración en proveedores, persistencia específica de pedido/imagen tras redeploy, accesibilidad completa, distribución móvil y asesor generativo. No esconder un pendiente detrás de una captura o del 100 % del campus.

Cerrar con la relación entre identidad personal y decisiones técnicas, manteniendo los enlaces de [README](../README.md). La entrega manual la realiza Araceli.

## Ensayo de la demostración

1. Abrir la versión identificada y confirmar que los enlaces funcionan.
2. Mostrar una búsqueda, variante agotada y variante disponible.
3. Añadir una unidad a la bolsa, cambiar idioma y conservar la selección.
4. Acceder con una cuenta ficticia preparada para evaluación; no mostrar claves de infraestructura.
5. Mostrar primero rechazo DEMO y después, si se incluye en el ensayo autorizado, confirmación con cargo cero e historial.
6. Desde Team, mostrar una transición válida o la cancelación y reposición de stock. No editar el catálogo original para simular una prueba.
7. Tener capturas de respaldo con su fecha. Si falla el directo, explicar el fallo sin presentar el respaldo como una ejecución nueva.

Antes de la entrega hay que convertir este contenido en slides, revisarlas visualmente, ensayar la narración propia y confirmar los requisitos de la edición. El guion no acredita ninguna de esas tareas por el hecho de estar escrito.
