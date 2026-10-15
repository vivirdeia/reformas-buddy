import type { HitoPago, Obra, OrdenCambio } from "./types";

export const IVA = 0.21;
export const IBAN = "ES76 2100 1234 5602 0031 8890";
export const TITULAR = "Reformas Arnal S.L. · CIF B-86543210";
const r2 = (n: number) => Math.round(n * 100) / 100;

export function totales(oc: Pick<OrdenCambio, "partidas">) {
  const base = r2(oc.partidas.reduce((s, p) => s + (p.cantidad || 0) * (p.precio || 0), 0));
  const iva = r2(base * IVA);
  return { base, iva, total: r2(base + iva) };
}
export const cambiosAprobados = (o: Obra) => r2(o.ordenesCambio.filter((c) => c.estado === "aprobada").reduce((s, c) => s + totales(c).total, 0));
export const vigente = (o: Obra) => r2(o.presupuesto + cambiosAprobados(o));
export const importeHito = (o: Obra, h: HitoPago) => r2((vigente(o) * h.porcentaje) / 100);
export const pagado = (o: Obra) => r2(o.pagos.filter((h) => h.estado === "pagado").reduce((s, h) => s + importeHito(o, h), 0));
export const concepto = (o: Obra, h: HitoPago) => `ARNAL ${o.id.toUpperCase()} ${h.porcentaje}% ${h.concepto.toUpperCase()}`;

export const euro2 = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
export const ESTADO_OC = { borrador: "Borrador", enviada: "Pendiente de firma", aprobada: "Aprobada y firmada", rechazada: "Rechazada" } as const;
export const ESTADO_OC_CLS = { borrador: "bg-secondary text-secondary-foreground", enviada: "bg-warn-soft text-warn", aprobada: "bg-ok-soft text-ok", rechazada: "bg-danger-soft text-danger" } as const;
