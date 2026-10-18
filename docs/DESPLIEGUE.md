# Despliegue de Maison · Vercel, MongoDB y Cloudinary

La publicación se prepara siguiendo el patrón revisado de KelseTS Cars: web React y API Express en dos proyectos de Vercel, MongoDB para datos y Cloudinary para imágenes subidas desde Team. Maison tiene su propia base, permisos y carpeta de imágenes. El 18 de octubre se comprueban conexión y carga de catálogo en Atlas propio, con repetición sin duplicados, y subida, lectura y eliminación de una imagen temporal en Cloudinary real. No hay todavía URL pública; el recorrido completo sobre Atlas y la subida desde Team siguen pendientes.

## Configuración preparada

- `frontend/vercel.json`: build Vite, rutas SPA, cabeceras y proxy `/api` hacia la API de Maison.
- `backend/vercel.json` y `backend/api/index.js`: función Node 22, sin `listen`, conexión MongoDB reutilizada por instancia y reinicio de la promesa si falla la inicialización.
- `backend/src/storage/mongo.js`: índices únicos, sesiones persistentes y transacciones para pedidos, stock, comunicaciones y ediciones de Team.
- `backend/src/storage/cloudinary.js`: subida de WebP normalizado y entrega mediante la API desde un destino Cloudinary restringido. Sigue el patrón de Cars para evitar depender del acceso directo al CDN desde el navegador.

Vercel no utiliza la base SQLite ni escribe imágenes en su disco temporal. Los archivos de catálogo y vídeo ya incluidos en `frontend/public/media` se publican como estáticos del frontend, fuera de la función. Cloudinary guarda las nuevas subidas. No hace falta volver a subir todo el catálogo para preparar esta primera publicación.

## Servicios propios de Maison

Preparar una base MongoDB propia con usuario y permisos propios. La instancia debe admitir transacciones de varios documentos: Atlas o un replica set; un `mongod` standalone no basta. No introducir la URI de Cars. Revisar las condiciones y límites del plan antes de activar servicios de pago.

Configurar solo en el backend:

| Variable | Valor o propósito |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_PROVIDER` | `mongodb` |
| `MONGODB_URI` | Conexión privada a la base de Maison |
| `MONGODB_DATABASE` | `kelsets_maison` o nombre propio elegido |
| `MEDIA_STORAGE` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | Cuenta configurada para Maison |
| `CLOUDINARY_API_KEY` | Clave de su integración |
| `CLOUDINARY_API_SECRET` | Secreto de su integración |
| `CLOUDINARY_FOLDER` | `kelsets-maison/team` |
| `APP_ORIGIN` | Origen HTTPS exacto del frontend, sin barra final |

No se necesitan secretos `VITE_*` ni JWT: Maison conserva sus sesiones opacas. Nunca colocar claves de MongoDB o Cloudinary en el frontend, Git, capturas o informes. `backend/.env.example` contiene solo nombres y valores de ejemplo.

## Preparación local con estos servicios

1. Configurar `backend/.env` de Maison, cambiando los proveedores a MongoDB y Cloudinary. Conservar origen local durante el desarrollo.
2. Ejecutar `npm run seed:mongo`. Es una operación explícita sobre la base seleccionada: inserta artículos ausentes y conserva nombres, precios y stock existentes. No copia cuentas, pedidos ni sesiones de SQLite ni de Cars. Requiere conectividad a MongoDB y una base de Maison elegida conscientemente.
3. Ejecutar `npm run dev`. Registrar una cuenta propia y conceder Team con `npm run team:grant -- correo-registrado`.
4. Comprobar compra, administración y subidas antes de publicar. Las pruebas automatizadas usan MongoDB temporal y un doble de Cloudinary; no acreditan una subida real al proveedor.

No hay migración automática de la base SQLite local a Atlas. La publicación puede comenzar con la semilla ficticia y cuentas nuevas. Si se necesita trasladar personalizaciones locales de Team o pedidos, preparar una migración explícita y verificar sus copias históricas antes de utilizarla.

## Dos proyectos de Vercel

1. Crear la API con raíz `backend`, Node 22 y el framework de la configuración (`null`, función Node). Habilitar acceso a archivos fuera de la raíz: los contratos y la semilla están en el monorepo. Instalar dependencias desde el lockfile del workspace; no copiar `node_modules` locales. No ejecutar semilla durante cada petición ni durante un arranque de función.
2. Configurar las variables privadas y `APP_ORIGIN` con la URL elegida para la web. `VERCEL=1` activa MongoDB y Cloudinary obligatorios y un salto de proxy confiable, como en Cars; no hay retorno automático a SQLite si falta configuración.
3. Comprobar la URL real asignada a la API. `frontend/vercel.json` contiene **`https://kelsets-maison-api.vercel.app` como destino propuesto**, no una URL existente o garantizada. Sustituirlo si Vercel asigna otro nombre, antes de publicar la web.
4. Crear la web con raíz `frontend`, framework Vite y acceso a los paquetes compartidos fuera de la raíz. El build genera `dist`.
5. Revisar los artefactos: la función debe contener código, contratos, semilla y manifiesto de imágenes, sin los vídeos ni la biblioteca estática completa. Los estáticos se sirven desde la web. El empaquetado remoto sigue pendiente de comprobar en Vercel.
6. Usar la web como origen de los recorridos con sesión. Su proxy mantiene `/api` bajo el mismo dominio para las cookies HttpOnly, Secure y SameSite=Lax. Un dominio preview distinto necesita su propio `APP_ORIGIN` y entorno aislado; no se permiten previews arbitrarias mediante comodines.

El límite de subida se fija en 4 MiB, con margen para multipart bajo el límite de petición de Vercel. Sharp comprueba firma, decodifica y convierte a WebP antes de enviar al proveedor. No se admiten destinos arbitrarios ni identificadores de Cars. La imagen anterior se conserva al editar un producto para respetar las imágenes copiadas en pedidos históricos. La limpieza de subidas sin asignar sigue pendiente.

## Verificación antes de compartir

```bash
npm test
npm run build
npm run check:production
npm run check:deployment -- https://dominio-real-maison
```

`npm test` incluye un MongoDB temporal en replica set con datos ficticios. La primera ejecución descarga el binario MongoDB a una carpeta temporal; necesita red y permiso para abrir puertos locales. No utiliza las variables de Atlas ni cuentas reales. `check:production` verifica el build real mediante Express con SQLite temporal; ese chequeo conserva la cobertura del modo local, no acredita Vercel o Atlas.

`check:deployment` exige HTTPS, rechaza redirecciones y solo realiza GET: rutas SPA, recursos del HTML, HSTS/CSP, catálogo, primera imagen y rechazo de pedidos y Team sin sesión. No crea cuentas, pedidos ni subidas. Ejecutarlo únicamente cuando exista la URL correcta.

Después, comprobar registro, acceso, recarga de sesión, favoritos, variantes, bolsa, pedido de demostración, historial y comunicaciones en ES/EN. Desde Team, subir una imagen y cambiar el estado del pedido. Volver a desplegar y comprobar que cuenta, imagen, pedido y stock se conservan. Guardar URL, fecha, revisión y resultados reales. También quedan vídeo, teclado, lector de pantalla y dispositivos físicos.

## Copias y límites

MongoDB y Cloudinary se respaldan con mecanismos propios del servicio. No presentar la prueba anterior de copiar un runtime SQLite cerrado como backup de Atlas. Probar una restauración en una base independiente y verificar las referencias de Cloudinary antes de dar este bloque por cerrado.

El limitador por IP actual vive en memoria por instancia; no es una cuota distribuida entre funciones de Vercel. No se han medido carga ni escalado. La integración externa, el empaquetado remoto, las cookies a través del proxy publicado y la restauración en los proveedores siguen pendientes.

SQLite se conserva para la demostración local y sus migraciones previas. Ese modo sí requiere disco persistente si se ejecuta en un servidor tradicional. Su copia coherente exige cerrar el proceso y copiar base y uploads juntos, o utilizar un backup SQLite validado. El Dockerfile corresponde a ese modo local y sigue sin ejecutarse en Docker. Render no es el destino elegido.

## Referencias

Revisión de código de Cars: conexión MongoDB, configuración Vercel de frontend y backend, subida y entrega de imágenes y evidencias de publicación, sin leer `.env` ni copiar secretos. Maison usa el driver oficial de MongoDB; Cars utiliza Mongoose. Las reglas de negocio, sesiones opacas y transacciones son específicas de Maison.

Documentación oficial consultada el 18 de octubre de 2026: [funciones Node de Vercel](https://vercel.com/docs/functions/runtimes/node-js), [límites de petición](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions), [transacciones de MongoDB](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/) y [subidas con Cloudinary Node](https://cloudinary.com/documentation/node_image_and_video_upload).
