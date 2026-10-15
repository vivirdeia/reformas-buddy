import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Circle, Loader, Ban, Play, Lock, Unlock, RotateCcw, Pencil, AlertTriangle, Archive, ArchiveRestore, Trash2, ImagePlus, MessageSquareHeart, X } from "lucide-react";
import type { DB, FaseEstado, Obra, Usuario } from "@/lib/types";
import { mutate, nombreFase, fecha } from "@/lib/store";
import { aplicarFase, fasesDesde, fechasInvalidas, moverInicio, recalcularFechas, solapes, borrarObra, type AccionFase } from "@/lib/obras";
import { comprimir } from "@/components/fotos";
import { Foto } from "@/components/obria";
import { cn } from "@/lib/utils";

export const inp = "h-12 w-full rounded-xl border-2 bg-background px-3 text-base outline-none focus:border-primary";
export const btn = "flex h-12 items-center justify-center gap-2 rounded-xl px-4 font-semibold";

export function Campo({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn("block", className)}><span className="mb-1 block text-sm font-semibold text-muted-foreground">{label}</span>{children}</label>;
}

const FE: Record<FaseEstado, { label: string; icon: typeof Check; cls: string }> = {
  completada: { label: "Completada", icon: Check, cls: "bg-ok text-primary-foreground" },
  en_curso: { label: "En curso", icon: Loader, cls: "bg-primary text-primary-foreground" },
  bloqueada: { label: "Bloqueada", icon: Ban, cls: "bg-danger text-destructive-foreground" },
  pendiente: { label: "Pendiente", icon: Circle, cls: "bg-muted text-muted-foreground" },
};

const editar = (id: string, fn: (o: Obra) => void) => mutate((d) => { const o = d.obras.find((x) => x.id === id); if (o) fn(o); });

/** Fases con acciones de avance y edición de fechas. */
export function FasesObra({ o, puede }: { o: Obra; puede: boolean }) {
  const [edit, setEdit] = useState<number | null>(null);
  const sol = new Set(solapes(o));
  const inval = new Set(fechasInvalidas(o));
  const acc = (i: number, a: AccionFase) => editar(o.id, (x) => aplicarFase(x, i, a));
  const setF = (i: number, k: "inicioPrevisto" | "finPrevisto" | "inicioReal" | "finReal", v: string) => editar(o.id, (x) => {
    const f = x.fases[i]!; if (v) f[k] = v; else if (k === "inicioReal" || k === "finReal") delete f[k];
    if (k === "inicioPrevisto" || k === "finPrevisto") recalcularFechas(x);
  });
  return (
    <>
      {sol.size > 0 && <p className="mb-3 flex gap-2 rounded-2xl bg-warn-soft p-3 text-sm font-semibold text-warn"><AlertTriangle className="h-5 w-5 shrink-0" />Hay fases que se solapan: {[...sol].map((i) => nombreFase(o.fases[i]!.tipo)).join(", ")} empieza antes de que termine la anterior.</p>}
      <ol className="space-y-1">
        {o.fases.map((f, i) => {
          const e = FE[f.estado];
          const tarde = f.finReal && f.finReal > f.finPrevisto;
          const ant = o.fases[i - 1];
          const sig = o.fases[i + 1];
          return (
            <li key={f.tipo} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("grid h-9 w-9 place-items-center rounded-full", e.cls)}><e.icon className="h-4 w-4" /></div>
                {i < o.fases.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{nombreFase(f.tipo)}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">{e.label}
                    {puede && <button aria-label={`Editar fechas de ${nombreFase(f.tipo)}`} onClick={() => setEdit(edit === i ? null : i)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted"><Pencil className="h-4 w-4" /></button>}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <div className={cn((sol.has(i) || inval.has(i)) && "font-semibold text-warn")}><span className="text-muted-foreground">Previsto </span>{fecha(f.inicioPrevisto)} – {fecha(f.finPrevisto)}</div>
                  <div className={cn(tarde && "font-semibold text-danger")}><span className="text-muted-foreground">Real </span>{f.inicioReal ? `${fecha(f.inicioReal)} – ${f.finReal ? fecha(f.finReal) : "…"}` : "—"}</div>
                </div>
                {puede && edit === i && (
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-3">
                    <Campo label="Inicio previsto"><input type="date" className={inp} value={f.inicioPrevisto} onChange={(ev) => setF(i, "inicioPrevisto", ev.target.value)} /></Campo>
                    <Campo label="Fin previsto"><input type="date" className={inp} value={f.finPrevisto} onChange={(ev) => setF(i, "finPrevisto", ev.target.value)} /></Campo>
                    <Campo label="Inicio real"><input type="date" className={inp} value={f.inicioReal ?? ""} onChange={(ev) => setF(i, "inicioReal", ev.target.value)} /></Campo>
                    <Campo label="Fin real"><input type="date" className={inp} value={f.finReal ?? ""} disabled={f.estado !== "completada"} onChange={(ev) => setF(i, "finReal", ev.target.value)} /></Campo>
                    {inval.has(i) && <p className="col-span-2 text-xs font-semibold text-danger">El fin previsto es anterior al inicio.</p>}
                  </div>
                )}
                {puede && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {f.estado === "pendiente" && <button onClick={() => acc(i, "iniciar")} className={cn(btn, "h-11 bg-primary text-primary-foreground", ant && ant.estado !== "completada" && "bg-secondary text-secondary-foreground")}><Play className="h-4 w-4" />Iniciar</button>}
                    {(f.estado === "en_curso" || f.estado === "bloqueada") && <button onClick={() => acc(i, "completar")} className={cn(btn, "h-11 bg-ok text-primary-foreground")}><Check className="h-4 w-4" />Completar</button>}
                    {f.estado === "en_curso" && <button onClick={() => acc(i, "bloquear")} className={cn(btn, "h-11 bg-danger-soft text-danger")}><Lock className="h-4 w-4" />Bloquear</button>}
                    {f.estado === "bloqueada" && <button onClick={() => acc(i, "desbloquear")} className={cn(btn, "h-11 bg-secondary text-secondary-foreground")}><Unlock className="h-4 w-4" />Desbloquear</button>}
                    {f.estado === "completada" && sig?.estado === "pendiente" && <button onClick={() => acc(i + 1, "iniciar")} className={cn(btn, "h-11 bg-primary text-primary-foreground")}><Play className="h-4 w-4" />Iniciar {nombreFase(sig.tipo)}</button>}
                    {f.estado === "completada" && <button onClick={() => acc(i, "reabrir")} className={cn(btn, "h-11 border-2 text-muted-foreground")}><RotateCcw className="h-4 w-4" />Reabrir</button>}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Selector de portada: subir foto o pegar URL. */
export function Portada({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const url = value.startsWith("data:") ? "" : value;
  return (
    <div className="space-y-2">
      <div className="relative h-36 overflow-hidden rounded-2xl bg-muted">{value && <Foto src={value} alt="Portada" className="h-full w-full" />}</div>
      <div className="flex gap-2">
        <button type="button" onClick={() => ref.current?.click()} className={cn(btn, "shrink-0 bg-secondary text-secondary-foreground")}><ImagePlus className="h-5 w-5" />Subir foto</button>
        <input className={inp} placeholder="o pega una URL de imagen" value={url} onChange={(e) => onChange(e.target.value)} />
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await comprimir(f, 1400, 0.7)); e.target.value = ""; }} />
    </div>
  );
}

/** Selector de equipo (jefe, operarios, gremios). */
export function SelectorEquipo({ db, value, onChange }: { db: DB; value: Obra["equipo"]; onChange: (e: Obra["equipo"]) => void }) {
  const sel = [value.jefeId, ...value.operarioIds];
  const jefes = db.usuarios.filter((u) => u.rol === "jefe_obra" && (u.activo !== false || sel.includes(u.id)));
  const ops = db.usuarios.filter((u) => u.rol === "operario" && (u.activo !== false || sel.includes(u.id)));
  const tog = (l: string[], id: string) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]);
  const chip = (on: boolean) => cn("rounded-full border-2 px-3 py-2 text-sm font-medium", on ? "border-primary bg-primary text-primary-foreground" : "bg-card");
  return (
    <div className="space-y-3">
      <Campo label="Jefe de obra">
        <select className={inp} value={value.jefeId} onChange={(e) => onChange({ ...value, jefeId: e.target.value })}>
          {jefes.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </Campo>
      <div><div className="mb-1 text-sm font-semibold text-muted-foreground">Operarios</div>
        <div className="flex flex-wrap gap-2">{ops.map((u) => <button type="button" key={u.id} aria-pressed={value.operarioIds.includes(u.id)} onClick={() => onChange({ ...value, operarioIds: tog(value.operarioIds, u.id) })} className={chip(value.operarioIds.includes(u.id))}>{u.nombre} · {u.oficio}</button>)}</div>
      </div>
      <div><div className="mb-1 text-sm font-semibold text-muted-foreground">Gremios</div>
        <div className="flex flex-wrap gap-2">{db.gremios.map((g) => <button type="button" key={g.id} aria-pressed={value.gremioIds.includes(g.id)} onClick={() => onChange({ ...value, gremioIds: tog(value.gremioIds, g.id) })} className={chip(value.gremioIds.includes(g.id))}>{g.oficio} · {g.empresa}</button>)}</div>
      </div>
    </div>
  );
}

type Datos = Pick<Obra, "nombre" | "tipo" | "direccion" | "barrio" | "m2" | "presupuesto" | "fechaInicio" | "fechaFinPrevista" | "portada" | "horario"> & { notasCliente: string };
export function CamposDatos({ v, set, fechas = true }: { v: Datos; set: (p: Partial<Datos>) => void; fechas?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Campo label="Nombre de la obra" className="sm:col-span-2"><input className={inp} value={v.nombre} onChange={(e) => set({ nombre: e.target.value })} /></Campo>
      <Campo label="Tipo"><select className={inp} value={v.tipo} onChange={(e) => set({ tipo: e.target.value as Obra["tipo"] })}><option value="piso">Vivienda</option><option value="local">Local</option></select></Campo>
      <Campo label="Superficie (m²)"><input type="number" min={1} className={inp} value={v.m2 || ""} onChange={(e) => set({ m2: Number(e.target.value) })} /></Campo>
      <Campo label="Dirección"><input className={inp} value={v.direccion} onChange={(e) => set({ direccion: e.target.value })} /></Campo>
      <Campo label="Barrio"><input className={inp} value={v.barrio} onChange={(e) => set({ barrio: e.target.value })} /></Campo>
      <Campo label="Presupuesto inicial (€)"><input type="number" min={0} className={inp} value={v.presupuesto || ""} onChange={(e) => set({ presupuesto: Number(e.target.value) })} /></Campo>
      <Campo label="Fecha de inicio"><input type="date" className={inp} value={v.fechaInicio} onChange={(e) => set({ fechaInicio: e.target.value })} /></Campo>
      {fechas && <Campo label="Fin previsto"><input type="date" className={inp} value={v.fechaFinPrevista} onChange={(e) => set({ fechaFinPrevista: e.target.value })} /></Campo>}
      <Campo label="Horario de obra" className="sm:col-span-2"><input className={inp} value={v.horario} onChange={(e) => set({ horario: e.target.value })} /></Campo>
      <Campo label="Notas para el cliente (las verá en su portal)" className="sm:col-span-2"><textarea rows={3} className={cn(inp, "h-auto py-2")} value={v.notasCliente} onChange={(e) => set({ notasCliente: e.target.value })} /></Campo>
      <div className="sm:col-span-2"><div className="mb-1 text-sm font-semibold text-muted-foreground">Portada</div><Portada value={v.portada} onChange={(portada) => set({ portada })} /></div>
    </div>
  );
}

/** Panel de edición de datos y equipo. */
export function EditarObra({ db, o, onClose }: { db: DB; o: Obra; onClose: () => void }) {
  const [v, setV] = useState<Datos>({ nombre: o.nombre, tipo: o.tipo, direccion: o.direccion, barrio: o.barrio, m2: o.m2, presupuesto: o.presupuesto, fechaInicio: o.fechaInicio, fechaFinPrevista: o.fechaFinPrevista, portada: o.portada, horario: o.horario, notasCliente: o.notasCliente ?? "" });
  const [eq, setEq] = useState(o.equipo);
  const err = !v.nombre.trim() ? "Pon un nombre a la obra." : v.m2 <= 0 ? "Indica los m²." : v.presupuesto <= 0 ? "Indica el presupuesto." : !v.fechaInicio || v.fechaFinPrevista < v.fechaInicio ? "Revisa las fechas." : "";
  const guardar = () => {
    if (err) return;
    const ok = editar(o.id, (x) => {
      const { fechaInicio, fechaFinPrevista, notasCliente, ...rest } = v;
      Object.assign(x, rest, { nombre: v.nombre.trim(), notasCliente: notasCliente.trim() || undefined, equipo: eq });
      moverInicio(x, fechaInicio);
      if (fechaFinPrevista !== o.fechaFinPrevista) x.fechaFinPrevista = fechaFinPrevista;
    });
    if (ok) onClose();
  };
  return (
    <section className="space-y-4 rounded-3xl border-2 border-primary/40 bg-card p-4 shadow-card">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Editar obra</h2><button aria-label="Cerrar" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-muted"><X className="h-5 w-5" /></button></div>
      <CamposDatos v={v} set={(p) => setV({ ...v, ...p })} />
      <p className="text-xs text-muted-foreground">Al cambiar la fecha de inicio se mueven todas las fechas previstas de las fases.</p>
      <h3 className="pt-2 font-semibold">Equipo</h3>
      <SelectorEquipo db={db} value={eq} onChange={setEq} />
      {err && <p className="text-sm font-semibold text-danger">{err}</p>}
      <div className="flex gap-2"><button onClick={onClose} className={cn(btn, "flex-1 border-2")}>Cancelar</button><button disabled={!!err} onClick={guardar} className={cn(btn, "flex-1 bg-primary text-primary-foreground shadow-cta disabled:opacity-50")}>Guardar cambios</button></div>
    </section>
  );
}

/** Mensaje de estado manual para el portal del cliente. */
export function MensajeCliente({ o }: { o: Obra }) {
  const [t, setT] = useState(o.mensajeCliente ?? "");
  const cambiado = t.trim() !== (o.mensajeCliente ?? "");
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><MessageSquareHeart className="h-5 w-5 text-primary" />Mensaje para el cliente</h2>
      <p className="mb-3 text-sm text-muted-foreground">{o.mensajeCliente ? "El cliente ve este mensaje en lugar del automático." : "Vacío: el cliente ve el mensaje automático según el estado de la obra."}</p>
      <textarea rows={3} value={t} onChange={(e) => setT(e.target.value)} placeholder="Ej.: Esta semana terminamos el alicatado del baño y empezamos con la cocina." className={cn(inp, "h-auto py-2")} />
      <div className="mt-2 flex gap-2">
        {o.mensajeCliente && <button onClick={() => { setT(""); editar(o.id, (x) => { delete x.mensajeCliente; }); }} className={cn(btn, "border-2")}>Usar automático</button>}
        <button disabled={!cambiado} onClick={() => editar(o.id, (x) => { x.mensajeCliente = t.trim() || undefined; })} className={cn(btn, "flex-1 bg-primary text-primary-foreground disabled:opacity-50")}>Guardar mensaje</button>
      </div>
    </section>
  );
}

/** Archivar / borrar (gerente). */
export function ZonaPeligro({ o }: { o: Obra }) {
  const nav = useNavigate();
  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState("");
  const borrar = () => { if (mutate((d) => borrarObra(d, o.id))) nav({ to: "/obras" }); };
  return (
    <section className="space-y-3 rounded-3xl border-2 border-danger/20 bg-card p-4 shadow-card">
      <h2 className="text-lg font-semibold">Archivar o borrar</h2>
      <button onClick={() => editar(o.id, (x) => { x.archivada = !x.archivada || undefined; })} className={cn(btn, "w-full border-2")}>
        {o.archivada ? <><ArchiveRestore className="h-5 w-5" />Desarchivar obra</> : <><Archive className="h-5 w-5" />Archivar obra</>}
      </button>
      <p className="text-xs text-muted-foreground">Las obras archivadas no aparecen en listados, KPIs ni Gantt, pero conservan todos sus datos.</p>
      {paso === 0 && <button onClick={() => setPaso(1)} className={cn(btn, "w-full bg-danger-soft text-danger")}><Trash2 className="h-5 w-5" />Borrar obra</button>}
      {paso === 1 && (
        <div className="space-y-2 rounded-2xl bg-danger-soft p-3">
          <p className="text-sm font-semibold text-danger">Se borrarán la obra, sus partes, incidencias, órdenes, pagos, fichajes, tareas y fotos. El cliente quedará sin obra. No se puede deshacer.</p>
          <div className="flex gap-2"><button onClick={() => setPaso(0)} className={cn(btn, "flex-1 border-2 bg-card")}>Cancelar</button><button onClick={() => setPaso(2)} className={cn(btn, "flex-1 bg-danger text-destructive-foreground")}>Entiendo, continuar</button></div>
        </div>
      )}
      {paso === 2 && (
        <div className="space-y-2 rounded-2xl bg-danger-soft p-3">
          <Campo label={`Escribe «${o.nombre}» para confirmar`}><input aria-label="Nombre de la obra para confirmar" className={inp} value={nombre} onChange={(e) => setNombre(e.target.value)} /></Campo>
          <div className="flex gap-2"><button onClick={() => { setPaso(0); setNombre(""); }} className={cn(btn, "flex-1 border-2 bg-card")}>Cancelar</button><button disabled={nombre.trim() !== o.nombre.trim()} onClick={borrar} className={cn(btn, "flex-1 bg-danger text-destructive-foreground disabled:opacity-40")}>Borrar definitivamente</button></div>
        </div>
      )}
    </section>
  );
}

export { fasesDesde };
export type { Usuario };
