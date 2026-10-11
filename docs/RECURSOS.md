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

## Datos e ilustraciones

`data/catalog.js` define quince productos ficticios, cinco colecciones y cinco looks manuales. Los precios son ejemplos y no representan ofertas reales. Las descripciones de belleza son creativas, sin diagnósticos ni promesas médicas.

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

Las evidencias visuales se han capturado en Safari con una cuenta ficticia local. No se han utilizado servicios externos de generación de imágenes, proveedores de IA ni correo en el funcionamiento de esta primera versión.
