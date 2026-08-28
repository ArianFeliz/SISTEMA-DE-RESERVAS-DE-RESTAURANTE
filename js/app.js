import { obtenerMesas } from "./mesas.js";
import { obtenerReservasDelDia, mesaTieneChoque, crearReservaSegura, cancelarReservaPorCodigo } from "./availability.js";

const formDetalles = document.getElementById("form-detalles");
const inputFecha = document.getElementById("fecha");
const seccionMesas = document.getElementById("seccion-mesas");
const mesasGrid = document.getElementById("mesas-grid");
const resumenBusqueda = document.getElementById("resumen-busqueda");
const seccionDatos = document.getElementById("seccion-datos");
const formCliente = document.getElementById("form-cliente");
const mensajeReserva = document.getElementById("mensaje-reserva");
const btnConfirmar = document.getElementById("btn-confirmar");
const seccionTicket = document.getElementById("seccion-ticket");
const ticketDetalles = document.getElementById("ticket-detalles");
const btnNuevaReserva = document.getElementById("btn-nueva-reserva");
const formCancelar = document.getElementById("form-cancelar");
const mensajeCancelacion = document.getElementById("mensaje-cancelacion");

let mesaSeleccionada = null;
let busquedaActual = null;
function fechaMinimaHoy() {
  const ahora = new Date();
  const hoy = [ahora.getFullYear(), String(ahora.getMonth() + 1).padStart(2, "0"), String(ahora.getDate()).padStart(2, "0")].join("-");
  inputFecha.min = hoy;
  inputFecha.value = hoy;
}
fechaMinimaHoy();

formDetalles.addEventListener("submit", async (e) => {
  e.preventDefault();
  mesaSeleccionada = null;
  seccionDatos.style.display = "none";
  mensajeReserva.innerHTML = "";

  const fecha = inputFecha.value;
  const personas = parseInt(document.getElementById("personas").value, 10);
  busquedaActual = { fecha, personas };

  mesasGrid.innerHTML = `<p class="loading-state">Consultando disponibilidad…</p>`;
  seccionMesas.style.display = "block";

  try {
    const [mesas, reservasDelDia] = await Promise.all([
      obtenerMesas(),
      obtenerReservasDelDia(fecha)
    ]);
    pintarMesas(mesas, reservasDelDia, personas);
    resumenBusqueda.textContent =
      `${fecha} · ${personas} persona${personas === 1 ? "" : "s"} — toca una mesa libre con capacidad suficiente.`;
  } catch (err) {
    mesasGrid.innerHTML = `<div class="mensaje error">No se pudo cargar la disponibilidad. Revisa la configuración de Firebase en js/config.js.<br><small>${err.message}</small></div>`;
  }
});

function pintarMesas(mesas, reservasDelDia, personas) {
  const mesasConCapacidad = mesas.filter(mesa => mesa.capacidad >= personas);
  if (mesasConCapacidad.length === 0) {
    mesasGrid.innerHTML = `<div class="mensaje info">No hay una mesa individual con capacidad para ${personas} personas.</div>`;
    return;
  }
  mesasGrid.innerHTML = "";
  for (const mesa of mesasConCapacidad) {
    const tieneHorario = Boolean(mesa.horaDesde && mesa.horaHasta);
    const horaDesde = mesa.horaDesde;
    const horaHasta = mesa.horaHasta;
    const ocupada = tieneHorario && mesaTieneChoque(reservasDelDia, mesa.id, horaDesde, horaHasta);
    const bloqueada = ocupada || !tieneHorario;

    const card = document.createElement("div");
    card.className = "mesa-card" + (bloqueada ? " ocupada" : "");
    card.innerHTML = `
      <span class="stamp ${ocupada || !tieneHorario ? "ocupada-stamp" : "libre"}">${ocupada ? "Ocupada" : (!tieneHorario ? "Sin horario" : "Libre")}</span>
      <div class="mesa-numero">Mesa ${mesa.numero}</div>
      <div class="mesa-horario">${tieneHorario ? `Tu reserva: ${horaDesde} a ${horaHasta}` : "Horario no configurado"}</div>
      <div class="mesa-sillas">${"●".repeat(0)}${dots(mesa.capacidad)}</div>
      <div style="font-family:var(--font-mono); font-size:0.72rem; margin-top:0.3rem; opacity:0.7;">${mesa.capacidad} sillas</div>
    `;
    if (!bloqueada) {
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.addEventListener("click", () => seleccionarMesa(mesa, card));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          seleccionarMesa(mesa, card);
        }
      });
    }
    mesasGrid.appendChild(card);
  }
}

function dots(n) {
  let html = "";
  for (let i = 0; i < n; i++) html += `<span class="silla-dot"></span>`;
  return html;
}

function seleccionarMesa(mesa, card) {
  mesaSeleccionada = mesa;
  document.querySelectorAll(".mesa-card").forEach(c => c.classList.remove("seleccionada"));
  card.classList.add("seleccionada");
  seccionDatos.style.display = "block";
  seccionDatos.scrollIntoView({ behavior: "smooth", block: "start" });
}

formCliente.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!mesaSeleccionada || !busquedaActual) return;

  btnConfirmar.disabled = true;
  btnConfirmar.textContent = "Confirmando…";
  mensajeReserva.innerHTML = "";

  const nombreCliente = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();

  try {
    const reservaCreada = await crearReservaSegura({
      mesaId: mesaSeleccionada.id,
      fecha: busquedaActual.fecha,
      horaInicio: mesaSeleccionada.horaDesde,
      nombreCliente,
      telefono,
      personas: busquedaActual.personas,
      horaFin: mesaSeleccionada.horaHasta
    });
    mostrarTicket({ mesa: mesaSeleccionada, ...busquedaActual, hora: mesaSeleccionada.horaDesde, horaHasta: mesaSeleccionada.horaHasta, nombreCliente, telefono, codigoCancelacion: reservaCreada.codigoCancelacion });
  } catch (err) {
    mensajeReserva.innerHTML = `<div class="mensaje error">${err.message}</div>`;
    btnConfirmar.disabled = false;
    btnConfirmar.textContent = "Confirmar reserva";
  }
});

function mostrarTicket({ mesa, fecha, hora, horaHasta, personas, nombreCliente, telefono, codigoCancelacion }) {
  formDetalles.parentElement.style.display = "none"; // oculta card del paso 1
  seccionMesas.style.display = "none";
  seccionDatos.style.display = "none";
  seccionTicket.style.display = "block";
  ticketDetalles.innerHTML = `
    <dt>Cliente</dt><dd>${escapeHtml(nombreCliente)}</dd>
    <dt>Teléfono</dt><dd>${escapeHtml(telefono)}</dd>
    <dt>Fecha</dt><dd>${fecha}</dd>
    <dt>Horario</dt><dd>${hora} a ${horaHasta}</dd>
    <dt>Mesa</dt><dd>Nº ${mesa.numero} (${mesa.capacidad} sillas)</dd>
    <dt>Personas</dt><dd>${personas}</dd>
    <dt>Código de cancelación</dt><dd><strong>${escapeHtml(codigoCancelacion)}</strong></dd>
  `;
  seccionTicket.scrollIntoView({ behavior: "smooth", block: "start" });
}

formCancelar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputCodigo = document.getElementById("codigo-cancelacion");
  const codigo = inputCodigo.value.trim().toUpperCase();
  mensajeCancelacion.innerHTML = "";

  try {
    await cancelarReservaPorCodigo(codigo);
    formCancelar.reset();
    mensajeCancelacion.innerHTML = `<div class="mensaje exito">Reserva cancelada. La mesa vuelve a estar disponible.</div>`;
  } catch (err) {
    mensajeCancelacion.innerHTML = `<div class="mensaje error">${escapeHtml(err.message)}</div>`;
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

btnNuevaReserva.addEventListener("click", () => {
  seccionTicket.style.display = "none";
  formDetalles.parentElement.style.display = "block";
  seccionMesas.style.display = "none";
  seccionDatos.style.display = "none";
  formCliente.reset();
  btnConfirmar.disabled = false;
  btnConfirmar.textContent = "Confirmar reserva";
  mesaSeleccionada = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
