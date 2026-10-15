import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ChevronRight, Banknote, Send, Check, Pencil, Trash2, Undo2 } from "lucide-react";
import { Confirmar } from "@/components/formularios";
import { conDeshacer } from "@/lib/deshacer";
import { ESTADO_OC, ESTADO_OC_CLS, euro2, importeHito, pagado, totales, vigente } from "@/lib/economia";
import { euro, fecha, mutate, user } from "@/lib/store";
import { hoyISO } from "@/lib/fechas";
import type { DB, HitoPago, Obra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OrdenesEquipo({ db, me, o }: { db: DB; me: Usuario; o: Obra }) {
  const lista = [...o.ordenesCambio].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const puede = me.rol === "jefe_obra" || me.rol === "gerente";
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Órdenes de cambio</h2>
        {puede && <Link to="/orden-nueva/$id" params={{ id: o.id }} search={{}} className="flex h-11 items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Nueva</Link>}
      </div>
      {lista.length === 0 ? <p className="text-sm text-muted-foreground">Sin órdenes de cambio.</p> : (
        <ul className="space-y-2">
          {lista.map((c) => (
            <li key={c.id}>
              <Link to="/orden/$obraId/$ocId" params={{ obraId: o.id, ocId: c.id }} className="flex items-center gap-3 rounded-2xl border-2 p-3">
                <div className="min-w-0 flex-1">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", ESTADO_OC_CLS[c.estado])}>{ESTADO_OC[c.estado]}</span>
                  <div className="mt-1 truncate font-semibold">{c.titulo}</div>
                  <div className="text-xs text-muted-foreground">{c.estancia} · {fecha(c.fecha)} · {user(db, c.creadaPor)?.nombre}</div>
                </div>
                <div className="text-right"><div className="font-display font-bold">{euro(totales(c).total)}</div><div className="text-xs text-muted-foreground">+{c.diasExtra} días</div></div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              {puede && c.estado === "enviada" && (
                <div className="mt-1 flex justify-end"><Confirmar texto="Anular" pregunta="¿Anular la orden? El cliente ya no podrá firmarla." onSi={() => conDeshacer("Orden anulada", (d) => { const x = d.obras.find((y) => y.id === o.id)?.ordenesCambio.find((y) => y.id === c.id); if (x) { x.estado = "anulada"; x.anuladaEn = new Date().toISOString(); x.anuladaPor = me.id; } })} /></div>
              )}
              {c.estado === "anulada" && c.anuladaEn && <p className="mt-1 px-3 text-xs text-muted-foreground">Anulada el {fecha(c.anuladaEn.slice(0, 10))} por {user(db, c.anuladaPor)?.nombre ?? "—"} · no afecta al presupuesto</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PagosEquipo({ me, o }: { me: Usuario; o: Obra }) {
  const puede = me.rol === "jefe_obra" || me.rol === "gerente";
  const [plan, setPlan] = useState<HitoPago[] | null>(null);
  const v = vigente(o), p = pagado(o);
  const upd = (id: string, fn: (h: HitoPago) => void) => mutate((d) => { const h = d.obras.find((x) => x.id === o.id)?.pagos.find((x) => x.id === id); if (h) fn(h); });
  const avanzar = (id: string, estado: "solicitado" | "pagado") => upd(id, (h) => { h.estado = estado; if (estado === "solicitado") h.solicitadoEn = hoyISO(); else h.pagadoEn = hoyISO(); });
  const deshacer = (id: string) => upd(id, (h) => { if (h.estado === "pagado") { h.estado = "solicitado"; delete h.pagadoEn; } else if (h.estado === "solicitado") { h.estado = "pendiente"; delete h.solicitadoEn; } });
  const suma = plan?.reduce((s, h) => s + (h.porcentaje || 0), 0) ?? 100;
  const errPlan = plan && (suma !== 100 ? `Los porcentajes deben sumar 100 % (ahora ${suma} %).` : plan.some((h) => !h.concepto.trim()) ? "Cada hito necesita un concepto." : "");
  const guardarPlan = () => { if (plan && !errPlan && mutate((d) => { const x = d.obras.find((y) => y.id === o.id); if (x) x.pagos = plan.map((h) => ({ ...h, concepto: h.concepto.trim() })); })) setPlan(null); };
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Plan de pagos</h2>
        {puede && !plan && <button onClick={() => setPlan(structuredClone(o.pagos))} className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-muted"><Pencil className="h-4 w-4" />Editar plan</button>}
      </div>
      <p className="mb-3 text-sm text-muted-foreground">Cobrado {euro(p)} de {euro(v)}</p>
      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-ok" style={{ width: `${(p / v) * 100}%` }} /></div>
      {plan ? (
        <div className="space-y-2">
          {plan.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2">
              <input aria-label="Concepto del hito" className="h-12 min-w-0 flex-1 rounded-xl border-2 bg-background px-3" value={h.concepto} onChange={(e) => setPlan(plan.map((x, j) => (j === i ? { ...x, concepto: e.target.value } : x)))} />
              <input aria-label="Porcentaje del hito" type="number" min={0} max={100} className="h-12 w-20 rounded-xl border-2 bg-background text-center" value={h.porcentaje || ""} onChange={(e) => setPlan(plan.map((x, j) => (j === i ? { ...x, porcentaje: Number(e.target.value) } : x)))} />
              <button aria-label="Quitar hito" disabled={plan.length < 2 || h.estado !== "pendiente"} onClick={() => setPlan(plan.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-danger disabled:opacity-30"><Trash2 className="h-5 w-5" /></button>
            </div>
          ))}
          <button onClick={() => setPlan([...plan, { id: `h${Date.now().toString(36)}`, concepto: "", porcentaje: 0, estado: "pendiente" }])} className="flex h-11 w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed font-semibold"><Plus className="h-4 w-4" />Añadir hito</button>
          <p className={cn("text-sm font-semibold", errPlan ? "text-danger" : "text-ok")}>{errPlan || "Total: 100 %"}</p>
          <div className="flex gap-2"><button onClick={() => setPlan(null)} className="h-12 flex-1 rounded-xl border-2 font-semibold">Cancelar</button><button disabled={!!errPlan} onClick={guardarPlan} className="h-12 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-40">Guardar plan</button></div>
        </div>
      ) : (
      <ul className="space-y-2">
        {o.pagos.map((h) => (
          <li key={h.id} className="rounded-2xl bg-muted p-3">
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-semibold">{h.porcentaje}% · {h.concepto}</div>
                <div className="text-xs text-muted-foreground">{h.estado === "pagado" ? `Pagado el ${fecha(h.pagadoEn)}` : h.estado === "solicitado" ? `Solicitado el ${fecha(h.solicitadoEn)}` : "Pendiente"}</div></div>
              <div className="font-display font-bold">{euro2(importeHito(o, h))}</div>
            </div>
            {puede && h.estado !== "pagado" && (
              <button onClick={() => avanzar(h.id, h.estado === "pendiente" ? "solicitado" : "pagado")}
                className={cn("mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold", h.estado === "pendiente" ? "bg-card" : "bg-ok text-primary-foreground")}>
                {h.estado === "pendiente" ? <><Send className="h-4 w-4" />Solicitar pago</> : <><Check className="h-4 w-4" />Marcar como pagado</>}
              </button>
            )}
            {h.estado === "pagado" && <div className="mt-1 flex items-center gap-1 text-xs font-bold text-ok"><Banknote className="h-4 w-4" />Cobrado</div>}
            {puede && h.estado !== "pendiente" && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {h.estado === "pagado" && <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Fecha de cobro<input type="date" aria-label="Fecha de cobro" value={h.pagadoEn ?? ""} onChange={(e) => e.target.value && upd(h.id, (x) => { x.pagadoEn = e.target.value; })} className="h-11 rounded-xl border-2 bg-card px-2 text-foreground" /></label>}
                <button onClick={() => deshacer(h.id)} className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-card"><Undo2 className="h-4 w-4" />{h.estado === "pagado" ? "Volver a solicitado" : "Volver a pendiente"}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}
