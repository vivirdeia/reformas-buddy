import type { DB, EstadoObra, Obra } from "./types";
import { avance } from "./store";
import { importeHito, vigente } from "./economia";
import { addDias, diaSemana, hoyISO } from "./fechas";

export const dd = (a: string, b: string) => Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000);

/* ---------- Semáforo derivado ---------- */
/** Umbrales del semáforo automático (en días). */
export const UMBRALES = {
  /** Desviación sobre el plan a partir de la cual la obra está retrasada. */
  RETRASO_DIAS: 5,
  /** Desviación mínima para considerar la obra en riesgo. */
  RIESGO_DIAS: 1,
  /** Días que una fase puede pasar de su fin previsto sin completarse antes de marcar retraso. */
  FASE_VENCIDA_DIAS: 2,
  /** Una orden de cambio enviada que añade al menos estos días pone la obra en riesgo. */
  OC_PENDIENTE_DIAS: 3,
  /** Una orden aprobada con días extra en este periodo pone la obra en riesgo. */
  OC_RECIENTE_DIAS: 21,
} as const;

export const estaTerminada = (o: Obra) => o.fases.length > 0 && o.fases.every((f) => f.estado === "completada");
const faseVencida = (o: Obra, hoy: string) => o.fases.some((f) => f.estado !== "completada" && dd(f.finPrevisto, hoy) > UMBRALES.FASE_VENCIDA_DIAS);
const cambioConDias = (o: Obra, hoy: string) => o.ordenesCambio.some((c) =>
  c.diasExtra > 0 && ((c.estado === "enviada" && c.diasExtra >= UMBRALES.OC_PENDIENTE_DIAS) ||
    (c.estado === "aprobada" && !!c.respondidaEn && dd(c.respondidaEn.slice(0, 10), hoy) <= UMBRALES.OC_RECIENTE_DIAS)));
const altaAbierta = (o: Obra) => o.incidencias.some((i) => i.estado === "abierta" && i.gravedad === "alta");

/** Estado calculado solo a partir de los datos (ignora el estado manual). */
export function estadoAutomatico(o: Obra, hoy = hoyISO()): EstadoObra {
  if (estaTerminada(o)) return "terminada";
  const d = desviacion(o, hoy);
  if (d > UMBRALES.RETRASO_DIAS || faseVencida(o, hoy)) return "retrasada";
  if (d >= UMBRALES.RIESGO_DIAS || altaAbierta(o) || cambioConDias(o, hoy)) return "en_riesgo";
  return "en_plazo";
}
/** Única fuente del semáforo: estado manual si existe, si no el automático. */
export const calcularEstadoObra = (o: Obra, hoy = hoyISO()): EstadoObra => o.estadoManual ?? estadoAutomatico(o, hoy);

export type MotivoEstado = "material" | "incidencia" | "cambio" | "general" | null;
const RX_MATERIAL = /material|stock|suministr|proveedor|pedido|porcel[aá]nic|entrega del/i;
/** Motivo real de que la obra no vaya en plazo (para el cliente). */
export function motivoEstado(o: Obra, hoy = hoyISO()): MotivoEstado {
  const e = calcularEstadoObra(o, hoy);
  if (e === "en_plazo" || e === "terminada") return null;
  const reciente = (f: string) => dd(f.slice(0, 10), hoy) <= 30;
  const abiertas = o.incidencias.filter((i) => i.estado === "abierta");
  if (o.fases.some((f) => f.estado === "bloqueada") ||
    abiertas.some((i) => RX_MATERIAL.test(i.titulo + " " + i.descripcion)) ||
    o.notas.some((n) => reciente(n.fecha) && RX_MATERIAL.test(n.texto))) return "material";
  if (abiertas.some((i) => i.gravedad !== "baja")) return "incidencia";
  if (cambioConDias(o, hoy)) return "cambio";
  return "general";
}

/** Días de desviación sobre el plan (positivo = retraso). */
export function desviacion(o: Obra, hoy = hoyISO()) {
  if (estaTerminada(o)) { const l = o.fases.at(-1)!; return l.finReal ? dd(l.finPrevisto, l.finReal) : 0; }
  const cur = o.fases.find((f) => f.estado !== "completada");
  if (!cur) return 0;
  const ini = cur.inicioReal ? dd(cur.inicioPrevisto, cur.inicioReal) : 0;
  return Math.max(0, ini, dd(cur.finPrevisto, hoy));
}
export const finEstimado = (o: Obra) => addDias(o.fechaFinPrevista, desviacion(o));

const horas = (f: { entrada: string; salida?: string | undefined }, now = Date.now()) => ((f.salida ? new Date(f.salida).getTime() : now) - new Date(f.entrada).getTime()) / 3600000;

export function oficioDe(db: DB, id: string) {
  const u = db.usuarios.find((x) => x.id === id);
  return u?.rol === "jefe_obra" ? "Jefe de obra" : u?.oficio ?? "Peón";
}

export function costeReal(db: DB, o: Obra) {
  const h = db.fichajes.filter((f) => f.obraId === o.id && f.salida);
  const manoObra = h.reduce((s, f) => s + horas(f) * (db.costeHora[oficioDe(db, f.userId)] ?? 20), 0);
  const total = manoObra + o.costes.materiales + o.costes.gremios;
  const av = Math.max(avance(o), 1) / 100;
  const proyectado = estaTerminada(o) ? total : total / av;
  const v = vigente(o);
  const margen = v - proyectado;
  const pct = margen / v;
  return { manoObra, horas: h.reduce((s, f) => s + horas(f), 0), materiales: o.costes.materiales, gremios: o.costes.gremios, total, proyectado, vigente: v, margen, pct };
}
export const salud = (pct: number) => (pct >= 0.2 ? "ok" : pct >= 0.1 ? "warn" : "danger") as "ok" | "warn" | "danger";
export const SALUD_TXT = { ok: "text-ok", warn: "text-warn", danger: "text-danger" } as const;
export const SALUD_BG = { ok: "bg-ok", warn: "bg-warn", danger: "bg-danger" } as const;

export function lunes(iso = hoyISO()) { const d = diaSemana(iso); return addDias(iso, d === 0 ? -6 : 1 - d); }

export function horasDesde(db: DB, filtro: (f: DB["fichajes"][number]) => boolean, desde: string) {
  const now = Date.now();
  return db.fichajes.filter((f) => filtro(f) && f.entrada.slice(0, 10) >= desde).reduce((s, f) => s + horas(f, now), 0);
}

export function cobrosPorMes(db: DB, meses = 6) {
  const hoy = new Date();
  const out: { clave: string; label: string; total: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ clave, label: d.toLocaleDateString("es-ES", { month: "short" }), total: 0 });
  }
  db.obras.forEach((o) => o.pagos.forEach((h) => {
    if (h.estado !== "pagado" || !h.pagadoEn) return;
    const m = out.find((x) => x.clave === h.pagadoEn!.slice(0, 7));
    if (m) m.total += importeHito(o, h);
  }));
  return out;
}

export const kEuro = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", notation: n >= 100000 ? "compact" : "standard", maximumFractionDigits: n >= 100000 ? 1 : 0 }).format(n);

/** Fichajes abiertos hace más de 12 horas (probablemente olvidados). */
export const olvidados = (db: DB, now = Date.now()) => db.fichajes.filter((f) => !f.salida && now - new Date(f.entrada).getTime() > 12 * 3600000);
