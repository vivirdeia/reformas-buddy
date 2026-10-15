import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HardHat, AlertTriangle, Siren, PenLine, TrendingUp, Hourglass, ArrowUpDown, ChevronRight, Clock, Wallet } from "lucide-react";
import { AppShell, Kpi, Progreso, Seccion, Semaforo, SoloGerente } from "@/components/obria";
import { avance, faseActual, fecha, user, ESTADO_LABEL, euro } from "@/lib/store";
import { importeHito, vigente } from "@/lib/economia";
import { dd, desviacion, finEstimado, kEuro } from "@/lib/analitica";
import { addDias, hoyISO } from "@/lib/fechas";
import type { DB, EstadoObra } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel de gerencia · Obria" },
      { name: "description", content: "Resumen de todas las obras de Reformas Arnal: KPIs, alertas y planificación." },
      { property: "og:title", content: "Panel de gerencia · Obria" },
      { property: "og:description", content: "KPIs, alertas y Gantt de obras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell>{({ db, me }) => <SoloGerente me={me}><Panel db={db} /></SoloGerente>}</AppShell>,
});

type Col = "nombre" | "estado" | "avance" | "desv" | "jefe" | "vigente";

function Panel({ db }: { db: DB }) {
  const hoy = hoyISO();
  const mes = hoy.slice(0, 7);
  const activas = db.obras.filter((o) => o.estado !== "terminada");
  const incAbiertas = db.obras.flatMap((o) => o.incidencias.filter((i) => i.estado === "abierta").map((i) => ({ o, i })));
  const ocPend = db.obras.flatMap((o) => o.ordenesCambio.filter((c) => c.estado === "enviada").map((c) => ({ o, c })));
  const pagos = db.obras.flatMap((o) => o.pagos.map((h) => ({ o, h, imp: importeHito(o, h) })));
  const cobradoMes = pagos.filter((p) => p.h.estado === "pagado" && p.h.pagadoEn?.startsWith(mes)).reduce((s, p) => s + p.imp, 0);
  const solicitados = pagos.filter((p) => p.h.estado === "solicitado");
  const pendCobro = solicitados.reduce((s, p) => s + p.imp, 0);
  const riesgo = activas.filter((o) => o.estado === "en_riesgo" || o.estado === "retrasada").length;

  const atencion = [
    ...incAbiertas.filter((x) => x.i.gravedad === "alta").map((x) => ({ k: x.i.id, icon: Siren, tone: "danger", t: `Incidencia grave: ${x.i.titulo}`, s: `${x.o.nombre} · desde el ${fecha(x.i.fecha)}`, id: x.o.id })),
    ...activas.filter((o) => o.estado === "retrasada").map((o) => ({ k: "r" + o.id, icon: Hourglass, tone: "danger", t: `Obra retrasada ${desviacion(o)} días`, s: `${o.nombre} · ${user(db, o.equipo.jefeId)?.nombre}`, id: o.id })),
    ...solicitados.map((p) => ({ k: p.h.id, icon: Wallet, tone: "warn", t: `Pago solicitado sin cobrar: ${euro(p.imp)}`, s: `${p.o.nombre} · ${p.h.concepto}`, id: p.o.id })),
    ...ocPend.filter((x) => x.c.enviadaEn && dd(x.c.enviadaEn.slice(0, 10), hoy) > 3).map((x) => ({ k: x.c.id, icon: Clock, tone: "warn", t: `Cambio sin respuesta hace ${dd(x.c.enviadaEn!.slice(0, 10), hoy)} días`, s: `${x.o.nombre} · ${x.c.titulo}`, id: x.o.id })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground first-letter:uppercase">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="text-3xl font-bold">Panel</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={HardHat} label="Obras activas" value={activas.length} sub={`${db.obras.length - activas.length} terminada`} />
        <Kpi icon={AlertTriangle} tone={riesgo ? "warn" : "ok"} label="En riesgo o retraso" value={riesgo} sub="de las activas" />
        <Kpi icon={Siren} tone={incAbiertas.length ? "danger" : "ok"} label="Incidencias abiertas" value={incAbiertas.length} sub={`${incAbiertas.filter((x) => x.i.gravedad === "alta").length} de gravedad alta`} />
        <Kpi icon={PenLine} tone="warn" label="Cambios por firmar" value={ocPend.length} sub={euro(ocPend.reduce((s, x) => s + x.c.partidas.reduce((a, p) => a + p.cantidad * p.precio, 0) * 1.21, 0))} />
        <Kpi icon={TrendingUp} tone="ok" label="Cobrado este mes" value={kEuro(cobradoMes)} sub="pagos recibidos" />
        <Kpi icon={Wallet} tone="primary" label="Pendiente de cobro" value={kEuro(pendCobro)} sub={`${solicitados.length} pagos solicitados`} />
      </div>

      <div className="min-w-0 space-y-6">
        <Seccion titulo="Requiere tu atención" extra={<span className="rounded-full bg-danger-soft px-3 py-1 text-xs font-bold text-danger">{atencion.length}</span>}>
          {atencion.length === 0 ? <p className="text-sm text-muted-foreground">Todo en orden.</p> : (
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 [&>li]:min-w-0">
              {atencion.map((a) => (
                <li key={a.k}>
                  <Link to="/obras/$id" params={{ id: a.id }} className="flex items-center gap-3 rounded-2xl border-2 p-3 transition hover:border-primary">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", a.tone === "danger" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn")}><a.icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{a.t}</span><span className="block truncate text-xs text-muted-foreground">{a.s}</span></span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
        <TablaObras db={db} />
      </div>

      <Gantt db={db} />
    </div>
  );
}

function TablaObras({ db }: { db: DB }) {
  const [col, setCol] = useState<Col>("desv");
  const [asc, setAsc] = useState(false);
  const [est, setEst] = useState<EstadoObra | "todas">("todas");
  const [jefe, setJefe] = useState("todos");
  const filas = useMemo(() => db.obras
    .filter((o) => (est === "todas" || o.estado === est) && (jefe === "todos" || o.equipo.jefeId === jefe))
    .map((o) => ({ o, nombre: o.nombre, estado: o.estado, avance: avance(o), desv: desviacion(o), jefe: user(db, o.equipo.jefeId)?.nombre ?? "", vigente: vigente(o) }))
    .sort((a, b) => { const x = a[col], y = b[col]; const r = typeof x === "number" ? x - (y as number) : String(x).localeCompare(String(y)); return asc ? r : -r; }), [db, col, asc, est, jefe]);
  const th = (c: Col, l: string, right = false) => (
    <th className={cn("px-3 py-2", right && "text-right")}>
      <button onClick={() => (c === col ? setAsc(!asc) : (setCol(c), setAsc(c === "nombre" || c === "jefe")))} className={cn("inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider", c === col ? "text-primary" : "text-muted-foreground")}>{l}<ArrowUpDown className="h-3 w-3" /></button>
    </th>
  );
  const jefes = db.usuarios.filter((u) => u.rol === "jefe_obra");
  return (
    <Seccion titulo="Todas las obras" extra={
      <div className="flex flex-wrap gap-2">
        <select value={est} onChange={(e) => setEst(e.target.value as EstadoObra | "todas")} className="h-10 rounded-xl border-2 bg-background px-2 text-sm"><option value="todas">Todos los estados</option>{Object.entries(ESTADO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={jefe} onChange={(e) => setJefe(e.target.value)} className="h-10 rounded-xl border-2 bg-background px-2 text-sm"><option value="todos">Todos los jefes</option>{jefes.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}</select>
      </div>}>
      <div className="-mx-4 overflow-x-auto md:-mx-6">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b text-left">{th("nombre", "Obra")}{th("estado", "Estado")}<th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Fase</th>{th("avance", "Avance")}{th("desv", "Desv.", true)}{th("jefe", "Jefe de obra")}{th("vigente", "Vigente", true)}</tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.o.id} className="border-b last:border-0 hover:bg-muted/60">
                <td className="px-3 py-3"><Link to="/obras/$id" params={{ id: f.o.id }} className="font-semibold hover:text-primary">{f.nombre}</Link><div className="text-xs text-muted-foreground">{f.o.barrio}</div></td>
                <td className="px-3 py-3"><Semaforo estado={f.estado} /></td>
                <td className="px-3 py-3">{faseActual(f.o)}</td>
                <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="w-20"><Progreso value={f.avance} /></div><span className="font-semibold tabular-nums">{f.avance}%</span></div></td>
                <td className={cn("px-3 py-3 text-right font-bold tabular-nums", f.desv > 0 ? "text-danger" : "text-ok")}>{f.desv > 0 ? `+${f.desv}` : "0"} d</td>
                <td className="px-3 py-3">{f.jefe}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{euro(f.vigente)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Seccion>
  );
}

function Gantt({ db }: { db: DB }) {
  const hoy = hoyISO();
  const obras = db.obras.filter((o) => o.estado !== "terminada").sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  const ini = (() => { const m = obras.map((o) => o.fechaInicio).sort()[0]!; const d = new Date(m + "T12:00:00").getDay(); return addDias(m, d === 0 ? -6 : 1 - d); })();
  const finMax = obras.map((o) => { const e = finEstimado(o); return e > o.fechaFinPrevista ? e : o.fechaFinPrevista; }).sort().at(-1)!;
  const semanas = Math.ceil((dd(ini, finMax) + 7) / 7);
  const total = semanas * 7;
  const x = (d: string) => `${(dd(ini, d) / total) * 100}%`;
  const w = (a: string, b: string) => `${(Math.max(1, dd(a, b) + 1) / total) * 100}%`;
  return (
    <Seccion titulo="Planificación: plan frente a real" extra={
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-6 rounded bg-secondary ring-1 ring-border" />Plan</span>
        <span className="flex items-center gap-1"><span className="h-3 w-6 rounded bg-primary" />Real</span>
        <span className="flex items-center gap-1"><span className="h-3 w-6 rounded border-2 border-dashed border-primary" />Previsión</span>
        <span className="flex items-center gap-1"><span className="h-3 w-0.5 bg-danger" />Hoy</span>
      </div>}>
      <div className="-mx-4 overflow-x-auto md:-mx-6">
        <div className="min-w-[900px] px-4 md:px-6">
          <div className="flex">
            <div className="w-56 shrink-0" />
            <div className="relative flex flex-1">
              {Array.from({ length: semanas }, (_, i) => { const d = addDias(ini, i * 7); return <div key={i} className="flex-1 border-l px-1 pb-2 text-[10px] font-semibold text-muted-foreground">{new Date(d + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</div>; })}
            </div>
          </div>
          {obras.map((o) => {
            const real0 = o.fases[0]!.inicioReal ?? o.fechaInicio;
            const est = finEstimado(o);
            const des = desviacion(o);
            return (
              <div key={o.id} className="flex items-center border-t py-2">
                <Link to="/obras/$id" params={{ id: o.id }} className="w-56 shrink-0 pr-3"><div className="truncate text-sm font-semibold hover:text-primary">{o.nombre}</div><div className="text-xs text-muted-foreground">{faseActual(o)} · {des > 0 ? <span className="font-bold text-danger">+{des} d</span> : "en plazo"}</div></Link>
                <div className="relative h-12 flex-1">
                  {Array.from({ length: semanas }, (_, i) => <div key={i} className="absolute inset-y-0 border-l border-border/60" style={{ left: `${(i / semanas) * 100}%` }} />)}
                  <div className="absolute top-1.5 h-4 rounded-md bg-secondary ring-1 ring-border" style={{ left: x(o.fechaInicio), width: w(o.fechaInicio, o.fechaFinPrevista) }} />
                  <div className="absolute top-6 h-4 rounded-md bg-primary" style={{ left: x(real0), width: w(real0, hoy) }} />
                  <div className="absolute top-6 h-4 rounded-md border-2 border-dashed border-primary/70" style={{ left: x(hoy), width: w(hoy, est) }} />
                  <div className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: x(hoy) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Seccion>
  );
}
