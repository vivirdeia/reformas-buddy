import { obrasVivas } from "@/lib/store";
import { calcularEstadoObra } from "@/lib/analitica";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, LogOut, AlertTriangle, ClipboardList, Check, Plus, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/obria";
import { dur, faseActual, fechaLarga, hora, msFichaje, mutate, nombreFase, uid, useNow, user } from "@/lib/store";
import { FASES } from "@/lib/seed";
import { hoyISO } from "@/lib/fechas";
import type { DB, FaseTipo, Obra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Confirmar } from "@/components/formularios";
import { AvisoOlvidados } from "@/components/gestion-contenido";
import { conDeshacer } from "@/lib/deshacer";

export const Route = createFileRoute("/hoy")({
  head: () => ({
    meta: [
      { title: "Hoy · Obria" },
      { name: "description", content: "Jornada del día: fichajes, tareas y partes de obra." },
      { property: "og:title", content: "Hoy · Obria" },
      { property: "og:description", content: "Fichaje, checklist y parte diario a pie de obra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AppShell>{(ctx) => <HoyBody {...ctx} />}</AppShell>,
});

function HoyBody({ db, me }: { db: DB; me: Usuario }) {
  const nav = useNavigate();
  const now = useNow(1000);
  const hoy = hoyISO();
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => { if (me.rol === "cliente") nav({ to: "/obras" }); }, [me.rol, nav]);

  const obras = obrasVivas(db).filter((o) => calcularEstadoObra(o) !== "terminada" &&
    (me.rol === "jefe_obra" ? o.equipo.jefeId === me.id : me.rol === "operario" ? o.equipo.operarioIds.includes(me.id) : true));
  const mios = db.fichajes.filter((f) => f.userId === me.id && f.entrada.slice(0, 10) <= hoy && new Date(f.entrada).toDateString() === new Date(now).toDateString());
  const abierto = db.fichajes.find((f) => f.userId === me.id && !f.salida);
  const total = mios.reduce((s, f) => s + msFichaje(f, now), 0);

  const fichar = (o: Obra) => {
    if (abierto && abierto.obraId !== o.id) { setAviso(o.id); return; }
    setAviso(null);
    mutate((d) => {
      const a = d.fichajes.find((f) => f.userId === me.id && !f.salida);
      if (a) a.salida = new Date().toISOString();
      else d.fichajes.push({ id: uid("f"), userId: me.id, obraId: o.id, entrada: new Date().toISOString() });
    });
  };
  const cambiar = (o: Obra) => {
    setAviso(null);
    mutate((d) => {
      const a = d.fichajes.find((f) => f.userId === me.id && !f.salida);
      if (a) a.salida = new Date().toISOString();
      d.fichajes.push({ id: uid("f"), userId: me.id, obraId: o.id, entrada: new Date().toISOString() });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground first-letter:uppercase">{fechaLarga(hoy)}</p>
        <h1 className="text-2xl font-bold">Tu jornada</h1>
      </div>
      <AvisoOlvidados db={db} filtro={(f) => f.userId === me.id || (me.rol === "gerente") || (me.rol === "jefe_obra" && db.obras.some((o) => o.id === f.obraId && o.equipo.jefeId === me.id))} />
      <div className="flex items-center justify-between rounded-3xl bg-ink p-4 text-ink-foreground shadow-card">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-foreground/70">Horas hoy</div>
          <div className="font-display text-3xl font-bold tabular-nums">{dur(total, true)}</div>
        </div>
        <div className="text-right text-sm">
          {abierto ? <><div className="font-semibold text-warn">● Fichado</div><div className="text-ink-foreground/70">{db.obras.find((o) => o.id === abierto.obraId)?.nombre}</div></> : <div className="text-ink-foreground/70">Sin fichaje activo</div>}
        </div>
      </div>
      {obras.length === 0 && <p className="py-10 text-center text-muted-foreground">No tienes obras asignadas.</p>}
      {obras.map((o) => (
        <ObraHoy key={o.id} db={db} me={me} o={o} now={now} hoy={hoy}
          abiertoAqui={abierto?.obraId === o.id ? abierto : undefined}
          aviso={aviso === o.id ? db.obras.find((x) => x.id === abierto?.obraId)?.nombre : undefined}
          onFichar={() => fichar(o)} onCambiar={() => cambiar(o)} onCancelar={() => setAviso(null)} />
      ))}
    </div>
  );
}

function ObraHoy({ db, me, o, now, hoy, abiertoAqui, aviso, onFichar, onCambiar, onCancelar }: {
  db: DB; me: Usuario; o: Obra; now: number; hoy: string; abiertoAqui?: { entrada: string } | undefined;
  aviso?: string | undefined; onFichar: () => void; onCambiar: () => void; onCancelar: () => void;
}) {
  const hechos = db.fichajes.filter((f) => f.userId === me.id && f.obraId === o.id && f.salida && new Date(f.entrada).toDateString() === new Date(now).toDateString());
  const tareas = db.tareas.filter((t) => t.obraId === o.id && t.fecha === hoy);
  const done = tareas.filter((t) => t.hecha).length;
  const esJefe = me.rol === "jefe_obra" || me.rol === "gerente";
  const parteHoy = o.partesDiarios.some((p) => p.fecha === hoy);
  const actual = (o.fases.find((f) => f.estado !== "completada")?.tipo ?? "limpieza") as FaseTipo;
  const [form, setForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [fase, setFase] = useState<FaseTipo>(actual);
  const [opId, setOpId] = useState(o.equipo.operarioIds[0] ?? "");
  const [editT, setEditT] = useState<{ id: string; titulo: string; fase: FaseTipo; operarioId: string } | null>(null);

  const toggle = (id: string) => mutate((d) => { const t = d.tareas.find((x) => x.id === id)!; t.hecha = !t.hecha; t.hechaEn = t.hecha ? new Date().toISOString() : undefined; });
  const crear = () => {
    if (!titulo.trim()) return;
    mutate((d) => d.tareas.push({ id: uid("t"), obraId: o.id, fecha: hoy, titulo: titulo.trim(), fase, operarioId: opId, hecha: false, creadaPor: me.id }));
    setTitulo(""); setForm(false);
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-card shadow-card">
      <Link to="/obras/$id" params={{ id: o.id }} className="flex items-center justify-between border-b p-4">
        <div><h2 className="text-lg font-semibold leading-tight">{o.nombre}</h2><p className="text-sm text-muted-foreground">{o.barrio} · {faseActual(o)}</p></div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>

      <div className="p-4">
        {abiertoAqui ? (
          <div className="mb-3 flex items-end justify-between">
            <div><div className="text-xs text-muted-foreground">Entrada a las {hora(abiertoAqui.entrada)}</div><div className="font-display text-3xl font-bold tabular-nums text-primary">{dur(msFichaje(abiertoAqui, now), true)}</div></div>
            <span className="rounded-full bg-ok-soft px-3 py-1 text-xs font-bold text-ok">En obra</span>
          </div>
        ) : null}
        <button onClick={onFichar} className={cn("flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold active:scale-[0.98]",
          abiertoAqui ? "bg-ink text-ink-foreground" : "bg-primary text-primary-foreground shadow-cta")}>
          {abiertoAqui ? <><LogOut className="h-6 w-6" />Fichar salida</> : <><LogIn className="h-6 w-6" />Fichar entrada</>}
        </button>
        {aviso && (
          <div className="mt-3 rounded-2xl border-2 border-warn/50 bg-warn-soft p-3 text-sm">
            <p className="font-semibold">Ya tienes la entrada fichada en «{aviso}».</p>
            <p className="text-muted-foreground">No puedes estar fichado en dos obras a la vez.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={onCambiar} className="h-11 flex-1 rounded-xl bg-primary px-3 font-semibold text-primary-foreground">Salir de allí y entrar aquí</button>
              <button onClick={onCancelar} className="h-11 rounded-xl bg-card px-4 font-semibold">Cancelar</button>
            </div>
          </div>
        )}
        {hechos.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {hechos.map((f, i) => <li key={i}>{hora(f.entrada)} – {hora(f.salida!)} · <span className="font-semibold text-foreground">{dur(msFichaje(f))}</span></li>)}
          </ul>
        )}
      </div>

      <div className="border-t p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Tareas de hoy</h3>
          <span className="text-sm font-semibold text-muted-foreground">{done}/{tareas.length}</span>
        </div>
        <ul className="space-y-2">
          {tareas.map((t) => {
            const puede = esJefe || t.operarioId === me.id;
            if (editT?.id === t.id) return (
              <li key={t.id} className="space-y-2 rounded-2xl bg-muted p-3">
                <input aria-label="Título de la tarea" value={editT.titulo} onChange={(e) => setEditT({ ...editT, titulo: e.target.value })} className="h-12 w-full rounded-xl border-2 bg-card px-3 outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <select aria-label="Fase de la tarea" value={editT.fase} onChange={(e) => setEditT({ ...editT, fase: e.target.value as FaseTipo })} className="h-12 rounded-xl border-2 bg-card px-2">{FASES.map((f) => <option key={f.tipo} value={f.tipo}>{f.nombre}</option>)}</select>
                  <select aria-label="Operario de la tarea" value={editT.operarioId} onChange={(e) => setEditT({ ...editT, operarioId: e.target.value })} className="h-12 rounded-xl border-2 bg-card px-2">{[...new Set([...o.equipo.operarioIds, editT.operarioId])].map((id) => <option key={id} value={id}>{user(db, id)?.nombre}</option>)}</select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={!editT.titulo.trim()} onClick={() => { if (mutate((d) => { const x = d.tareas.find((y) => y.id === t.id); if (x) { x.titulo = editT.titulo.trim(); x.fase = editT.fase; x.operarioId = editT.operarioId; } })) setEditT(null); }} className="h-12 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-40">Guardar</button>
                  <button onClick={() => setEditT(null)} className="h-12 rounded-xl bg-card px-4 font-semibold">Cancelar</button>
                  <Confirmar onSi={() => { setEditT(null); conDeshacer("Tarea borrada", (d) => { d.tareas = d.tareas.filter((y) => y.id !== t.id); }); }} />
                </div>
              </li>
            );
            return (
              <li key={t.id} className="flex items-center gap-1">
                <button disabled={!puede} onClick={() => toggle(t.id)} className={cn("flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left active:scale-[0.99]", t.hecha ? "border-ok/30 bg-ok-soft" : "bg-background", !puede && "opacity-70")}>
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2", t.hecha ? "border-ok bg-ok text-primary-foreground" : "border-input")}>{t.hecha && <Check className="h-5 w-5" />}</span>
                  <span className="flex-1">
                    <span className={cn("block font-semibold", t.hecha && "text-muted-foreground line-through")}>{t.titulo}</span>
                    <span className="text-xs text-muted-foreground">{nombreFase(t.fase)} · {t.operarioId === me.id ? "Tú" : user(db, t.operarioId)?.nombre}</span>
                  </span>
                </button>
                {esJefe && <button aria-label={`Editar tarea ${t.titulo}`} onClick={() => setEditT({ id: t.id, titulo: t.titulo, fase: t.fase, operarioId: t.operarioId })} className="grid h-14 w-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted"><Pencil className="h-4 w-4" /></button>}
              </li>
            );
          })}
          {tareas.length === 0 && <li className="text-sm text-muted-foreground">Sin tareas para hoy.</li>}
        </ul>
        {esJefe && (form ? (
          <div className="mt-3 space-y-2 rounded-2xl bg-muted p-3">
            <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="¿Qué hay que hacer?" className="h-12 w-full rounded-xl border-2 bg-card px-3 outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-2">
              <select value={fase} onChange={(e) => setFase(e.target.value as FaseTipo)} className="h-12 rounded-xl border-2 bg-card px-2">{FASES.map((f) => <option key={f.tipo} value={f.tipo}>{f.nombre}</option>)}</select>
              <select value={opId} onChange={(e) => setOpId(e.target.value)} className="h-12 rounded-xl border-2 bg-card px-2">{o.equipo.operarioIds.map((id) => <option key={id} value={id}>{user(db, id)?.nombre}</option>)}</select>
            </div>
            <div className="flex gap-2">
              <button onClick={crear} className="h-12 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground">Añadir tarea</button>
              <button onClick={() => setForm(false)} className="h-12 rounded-xl bg-card px-4 font-semibold">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setForm(true)} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed font-semibold text-primary"><Plus className="h-5 w-5" />Nueva tarea</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t p-4">
        <Link to="/parte/$id" params={{ id: o.id }} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-secondary font-semibold text-secondary-foreground">
          <ClipboardList className="h-5 w-5" />{parteHoy ? "Otro parte" : "Parte diario"}
        </Link>
        <Link to="/incidencia/$id" params={{ id: o.id }} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-danger-soft font-semibold text-danger">
          <AlertTriangle className="h-5 w-5" />Incidencia
        </Link>
      </div>
    </section>
  );
}
