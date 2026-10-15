import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/obria";
import { FotoPicker } from "@/components/fotos";
import { euro2, totales } from "@/lib/economia";
import { hoyISO } from "@/lib/fechas";
import { mutate, uid } from "@/lib/store";
import type { Obra, OrdenCambio, Partida, Usuario } from "@/lib/types";

export const Route = createFileRoute("/orden-nueva/$id")({
  validateSearch: (s: Record<string, unknown>): { oc?: string } => (typeof s['oc'] === "string" ? { oc: s['oc'] } : {}),
  head: () => ({
    meta: [
      { title: "Orden de cambio · Obria" },
      { name: "description", content: "Crea una orden de cambio con partidas, IVA y plazo." },
      { property: "og:title", content: "Orden de cambio · Obria" },
      { property: "og:description", content: "Órdenes de cambio de Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { id } = Route.useParams();
  const { oc } = Route.useSearch();
  return (
    <AppShell back={<Link to="/obras/$id" params={{ id }} className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Obra</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === id);
        if (!o || (me.rol !== "jefe_obra" && me.rol !== "gerente")) return <p className="py-16 text-center text-muted-foreground">No disponible.</p>;
        const prev = oc ? o.ordenesCambio.find((x) => x.id === oc && x.estado === "borrador") : undefined;
        return <Form o={o} me={me} prev={prev} />;
      }}
    </AppShell>
  );
}

const label = "mb-2 block text-sm font-bold uppercase tracking-wider text-muted-foreground";
const input = "h-14 w-full rounded-2xl border-2 bg-card px-4 text-base outline-none focus:border-primary";

function Form({ o, me, prev }: { o: Obra; me: Usuario; prev?: OrdenCambio | undefined }) {
  const nav = useNavigate();
  const [titulo, setTitulo] = useState(prev?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(prev?.descripcion ?? "");
  const [estancia, setEstancia] = useState(prev?.estancia ?? "");
  const [partidas, setPartidas] = useState<Partida[]>(prev?.partidas ?? [{ concepto: "", cantidad: 1, precio: 0 }]);
  const [dias, setDias] = useState(prev?.diasExtra ?? 0);
  const [fotos, setFotos] = useState<string[]>(prev?.fotos ?? []);
  const t = totales({ partidas });
  const ok = titulo.trim() && estancia.trim() && partidas.some((p) => p.concepto.trim() && p.cantidad > 0);
  const set = (i: number, k: keyof Partida, v: string) => setPartidas(partidas.map((p, j) => (j === i ? { ...p, [k]: k === "concepto" ? v : Number(v.replace(",", ".")) || 0 } : p)));

  const guardar = (enviar: boolean) => {
    if (!ok) return;
    const id = prev?.id ?? uid("oc");
    const datos: OrdenCambio = {
      id, fecha: prev?.fecha ?? hoyISO(), titulo: titulo.trim(), descripcion: descripcion.trim(), estancia: estancia.trim(),
      partidas: partidas.filter((p) => p.concepto.trim()), diasExtra: dias, fotos, estado: enviar ? "enviada" : "borrador",
      creadaPor: prev?.creadaPor ?? me.id, enviadaEn: enviar ? new Date().toISOString() : undefined,
    };
    if (mutate((d) => { const ob = d.obras.find((x) => x.id === o.id)!; ob.ordenesCambio = [...ob.ordenesCambio.filter((x) => x.id !== id), datos]; }))
      nav({ to: "/orden/$obraId/$ocId", params: { obraId: o.id, ocId: id } });
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold">{prev ? "Editar orden de cambio" : "Nueva orden de cambio"}</h1><p className="text-muted-foreground">{o.nombre}</p></div>
      <div><label htmlFor="t" className={label}>Título</label><input id="t" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej.: Suelo radiante en baño" className={input} /></div>
      <div><label htmlFor="e" className={label}>Estancia afectada</label><input id="e" value={estancia} onChange={(e) => setEstancia(e.target.value)} placeholder="Ej.: Baño principal" className={input} /></div>
      <div><label htmlFor="d" className={label}>Descripción para el cliente</label><textarea id="d" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Explica el cambio en lenguaje sencillo" className="w-full rounded-2xl border-2 bg-card p-4 text-base outline-none focus:border-primary" /></div>

      <div>
        <span className={label}>Partidas</span>
        <div className="space-y-3">
          {partidas.map((p, i) => (
            <div key={i} className="rounded-2xl bg-card p-3 shadow-card">
              <div className="flex gap-2">
                <input value={p.concepto} onChange={(e) => set(i, "concepto", e.target.value)} placeholder="Concepto" className="h-12 flex-1 rounded-xl border-2 bg-background px-3 outline-none focus:border-primary" />
                {partidas.length > 1 && <button onClick={() => setPartidas(partidas.filter((_, j) => j !== i))} aria-label="Quitar partida" className="grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-danger"><Trash2 className="h-5 w-5" /></button>}
              </div>
              <div className="mt-2 grid grid-cols-3 items-center gap-2 text-sm">
                <label className="text-muted-foreground">Cant.<input inputMode="decimal" value={p.cantidad} onChange={(e) => set(i, "cantidad", e.target.value)} className="mt-1 h-12 w-full rounded-xl border-2 bg-background px-3 text-base text-foreground" /></label>
                <label className="text-muted-foreground">Precio €<input inputMode="decimal" value={p.precio} onChange={(e) => set(i, "precio", e.target.value)} className="mt-1 h-12 w-full rounded-xl border-2 bg-background px-3 text-base text-foreground" /></label>
                <div className="text-right"><div className="text-muted-foreground">Importe</div><div className="mt-1 font-display text-base font-bold">{euro2(p.cantidad * p.precio)}</div></div>
              </div>
            </div>
          ))}
          <button onClick={() => setPartidas([...partidas, { concepto: "", cantidad: 1, precio: 0 }])} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed font-semibold text-primary"><Plus className="h-5 w-5" />Añadir partida</button>
        </div>
        <div className="mt-3 space-y-1 rounded-2xl bg-muted p-4 text-sm">
          <div className="flex justify-between"><span>Base imponible</span><span>{euro2(t.base)}</span></div>
          <div className="flex justify-between"><span>IVA (21%)</span><span>{euro2(t.iva)}</span></div>
          <div className="flex justify-between font-display text-lg font-bold"><span>Total</span><span>{euro2(t.total)}</span></div>
        </div>
      </div>

      <div>
        <span className={label}>Días extra de plazo</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setDias(Math.max(0, dias - 1))} className="h-14 w-14 rounded-2xl bg-secondary text-2xl font-bold">−</button>
          <div className="flex-1 text-center font-display text-3xl font-bold">{dias} {dias === 1 ? "día" : "días"}</div>
          <button onClick={() => setDias(dias + 1)} className="h-14 w-14 rounded-2xl bg-secondary text-2xl font-bold">+</button>
        </div>
      </div>

      <div><span className={label}>Fotos o referencias (opcional)</span><FotoPicker fotos={fotos} onChange={setFotos} /></div>

      <div className="grid grid-cols-2 gap-3">
        <button disabled={!ok} onClick={() => guardar(false)} className="h-16 rounded-2xl bg-secondary font-bold text-secondary-foreground disabled:opacity-40">Guardar borrador</button>
        <button disabled={!ok} onClick={() => guardar(true)} className="h-16 rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta disabled:opacity-40">Enviar al cliente</button>
      </div>
    </div>
  );
}
