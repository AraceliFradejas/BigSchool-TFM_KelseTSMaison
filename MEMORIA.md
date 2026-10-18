# Memoria del proyecto KelseTS Maison

| Dato        | Información                                                       |
| ----------- | ----------------------------------------------------------------- |
| Proyecto    | Boutique ficticia de moda, accesorios y belleza                   |
| Formación   | TFM BigSchool                                                     |
| Autora      | Araceli Fradejas Muñoz                                            |
| Tecnologías | JavaScript, React, Node.js, Express, MongoDB y Cloudinary; SQLite local                      |
| Estado      | Primera versión publicada en Vercel, pendiente de cierre final |

## 1 Contexto y motivación

KelseTS Maison nace como una nueva historia dentro de la marca ficticia que he utilizado en otros proyectos de mi portfolio. Me interesa que la propuesta tenga una identidad personal y una utilidad clara. En este caso, el punto de partida es una persona que encuentra una prenda que le gusta, pero necesita elegir su variante y descubrir qué accesorios o productos de belleza pueden acompañarla.

La moda ya estaba presente en AFM Moda Oceánica, una landing centrada en presentar una marca y una selección de prendas. KelseTS Cars incorporó una aplicación full stack con catálogo, cuentas y gestión privada. Maison continúa ese aprendizaje y lo lleva a un recorrido de tienda, con sus propias reglas de productos, stock y pedidos.

La música, las historias compartidas y el deporte inspiran el universo creativo. Los nombres y los productos son ficticios, sin presentar a personas o entidades reales como patrocinadores. «Tu estilo cuenta una historia» reúne esa intención.

## 2 Objetivos y alcance

El recorrido principal conecta portada, catálogo, ficha, elección de variante, bolsa y pedido de demostración. La cuenta permite conservar favoritos y consultar pedidos y comunicaciones. Team gestiona el catálogo y los estados del pedido.

La diferencia editorial está en «Completa tu look»: dieciséis colecciones reúnen prendas, calzado, bolsos, joyería y propuestas de belleza en veintiuna selecciones manuales y los treinta y seis looks de la pasarela. El buscador de combinaciones comprueba ocasión, paleta, presupuesto y stock. Esta primera versión utiliza reglas y selecciones manuales; no hace peticiones a un modelo de IA.

La web tiene textos en castellano e inglés y CSS responsive. La app nativa ya tiene una primera versión con catálogo, outfits y bolsa local, descrita más adelante. La integración con un proveedor de IA, las boutiques y las citas siguen pendientes. La web ya está publicada en [Vercel](https://kelsets-maison.vercel.app); las slides finales y las ampliaciones siguen pendientes de cierre.

## 3 Organización técnica

He mantenido JavaScript y React por continuidad con los proyectos anteriores. El backend se organiza por acceso, catálogo, pedidos e imágenes. En la web, cada funcionalidad tiene sus páginas y los elementos comunes se encuentran en `shared`. Dos paquetes reúnen los contratos y el transporte HTTP.

SQLite permite arrancar la demostración con una base independiente sin configurar servicios externos. Esta elección facilita la prueba local. Para publicar mantengo la continuidad con Cars: Vercel, MongoDB y Cloudinary propios de Maison. He preparado la adaptación con transacciones y sesiones persistentes; la conexión a Atlas y Cloudinary y un recorrido HTTP de gestión y pedido ya se han comprobado. La web y la API están publicadas en Vercel. No sirve guardar la base en un sistema temporal y esperar que los pedidos se conserven entre ejecuciones. La [arquitectura](docs/ARQUITECTURA.md) recoge esta decisión y sus límites.

El cliente HTTP parte del transporte de KelseTS Cars, revisado y adaptado a Maison. Las rutas de vehículos y citas se han sustituido por las necesidades de la boutique. No se ha trasladado el historial del repositorio, sus datos de producción, sus cuentas ni sus secretos.

## 4 Catálogo e identidad visual

El catálogo actual contiene ciento noventa productos ficticios, incluidos los conjuntos y las piezas de los treinta y seis looks de pasarela, repartidos entre Moda, Accesorios y Belleza. Cada producto tiene nombre y descripción ES/EN, colección, imagen y variantes. Las tallas, tonos o formatos pertenecen a cada variante, junto con su precio y existencias. Algunas tallas empiezan agotadas para hacer visible ese estado.

La primera propuesta visual utiliza marfil, negro suave y el rojo KelseTS `#b3152b`. El logo mantiene el dibujo vectorial utilizado en Cars con el subtítulo Maison. La portada presenta una escena de boutique y las colecciones se diferencian con colores de apoyo. DM Sans se utiliza en la interfaz y Playfair Display en los títulos. Las fuentes se sirven desde la propia aplicación.

El catálogo utiliza representaciones fotorrealistas generadas para los cincuenta y un productos ficticios y tres escenas editoriales. Los envases de perfume y cosméticos incorporan el logo de Maison. La inspiración swiftie combina satén, rojo, romanticismo y punto para pasar de ocasiones especiales al día a día. No presento estas imágenes como una sesión fotográfica de mercancía real. Los SVG anteriores se conservan para respetar las imágenes guardadas en pedidos históricos.

## 5 Cuenta y selección personal

La persona puede registrarse con un correo ficticio y una contraseña propia. La contraseña se guarda mediante una derivación `scrypt` con sal aleatoria. La sesión utiliza una cookie HttpOnly y un token opaco; la base guarda su hash, no el token original. El rol siempre se comprueba en el servidor.

La bolsa conserva identificadores y cantidades en el navegador. Los precios se consultan al abrirla y vuelven a calcularse en el servidor al crear el pedido. La bolsa se guarda por cuenta, con un espacio separado para visitantes. Los favoritos pertenecen a cada usuario y no se muestran a otras cuentas.

## 6 Reglas del pedido

Un pedido de demostración no solicita datos bancarios ni direcciones. Su creación valida las líneas, comprueba la disponibilidad y descuenta las existencias dentro de una transacción. Si una variante falla, se recupera lo descontado en las demás líneas.

La bolsa tiene una clave de idempotencia. El servidor relaciona esa clave con la cuenta y con las líneas solicitadas. Una repetición idéntica devuelve el pedido anterior; si la misma clave se usa para otro contenido, devuelve un conflicto. Así se evita duplicar el pedido ante un doble envío o una respuesta perdida.

Las líneas guardan una copia del nombre, variante, imagen y precio del momento. Team puede pasar de pendiente a confirmado, después simular envío y entrega. La cancelación solo se permite antes del envío y devuelve las unidades una vez. El catálogo también tiene un número de revisión para impedir que una edición antigua sobrescriba el stock cambiado por un pedido.

## 7 Comunicaciones y administración

La creación del pedido y cada cambio válido de estado generan una comunicación para su cliente. Los mensajes tienen versiones ES/EN y se guardan junto con el cambio dentro de la misma transacción. No se envían correos externos en esta versión.

Team puede crear y editar productos, ocultarlos del catálogo, cambiar variantes y existencias y subir imágenes. El servidor comprueba el formato real de las imágenes y Sharp las decodifica, orienta, reduce y convierte a WebP. Las imágenes originales subidas no se conservan. Una variante de un pedido pendiente o confirmado no se puede eliminar, porque sería necesaria para devolver el stock si se cancela.

## 8 Validación realizada

La [validación](docs/VALIDACION.md) recoge el entorno y las comprobaciones efectivamente ejecutadas. Las pruebas de API cubren permisos, privacidad, cálculos, pedidos duplicados, competencia por stock, cancelaciones, estados, edición con datos desactualizados y archivos de imagen.

En Safari se ha recorrido la ficha, una talla agotada, la bolsa, el cambio de idioma, el acceso, la creación de un pedido, el historial, su comunicación y la confirmación desde Team. Las [evidencias](docs/evidencias/README.md) identifican las capturas y sus límites. Las comprobaciones posteriores del despliegue y de la app en dispositivos reales se recogen en las secciones siguientes. Siguen pendientes el lector de pantalla, el contenedor Docker y completar los recorridos indicados en la validación.

## 9 Dificultades y decisiones pendientes

La primera decisión ha sido mantener la aplicación utilizable sin servicios contratados. SQLite resuelve esa necesidad local, pero obliga a decidir dónde conservar la base en el despliegue o a migrar la persistencia. El destino elegido es Vercel con MongoDB y Cloudinary. He revisado el código y las evidencias de Cars para conservar su patrón de web y API separadas, conexión reutilizada y entrega de imágenes mediante la API. Maison utiliza el driver oficial de MongoDB y mantiene sus reglas propias de pedidos.

La disponibilidad afecta a varias pantallas, aunque se decide en un único lugar: el servidor. Un producto visto hace unos minutos puede haberse agotado y una pantalla de Team puede tener datos antiguos. Las transacciones, las respuestas de conflicto y la revisión del producto cubren esas situaciones.

Antes de cerrar el TFM quiero completar la revisión en dispositivos reales y preparar las slides sobre lo que he construido. Los servicios de Maison ya están configurados en Vercel y la app nativa tiene una primera versión. La integración de IA sigue pendiente.

La ampliación swiftie añade vestidos de gala, sastrería, cuadros, botas, denim y punto. La selección de lujo incluye gabardinas, cachemir, lana, tul, terciopelo, piel, satén y joyería. Los looks se exploran por eventos, entrevistas y TV, estilo de calle o día a día. El buscador contempla verdes y plateados y mantiene la comprobación de presupuesto y existencias. Los precios y materiales describen artículos ficticios; no acreditan mercancía real.

Los precios del catálogo se han contrastado con referencias oficiales de Saint Laurent, Gucci y Prada y ajustado por categoría. El criterio y los enlaces están en [Precios](docs/PRECIOS.md). Una migración explícita actualiza los precios originales de demostración, preserva los cambios de Team y mantiene los pedidos históricos con sus importes originales.

La portada incorpora cuatro escenas con modelos adultas ficticias y una dirección multicultural: gala verde, traje marfil, estilo urbano y viaje en camel. Cada escena enlaza con su colección. Las fotografías originales se animaron en Runway y los cuatro clips se optimizaron con FFmpeg. La portada reproduce un vídeo cada vez al pasar el cursor y dispone de controles de reproducción y pausa. Se ha comprobado la activación de los cuatro clips en Safari de escritorio; la revisión en un móvil real sigue pendiente.

La campaña de portada se revisó para reflejar mejor el contraste entre las eras: azotea nocturna, jardín rosa, bosque y avenida otoñal. Los cuatro nuevos clips duran diez segundos y combinan caminatas, giros y movimiento de prendas, con nombres propios Midnight Atelier, Rosé Daydream, Woodland Stories y Scarlet Avenue. Los carteles proceden de sus primeros fotogramas para evitar cambios de escena al iniciar el vídeo.

La película panorámica evoluciona desde un tráiler de quince segundos a un montaje de más de un minuto con primavera, verano, otoño, lluvia, nieve, lino junto al lago, esmoquin, blazer con denim y gala burdeos. La escena de la bufanda se recupera corrigiendo la identidad de la protagonista. Se conserva debajo la selección multicultural de cuatro campañas.

La revisión de movimiento detectó figuras secundarias, duplicación y levitación de bolsos, una torsión de cuello y una pisada poco natural. Las tomas de lago y esmoquin se sustituyeron primero; después se rehacen Londres, esmoquin y gala burdeos con fotogramas de postura neutral y prompts de pasos cortos, brazos relajados y cabeza alineada. Se revisan los resultados antes de incorporarlos. La última ronda utiliza tres clips de cinco segundos y consume los setenta y cinco créditos autorizados. El montaje previo no se considera una entrega validada.

Para la música he utilizado «Runway Pulse», que creé en Suno. La portada comienza silenciada y permite activar o silenciar el sonido y pausar la película. FFmpeg permite reproducir el montaje con fundidos, velocidad de reproducción configurable y audio con entrada y salida suaves. Topaz AI mediante la App de Runway mejora las fuentes; los másteres grandes se mantienen fuera de Git. El guion de casi dos minutos continúa como ampliación pendiente.

El cierre añade cuatro looks: sastrería de raya diplomática en Milán, cachemir en los Alpes, estilo Oxford junto al Mediterráneo y terciopelo negro de noche. Sus cuatro animaciones consumen 100 créditos y la mejora de resolución 37, dentro del máximo de 140 autorizado. El montaje reúne catorce looks en aproximadamente un minuto y veintitrés segundos, con la música de Suno. Se exporta un máster 4K privado y versiones de 1080p y 1440p para la web.

La última revisión móvil toma Cars como referencia de interacción. El menú hamburguesa se extiende a tablet e incluye Mi cuenta. La película recibe una copia vertical con encuadres ajustados por escena y llena la altura disponible del móvil, con textos y controles superpuestos. Se comprueba mediante emulación de Chrome; la prueba en un teléfono físico sigue pendiente.

## 12 Del cuaderno al catálogo

La portada evoluciona a una pasarela lateral de prendas ilustradas, sin caras, con 36 outfits y un recorrido de noventa segundos. Para conectar esa historia con la tienda, cada outfit tiene una selección editorial con sus prendas, calzado y accesorios. Se conservan los 51 artículos anteriores y se añaden 139 piezas: el catálogo reproducible reúne 190 productos y 996 variantes.

Se puede abrir la ficha de una pieza o elegir la variante de cada artículo y añadir el look completo. El conjunto se guarda como líneas individuales de la bolsa; no crea un segundo inventario ni aplica un precio separado. La selección se comprueba antes de modificar el carrito, y el backend vuelve a validar cantidades, stock y precios al crear el pedido de demostración.

Las fotografías de las piezas son representaciones generadas de los diseños ficticios. Las fuentes y los prompts se conservan en privado; los recursos WebP de la web quedan vinculados a los identificadores del catálogo. La dirección busca mantener el carácter del cuaderno y mostrar tejidos, costuras y acabados con un aspecto realista.

La revisión de los nombres añade títulos de canciones de Taylor Swift a los 36 looks y a sus piezas, manteniendo los identificadores de inventario. La galería permite filtrar por ambiente y por era. Los títulos son una referencia editorial; la música de la película sigue siendo la pista de Suno aportada para Maison.

## 13 Del catálogo a un pedido de demostración

Con 190 piezas, encontrar una talla y respetar un presupuesto resulta más importante. Los filtros de talla, precio máximo y disponibilidad comprueban la misma variante: no basta con que otra talla sea más barata o tenga existencias. Volver desde una ficha conserva los filtros de catálogo.

La bolsa identifica qué pieza necesita una corrección de cantidad y permite actualizar sus precios y existencias. Team incorpora búsqueda por nombre en ambos idiomas o identificador y un filtro de artículos visibles y archivados. El editor señala las traducciones pendientes antes de guardar, manteniendo también la validación del servidor.

El recorrido se ha comprobado en Edge sobre una copia aislada: acceso, favoritos, elección de talla, ajuste por cambio de stock, pedido, historial, comunicaciones y confirmación y cancelación desde Team. También se ha creado un producto bilingüe y subido su fotografía desde la interfaz. Los datos de esa revisión no alteran las cuentas ni las existencias de la instalación principal. Los detalles y límites de la revisión responsive están en la validación.


## 14 Evidencias de la versión publicada

El 18 de octubre de 2026 se guardan diecinueve capturas originales de Chrome sobre la web publicada en Vercel: portada, catálogo de 190 piezas, ficha con variantes, cuenta con sesión iniciada y gestión de productos de Team. El [índice de capturas](docs/evidencias/produccion-2026-10-18/README.md) reúne las imágenes y los pies para incorporarlos a la memoria final.

Las capturas conservan la dirección pública y describen el estado observado. La cuenta aparece sin pedidos ni comunicaciones; no se utiliza esa imagen como prueba de un pedido o de envío de correo. La ampliación posterior incorpora cuenta y bolsa en inglés, creación de un pedido, confirmación y cancelación desde Team, tres comunicaciones internas, devolución del stock, editor en ambos idiomas y portada y menú en emulación de iPhone SE (375 × 667). El pedido queda cancelado en el historial; la talla M recupera sus ocho unidades. Se sale del editor sin guardar cambios. La secuencia posterior documenta además la subida de una imagen, la creación de una pieza temporal archivada y su reapertura con los datos guardados. Se retiran después esa pieza, su variante y su imagen de prueba, conservando los 190 productos anteriores. La prueba en teléfono físico queda pendiente.


## 15 Primer paso hacia la app nativa

Después de publicar la boutique, decidí continuar con la app móvil antes de abordar el asistente de outfits. He mantenido React y JavaScript, esta vez con React Native y Expo SDK 57. La app consulta la misma API HTTPS de Maison, sin incrustar la web. La primera etapa incluye catálogo, búsqueda, categorías, ficha, variantes y bolsa local en castellano e inglés.

La bolsa guarda identificadores y cantidades, y consulta de nuevo los precios y las existencias al abrirse. Las reglas para añadir cantidades son compartidas con la web. Así mantengo el mismo comportamiento en las dos interfaces sin duplicar el inventario.

### Outfits y bienvenida

Al abrir Maison en iPhone y Android vi que los controles resultaban demasiado cuadrados y se parecían demasiado a los de la web. He ajustado las acciones, los estados de selección y el cambio de idioma para cada plataforma. La barra inferior sigue siendo personalizada y conserva la identidad de Maison.

También quería encontrar en la app los conjuntos completos de la pasarela. La pestaña Outfits reúne los 36 looks con títulos de canciones, filtro por era y detalle de sus piezas. Para añadir un conjunto hay que elegir una variante disponible de cada pieza. La selección se combina completa con la bolsa; si supera el stock, no se añaden piezas sueltas. La cesta incorpora las fotos y permite volver a la ficha de cada producto.

He unificado la presentación de los importes en castellano e inglés: **1.850,00 €**, con punto de miles, coma decimal y dos decimales. El idioma de la interfaz cambia los textos, pero no este criterio de presentación. Los valores se siguen guardando en céntimos.

Para la entrada he elegido una animación breve del logo, que se puede saltar y respeta la reducción de movimiento. La primera versión solo ocupaba el área inferior; al revisarla, se cambió a una pantalla modal completa. Después comprobé la entrada y la interfaz corregidas en iPhone e iPad. He preparado además el logo estático para el arranque de una futura distribución, aunque ese splash requiere comprobarse en un binario propio y no en Expo Go.

### Pruebas en mis dispositivos · 18 de octubre de 2026

He abierto la app con Expo Go en iPhone, iPad y Android. En Android apareció un error durante la actualización en caliente, cuando Metro todavía estaba resolviendo los archivos nuevos de Outfits. Tras reiniciar Metro con la caché limpia, pude volver a cargarla. Esta revisión me ha permitido comprobar el arranque y detectar ajustes visuales, pero todavía tengo que completar el recorrido de outfits y bolsa en cada dispositivo.

| Plataforma | Dispositivo y sistema | Expo Go | Resultado de esta revisión |
| --- | --- | --- | --- |
| iPhone · iOS | iPhone 13 · iOS 26.6.1 | 57.0.9 | Apertura y entrada/interfaz corregidas correctas |
| iPad · iPadOS | iPad de 6.ª generación · sistema 17.7.0 | 57.0.9 | Apertura y entrada/interfaz corregidas correctas |
| Android | Samsung Galaxy A34 · Android 16 | 57.0.9 | Apertura y recuperación después de limpiar la caché de Metro |

Para estas pruebas he utilizado **Expo Go 57.0.9**. La app está en la versión **0.1.0**, con **Expo 57.0.30 (SDK 57), React Native 0.86.3, React 19.2.3 y expo-splash-screen 57.0.10**. He dejado estas versiones registradas para poder reproducir el entorno de desarrollo.

La exportación genera los paquetes Hermes de iOS y Android y Expo Doctor supera sus 21 comprobaciones. Las pruebas automáticas de formato recorren las 996 variantes del catálogo y cantidades desde cero hasta millones en ambos idiomas. Estas comprobaciones técnicas complementan la revisión en los dispositivos; no sustituyen el recorrido manual completo.

Por ahora ejecuto la app con Expo Go y Metro. Quiero completar las capturas nativas, comprobar la conservación de la bolsa al cerrar y abrir, los cambios de conexión y la accesibilidad en cada dispositivo. Acceso, favoritos, pedidos e historial de cuenta, Team e IA siguen pendientes en la app, al igual que la distribución en tiendas. La [guía móvil](mobile/README.md) recoge el arranque y la [validación](docs/VALIDACION.md) conserva el detalle de las comprobaciones.
