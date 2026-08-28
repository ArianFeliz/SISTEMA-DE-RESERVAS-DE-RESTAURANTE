import {
  auth, db, doc, updateDoc,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "./firebase-init.js";
import { obtenerMesas, crearMesa, editarMesa, eliminarMesa } from "./mesas.js";
import { obtenerReservasDelDia } from "./availability.js";

const seccionLogin = document.getElementById("seccion-login");
const panelAdmin = document.getElementById("panel-admin");
const formLogin = document.getElementById("form-login");
const mensajeLogin = document.getElementById("mensaje-login");
const btnLogout = document.getElementById("btn-logout");
const mensajeAdmin = document.getElementById("mensaje-admin");

const formMesa = document.getElementById("form-mesa");
const tablaMesas = document.getElementById("tabla-mesas");

const filtroFecha = document.getElementById("filtro-fecha");
const tablaReservas = document.getElementById("tabla-reservas");
const sinReservas = document.getElementById("sin-reservas");

onAuthStateChanged(auth, (user) => {
  if (user) {
    seccionLogin.style.display = "none";
    panelAdmin.style.display = "block";
    cargarMesas();
    const ahora = new Date();
    filtroFecha.value = [ahora.getFullYear(), String(ahora.getMonth() + 1).padStart(2, "0"), String(ahora.getDate()).padStart(2, "0")].join("-");
    cargarReservas(filtroFecha.value);
  } else {
    seccionLogin.style.display = "block";
    panelAdmin.style.display = "none";
  }
});
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeLogin.innerHTML = "";
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-pass").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    mensajeLogin.innerHTML = `<div class="mensaje error">Correo o contraseña incorrectos.</div>`;
  }
});

btnLogout.addEventListener("click", () => signOut(auth));

async function cargarMesas() {
  tablaMesas.innerHTML = `<tr><td colspan="4">Cargando…</td></tr>`;
  try {
    const mesas = await obtenerMesas();
    pintarMesas(mesas);
  } catch (err) {
    tablaMesas.innerHTML = `<tr><td colspan="4">No se pudieron cargar las mesas.</td></tr>`;
    mostrarErrorAdmin(err);
  }
}

function pintarMesas(mesas) {
  if (mesas.length === 0) {
    tablaMesas.innerHTML = `<tr><td colspan="4">Sin mesas aún. Añade la primera arriba.</td></tr>`;
    return;
  }
  tablaMesas.innerHTML = "";
  for (const mesa of mesas) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>Mesa ${mesa.numero}</td>
      <td>${mesa.capacidad} sillas</td>
      <td>${mesa.horaDesde || "—"} a ${mesa.horaHasta || "—"}</td>
      <td><button class="btn-secondary btn-editar" type="button">Editar</button> <button class="btn-danger btn-eliminar" type="button">Eliminar</button></td>
    `;
    tr.querySelector(".btn-editar").addEventListener("click", () => activarEdicionMesa(tr, mesa));
    tr.querySelector(".btn-eliminar").addEventListener("click", async () => {
      if (confirm(`¿Eliminar la mesa ${mesa.numero}? Esto no cancela reservas ya hechas para ella.`)) {
        try {
          await eliminarMesa(mesa.id);
          await cargarMesas();
        } catch (err) {
          mostrarErrorAdmin(err);
        }
      }
    });
    tablaMesas.appendChild(tr);
  }
}

function activarEdicionMesa(tr, mesa) {
  tr.innerHTML = `
    <td><input type="number" class="editar-numero" min="1" value="${mesa.numero}" aria-label="Número de mesa"></td>
    <td><input type="number" class="editar-capacidad" min="1" max="20" value="${mesa.capacidad}" aria-label="Capacidad de mesa"></td>
    <td><input type="time" class="editar-desde" value="${mesa.horaDesde || ""}" aria-label="Hora desde"> a <input type="time" class="editar-hasta" value="${mesa.horaHasta || ""}" aria-label="Hora hasta"></td>
    <td><button class="btn-primary btn-guardar" type="button">Guardar</button> <button class="btn-secondary btn-cancelar" type="button">Cancelar</button></td>
  `;
  tr.querySelector(".btn-cancelar").addEventListener("click", () => cargarMesas());
  tr.querySelector(".btn-guardar").addEventListener("click", async () => {
    const numero = parseInt(tr.querySelector(".editar-numero").value, 10);
    const capacidad = parseInt(tr.querySelector(".editar-capacidad").value, 10);
    const horaDesde = tr.querySelector(".editar-desde").value;
    const horaHasta = tr.querySelector(".editar-hasta").value;
    if (!horaDesde || !horaHasta || horaDesde >= horaHasta) {
      mostrarErrorAdmin({ message: "La hora hasta debe ser posterior a la hora desde." });
      return;
    }
    try {
      await editarMesa(mesa.id, { numero, capacidad, horaDesde, horaHasta });
      await cargarMesas();
    } catch (err) {
      mostrarErrorAdmin(err);
    }
  });
}

formMesa.addEventListener("submit", async (e) => {
  e.preventDefault();
  const numero = parseInt(document.getElementById("mesa-numero").value, 10);
  const capacidad = parseInt(document.getElementById("mesa-capacidad").value, 10);
  const horaDesde = document.getElementById("mesa-desde").value;
  const horaHasta = document.getElementById("mesa-hasta").value;
  if (horaDesde >= horaHasta) {
    mostrarErrorAdmin({ message: "La hora hasta debe ser posterior a la hora desde." });
    return;
  }
  try {
    await crearMesa({ numero, capacidad, horaDesde, horaHasta });
    formMesa.reset();
    await cargarMesas();
  } catch (err) {
    mostrarErrorAdmin(err);
  }
});

filtroFecha.addEventListener("change", () => cargarReservas(filtroFecha.value));

async function cargarReservas(fecha) {
  tablaReservas.innerHTML = `<tr><td colspan="6">Cargando…</td></tr>`;
  sinReservas.style.display = "none";

  try {
    const [mesas, reservas] = await Promise.all([
      obtenerMesas(),
      obtenerReservasDelDia(fecha)
    ]);
    const mesasPorId = Object.fromEntries(mesas.map(m => [m.id, m]));
    reservas.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    if (reservas.length === 0) {
      tablaReservas.innerHTML = "";
      sinReservas.style.display = "block";
      return;
    }

    tablaReservas.innerHTML = "";
    for (const r of reservas) {
    const mesa = mesasPorId[r.mesaId];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.horaInicio} a ${r.horaFin || "—"}</td>
      <td>${mesa ? "Mesa " + mesa.numero : "—"}</td>
      <td>${escapeHtml(r.nombreCliente)}</td>
      <td>${escapeHtml(r.telefono || "")}</td>
      <td>${r.personas}</td>
      <td><button class="btn-danger" data-id="${r.id}">Cancelar</button></td>
    `;
      tr.querySelector("button").addEventListener("click", async (e) => {
        if (confirm("¿Cancelar esta reserva? La mesa quedará libre para ese horario.")) {
          e.currentTarget.disabled = true;
          try {
            await updateDoc(doc(db, "reservas", r.id), { estado: "cancelada" });
            await cargarReservas(fecha);
          } catch (err) {
            e.currentTarget.disabled = false;
            mostrarErrorAdmin(err);
          }
        }
      });
      tablaReservas.appendChild(tr);
    }
  } catch (err) {
    tablaReservas.innerHTML = `<tr><td colspan="6">No se pudieron cargar las reservas.</td></tr>`;
    mostrarErrorAdmin(err);
  }
}

function mostrarErrorAdmin(err) {
  mensajeAdmin.innerHTML = `<div class="mensaje error">${escapeHtml(err.message || "Operación no permitida.")}</div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
