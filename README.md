# Sistema de reservas

Página web para gestionar reservas de un restaurante. El cliente indica la
fecha, el número de personas y elige una mesa disponible. El administrador
gestiona las mesas, sus horarios y las reservas desde un panel privado.

## Tecnologías

- HTML y CSS
- JavaScript con módulos ES
- Firebase Firestore
- Firebase Authentication

## Archivos principales

```text
index.html             Página para clientes
admin.html             Panel de administración
css/styles.css         Estilos
js/config.js           Configuración de Firebase
js/firebase-init.js    Conexión con Firebase
js/app.js              Flujo de reservas
js/admin.js            Funciones del panel
js/availability.js     Disponibilidad y conflictos
js/mesas.js            Gestión de mesas
firestore.rules        Reglas de Firestore
```

## Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Activa Firestore Database.
3. Activa Authentication con acceso por correo y contraseña.
4. Crea el usuario que utilizarás para entrar al panel.
5. Registra una aplicación web y copia sus datos en `js/config.js`.
6. Sustituye el correo del administrador en `js/config.js` y `firestore.rules`.
7. Publica el contenido de `firestore.rules` desde la sección de reglas de Firestore.

## Uso

En `admin.html`, inicia sesión y crea cada mesa con estos datos:

- Número de mesa
- Capacidad de sillas
- Hora disponible desde
- Hora disponible hasta

Desde la misma pantalla puedes editar o eliminar mesas y cancelar reservas.

En `index.html`, el cliente selecciona una fecha y el número de personas. Solo
se muestran mesas individuales con capacidad suficiente. El horario de la
reserva es el que tiene configurado la mesa y aparece antes de confirmar.

Al confirmar se genera un código de cancelación de seis caracteres. El cliente
puede usarlo más tarde en la sección “Cancelar reserva”.

## Ejecutar en local

Los módulos ES necesitan un servidor local. Desde la carpeta del proyecto:

```bash
npx serve .
```

Después abre la dirección que indique el comando, normalmente
`http://localhost:3000`.

## Publicar en GitHub Pages

1. Sube el proyecto a GitHub.
2. Abre **Settings > Pages**.
3. Selecciona la rama `main` y la carpeta raíz.
4. Guarda los cambios y espera a que GitHub genere la dirección pública.

## Consideraciones

La disponibilidad se consulta en Firestore y las reservas canceladas dejan de
bloquear la mesa. Para evitar reservas duplicadas, la validación se repite al
confirmar la reserva. La lógica se ejecuta en el navegador; para un nivel de
seguridad mayor habría que mover la creación de reservas a un backend.
