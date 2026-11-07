# Revisión de Maison y criterios de cierre

Revisión del 7 de noviembre de 2026 sobre el trabajo local posterior a `e933006`. Los cambios de esta revisión todavía no están publicados. Las evidencias del 18 de octubre corresponden a aquella versión; no se trasladan automáticamente a esta.

## Alcance y evidencias

| Criterio observable | Implementación | Evidencia y estado | Cierre pendiente |
| --- | --- | --- | --- |
| Catálogo ES/EN con variantes, filtros, precio y disponibilidad | `backend/src/modules/catalog.js`, contratos y pantallas de catálogo | Pruebas locales de filtros, coherencia de variante y catálogo en SQLite/MongoDB correctas; capturas publicadas históricas | Regresión visual ES/EN de la versión final |
| Una cuenta no consulta pedidos ni comunicaciones de otra; cliente no accede a Team | `auth.js`, `orders.js`, `storage/mongo.js` | Pruebas locales de permisos y privacidad correctas, sin credenciales reales | Recorrido final publicado con cuentas ficticias |
| El servidor decide precios y no vende dos veces la última unidad | `createOrder` en SQLite/MongoDB | Pruebas de stock, competencia, precios y rollback correctas | No equivale a prueba de carga de producción |
| Un reintento idéntico devuelve el mismo pedido sin descontar dos veces | Clave por cuenta, huella de petición e índice único MongoDB | Pruebas de reintento e intentos simultáneos correctas | Comprobar recuperación visible tras pérdida de conexión en dispositivos |
| Cancelar devuelve stock una sola vez y respeta estados | `transitionOrder`, contratos de transiciones | Pruebas SQLite y cancelación concurrente MongoDB correctas | Ensayo final de demostración |
| Los pedidos conservan nombre, variante, precio, justificante y destino | Copias de líneas y justificante DEMO | Pruebas de histórico y entrega correctas; capturas de Chrome/Safari del 18/10 | Pedido e imagen conservados durante otro redeploy |
| Todo pago y envío se presentan como simulación | Checkout web/móvil y justificante con cargo real cero | Pruebas de rechazo, precios y justificante; recorrido web histórico | Confirmar recorrido completo móvil |
| Las cookies malformadas no rompen acceso o salida | Validador único de token en `auth.js` | Fallo reproducido; prueba de regresión de consulta, logout y nuevo login correcta | Nueva versión publicada y comprobada |
| La configuración falla antes de arrancar con puerto/origen inválidos | `readConfig(env)` | Pruebas de puerto, HTTPS serverless y origen correctas | Revalidar configuración de despliegue sin exponer sus valores |
| Un error inesperado no copia el mensaje privado del proveedor a logs o respuesta | Middleware de errores | Prueba con marcador privado simulado correcta | No hay alertas operativas o trazas distribuidas implantadas |
| Web y móvil rechazan sobres HTTP JSON inválidos y conservan cancelación | `packages/api-client` | Nueve pruebas correctas, tres nuevas sobre estos fallos | No valida todos los campos de cada entidad |
| App permite acceder, comprar en DEMO y consultar historial | `mobile/src/useCommerce.js`, pantallas de comercio | Código y exportaciones SDK 58 comprobados; Araceli confirma catálogo en iPhone el 7/11 | Sesión, pedido, rechazo, reinicio, outfits, mapas y permisos físicos |
| Evaluador puede reproducir el alcance declarado | README, guía móvil y despliegue | Documentación existente, en revisión | Instalación limpia, acceso móvil reproducible, enlaces y slides |
| Asesor usa productos reales sin inventar precios | Selector editorial `/stylist` | Implementado y explícitamente editorial | Integración generativa y evaluación aún pendientes |

Las comunicaciones de estado se insertan en la misma transacción del pedido. Son mensajes internos, no correo externo. El stock mostrado antes de confirmar no constituye una reserva.

## Cambios justificados por el curso

| Lección y tramo revisado | Criterio aplicado | Resultado concreto |
| --- | --- | --- |
| [SRP/OCP · solución](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/buenas-practicas-y-principios-de-diseno/leccion/ejercicio-srp-ocp-solucion-5/), 01:45–14:30 | Diagnosticar responsabilidades y cambiar por pasos comprobables | Textos de estados extraídos a `backend/src/domain/order-messages.js`; MongoDB ya no importa las rutas de pedidos para obtenerlos |
| [DIP · solución](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/buenas-practicas-y-principios-de-diseno/leccion/ejercicio-dip-solucion-5/), 00:45–07:49 | Hacer explícita una dependencia que impide aislar pruebas | `readConfig(env)` conserva `process.env` por defecto y admite objetos independientes en pruebas |
| [Variables de entorno y secretos](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/seguridad-env-owasp-top-10/leccion/variables-de-entorno-y-secretos/) | Validar configuración y evitar exposición de secretos | Puerto y protocolo validados; Vercel fuerza producción; mensajes inesperados de proveedores excluidos de los logs |
| [AuthN/AuthZ](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/seguridad-env-owasp-top-10/leccion/authn-authz-con-tokens-a-mano/) | Distinguir identidad, sesión y permisos sobre recursos | Sesiones revocables conservadas; cookies malformadas descartadas; comprobaciones de propiedad y Team en servidor |
| [TDD con IA](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/testing/leccion/tdd-con-ia/) | Demostrar primero el fallo y después comprobar la corrección | Cinco casos de configuración/seguridad y tres de cliente HTTP fallaron antes de corregir y pasan después |
| [Mapa de pruebas](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/testing/leccion/setup-mapa-de-pruebas-front-vs-back/) | Cada nivel demuestra propiedades diferentes | Se separan pruebas de negocio, cliente HTTP, modelos UI, exportación, navegador y dispositivos físicos |
| [Validación y verificación de requisitos](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/analisis-de-requisitos/leccion/validacion-y-verificacion-de-requisitos/) | Vincular requisitos a criterios observables | Matriz de esta página, con evidencia y límites por capacidad |
| [Docs as Code](https://campus.thebigschool.com/cursos/master-en-desarrollo-con-ia/modulos/documentacion-con-ia/leccion/docs-as-code-minimal/) | Documentar el estado real y mantener trazabilidad | Corregidas descripciones antiguas de app, huella del pedido y límites de arquitectura; histórico conservado |

Las referencias son a clases revisadas y a su aplicación en Maison. No significan que se hayan descargado o entregado los ejercicios docentes, ni acreditan visionado audiovisual personal de todas las clases.

## Verificaciones del 7 de noviembre

- `MONGOMS_RUNTIME_DOWNLOAD=false npm test`: **86 comprobaciones correctas**, sin fallos ni omisiones: backend 58, cliente HTTP 10, frontend 7 y modelos móviles 11. MongoDB temporal utiliza el binario existente; no se usa Atlas ni una pasarela real. Las pruebas de Cloudinary emplean dobles.
- `npm run build`: correcto.
- `CI=1 npm run mobile:export`: exportación Hermes iOS/Android correcta. No es un IPA/APK de distribución ni una prueba física.
- `npm run check:production`: repetido después de las correcciones, correcto; cinco rutas SPA, tres assets, cabeceras, salud, catálogo, imagen, acceso privado y recurso inexistente. No comprueba HTTPS público ni Docker.
- Las pruebas HTTP requieren puertos locales; el sandbox los bloqueó inicialmente. La ejecución con loopback permitido fue correcta. El rechazo inicial del entorno no se cuenta como defecto de Maison.

La revisión ha utilizado asistencia de IA, lectura de código y pruebas ejecutadas. No es una auditoría externa ni una certificación de seguridad, rendimiento o accesibilidad.

## Dependencias y compatibilidad móvil

El 7/11 Expo Go del iPhone rechazó SDK 57. Con autorización expresa se actualizó a Expo 58.0.23 y React Native 0.88.1, con sus módulos compatibles. Expo Doctor detectó primero duplicados de React/React Native; se alineó React 19.3.0 en ambos clientes y se deduplicó el monorepo. Después pasan 20/20 comprobaciones de Expo Doctor y las exportaciones iOS/Android. Araceli confirma que ya abre el catálogo en iPhone; no se da por completado el acceso privado por esa apertura.

También se autorizaron las actualizaciones compatibles de seguridad del backend: Express 5.3.0, body-parser 2.4.0, Multer 2.5.0, qs 6.17.1 e ip-address 10.7.6. Se mantienen las versiones mayores, se actualiza el lockfile y se repite la suite. Los avisos altos iniciales de [body-parser](https://github.com/advisories/GHSA-27r3-jxmh-p828) y [Multer](https://github.com/advisories/GHSA-q7qp-rjg7-q26m) quedan fuera de los rangos afectados. En Maison no se usa el filtro asíncrono que describe el aviso de Multer; el de body-parser sí justifica revisar el middleware JSON expuesto. No se ejecutaron cargas maliciosas contra producción.

El último `npm audit --omit=dev` registra **cinco avisos moderados y ninguno alto/crítico**, en la cadena Expo CLI/fingerprint/glob/minimatch. Se documentan pendientes; no se fuerza una versión mayor o retroceso de SDK para ocultarlos. Un aviso en esa cadena no prueba por sí solo exposición del bundle móvil o de la API. Las actualizaciones son locales: el despliegue público aún no incorpora estas correcciones.

El formulario móvil valida contra los mismos esquemas del backend y muestra qué campo necesita revisión en ES/EN. Recorta espacios exteriores del correo y normaliza su caso; no modifica la contraseña. El teclado se cierra al enviar para facilitar la lectura del resultado. Se añadieron pruebas de normalización, campos rechazados y límites; la confirmación física del registro sigue en curso.

El defecto de formato monetario observado en el iPhone se reprodujo en una prueba con la opción Intl de agrupación ignorada. El formateador común ahora presenta directamente los céntimos enteros con punto de miles y coma decimal, sin cambiar cantidades ni precios. Araceli confirma el resultado de 1.850,00 € tras recargar. También confirma registro/acceso, rechazo conservando bolsa y justificante de aceptación con cargo real cero e historial; el pedido de prueba se ha cancelado y su stock se ha repuesto. La reapertura exige volver a acceder en Expo Go; se registra como incidencia pendiente de decisión de alcance. Los resultados físicos se detallan en [su registro](evidencias/dispositivos-2026-11-07.md).

La instalación limpia sin secretos, con dependencias descargadas desde el lockfile tras autorización, pasa 79 comprobaciones, build y chequeo local de producción. La exportación iOS/Android de esa copia también es correcta. Además arranca `npm run dev` sin `.env`: API en 3000 y Vite en 5173, salud SQLite y catálogo de 190 productos correctos tanto en API como a través del proxy. El proceso de prueba se detiene después.

## Decisiones de refactorización

Se conserva React/Express, la sesión opaca, el contrato compartido y las transacciones por adaptador. No se incorporan microservicios, JWT, colas, un framework de agentes ni una base nueva por aparecer en el temario. La duplicación de forma entre adaptadores no justifica por sí sola unificar operaciones con semánticas de persistencia distintas.

El limitador de peticiones sigue en memoria por instancia y no impone una cuota global en Vercel. No se ha medido carga o escalado; tampoco se presenta como protección suficiente para un servicio comercial. La restauración del backup local SQLite tiene prueba, pero no demuestra recuperación de Atlas/Cloudinary.

Web y móvil comparten también `combineGuestBag` en `packages/contracts/cart-selection`: conserva la bolsa de la cuenta y su clave si no hay selección de invitado; al fusionar limita a 30 líneas y diez unidades y crea una nueva clave. Las pruebas comprueban límites, ausencia de mutaciones y conservación de la clave. No equivale a reservar stock o garantizar existencias hasta confirmar.

El chequeo público de solo lectura del 7/11 pasa sobre la versión que ya estaba publicada: rutas, recursos, cabeceras, salud, catálogo, imagen y rechazo de acceso privado sin sesión. No ejercita registro, compra, subida o restauración y no incorpora los cambios locales por haberlo ejecutado.

## Orden para la entrega del 9 de noviembre

1. Cerrar los recorridos físicos y corregir fallos reproducidos.
2. Resolver cualquier defecto crítico pendiente y repetir las verificaciones afectadas.
3. Completar persistencia/recuperación publicada con un procedimiento y entorno definidos.
4. Revisar accesibilidad, coherencia ES/EN y acceso del evaluador.
5. Cerrar memoria, slides, enlaces y ensayo sobre la versión elegida.
6. Decidir explícitamente qué alcance del asesor IA puede incluirse con pruebas; sigue pendiente como objetivo personal.

El lunes 9 es el objetivo personal de entrega, no una garantía de finalización o calificación. Araceli realiza el envío manual al campus. Los materiales restantes del curso y la selección de lecciones para el portfolio se registran por separado.


## Segundo bloque: sesión nativa y botones de pago

Araceli autoriza persistencia segura de sesión con Expo SecureStore. Se implementan login/registro nativos con token opaco, guardado protegido por plataforma, restauración y verificación de identidad al arrancar, eliminación local y revocación en servidor. La web conserva su cookie HttpOnly. Las pruebas comprueban hash sin token en la base, ausencia de token en login web o `/me`, imposibilidad de intercambiar una cookie por token sin contraseña, roles, precedencia de Authorization, rotación, caducidad y límite compartido. El mismo contrato se ejecuta con SQLite y MongoDB. Los dobles del almacén prueban reapertura, datos corruptos, errores y escrituras serializadas.

Resultado local: 86 comprobaciones correctas, build web, chequeo local de producción y exportaciones iOS/Android correctos; Expo Doctor 20/20. La instalación limpia anterior (79 comprobaciones) corresponde al primer bloque; no se presenta como una instalación limpia de este segundo bloque.

Los botones de acceso, pago, entrega, recogida y exploración de boutiques pasan al componente Maison con fondo/borde y estados accesibles; el aviso de bolsa utiliza modal con Aceptar rojo. La prueba física final de estos ajustes y de persistencia queda pendiente de publicar la API actualizada. No se ha hecho push ni desplegado este bloque todavía.


## Maison Stylist · fase de integración

Integración preparada, desactivada por defecto, con orden Gemini → Claude → OpenAI y retorno editorial. Suite actual: 111 correctas; las respuestas de IA de estas pruebas son dobles, no resultados de los proveedores. La [guía del asesor](MAISON-STYLIST.md) relaciona límites, contratos y referencias a las clases. Permanecen pendientes claves propias, pruebas reales autorizadas y evaluación de calidad.
