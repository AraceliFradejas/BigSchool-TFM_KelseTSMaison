# Memoria del proyecto KelseTS Maison

| Dato        | Información                                                       |
| ----------- | ----------------------------------------------------------------- |
| Proyecto    | Boutique ficticia de moda, accesorios y belleza                   |
| Formación   | TFM BigSchool                                                     |
| Autora      | Araceli Fradejas Muñoz                                            |
| Tecnologías | JavaScript, React, Node.js, Express y SQLite                      |
| Estado      | Primera versión funcional local, pendiente de cierre y despliegue |

## 1 Contexto y motivación

KelseTS Maison nace como una nueva historia dentro de la marca ficticia que he utilizado en otros proyectos de mi portfolio. Me interesa que la propuesta tenga una identidad personal y una utilidad clara. En este caso, el punto de partida es una persona que encuentra una prenda que le gusta, pero necesita elegir su variante y descubrir qué accesorios o productos de belleza pueden acompañarla.

La moda ya estaba presente en AFM Moda Oceánica, una landing centrada en presentar una marca y una selección de prendas. KelseTS Cars incorporó una aplicación full stack con catálogo, cuentas y gestión privada. Maison continúa ese aprendizaje y lo lleva a un recorrido de tienda, con sus propias reglas de productos, stock y pedidos.

La música, las historias compartidas y el deporte inspiran el universo creativo. Los nombres y los productos son ficticios, sin presentar a personas o entidades reales como patrocinadores. «Tu estilo cuenta una historia» reúne esa intención.

## 2 Objetivos y alcance

El recorrido principal conecta portada, catálogo, ficha, elección de variante, bolsa y pedido de demostración. La cuenta permite conservar favoritos y consultar pedidos y comunicaciones. Team gestiona el catálogo y los estados del pedido.

La diferencia editorial está en «Completa tu look»: quince colecciones reúnen prendas, calzado, bolsos, joyería y propuestas de belleza en veintiuna selecciones manuales. El buscador de combinaciones comprueba ocasión, paleta, presupuesto y stock. Esta primera versión utiliza reglas y selecciones manuales; no hace peticiones a un modelo de IA.

La web tiene textos en castellano e inglés y CSS responsive. La app nativa, la integración con un proveedor de IA, las boutiques y las citas continúan fuera del alcance implementado. El despliegue y las slides finales siguen pendientes de cierre.

## 3 Organización técnica

He mantenido JavaScript y React por continuidad con los proyectos anteriores. El backend se organiza por acceso, catálogo, pedidos e imágenes. En la web, cada funcionalidad tiene sus páginas y los elementos comunes se encuentran en `shared`. Dos paquetes reúnen los contratos y el transporte HTTP.

SQLite permite arrancar la demostración con una base independiente sin configurar servicios externos. Esta elección facilita la prueba local, pero exige un disco persistente y condiciona el despliegue. No sirve guardar la base en un sistema temporal y esperar que los pedidos se conserven entre ejecuciones. La [arquitectura](docs/ARQUITECTURA.md) recoge esta decisión y sus límites.

El cliente HTTP parte del transporte de KelseTS Cars, revisado y adaptado a Maison. Las rutas de vehículos y citas se han sustituido por las necesidades de la boutique. No se ha trasladado el historial del repositorio, sus datos de producción, sus cuentas ni sus secretos.

## 4 Catálogo e identidad visual

El catálogo actual contiene cincuenta y un productos ficticios, repartidos entre Moda, Accesorios y Belleza. Cada producto tiene nombre y descripción ES/EN, colección, imagen y variantes. Las tallas, tonos o formatos pertenecen a cada variante, junto con su precio y existencias. Algunas tallas empiezan agotadas para hacer visible ese estado.

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

En Safari se ha recorrido la ficha, una talla agotada, la bolsa, el cambio de idioma, el acceso, la creación de un pedido, el historial, su comunicación y la confirmación desde Team. Las [evidencias](docs/evidencias/README.md) identifican las capturas y sus límites. Quedan por comprobar dispositivos reales, accesibilidad con lector de pantalla, el despliegue y el contenedor Docker.

## 9 Dificultades y decisiones pendientes

La primera decisión ha sido mantener la aplicación utilizable sin servicios contratados. SQLite resuelve esa necesidad local, pero obliga a decidir dónde conservar la base en el despliegue o a migrar la persistencia. La elección no está cerrada para la entrega.

La disponibilidad afecta a varias pantallas, aunque se decide en un único lugar: el servidor. Un producto visto hace unos minutos puede haberse agotado y una pantalla de Team puede tener datos antiguos. Las transacciones, las respuestas de conflicto y la revisión del producto cubren esas situaciones.

Antes de cerrar el TFM habrá que revisar la dirección visual, elegir el alojamiento, repetir el recorrido en dispositivos reales y preparar las slides sobre lo realmente construido. Solo después de medir ese progreso se decidirá si cabe una ampliación con IA o una app sencilla.

La ampliación swiftie añade vestidos de gala, sastrería, cuadros, botas, denim y punto. La selección de lujo incluye gabardinas, cachemir, lana, tul, terciopelo, piel, satén y joyería. Los looks se exploran por eventos, entrevistas y TV, estilo de calle o día a día. El buscador contempla verdes y plateados y mantiene la comprobación de presupuesto y existencias. Los precios y materiales describen artículos ficticios; no acreditan mercancía real.

Los precios del catálogo se han contrastado con referencias oficiales de Saint Laurent, Gucci y Prada y ajustado por categoría. El criterio y los enlaces están en [Precios](docs/PRECIOS.md). Una migración explícita actualiza los precios originales de demostración, preserva los cambios de Team y mantiene los pedidos históricos con sus importes originales.

La portada incorpora cuatro escenas con modelos adultas ficticias y una dirección multicultural: gala verde, traje marfil, estilo urbano y viaje en camel. Cada escena enlaza con su colección. Las fotografías se han generado y revisado; la integración de vídeo está preparada, pero los clips siguen pendientes porque el espacio conectado de Runway está en Free y no admite su generación.
