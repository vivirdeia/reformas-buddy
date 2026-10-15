import { obrasVivas } from "@/lib/store";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, TrendingUp, PiggyBank, Percent } from "lucide-react";
import { AppShell, Kpi, Seccion, SoloGerente } from "@/components/obria";
import { avance, euro } from "@/lib/store";
import { pagado } from "@/lib/economia";
import { cobrosPorMes, costeReal, kEuro, salud, SALUD_BG, SALUD_TXT } from "@/lib/analitica";
import type { DB } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/economia")({
  head: () => ({
    meta: [
      { title: "Economía · Obria" },
      { name: "description", content: "Presupuesto, coste real estimado y margen por obra de Reformas Arnal." },
      { property: "og:title", content: "Economía · Obria" },
      { property: "og:description", content: "Márgenes y cobros por obra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell>{({ db, me }) => <SoloGerente me={me}><Economia db={db} /></SoloGerente>}</AppShell>,
});

const pct = (n: number) => `${(n * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %`;

function Economia({ db }: { db: DB }) {
  const filas = obrasVivas(db).map((o) => ({ o, ...costeReal(db, o), av: avance(o) }));
  const totV = filas.reduce((s, f) => s + f.vigente, 0);
  const totM = filas.reduce((s, f) => s + f.margen, 0);
  const cobrado = obrasVivas(db).reduce((s, o) => s + pagado(o), 0);
  const meses = cobrosPorMes(db);
  const maxMes = Math.max(...meses.map((m) => m.total), 1);
  const maxPct = Math.max(...filas.map((f) => Math.abs(f.pct)), 0.3);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Economía</h1>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Cartera vigente" value={kEuro(totV)} sub={`${obrasVivas(db).length} obras`} />
        <Kpi icon={PiggyBank} tone="ok" label="Margen estimado" value={kEuro(totM)} sub="al cierre de las obras" />
        <Kpi icon={Percent} tone={salud(totM / totV)} label="Margen medio" value={pct(totM / totV)} sub="sobre presupuesto vigente" />
        <Kpi icon={TrendingUp} label="Cobrado total" value={kEuro(cobrado)} sub={`${pct(cobrado / totV)} de la cartera`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Margen por obra" extra={<Leyenda />}>
          <ul className="space-y-3">
            {[...filas].sort((a, b) => b.pct - a.pct).map((f) => {
              const s = salud(f.pct);
              return (
                <li key={f.o.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[12rem_1fr_auto]">
                  <span className="truncate text-sm font-semibold">{f.o.nombre}</span>
                  <span className={cn("text-right text-sm font-bold tabular-nums sm:order-3", SALUD_TXT[s])}>{pct(f.pct)}</span>
                  <div className="col-span-2 h-6 overflow-hidden rounded-lg bg-muted sm:order-2 sm:col-span-1">
                    <div className={cn("h-full rounded-lg transition-all duration-700", SALUD_BG[s])} style={{ width: `${(Math.max(0, f.pct) / maxPct) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Seccion>

        <Seccion titulo="Cobros por mes">
          <div className="flex h-64 items-end gap-1.5 sm:gap-3">
            {meses.map((m) => (
              <div key={m.clave} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-bold tabular-nums sm:text-xs">{m.total ? kEuro(m.total) : "—"}</span>
                <div className="w-full rounded-t-xl bg-primary transition-all duration-700" style={{ height: `${(m.total / maxMes) * 80}%`, minHeight: m.total ? 6 : 2 }} />
                <span className="text-xs font-semibold capitalize text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </Seccion>
      </div>

      <Seccion titulo="Detalle por obra">
        <div className="-mx-4 overflow-x-auto md:-mx-6">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Obra</th><th className="px-3 py-2 text-right">Vigente</th><th className="px-3 py-2 text-right">Avance</th>
                <th className="px-3 py-2 text-right">Mano de obra</th><th className="px-3 py-2 text-right">Materiales</th><th className="px-3 py-2 text-right">Gremios</th>
                <th className="px-3 py-2 text-right">Coste a fecha</th><th className="px-3 py-2 text-right">Coste est. cierre</th><th className="px-3 py-2 text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {filas.map((f) => {
                const s = salud(f.pct);
                return (
                  <tr key={f.o.id} className="border-b last:border-0 hover:bg-muted/60">
                    <td className="px-3 py-3"><Link to="/obras/$id" params={{ id: f.o.id }} className="font-semibold hover:text-primary">{f.o.nombre}</Link><div className="text-xs text-muted-foreground">{Math.round(f.horas)} h fichadas</div></td>
                    <td className="px-3 py-3 text-right font-semibold">{euro(f.vigente)}</td>
                    <td className="px-3 py-3 text-right">{f.av}%</td>
                    <td className="px-3 py-3 text-right">{euro(f.manoObra)}</td>
                    <td className="px-3 py-3 text-right">{euro(f.materiales)}</td>
                    <td className="px-3 py-3 text-right">{euro(f.gremios)}</td>
                    <td className="px-3 py-3 text-right">{euro(f.total)}</td>
                    <td className="px-3 py-3 text-right">{euro(f.proyectado)}</td>
                    <td className="px-3 py-3 text-right"><span className={cn("font-bold", SALUD_TXT[s])}>{euro(f.margen)}</span><div className={cn("text-xs font-bold", SALUD_TXT[s])}>{pct(f.pct)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Coste estimado al cierre = coste a fecha proyectado según el avance. Mano de obra = horas fichadas × coste/hora por oficio ({Object.entries(db.costeHora).map(([k, v]) => `${k} ${v} €`).join(" · ")}).</p>
      </Seccion>
    </div>
  );
}

function Leyenda() {
  return (
    <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ok" />&gt; 20 %</span>
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warn" />10–20 %</span>
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-danger" />&lt; 10 %</span>
    </div>
  );
}
