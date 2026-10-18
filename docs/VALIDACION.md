# Validación de la primera versión de Maison

### Editor y subida desde Team publicado · 18 de octubre de 2026

- He accedido sin error con mi nueva contraseña. Después se revisa la sesión ya abierta en Chrome de escritorio sobre la web publicada, sin volver a introducir credenciales ni cerrar mi sesión.
- Desde «Nuevo producto» se crea `ui-daylight-20261018`, «Vestido · Daylight (prueba)», con nombre, descripción y etiqueta de variante ES/EN, colección Golden Hour, precio de 125 € y dos unidades. Se conserva archivado durante toda la prueba para no aparecer en el catálogo público.
- Imagen WebP sintética propia de 600 × 750, seleccionada desde el diálogo de archivos de Team. Subida completada, ruta `/api/v1/images/…` asignada y miniatura visible. Lectura por HTTPS y decodificación WebP comprobadas contra el servicio real.
- Guardado y búsqueda por identificador desde Team correctos. Reapertura del editor: textos ES/EN, imagen, precio y stock conservados. Se edita a 130 € y 23 unidades, se guarda y se comprueba la revisión 2 y esos valores en Atlas y en el listado de Team.
- Se retiran únicamente esa pieza, su variante, la referencia de imagen y el recurso temporal de Cloudinary. Quedan los 190 productos originales. La lectura de la misma URL puede conservar la respuesta anterior por su caché de cinco minutos; la retirada no implica invalidación instantánea de copias cacheadas. Las peticiones nuevas con una URL sin caché devuelven 404 tanto en API como en web. Al recargar Team se conserva la sesión y el listado muestra 190 piezas.
- No se modifican artículos originales ni se crean pedidos en esta revisión. No acredita todavía compra e historial completos desde navegador, dispositivo físico ni persistencia de imagen/pedido durante un redeploy. No hay cambios de código; la comprobación se añade a la documentación.

### Continuidad después de redesplegar la API · 18 de octubre de 2026

- Segundo avance publicado: `86c7d82`, «Publica Maison en Vercel y verifica el recorrido real de Team». [GitHub Actions, ejecución 17](https://github.com/AraceliFradejas/BigSchool-TFM_KelseTSMaison/actions/runs/39135881861), completada correctamente.
- Vercel recibe el push y completa un nuevo despliegue de producción de la API con esa revisión. Una sesión Team iniciada antes del cambio sigue identificando a la misma cuenta y el catálogo público conserva 190 productos después del cambio. Se cierra esa sesión y se comprueba su revocación.
- Chequeo público de solo lectura repetido tras el redeploy: correcto. Eliminados el archivo temporal usado para trasladar variables a Vercel y el archivo privado con la cookie de esta comprobación. El `.env` local permanece ignorado por Git.
- Esta comprobación acredita continuidad de cuenta, sesión y catálogo. No sustituye la comprobación específica de un pedido y una imagen conservados durante otro redeploy, ni una restauración de backups.

### Vercel y recorrido HTTP real · 18 de octubre de 2026

- Publicados web y API independientes desde `be67431`: https://kelsets-maison.vercel.app y https://kelsets-maison-api.vercel.app. Los dos builds completan en Vercel. No se activan planes de pago.
- API pública: healthcheck HTTP 200 con `database: mongodb`, catálogo de 190 piezas y Team sin sesión HTTP 401.
- `npm run check:deployment -- https://kelsets-maison.vercel.app`: correcto. Cinco rutas SPA, tres recursos HTML, cabeceras, catálogo e imagen, rechazo de pedidos y Team sin sesión y archivo ausente HTTP 404.
- Cuenta permanente Team creada con el correo ficticio elegido para Maison y contraseña propia privada. Se comprueba acceso, subida y lectura de imagen por el proxy, ficha temporal ES/EN, favorito y pedido de demostración. El pedido conserva nombre y precio después de editar la ficha; se confirma y cancela, recuperando stock y generando tres comunicaciones. Cookie con `Secure`, `HttpOnly`, `SameSite=Lax` y `Path=/api`; logout revoca la sesión.
- El recorrido se ejecuta primero contra Express local conectado a los servicios reales y después por HTTP sobre el dominio HTTPS público. Solo se utilizan una imagen, producto y pedido temporales nuevos; se retiran sus registros y archivo de Cloudinary al terminar y se conserva la cuenta Team. No se modifican productos originales, cuentas ni datos de Cars.
- Chrome de escritorio: portada pública y navegación al catálogo, con imágenes y 190 piezas después de retirar los datos de prueba; selector de idioma activado con Return, catálogo en inglés y retorno al castellano. No acredita subida desde la interfaz de Team, compra completa desde navegador, dispositivos físicos, restauración ni persistencia tras un nuevo redeploy.
- Tras añadir el comando explícito `team:create`, las 53 pruebas siguen correctas. El comando no modifica cuentas existentes ni se ejecuta al arrancar. Las credenciales administrativas no se envían a Vercel.

### Publicación del bloque de persistencia en GitHub · 18 de octubre de 2026

- Commit `be67431`, «Adapta Maison a MongoDB y Cloudinary y prepara Vercel», publicado en `main` del repositorio independiente de Maison con mi identidad Git configurada, sin coautorías añadidas.
- Verificación previa: 53 pruebas correctas, build, chequeo local de producción y revisión de diferencias correctos. Revisión de los 483 archivos versionados o candidatos a Git sin coincidencias con la URI MongoDB y claves Cloudinary configuradas ni inclusión de `.env`, `docbase` o runtime privado.
- [GitHub Actions, ejecución 16](https://github.com/AraceliFradejas/BigSchool-TFM_KelseTSMaison/actions/runs/39135119340): completada correctamente en 48 segundos, comprobada desde la interfaz de GitHub. Esto acredita CI remoto, no el despliegue en Vercel.

### Conexión real con Cloudinary · 18 de octubre de 2026

- Comprobadas las credenciales de Maison guardadas en `backend/.env`, sin mostrarlas. Subida autenticada mediante `createCloudinaryStorage` de una imagen WebP ficticia de 16 × 16 píxeles con identificador aleatorio dentro de la carpeta configurada de Maison.
- Lectura real mediante `fetchCloudinaryImage`, con destino restringido y timeout; Sharp confirma WebP y dimensiones 16 × 16. Eliminación de la imagen temporal completada al finalizar.
- No se han cambiado imágenes de catálogo, cuentas, pedidos ni datos de Cars. `backend/.env` continúa ignorado por Git. Esta prueba acredita el adaptador contra Cloudinary real; no equivale a una subida desde la interfaz de Team ni a una prueba del proxy publicado en Vercel.

### Conexión y catálogo en Atlas · 18 de octubre de 2026

- Comprobadas las credenciales de Maison guardadas en `backend/.env` sin mostrarlas: conexión y `ping` correctos, topología compatible con transacciones y base inicialmente vacía. La conexión necesitó acceso de red fuera del sandbox.
- Carga en la base propia `kelsets_maison`: 190 productos, 996 variantes, 16 colecciones y 57 looks. Una segunda ejecución inserta cero productos; no duplica el catálogo. La base conserva cero usuarios y cero pedidos: no se han trasladado cuentas, sesiones ni pedidos locales o de Cars.
- Ajustado `seed:mongo` para que la carga de MongoDB no dependa de tener Cloudinary configurado. Comprobación de sintaxis y `git diff --check` correctos.
- Cloudinary todavía tiene sus tres campos de credenciales vacíos en esta comprobación. No se acredita subida externa, recorrido con sesión en Atlas ni despliegue Vercel. Las comprobaciones previas descritas debajo conservan su alcance temporal.

### Adaptación a Vercel, MongoDB y Cloudinary · 18 de octubre de 2026

- Revisados conexión, configuraciones Vercel y controladores de subida/entrega de imágenes de Cars, sin abrir su `.env`, copiar secretos ni modificar el proyecto.
- `npm test`: 53 pruebas correctas (44 backend contando subpruebas, 6 cliente HTTP y 3 bolsa). Las 42 pruebas anteriores siguen pasando. Los casos nuevos usan MongoDB 8.0.16 temporal en replica set, sin Atlas: catálogo y semilla idempotente, sesión, favoritos, privacidad, pedidos simultáneos con la misma clave, competencia por la última unidad, rollback de varias piezas, revisión de Team, variantes reservadas, copia histórica y cancelación concurrente con una sola devolución de stock.
- Subida y entrega de WebP probadas con MongoDB temporal y dobles de Cloudinary. Se comprueban destino restringido a Maison, rechazo de formatos ajenos y límite de bytes de entrega. No se ha realizado una subida al servicio Cloudinary real.
- `npm run build` y `npm run check:production`: correctos. El chequeo utiliza SQLite temporal y el build real; también verifica cinco rutas SPA, tres recursos, cabeceras, healthcheck, catálogo, imagen, protección de pedidos y Team y 404 de recurso ausente. No acredita despliegue remoto.
- La ejecución necesitó permiso para puertos locales y descarga del binario de pruebas. Se preparan dos configuraciones Vercel; el empaquetado remoto, Atlas, Cloudinary real, cookies tras el proxy publicado y persistencia tras redeploy siguen pendientes. No se ha desplegado ni contratado ningún servicio.
- Creados `backend/.env.example` sin secretos y `backend/.env` con campos privados vacíos, ignorado por Git y permisos 0600. No se han probado aún credenciales reales.

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
- Música «Runway Pulse», que creé en Suno; duración original 192,8535 segundos. Se utiliza su inicio, ganancia 0,7 y fundidos de dos segundos.
- Londres, esmoquin y burdeos se sustituyen por nuevas tomas completas de cinco segundos, que revisé y acepté en el montaje previo de un minuto. El lago conserva la nueva toma con una sola protagonista y un bolso.
- Los cuatro looks de cierre se revisan mediante fotogramas repartidos por cada clip, antes y después de la mejora 4K. Revisión adicional del montaje completo cada dos segundos para comprobar secuencia, continuidad y transiciones. Esta revisión por muestreo no garantiza la ausencia de todos los artefactos generativos.
- Safari reproduce directamente la copia final de 1440p, con duración nativa mostrada como un minuto y veintidós segundos y sonido. Controles de música y pausa comprobados en la portada, en castellano e inglés.
- Mejora del cierre: 37 créditos; generaciones: 100. Total 137 dentro del máximo autorizado de 140; saldo 7.013. El reescalado anterior de pasarela consumió otros 47 créditos, registrado por separado.
- `npm run build`: compilación correcta. `git diff --check`: sin errores de espacios. Las comprobaciones en un móvil físico siguen pendientes.

## Revisión responsive del cierre · 11 de octubre de 2026

- Chrome con emulación responsive de 390 píxeles, iPhone SE 375×667 e iPad Mini 768×1024. Encuadre panorámico en tablet y vertical a toda la altura disponible bajo la cabecera en móvil; textos y navegación revisados visualmente. La emulación no sustituye una prueba en teléfono físico.
- Corregida la selección de la fuente de vídeo: una URL explícita que responde a cambios de anchura, versión vertical para móvil y panorámica 1080p o 1440p para pantallas mayores. Comprobada la reproducción y activación de música en móvil.
- Tras mi revisión, el hero móvil ocupa la altura disponible de pantalla. Usa un reencuadre vertical por escena, con música y pausa superpuestas y título grande; castellano e inglés revisados. Menú hamburguesa hasta 1000 píxeles; incluye Mi cuenta y mantiene idioma, favoritos y bolsa en la cabecera.
- Comprobadas apertura y cierre del menú, cierre con Escape en tablet y cierre al navegar a Moda. Referencia de interacción consultada en Cars, sin modificar ese proyecto.
- Evidencias: [móvil](evidencias/maison-film-mobile.png), [menú](evidencias/maison-menu-mobile.png) y [tablet](evidencias/maison-film-tablet.png).

## Pasarela ilustrada en revisión · 12 de octubre de 2026

- Nueve animaciones de diez segundos, 36 outfits en composiciones de cuatro paneles; coste 450 créditos. Montajes de 86,75 s en 1280×720 y 85,625 s en 1080×1440, con música de Suno. Decodificación completa de ambas copias con FFmpeg sin errores.
- Revisión de fotogramas y reproducción en Chrome; controles de música y pausa comprobados, incluida emulación iPhone SE. Compilación de producción correcta.
- Descarté el movimiento: las prendas apenas se mueven y predomina un pequeño zoom. Estos montajes no se consideran una pasarela validada.
- Se cambia a una única prenda por toma: prueba de cinco segundos con cámara fija y pasos alternos, coste adicional de 25 créditos. Revisión de diez fotogramas: los zapatos se levantan y apoyan alternativamente y los pantalones cambian de posición. Acepté esta prueba y fijé un máximo de 875 créditos adicionales para los otros 35 outfits.
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

Descarté el montaje de 36 looks porque los movimientos eran insuficientes o extraños y propuse una vista lateral de izquierda a derecha sobre escenarios que se desplazan. Se prepara una prueba independiente de veinte segundos: dos outfits, cuatro pasadas, un fondo continuo y la pista Runway Pulse. Las imágenes y cuatro poses por prenda se generan con la herramienta integrada de imágenes de OpenAI. La composición se realiza con FFmpeg, sin nuevas generaciones de Runway y sin créditos adicionales.

La hoja de poses se extrae y se alinea mediante `scripts/prepare-maison-lateral-frames.mjs`; `scripts/render-maison-lateral-pilot.py` reproduce las poses a 5 fps y compone el vídeo H.264 a 24 fps. La revisión de veinte fotogramas durante los dos primeros segundos muestra alternancia de poses de piernas y avance horizontal; otra hoja cada dos segundos revisa el recorrido y el escenario. Decodificación completa sin errores y página de prueba local con HTTP 200. Es una animación ilustrada de poses discretas, pendiente de aceptación; aún no incluye los 36 looks ni dura un minuto. Fuentes y prompts privados en `docbase/hero-lateral-v1`.

### Cierre de la pasarela lateral

Acepté la ampliación de 36 looks y 90 segundos, con una cadencia más lenta. Ambas exportaciones finales se decodifican completas sin errores; FFprobe confirma duración, dimensiones y audio. Se revisan visualmente 18 muestras de escritorio y una muestra por cada uno de los 36 looks móviles, con prendas y calzado dentro del encuadre. La portada se comprueba en Edge de escritorio y la compilación de producción termina correctamente. La copia móvil es 1080×1920 y se selecciona hasta 700 px. La emulación responsive no puede completarse porque la organización bloquea DevTools en Edge; no se ha probado esta versión en un teléfono físico. No se ha realizado commit, push ni despliegue remoto de esta revisión.

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

### Revisión de catálogo y fichas · 17 de octubre

- Auditoría de la semilla: 190 artículos, 16 colecciones y 57 looks. Los nombres y descripciones de producto contienen texto ES/EN; todas las imágenes principales existen y las referencias de productos y colecciones son válidas. Esta comprobación no acredita la calidad visual individual de las 190 imágenes.
- Todas las fichas requieren elegir explícitamente variante antes de añadir a la bolsa. Las agotadas permanecen visibles y deshabilitadas. El precio inicial es el mínimo de las variantes y lleva «Desde» / «From» cuando difieren; elegir variante muestra su precio. El estado de disponibilidad utiliza `role="status"`; no se ha probado con lector de pantalla.
- Los enlaces de colección muestran su nombre editorial. «Completa tu look» describe una selección editorial y no presupone que todas las piezas pertenezcan a la misma colección. Las recomendaciones del look no dependen de que termine correctamente la petición de artículos de colección.
- Edge, build servido por Express en `http://127.0.0.1:3000`: revisión visual del catálogo Golden Hour y ficha Satin Story; sin variante inicial, botón de bolsa deshabilitado y talla L agotada. Al elegir M, se habilita añadir. Cambio a inglés conserva M. Ficha Warm Notes: «From €95.00», selección de 50 ml y precio de 145,00 € al volver al castellano. No se añadieron piezas ni se crearon pedidos.
- Navegación desde catálogo con `collection=golden-hour&available=1` a Satin Story y después a los pendientes recomendados: el enlace de vuelta conserva ambos filtros.
- No se cierra todavía la revisión editorial completa, ni se acreditan aquí dispositivos físicos, lector de pantalla o despliegue público.
- Verificación final: 35 pruebas correctas (28 de backend, 4 de cliente HTTP y 3 de selección de bolsa), compilación correcta y `git diff --check` sin incidencias. Coinciden las 186 claves ES/EN. Las pruebas necesitaron acceso a puertos locales fuera del sandbox: dentro fallaban con `listen EPERM`.

### Nombres musicales de catálogo · 17 de octubre

- Los 51 artículos previos a la pasarela reciben nombres ES/EN con títulos de canciones; las 139 piezas de pasarela conservan los suyos. Los identificadores y rutas de imagen no cambian. El criterio queda recogido en `AGENTS.md` para futuras incorporaciones.
- Dos pruebas nuevas verifican cobertura de la semilla y migración: traducciones de Team conservadas de forma independiente, stock y precios intactos, líneas históricas sin cambios, incremento de revisión e idempotencia. Se actualiza el nombre esperado del vestido en la prueba existente de copia histórica de pedido.
- Migración ejecutada en la instalación local: 51 productos actualizados. Edge muestra «Pendientes · Daylight» con recomendaciones «Vestido · Enchanted» y «Perfume · Sweet Nothing».
- `npm test`: 37 pruebas correctas (30 backend, 4 cliente HTTP, 3 bolsa). `npm run build`: correcto.

### Revisión visual y formulario de acceso · 17 de octubre

- Revisadas las 190 imágenes principales en siete láminas de contacto generadas con Sharp, identificador y nombre musical. A escala de miniatura, los tipos de prenda, accesorios y belleza corresponden a sus nombres; no se observan imágenes ausentes ni fotografías de conjuntos sustituyendo a las piezas. Las láminas se conservan en `docs/evidencias/catalogo/`. Esta revisión no acredita detalles de textura o acabado a resolución completa, ni el responsive de las 190 fichas.
- Registro desde el formulario comprobado en Edge con datos ficticios y una base temporal independiente en `/tmp`, servida en `http://localhost:3001` para separar también las cookies de la instalación principal. Campos obligatorios validados por el navegador; alta correcta y redirección a la ficha solicitada en `next`. No se envían correos externos. Contraseña descartada en el aviso de guardado del navegador.
- Acceso incorrecto probado con Tab entre correo, contraseña y botón, y envío con Return. No equivale a una auditoría completa de teclado. Detectado y corregido el error que conservaba el mensaje en el idioma anterior: ahora se traduce al renderizar, conservando el código del error. Comprobado el cambio inglés/castellano con el aviso visible.
- Caída de conexión simulada deteniendo únicamente el servidor temporal. El cliente HTTP devuelve `network_error` y el formulario muestra un aviso ES/EN para comprobar conexión y reintentar. No hace reintentos automáticos. Al restablecer el servidor, el reintento explícito accede a la cuenta sin rellenar de nuevo el formulario. Cierre de sesión final comprobado.
- Dos pruebas nuevas verifican el código de red, ausencia de reintentos y preservación de cancelaciones normales y con motivo personalizado. `npm test`: 39 correctas (30 backend, 6 cliente HTTP y 3 bolsa). Compilación y `git diff --check` correctos.
- Pendientes: revisión de detalles de imágenes a resolución completa cuando proceda, dispositivos físicos, auditoría completa de teclado, lector de pantalla y validación en despliegue público.

### Foco y navegación por teclado · 17 de octubre

- Al cambiar de ruta, el foco pasa al contenido principal; modificar filtros de la misma ruta conserva el foco en el control. Escape cierra el menú móvil y devuelve el foco al botón si estaba dentro de sus enlaces. Elegir un enlace cierra el menú y sitúa el foco en el contenido, incluso si solo cambia la categoría del catálogo.
- Moda, Accesorios y Belleza marcan `aria-current="page"` según la categoría de la URL; se evita que las tres se indiquen como actuales por compartir `/catalog`. Revisión de código, sin validación con lector de pantalla.
- La contraseña tiene una etiqueta explícita y su ayuda de registro queda asociada mediante `aria-describedby`, separada del nombre del campo. Edge muestra el campo como «Contraseña» y la ayuda como texto independiente.
- Edge: navegación de ficha a catálogo y Tab al primer enlace de contenido; cambio de categoría con teclado manteniendo foco en el selector; a zoom del 300 %, apertura de menú, recorrido con Tab hasta Moda, cierre con Escape y retorno al botón; reapertura y activación con Return, menú cerrado y siguiente Tab en el contenido. Zoom restaurado al 100 %. No equivale a emulación ni prueba de teléfono.
- En registro, activación de «Ir al contenido» con Return y siguiente Tab en Nombre; Tab avanza por correo y contraseña. Descartadas las sugerencias del navegador; no se creó ninguna cuenta durante esta revisión.
- `npm test`: 39 correctas. Compilación y `git diff --check` correctos. Sigue pendiente una auditoría completa, el lector de pantalla y dispositivos físicos.

### Preparación de producción y restauración · 17 de octubre

- Añadidas tres pruebas de backend con configuración de producción: rutas SPA y recursos, distinción de errores API/archivos, cabeceras y cookies seguras, rechazo de orígenes de desarrollo y restauración de runtime cerrado. Las pruebas de rutas usan un HTML/JS de fixture; el chequeo independiente siguiente utiliza el build real.
- Copia local independiente de una base temporal cerrada: conserva pedidos, comunicaciones, sesiones, existencias, referencia de imagen y sus bytes de prueba. `PRAGMA integrity_check` devuelve `ok`; la carga de semilla no sobrescribe los datos restaurados y una modificación en la copia no altera la fuente. No se copiaron cuentas ni pedidos de la instalación principal.
- `npm run check:production`, correcto sobre el build real: cinco rutas SPA, tres recursos referenciados por el HTML (favicon, JS y CSS), healthcheck, catálogo, una imagen y 404 de recurso inexistente. Utiliza datos temporales y HTTP de loopback con configuración de producción; no acredita HTTPS público ni configuración de proxy.
- `npm test`: 42 correctas (33 backend, 6 cliente HTTP, 3 bolsa). `git diff --check`, correcto. El build utilizado es el compilado en la revisión de accesibilidad del mismo día; no han cambiado fuentes del frontend en este bloque.
- Se añade el chequeo del build al flujo de CI y un `HEALTHCHECK` al Dockerfile. No se ha ejecutado todavía ese flujo remoto con estos cambios, ni Docker, que no está instalado. Persistencia en alojamiento, reinicio del proveedor, dominio y TLS siguen pendientes.

## Evidencias publicadas · 18 de octubre de 2026

Se amplía el [índice de capturas](evidencias/produccion-2026-10-18/README.md) hasta dieciséis imágenes originales de Chrome. Desde la sesión existente de Team Maison se cambia a inglés, se añade una unidad M · Champagne de Enchanted a la bolsa y se crea el pedido de demostración `29e9f091-8106-41cc-8ccb-0f596dbfe229` por 1.850 €. Desde Team se confirma y cancela. Se observan los tres mensajes internos en la cuenta y la recuperación de las ocho unidades iniciales de esa variante. Se conserva el pedido cancelado como demostración; la bolsa termina vacía. No se ha enviado correo ni realizado un cobro.

Se abre el editor existente y se capturan sus campos ES/EN sin guardar modificaciones. Se observa la portada publicada y se abre y cierra su menú en el perfil iPhone SE de Chrome DevTools (375 × 667 CSS, sin limitación de red). Se restaura escritorio y castellano, conservando la sesión. Esta revisión no equivale a una prueba en teléfono físico ni a una validación completa de todos los tamaños. No se cambia código de la aplicación.

### Secuencia visual de subida y guardado en Team

Se añaden las capturas 17–19: subida mediante selector nativo de una copia del recurso propio `satin-story.webp`; creación desde la interfaz de `evidencia-daylight-20261018`, archivada, con traducciones ES/EN, una variante, precio 10 € y stock cero; búsqueda y reapertura con la referencia de imagen conservada. La entrada automatizada pierde una vocal acentuada en la etiqueta castellana («M · Champn»); la evidencia conserva ese estado real. No se modifican piezas existentes.

Tras comprobar ausencia de referencias en pedidos y de uso compartido de la imagen, se limpian exclusivamente el producto, variante y referencia temporales de Atlas y su imagen de Cloudinary. Resultado: 190 productos; cero productos, variantes o referencias de esa prueba. Las capturas se conservan en el índice y el pedido cancelado anterior permanece en el historial.

## Primera etapa móvil nativa · 18 de octubre de 2026

- Expo SDK 57 y React Native 0.86.3, con React/React DOM 19.2.3 unificados para evitar duplicados. Módulos nativos instalados mediante `expo install`. Metro utiliza la configuración oficial de monorepos.
- Catálogo, búsqueda, categorías, paginación, ficha, variantes y bolsa local ES/EN implementados. Reutiliza el cliente HTTP; la lógica de cantidades de web pasa a `@maison/contracts/cart-selection` sin cambiar sus reglas. La bolsa local guarda solo identificadores/cantidades y recupera precio y stock de la API.
- `npm test`: 56 correctas (44 backend, 6 cliente HTTP, 3 bolsa compartida y 3 modelo móvil). Los casos móviles cubren restauración corrupta/duplicada, descarte de precios almacenados, cambios de disponibilidad y restricción a URL HTTPS e imágenes del mismo origen.
- `npm run mobile:export`: paquetes Hermes de iOS y Android generados correctamente. `expo install --check`: dependencias compatibles. `expo-doctor`: 21/21 después de retirar una opción de splash ya no admitida y resolver la duplicación de React.
- `npm run build` y `npm run check:production` correctos tras unificar React. La primera ejecución de tests encontró EPERM al abrir loopback en el sandbox; la repetición con permisos de puertos pasa. No fue un fallo de lógica de la aplicación.
- La auditoría del árbol de dependencias informa 22 avisos (7 moderados y 15 altos) en Expo/React Native y sus dependencias; se documentan en la guía móvil. No se aplica una corrección forzada incompatible.
- Metro arranca para Expo Go. No hay Xcode ni emulador Android instalados en este entorno y todavía no se ha ejecutado esta app en un móvil: La prueba física de ambos sistemas se recoge en los apartados posteriores. Exportar no acredita un recorrido nativo ni genera un IPA/APK de distribución. No se publica en App Store ni Google Play.

El recorrido privado (sesión, pedidos, favoritos y Team), la prueba física y el asistente IA quedan pendientes. Véase [guía móvil](../mobile/README.md).

### Incidencia inicial de acceso a Expo Go

Al preparar la prueba, no encontraba Expo Go en Play Store y el iPhone mostraba un mensaje de contenido no válido. Se comprueba Metro activo y un manifiesto JSON válido para iOS con SDK 57 por HTTP local. Se corrige la guía: descarga Android desde la página oficial de Expo y requisito de iniciar sesión con la misma cuenta en CLI y Expo Go de iOS. Estas comprobaciones no prueban que el teléfono alcance la red local ni resuelven por sí solas el mensaje de Cámara; la ejecución física continúa pendiente.

### Primer arranque físico y adaptación visual

He abierto Maison en iPhone y Android con Expo Go. En esta primera revisión vi que los controles resultaban demasiado cuadrados. Todavía tenía que completar el recorrido y registrar los modelos y versiones, que se recogen más adelante.

Se ajustan botones de marca, imágenes, selección y navegación inferior; se incorporan botones del sistema para volver/reintentar y selección de idioma con ActionSheetIOS/Alert. Android utiliza `android_ripple`; iOS, opacidad y escala al pulsar. La barra inferior sigue siendo personalizada, con roles de pestaña, iconos y contador de bolsa. Exportación iOS/Android y tres pruebas del modelo correctas; revisión visual física de estos cambios pendiente. No se modifica la web ni la lógica de stock/pedidos.

### Outfits nativos y entrada con logo

Se añade la pestaña Outfits, conectada a las selecciones `sourceId` de `/looks`: galería de títulos musicales, filtro de era y detalle con todas las piezas y variantes. La selección es explícita y el conjunto se combina de forma atómica con la bolsa mediante la regla compartida. Una cuarta prueba móvil comprueba variantes incompletas, selección completa y rechazo sin adiciones parciales cuando una cantidad acumulada supera stock.

La entrada con logo utiliza Animated, respeta reducción de movimiento y se puede saltar. Al probarla vi que la primera versión solo aparecía en la zona inferior; se sustituye la superposición por un Modal nativo `fullScreen`, con contenido flex y margen seguro inferior, para independizar su tamaño del layout. Logo con ancho adaptable. Esta corrección todavía requiere confirmación visual en los teléfonos. El logo PNG del arranque estático deriva del SVG de BrandLogo de la web y se configura con `expo-splash-screen`; el splash distribuido no se valida en Expo Go.

Exportación iOS/Android correcta después del ajuste, cuatro pruebas del modelo correctas y Expo Doctor 21/21. No se afirma comprobado el recorrido físico de selección de outfits ni el splash de distribución.

### Android tras actualización en caliente · 18 de octubre

He comprobado la entrada corregida en iPhone e iPad; en Android apareció un SyntaxError. Metro registra `Unable to resolve ./Outfits` durante la incorporación de archivos, antes de terminar la actualización; en ese momento todavía no había registrado el texto completo del error del teléfono. Se reinicia Metro con `--clear`, manteniendo puerto y dirección de desarrollo. Los bundles de desarrollo Android e iOS responden HTTP 200 como JavaScript y ambos superan una comprobación de sintaxis con esbuild. Esto acredita el servidor limpio, no confirma todavía la recuperación del dispositivo Android. El siguiente paso fue volver a abrir Maison desde Expo Go y comprobar si el error continuaba.

Después del reinicio con caché limpia pude volver a cargar la app en Android. El recorrido completo de outfits seguía pendiente de revisar.

### Separación de miles en todos los importes

Al revisar los importes encontré `1850,00` en la app y decidí mostrar `1.850,00`. La web ya utilizaba agrupación forzada; el formateador móvil omitía esa opción. Se unifica web y app en `@maison/contracts/money`, con agrupación siempre y dos decimales. Se aplica a precios de catálogo/ficha, filtros de presupuesto, líneas y totales de bolsa, outfits, historial, detalle y Team mediante los componentes existentes. Los campos HTML numéricos conservan el valor editable sin separadores y muestran al lado su lectura monetaria formateada en el editor de Team y en el presupuesto editorial. No cambian céntimos almacenados ni precios históricos.

Dos pruebas comprueban el caso de cuatro cifras, límites desde cero hasta millones, inglés y las 996 variantes de la semilla; las nueve pruebas de bolsa/modelo/formato pasan. Build web, chequeo local de producción y exportación iOS/Android correctos. El bundle de desarrollo Android responde HTTP 200 como JavaScript con el nuevo módulo compartido. Revisión visual del formato en los teléfonos pendiente.

### Formato europeo en ambos idiomas

He elegido mantener el formato europeo también al navegar en inglés. Se elimina la selección de locale por idioma del formateador compartido: ES y EN muestran siempre `1.850,00 €`, con punto de miles, coma decimal y dos decimales. Las pruebas de límites se aplican ahora a ambos idiomas tanto en web como en el adaptador móvil. La comprobación anterior de formato anglosajón queda sustituida por este criterio.

### Miniaturas de producto en la bolsa móvil

Se añade la imagen del producto a cada línea de la bolsa nativa, junto con nombre, variante, cantidad e importe europeo. Imagen y datos abren la ficha. Se reutiliza el componente de foto y su alternativa si la imagen no carga; los productos retirados mantienen su aviso de indisponibilidad. Exportación iOS/Android correcta; comprobación visual en dispositivo pendiente. No cambia la lógica ni los datos de la bolsa.

### Dispositivos y versiones de mis pruebas

Para la revisión del 18 de octubre de 2026 he utilizado un iPhone 13 con iOS 26.6.1, un iPad de 6.ª generación con sistema 17.7.0 y un Samsung Galaxy A34 con Android 16, con Expo Go 57.0.9. He registrado estos equipos en el README, la memoria y la guía móvil. Queda pendiente completar los recorridos indicados para cada dispositivo.

## Pago simulado · 18 de octubre de 2026

He ejecutado `npm test`: 63 comprobaciones correctas (46 de backend, 6 del cliente HTTP, 5 de frontend y 6 móviles). Las nuevas pruebas cubren consentimiento obligatorio, rechazo de datos de tarjeta ajenos al esquema, comparación del importe revisado con el calculado, rollback sin pedido/stock/comunicación en rechazos, confirmación concurrente sin duplicados, cinco métodos ficticios y justificante con cargo real cero. En MongoDB temporal compruebo además la conservación del justificante tras cancelar y la reposición del stock.

El build web, su chequeo local de producción, la exportación Hermes de iOS y Android y Expo Doctor 21/21 son correctos. Estas comprobaciones automatizadas no acreditan el nuevo acceso, sesión y pago en teléfonos físicos. No se conecta ninguna pasarela ni se envían correos externos.

He comprobado también la ampliación publicada en Chrome: revisión con confirmación bloqueada hasta aceptar el aviso, rechazo simulado manteniendo la bolsa y confirmación con PayPal simulado. El pedido `111d84b9-7a4e-413d-b713-596eeeeba640` conserva dos unidades de Enchanted M y un total simulado de 3.700,00 €, con justificante DEMO y cargo real cero. He cancelado este pedido desde Team para reponer las unidades y lo conservo en el historial. He comprobado que Enchanted M vuelve a tener sus 8 unidades disponibles. Las nuevas capturas están en el [índice de evidencias](evidencias/produccion-2026-10-18/README.md). El chequeo HTTPS público de solo lectura también es correcto.
