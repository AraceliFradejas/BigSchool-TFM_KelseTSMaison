# Validación de la primera versión de Maison

Comprobaciones ejecutadas el **11 de octubre de 2026**, en macOS ARM64 con **Node.js 22.23.2** y **npm 10.9.8**. El resultado corresponde a la versión local; no acredita un despliegue público ni pruebas en dispositivos reales.

## Pruebas automatizadas

`npm test` terminó correctamente: **20 pruebas de backend y 4 de cliente HTTP**, sin fallos ni casos omitidos.

| Área              | Qué se comprueba                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Catálogo          | Quince productos, paginación, búsqueda, variantes ES/EN y tallas agotadas                                      |
| Registro y sesión | Rechazo de rol inyectado, ausencia de hashes en respuestas y revocación al cerrar sesión                       |
| Origen            | Cabecera de escritura obligatoria y rechazo de origen ajeno                                                    |
| Permisos          | Un cliente no puede gestionar productos, stock ni imágenes                                                     |
| Precio y copia    | Rechazo de precio aportado por el cliente; total del servidor y conservación del pedido al editar un producto  |
| Idempotencia      | Repetición idéntica sin consumir stock ni duplicar mensajes; conflicto si cambian las líneas                   |
| Transacción       | Un fallo en una pieza revierte el descuento de las anteriores                                                  |
| Stock             | Dos solicitudes compiten por la última unidad: solo una crea el pedido                                         |
| Privacidad        | Otra cuenta no puede consultar pedido, comunicaciones ni favoritos del cliente                                 |
| Estados           | Cancelación recupera unidades una sola vez; no se permite saltar confirmación ni cancelar después del envío    |
| Team              | Rechazo de edición antigua, protección de variantes de pedidos abiertos y ocultación de productos archivados   |
| Imágenes          | Rechazo de rutas inexistentes, SVG y cabeceras falsificadas; conversión de una imagen válida a WebP            |
| Persistencia      | Las existencias editadas se conservan al cerrar y volver a abrir SQLite                                        |
| Combinaciones     | Presupuesto, ocasión, paleta, exclusión de belleza y agotados, en modo editorial                               |
| Semilla           | Una repetición no reinicia stock ni sobrescribe el catálogo existente                                          |
| Transporte        | Cookies, cancelación, cabecera de escritura, error por código, rechazo de HTML y multipart sin boundary manual |

Las pruebas usan bases temporales y cuentas ficticias, sin conectar con servicios de Cars. La prueba de competencia utiliza dos solicitudes HTTP sobre una instancia; no es una prueba de carga distribuida.

## Build y datos

- `npm run build`: completado sin errores. La última compilación genera un bundle JS de aproximadamente 321 kB, unos 101 kB comprimidos con gzip, más CSS y fuentes locales.
- Instalación desde una copia limpia del commit: `npm ci --offline` y `npm run build` completados correctamente utilizando la caché npm. No acredita una descarga nueva desde el registro.
- `npm run seed`: segunda ejecución con cero productos nuevos; no reinicia la base existente.
- Catálogo inicial comprobado: quince productos, treinta y dos variantes e imagen existente para cada producto.
- Diccionario de interfaz: las claves ES/EN coinciden. Esto no sustituye una revisión lingüística completa de todas las pantallas.
- Express sirve `/catalog`, su JavaScript, CSS y una ilustración de producto con respuesta 200 desde el build, además del endpoint de salud.

## Auditoría de dependencias

`npm audit --omit=dev --json` terminó con **cero vulnerabilidades conocidas** en las dependencias de producción en la consulta realizada. Es el resultado del registro npm en esa fecha; no garantiza ausencia de defectos ni cubre las dependencias de desarrollo.

## GitHub Actions

El workflow de pruebas y build ha terminado correctamente en GitHub para el commit `ebf349b9ca67ffe4a7ab03fcf29782dc2e90048c`. Ejecuta instalación limpia, pruebas y compilación en un runner Ubuntu con Node 22. [Resultado de la ejecución](https://github.com/AraceliFradejas/BigSchool-TFM_KelseTSMaison/actions/runs/38147827899).

## Recorrido en Safari

Se ha comprobado el siguiente recorrido en la aplicación local:

1. Portada y apertura de la ficha Satin Story.
2. Selección de talla L agotada: botón de añadir deshabilitado.
3. Selección de talla M disponible y adición a la bolsa por 79 €.
4. Cambio a inglés conservando bolsa, cantidad, variante y precio.
5. Acceso desde la bolsa con una cuenta ficticia local; conservación de la selección del visitante.
6. Creación del pedido de demostración y vaciado de la bolsa.
7. Historial, detalle y comunicación de creación visibles en la cuenta.
8. Recarga tras la concesión local del rol Team; gestión del pedido y paso de pendiente a confirmado.

Las capturas están en [Evidencias](evidencias/README.md). Se revisaron visualmente las dos imágenes guardadas. La creación de la cuenta de prueba se realizó a través de la API; el formulario de registro todavía requiere una comprobación manual completa.

## Límites y pruebas pendientes

- Responsive en iPhone, iPad y Android; navegación móvil y teclado.
- Lector de pantalla y revisión completa de contraste y foco.
- Formulario de alta, creación de producto y subida de imagen desde la interfaz en ambos idiomas. Sus reglas de API sí tienen pruebas.
- Despliegue HTTPS, cookies Secure, proxy, persistencia y restauración de una copia en el proveedor elegido.
- Ejecución del Dockerfile.
- Carga, procesos múltiples y estabilidad a largo plazo.
- IA y app nativa: no están implementadas y no hay pruebas de funcionamiento de esas ampliaciones.

`node:sqlite` emite el aviso experimental previsto en Node 22. Las pruebas HTTP requieren abrir puertos locales; en un entorno aislado que prohíba ese acceso deben ejecutarse con los permisos de red local correspondientes.

## Actualización de imágenes de catálogo

Se han revisado visualmente las quince representaciones de producto y las tres escenas editoriales. Perfume, sombra, colorete, labial y bálsamo incorporan la marca Maison. Los dieciocho WebP suman aproximadamente 1,5 MB. Portada comprobada en Safari. `npm run build` y las 25 pruebas de backend y transporte pasan. La migración local actualizó quince imágenes originales; su prueba verifica que conserva imágenes personalizadas y stock y que repetirla no produce cambios. Los SVG se mantienen para las referencias de pedidos anteriores.

## Ampliación swiftie y selección de lujo

Catálogo local y respuestas HTTP comprobados: 51 artículos, 140 variantes, 15 colecciones y 21 looks con referencias válidas. Se han revisado las 36 nuevas imágenes individualmente en hojas de revisión. Las 102 imágenes WebP de producto, completas y pequeñas, responden HTTP 200 con el tipo de contenido correcto. La selección de lujo filtra 24 artículos. Los filtros de contexto se han comprobado en Safari; [evidencia de looks de televisión](evidencias/maison-looks-tv.png).

`npm run build` y las 26 pruebas pasan. La ampliación comprueba paginación, filtro de lujo y sugerencias de eventos y televisión con presupuesto y stock; mantiene las comprobaciones previas de permisos, pedidos y cancelaciones. Repetir el seed inserta cero registros y conserva el stock M del vestido Satin Story en 7 unidades tras el pedido local anterior. Las imágenes usan versiones de 600 píxeles y su tamaño completo mediante `srcset` y `sizes`. No se ha comprobado esta ampliación en un teléfono físico.

## Ajuste de precios de lujo — 11 de octubre de 2026

- `npm test`: 27 pruebas superadas (23 backend y 4 cliente API).
- `npm run build`: compilación de producción correcta.
- Migración aplicada a la base local: 51 productos y 140 variantes actualizados.
- Comparación antes/después: conservados el pedido existente completo (líneas e importe) y las existencias de las 140 variantes. Segunda ejecución: cero cambios.
- Prueba automatizada adicional: conserva precios personalizados por Team, stock consumido e importes históricos; incrementa la revisión y comprueba idempotencia.

## Portada de cuatro looks — 11 de octubre de 2026

- Cuatro fotografías originales de modelos adultas, optimizadas a 720 píxeles de ancho en WebP y revisadas visualmente.
- Revisión en Safari de la portada en castellano e inglés: cuatro columnas en la ventana de escritorio, modelos completas y textos legibles.
- Enlace «Explorar el look» de Maison Departure: abre el catálogo filtrado por Travel Maison y muestra sus cuatro artículos.
- `npm run build`: compilación de producción correcta; `git diff --check`: sin errores de espacios.
- Captura de la portada: [cuatro modelos](evidencias/maison-hero-modelos.png).
- Cuatro vídeos reales de Runway incorporados en MP4 H.264, sin audio, de cinco segundos y con carga al activarlos.
- Safari de escritorio: activación individual de Emerald Evening, Studio Ivory, City Pages y Maison Departure; al cambiar de look, el anterior queda pausado.
- Se mantiene pendiente la comprobación en un móvil real.

## Campaña «Todas tus eras» — 11 de octubre de 2026

- Cuatro nuevos clips de diez segundos, con escenarios y movimientos distintos; revisión visual de cinco fotogramas repartidos por cada secuencia.
- Primer fotograma de cada vídeo utilizado como cartel WebP; archivos MP4 optimizados con FFmpeg y carteles con Sharp.
- Safari: cuatro escenas visibles con nombres y textos en castellano; activación individual de los cuatro controles y pausa del anterior al cambiar.
- Captura: [campaña de eras](evidencias/maison-hero-eras.png).
- Compilación de producción y comprobación de espacios correctas. Continúa pendiente la comprobación en un móvil real.

## Tráiler panorámico — 11 de octubre de 2026

- Vídeo final: 1280 × 720, quince segundos, cuatro escenas estacionales, sin audio; revisión de ocho fotogramas distribuidos por la secuencia.
- Safari de escritorio: película en el hero a todo el ancho, título superpuesto legible y botones de reproducción y pausa comprobados.
- [Captura del hero](evidencias/maison-film-hero.png).
- Ensamblador: prueba real con dos clips, fundido de medio segundo y salida H.264 1280 × 720; segunda prueba con audio sintético temporal, salida AAC. Los archivos de prueba no se publican.
- En esta primera revisión se cerró un tráiler; la ampliación posterior se recoge debajo.

## Película final con música · 11 de octubre de 2026

- Duración final: 82,958333 segundos, catorce looks, formato 16:9 y 24 fps, comprobados con FFprobe. Máster privado 3840×2160; copias web H.264 1920×1080 y 2560×1440 con audio AAC. Ambas copias se decodifican completas con FFmpeg sin errores.
- Música «Runway Pulse», creada en Suno y aportada por Araceli; duración original 192,8535 segundos. Se utiliza su inicio, ganancia 0,7 y fundidos de dos segundos.
- Londres, esmoquin y burdeos se sustituyen por nuevas tomas completas de cinco segundos, revisadas y aceptadas por Araceli en el montaje previo de un minuto. El lago conserva la nueva toma con una sola protagonista y un bolso.
- Los cuatro looks de cierre se revisan mediante fotogramas repartidos por cada clip, antes y después de la mejora 4K. Revisión adicional del montaje completo cada dos segundos para comprobar secuencia, continuidad y transiciones. Esta revisión por muestreo no garantiza la ausencia de todos los artefactos generativos.
- Safari reproduce directamente la copia final de 1440p, con duración nativa mostrada como un minuto y veintidós segundos y sonido. Controles de música y pausa comprobados en la portada, en castellano e inglés.
- Mejora del cierre: 37 créditos; generaciones: 100. Total 137 dentro del máximo autorizado de 140; saldo 7.013. El reescalado anterior de pasarela consumió otros 47 créditos, registrado por separado.
- `npm run build`: compilación correcta. `git diff --check`: sin errores de espacios. Las comprobaciones en un móvil físico siguen pendientes.

## Revisión responsive del cierre · 11 de octubre de 2026

- Chrome con emulación responsive de 390 píxeles, iPhone SE 375×667 e iPad Mini 768×1024. Encuadre panorámico en tablet y vertical a toda la altura disponible bajo la cabecera en móvil; textos y navegación revisados visualmente. La emulación no sustituye una prueba en teléfono físico.
- Corregida la selección de la fuente de vídeo: una URL explícita que responde a cambios de anchura, versión vertical para móvil y panorámica 1080p o 1440p para pantallas mayores. Comprobada la reproducción y activación de música en móvil.
- Tras la revisión de Araceli, el hero móvil ocupa la altura disponible de pantalla. Usa un reencuadre vertical por escena, con música y pausa superpuestas y título grande; castellano e inglés revisados. Menú hamburguesa hasta 1000 píxeles; incluye Mi cuenta y mantiene idioma, favoritos y bolsa en la cabecera.
- Comprobadas apertura y cierre del menú, cierre con Escape en tablet y cierre al navegar a Moda. Referencia de interacción consultada en Cars, sin modificar ese proyecto.
- Evidencias: [móvil](evidencias/maison-film-mobile.png), [menú](evidencias/maison-menu-mobile.png) y [tablet](evidencias/maison-film-tablet.png).

## Pasarela ilustrada en revisión · 12 de octubre de 2026

- Nueve animaciones de diez segundos, 36 outfits en composiciones de cuatro paneles; coste 450 créditos. Montajes de 86,75 s en 1280×720 y 85,625 s en 1080×1440, con música de Suno. Decodificación completa de ambas copias con FFmpeg sin errores.
- Revisión de fotogramas y reproducción en Chrome; controles de música y pausa comprobados, incluida emulación iPhone SE. Compilación de producción correcta.
- Araceli rechaza el movimiento: las prendas apenas se mueven y predomina un pequeño zoom. Estos montajes no se consideran una pasarela validada.
- Se cambia a una única prenda por toma: prueba de cinco segundos con cámara fija y pasos alternos, coste adicional de 25 créditos. Revisión de diez fotogramas: los zapatos se levantan y apoyan alternativamente y los pantalones cambian de posición. Araceli acepta esta prueba y autoriza hasta 875 créditos adicionales para los otros 35 outfits.
- Subtotal antes de la ampliación: 475 créditos; saldo 6.538. La prueba está en `/pruebas/pasarela-caminata.html`, en bucle y con controles.

### Ampliación individual tras aprobar la caminata

- 35 clips individuales adicionales de cinco segundos: 875 créditos netos. Tres generaciones fallidas devolvieron 75 créditos; se obtuvieron sus sustituciones sin superar el máximo autorizado. Saldo final de la ampliación: 5.663. Total del 12 de octubre: 1.350 créditos, incluidas las primeras pruebas. No se ha realizado reescalado pagado.
- Las imágenes recortadas de las láminas dan resultados desiguales. Se reconstruyen once fotogramas individualmente con más espacio de suelo y se animan; su revisión muestra pasos alternos. Se conservan los prompts y las tareas en las fuentes privadas.
- Revisión visual de fotogramas repartidos por cada clip: 23 looks muestran pasos claros; trece mantienen una pose casi fija. Lista exacta en [PELICULA-MAISON-ILUSTRADA.json](PELICULA-MAISON-ILUSTRADA.json). La revisión por muestreo no garantiza ausencia de artefactos y el resultado sigue siendo un borrador.
- Montaje local con los 36 looks: escritorio 1920×1080, nueve bloques de cuatro prendas, 62,624674 s; móvil 1080×1440, una prenda por plano y extractos de 2,5 s, 90 s. Cortes directos para evitar zapatos duplicados durante fundidos. En escritorio las caminatas se reproducen a velocidad 0,72.
- Música Runway Pulse, H.264, AAC 128 kb/s, 24 fps y faststart. Ambas exportaciones decodificadas completas con FFmpeg sin errores. FFprobe confirma dimensiones, duración y pistas de vídeo/audio.
- Vídeo completo servido por Vite local: HTTP 200 y video/mp4. Portada selecciona la copia vertical hasta 700 px. El título se sitúa arriba para dejar visibles las piernas y los pasos. Compilación de producción correcta. La nueva edición aún no tiene comprobación visual responsive ni prueba en teléfono físico.
- Incorporado a la portada local para revisión; no se ha hecho commit, push ni despliegue remoto de este borrador.

### Nueva dirección: pasarela lateral

Araceli rechaza el montaje de 36 looks por movimientos insuficientes y extraños y propone una vista lateral con avance de izquierda a derecha sobre escenarios que se desplazan. Se prepara una prueba independiente de veinte segundos: dos outfits, cuatro pasadas, un fondo continuo y la pista Runway Pulse. Las imágenes y cuatro poses por prenda se generan con la herramienta integrada de imágenes de OpenAI. La composición se realiza con FFmpeg, sin nuevas generaciones de Runway y sin créditos adicionales.

La hoja de poses se extrae y se alinea mediante `scripts/prepare-maison-lateral-frames.mjs`; `scripts/render-maison-lateral-pilot.py` reproduce las poses a 5 fps y compone el vídeo H.264 a 24 fps. La revisión de veinte fotogramas durante los dos primeros segundos muestra alternancia de poses de piernas y avance horizontal; otra hoja cada dos segundos revisa el recorrido y el escenario. Decodificación completa sin errores y página de prueba local con HTTP 200. Es una animación ilustrada de poses discretas, pendiente de aceptación; aún no incluye los 36 looks ni dura un minuto. Fuentes y prompts privados en `docbase/hero-lateral-v1`.

### Cierre de la pasarela lateral

Araceli acepta la ampliación de 36 looks y 90 segundos, con cadencia más lenta. Ambas exportaciones finales se decodifican completas sin errores; FFprobe confirma duración, dimensiones y audio. Se revisan visualmente 18 muestras de escritorio y una muestra por cada uno de los 36 looks móviles, con prendas y calzado dentro del encuadre. La portada se comprueba en Edge de escritorio y la compilación de producción termina correctamente. La copia móvil es 1080×1920 y se selecciona hasta 700 px. La emulación responsive no puede completarse porque la organización bloquea DevTools en Edge; no se ha probado esta versión en un teléfono físico. No se ha realizado commit, push ni despliegue remoto de esta revisión.

### Catálogo de los 36 outfits · 12 de octubre

- Catálogo reproducible: 190 productos, 996 variantes, 16 colecciones y 57 selecciones editoriales. Se conservan los 51 productos previos y se añaden 139 piezas para los 36 looks de la película, con identificadores estables y títulos de canciones.
- Fotografías: 36 vistas de conjunto y 139 fotos individuales WebP. Se revisan todas las hojas originales y sus celdas. Comprobación de existencia de las imágenes de los 190 productos y los 36 looks, sin rutas ausentes; revisión de variación de píxeles para localizar posibles celdas vacías.
- `npm test`: 26 pruebas de backend, 4 de cliente HTTP y 3 de selección de carrito, todas correctas. Incluyen pedido de cinco piezas con total calculado por el servidor, descuento de stock, catálogo completo, selección de look sin añadidos parciales, límites del carrito y migraciones idempotentes que conservan ediciones y existencias.
- `npm run build` y `git diff --check`: correctos. Las fuentes y los prompts permanecen en `docbase`, ignorado por Git.
- Semilla local repetida: no reinicia artículos anteriores. Las migraciones locales actualizan los nombres de los 139 artículos y los 36 looks, y las 139 referencias de imagen provisionales, sin tocar cantidades ni pedidos.
- Safari: galería de los 36 conjuntos visible en escritorio. Edge: ficha Welcome to New York, selección explícita y botón de conjunto deshabilitado hasta elegir variantes, comprobados. Seleccionadas cinco variantes y añadido el conjunto: la bolsa muestra cinco líneas independientes con sus tallas y total. Se retiraron después todas las líneas de prueba; no se creó un pedido desde el navegador.
- Revisión de galería y ficha a anchura lógica estrecha mediante zoom del navegador al 300 %: menú hamburguesa, dos columnas de galería y formularios apilados. Zoom restaurado al 100 %. Esta comprobación no equivale a emulación de dispositivo ni a prueba en teléfono físico, que sigue pendiente. No se acredita aquí publicación remota de los cambios del catálogo.
- Formato monetario compartido: agrupación de miles explícita, incluso para cuatro cifras. Verificados en castellano `2.200,00 €`, `5.410,00 €` y `1.234.567,89 €`; inglés conserva su convención. Compilación correcta tras el ajuste.
- Fichas de pasarela: miniaturas individuales junto al nombre de cada pieza, revisadas visualmente en Edge. Navegación anterior/siguiente según el orden de la película: comprobado el paso de Welcome to New York a Style y la presencia de enlaces a los looks contiguos. Importes corregidos también comprobados en la interfaz. Compilación y revisión de diferencias correctas tras esta mejora.

### Recorrido de compra y gestión · 12 de octubre

- `npm test`: 28 pruebas de backend, 4 de cliente HTTP y 3 de selección de carrito; 35 correctas, sin fallos. Los nuevos casos comprueban que talla, presupuesto y stock coinciden en una misma variante, rechazan parámetros repetidos o malformados y recuperan una página válida cuando la solicitada supera el catálogo.
- Filtros públicos de talla y precio máximo por pieza, precios de la variante compatible y conservación de filtros al volver desde una ficha, comprobados en Edge. La combinación de pasarela, talla M, disponibilidad y máximo de 1.000 € devuelve 69 piezas en la instalación principal.
- Bolsa: actualización de precio y stock, aviso en la pieza afectada, ajuste explícito de cantidad y bloqueo del pedido mientras faltan existencias. En una base temporal independiente se cambia una variante de siete a dos unidades y de 290 a 310 €. La interfaz reconoce el cambio, permite ajustar a dos unidades y crea un pedido de demostración de 620 €.
- Acceso con cuenta ficticia creada por API, talla M, favoritos, bolsa, pedido, historial y comunicaciones comprobados en el navegador. Cambio a inglés conserva el recorrido y muestra textos y moneda según ese idioma. Cierre de sesión comprobado; no se guardó la contraseña en el navegador.
- Team: búsqueda por nombre español desde la interfaz inglesa, creación de un producto ES/EN, aviso de traducción pendiente con cambio al idioma afectado, subida de WebP desde el selector de archivos, guardado, edición de visibilidad y filtro de archivados, comprobados desde la interfaz.
- Pedido temporal confirmado y cancelado desde Team: estado final cancelado, dos unidades recuperadas y tres comunicaciones visibles en la cuenta. La copia de revisión contiene 191 productos; la instalación principal conserva sus 190 productos y siete unidades de la variante utilizada en la prueba.
- Revisión visual de filtros a anchura lógica estrecha mediante zoom del navegador al 300 %, con menú móvil y selectores dentro del ancho. Zoom restaurado al 100 %. No equivale a emulación de dispositivo ni a una prueba en teléfono físico.
- `npm run build` y `git diff --check`: correctos. Bundle JS de aproximadamente 350 kB, 109 kB con gzip. Las 183 claves ES/EN coinciden. El recorrido aislado utiliza el build servido por Express, sin Vite; no acredita un despliegue HTTPS público. El alta completa desde el formulario, dispositivos reales y lector de pantalla siguen pendientes.
