# Memoria del proyecto KelseTS Maison

| Dato        | Información                                                             |
| ----------- | ----------------------------------------------------------------------- |
| Proyecto    | Boutique ficticia de moda, accesorios y belleza                         |
| Formación   | TFM BigSchool                                                           |
| Autora      | Araceli Fradejas Muñoz                                                  |
| Tecnologías | JavaScript, React, Node.js, Express, MongoDB y Cloudinary; SQLite local |
| Estado      | Primera versión publicada en Vercel, pendiente de cierre final          |

## 1 Contexto y motivación

KelseTS Maison nace como una nueva historia dentro de la marca ficticia que he utilizado en otros proyectos de mi portfolio. Me interesa que la propuesta tenga una identidad personal y una utilidad clara. En este caso, el punto de partida es una persona que encuentra una prenda que le gusta, pero necesita elegir su variante y descubrir qué accesorios o productos de belleza pueden acompañarla.

La moda ya estaba presente en AFM Moda Oceánica, una landing centrada en presentar una marca y una selección de prendas. KelseTS Cars incorporó una aplicación full stack con catálogo, cuentas y gestión privada. Maison continúa ese aprendizaje y lo lleva a un recorrido de tienda, con sus propias reglas de productos, stock y pedidos.

La música, las historias compartidas y el deporte inspiran el universo creativo. Los nombres y los productos son ficticios, sin presentar a personas o entidades reales como patrocinadores. «Tu estilo cuenta una historia» reúne esa intención.

## 2 Objetivos y alcance

El recorrido principal conecta portada, catálogo, ficha, elección de variante, bolsa y pedido de demostración. La cuenta permite conservar favoritos y consultar pedidos y comunicaciones. Team gestiona el catálogo y los estados del pedido.

La diferencia editorial está en «Completa tu look»: dieciséis colecciones reúnen prendas, calzado, bolsos, joyería y propuestas de belleza en veintiuna selecciones manuales y los treinta y seis looks de la pasarela. El buscador de combinaciones comprueba ocasión, paleta, presupuesto y stock. La versión pública utiliza reglas y selecciones manuales. Maison Stylist añade un chat con fotos y enlaces, con la integración de modelos preparada y ensayada de forma individual, todavía desactivada en producción.

La web tiene textos en castellano e inglés y CSS responsive. La app nativa tiene catálogo, outfits, sesión, bolsa por cuenta, pago simulado, pedidos y boutiques, descritos más adelante; falta completar la validación física de ese recorrido. He incorporado boutiques ficticias con mapa y entrega simulada. La integración Gemini → Claude → OpenAI está preparada y se ha probado con datos ficticios; quedan pendientes su activación pública, una evaluación más amplia y las citas. La web ya está publicada en [Vercel](https://kelsets-maison.vercel.app); las slides finales y las ampliaciones siguen pendientes de cierre.

## 3 Organización técnica

He mantenido JavaScript y React por continuidad con los proyectos anteriores. El backend se organiza por acceso, catálogo, pedidos e imágenes. En la web, cada funcionalidad tiene sus páginas y los elementos comunes se encuentran en `shared`. Dos paquetes reúnen los contratos y el transporte HTTP.

SQLite permite arrancar la demostración con una base independiente sin configurar servicios externos. Esta elección facilita la prueba local. Para publicar mantengo la continuidad con Cars: Vercel, MongoDB y Cloudinary propios de Maison. He preparado la adaptación con transacciones y sesiones persistentes; la conexión a Atlas y Cloudinary y un recorrido HTTP de gestión y pedido ya se han comprobado. La web y la API están publicadas en Vercel. No sirve guardar la base en un sistema temporal y esperar que los pedidos se conserven entre ejecuciones. La [arquitectura](docs/ARQUITECTURA.md) recoge esta decisión y sus límites.

El cliente HTTP parte del transporte de KelseTS Cars, revisado y adaptado a Maison. Las rutas de vehículos y citas se han sustituido por las necesidades de la boutique. No se ha trasladado el historial del repositorio, sus datos de producción, sus cuentas ni sus secretos.

## 4 Catálogo e identidad visual

El catálogo actual contiene ciento noventa productos ficticios, incluidos los conjuntos y las piezas de los treinta y seis looks de pasarela, repartidos entre Moda, Accesorios y Belleza. Cada producto tiene nombre y descripción ES/EN, colección, imagen y variantes. Las tallas, tonos o formatos pertenecen a cada variante, junto con su precio y existencias. Algunas tallas empiezan agotadas para hacer visible ese estado.

La primera propuesta visual utiliza marfil, negro suave y el rojo KelseTS `#b3152b`. El logo mantiene el dibujo vectorial utilizado en Cars con el subtítulo Maison. La portada presenta una escena de boutique y las colecciones se diferencian con colores de apoyo. DM Sans se utiliza en la interfaz y Playfair Display en los títulos. Las fuentes se sirven desde la propia aplicación.

El catálogo utiliza representaciones fotorrealistas generadas para los cincuenta y un productos ficticios y tres escenas editoriales. Los envases de perfume y cosméticos incorporan el logo de Maison. La inspiración swiftie combina satén, rojo, romanticismo y punto para pasar de ocasiones especiales al día a día. No presento estas imágenes como una sesión fotográfica de mercancía real. Los SVG anteriores se conservan para respetar las imágenes guardadas en pedidos históricos.

### Revisión editorial de portada · 7 de noviembre de 2026

He sustituido la cuadrícula textual de colecciones por un carrusel de dieciséis portadas editoriales generadas para esta sección, sin repetir imágenes de los vídeos. Las imágenes se sirven en WebP con tamaños adaptados y cada tarjeta enlaza a su colección. El bloque «Del cuaderno a tu armario» incorpora una composición burdeos con tres looks existentes y acceso a sus fichas y a la pasarela. He retirado la firma personal que aparecía aislada junto a las campañas y conservado mi autoría y redes en los espacios de historia, créditos y pie de página. Los recursos y sus referencias están registrados en la documentación del proyecto.

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

| Plataforma    | Dispositivo y sistema                   | Expo Go | Resultado de esta revisión                                   |
| ------------- | --------------------------------------- | ------- | ------------------------------------------------------------ |
| iPhone · iOS  | iPhone 13 · iOS 26.6.1                  | 57.0.9  | Apertura y entrada/interfaz corregidas correctas             |
| iPad · iPadOS | iPad de 6.ª generación · sistema 17.7.0 | 57.0.9  | Apertura y entrada/interfaz corregidas correctas             |
| Android       | Samsung Galaxy A34 · Android 16         | 57.0.9  | Apertura y recuperación después de limpiar la caché de Metro |

Para estas pruebas he utilizado **Expo Go 57.0.9**. La app está en la versión **0.1.0**, con **Expo 57.0.30 (SDK 57), React Native 0.86.3, React 19.2.3 y expo-splash-screen 57.0.10**. He dejado estas versiones registradas para poder reproducir el entorno de desarrollo.

La exportación genera los paquetes Hermes de iOS y Android y Expo Doctor supera sus 21 comprobaciones. Las pruebas automáticas de formato recorren las 996 variantes del catálogo y cantidades desde cero hasta millones en ambos idiomas. Estas comprobaciones técnicas complementan la revisión en los dispositivos; no sustituyen el recorrido manual completo.

Por ahora ejecuto la app con Expo Go y Metro. Quiero completar las capturas nativas, comprobar la conservación de la bolsa al cerrar y abrir, los cambios de conexión y la accesibilidad en cada dispositivo. Acceso, favoritos, pedidos e historial de cuenta, Team e IA siguen pendientes en la app, al igual que la distribución en tiendas. La [guía móvil](mobile/README.md) recoge el arranque y la [validación](docs/VALIDACION.md) conserva el detalle de las comprobaciones.

## Ampliación: pago académico simulado en web y app

He preparado una revisión final del pedido para acercar la experiencia a una boutique sin realizar ninguna compra. Puedo escoger cuenta bancaria ficticia, tarjeta ficticia o PayPal simulado; la app añade Apple Pay simulado en iOS y Samsung Pay simulado en Android. Estas opciones no se conectan a ningún proveedor y no recogen datos bancarios. Antes de confirmar acepto expresamente que se trata de una simulación académica. El botón indica «Confirmar pago simulado».

El resultado aceptado registra un pedido de demostración pendiente y genera su comunicación interna. El justificante conserva el método elegido, una referencia DEMO y el importe simulado; muestra siempre un cargo real de 0,00 €. También puedo elegir un resultado rechazado: no crea el pedido ni descuenta stock. No hay pasarela de pago, cobros, devoluciones monetarias ni envíos reales.

La API calcula el importe a partir del catálogo, comprueba que coincide con el total revisado y aplica pedido, stock y comunicación dentro de una transacción. La clave del intento evita duplicados si repito la confirmación. He comprobado estas reglas con SQLite y una réplica temporal de MongoDB, incluidos rechazo, cambio de importe, concurrencia y conservación del justificante al cancelar. Las pruebas no realizan operaciones en un banco ni en servicios de pago.

Para consultar los resultados desde la app he incorporado acceso, registro, historial y comunicaciones. La bolsa se separa por cuenta y no guardo contraseñas en el almacenamiento local. La app verifica la sesión contra la API después de acceder y salir. Queda pendiente comprobar este nuevo recorrido privado en mis tres dispositivos; las pruebas anteriores de apertura y la generación de bundles no sustituyen esa comprobación.

## Ampliación: destinatario, entrega y boutiques ficticias

He ampliado la compra de demostración para poder indicar quién recibe la selección y elegir entre domicilio y recogida. Primero completo los datos de entrega y después reviso la selección, el destino y el pago ficticio. La cuenta identifica al cliente y el pedido conserva el nombre del destinatario. En domicilio guardo calle, código postal, localidad y zona; en recogida guardo la boutique elegida, sin añadir una dirección personal innecesaria.

Por el momento he limitado el domicilio a la Comunidad de Madrid, Barcelona ciudad y Marbella. La API valida que el código postal pertenezca a las reglas de la zona seleccionada. Esta validación orientativa no verifica que una dirección exista ni conecta con un transportista. Pido datos ficticios para la demostración.

He creado tres boutiques ficticias: Maison · Milla de Oro, en el entorno de Serrano y el barrio de Salamanca de Madrid; Maison · Passeig de Gràcia, en Barcelona; y Maison · Puerto Banús, en Marbella. No corresponden a locales reales de Maison ni implican acuerdos con tiendas de esas calles. Los puntos del mapa son aproximados. He revisado el patrón de sedes de KelseTS Cars y adaptado la presentación del mapa, fotografías del entorno, enlaces a Street View y cálculo de distancias, conservando los créditos de autoría y las licencias de las fotos. No he trasladado credenciales ni datos de Cars.

El mapa web utiliza Leaflet y OpenStreetMap; la app utiliza react-native-maps. Las fotografías de Wikimedia Commons muestran el entorno real y llevan autor, fuente y licencia; no las presento como fotos de un escaparate Maison ni como capturas de Google Street View. El enlace a Street View permite explorar la calle en Google Maps. Las copias WebP conservan su licencia y tienen el cambio de formato y tamaño indicado.

La ubicación es opcional y solo se solicita al pulsar el botón de distancia. También puedo elegir manualmente un punto en el mapa. Calculo kilómetros en línea recta dentro del cliente; no calculo rutas por carretera, no guardo la ubicación en la cuenta o el pedido y no solicito permisos en segundo plano. Puedo olvidar el punto elegido sin dejar de consultar las boutiques.

El servidor calcula un intervalo estimado de 3–5 días laborables para domicilio y 1–2 para recogida a partir de la fecha de confirmación, con el calendario de Madrid. Excluyo sábados y domingos, pero no festivos. El pedido conserva las fechas y la copia de los datos de entrega; los reintentos no las recalculan ni duplican el pedido. Al cancelar se conserva ese histórico y se indica que la entrega simulada está cancelada. Team puede consultar los datos en el detalle del pedido. No hay reservas físicas, transportistas, envíos ni cargos reales.

Tengo pendiente validar la ubicación y el mapa nativos en mis dispositivos. La generación de bundles no acredita que el permiso del sistema o las teselas se hayan probado en un teléfono. Para una futura distribución Android fuera de Expo Go habrá que configurar la clave propia del SDK de mapas; no he creado un proyecto de pago ni utilizado claves de Cars.

La portada presenta «Nuestras primeras boutiques», con Madrid, Barcelona y Marbella, fotos acreditadas y acceso a la sección pública `/boutiques`. También puedo llegar desde el menú principal y la pestaña nativa; no necesito iniciar una compra para conocerlas.

He comprobado la ampliación publicada en Safari con un punto manual para las distancias y un pedido de recogida con destinatario ficticio. El justificante conserva las fechas del 19 al 20 de octubre de 2026 y Team muestra los mismos datos de entrega. Cancelo ese pedido de prueba para reponer la unidad y conservo las capturas del recorrido. Después simplifico el formulario para que el explorador de boutiques sea opcional; puedo elegir el destino sin recorrer todos los mapas y fotos. La comprobación de ubicación real y mapas en los dispositivos nativos sigue pendiente.

## Recorrido completo de compra con envío ficticio · 18 de octubre de 2026

He completado en Chrome el recorrido de producto, variante, bolsa, destinatario, envío a domicilio, revisión del método ficticio, confirmación, justificante e historial. El pedido `4345dfb5-3d36-4c31-aa23-d538c5bfde59` conserva una unidad de Enchanted M por 1.850,00 €, destinatario Alex Maison y domicilio ficticio en Madrid. El justificante muestra la estimación del 21 al 23 de octubre de 2026, referencia DEMO y cargo real de 0,00 €. He comprobado la comunicación interna, abierto el detalle desde Team y cancelado el pedido para reponer la unidad. La ficha vuelve a mostrar ocho unidades y la bolsa queda vacía. Las [capturas 28–39](docs/evidencias/produccion-2026-10-18/README.md) documentan el recorrido publicado; la captura 27 añade la presentación de boutiques en la portada. No he realizado un pago ni un envío real, ni he validado aquí el envío de correo electrónico.


## Revisión de cierre · 7 de noviembre de 2026

He contrastado la implementación con los criterios de las clases de requisitos, principios de diseño, testing y seguridad. El detalle está en la [matriz de revisión](docs/REVISION-Y-CIERRE.md), con referencias a lecciones concretas y límites de las evidencias.

La revisión detectó que una cookie JSON malformada podía hacer fallar el cierre de sesión y que el cliente HTTP no distinguía correctamente algunos sobres JSON inválidos. También faltaba validar el puerto de arranque y evitar que los mensajes inesperados del proveedor se copiaran en los logs. Se reprodujeron los fallos con pruebas y después se corrigieron.

La refactorización ha sido acotada: los textos de los estados de pedido pasan a una política compartida independiente de HTTP y persistencia. La configuración admite una fuente explícita para poder probarla sin cambiar variables globales. No he cambiado de framework ni incorporado nuevos servicios por aparecer en el temario.

Las 111 comprobaciones automatizadas y el build web pasan, al igual que la exportación iOS/Android. Son comprobaciones locales: no prueban por sí solas el uso físico de la app, la versión publicada tras nuevos cambios ni la recuperación de datos en los proveedores. La revisión y las propuestas de cambios se han realizado con asistencia de IA y se han contrastado con código, diferencias y pruebas ejecutadas.


## Maison Stylist · preparación de la integración, 7 de noviembre de 2026

He preparado la primera integración del recomendador con Gemini, Claude y OpenAI, en ese orden. Parte de combinaciones existentes y permite que el modelo seleccione y explique hasta tres; el backend conserva las restricciones de ocasión, color, tallas, disponibilidad y presupuesto. No crea pedidos ni añade piezas a la bolsa automáticamente. Los fallos técnicos permiten consultar el siguiente proveedor; negativas y respuestas inválidas vuelven al modo editorial.

La integración está desactivada por defecto. Las pruebas automatizadas usan respuestas simuladas y por sí solas no acreditan acceso a los modelos, calidad estética, latencia ni coste real. Después he configurado claves específicas de Maison y realizado un ensayo autorizado por proveedor: las tres respuestas han sido válidas en un caso ES. La activación pública y una evaluación más amplia continúan pendientes; el [registro del ensayo](docs/evidencias/stylist-2026-11-07.md) conserva el alcance. El detalle, fuentes técnicas y referencias a las clases está en [Maison Stylist](docs/MAISON-STYLIST.md). Esta fase no se presenta como un sistema multiagente ni como una función generativa ya verificada en producción.

### Asesor conversacional y decisiones de interfaz · 7 de noviembre de 2026

He incorporado un acceso flotante a Maison Stylist en web y app porque el asesor quedaba poco visible entre los apartados del catálogo. La primera propuesta utilizaba un formulario; después la he convertido en una conversación para poder explicar el plan con mis propias palabras. Mantengo los filtros detallados como alternativa en «Completa tu look».

La interfaz presenta burbujas, respuestas diferenciadas y un campo de escritura fijo, con crema y burdeos de Maison. Si falta presupuesto, lo pregunta antes de recomendar. Las respuestas muestran fotografías existentes del catálogo, el total del conjunto y enlaces a las fichas para elegir variantes. Después pregunta «¿Te ha gustado la elección?» e invita a pedir cambios. Las valoraciones breves positivas o negativas tienen una respuesta local y no consumen consultas a proveedores.

Las reglas compartidas reconocen restricciones habituales de presupuesto, talla, calzado y ocasión y conservan preferencias durante la conversación. No equivalen a comprensión universal del lenguaje. Cuando se active la IA, el estilo escrito servirá de contexto para ordenar y explicar combinaciones ya existentes. No se inventan prendas, imágenes ni precios: el servidor comprueba disponibilidad y totales, y la persona decide qué añadir a su bolsa. El historial del chat, las preferencias y el borrador se conservan en memoria durante la navegación, incluso al abrir una ficha o cerrar el panel. Cerrar cancela la solicitud en curso; cambiar de cuenta o idioma, recargar la web o reiniciar la app limpia la conversación.

He comprobado en Safari local una petición de cena, talla M y sin maquillaje, la pregunta de presupuesto, dos conjuntos dentro del máximo indicado y el enlace a la ficha de Enchanted. También he comprobado la pregunta final y la respuesta a «me gusta». En Expo Go he confirmado que el chat abre y muestra fotografías, sin registrar qué dispositivo utilicé; la última revisión visual y todos los filtros y enlaces nativos aún necesitan una comprobación física completa.

La web y la API de esta revisión están publicadas en Vercel. La app incorpora el mismo cambio en su código y genera las exportaciones iOS/Android; para verlo durante el desarrollo hay que recargar Expo Go conectado a Metro. Vercel no distribuye automáticamente el código nativo. La IA pública sigue desactivada. Los tres ensayos reales previos verifican cada proveedor en un caso concreto, no una conversación generativa completa en producción.

### Estado de verificación y cierre · 7 de noviembre de 2026

La suite más reciente supera **118 comprobaciones**: 72 de backend, 10 del cliente HTTP, 7 de frontend y 29 de móvil. Las últimas pruebas del chat cubren aclaración del presupuesto, importes ES/EN, continuidad de preferencias, presupuesto inválido, contexto limitado y valoraciones que no deben consumir IA ni ocultar una nueva petición. También han pasado el build web, las exportaciones iOS/Android y la comprobación local de producción. El chequeo HTTPS publicado verifica rutas, recursos, cabeceras, catálogo y protección de accesos privados; no sustituye una compra ni una revisión visual completa.

En iPhone he comprobado registro y acceso, pago DEMO rechazado sin perder la bolsa, pago aceptado con cargo real de cero, consulta del pedido y conservación de sesión tras cerrar Expo Go. Cancelé el pedido de prueba y repuse sus unidades. La sesión utiliza SecureStore sin guardar contraseñas. El iPad volvió a abrir la app tras actualizar su sistema y Expo Go; no he registrado sus versiones nuevas ni un recorrido privado completo. Los apartados anteriores de octubre conservan las versiones y los resultados de aquellas pruebas históricas.

Queda completar las pruebas privadas en iPad y Android, mapas y permisos nativos, accesibilidad y cambios de conexión; revisar físicamente la última interfaz del chat; decidir la activación de IA y ampliar su evaluación; y ajustar y ensayar la presentación. Existe un PDF inicial de diez diapositivas, pendiente de mi revisión visual. La entrega al campus continúa siendo manual. El [registro de validación](docs/VALIDACION.md) y la [documentación del asesor](docs/MAISON-STYLIST.md) conservan las evidencias y sus límites.


### Ajustes a partir de una conversación real · 7 de noviembre de 2026

Al probar una entrevista de trabajo detecté que el chat pedía de nuevo el presupuesto aunque escribiese «tengo 6000». También repetía los looks al responder «sí mucho muchas gracias». He ampliado las reglas compartidas y sus pruebas para reconocer estas expresiones y el número de calzado, sin confundirlos con la edad ni descartar nuevas restricciones. El resumen muestra ahora talla y calzado. En la web, Intro envía y Mayús+Intro permite continuar en otra línea. He reducido la ayuda inicial a un solo ejemplo. La reproducción local en Safari confirmó el recorrido; queda pendiente comprobar esta corrección en la app física.

Tras esta corrección pasan las 121 pruebas de la suite completa: 72 backend, 10 cliente HTTP, 7 frontend y 32 móvil. Build web y exportaciones iOS/Android correctos.


### Límites del asesor y protección de las reglas de tienda

He acotado Maison Stylist a outfits, prendas y estilismo. Cuando detecta consultas fuera de ese ámbito, incluidas sexo, religión o política, responde con una invitación a volver al look. La política compartida da una respuesta inmediata en los clientes y la API la comprueba de nuevo antes de consumir cuota o consultar modelos. He reforzado las instrucciones y el filtrado de explicaciones para detectar intentos de cambiar reglas, revelar secretos o presentar precios y descuentos inventados.

La protección de importes depende del backend: el modelo solo selecciona identificadores permitidos y explica la combinación. No dispone de herramientas de escritura ni fija precios, y el servidor reconstruye productos, variantes y totales desde su catálogo. Los campos adicionales de precio, stock o permisos se rechazan. Las comprobaciones simuladas confirman esos límites y conservan el catálogo sin cambios. Las reglas léxicas no cubren todas las formas de expresar un ataque; son una defensa adicional sobre los permisos, esquemas y validaciones existentes. La suite alcanza 125 pruebas correctas, sin nuevas llamadas reales de IA para esta revisión.


### Continuidad entre asesor y fichas

La revisión de una pieza interrumpía la conversación porque el panel destruía su estado al cerrarse. He trasladado mensajes, preferencias y borrador al componente que contiene el chat en web y app. Así puedo abrir una ficha y volver al asesor sin empezar de nuevo. Safari local confirmó el recorrido y la conservación del borrador. La conversación permanece en memoria durante la navegación y se limpia al cambiar de cuenta o idioma, recargar la web o reiniciar la app; no se ha añadido almacenamiento permanente. Falta confirmar físicamente esta continuidad en Expo Go.


He añadido el guiño «tu tAIlor» para las preguntas sobre la identidad del asistente, jugando con tailor y AI. Se presenta como estilista personal virtual de Maison y responde de forma local, sin consultas a modelos ni cambios en los filtros. La respuesta mantiene el tono cercano de la marca y no se hace pasar por una persona.


### Aprendizaje de una prueba real del asesor

He realizado una nueva prueba rápida autorizada con Gemini para una entrevista laboral, presupuesto 6.000 €, talla S y calzado 36. Los tres conjuntos respetaron los filtros, pero dos explicaciones añadían referencias a televisión y cámaras. Detecté que el filtro histórico de entrevistas se llamaba `television` y condicionaba la respuesta. He separado ese contexto en el prompt cuando se pide una entrevista de trabajo, manteniendo el filtro de catálogo y añadiendo una prueba de regresión. No he repetido la consulta real después de corregirlo; la mejora de redacción sigue pendiente de validación con el proveedor. Las 127 pruebas automáticas pasan y la IA pública permanece desactivada. El [registro del ensayo rápido](docs/evidencias/stylist-prueba-rapida-2026-11-07.md) conserva resultados y límites.


### Activación de una prueba pública con IA

Después del ensayo controlado he autorizado guardar las tres claves de Maison como secretos del backend de producción en Vercel y activar el asesor para probarlo desde mi cuenta. He mantenido el orden Gemini, Claude y OpenAI y un máximo global de tres intentos de proveedor por día UTC, incluidos fallos y respaldos. La salida se limita a 512 tokens y cada proveedor dispone de diez segundos. Al agotarse la cuota o no recibir una respuesta válida se conserva la alternativa editorial. No se han comprado servicios ni activado facturación nueva.

El despliegue está listo y el estado público confirma la disponibilidad y los tres proveedores. La solicitud sin cuenta se rechaza con HTTP 401 antes de contactar con modelos. Estas verificaciones no gastaron consultas: quedan disponibles para mi prueba manual. La activación no sustituye una evaluación amplia ni acredita todavía todo el recorrido autenticado en producción. Los apartados previos conservan los resultados de las fases en las que la IA pública estaba desactivada.


### Asesoramiento antes del registro y duración de la prueba

He decidido permitir que una persona pruebe Maison Stylist antes de registrarse: el asesor acompaña la elección de ropa y la cuenta se solicita para el recorrido de compra. La exigencia de cuenta del asesor es configurable; las áreas privadas conservan sus permisos. Mantengo el límite global de tres intentos de proveedor al día y los guardarraíles, también para visitantes.

La prueba se cierra automáticamente al terminar el 31 de diciembre de 2026 en horario de Madrid. El backend comprueba la fecha en cada petición y antes de los respaldos para no depender de un nuevo despliegue. Después siguen funcionando la boutique y las selecciones editoriales. La aplicación no cambia la caducidad de las claves de los proveedores. Los importes que he indicado son Gemini gratuito, 15 € para Claude y 10 € para OpenAI; no he ampliado saldo ni activado facturación. Esos importes no se han auditado desde la app y su control propio sigue siendo una cuota de intentos, no un contador de euros. Las 129 pruebas pasan, incluidos acceso anónimo con cuota y vencimiento sin nuevas llamadas.


### Ajustes después de probar una recomendación para una boda

He probado el asesor publicado con una boda y presupuesto 6.000 € y he recibido propuestas de Gemini. La conversación detectó dos detalles poco naturales: al saludar pedía directamente presupuesto y al agradecer con «me ha encantado muchas gracias» activaba el mensaje de fuera de ámbito. He añadido respuestas locales para saludo y despedida y ampliado las valoraciones habituales, sin gastar llamadas de IA ni descartar peticiones que añadan cambios. También he corregido «mi talla es la M» y «calzo un 38», que no se reflejaban como filtros. La regresión reproduce la frase completa y comprueba M y 38. Las 131 pruebas pasan y las exportaciones nativas se generan correctamente; la última corrección no se ha vuelto a validar con una llamada real.


### Saludo reflejado y despedida con contexto

He adaptado la bienvenida para que tAIlor responda al saludo recibido: hola, buenos días, buenas tardes o buenas noches. Se presenta como mi estilista personal virtual de Maison y pregunta en qué puede ayudar. La despedida toma el plan y los nombres de las últimas propuestas mostradas: desea disfrutar de la boda o la cena, o suerte en una entrevista. No afirma que haya elegido o comprado un conjunto. El contexto procede de la recomendación presentada, para no arrastrar un plan anterior cuando la conversación cambia. Son respuestas locales, sin consumir IA. Las 133 pruebas pasan y se generan las exportaciones nativas; la última interacción física queda pendiente.


## Personalidad y voz de tAIlor · 8 de noviembre de 2026

He refinado las preguntas y las respuestas de fuera de ámbito para que el asesor resulte más cercano. La petición al modelo incorpora la personalidad de tAIlor y una introducción breve junto a los looks. Ese texto se valida antes de mostrarlo y no sustituye las comprobaciones del catálogo, presupuesto o stock. Los saludos, aclaraciones sencillas y despedidas continúan siendo locales para no gastar una llamada en cada frase. El nuevo formato se ha comprobado con respuestas simuladas, todavía no con una nueva ejecución real de los tres proveedores.

He preparado voz en web y app con ElevenLabs: dictado, revisión de transcripción y reproducción voluntaria de la respuesta resumida. No graba al abrir el chat y las claves permanecen en el backend. Utilizo una voz multilingüe y los módulos oficiales de audio de Expo. La voz sigue desactivada mientras se revisan permisos y se autoriza y verifica su uso real; no doy la exportación por prueba física de micrófono o altavoz. La [guía de voz](docs/VOZ-TAILOR.md) conserva límites y fuentes, y las [capturas locales](docs/evidencias/stylist-2026-11-08/README.md) distinguen la interfaz real de los proveedores simulados. Las 143 pruebas pasan.


### Elección de texto o voz y prueba real

He añadido como primer paso «¿Prefieres escribir o hablar con tAIlor?». Elegir texto no solicita micrófono. Elegir voz solicita permiso, sin grabar hasta pulsar Dictar; puedo cambiar de modo durante la conversación. El texto transcrito sigue siendo revisable antes de enviarlo. Safari local confirmó selector y entrada por escrito; no se grabó el micrófono en esa comprobación.

Después de ajustar permisos, autoricé tres peticiones reales a ElevenLabs: frase castellana, frase inglesa y transcripción del audio generado. Todas devolvieron HTTP 200. La transcripción reconoció la frase pero escribió los nombres propios de forma fonética. He añadido una corrección local acotada para la marca, sin cambiar las menciones a Taylor Swift. No he repetido la llamada tras esa corrección ni validado todavía el micrófono y el altavoz en cada dispositivo. La [evidencia de voz](docs/evidencias/voz-2026-11-08.md) conserva resultados y límites. La suite actual supera 144 pruebas; la activación pública de voz sigue pendiente de autorización.


### Voz por turnos y lectura completa · 8 de noviembre

A petición de la autora, el dictado pasa a un minuto. Al detener, se transcribe y envía automáticamente; en modo voz la nueva respuesta se lee una sola vez con explicaciones, totales, piezas, variantes, precios y pregunta final. El texto y las fotos permanecen disponibles. Se conserva la cuota de seis acciones diarias de voz y el cierre al finalizar el 31/12/2026. Normalmente cada turno hablado requiere dos acciones. Safari puede requerir pulsar Escuchar si bloquea la reproducción automática. La autora ha autorizado los secretos de producción; la comprobación física del recorrido automático sigue pendiente y no se han repetido las tres llamadas reales ya consumidas. La suite de 144 pruebas, build web y exportaciones iOS/Android pasan con el nuevo contrato de límites.

He autorizado la activación pública de voz con seis acciones diarias. Vercel publicó la versión `1bbb7c1`; web y API confirman disponibilidad y los nuevos límites. El chequeo público pasa sin gastar llamadas adicionales de voz. La prueba física del recorrido automático sigue pendiente.


### Elección, agradecimiento, precios hablados y controles

La prueba real de la autora detectó falsos rechazos al elegir Golden Hour y agradecer, además de pronunciación confusa de precios y cuota de voz insuficiente. He corregido las respuestas locales y la continuidad del look elegido; precios para síntesis en palabras con euros y céntimos ES/EN, manteniendo los importes del catálogo. Los controles son botones con iconos de micrófono/envío y acción «Terminar y enviar». La autora autorizó ampliar de seis a treinta acciones de voz diarias con el mismo cierre; no se aumenta la cuota de los modelos ni se compra saldo. Las 146 pruebas pasan (86 backend, 10 cliente, 7 frontend, 43 móvil). Safari local reprodujo elección y despedida correctas y mostró los botones; no se usaron proveedores reales en esta revisión ni se acredita aún la nueva pronunciación física. [Evidencia](docs/evidencias/stylist-2026-11-08/04-eleccion-despedida-botones-local.png).

### Jerarquía visual de voz y texto

He simplificado el pie del chat tras revisar la captura de la autora: el micrófono es la acción principal del modo voz y cambiar a texto tiene un tratamiento secundario. El campo de escritura y Enviar aparecen solo en modo texto, conservando el borrador al alternar. La web añade un mensaje de bienvenida al estado vacío. Build y exportaciones nativas correctos; inspección visual de una vista estática local con el componente real, sin grabar ni consumir IA.

### Nombre aislado del look y petición de aclaración

He corregido el reconocimiento de «Golden Hour» sin exigir «me quedo con». Una coincidencia dudosa pide confirmación o que se escriba el nombre; las nuevas preferencias siguen su recorrido y los temas bloqueados conservan sus controles. También he simplificado el aviso recurrente de voz, manteniendo la información del servicio externo al elegir micrófono. Las 147 pruebas pasan; la nueva aclaración se verifica localmente, sin gastar transcripción ni síntesis reales.

He adaptado la pronunciación de la marca a «Kelsi TiEs Meison», como indica la autora, solo en el texto preparado para voz. La interfaz conserva KelseTS Maison. Verificación local de transformación, sin nueva síntesis real.

### Seguimiento del look al pedir pantalones

La autora detectó que, tras interesarse por Midnight Velvet y pedir pantalones, el asesor repetía Golden Hour, Midnight Velvet y Wildflower. He separado esa consulta del ranking de looks: conserva la referencia y devuelve solo pantalones del catálogo, con foto, enlace y total del conjunto con cada opción. El servidor controla talla, stock, presupuesto y sustitución de un pantalón previo; el cliente no aporta precios. Se priorizan colores y colección, evitando deportivos salvo petición o conjunto deportivo. Funciona editorialmente sin consumir IA, incluso si no queda cuota del modelo. Safari local reprodujo la frase y mostró los pantalones y totales esperados. Las 150 pruebas pasan; build web, exportaciones iOS/Android y smoke local correctos. No se gastó voz ni IA reales. No presento este ajuste como conversación libre ilimitada.

### Cuota de voz y regresiones de conversación

He ampliado la configuración autorizada de voz a cien acciones diarias, manteniendo fecha de cierre y créditos existentes. El límite deja de generar un aviso persistente o repetido: cuando se conoce, se paran los intentos automáticos y el usuario ve un tooltip de cinco segundos al intentar usar voz. Safari local confirmó ese comportamiento sin micrófono ni proveedor real, con una única petición bloqueada y ningún reintento al pulsar Hablar.

He reproducido «diez mil euros» y la elección de Midnight Velvet con Ready For It?: el presupuesto se reconoce aunque llegue escrito con palabras, la elección del pantalón se confirma sin repetir opciones y ambos nombres se conservan para despedirse. La ordenación editorial distingue una cena elegante de planes casuales. Las 154 comprobaciones pasan; las verificaciones específicas finales vuelven a comprobar las preferencias y el diálogo. La [evidencia](docs/evidencias/stylist-2026-11-08/05-regresiones-presupuesto-eleccion-cuota.json) distingue pruebas locales de transcripción física aún pendiente. No he gastado nuevas llamadas reales de voz ni aumentado la cuota de los modelos.

### Paso de reglas de conversación a interpretación generativa

Las pruebas de la autora mostraron que el chat anterior seguía siendo demasiado rígido: la IA seleccionaba looks, pero las frases y sus referencias se resolvían primero con reglas. He cambiado el flujo para que, con IA activa, el mensaje y un contexto limitado lleguen directamente al modelo, que devuelve intención y preferencias estructuradas. El backend conserva la autoridad sobre catálogo, precios, stock y permisos. Se mantienen proveedores y controles; se amplía a cien intentos diarios de modelos con autorización expresa, separados de las cien acciones de voz. Si no hay IA disponible, se explica sin fingir comprensión mediante propuestas repetidas.

He incorporado contexto de gala, referencias a looks y piezas ya elegidas y complementos por tipo, incluidos zapatos. Las pruebas simuladas recorren conversación completa y no solo frases aisladas. Las 158 comprobaciones pasan, junto a build, exportaciones nativas y smoke local. La [guía del chat generativo](docs/CHAT-GENERATIVO-TAILOR.md) distingue la implementación de la prueba real pendiente tras desplegar. No presento las pruebas simuladas como evidencia de comprensión de un proveedor real.

### Cambio de objetivo y opciones vinculadas al catálogo

La prueba real de la autora mostró que Gemini ya entendía mensajes nuevos, pero el servidor seguía imponiendo el filtro de gala anterior y podía descartar los trajes que la IA proponía para reutilizar en una entrevista. He eliminado esa sustitución en el endpoint generativo: el modelo propone IDs y el backend valida datos de catálogo, no reemplaza el estilo por una clasificación anterior. Las opciones citadas se presentan con tarjetas reales y «las dos» queda unido a los últimos identificadores, manteniendo el objetivo nuevo. La regresión con 6.000 € comprueba que no vuelve a Enchanted o Bejeweled al mostrar Studio Interview y Midnight Presentation. Las 161 pruebas pasan; la conversación real completa sigue en verificación antes de dar el resultado por cerrado.
