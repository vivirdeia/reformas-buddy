import type { DB } from "./types";

/** PIN de 4 dígitos que no usa nadie más. */
export const pinUnico = (db: DB, excepto?: string) => {
  let p: string;
  do p = String(1000 + Math.floor(Math.random() * 9000)); while (db.usuarios.some((u) => u.id !== excepto && u.pin === p));
  return p;
};
export const pinValido = (p: string) => /^\d{4}$/.test(p);
export const pinOcupado = (db: DB, p: string, excepto?: string) => db.usuarios.some((u) => u.id !== excepto && u.pin === p);

/** ¿Tiene el usuario registros que dependen de él? Entonces solo se puede desactivar. */
export function tieneHistorial(db: DB, id: string) {
  if (db.fichajes.some((f) => f.userId === id || f.corregido?.por === id)) return true;
  if (db.tareas.some((t) => t.operarioId === id || t.creadaPor === id)) return true;
  return db.obras.some((o) =>
    o.clienteId === id || o.equipo.jefeId === id || o.equipo.operarioIds.includes(id) ||
    o.partesDiarios.some((p) => p.autorId === id || p.operarioIds.includes(id)) ||
    o.notas.some((n) => n.autorId === id) || o.incidencias.some((i) => i.autorId === id) ||
    o.ordenesCambio.some((c) => c.creadaPor === id || c.anuladaPor === id));
}

/** Vincula un cliente a una obra (y desvincula a quien la tuviera). */
export function vincularCliente(db: DB, userId: string, obraId?: string) {
  const u = db.usuarios.find((x) => x.id === userId);
  if (!u) return;
  u.obraId = obraId || undefined;
  if (!obraId) return;
  const o = db.obras.find((x) => x.id === obraId);
  if (!o) return;
  const antes = db.usuarios.find((x) => x.id === o.clienteId && x.id !== userId);
  if (antes) antes.obraId = undefined;
  o.clienteId = userId;
}

/** Borra un gremio: sale de los equipos y sus apuntes conservan el nombre como proveedor. */
export function borrarGremio(db: DB, id: string) {
  const g = db.gremios.find((x) => x.id === id);
  if (!g) return;
  db.obras.forEach((o) => {
    o.equipo.gremioIds = o.equipo.gremioIds.filter((x) => x !== id);
    o.apuntes.forEach((a) => { if (a.gremioId === id) { a.gremioId = undefined; a.proveedor ||= `${g.empresa} (${g.oficio})`; } });
  });
  db.gremios = db.gremios.filter((x) => x.id !== id);
}
