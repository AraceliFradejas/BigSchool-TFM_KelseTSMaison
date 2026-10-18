# Recursos y continuidad de Maison

Maison tiene datos y recursos propios de demostración. La base técnica continúa proyectos anteriores de Araceli Fradejas Muñoz, manteniendo separados sus repositorios y servicios.

## Reutilización revisada

| Referencia                                                                                           | Aplicación en Maison                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [KelseTS Cars](https://github.com/AraceliFradejas/RTC-PROYECTO13-FULL-STACK-REACT), commit `0436556` | Transporte HTTP de `packages/api-client/src/index.js`, adaptado a errores por código y cabecera de escritura                                                                            |
| Organización de Cars                                                                                 | Logo vectorial KelseTS y favicon revisados y adaptados al subtítulo Maison; patrón de módulos del backend y `features`/`shared` del frontend, con código y reglas específicos de Maison |
| README y memoria de Cars                                                                             | Estructura bilingüe del README, motivación personal y separación entre presentación y detalle técnico                                                                                   |
| [AFM Moda Oceánica](https://proyecto-landing-page-1.vercel.app/)                                     | Antecedente creativo de moda; no se han copiado sus imágenes, vídeo ni identidad oceánica                                                                                               |

No se han copiado vehículos, citas, talleres, fotografías, bases de datos, cuentas, `.env`, credenciales ni historial Git de Cars. Las sesiones y las reglas de persistencia de Maison son propias. El 18 de octubre se revisan de Cars la conexión MongoDB, los dos despliegues Vercel, el proxy de API y los controladores de subida y entrega Cloudinary. Se adaptan esos patrones; Maison usa el driver oficial de MongoDB, no Mongoose, y transacciones propias para pedidos y stock. No se trasladan configuraciones privadas.

## Datos e imágenes

`data/catalog.js`, `data/swiftie-edit.js` y `data/luxury-edit.js` definen cincuenta y un productos ficticios, quince colecciones y veintiuna looks manuales. Los precios son ejemplos y no representan ofertas reales. Las descripciones de belleza son creativas, sin diagnósticos ni promesas médicas.

`scripts/create-illustrations.mjs` genera quince ilustraciones de producto, tres escenas editoriales y el favicon adaptado de KelseTS. Son recursos SVG originales del proyecto, sin fotografías de celebridades, logotipos de equipos ni textos de canciones. Se pueden regenerar con `node scripts/create-illustrations.mjs`. Las ilustraciones no acreditan materiales ni acabados de mercancía real.

Los nombres de colección son propuestas creativas de demostración; no se ha realizado una verificación comercial de marcas. El dibujo vectorial de KelseTS y su rojo `#b3152b` continúan el sistema utilizado en Cars. El subtítulo Maison sustituye a Cars. La aplicación visual completa sigue pendiente de revisión.

## Tipografías

| Fuente           | Distribución                                                                                                         | Licencia                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| DM Sans          | [Fontsource DM Sans](https://fontsource.org/fonts/dm-sans), paquete `@fontsource/dm-sans`                            | SIL Open Font License, copia en [DM Sans](licencias/DM-Sans-OFL.txt)                   |
| Playfair Display | [Fontsource Playfair Display](https://fontsource.org/fonts/playfair-display), paquete `@fontsource/playfair-display` | SIL Open Font License, copia en [Playfair Display](licencias/Playfair-Display-OFL.txt) |

Las fuentes se empaquetan y sirven desde la aplicación. La interfaz no solicita tipografías a Google Fonts durante la navegación.

## Herramientas y atribuciones

React y React Router componen la web; Vite genera el build. Express gestiona la API, Zod valida las entradas y Sharp decodifica y optimiza imágenes. El driver oficial MongoDB y el SDK Cloudinary incorporan la persistencia y las subidas preparadas para Vercel. `mongodb-memory-server` permite probar transacciones en un replica set temporal; Cloudinary se comprueba con dobles, sin acreditar su servicio real. Node proporciona SQLite local, criptografía y el ejecutor de pruebas; Supertest comprueba las rutas HTTP. Las dependencias y sus versiones resueltas figuran en `package-lock.json` y conservan sus licencias en los paquetes instalados.

Las evidencias visuales iniciales se capturaron en Safari con una cuenta ficticia local y muestran la versión anterior con ilustraciones. Las imágenes actuales se crearon y editaron con la herramienta integrada de generación de imágenes de OpenAI, usando el logo vectorial del proyecto como referencia para los envases. Sharp las convierte a WebP. La aplicación no llama a un proveedor de IA durante la navegación ni envía correo externo. Los encargos visuales están en `docs/recursos/catalogo-fotorrealista.json`.

La dirección editorial swiftie toma como referencia el contraste entre glamour y estilo cotidiano de [Taylor Swift en Vogue](https://www.vogue.com/slideshow/taylor-swift-best-outfits-2024): prendas satinadas, rojo, detalles dorados y punto. Son propuestas propias de Maison; no se han copiado fotografías de marcas ni se presenta colaboración oficial.

## Ampliación swiftie y lujo

Se añaden 36 representaciones de producto, generadas individualmente con la herramienta integrada de OpenAI y optimizadas a WebP con Sharp. Los encargos completos y rutas de los recursos están en `docs/recursos/swiftie-edit.json` y `docs/recursos/luxury-edit.json`. Las imágenes son creaciones para Maison, no fotografías descargadas de las marcas.

Referencias de dirección creativa consultadas:

- [Taylor Swift: verde de alfombra roja](https://www.vogue.co.uk/article/taylor-swift-golden-globes-2024), para Spotlight.
- [Taylor Swift: minifalda y botas para una llegada a TV](https://www.vogue.com/article/taylor-swift-winter-miniskirt), para City Pages.
- [Armani: seda, terciopelo y líneas sobrias](https://www.armani.com/en/giorgio-armani/woman/), para Atelier Days y Velvet Romance.
- [Gucci: bolsos para distintas ocasiones](https://www.gucci.com/us/en/ca/women/handbags-c-women-handbags), para Journey Tote y los bolsos de noche.
- [Prada: punto, cachemir, lana y seda](https://www.prada.com/ww/en/womens/ready-to-wear/knitwear/c/10054EU), para las prendas de punto.
- [Saint Laurent: sastrería femenina](https://www.ysl.com/en-sg/ca/shop-women/ready-to-wear?page=2), para Noir Signature.
- [Versace: vestidos de noche](https://www.versace.com/us/en/women/clothing/evening-dresses/), para el contraste de gala y brillo.
- [Dolce & Gabbana: vestidos de ocasión](https://www.dolcegabbana.com/en-us/fashion/women/clothing/dresses/), para la sensibilidad romántica de las selecciones de fiesta.

La interpretación de estas referencias utiliza nombres, formas y combinaciones propios, sin monogramas ni logotipos de las marcas. Maison no presenta una colaboración oficial ni atribuye sus artículos a esas casas.

[Ralph Lauren: punto trenzado y mocasines](https://www.ralphlauren.es/es/mujer/descubrir/verano/9030115/r/mocasines) y [falda de cuadros](https://www.ralphlauren.com/women-clothing-skirts/plaid-knit-jacquard-skirt/463555.html) orientan la sensibilidad preppy de Campus Pages y Country Weekend: capas, marfil, camel, burdeos y accesorios cotidianos.

`npm run media:prepare` prepara versiones de 600 píxeles y el manifiesto de tamaños. Las tarjetas y fichas utilizan `srcset` y `sizes`; las imágenes personalizadas conservan su ruta original.

## Campaña de portada con modelos

Cuatro fotografías editoriales generadas con la herramienta integrada de imágenes de OpenAI, optimizadas a WebP con Sharp: `hero-emerald.webp`, `hero-ivory.webp`, `hero-city.webp` y `hero-travel.webp`. Representan modelos adultas ficticias de 28–37 años, con diversidad de apariencia y looks de las colecciones Spotlight, Studio Ivory, City Pages y Travel Maison. La dirección visual toma como referencia la portada de [Armani](https://www.armani.com/es-es/), sin reutilizar sus fotografías ni vídeos.

Los cuatro clips se generaron en la web de Runway con Seedance 2.5 a partir de las fotografías originales: cinco segundos, formato vertical y sin audio. Los originales MOV se convirtieron con FFmpeg a MP4 H.264, con `faststart`, y se optimizaron para la web. Se sirven desde `frontend/public/media/hero-*.mp4`.

La portada reproduce un solo vídeo al pasar el cursor o enfocar el enlace y ofrece un botón de reproducción y pausa. Carga cada clip cuando se activa por primera vez, pausa al salir de pantalla o esconder la pestaña y respeta la preferencia de reducir movimiento. Las fotografías permanecen como portada y alternativa si falla la reproducción.

## Campaña «Todas tus eras»

La revisión de la portada parte de cuatro universos propios inspirados en el contraste entre las eras: Midnight Atelier (azotea nocturna, brillo y giro), Rosé Daydream (jardín rosa al atardecer, paseo y sonrisa), Woodland Stories (bosque, hojas y falda en movimiento) y Scarlet Avenue (avenida otoñal, pasos y bufanda). Las escenas mantienen modelos adultas ficticias y enlaces a las colecciones del catálogo.

Los prompts y parámetros de generación se conservan en [CAMPANA-ERAS.json](CAMPANA-ERAS.json). Se utiliza el conector de Runway para generar clips de diez segundos a 720p, verticales y sin audio. Los carteles se extraen del primer fotograma de cada clip con FFmpeg para conservar la continuidad visual; esta revisión no utiliza la herramienta de generación de imágenes. Los MP4 se optimizan con H.264 y `faststart` y los carteles se guardan como WebP.

## Película panorámica Maison

La idea del hero a todo el ancho parte de la revisión de `CinematicHero.jsx` de KelseTS Cars. Maison utiliza un componente propio, sin trasladar archivos ni vídeos de Cars: formato 16:9, reproducción silenciosa, pausa manual, pausa fuera de pantalla y al ocultar la pestaña, cartel estático con movimiento reducido.

La prueba narrativa se genera con el conector de Runway: cuatro escenas, quince segundos totales, una protagonista ficticia rubia y cambios de outfit, momento del día y estación. Una primera generación recibió prompts truncados por el servicio; se corrigieron a menos de 500 caracteres por escena y se generó una nueva prueba. La continuidad se evalúa visualmente y no se considera garantizada por el prompt.

El guion largo está en [PELICULA-MAISON.json](PELICULA-MAISON.json): doce clips de diez segundos y fundidos de medio segundo, duración objetivo de 114,5 segundos. Estos doce clips siguen pendientes; la prueba breve no se presenta como película de dos minutos. `scripts/assemble-maison-film.py` ensambla fuentes locales y permite añadir música con `--music`. Se ha verificado con dos vídeos de prueba y con un tono sintético temporal; en esa primera prueba no se había añadido música de Suno; la ampliación posterior utiliza la pista aportada por Araceli.

Las fuentes del montaje se ubican en `docbase/film-source`, fuera de Git. Ejecución prevista, cuando estén completas: `python3 scripts/assemble-maison-film.py docs/PELICULA-MAISON.json frontend/public/media/maison-film.mp4 --music docbase/film-source/maison-suno.wav`.

### Ampliación: lluvia, sastrería y gala

La identidad se referencia con un fotograma del tráiler a los 6,5 segundos. La escena de diez segundos de sastrería italiana bajo la lluvia se genera en Runway y cuesta 160 créditos. La imagen de gala con vestido azul, capa marfil y nieve se crea con la herramienta integrada de imágenes de OpenAI, sin consumir créditos de Runway. Su animación de cinco segundos utiliza Gen-4 Turbo y cuesta 25 créditos, dejando 47 en la cuenta. El presupuesto restante se conserva; no se realizan recargas.

El montaje reproducible y sus parámetros están en [MONTAJE-MAISON-CLIMAS.json](MONTAJE-MAISON-CLIMAS.json). El tráiler original se conserva en `maison-film-trailer.mp4`; las nuevas escenas se unen con fundidos de medio segundo. En esa etapa la película estaba sin audio; el montaje posterior incorpora la pista de Suno.

La escena de otoño se recupera mediante una edición de imagen que conserva abrigo, bufanda y bosque, pero utiliza el rostro de la protagonista del tráiler. Se anima cinco segundos con Gen-4 Turbo (25 créditos). Runway concede automáticamente 300 créditos por la misión «Generate with an App for 1st time», verificada en Quests; el saldo tras esta corrección es de 322 créditos. El reescalado desde el conector queda bloqueado por saldo, mientras que la App de la web funciona con el plan Pro y conserva el saldo. El primer máster reescalado mide 4096 × 2304.

Se revisa el catálogo oficial de skills de OpenAI y no se encuentra una skill específica de mejora de vídeo. Se utiliza Topaz AI a través de Upscale Video en la web de Runway. El catálogo consultado no es una afirmación sobre todas las skills o servicios disponibles.

### Montaje de un minuto y correcciones de movimiento

La ampliación incorpora cuatro imágenes creadas con la herramienta integrada de OpenAI y cuatro animaciones de diez segundos (200 créditos). Lago y esmoquin se regeneran para eliminar figuras secundarias y avanzar como en pasarela (100 créditos autorizados). La revisión de Araceli detecta además problemas de accesorio, cuello y pisada; Londres, esmoquin y burdeos se sustituyen por tres nuevas tomas de cinco segundos (75 créditos autorizados). No se realizan generaciones adicionales fuera de esos presupuestos. Tras la recarga realizada por Araceli, la última ronda parte de 7.272 créditos y termina en 7.197. Los prompts y el gasto están en [Correcciones de movimiento](CORRECCIONES-MAISON-MOVIMIENTO.json).

La pista «Runway Pulse», aportada por Araceli en `frontend/public/music/Runway Pulse.mp3`, contiene metadatos de Suno y dura 192,8535 segundos. El vídeo utiliza el inicio de la pista, audio AAC, ganancia 0,7 y fundidos de audio de dos segundos. No se genera música adicional. El ritmo del vídeo se ajusta a 0,85 conservando las escenas sin repetirlas.

### Cierre con cuatro nuevos looks

Se incorporan raya diplomática en Milán, cachemir en los Alpes, camisa Oxford y pantalón marfil en la Riviera y terciopelo negro en un hotel Art Déco. Las cuatro imágenes se crean con la herramienta integrada de OpenAI; sus animaciones de cinco segundos usan Gen-4 Turbo y consumen 100 créditos. Los prompts describen pasos cortos hacia delante, brazos relajados, cabeza alineada y cámara retrocediendo. Se revisan los fotogramas antes del montaje. [Prompts y presupuesto](CIERRE-MAISON-OUTFITS.json).

El reescalado del bloque de pasarela consumió 47 créditos tras la recarga y cambio de plan a Max; la previsión inicial de coste cero no se cumplió. La mejora del cierre de 18,67 segundos consume 37 créditos, dentro de los 40 adicionales autorizados. La App publica una tarifa de [2 créditos por segundo](https://runway.com/apps/upscale-video). El cierre suma 137 créditos y deja un saldo de 7.013. No se solicitan más generaciones ni mejoras pagadas.

El montaje final utiliza tres bloques fuente 4096×2304, fundidos de medio segundo y velocidad 0,85. FFmpeg exporta un máster privado 3840×2160 (CRF 18) y copias web 1920×1080 (CRF 20) y 2560×1440 (CRF 21), a 24 fotogramas por segundo, H.264, AAC 128 kb/s y `faststart`. Los originales de alta resolución permanecen en `docbase/film-source`, ignorado por Git. La mejora de resolución conserva el movimiento; no es una corrección de anatomía.

La revisión responsive consulta el menú de Cars como referencia de interacción. Maison mantiene su componente propio: menú desplegable hasta 1000 píxeles, cierre con Escape y al cambiar de ruta. Tras la revisión de Araceli, el hero móvil llena la altura disponible bajo la cabecera y mantiene los controles superpuestos. No se trasladan archivos ni recursos de Cars.

La copia móvil 1080×1440 se obtiene del máster 4K con recortes horizontales centrados por escena, conservando la altura original. La posición se interpola durante los fundidos. No consume créditos ni genera movimientos nuevos. [Parámetros del reencuadre](REENCUADRE-MAISON-MOBILE.json); ejecución: `python3 scripts/reframe-maison-film.py docs/REENCUADRE-MAISON-MOBILE.json docbase/film-source/maison-film-master-4k.mp4 frontend/public/media/maison-film-mobile.mp4`. La web ajusta el encuadre a la proporción del móvil y cambia la fuente al cruzar los puntos de corte de pantalla.

### Cuaderno ilustrado · revisión del 12 de octubre

Los bocetos originales de prendas, sin caras, se crean con la herramienta integrada de imágenes de OpenAI. Incluyen doce interpretaciones cotidianas de las eras, ropa de metro y deporte, sastrería y gala. Las nueve láminas de cuatro outfits se animan con Runway, Gen-4 Turbo, diez segundos a 720p y 50 créditos por bloque: 450 en total. El resultado no consigue la caminata clara pedida y no se presenta como entrega validada.

Una prueba posterior aísla el outfit de metro y explicita el ciclo de pasos con cámara fija. Dura cinco segundos y cuesta 25 créditos. Se conserva para revisar su movimiento antes de producir más tomas. Bocetos, prompts y fuentes se guardan en `docbase/hero-neutral-v1`, fuera de Git; [estado del montaje](PELICULA-MAISON-ILUSTRADA.json). No se han realizado reescalados pagados en esta revisión.

La prueba de caminata individual es aceptada por Araceli. La ampliación obtiene los otros 35 clips de cinco segundos con un gasto neto de 875 créditos, dentro del límite autorizado; tres tareas fallidas devuelven 75 créditos. Se crean once fotogramas individuales nuevos con la herramienta integrada de imágenes de OpenAI, manteniendo las prendas como referencia y dando espacio al suelo. Las fuentes, tareas y prompts se conservan en privado.

`scripts/assemble-maison-sketch-walk.py` compone nueve bloques de cuatro looks para escritorio y una edición vertical de 36 planos para móvil, con la pista Runway Pulse aportada por Araceli. Las salidas son H.264 1080p/1080×1440, con reescalado convencional de fuentes 720×1280. No se describen como máster 4K ni como mejora de nitidez generativa. El borrador contiene 23 caminatas claras y trece poses casi fijas; continúa pendiente de cierre visual. [Parámetros y estado real](PELICULA-MAISON-ILUSTRADA.json).

Tras rechazar el montaje frontal, se explora una pasarela lateral con dibujos transparentes en perfil y un fondo panorámico continuo. La herramienta integrada de imágenes de OpenAI crea las prendas y sus poses; FFmpeg realiza el desplazamiento y la composición. La prueba de veinte segundos no consume créditos de Runway. No se presenta todavía como hero terminado ni como ampliación de los 36 looks.

La prueba lateral es aceptada y se amplía a los 36 looks con un ritmo más lento: poses a 3,75 fps (25 % menos) y avance de 200 px/s en escritorio (aproximadamente 17 % menos). La edición final dura 90 segundos, incorpora Runway Pulse y se integra en la portada local. Exportaciones H.264/AAC a 24 fps: 1920×1080 y 1080×1920. Se generan las poses restantes con la herramienta integrada de imágenes de OpenAI y se componen con FFmpeg; esta ampliación no consume créditos de Runway. Las fuentes y prompts quedan privados. [Parámetros de la versión aceptada](PELICULA-MAISON-LATERAL.json).

### The Runway Wardrobe · catálogo de la pasarela

Los 36 outfits de la película se trasladan al catálogo como 139 piezas independientes, manteniendo los 51 productos anteriores. [La selección reproducible](../data/runway-edit.json) relaciona cada outfit con su número de desfile, nombre editorial, prendas y precios de demostración. La galería muestra el conjunto y cada ficha utiliza una fotografía individual generada de la pieza. Las prendas pueden añadirse por separado o como una selección completa con una variante por artículo.

La herramienta integrada de imágenes de OpenAI transforma las referencias ilustradas en composiciones fotográficas de producto. Las hojas originales y sus prompts quedan en `docbase/catalog-runway-v1`, fuera de Git. `scripts/prepare-runway-media.mjs` extrae las celdas y convierte los recursos a WebP con Sharp. No se utilizan fotografías oficiales de celebridades ni imágenes comerciales de terceros, y no se consumen créditos adicionales de Runway.

Los precios son ficticios propios, orientados por los rangos consultados el 12 de octubre de 2026 en [Giorgio Armani](https://www.armani.com/es-es/giorgio-armani/mujer/ropa/) y [Emporio Armani](https://www.armani.com/es-es/emporio-armani/mujer/ropa/). Como referencias de escala, la primera colección mostraba una americana a 2.000 €, un jersey a 1.000 € y pantalones a 890 €; la segunda, camisetas a 290 €. No son precios de artículos de esas marcas en Maison ni se copian sus fichas o fotografías.

Los nombres de los 36 looks adoptan títulos de canciones de Taylor Swift a petición de Araceli; los doce álbumes aparecen como filtro de inspiración editorial. Se consultan los catálogos de [Taylor Swift en Apple Music](https://music.apple.com/us/artist/taylor-swift/159260351), [1989](https://taylor.lnk.to/1989dlx), [Midnights](https://taylor.lnk.to/midnights), [Fearless](https://storeuk.taylorswift.com/products/fearless-taylors-version-cd) y [The Life of a Showgirl](https://music.apple.com/us/album/the-life-of-a-showgirl/1838810949). No se reproducen letras ni grabaciones de estas canciones. La asignación entre canción y prendas es una decisión creativa de Maison y no una colección oficial. El audio de la película continúa siendo Runway Pulse de Suno.

Las imágenes individuales se extraen sin reescalado generativo: celdas de 512×512 y fotografías de conjunto de 384×1024, convertidas a WebP. Se revisa la distribución de todas las hojas; en la hoja de gala 2 los zapatos ocupan la celda inferior izquierda y el script recoge esa posición. La fotografía del chal de gala 4 se corrige para mostrar una pieza sin mangas. Los tres primeros paneles de gala conservan la variante original revisada, con el mono de dos perneras en el tercero. Los prompts finales y estas decisiones quedan en `docbase/catalog-runway-v1/prompts-final.json`.

## Nombres musicales de producto · 17 de octubre

A petición de Araceli, los 51 artículos anteriores a la pasarela adoptan títulos de canciones de Taylor Swift. La correspondencia ES/EN y los nombres originales se conservan en `data/song-product-names.json`. Ejemplos: vestido Enchanted, pendientes Daylight, perfume Sweet Nothing y cárdigan cardigan. La relación entre canción y pieza es una decisión editorial de Maison. Las 139 piezas de pasarela ya tenían nombres musicales. Se mantienen las imágenes y descripciones de producto; no se incorporan letras, grabaciones ni imágenes de la artista.

El comando `npm run catalog:names:migrate` actualiza solo las traducciones que aún coinciden con sus nombres originales y aumenta su revisión. Respeta las traducciones personalizadas por Team, las variantes, las existencias, los precios y las líneas históricas de pedidos.
