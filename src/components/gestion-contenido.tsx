import { useState, type ReactNode } from "react";
import { Pencil, Plus, LogOut, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Confirmar } from "@/components/formularios";
import { conDeshacer, aLocal, deLocal } from "@/lib/deshacer";
import { dur, fecha, hora, msFichaje, mutate, uid, user } from "@/lib/store";
import { hoyISO } from "@/lib/fechas";
import { olvidados } from "@/lib/analitica";
import type { DB, Fichaje, Obra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

const inp = "h-12 w-full rounded-xl border-2 bg-background px-3 text-base outline-none focus:border-primary";

export function Modal({ open, onClose, titulo, children }: { open: boolean; onClose: () => void; titulo: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Notas ---------- */
export function NotasObra({ db, me, o }: { db: DB; me: Usuario; o: Obra }) {
  const [nuevo, setNuevo] = useState("");
  const [edit, setEdit] = useState<{ id: string; t: string } | null>(null);
  const jefe = me.rol === "jefe_obra" || me.rol === "gerente";
  const ob = (d: DB) => d.obras.find((x) => x.id === o.id)!;
  const notas = [...o.notas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const crear = () => { if (nuevo.trim() && mutate((d) => { ob(d).notas.push({ id: uid("n"), autorId: me.id, fecha: hoyISO(), texto: nuevo.trim() }); })) setNuevo(""); };
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <h2 className="mb-3 text-lg font-semibold">Notas</h2>
      <div className="mb-3 flex gap-2">
        <input aria-label="Nueva nota" value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && crear()} placeholder="Escribe una nota interna…" className={inp} />
        <button disabled={!nuevo.trim()} onClick={crear} className="flex h-12 shrink-0 items-center gap-1 rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-40"><Plus className="h-5 w-5" />Añadir</button>
      </div>
      {notas.length === 0 ? <p className="text-sm text-muted-foreground">Sin notas todavía.</p> : (
        <ul className="space-y-3">
          {notas.map((n) => {
            const puede = jefe || n.autorId === me.id;
            return (
              <li key={n.id} className="rounded-2xl bg-muted p-3 text-sm">
                {edit?.id === n.id ? (
                  <div className="space-y-2">
                    <textarea aria-label="Editar nota" rows={3} value={edit.t} onChange={(e) => setEdit({ id: n.id, t: e.target.value })} className={cn(inp, "h-auto py-2")} />
                    <div className="flex gap-2">
                      <button onClick={() => setEdit(null)} className="h-11 flex-1 rounded-xl bg-card font-semibold">Cancelar</button>
                      <button disabled={!edit.t.trim()} onClick={() => { if (mutate((d) => { const x = ob(d).notas.find((y) => y.id === n.id); if (x) { x.texto = edit.t.trim(); x.editadaEn = new Date().toISOString(); } })) setEdit(null); }} className="h-11 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-40">Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-line">{n.texto}</p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{user(db, n.autorId)?.nombre} · {fecha(n.fecha)}{n.editadaEn && " · editada"}</p>
                      {puede && <span className="flex gap-1">
                        <button onClick={() => setEdit({ id: n.id, t: n.texto })} className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-card"><Pencil className="h-4 w-4" />Editar</button>
                        <Confirmar onSi={() => conDeshacer("Nota borrada", (d) => { const x = ob(d); x.notas = x.notas.filter((y) => y.id !== n.id); })} />
                      </span>}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------- Fichajes ---------- */
function FichajeEditor({ db, me, f, onClose }: { db: DB; me: Usuario; f: Fichaje; onClose: () => void }) {
  const [ent, setEnt] = useState(aLocal(f.entrada));
  const [sal, setSal] = useState(aLocal(f.salida));
  const [obra, setObra] = useState(f.obraId);
  const err = !ent ? "Indica la entrada." : sal && sal <= ent ? "La salida debe ser posterior a la entrada." : "";
  const guardar = () => {
    if (err) return;
    if (mutate((d) => {
      const x = d.fichajes.find((y) => y.id === f.id); if (!x) return;
      x.entrada = deLocal(ent); x.obraId = obra;
      if (sal) x.salida = deLocal(sal); else delete x.salida;
      x.corregido = { por: me.id, en: new Date().toISOString() };
    })) onClose();
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{user(db, f.userId)?.nombre}</p>
      <label className="block"><span className="mb-1 block text-sm font-semibold">Obra</span>
        <select className={inp} value={obra} onChange={(e) => setObra(e.target.value)}>{db.obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></label>
      <label className="block"><span className="mb-1 block text-sm font-semibold">Entrada</span><input type="datetime-local" className={inp} value={ent} onChange={(e) => setEnt(e.target.value)} /></label>
      <label className="block"><span className="mb-1 block text-sm font-semibold">Salida</span><input type="datetime-local" className={inp} value={sal} onChange={(e) => setSal(e.target.value)} /></label>
      {err && <p className="text-sm font-semibold text-danger">{err}</p>}
      <button disabled={!!err} onClick={guardar} className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-40">Guardar corrección</button>
    </div>
  );
}

export function FichajesObra({ db, me, o }: { db: DB; me: Usuario; o: Obra }) {
  const [edit, setEdit] = useState<Fichaje | null>(null);
  const [todos, setTodos] = useState(false);
  const lista = db.fichajes.filter((f) => f.obraId === o.id).sort((a, b) => b.entrada.localeCompare(a.entrada));
  const ver = todos ? lista : lista.slice(0, 12);
  const cerrar = (f: Fichaje) => mutate((d) => { const x = d.fichajes.find((y) => y.id === f.id); if (x) { x.salida = new Date().toISOString(); x.corregido = { por: me.id, en: new Date().toISOString() }; } });
  const viejos = new Set(olvidados(db).map((f) => f.id));
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <h2 className="mb-3 text-lg font-semibold">Fichajes de la obra</h2>
      {lista.length === 0 ? <p className="text-sm text-muted-foreground">Sin fichajes.</p> : (
        <ul className="divide-y">
          {ver.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{user(db, f.userId)?.nombre}</div>
                <div className="text-xs text-muted-foreground">{fecha(f.entrada.slice(0, 10))} · {hora(f.entrada)} – {f.salida ? hora(f.salida) : <span className={cn("font-bold", viejos.has(f.id) ? "text-danger" : "text-ok")}>{viejos.has(f.id) ? "abierto +12 h" : "en curso"}</span>} · {dur(msFichaje(f))}</div>
                {f.corregido && <div className="text-xs text-muted-foreground">Corregido por {user(db, f.corregido.por)?.nombre} el {fecha(f.corregido.en.slice(0, 10))}</div>}
              </div>
              {!f.salida && <button onClick={() => cerrar(f)} className="flex h-11 items-center gap-1 rounded-xl bg-ink px-3 font-semibold text-ink-foreground"><LogOut className="h-4 w-4" />Cerrar ahora</button>}
              <button onClick={() => setEdit(f)} className="flex h-11 items-center gap-1 rounded-xl border-2 px-3 font-semibold"><Pencil className="h-4 w-4" />Corregir</button>
            </li>
          ))}
        </ul>
      )}
      {lista.length > 12 && <button onClick={() => setTodos(!todos)} className="mt-2 h-11 w-full rounded-xl bg-muted font-semibold">{todos ? "Ver menos" : `Ver los ${lista.length} fichajes`}</button>}
      <Modal open={!!edit} onClose={() => setEdit(null)} titulo="Corregir fichaje">{edit && <FichajeEditor db={db} me={me} f={edit} onClose={() => setEdit(null)} />}</Modal>
    </section>
  );
}

/** Aviso de fichajes abiertos más de 12 horas. */
export function AvisoOlvidados({ db, filtro }: { db: DB; filtro?: (f: Fichaje) => boolean }) {
  const l = olvidados(db).filter((f) => !filtro || filtro(f));
  if (!l.length) return null;
  return (
    <div className="flex gap-3 rounded-2xl border-2 border-danger/30 bg-danger-soft p-4 text-sm">
      <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
      <div><div className="font-semibold text-danger">{l.length === 1 ? "Hay un fichaje abierto hace más de 12 horas" : `Hay ${l.length} fichajes abiertos hace más de 12 horas`}</div>
        <ul className="mt-1 text-muted-foreground">{l.map((f) => <li key={f.id}>{user(db, f.userId)?.nombre} · {db.obras.find((o) => o.id === f.obraId)?.nombre} · desde {fecha(f.entrada.slice(0, 10))} {hora(f.entrada)}</li>)}</ul>
        <p className="mt-1 text-muted-foreground">Ciérralo o corrígelo desde «Fichajes de la obra» en la ficha.</p></div>
    </div>
  );
}
