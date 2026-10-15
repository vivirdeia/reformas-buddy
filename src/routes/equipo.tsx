import { obrasVivas } from "@/lib/store";
import { calcularEstadoObra } from "@/lib/analitica";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Clock, Radio } from "lucide-react";
import { AppShell, Kpi, Seccion, SoloGerente } from "@/components/obria";
import { dur, hora, msFichaje, ROL_LABEL, useNow } from "@/lib/store";
import { horasDesde, lunes } from "@/lib/analitica";
import { addDias, hoyISO } from "@/lib/fechas";
import type { DB } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: "Equipo · Obria" },
      { name: "description", content: "Carga de trabajo, fichajes en curso y horas por obra del equipo de Reformas Arnal." },
      { property: "og:title", content: "Equipo · Obria" },
      { property: "og:description", content: "Quién está en obra y cuántas horas lleva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell>{({ db, me }) => <SoloGerente me={me}><Equipo db={db} /></SoloGerente>}</AppShell>,
});

const h1 = (n: number) => `${n.toLocaleString("es-ES", { maximumFractionDigits: 1 })} h`;

function Equipo({ db }: { db: DB }) {
  const now = useNow(30000);
  const hoy = hoyISO();
  const semana = lunes(hoy);
  const hace4 = addDias(semana, -21);
  const gente = db.usuarios.filter((u) => u.activo !== false && u.rol === "operario" || u.rol === "jefe_obra").map((u) => {
    const obras = obrasVivas(db).filter((o) => calcularEstadoObra(o) !== "terminada" && (o.equipo.jefeId === u.id || o.equipo.operarioIds.includes(u.id)));
    return { u, obras, sem: horasDesde(db, (f) => f.userId === u.id, semana), mes: horasDesde(db, (f) => f.userId === u.id, hace4) };
  });
  const maxMes = Math.max(...gente.map((g) => g.mes), 1);
  const abiertos = db.fichajes.filter((f) => !f.salida);
  const porObra = obrasVivas(db).map((o) => ({ o, h: horasDesde(db, (f) => f.obraId === o.id, hace4) })).filter((x) => x.h > 0).sort((a, b) => b.h - a.h);
  const maxObra = Math.max(...porObra.map((x) => x.h), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Equipo</h1>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={Radio} tone="ok" label="En obra ahora" value={abiertos.length} sub={`de ${gente.length} personas`} />
        <Kpi icon={Clock} label="Horas esta semana" value={h1(gente.reduce((s, g) => s + g.sem, 0))} sub="todo el equipo" />
        <Kpi icon={Clock} label="Últimas 4 semanas" value={h1(gente.reduce((s, g) => s + g.mes, 0))} sub={`media ${h1(gente.reduce((s, g) => s + g.mes, 0) / gente.length / 4)} por persona/semana`} />
        <Kpi icon={Users} label="Gremios" value={db.gremios.length} sub="subcontratados" />
      </div>

      <Seccion titulo="Fichados ahora mismo" extra={<span className="flex items-center gap-1 text-xs font-bold text-ok"><span className="h-2 w-2 animate-pulse rounded-full bg-ok" />En directo</span>}>
        {abiertos.length === 0 ? <p className="text-sm text-muted-foreground">Nadie fichado en este momento.</p> : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {abiertos.map((f) => {
              const u = db.usuarios.find((x) => x.id === f.userId);
              const o = db.obras.find((x) => x.id === f.obraId);
              return (
                <div key={f.id} className="flex items-center gap-3 rounded-2xl border-2 border-ok/30 bg-ok-soft p-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ok font-display font-bold text-primary-foreground">{u?.nombre[0]}</div>
                  <div className="min-w-0"><div className="truncate font-semibold">{u?.nombre}</div><div className="truncate text-xs text-muted-foreground">{o?.nombre}</div><div className="text-xs font-semibold text-ok">Desde {hora(f.entrada)} · {dur(msFichaje(f, now))}</div></div>
                </div>
              );
            })}
          </div>
        )}
      </Seccion>

      <div className="grid gap-6 xl:grid-cols-5">
        <Seccion titulo="Carga de trabajo" className="xl:col-span-3">
          <div className="-mx-4 overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[600px] text-sm">
              <thead><tr className="border-b text-left text-xs font-bold uppercase tracking-wider text-muted-foreground"><th className="px-3 py-2">Persona</th><th className="px-3 py-2">Obras asignadas</th><th className="px-3 py-2 text-right">Semana</th><th className="px-3 py-2">Últimas 4 semanas</th></tr></thead>
              <tbody>
                {gente.map((g) => {
                  const dentro = abiertos.some((f) => f.userId === g.u.id);
                  return (
                    <tr key={g.u.id} className="border-b last:border-0">
                      <td className="px-3 py-3"><div className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", dentro ? "bg-ok" : "bg-input")} /><div><div className="font-semibold">{g.u.nombre}</div><div className="text-xs text-muted-foreground">{g.u.oficio ?? ROL_LABEL[g.u.rol]}</div></div></div></td>
                      <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{g.obras.map((o) => <Link key={o.id} to="/obras/$id" params={{ id: o.id }} className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold hover:bg-accent">{o.barrio}</Link>)}</div></td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{h1(g.sem)}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(g.mes / maxMes) * 100}%` }} /></div><span className="w-14 text-right text-xs font-semibold tabular-nums">{h1(g.mes)}</span></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Seccion>

        <Seccion titulo="Horas por obra · 4 semanas" className="xl:col-span-2">
          <ul className="space-y-3">
            {porObra.map((x) => (
              <li key={x.o.id}>
                <div className="mb-1 flex justify-between text-sm"><span className="truncate font-semibold">{x.o.nombre}</span><span className="font-bold tabular-nums">{h1(x.h)}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(x.h / maxObra) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Seccion>
      </div>
    </div>
  );
}
