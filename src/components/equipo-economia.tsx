import { Link } from "@tanstack/react-router";
import { Plus, ChevronRight, Banknote, Send, Check } from "lucide-react";
import { ESTADO_OC, ESTADO_OC_CLS, euro2, importeHito, pagado, totales, vigente } from "@/lib/economia";
import { euro, fecha, mutate, user } from "@/lib/store";
import { hoyISO } from "@/lib/fechas";
import type { DB, Obra, Usuario } from "@/lib/types";
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PagosEquipo({ me, o }: { me: Usuario; o: Obra }) {
  const puede = me.rol === "jefe_obra" || me.rol === "gerente";
  const v = vigente(o), p = pagado(o);
  const cambiar = (id: string, estado: "solicitado" | "pagado") => mutate((d) => {
    const h = d.obras.find((x) => x.id === o.id)!.pagos.find((x) => x.id === id)!;
    h.estado = estado;
    if (estado === "solicitado") h.solicitadoEn = hoyISO(); else h.pagadoEn = hoyISO();
  });
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <h2 className="mb-1 text-lg font-semibold">Plan de pagos</h2>
      <p className="mb-3 text-sm text-muted-foreground">Cobrado {euro(p)} de {euro(v)}</p>
      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-ok" style={{ width: `${(p / v) * 100}%` }} /></div>
      <ul className="space-y-2">
        {o.pagos.map((h) => (
          <li key={h.id} className="rounded-2xl bg-muted p-3">
            <div className="flex items-start justify-between gap-2">
              <div><div className="font-semibold">{h.porcentaje}% · {h.concepto}</div>
                <div className="text-xs text-muted-foreground">{h.estado === "pagado" ? `Pagado el ${fecha(h.pagadoEn)}` : h.estado === "solicitado" ? `Solicitado el ${fecha(h.solicitadoEn)}` : "Pendiente"}</div></div>
              <div className="font-display font-bold">{euro2(importeHito(o, h))}</div>
            </div>
            {puede && h.estado !== "pagado" && (
              <button onClick={() => cambiar(h.id, h.estado === "pendiente" ? "solicitado" : "pagado")}
                className={cn("mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold", h.estado === "pendiente" ? "bg-card" : "bg-ok text-primary-foreground")}>
                {h.estado === "pendiente" ? <><Send className="h-4 w-4" />Solicitar pago</> : <><Check className="h-4 w-4" />Marcar como pagado</>}
              </button>
            )}
            {h.estado === "pagado" && <div className="mt-1 flex items-center gap-1 text-xs font-bold text-ok"><Banknote className="h-4 w-4" />Cobrado</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
