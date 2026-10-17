# Preparación del despliegue de Maison

La aplicación funciona localmente. Todavía no hay una URL pública ni un servicio contratado. El almacenamiento actual requiere un servidor Node con disco persistente; una publicación estática del frontend no incluye la API ni conserva los pedidos.

## Servidor con almacenamiento persistente

1. Instalar Node 22, versión 22.13 o posterior de esa rama, y ejecutar `npm ci`, `npm test`, `npm run build` y `npm run check:production`.
2. Configurar `NODE_ENV=production`, `APP_ORIGIN=https://dominio-maison` y rutas propias para `DATABASE_PATH` y `UPLOAD_DIR`.
3. Si el proveedor necesita escuchar fuera de loopback, configurar `HOST=0.0.0.0`. Situar la aplicación detrás de HTTPS.
4. Montar el directorio de datos en un disco persistente. Mantener una sola instancia de escritura.
5. Ejecutar `npm start`. Express sirve el build y la API desde el mismo origen.
6. Registrar una cuenta y concederle Team desde el servidor con `npm run team:grant -- correo-registrado`.
7. Repetir el recorrido de compra, permisos, cambio de estado, subida de imagen y reinicio antes de compartir la URL.

No utilizar base, secretos, carpetas de imágenes ni dominios de Cars. No guardar credenciales en el repositorio. Para esta implementación con sesiones opacas no se necesita un `JWT_SECRET`; una futura migración a JWT exigiría uno nuevo.

## Contenedor preparado

El Dockerfile compila la web y prepara una imagen Node sin dependencias de desarrollo. Incluye un `HEALTHCHECK` que consulta la API con Node, sin instalar curl. Ni la imagen ni ese chequeo se han ejecutado en Docker: Docker no está disponible en el entorno revisado.

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

## Comprobación local de la configuración de producción

```bash
npm test
npm run build
npm run check:production
```

`check:production` sirve el build real de Vite mediante Express en un puerto de loopback asignado automáticamente, con configuración de producción y datos temporales. Comprueba cinco rutas de la SPA, los recursos referenciados por el HTML, el healthcheck, el catálogo, una imagen y el 404 de un recurso inexistente. Cierra el servidor y elimina sus datos de prueba al terminar. No utiliza la base local de Maison ni hace peticiones externas.

Las pruebas de backend comprueban además cookies `Secure`, `HttpOnly`, `SameSite=Lax` y `Path=/api`, rechazo de orígenes de desarrollo, respuestas de API independientes del HTML y cabeceras de producción. El transporte del chequeo es HTTP local: no acredita TLS, proxy, dominio ni alojamiento público. El flujo de CI incluye la comprobación tras compilar; su ejecución remota debe revisarse después de subir los cambios.

## Persistencia y copias

La base y las imágenes deben conservarse después de reinicios y redeploys. El directorio no está incluido en Git ni en la imagen Docker. Para una copia coherente, detener las escrituras y cerrar el proceso antes de copiar el directorio completo, o utilizar un mecanismo de backup SQLite validado. No copiar solo el archivo principal mientras hay cambios en WAL.

Comprobar restauración en una ubicación independiente, conservación de pedidos y existencias y acceso a las imágenes. Una prueba automatizada local valida este procedimiento con datos ficticios: cierra la base, copia el directorio runtime completo a otra ubicación y abre la copia. Comprueba `PRAGMA integrity_check`, pedidos, comunicaciones, sesión, stock y bytes de una imagen de prueba referenciada por un producto; también verifica que modificar la copia no cambia el origen. No se ha probado todavía un procedimiento de backup en un alojamiento real.

Para aplicarlo al servidor elegido:

1. Detener la única instancia de Maison y confirmar que ha terminado; evitar reinicios automáticos mientras se copia.
2. Copiar el directorio persistente completo, incluidos base y uploads, a un destino nuevo fuera del repositorio. Si se han configurado rutas separadas, copiar ambas. Conservar los permisos adecuados y el acceso restringido a la copia, que contiene cuentas, sesiones y pedidos.
3. Restaurar en otro directorio y arrancar una instancia de revisión con `DATABASE_PATH` y `UPLOAD_DIR` apuntando a esa copia.
4. Verificar integridad, cuenta, pedidos, stock e imágenes antes de sustituir datos de un servidor. La prueba no exige sobrescribir la instalación original.

## Alternativa con base alojada

Si el alojamiento elegido no ofrece disco persistente, migrar primero la persistencia a una base propia alojada y las imágenes a una carpeta propia del servicio elegido. Conservar transacciones o una estrategia equivalente para stock, pedidos y mensajes, además de unicidad de la clave de idempotencia y controles de revisión del catálogo.

La elección de proveedor, límites, coste y configuración se realizará antes de activar servicios. Esta alternativa todavía no está implementada.
