# Preparación del despliegue de Maison

La aplicación funciona localmente. Todavía no hay una URL pública ni un servicio contratado. El almacenamiento actual requiere un servidor Node con disco persistente; una publicación estática del frontend no incluye la API ni conserva los pedidos.

## Servidor con almacenamiento persistente

1. Instalar Node 22, versión 22.13 o posterior de esa rama, y ejecutar `npm ci` y `npm run build`.
2. Configurar `NODE_ENV=production`, `APP_ORIGIN=https://dominio-maison` y rutas propias para `DATABASE_PATH` y `UPLOAD_DIR`.
3. Si el proveedor necesita escuchar fuera de loopback, configurar `HOST=0.0.0.0`. Situar la aplicación detrás de HTTPS.
4. Montar el directorio de datos en un disco persistente. Mantener una sola instancia de escritura.
5. Ejecutar `npm start`. Express sirve el build y la API desde el mismo origen.
6. Registrar una cuenta y concederle Team desde el servidor con `npm run team:grant -- correo-registrado`.
7. Repetir el recorrido de compra, permisos, cambio de estado, subida de imagen y reinicio antes de compartir la URL.

No utilizar base, secretos, carpetas de imágenes ni dominios de Cars. No guardar credenciales en el repositorio. Para esta implementación con sesiones opacas no se necesita un `JWT_SECRET`; una futura migración a JWT exigiría uno nuevo.

## Contenedor preparado

El Dockerfile compila la web y prepara una imagen Node sin dependencias de desarrollo. Está escrito, pero no se ha ejecutado: Docker no está disponible en el entorno revisado.

Después de instalar Docker, una comprobación local propuesta es:

```bash
docker build -t kelsets-maison .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=development \
  -e APP_ORIGIN=http://127.0.0.1:3000 \
  -v maison-runtime:/app/backend/runtime \
  kelsets-maison
```

Esta prueba local usa HTTP y no equivale al despliegue de producción. En producción hay que usar HTTPS, el origen real y comprobar permisos del volumen para el usuario `node` del contenedor.

## Persistencia y copias

La base y las imágenes deben conservarse después de reinicios y redeploys. El directorio no está incluido en Git ni en la imagen Docker. Para una copia coherente, detener las escrituras y cerrar el proceso antes de copiar el directorio completo, o utilizar un mecanismo de backup SQLite validado. No copiar solo el archivo principal mientras hay cambios en WAL.

Comprobar restauración en una ubicación independiente, conservación de pedidos y existencias y acceso a las imágenes. No se ha probado todavía un procedimiento de backup en un alojamiento real.

## Alternativa con base alojada

Si el alojamiento elegido no ofrece disco persistente, migrar primero la persistencia a una base propia alojada y las imágenes a una carpeta propia del servicio elegido. Conservar transacciones o una estrategia equivalente para stock, pedidos y mensajes, además de unicidad de la clave de idempotencia y controles de revisión del catálogo.

La elección de proveedor, límites, coste y configuración se realizará antes de activar servicios. Esta alternativa todavía no está implementada.
