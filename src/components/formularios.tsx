import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { FotoPicker } from "@/components/fotos";
import { FASES } from "@/lib/seed";
import { hoyISO } from "@/lib/fechas";
import { msFichaje, mutate, uid, user } from "@/lib/store";
import type { DB, FaseTipo, Incidencia, Obra, ParteDiario, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

const label = "mb-2 block text-sm font-bold uppercase tracking-wider text-muted-foreground";

/** Botón destructivo con confirmación en dos pasos. */
export function Confirmar({ texto = "Borrar", pregunta = "¿Seguro?", onSi, className }: { texto?: string; pregunta?: string; onSi: () => void; className?: string }) {
  const [p, setP] = useState(false);
  if (!p) return <button type="button" onClick={() => setP(true)} className={cn("flex h-11 items-center justify-center gap-1 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft", className)}><Trash2 className="h-4 w-4" />{texto}</button>;
  return (
    <span className={cn("flex flex-wrap items-center gap-2 rounded-xl bg-danger-soft p-1.5 text-sm", className)}>
      <span className="px-1 font-semibold text-danger">{pregunta}</span>
      <button type="button" onClick={() => { setP(false); onSi(); }} className="h-10 rounded-lg bg-danger px-3 font-semibold text-destructive-foreground">Sí, {texto.toLowerCase()}</button>
      <button type="button" onClick={() => setP(false)} className="h-10 rounded-lg bg-card px-3 font-semibold">Cancelar</button>
    </span>
  );
}

/** Formulario de parte diario (alta o edición). */
export function ParteForm({ db, me, o, inicial, onDone }: { db: DB; me: Usuario; o: Obra; inicial?: ParteDiario; onDone: () => void }) {
  const hoy = hoyISO();
  const fichHoy = db.fichajes.filter((f) => f.obraId === o.id && f.entrada.slice(0, 10) === hoy && o.equipo.operarioIds.includes(f.userId));
  const [fase, setFase] = useState<FaseTipo>(inicial?.fase ?? ((o.fases.find((f) => f.estado !== "completada")?.tipo ?? "limpieza") as FaseTipo));
  const [trabajos, setTrabajos] = useState(inicial?.trabajos ?? "");
  const [pres, setPres] = useState<string[]>(() => {
    if (inicial) return inicial.operarioIds;
    const ids = [...new Set(fichHoy.map((f) => f.userId))];
    return ids.length ? ids : me.rol === "operario" ? [me.id] : [];
  });
  const [horas, setHoras] = useState<number>(() => {
    if (inicial) return inicial.horas;
    const h = fichHoy.reduce((s, f) => s + msFichaje(f), 0) / 3600000;
    return h > 0.25 ? Math.round(h * 2) / 2 : 8;
  });
  const [fotos, setFotos] = useState<string[]>(inicial?.fotos ?? []);
  const [visible, setVisible] = useState(inicial?.visibleCliente ?? true);
  const ok = trabajos.trim().length > 3 && pres.length > 0 && horas > 0;
  const candidatos = [...new Set([...o.equipo.operarioIds, ...pres])];

  const enviar = () => {
    if (!ok) return;
    const saved = mutate((d) => {
      const ob = d.obras.find((x) => x.id === o.id)!;
      const datos = { horas, operarioIds: pres, trabajos: trabajos.trim(), fotos, fase, visibleCliente: visible };
      if (inicial) { const p = ob.partesDiarios.find((x) => x.id === inicial.id); if (p) Object.assign(p, datos); }
      else ob.partesDiarios.push({ id: uid("p"), fecha: hoy, autorId: me.id, ...datos });
    });
    if (saved) onDone();
  };

  return (
    <div className="space-y-5">
      <div>
        <span className={label}>Fase trabajada</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FASES.map((f) => (
            <button key={f.tipo} onClick={() => setFase(f.tipo)} className={cn("h-12 shrink-0 rounded-full border-2 px-4 font-semibold", fase === f.tipo ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{f.nombre}</button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="trab" className={label}>Trabajos realizados</label>
        <textarea id="trab" value={trabajos} onChange={(e) => setTrabajos(e.target.value)} rows={4} placeholder="Ej.: Rozas en cocina para nueva toma de lavavajillas…" className="w-full rounded-2xl border-2 bg-card p-4 text-base outline-none focus:border-primary" />
      </div>
      <div>
        <span className={label}>Operarios presentes</span>
        <div className="flex flex-wrap gap-2">
          {candidatos.map((id) => {
            const on = pres.includes(id);
            return (
              <button key={id} onClick={() => setPres(on ? pres.filter((x) => x !== id) : [...pres, id])} className={cn("flex h-12 items-center gap-2 rounded-full border-2 px-4 font-semibold", on ? "border-primary bg-accent text-accent-foreground" : "bg-card")}>
                {on && <Check className="h-4 w-4" />}{user(db, id)?.nombre}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <span className={label}>Horas totales del equipo</span>
        <div className="flex items-center gap-3">
          <button aria-label="Menos horas" onClick={() => setHoras(Math.max(0, horas - 0.5))} className="h-14 w-14 rounded-2xl bg-secondary text-2xl font-bold">−</button>
          <div className="flex-1 text-center font-display text-3xl font-bold">{horas.toLocaleString("es-ES")} h</div>
          <button aria-label="Más horas" onClick={() => setHoras(horas + 0.5)} className="h-14 w-14 rounded-2xl bg-secondary text-2xl font-bold">+</button>
        </div>
      </div>
      <div><span className={label}>Fotos</span><FotoPicker fotos={fotos} onChange={setFotos} /></div>
      <button type="button" role="switch" aria-checked={visible} onClick={() => setVisible(!visible)} className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left shadow-card">
        <span><span className="block font-semibold">Visible para el cliente</span><span className="text-sm text-muted-foreground">Aparecerá en su diario de obra con las fotos</span></span>
        <span className={cn("relative h-8 w-14 shrink-0 rounded-full transition", visible ? "bg-primary" : "bg-input")}><span className={cn("absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-all", visible ? "left-7" : "left-1")} /></span>
      </button>
      <button disabled={!ok} onClick={enviar} className="h-16 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-cta disabled:opacity-40">{inicial ? "Guardar cambios" : "Enviar parte"}</button>
    </div>
  );
}

const G: { v: Incidencia["gravedad"]; label: string; cls: string }[] = [
  { v: "baja", label: "Baja", cls: "border-ok bg-ok-soft text-ok" },
  { v: "media", label: "Media", cls: "border-warn bg-warn-soft text-warn" },
  { v: "alta", label: "Alta", cls: "border-danger bg-danger-soft text-danger" },
];

/** Formulario de incidencia (alta o edición). */
export function IncidenciaForm({ o, me, inicial, onDone }: { o: Obra; me: Usuario; inicial?: Incidencia; onDone: () => void }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [desc, setDesc] = useState(inicial?.descripcion ?? "");
  const [grav, setGrav] = useState<Incidencia["gravedad"]>(inicial?.gravedad ?? "media");
  const [fotos, setFotos] = useState<string[]>(inicial?.fotos ?? []);
  const ok = titulo.trim().length > 2;
  const enviar = () => {
    if (!ok) return;
    const datos = { titulo: titulo.trim(), descripcion: desc.trim(), gravedad: grav, fotos };
    if (mutate((d) => {
      const ob = d.obras.find((x) => x.id === o.id)!;
      if (inicial) { const i = ob.incidencias.find((x) => x.id === inicial.id); if (i) Object.assign(i, datos); }
      else ob.incidencias.push({ id: uid("i"), fecha: hoyISO(), estado: "abierta", autorId: me.id, ...datos });
    })) onDone();
  };
  return (
    <div className="space-y-5">
      <div><label htmlFor="t" className={label}>Título</label>
        <input id="t" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej.: Fuga en llave de paso de cocina" className="h-14 w-full rounded-2xl border-2 bg-card px-4 text-base outline-none focus:border-primary" /></div>
      <div><label htmlFor="d" className={label}>Descripción</label>
        <textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Qué ha pasado, dónde y qué se necesita" className="w-full rounded-2xl border-2 bg-card p-4 text-base outline-none focus:border-primary" /></div>
      <div><span className={label}>Gravedad</span>
        <div className="grid grid-cols-3 gap-2">
          {G.map((g) => <button key={g.v} onClick={() => setGrav(g.v)} className={cn("h-14 rounded-2xl border-2 font-bold", grav === g.v ? g.cls : "bg-card")}>{g.label}</button>)}
        </div></div>
      <div><span className={label}>Fotos</span><FotoPicker fotos={fotos} onChange={setFotos} /></div>
      <button disabled={!ok} onClick={enviar} className="h-16 w-full rounded-2xl bg-danger text-lg font-bold text-destructive-foreground disabled:opacity-40">{inicial ? "Guardar cambios" : "Enviar incidencia"}</button>
    </div>
  );
}
