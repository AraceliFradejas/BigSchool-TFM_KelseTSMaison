# Recursos y continuidad de Maison

Maison tiene datos y recursos propios de demostración. La base técnica continúa proyectos anteriores de Araceli Fradejas Muñoz, manteniendo separados sus repositorios y servicios.

## Reutilización revisada

| Referencia                                                                                           | Aplicación en Maison                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [KelseTS Cars](https://github.com/AraceliFradejas/RTC-PROYECTO13-FULL-STACK-REACT), commit `0436556` | Transporte HTTP de `packages/api-client/src/index.js`, adaptado a errores por código y cabecera de escritura                                                                            |
| Organización de Cars                                                                                 | Logo vectorial KelseTS y favicon revisados y adaptados al subtítulo Maison; patrón de módulos del backend y `features`/`shared` del frontend, con código y reglas específicos de Maison |
| README y memoria de Cars                                                                             | Estructura bilingüe del README, motivación personal y separación entre presentación y detalle técnico                                                                                   |
| [AFM Moda Oceánica](https://proyecto-landing-page-1.vercel.app/)                                     | Antecedente creativo de moda; no se han copiado sus imágenes, vídeo ni identidad oceánica                                                                                               |

No se han copiado vehículos, citas, talleres, fotografías, bases de datos, cuentas, `.env`, credenciales ni historial Git de Cars. Las sesiones y la persistencia de Maison son implementaciones propias para esta versión.

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

React y React Router componen la web; Vite genera el build. Express gestiona la API, Zod valida las entradas y Sharp decodifica y optimiza imágenes. Node proporciona SQLite, criptografía y el ejecutor de pruebas; Supertest comprueba las rutas HTTP. Las dependencias y sus versiones resueltas figuran en `package-lock.json` y conservan sus licencias en los paquetes instalados.

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
