# Seguimiento de la entrega BigSchool

La primera versión cubre el recorrido de tienda en local. El objetivo de trabajo sigue siendo cerrar el domingo **8 de noviembre de 2026** para una entrega manual el lunes **9 de noviembre**. Es una fecha de preparación elegida por la autora, no una nueva fecha impuesta por el enunciado.

## Requisitos de entrega

| Material                                                                 | Estado                                                   |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| Código y control de versiones                                            | Proyecto independiente preparado en este repositorio     |
| README con descripción, stack, instalación, estructura y funcionalidades | Redactado en ES/EN para la primera versión local         |
| Despliegue o publicación funcional                                       | Publicado en Vercel; comprobaciones de cierre en curso |
| Slides y acceso desde el código o documentación                          | Presentación final pendiente                             |
| Formulario de entrega                                                    | Lo cumplimenta Araceli manualmente en el campus          |

Fuente académica: `Documentacion-TFM.pdf`, conservado como referencia privada. El enunciado no impone tecnología, app móvil ni IA. Admite entregas posteriores al plazo de la edición, con posibles diferencias en los tiempos de corrección.

## Funcionalidades implementadas

- Portada, historia, créditos y redes personales.
- Catálogo de 190 artículos ES/EN, búsqueda, filtros de talla y presupuesto, precios, paginación y fichas con variantes. Los 36 looks de la película permiten elegir piezas por separado o el conjunto completo.
- Disponibilidad por variante, cuentas, sesión y favoritos.
- Bolsa, pedido de demostración, historial, detalle y comunicaciones internas.
- Team para productos, imágenes, variantes, stock y estados de pedidos.
- Looks manuales y selección por preferencias con modo editorial explícito.
- Pruebas de API y cliente HTTP; build y comprobación de un recorrido en Safari.

## Cierre pendiente

1. Completar los detalles editoriales que surjan de la revisión a resolución completa y de las pruebas de dispositivo. El 17 de octubre se revisaron las 190 imágenes en láminas de contacto y se comprobaron fichas de muestra con los nombres musicales; la pasarela ilustrada de 90 segundos ya está aceptada.
2. Completar la validación de la versión publicada en Vercel con MongoDB y Cloudinary propios, incluida persistencia tras redeploy. El 17 de octubre se verificó en local el build con configuración de producción y la restauración independiente de datos ficticios; no acredita despliegue público ni Docker.
3. Comprobar iPhone, iPad y Android; revisar teclado y lector de pantalla.
4. Completar la auditoría de teclado y lector de pantalla. El 17 de octubre se revisaron el foco entre páginas, filtros, salto al contenido y cierre del menú con Escape; se corrigieron los problemas encontrados. Alta desde el formulario, acceso, redirección y recuperación de conexión comprobados en una base temporal aislada el 17 de octubre. Creación de producto bilingüe y subida de imagen desde Team comprobadas en una copia local aislada el 12 de octubre.
5. Preparar slides y demostración sobre la versión desplegada; actualizar memoria y evidencias.
6. Incorporar la app nativa y el asistente de IA de outfits solicitados por Araceli el 18 de octubre. Empezar por conectar y verificar los servicios compartidos; concretar después la implementación y el acceso del evaluador. Ninguna de las dos ampliaciones está implementada todavía.

## Calendario orientativo

| Fin de semana          | Trabajo prioritario                                                            |
| ---------------------- | ------------------------------------------------------------------------------ |
| 17–18 octubre          | Revisar la muestra, ampliar catálogo si hace falta y cerrar identidad y reglas |
| 24–25 octubre          | Consolidar recorrido, interfaz de Team, pruebas y dispositivo real             |
| 31 octubre–1 noviembre | Despliegue y validación; decidir una ampliación según el tiempo disponible     |
| 7–8 noviembre          | Evidencias, README, memoria, slides y ensayo de demostración                   |

Las horas disponibles siguen sin concretarse. Este calendario es una propuesta ajustable; no transforma la estimación inicial en una garantía.

## Guion inicial de presentación

1. Maison dentro de Universo KelseTS y la motivación personal.
2. Público y problema: de una pieza aislada a una selección coherente.
3. Recorrido público: catálogo, variante y combinación editorial.
4. Recorrido privado: bolsa, pedido de demostración e historial.
5. Team y comunicaciones asociadas a los cambios de estado.
6. Arquitectura, transacciones, privacidad y control de duplicados.
7. Pruebas ejecutadas, decisiones y dificultades reales.
8. Demostración, aprendizajes y siguientes pasos.

Este guion no sustituye las slides exigidas para la entrega.

## Cierre de sesión · 17 de octubre de 2026

- Catálogo de 190 artículos con nombres musicales ES/EN: las 139 piezas de pasarela conservan sus títulos y los 51 artículos anteriores tienen su correspondencia y migración reproducible. Las personalizaciones de Team y los pedidos históricos se conservan.
- Revisadas las 190 imágenes en láminas de contacto; fichas, variantes, continuidad de filtros, registro, errores de conexión y navegación por teclado comprobados en los recorridos descritos en Validación.
- Verificación final del trabajo: 42 pruebas correctas y chequeo del build real con configuración de producción correcto. Copia y restauración local de datos ficticios comprobadas. El Dockerfile y su healthcheck siguen pendientes de ejecutar en Docker.
- Próximo paso: elegir alojamiento y persistencia propios de Maison, concretar configuración, desplegar y validar HTTPS, reinicio y conservación de datos. No hay alojamiento contratado ni publicación pública realizada.
- También quedan dispositivos físicos, lector de pantalla, auditoría completa de accesibilidad, slides y revisión final de memoria y evidencias. No se ha activado IA ni creado app nativa.
- Para retomar: leer este cierre y `docs/DESPLIEGUE.md`; consultar `docs/VALIDACION.md` para distinguir lo comprobado de lo pendiente.

## Continuación · 18 de octubre de 2026

- Destino elegido por Araceli: Vercel, MongoDB y Cloudinary, siguiendo Cars. Retirada la propuesta de Render. No se han contratado planes de pago. La publicación se completa en este bloque; véase el avance siguiente.
- Revisadas las configuraciones, conexión y entrega de imágenes de Cars, sin leer secretos ni modificar ese proyecto. Preparadas API y web separadas, persistencia MongoDB con transacciones y subida/entrega Cloudinary.
- Se conserva SQLite para demostración local. `seed:mongo` inserta el catálogo ficticio sin trasladar automáticamente cuentas, pedidos o personalizaciones de la instalación local.
- Añadido `check:deployment` para la futura URL, de solo lectura. Verificación con MongoDB temporal y dobles de Cloudinary; los resultados y límites están en `docs/VALIDACION.md`.
- Atlas propio conectado y semilla cargada: 190 productos, 996 variantes, 16 colecciones y 57 looks; repetición sin duplicados. No se han creado cuentas ni pedidos en Atlas.
- Cloudinary propio conectado: subida autenticada, lectura y decodificación de una imagen WebP temporal comprobadas; imagen eliminada al terminar. El recorrido posterior de subida desde Team en navegador se completa en la revisión descrita más abajo.
- Próximo paso: preparar los dos proyectos de Vercel, ajustar el destino real del proxy y verificar publicación, sesión, imágenes y conservación de datos tras redeploy. El recorrido real con cuentas y pedidos sobre Atlas sigue pendiente.

## App y asistente de outfits · objetivos confirmados el 18 de octubre

Araceli quiere ambas ampliaciones: una app nativa y un asistente de IA para outfits. No se consideran terminadas por disponer de web responsive o del selector editorial actual. La app reutilizará la API y los contratos de Maison; Expo/React Native es una opción a evaluar. El asistente deberá consultar el catálogo real, respetar variantes, presupuesto y stock, y conservar el modo editorial si el proveedor falla. No creará pedidos ni cambiará la bolsa sin una acción explícita. El proveedor y el modelo aún no están elegidos; no hay claves ni consumo de IA configurados. La distribución nativa y el acceso para evaluación siguen por concretar.

## Publicación y Team · 18 de octubre de 2026

- Web publicada en https://kelsets-maison.vercel.app y API en https://kelsets-maison-api.vercel.app, con configuración privada solo en backend. Primer despliegue del commit `be67431`.
- Cuenta permanente Team Maison creada a petición de Araceli, con contraseña nueva guardada únicamente en el `.env` privado. Se incorpora `team:create` como comando explícito, sin alta privilegiada desde la API pública ni cambios automáticos de cuentas existentes.
- Chequeo público de solo lectura correcto. Recorrido HTTP real por la web HTTPS: acceso Team, flags de cookie segura, subida/lectura de imagen, creación/edición de pieza temporal, favorito, pedido de demostración, copia histórica de nombre/precio, confirmación, cancelación y devolución de stock. Cierre de sesión y retirada de todos los datos temporales; se conserva la cuenta permanente.
- Revisadas portada y catálogo publicados en Chrome de escritorio. No equivale a validar todo el recorrido privado desde navegador ni a dispositivos físicos.
- API redesplegada automáticamente desde `86c7d82`, con CI correcto. Comprobadas continuidad de la misma cuenta y sesión Team y conservación del catálogo; cierre de esa sesión y nuevo chequeo público correctos. Falta comprobar específicamente un pedido y una imagen durante otro redeploy, además de la restauración de backups.
- Editor de Team y subida desde Chrome publicados comprobados: creación bilingüe de pieza archivada, imagen desde el selector, guardado, búsqueda, reapertura y cambios de precio/stock. Datos temporales retirados; se conserva la sesión de Araceli y el catálogo original.
- Siguiente bloque: compra e historial completos desde navegador y evidencias, comprobaciones restantes de persistencia; después continuar con las ampliaciones solicitadas. Mailtrap queda para más adelante.
