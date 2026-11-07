# KelseTS Maison · app móvil

Primera etapa nativa con React Native y Expo SDK 58, independiente de la web y conectada a su API HTTPS. Incluye catálogo paginado, búsqueda, categorías, ficha bilingüe con variantes, disponibilidad, outfits, bolsa por cuenta, acceso, pago simulado, historial y comunicaciones. Los componentes son nativos; no se utiliza un WebView.

## Arranque

Desde la raíz del repositorio, con Node 22.13 o posterior:

```sh
npm ci
npm run mobile
```

Instala Expo Go desde App Store o Google Play. Si no aparece la versión compatible en Google Play, utiliza la [página oficial de Expo Go](https://expo.dev/go), que proporciona la descarga oficial de Expo. Conecta móvil y ordenador a la misma Wi-Fi. En iPhone, escanea el QR de la terminal con Cámara; en Android, desde Expo Go. El ordenador y Metro deben permanecer encendidos. La dirección local cambia al cambiar de red; usa siempre el QR de la ejecución actual. No hace falta una clave de Atlas, Cloudinary ni una cuenta de pago de Expo.

**Cuenta de Expo en iPhone:** desde septiembre de 2026, Expo Go para iOS con SDK 57 exige la misma cuenta iniciada en Expo Go y en la CLI del ordenador. Ejecuta `npx expo login` dentro de `mobile/`, completa el acceso y utiliza esa misma cuenta en Expo Go antes de abrir el QR. Expo recomienda también iniciar sesión en Android para ver los servidores de desarrollo. Véase el [aviso oficial de Expo](https://expo.dev/changelog/expo-go-57-login). Un mensaje de Cámara sobre contenido no válido no acredita por sí solo un fallo de cuenta: hay que distinguir si el enlace llega a abrir Expo Go.

El 18/10 se eligió SDK 57 durante la transición de Expo Go. Desde el 7/11 el proyecto usa SDK 58 para abrir con el cliente actual del iPhone; véase el cierre de actualización al final de esta guía. Las dependencias están fijadas en el lockfile. La configuración de Metro sigue la [guía oficial de monorepos](https://docs.expo.dev/guides/monorepos/).

## Configuración

La API predeterminada es `https://kelsets-maison.vercel.app/api/v1`. Para otro despliegue propio, copia `mobile/.env.example` a `mobile/.env` y cambia solo `EXPO_PUBLIC_API_URL` por su URL HTTPS terminada en `/api/v1`; reinicia Metro. Este valor es público y se incluye en el paquete. No pongas aquí contraseñas ni claves. La app no accede directamente a MongoDB ni Cloudinary.

La bolsa guarda únicamente identificadores y cantidades en AsyncStorage. Al abrirla se consulta la API para recuperar precios y existencias; una pieza retirada o sin stock suficiente queda señalada y el total se oculta hasta corregirla. La bolsa del móvil es independiente de la del navegador. La bolsa no reserva stock. El pedido se crea únicamente desde la confirmación explícita del pago simulado, con sesión y validación del servidor. Las reglas para añadir cantidades se comparten con la web mediante `@maison/contracts/cart-selection`.

## Comprobaciones

```sh
npm test
npm run mobile:export
cd mobile
npx expo-doctor
```

Comprobación del 7/11 tras actualizar: exportación de los paquetes de iOS y Android correcta y 20/20 comprobaciones de Expo Doctor correctas. Esto comprueba el empaquetado y la configuración, no una ejecución en un teléfono ni un IPA/APK instalable. No se ha generado un binario de distribución ni publicado en tiendas. `mobile/dist/` queda fuera de Git.

He abierto la app en **iPhone, iPad y Android**. Falta completar y registrar el recorrido siguiente:

1. Abrir el QR, comprobar logo, imágenes, scroll y zonas seguras.
2. Buscar una pieza, cambiar categoría y pasar de página.
3. Abrir ficha, comprobar que una variante agotada está desactivada y añadir otra disponible.
4. Abrir bolsa, cambiar cantidades, actualizar disponibilidad y retirar una línea.
5. Cambiar ES/EN y comprobar nombres, variantes e importes.
6. Cerrar y volver a abrir la app; comprobar que la bolsa se conserva.
7. Desconectar la red, comprobar el error y reintentar al recuperar conexión.
8. En Android, comprobar el botón Atrás en ficha y bolsa; registrar modelo y versión del sistema junto con las capturas.

## Límites de esta etapa

He incorporado acceso y registro, bolsa separada por cuenta, pago simulado, historial y comunicaciones. Tras acceder, la app vuelve a consultar la sesión en la API antes de mostrar la cuenta. No guardo contraseñas ni traslado las cookies del navegador. Tengo pendiente verificar este recorrido completo en los dispositivos; la apertura anterior no valida la sesión nativa. Favoritos, Team y asistente de IA siguen pendientes en la app.

La revisión inicial del 18/10 registró 22 avisos de dependencias; es un dato histórico. Tras actualizar a SDK 58, `npm audit --omit=dev` del 7/11 registró inicialmente 9 avisos en el monorepo completo (7 moderados y 2 altos), no nueve vulnerabilidades demostradas en el bundle móvil. Después de las actualizaciones compatibles del backend quedan cinco moderados en herramientas de Expo y ninguno alto/crítico. Los cinco moderados siguen pendientes de resolución compatible. No se aplica `npm audit fix --force` ni el retroceso de SDK que propone para algunas cadenas.

## Adaptación de controles a iOS y Android

Tras el primer arranque, vi que la interfaz resultaba demasiado rectangular en ambos dispositivos. Se incorpora el botón del sistema de React Native para volver y reintentar; el idioma utiliza ActionSheetIOS en iOS y un diálogo Alert en Android. Las acciones de marca mantienen componentes Pressable personalizados con esquinas suaves, selección rellena, respuesta de opacidad en iOS y onda nativa de Android. El campo de búsqueda ofrece el borrado integrado de iOS.

La navegación inferior es una barra personalizada accesible con iconos y contador de bolsa; no se presenta como UITabBar o una barra Material nativa. Se mantienen los componentes de sistema de teclado, scroll, zonas seguras y alertas. Esta revisión pasa exportación iOS/Android y las tres pruebas del modelo móvil; la comprobación visual del ajuste en teléfonos sigue pendiente. Referencia: [Pressable de React Native](https://reactnative.dev/docs/pressable).

## Outfits y entrada Maison

La pestaña **Outfits** consulta los 36 conjuntos de la pasarela en `/looks`, con título de canción, era, ilustración y piezas del catálogo. Permite filtrar por era, abrir cada producto y elegir una variante disponible para cada pieza. El conjunto se añade completo a la bolsa mediante la regla compartida: si una pieza falta o supera stock al combinarse con la bolsa existente, no se añade ninguna parte del conjunto. No se reserva stock ni se crean pedidos. El total del conjunto se muestra cuando están elegidas todas las variantes.

Al abrir de nuevo la app aparece una entrada animada del mismo logo de Maison, sin música: opacidad, escala y línea roja durante aproximadamente dos segundos. Se puede saltar con «Entrar en Maison» y se omite si el sistema tiene activada la reducción de movimiento. Una pantalla modal nativa completa evita que quede limitada al área inferior; el logo se adapta al ancho y el botón respeta el margen seguro. No vuelve a reproducirse al cambiar de pestaña. Para revisarla, recarga o abre la app desde cero, no solo mediante Fast Refresh.

Se prepara además el arranque estático de una futura app independiente mediante el plugin oficial `expo-splash-screen` y `assets/splash-logo.png`, rasterizado desde el SVG del logo web existente. El arranque estático y la animación dentro de la app son pasos distintos. [Expo Go no permite comprobar fielmente el splash de la app distribuida](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/); esa comprobación requiere un binario de distribución. La animación de logo no es el vídeo de 90 segundos de la pasarela.

Comprobado: exportación iOS/Android, configuración Expo Doctor 21/21 y cuatro pruebas del modelo móvil. He comprobado la entrada corregida en iPhone e iPad. En Android apareció un error durante la actualización en caliente: se reinicia Metro con caché limpia y se comprueban los bundles de desarrollo de ambas plataformas. Después pude volver a cargarla en Android. El recorrido completo de outfits sigue pendiente de confirmar.

Los importes usan el mismo formateador compartido que la web: en castellano y en inglés, `1.850,00 €`, `10.000,00 €`, siempre con punto de miles y coma decimal. Esta presentación no modifica los valores en céntimos.

## Registro físico · 18 de octubre de 2026

| Plataforma    | Resultado observado                                        | Modelo / sistema / Expo Go                               |
| ------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| iPhone · iOS  | Apertura y entrada/interfaz corregidas correctas           | iPhone 13 / iOS 26.6.1 / Expo Go 57.0.9                  |
| iPad · iPadOS | Apertura y entrada/interfaz corregidas correctas           | iPad de 6.ª generación / sistema 17.7.0 / Expo Go 57.0.9 |
| Android       | Apertura y recuperación después de limpiar Metro correctas | Samsung Galaxy A34 / Android 16 / Expo Go 57.0.9         |

Las versiones del proyecto son app 0.1.0, Expo 57.0.30 (SDK 57), React Native 0.86.3, React 19.2.3 y expo-splash-screen 57.0.10. No se deduce de ellas la versión del sistema o Expo Go del dispositivo. He comprobado la apertura; todavía tengo que completar el recorrido manual de prueba. Se conservan como pendientes los pasos de prueba anteriores que todavía no se han confirmado.

He registrado los modelos y versiones utilizados en mis pruebas del 18 de octubre de 2026.

## Pago simulado y cuenta

He añadido una revisión del pedido con cuenta bancaria ficticia, tarjeta ficticia y PayPal simulado. En iPhone e iPad aparece además Apple Pay simulado; en Android, Samsung Pay simulado. Son opciones internas de la demostración: no abren esas aplicaciones, no usan sus SDK y no tienen conexión con una pasarela ni con cuentas bancarias. No solicito números de tarjeta, IBAN ni credenciales de esos servicios.

Antes de confirmar debo aceptar que es un proyecto académico y que no estoy comprando nada. Puedo elegir un resultado aceptado o rechazado para probar el recorrido. Un resultado aceptado registra el pedido pendiente y su comunicación interna; el justificante conserva el método, la referencia DEMO y el importe simulado, con cargo real de 0,00 €. El rechazo conserva la bolsa y no crea pedidos ni descuenta existencias. Los precios y el stock se validan en la API.

La bolsa guarda identificadores, cantidades y la clave del intento por cuenta. Antes de confirmar compruebo que se puede guardar esa clave en el dispositivo; los reintentos usan la misma para evitar duplicados. La cuenta permite consultar historial, detalle y comunicaciones y cerrar sesión. La sesión utiliza las cookies de la API y se comprueba después de acceder y salir; tengo que confirmar su comportamiento en iPhone, iPad y Android. No se han enviado correos externos.

## Entrega, recogida y Boutiques

He ampliado el checkout con destinatario, domicilio o recogida y una revisión previa al pago. La cobertura inicial del domicilio es Comunidad de Madrid, Barcelona ciudad y Marbella. El pedido conserva sus datos y un intervalo estimado calculado en la API, con todos los importes reales a cero.

La pestaña Boutiques muestra tres espacios ficticios Maison en los entornos de Serrano, Passeig de Gràcia y Puerto Banús. Incluye mapa nativo, fotografías acreditadas del entorno, selección para recogida y enlaces públicos a Street View. La ubicación solo se pide al pulsar «Calcular distancia»; también puedo elegir un punto en el mapa y olvidarlo. No guardo ese punto en AsyncStorage, en la cuenta ni en pedidos. La distancia es en línea recta, sin cálculo de rutas.

Utilizo react-native-maps y expo-location alineados con Expo Go SDK 58; las referencias SDK 57 siguientes corresponden a la implementación inicial. Tengo pendiente comprobar sus mapas, permisos y el recorrido de entrega en iPhone, iPad y Android. Una futura distribución con Google Maps necesita configuración propia; no he añadido claves ni activado facturación. Referencias: [react-native-maps en Expo](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/) y [Expo Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/).


## Actualización SDK 58 · 7 de noviembre de 2026

La apertura de prueba en iPhone detectó incompatibilidad: Expo Go del dispositivo utiliza SDK 58 y el proyecto aún estaba en SDK 57. Araceli autorizó expresamente descargar y actualizar las dependencias oficiales. Se actualizó Expo, se alinearon sus módulos y se deduplicaron React/React Native en el monorepo; web y app utilizan React 19.3.0 para evitar las versiones duplicadas detectadas por Expo Doctor.

Estado actual del proyecto: Expo 58.0.23, React Native 0.88.1, React 19.3.0, expo-splash-screen 58.0.13, expo-location 58.0.20 y react-native-maps 1.29.11. **Expo Doctor: 20/20**, exportaciones iOS/Android y regresión de 75 comprobaciones correctas tras la alineación. El recuento anterior 21/21 corresponde al diagnóstico anterior, no a una regresión de una comprobación.

Araceli confirma que el iPhone ya abre Maison y muestra el catálogo con esta actualización. Esto acredita apertura y catálogo por confirmación de la autora; el recorrido privado completo, iPad y Android siguen pendientes en esta versión. Araceli confirma también la creación y acceso a una cuenta Maison de prueba. Se ha solicitado probar un rechazo DEMO conservando la bolsa, todavía sin resultado registrado. Registro de resultados en [pruebas físicas del 7/11](../docs/evidencias/dispositivos-2026-11-07.md).

Para la prueba LAN: desde la raíz, `npm run start -w @maison/mobile -- --lan`. Abrir la dirección `exp://` que muestre Metro desde Expo Go, con dispositivos en la misma red. Esa URL depende de la red y requiere el Mac encendido: no es un acceso permanente de evaluación ni una publicación.

Guía oficial consultada: [actualizar SDK de Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) y [notas SDK 58](https://expo.dev/changelog/sdk-58). La actualización es una corrección de compatibilidad con el cliente de prueba actual, no la incorporación de nuevas funciones al producto. Las versiones y comprobaciones de los apartados históricos se conservan con su fecha.


### Registro de cuenta durante la prueba

Para una cuenta nueva hay que pulsar «Crear cuenta», completar nombre (2–80 caracteres), correo ficticio y contraseña nueva (10–128), y pulsar «Crear cuenta» para enviarlo. «Acceder» corresponde a una cuenta de Maison ya creada, no a las credenciales de BigSchool o Expo. El formulario utiliza los mismos esquemas de validación que la API y explica los errores por campo en ES/EN; no se necesita comunicar la contraseña a nadie. La bolsa continúa disponible en su pestaña tras entrar.


## Sesión nativa · cambio pendiente de publicación y prueba física

Tras detectar que Expo Go pedía acceso al cerrarlo, se ha incorporado `expo-secure-store` y acceso nativo explícito de la API. No se guarda la contraseña: se conserva un token opaco revocable y se verifica con el servidor al arrancar. AsyncStorage no contiene credenciales. Es necesario publicar la API con `/auth/native/login` y `/auth/native/register` antes de usar este flujo; los endpoints web de cookie siguen funcionando.

La primera entrada tras la actualización requiere acceder una vez con la cuenta Maison existente para emitir su token nativo. Después se debe comprobar cierre completo de Expo Go y reapertura, identidad y bolsa por cuenta, cierre de sesión y nueva reapertura anónima. La caducidad la decide el servidor (siete días), no una promesa indefinida del dispositivo.

Las acciones de acceso, pago, entrega, recogida y exploración de boutiques utilizan el botón Maison compartido, con fondo/borde, estado desactivado y etiquetas accesibles. La confirmación de añadir piezas utiliza una modal nativa con Aceptar rojo y fondo no accesible mientras está abierta. Compilación comprobada; revisar también el resultado físico y VoiceOver/TalkBack antes de acreditar accesibilidad completa.

### Chat Maison Stylist

Un botón flotante sobre las cinco pestañas abre el chat con texto libre, aclaración de presupuesto y tarjetas con fotos, precios y acceso a cada ficha. No aparece durante cuenta, ficha ni pago para no tapar acciones principales. Con IA desactivada se identifica como selección editorial. El cierre cancela peticiones y elimina la conversación de memoria.

Las exportaciones nativas se han comprobado; queda pendiente probar físicamente este nuevo chat. Los despliegues Vercel actualizan web/API, no el código nativo de Expo Go: durante el desarrollo hay que recargar el proyecto conectado a Metro.
