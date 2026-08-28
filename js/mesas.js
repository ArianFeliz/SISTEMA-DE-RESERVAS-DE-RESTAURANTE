import {
  db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc
} from "./firebase-init.js";

export async function obtenerMesas() {
  const snap = await getDocs(collection(db, "mesas"));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.numero - b.numero);
}

export async function crearMesa({ numero, capacidad, horaDesde, horaHasta }) {
  return addDoc(collection(db, "mesas"), { numero, capacidad, horaDesde, horaHasta });
}

export async function editarMesa(mesaId, { numero, capacidad, horaDesde, horaHasta }) {
  return updateDoc(doc(db, "mesas", mesaId), { numero, capacidad, horaDesde, horaHasta });
}

export async function eliminarMesa(mesaId) {
  return deleteDoc(doc(db, "mesas", mesaId));
}
