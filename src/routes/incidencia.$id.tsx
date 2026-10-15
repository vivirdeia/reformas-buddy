import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/obria";
import { FotoPicker } from "@/components/fotos";
import { hoyISO } from "@/lib/fechas";
import { mutate, uid } from "@/lib/store";
import type { Incidencia, Obra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/incidencia/$id")({
  head: () => ({
    meta: [
      { title: "Reportar incidencia · Obria" },
      { name: "description", content: "Comunica una incidencia de obra con fotos y gravedad." },
      { property: "og:title", content: "Reportar incidencia · Obria" },
      { property: "og:description", content: "Incidencias de obra de Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { id } = Route.useParams();
  return (
    <AppShell back={<Link to="/obras/$id" params={{ id }} className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Obra</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === id);
        if (!o || me.rol === "cliente") return <p className="py-16 text-center text-muted-foreground">Obra no disponible.</p>;
        return <Form o={o} me={me} />;
      }}
    </AppShell>
  );
}

const G: { v: Incidencia["gravedad"]; label: string; cls: string }[] = [
  { v: "baja", label: "Baja", cls: "border-ok bg-ok-soft text-ok" },
  { v: "media", label: "Media", cls: "border-warn bg-warn-soft text-warn" },
  { v: "alta", label: "Alta", cls: "border-danger bg-danger-soft text-danger" },
];
const label = "mb-2 block text-sm font-bold uppercase tracking-wider text-muted-foreground";

function Form({ o, me }: { o: Obra; me: Usuario }) {
  const nav = useNavigate();
  const [titulo, setTitulo] = useState("");
  const [desc, setDesc] = useState("");
  const [grav, setGrav] = useState<Incidencia["gravedad"]>("media");
  const [fotos, setFotos] = useState<string[]>([]);
  const ok = titulo.trim().length > 2;
  const enviar = () => {
    if (!ok) return;
    if (mutate((d) => d.obras.find((x) => x.id === o.id)!.incidencias.push({ id: uid("i"), fecha: hoyISO(), titulo: titulo.trim(), descripcion: desc.trim(), gravedad: grav, estado: "abierta", autorId: me.id, fotos })))
      nav({ to: "/obras/$id", params: { id: o.id } });
  };
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold">Reportar incidencia</h1><p className="text-muted-foreground">{o.nombre}</p></div>
      <div><label htmlFor="t" className={label}>Título</label>
        <input id="t" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej.: Fuga en llave de paso de cocina" className="h-14 w-full rounded-2xl border-2 bg-card px-4 text-base outline-none focus:border-primary" /></div>
      <div><label htmlFor="d" className={label}>Descripción</label>
        <textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Qué ha pasado, dónde y qué se necesita" className="w-full rounded-2xl border-2 bg-card p-4 text-base outline-none focus:border-primary" /></div>
      <div><span className={label}>Gravedad</span>
        <div className="grid grid-cols-3 gap-2">
          {G.map((g) => <button key={g.v} onClick={() => setGrav(g.v)} className={cn("h-14 rounded-2xl border-2 font-bold", grav === g.v ? g.cls : "bg-card")}>{g.label}</button>)}
        </div></div>
      <div><span className={label}>Fotos</span><FotoPicker fotos={fotos} onChange={setFotos} /></div>
      <button disabled={!ok} onClick={enviar} className="h-16 w-full rounded-2xl bg-danger text-lg font-bold text-destructive-foreground disabled:opacity-40">Enviar incidencia</button>
    </div>
  );
}
