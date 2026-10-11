# KelseTS Maison

[Versión en castellano](#versión-en-castellano) · [English version](#english-version)

## Versión en castellano

Proyecto TFM del máster de BigSchool: KelseTS Maison, boutique ficticia de moda, accesorios y belleza desarrollada con React y Node.js.

**Autora: Araceli Fradejas Muñoz.**

> **Tu estilo cuenta una historia.**

KelseTS Maison es una boutique ficticia de moda, accesorios y belleza. Puedes explorar sus colecciones, elegir una variante, guardar tus piezas favoritas y completar un pedido de demostración. No se realizan ventas, cobros ni envíos reales.

**Estado:** primera versión funcional local. El despliegue público y la presentación final están pendientes.

### Una historia personal

Maison continúa Universo KelseTS, la marca ficticia con la que he dado identidad a varios proyectos de mi portfolio. La música, las historias compartidas y el deporte forman parte de su inspiración. Aquí aparecen en una selección para un concierto, en una tarde tranquila o en los detalles que terminan de unir un look.

Después de la landing AFM Moda Oceánica y del recorrido full stack de KelseTS Cars, quería llevar esa experiencia hacia una boutique. Una pieza puede gustarte por sí sola, pero elegir su variante y encontrar otras que encajen requiere un recorrido claro. Esa es la idea que organiza Maison.

### Qué puedes hacer

- Explorar una portada editorial y quince colecciones propias.
- Consultar 51 artículos con 140 variantes, incluidas 24 piezas de la selección de lujo.
- Explorar 21 looks editoriales de eventos, entrevistas y TV, estilo de calle y día a día.
- Consultar Moda, Accesorios y Belleza con búsqueda, filtros, orden por precio y paginación.
- Elegir variantes y comprobar su precio y disponibilidad.
- Registrarte, acceder y guardar productos en «Mi selección».
- Preparar una bolsa y crear pedidos de demostración; consultar su historial, detalle y comunicaciones.
- Buscar combinaciones editoriales según ocasión, paleta, presupuesto y preferencia de incluir belleza.
- Gestionar productos, textos ES/EN, imágenes, variantes y stock desde Team; avanzar o cancelar pedidos según las transiciones permitidas.
- Cambiar entre castellano e inglés conservando la ruta y la bolsa.

«Completa tu look» utiliza selecciones manuales y disponibilidad real del catálogo. Está identificado como **modo editorial, sin IA**. Maison Stylist con un proveedor de IA y la app nativa siguen siendo ampliaciones por evaluar.

### Estructura y tecnologías

La web utiliza React, React Router, Vite y CSS. La API utiliza Node.js, Express, Zod, cookies de sesión y SQLite mediante `node:sqlite`. Sharp valida y optimiza las imágenes subidas desde Team. Los esquemas y las reglas de pedidos están en un paquete compartido; las peticiones pasan por un cliente HTTP independiente de React.

```text
backend/
  src/modules/       # Acceso, catálogo, pedidos e imágenes
  src/db.js          # Tablas, transacciones y semilla
  scripts/           # Semilla y concesión local de acceso a Team
  test/              # Pruebas de API y reglas de tienda
frontend/
  src/app/           # Rutas, navegación y acceso a pantallas privadas
  src/features/      # Catálogo, cuenta, bolsa, Team y marca
  src/shared/        # Estado, idiomas, componentes y peticiones
  src/styles/        # Diseño y responsive
  public/media/      # Imágenes de catálogo WebP y SVG históricos
packages/
  contracts/         # Esquemas y transiciones de pedidos
  api-client/        # Transporte HTTP y sus pruebas
data/catalog.js      # Catálogo y looks ficticios reproducibles
docs/                # Arquitectura, recursos, validación y entrega
scripts/             # Arranque, recursos y migración de imágenes
```

La base local permite probar Maison sin cuentas de servicios externos. Es independiente de Cars y no contiene sus usuarios, datos ni credenciales. En Node 22, `node:sqlite` muestra un aviso de funcionalidad experimental; el entorno comprobado está recogido en [Validación](docs/VALIDACION.md).

### Instalación local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/AraceliFradejas/BigSchool-TFM_KelseTSMaison.git
   cd BigSchool-TFM_KelseTSMaison
   ```

2. Utiliza Node.js 22, versión 22.13 o posterior dentro de esa rama, e instala:

   ```bash
   npm ci
   ```

3. Arranca la aplicación:

   ```bash
   npm run dev
   ```

Abre **http://127.0.0.1:5173**. La API está en **http://127.0.0.1:3000/api/v1/health**. La primera ejecución crea automáticamente la base y carga los productos que falten. `npm run seed` permite repetir esa carga sin reiniciar existencias ni sobrescribir las ediciones.

Los valores por defecto sirven para el arranque local. Para personalizarlos, copia `backend/.env.example` a `backend/.env`. La base, las sesiones y las imágenes subidas se guardan en `backend/runtime/`, fuera de Git. No elimines esa carpeta si quieres conservar tus pedidos y cuentas.

Para revisar el build sin Vite:

```bash
npm run build
npm start
```

En ese caso, abre **http://127.0.0.1:3000**. Si vas a modificar datos desde esta dirección, configura previamente `APP_ORIGIN=http://127.0.0.1:3000` en `backend/.env`.

### Cuenta de prueba y Team

Puedes registrarte con un correo ficticio y una contraseña propia de al menos diez caracteres. No se envían correos externos. Las cuentas nuevas siempre tienen el rol de cliente; no existen contraseñas ni cuentas administradoras predefinidas en el código.

Para dar acceso a Team a una cuenta que hayas registrado en tu instalación:

```bash
npm run team:grant -- correo-registrado@example.test
```

Recarga la web después del cambio. El comando solo actúa sobre tu base local o la base configurada para esa ejecución. Requiere acceso al servidor; el rol no se puede elegir durante el registro público.

### Pedidos y comunicaciones

El servidor calcula los totales en céntimos y comprueba cada variante. El stock se descuenta al crear el pedido dentro de una transacción: si falla una pieza, se revierte el conjunto. Reenviar el mismo pedido con su misma clave no descuenta existencias de nuevo ni duplica la comunicación.

Team puede confirmar, simular el envío y marcar la entrega. También puede cancelar un pedido pendiente o confirmado, recuperando sus unidades una sola vez. Las líneas conservan nombre, imagen, variante y precio aunque después cambie el catálogo. Las comunicaciones permanecen dentro de la cuenta y tienen textos ES/EN.

### Pruebas y evidencias

```bash
npm test
npm run build
```

Las pruebas prioritarias cubren permisos, privacidad, stock, totales, pedidos duplicados, estados, ediciones desactualizadas e imágenes. Las comprobaciones ejecutadas y sus límites están en [Validación](docs/VALIDACION.md); las capturas de Safari, en [Evidencias](docs/evidencias/README.md).

### Despliegue y entrega

No hay todavía un despliegue público de Maison. Esta versión necesita **un servidor Node con disco persistente**, HTTPS y una única instancia de escritura. El [documento de despliegue](docs/DESPLIEGUE.md) describe la configuración y la alternativa de migrar la persistencia a un servicio alojado. El Dockerfile es una preparación pendiente de comprobar en Docker.

La entrega del TFM reunirá código, README, acceso a la aplicación y slides. El [seguimiento de entrega](docs/ENTREGA.md) distingue lo realizado de lo pendiente; la presentación final no está generada todavía.

### Documentación

- [Memoria del proyecto](MEMORIA.md).
- [Arquitectura y reglas de tienda](docs/ARQUITECTURA.md).
- [Validación](docs/VALIDACION.md) y [evidencias](docs/evidencias/README.md).
- [Recursos y reutilización](docs/RECURSOS.md).
- [Criterio de precios de lujo y actualización](docs/PRECIOS.md).
- [Despliegue](docs/DESPLIEGUE.md) y [seguimiento de entrega](docs/ENTREGA.md).

### Mis proyectos y redes

[AFM Moda Oceánica](https://proyecto-landing-page-1.vercel.app/) · [KelseTS Cars](https://kelsets-cars.vercel.app)

[GitHub](https://github.com/AraceliFradejas) · [LinkedIn](https://www.linkedin.com/in/araceli-fradejas-munoz-transformaciondigital/) · [X](https://x.com/AraceliFradejas) · [Medium](https://medium.com/@araceli.fradejas) · [YouTube](https://www.youtube.com/@aracelifradejasmunoz2758)

### Aviso académico y autora

KelseTS es una marca ficticia de **Araceli Fradejas Muñoz**. Maison es un proyecto educativo y de portfolio, sin actividad comercial, afiliación, patrocinio ni respaldo de celebridades, marcas o entidades deportivas. Sus productos, colecciones, precios y operaciones son ficticios. Las imágenes fotorrealistas del catálogo son representaciones generadas de productos ficticios, no fotografías de mercancía real. Los créditos y licencias de las tipografías están en [Recursos](docs/RECURSOS.md).

## English version

Full stack project for the **BigSchool final project**, created by **Araceli Fradejas Muñoz**.

> **Your style tells a story.**

KelseTS Maison is a fictional fashion, accessories and beauty boutique. Explore its collections, choose a variant, save favourite pieces and complete a demonstration order. There are no real sales, payments or shipments.

**Status:** first functional local version. Public deployment and the final presentation are pending.

### A personal story

Maison continues the KelseTS universe, the fictional brand that gives several projects in my portfolio their personal identity. Music, shared stories and sport are part of its inspiration. Here they appear in a selection for a concert, a quiet afternoon or the details that bring a look together.

After the AFM Moda Oceánica landing page and the full stack journey of KelseTS Cars, I wanted to bring that experience to a boutique. You can love a piece on its own, but choosing a variant and finding complementary pieces needs a clear journey. That idea shapes Maison.

### What you can do

- Explore an editorial home page and fifteen original collections.
- Browse 51 products with 140 variants, including 24 pieces in the luxury edit.
- Explore 21 editorial looks for events, interviews and TV, street style and everyday plans.
- Browse Fashion, Accessories and Beauty with search, filters, price sorting and pagination.
- Choose variants and check their prices and availability.
- Register, sign in and save products to “My selection”.
- Prepare a bag, create demonstration orders and view their history, details and messages.
- Find editorial combinations by occasion, palette, budget and whether to include beauty.
- Manage products, ES/EN text, images, variants and stock in Team; advance or cancel orders through allowed transitions.
- Switch between Spanish and English while keeping your route and bag.

“Complete your look” uses manual selections and actual catalogue availability. It is labelled **editorial mode, without AI**. Maison Stylist with an AI provider and a native app remain extensions to evaluate.

### Structure and technologies

The web uses React, React Router, Vite and CSS. The API uses Node.js, Express, Zod, session cookies and SQLite through `node:sqlite`. Sharp validates and optimises Team image uploads. Schemas and order rules live in a shared package; requests use an HTTP client independent of React.

```text
backend/
  src/modules/       # Authentication, catalogue, orders and images
  src/db.js          # Tables, transactions and seed
  scripts/           # Seed and local Team access
  test/              # API and shop-rule tests
frontend/
  src/app/           # Routes, navigation and protected pages
  src/features/      # Catalogue, account, bag, Team and brand
  src/shared/        # State, languages, components and requests
  src/styles/        # Design and responsive layout
  public/media/      # WebP catalog images and historical SVGs
packages/
  contracts/         # Schemas and order transitions
  api-client/        # HTTP transport and its tests
data/catalog.js      # Reproducible fictional catalogue and looks
docs/                # Architecture, resources, validation and delivery
scripts/             # Startup, assets and image migration
```

The local database lets you try Maison without external service accounts. It is independent of Cars and contains none of its users, data or credentials. On Node 22, `node:sqlite` emits an experimental-feature warning; the checked environment is recorded in [Validation](docs/VALIDACION.md).

### Local installation

1. Clone the repository:

   ```bash
   git clone https://github.com/AraceliFradejas/BigSchool-TFM_KelseTSMaison.git
   cd BigSchool-TFM_KelseTSMaison
   ```

2. Use Node.js 22, version 22.13 or later within that branch, and install:

   ```bash
   npm ci
   ```

3. Start the application:

   ```bash
   npm run dev
   ```

Open **http://127.0.0.1:5173**. The API is at **http://127.0.0.1:3000/api/v1/health**. The first run creates the database and inserts missing products automatically. `npm run seed` repeats that process without resetting stock or overwriting edits.

Defaults support local startup. To customise them, copy `backend/.env.example` to `backend/.env`. The database, sessions and uploaded images live in `backend/runtime/`, outside Git. Do not remove that directory if you want to keep orders and accounts.

To check the build without Vite:

```bash
npm run build
npm start
```

Then open **http://127.0.0.1:3000**. To change data from that address, first set `APP_ORIGIN=http://127.0.0.1:3000` in `backend/.env`.

### Test account and Team

Register with a fictional email and your own password of at least ten characters. No external emails are sent. New accounts always have the customer role; the code contains no predefined administrator accounts or passwords.

To grant Team access to an account registered in your installation:

```bash
npm run team:grant -- registered-email@example.test
```

Reload the web after this change. The command affects only your local database or the database configured for that execution. It requires server access; public registration cannot select a role.

### Orders and messages

The server calculates totals in cents and checks every variant. Stock is deducted transactionally when the order is created: a failed piece rolls back the whole order. Replaying the same order with the same key does not consume stock again or duplicate its message.

Team can confirm, simulate dispatch and mark delivery. It can also cancel a pending or confirmed order, restoring units once. Lines preserve the name, image, variant and price even if the catalogue changes later. Messages remain inside the account and have ES/EN text.

### Tests and evidence

```bash
npm test
npm run build
```

Priority tests cover permissions, privacy, stock, totals, duplicate orders, statuses, stale edits and images. Executed checks and their limits are in [Validation](docs/VALIDACION.md); Safari screenshots are in [Evidence](docs/evidencias/README.md).

### Deployment and delivery

Maison has no public deployment yet. This version needs **a Node server with persistent disk**, HTTPS and a single writing instance. The [deployment document](docs/DESPLIEGUE.md) describes configuration and the alternative of migrating persistence to a hosted service. The Dockerfile is preparatory and has not been checked in Docker.

The final project will include code, README, application access and slides. [Delivery tracking](docs/ENTREGA.md) separates completed work from pending work; the final presentation has not been generated yet.

### Documentation

- [Project report](MEMORIA.md).
- [Architecture and shop rules](docs/ARQUITECTURA.md).
- [Validation](docs/VALIDACION.md) and [evidence](docs/evidencias/README.md).
- [Resources and reuse](docs/RECURSOS.md).
- [Luxury pricing references and migration](docs/PRECIOS.md).
- [Deployment](docs/DESPLIEGUE.md) and [delivery tracking](docs/ENTREGA.md).

### My projects and social profiles

[AFM Moda Oceánica](https://proyecto-landing-page-1.vercel.app/) · [KelseTS Cars](https://kelsets-cars.vercel.app)

[GitHub](https://github.com/AraceliFradejas) · [LinkedIn](https://www.linkedin.com/in/araceli-fradejas-munoz-transformaciondigital/) · [X](https://x.com/AraceliFradejas) · [Medium](https://medium.com/@araceli.fradejas) · [YouTube](https://www.youtube.com/@aracelifradejasmunoz2758)

### Academic notice and author

KelseTS is a fictional brand by **Araceli Fradejas Muñoz**. Maison is an educational and portfolio project without commercial activity, affiliation, sponsorship or endorsement by celebrities, brands or sporting organisations. Its products, collections, prices and operations are fictional. Photorealistic catalogue images are generated representations of fictional products, not photographs of real merchandise. Font credits and licences are in [Resources](docs/RECURSOS.md).

Para actualizar una base local anterior con los nuevos recursos de catálogo: `npm run media:migrate`. Solo sustituye las imágenes SVG originales; conserva stock, imágenes personalizadas y pedidos. Las instalaciones nuevas utilizan WebP desde el inicio.

Para aplicar los precios de lujo a una base local anterior: `npm run prices:migrate`. Conserva precios personalizados por Team, stock y pedidos anteriores. Las instalaciones nuevas incorporan los precios actualizados.
