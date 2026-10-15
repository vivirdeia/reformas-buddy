import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, ImageIcon, Inbox } from "lucide-react";
import { AppShell, SoloGerente } from "@/components/obria";
import { SOL_LABEL } from "@/lib/store";
import type { EstadoSolicitud } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/solicitudes/")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Solicitudes de presupuesto · Reformas Arnal" }, { name: "robots", content: "noindex, nofollow" }, { name: "description", content: "Solicitudes de presupuesto recibidas desde la web de Reformas Arnal." }, { property: "og:title", content: "Solicitudes · Reformas Arnal" }, { property: "og:description", content: "Gestión de solicitudes de presupuesto." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Solicitudes,
});

export const SOL_TONO: Record<EstadoSolicitud, string> = {
  nueva: "bg-primary text-primary-foreground", contactada: "bg-accent text-accent-foreground", visita: "bg-warn-soft text-warn",
  presupuestada: "bg-secondary text-secondary-foreground", ganada: "bg-ok-soft text-ok", perdida: "bg-muted text-muted-foreground",
};
export const haceCuanto = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600e3);
  return h < 1 ? "Hace un momento" : h < 24 ? `Hace ${h} h` : `Hace ${Math.round(h / 24)} días`;
};

function Solicitudes() {
  const [filtro, setFiltro] = useState<EstadoSolicitud | "todas">("todas");
  return (
    <AppShell>
      {({ db, me }) => (
        <SoloGerente me={me}>
          <h1 className="text-2xl font-bold md:text-3xl">Solicitudes</h1>
          <p className="text-muted-foreground">Peticiones de presupuesto llegadas desde la web.</p>
          <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2">
            {(["todas", ...Object.keys(SOL_LABEL)] as const).map((k) => {
              const n = k === "todas" ? db.solicitudes.length : db.solicitudes.filter((s) => s.estado === k).length;
              return <button key={k} onClick={() => setFiltro(k as typeof filtro)} className={cn("h-10 shrink-0 rounded-full border-2 px-4 text-sm font-semibold", filtro === k ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{k === "todas" ? "Todas" : SOL_LABEL[k as EstadoSolicitud]} · {n}</button>;
            })}
          </div>
          <div className="mt-3 space-y-3">
            {db.solicitudes.filter((s) => filtro === "todas" || s.estado === filtro).sort((a, b) => b.fecha.localeCompare(a.fecha)).map((s) => (
              <Link key={s.id} to="/solicitudes/$id" params={{ id: s.id }} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition hover:-translate-y-0.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", SOL_TONO[s.estado])}>{SOL_LABEL[s.estado]}</span>
                    <span className="text-xs text-muted-foreground">{haceCuanto(s.fecha)}</span>
                  </div>
                  <div className="mt-1.5 truncate font-display text-lg font-semibold">{s.nombre}</div>
                  <div className="truncate text-sm text-muted-foreground">{s.tipo} · {s.m2} m² · {s.zona} · {s.rango}</div>
                </div>
                {s.fotos.length > 0 && <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><ImageIcon className="h-4 w-4" />{s.fotos.length}</span>}
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
            {!db.solicitudes.length && <div className="grid place-items-center rounded-2xl border-2 border-dashed p-10 text-muted-foreground"><Inbox className="h-8 w-8" />Sin solicitudes</div>}
          </div>
        </SoloGerente>
      )}
    </AppShell>
  );
}
