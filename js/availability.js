import {
  db, collection, query, where, getDocs, getDocsFromServer,
  runTransaction, doc, serverTimestamp, updateDoc
} from "./firebase-init.js";
import { RESTAURANT_CONFIG } from "./config.js";

function horaAMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function seSolapan(inicioA, finA, inicioB, finB) {
  return inicioA < finB && inicioB < finA;
}

export async function obtenerReservasDelDia(fecha) {
  const q = query(
    collection(db, "reservas"),
    where("fecha", "==", fecha)
  );
  const snap = await getDocsFromServer(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(reserva => reserva.estado === "confirmada");
}

export function mesasOcupadasEnHorario(reservasDelDia, horaInicio, horaFin) {
  const inicioSolicitado = horaAMinutos(horaInicio);
  const finSolicitado = horaAMinutos(horaFin);

  const ocupadas = new Set();
  for (const r of reservasDelDia) {
    const inicioExistente = horaAMinutos(r.horaInicio);
    const finExistente = r.horaFin
      ? horaAMinutos(r.horaFin)
      : inicioExistente + RESTAURANT_CONFIG.duracionReservaMinutos;
    if (seSolapan(inicioSolicitado, finSolicitado, inicioExistente, finExistente)) {
      ocupadas.add(r.mesaId);
    }
  }
  return ocupadas;
}

export function mesaTieneChoque(reservasDelDia, mesaId, horaInicio, horaFin) {
  return mesasOcupadasEnHorario(
    reservasDelDia.filter(reserva => reserva.mesaId === mesaId),
    horaInicio,
    horaFin
  ).has(mesaId);
}

export function elegirMejorMesa(mesas, mesasOcupadas, personas) {
  return mesas
    .filter(m => !mesasOcupadas.has(m.id) && m.capacidad >= personas)
    .sort((a, b) => a.capacidad - b.capacidad)[0] || null;
}

export async function crearReservaSegura({ mesaId, fecha, horaInicio, horaFin, nombreCliente, telefono, personas }) {
  const inicioSolicitado = horaAMinutos(horaInicio);
  const finSolicitado = horaAMinutos(horaFin);
  const codigoCancelacion = generarCodigoCancelacion();

  return runTransaction(db, async (transaction) => {
    const q = query(
      collection(db, "reservas"),
      where("mesaId", "==", mesaId),
      where("fecha", "==", fecha),
      where("estado", "==", "confirmada")
    );
    const snap = await getDocs(q);
    const choque = snap.docs.some(d => {
      const r = d.data();
      const inicioExistente = horaAMinutos(r.horaInicio);
      const finExistente = r.horaFin
        ? horaAMinutos(r.horaFin)
        : inicioExistente + RESTAURANT_CONFIG.duracionReservaMinutos;
      return seSolapan(inicioSolicitado, finSolicitado, inicioExistente, finExistente);
    });

    if (choque) {
      throw new Error("Esa mesa ya no está disponible en ese horario. Por favor elige otra opción.");
    }

    const nuevaReservaRef = doc(collection(db, "reservas"));
    transaction.set(nuevaReservaRef, {
      mesaId,
      fecha,
      horaInicio,
      horaFin,
      nombreCliente,
      telefono,
      personas,
      estado: "confirmada",
      codigoCancelacion,
      creadoEn: serverTimestamp()
    });

    return {
      id: nuevaReservaRef.id,
      codigoCancelacion
    };
  });
}

function generarCodigoCancelacion() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const valores = new Uint32Array(6);
  crypto.getRandomValues(valores);
  return Array.from(valores, valor => caracteres[valor % caracteres.length]).join("");
}

export async function cancelarReservaPorCodigo(codigoCancelacion) {
  const q = query(
    collection(db, "reservas"),
    where("codigoCancelacion", "==", codigoCancelacion)
  );
  const snap = await getDocsFromServer(q);
  const reserva = snap.docs.find(d => d.data().estado === "confirmada");
  if (!reserva) {
    throw new Error("No encontramos una reserva activa con ese código.");
  }

  await updateDoc(reserva.ref, { estado: "cancelada" });
  return reserva.id;
}
