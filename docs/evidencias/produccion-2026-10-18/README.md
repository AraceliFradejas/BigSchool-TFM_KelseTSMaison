# Capturas de la web publicada · 18 de octubre de 2026

Capturas originales de Chrome en escritorio sobre https://kelsets-maison.vercel.app, realizadas el 18 de octubre de 2026. Se conserva la ventana del navegador y la dirección pública; no se han reconstruido ni retocado las pantallas. Son vistas parciales de la interfaz, no pruebas de todos los comportamientos del sistema. Las capturas 1–5 se tomaron sin modificar productos ni crear pedidos. La ampliación 6–16 documenta después un pedido de demostración creado, confirmado y cancelado para esta revisión; se conserva cancelado en el historial de Team Maison. En las capturas 13–14 no se guardaron cambios. La secuencia 17–19 documenta después una creación temporal archivada y su limpieza.

## 1. Portada en castellano

![Portada publicada](01-portada-es.jpg)

Identidad Maison, navegación, aviso de boutique de demostración y fotograma de la película de portada con sus controles.

## 2. Catálogo en castellano

![Catálogo con 190 piezas](02-catalogo-es.jpg)

Vista desplazada del catálogo: contador de 190 piezas, controles de talla, precio y disponibilidad y primeras tarjetas con nombre y precio. La captura muestra los controles; no acredita por sí sola el resultado de aplicar cada filtro.

## 3. Ficha de producto

![Ficha de Vestido · Enchanted](03-ficha-es.jpg)

Ficha de Vestido · Enchanted, fotografía, descripción, precio de demostración y variantes. La talla L aparece agotada. Sin una variante elegida, el botón de añadir a la bolsa está desactivado.

## 4. Cuenta con sesión iniciada

![Cuenta Team Maison](04-cuenta-es.jpg)

Saludo a Team Maison y espacios de pedidos y comunicaciones vacíos. Esta captura acredita la vista de cuenta con sesión iniciada; no muestra un pedido ni el envío de correo.

## 5. Gestión de productos de Team

![Panel Team publicado](05-team-es.jpg)

Panel de Team accesible con la sesión existente: 190 piezas, búsqueda, filtro de visibilidad, existencias y acceso al editor. La captura no demuestra una operación de guardado ni una subida de imagen.

## 6. Cuenta en inglés

![Cuenta en inglés antes del pedido](06-cuenta-en.jpg)

Misma cuenta y sesión, con interfaz inglesa y todavía sin pedidos antes de comenzar la simulación.

## 7. Bolsa en inglés

![Bolsa con una pieza](07-bolsa-en.jpg)

Una unidad de Dress · Enchanted, M · Champagne, por 1.850 €. Se muestran cantidad, total y aviso de simulación sin datos de pago ni envío.

## 8. Pedido creado

![Pedido pendiente](08-pedido-pendiente-en.jpg)

Pedido `29e9f091-8106-41cc-8ccb-0f596dbfe229`, creado desde la bolsa y observado en estado pendiente, con una unidad y total de 1.850 €. No hay cobro ni envío.

## 9. Confirmación desde Team

![Pedido confirmado](09-team-confirmado-en.jpg)

El mismo pedido aparece confirmado después de la acción de Team. El botón de expedición simulada se muestra disponible; no se ha utilizado.

## 10. Cancelación desde Team

![Pedido cancelado](10-team-cancelado-en.jpg)

Estado final cancelado tras la acción de Team. Se mantiene el registro de demostración para poder relacionarlo con estas evidencias.

## 11. Comunicaciones internas

![Historial y comunicaciones](11-comunicaciones-en.jpg)

La cuenta muestra el pedido cancelado y las tres comunicaciones de creación, confirmación y cancelación. Son mensajes internos de Maison; esta captura no acredita entrega de correo electrónico mediante Mailtrap.

## 12. Stock después de cancelar

![Talla M con ocho unidades](12-stock-restaurado-en.jpg)

La ficha vuelve a mostrar ocho unidades en M · Champagne, el mismo valor observado antes del pedido. La bolsa queda vacía.

## 13–14. Editor bilingüe

![Editor con campos ingleses](13-editor-en.jpg)

![Editor con campos castellanos](14-editor-traduccion-es.jpg)

Editor del producto existente, con fotografía, pestañas de idioma, variantes, precios y existencias. Se revisan ambos idiomas y se sale sin guardar cambios. Se ve el control de subida, pero estas imágenes no prueban una nueva subida ni un guardado.

## 15–16. Portada y menú en móvil emulado

![Portada en emulación móvil](15-portada-movil-emulado-en.jpg)

![Menú abierto en emulación móvil](16-menu-movil-emulado-en.jpg)

Chrome DevTools, perfil iPhone SE de 375 × 667 píxeles CSS, sin limitación de red. Se observa la portada vertical y se abre y cierra el menú con acceso a cuenta y Team. Son capturas de emulación en escritorio, no de un iPhone físico. Al terminar se restaura la vista de escritorio en castellano con la sesión iniciada.

## 17–19. Subida, guardado y reapertura desde Team

![Imagen subida desde el selector de archivos](17-imagen-subida-team.jpg)

La pieza temporal `evidencia-daylight-20261018` utiliza una copia del recurso de Maison `satin-story.webp`, seleccionada desde el equipo. El campo de imagen pasa a una ruta `/api/v1/images/` y la vista previa muestra la imagen servida por la API publicada. El formulario contiene nombre, descripción y variante en ES/EN, precio de demostración de 10 € y stock cero. La pieza permanece archivada durante toda la prueba.

![Producto temporal guardado y encontrado en Team](18-producto-guardado-archivado.jpg)

Después de pulsar Guardar producto, la búsqueda encuentra la pieza archivada con su miniatura. El contador filtrado muestra una coincidencia; durante la prueba el total de Team fue de 191 productos, incluidos los 190 anteriores.

![Producto reabierto con sus datos guardados](19-producto-reabierto-team.jpg)

Al reabrir el editor se recuperan nombre, descripción, referencia de imagen, variante, precio y stock. El selector local vuelve a estar vacío, mientras la referencia y la vista previa se conservan. La etiqueta castellana de la variante quedó como «M · Champn» por la entrada automatizada; se mantiene la captura original y no se presenta como una revisión editorial de ese texto.

Tras guardar las evidencias se comprueba que la pieza no está referenciada por pedidos ni comparte su imagen con otros productos. Se retiran únicamente el producto temporal, su variante, su referencia de imagen y la copia de Cloudinary. La comprobación final en Atlas devuelve 190 productos y cero registros de esa pieza, variante e imagen de prueba. Los productos originales y el pedido cancelado de la secuencia anterior se conservan.

## Evidencias que quedan por ampliar

Teléfono físico y más tamaños y recorridos responsive. El asistente de IA de outfits y la app nativa siguen pendientes de implementación y no se presentan como funcionalidades capturadas. Las verificaciones técnicas realizadas se detallan en [VALIDACION.md](../../VALIDACION.md).
