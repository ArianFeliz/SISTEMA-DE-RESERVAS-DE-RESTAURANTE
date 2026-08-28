# La Mesa — Sistema de reservas de restaurante

Sistema estático (HTML + CSS + JS, sin build tools) con Firebase como base de
datos compartida en la nube, pensado para publicarse en GitHub Pages y que
cualquier persona pueda abrir el link y probarlo con datos reales y
compartidos entre clientes y administrador.

## Estructura del proyecto

```
├── index.html          → vista de cliente (reservar)
├── admin.html           → panel de administración
├── css/
│   └── styles.css
├── js/
│   ├── config.js         → credenciales de Firebase + reglas de negocio
│   ├── firebase-init.js  → inicialización del SDK
│   ├── availability.js   → motor de disponibilidad (pieza de mayor riesgo)
│   ├── mesas.js           → CRUD de mesas
│   ├── app.js             → lógica de la página de cliente
│   └── admin.js           → lógica del panel de administración
└── firestore.rules       → reglas de seguridad (se cargan en Firebase Console)
```

## 1. Crear el proyecto en Firebase (gratis)

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) → **Crear proyecto**.
2. Dentro del proyecto, ve a **Compilación → Firestore Database → Crear base de datos** (modo producción, la región más cercana a ti).
3. Ve a **Compilación → Authentication → Comenzar → Método de acceso → Correo/Contraseña** → habilítalo.
4. En **Authentication → Users → Añadir usuario**, crea el usuario admin (ej. `admin@turestaurante.com` + una contraseña).
5. Ve a **Configuración del proyecto (⚙️) → Tus apps → </> (Web)**, registra una app y copia el objeto `firebaseConfig` que te muestra.

## 2. Configurar el proyecto

1. Abre `js/config.js` y pega tu `firebaseConfig` copiado del paso anterior.
2. Cambia `correoAdmin` por el mismo correo que creaste en Authentication.
3. Abre `firestore.rules` y reemplaza `admin@turestaurante.com` por ese mismo correo en **ambos** lugares donde aparece.
4. Los horarios y la duración se configuran por mesa desde `admin.html`.

## 3. Publicar las reglas de seguridad

En Firebase Console → **Firestore Database → Reglas**, pega el contenido de `firestore.rules` y pulsa **Publicar**.

## 4. Probarlo en local (opcional)

Como usa módulos ES (`type="module"`), no puedes abrir `index.html` con doble clic (el navegador bloquea `fetch` de módulos en `file://`). Usa un servidor simple:

```bash
npx serve .
# o
python3 -m http.server 8000
```

Y abre `http://localhost:8000`.

## 5. Publicar en GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub.
2. Ve a **Settings → Pages** del repo.
3. En **Source**, elige la rama (`main`) y carpeta raíz (`/`).
4. Guarda — GitHub te dará un link como `https://tu-usuario.github.io/tu-repo/`.
5. Ese link ya es 100% funcional para cualquier visitante: clientes reservan en `index.html`, tú administras en `admin.html`.

## 6. Primer uso

1. Abre `admin.html`, inicia sesión con el usuario admin que creaste.
2. Añade cada mesa indicando número, capacidad, horario disponible y duración de reserva.
3. Comparte el link principal (`index.html`) — ya se puede reservar.

## 7. Cancelación por código

Al confirmar una reserva se genera un código de cancelación de seis caracteres
y se muestra en el ticket. El cliente puede introducir ese código en la sección
“Cancelar reserva” para cambiar el estado de esa reserva a `cancelada`; la mesa
 volverá a aparecer disponible para su horario. No se necesita una cuenta ni el
teléfono del cliente.

Después de cambiar `firestore.rules`, vuelve a publicar las reglas en Firebase
Console para habilitar esta cancelación desde la página pública.

## Nota sobre la validación de choques de horario

La prevención de dobles reservas se hace con una transacción de Firestore
(`js/availability.js`) que revalida disponibilidad justo antes de escribir.
Esto cubre el uso normal de la app. Alguien con conocimientos técnicos que
manipule la consola del navegador directamente podría, en teoría, saltarse
esa validación — para blindarlo completamente haría falta mover esa lógica
a un backend (ej. Cloud Functions), fuera del alcance de esta primera
versión estática. Ver conversación de diseño para el detalle de este trade-off.
