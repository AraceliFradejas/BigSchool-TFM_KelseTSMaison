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
- La película de 114,5 segundos y la pista de Suno siguen pendientes. Se cierra primero el tráiler con el saldo disponible, según la preferencia de Araceli.
