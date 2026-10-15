import type { DB, Fase, FaseTipo, HitoPago, Obra } from "./types";
import { FASES } from "./seed";
import { addDias, hoyISO } from "./fechas";
import { dd } from "./analitica";

export const PLAN_PAGOS: [string, number][] = [["A la firma", 30], ["Fin de instalaciones", 30], ["Alicatado y carpintería", 30], ["A la entrega de llaves", 10]];
export const planPagosDefecto = (): HitoPago[] => PLAN_PAGOS.map(([c, p], i) => ({ id: `h${i + 1}`, concepto: c, porcentaje: p, estado: "pendiente" }));

/** Fases encadenadas desde una fecha con duraciones en días. */
export function fasesDesde(inicio: string, dias: Record<FaseTipo, number> = Object.fromEntries(FASES.map((f) => [f.tipo, f.dias])) as Record<FaseTipo, number>): Fase[] {
  let cur = inicio;
  return FASES.map((f) => {
    const ip = cur; const fp = addDias(ip, Math.max(1, dias[f.tipo] ?? f.dias) - 1); cur = addDias(fp, 1);
    return { tipo: f.tipo, inicioPrevisto: ip, finPrevisto: fp, estado: "pendiente" };
  });
}

/** Recalcula inicio y fin previstos de la obra a partir de las fases. */
export function recalcularFechas(o: Obra) {
  if (!o.fases.length) return;
  o.fechaInicio = o.fases.map((f) => f.inicioPrevisto).sort()[0]!;
  o.fechaFinPrevista = o.fases.map((f) => f.finPrevisto).sort().at(-1)!;
}

/** Índices de fases cuyo inicio previsto se solapa con la anterior. */
export const solapes = (o: Obra) => o.fases.map((f, i) => (i > 0 && f.inicioPrevisto <= o.fases[i - 1]!.finPrevisto ? i : -1)).filter((i) => i >= 0);
export const fechasInvalidas = (o: Obra) => o.fases.map((f, i) => (f.finPrevisto < f.inicioPrevisto ? i : -1)).filter((i) => i >= 0);

export type AccionFase = "iniciar" | "completar" | "bloquear" | "desbloquear" | "reabrir";
export function aplicarFase(o: Obra, i: number, a: AccionFase, hoy = hoyISO()) {
  const f = o.fases[i]; if (!f) return;
  if (a === "iniciar") { f.estado = "en_curso"; f.inicioReal ??= hoy; delete f.finReal; }
  if (a === "completar") { f.estado = "completada"; f.inicioReal ??= hoy; f.finReal = hoy < f.inicioReal ? f.inicioReal : hoy; }
  if (a === "bloquear") { f.estado = "bloqueada"; f.inicioReal ??= hoy; }
  if (a === "desbloquear") f.estado = "en_curso";
  if (a === "reabrir") { f.estado = "en_curso"; delete f.finReal; }
}

/** Mueve todas las fechas previstas cuando cambia la fecha de inicio. */
export function moverInicio(o: Obra, nuevo: string) {
  const delta = dd(o.fechaInicio, nuevo);
  if (!delta) return;
  o.fases.forEach((f) => { f.inicioPrevisto = addDias(f.inicioPrevisto, delta); f.finPrevisto = addDias(f.finPrevisto, delta); });
  o.fechaInicio = nuevo; o.fechaFinPrevista = addDias(o.fechaFinPrevista, delta);
}

/** Borra la obra y todo lo que cuelga de ella. Los archivos de IndexedDB huérfanos se eliminan al guardar. */
export function borrarObra(db: DB, id: string) {
  db.obras = db.obras.filter((o) => o.id !== id);
  db.fichajes = db.fichajes.filter((f) => f.obraId !== id);
  db.tareas = db.tareas.filter((t) => t.obraId !== id);
  db.usuarios.forEach((u) => { if (u.obraId === id) delete u.obraId; });
  db.solicitudes.forEach((s) => { if (s.obraId === id) delete s.obraId; });
}

export const pinNuevo = (db: DB) => { let p: string; do p = String(1000 + Math.floor(Math.random() * 9000)); while (db.usuarios.some((u) => u.pin === p)); return p; };
export const PORTADA_DEFECTO = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=70";
