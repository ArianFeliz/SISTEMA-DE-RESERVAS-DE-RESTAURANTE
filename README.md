# Sistema de reservas

Aplicación web para reservar mesas en D'ArianFood.

## Usarlo en línea

Cuando GitHub Pages esté activo, abre la aplicación desde este enlace:

**[Abrir sistema de reservas](https://arianfeliz.github.io/SISTEMA-DE-RESERVAS-DE-RESTAURANTE/)**

### Hacer una reserva

1. Abre el enlace principal.
2. Selecciona la fecha de la visita.
3. Indica el número de personas.
4. Pulsa **Ver mesas disponibles**.
5. Elige una mesa libre.
6. Escribe tu nombre y teléfono.
7. Pulsa **Confirmar reserva**.
8. Guarda el código de cancelación que aparece en el ticket.

El horario de cada mesa aparece en su tarjeta. Las mesas ocupadas o que no
cuentan con un horario configurado no se pueden seleccionar.

### Cancelar una reserva

1. Vuelve al enlace principal.
2. Baja hasta **Cancelar reserva**.
3. Escribe el código de seis caracteres que recibiste al reservar.
4. Pulsa **Cancelar reserva**.

Después de cancelar, la mesa vuelve a estar disponible para esa fecha y horario.

### Usar el panel de administración

El panel se encuentra en:

**[Abrir panel admin](https://arianfeliz.github.io/SISTEMA-DE-RESERVAS-DE-RESTAURANTE/admin.html)**

1. Inicia sesión con la cuenta del administrador.
2. Añade una mesa indicando número, capacidad y horario disponible.
3. Usa **Editar** para cambiar los datos de una mesa.
4. Usa **Eliminar** para quitar una mesa.
5. Revisa las reservas filtrando por fecha.
6. Cancela una reserva desde la tabla cuando sea necesario.

## Tecnologías

- HTML y CSS
- JavaScript
- Firebase Firestore
- Firebase Authentication
