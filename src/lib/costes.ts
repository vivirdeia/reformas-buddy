import type { Apunte, DB, Obra, TipoApunte } from "./types";
import { addDias, hoyISO } from "./fechas";

export const TIPO_APUNTE: Record<TipoApunte, string> = { materiales: "Materiales", gremio: "Gremio", otros: "Otros" };

export function oficioDe(db: DB, id: string) {
  const u = db.usuarios.find((x) => x.id === id);
  return u?.rol === "jefe_obra" ? "Jefe de obra" : u?.oficio ?? "Peón";
}
/** Coste/hora de un usuario: el suyo propio si lo tiene, si no el de su oficio. */
export function tarifaDe(db: DB, id: string) {
  const u = db.usuarios.find((x) => x.id === id);
  return u?.costeHora ?? db.costeHora[oficioDe(db, id)] ?? 20;
}

export function sumaApuntes(o: Obra) {
  const r = { materiales: 0, gremios: 0, otros: 0 };
  (o.apuntes ?? []).forEach((a) => { if (a.tipo === "materiales") r.materiales += a.importe; else if (a.tipo === "gremio") r.gremios += a.importe; else r.otros += a.importe; });
  return r;
}

/** Convierte importes acumulados (modelo antiguo / demo) en apuntes con fecha repartidos en la obra. */
export function apuntesDesdeCostes(o: Obra, materiales: number, gremios: number): Apunte[] {
  const hoy = hoyISO();
  const ini = o.fechaInicio && o.fechaInicio < hoy ? o.fechaInicio : hoy;
  const span = Math.max(0, Math.round((new Date(hoy).getTime() - new Date(ini).getTime()) / 864e5));
  const f = (p: number) => addDias(ini, Math.round(span * p));
  const out: Apunte[] = [];
  if (materiales > 0) {
    const a = Math.round(materiales * 0.55);
    out.push({ id: `ap-${o.id}-m1`, fecha: f(0.1), tipo: "materiales", concepto: "Material de obra y demolición", proveedor: "Saltoki Madrid", importe: a });
    out.push({ id: `ap-${o.id}-m2`, fecha: f(0.7), tipo: "materiales", concepto: "Cerámica, sanitarios y acabados", proveedor: "Porcelanosa Castellana", importe: materiales - a });
  }
  if (gremios > 0) {
    const ids = o.equipo.gremioIds.length ? o.equipo.gremioIds : [undefined];
    let resto = gremios;
    ids.forEach((g, i) => {
      const imp = i === ids.length - 1 ? resto : Math.round(gremios / ids.length);
      resto -= imp;
      out.push({ id: `ap-${o.id}-g${i + 1}`, fecha: f(0.3 + (0.6 * i) / ids.length), tipo: "gremio", concepto: "Trabajos subcontratados", gremioId: g, importe: imp });
    });
  }
  return out;
}
