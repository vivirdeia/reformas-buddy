import { calcularEstadoObra } from "@/lib/analitica";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin, AlertTriangle, FileClock } from "lucide-react";
import { AppShell, Foto, Progreso, Semaforo } from "@/components/obria";
import { avance, faseActual, user, ESTADO_LABEL } from "@/lib/store";
import type { EstadoObra } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/obras/")({
  head: () => ({
    meta: [
      { title: "Obras · Obria" },
      { name: "description", content: "Listado de obras activas de Reformas Arnal con avance y estado." },
      { property: "og:title", content: "Obras · Obria" },
      { property: "og:description", content: "Avance, fase y estado de cada obra en Madrid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Obras,
});

const FILTROS: (EstadoObra | "todas")[] = ["todas", "en_plazo", "en_riesgo", "retrasada", "terminada"];

function Obras() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [f, setF] = useState<EstadoObra | "todas">("todas");
  return (
    <AppShell>
      {({ db, me }) => {
        if (me.rol === "cliente") { queueMicrotask(() => nav({ to: "/mi-reforma" })); return null; }
        const mias = db.obras;
        const t = q.toLowerCase();
        const lista = mias.filter((o) => (f === "todas" || calcularEstadoObra(o) === f) &&
          (!t || [o.nombre, o.direccion, o.barrio, user(db, o.clienteId)?.nombre].join(" ").toLowerCase().includes(t)));
        const activas = mias.filter((o) => calcularEstadoObra(o) !== "terminada").length;
        return (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Hola, {me.nombre.split(" ")[0]}</p>
              <h1 className="text-2xl font-bold">{`${activas} obras activas`}</h1>
            </div>
            {(
              <>
                <label className="relative mb-3 block">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar obra, cliente o calle"
                    className="h-13 w-full rounded-2xl border-2 bg-card py-3.5 pl-12 pr-4 text-base outline-none focus:border-primary" />
                </label>
                <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {FILTROS.map((x) => {
                    const n = x === "todas" ? mias.length : mias.filter((o) => calcularEstadoObra(o) === x).length;
                    return (
                      <button key={x} onClick={() => setF(x)} className={cn("shrink-0 rounded-full border-2 px-4 py-2.5 text-sm font-semibold",
                        f === x ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground")}>
                        {x === "todas" ? "Todas" : ESTADO_LABEL[x]} <span className="opacity-70">{n}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((o) => {
                const a = avance(o);
                const inc = o.incidencias.filter((i) => i.estado === "abierta").length;
                const oc = o.ordenesCambio.filter((i) => i.estado === "enviada").length;
                return (
                  <Link key={o.id} to="/obras/$id" params={{ id: o.id }} className="overflow-hidden rounded-3xl bg-card shadow-card transition active:scale-[0.99]">
                    <div className="relative h-40">
                      <Foto src={o.portada} alt={o.nombre} className="h-full w-full" />
                      <Semaforo estado={calcularEstadoObra(o)} className="absolute left-3 top-3 shadow-card" />
                      <div className="absolute right-3 top-3 flex gap-1.5">
                        {inc > 0 && <span className="flex items-center gap-1 rounded-full bg-danger px-2 py-1 text-xs font-bold text-destructive-foreground"><AlertTriangle className="h-3.5 w-3.5" />{inc}</span>}
                        {oc > 0 && <span className="flex items-center gap-1 rounded-full bg-warn px-2 py-1 text-xs font-bold text-ink"><FileClock className="h-3.5 w-3.5" />{oc}</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="text-lg font-semibold leading-tight">{o.nombre}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{user(db, o.clienteId)?.nombre}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{o.direccion} · {o.barrio}</p>
                      <div className="mt-4 flex items-end justify-between">
                        <div><div className="text-xs text-muted-foreground">Fase actual</div><div className="font-semibold">{faseActual(o)}</div></div>
                        <div className="font-display text-2xl font-bold text-primary">{a}%</div>
                      </div>
                      <div className="mt-2"><Progreso value={a} /></div>
                    </div>
                  </Link>
                );
              })}
              {lista.length === 0 && <p className="py-12 text-center text-muted-foreground">No hay obras que coincidan.</p>}
            </div>
          </>
        );
      }}
    </AppShell>
  );
}
