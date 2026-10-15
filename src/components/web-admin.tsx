import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Globe, Plus, RotateCcw, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { mutate } from "@/lib/store";
import { ICONO_LABEL, WEB_DEFECTO, type Icono } from "@/lib/web";
import type { BloqueTexto, DB, Web } from "@/lib/types";
import { cn } from "@/lib/utils";

const inp = "h-11 w-full rounded-xl border-2 bg-background px-3 text-base outline-none focus:border-primary";
const area = "min-h-20 w-full rounded-xl border-2 bg-background px-3 py-2 text-base outline-none focus:border-primary";
const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-40";
const mini = "grid h-9 w-9 place-items-center rounded-lg hover:bg-muted disabled:opacity-30";

function T({ l, v, on, largo }: { l: string; v: string; on: (x: string) => void; largo?: boolean }) {
  return <label className="block text-sm font-semibold">{l}{largo
    ? <textarea aria-label={l} className={cn(area, "mt-1")} value={v} onChange={(e) => on(e.target.value)} />
    : <input aria-label={l} className={cn(inp, "mt-1")} value={v} onChange={(e) => on(e.target.value)} />}</label>;
}

function Plegable({ titulo, children, abierto }: { titulo: string; children: ReactNode; abierto?: boolean }) {
  const [o, setO] = useState(!!abierto);
  return (
    <div className="rounded-2xl border-2">
      <button type="button" onClick={() => setO(!o)} aria-expanded={o} className="flex h-14 w-full items-center justify-between px-4 font-semibold">{titulo}<ChevronDown className={cn("h-5 w-5 transition", o && "rotate-180")} /></button>
      {o && <div className="space-y-3 border-t p-4">{children}</div>}
    </div>
  );
}

/** Lista ordenable genérica: añadir, quitar y mover. */
function Lista<X>({ items, on, nuevo, render, nombre }: { items: X[]; on: (l: X[]) => void; nuevo: X; render: (x: X, set: (p: Partial<X>) => void) => ReactNode; nombre: string }) {
  const mover = (i: number, d: number) => { const l = [...items]; [l[i], l[i + d]] = [l[i + d]!, l[i]!]; on(l); };
  return (
    <div className="space-y-3">
      {items.map((x, i) => (
        <div key={i} className="rounded-xl bg-muted/60 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">{nombre} {i + 1}
            <span className="flex">
              <button type="button" className={mini} disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" className={mini} disabled={i === items.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" className={cn(mini, "text-danger")} onClick={() => on(items.filter((_, j) => j !== i))} aria-label={`Quitar ${nombre} ${i + 1}`}><X className="h-4 w-4" /></button>
            </span>
          </div>
          <div className="space-y-2">{render(x, (p) => on(items.map((y, j) => (j === i ? { ...y, ...p } : y))))}</div>
        </div>
      ))}
      <button type="button" onClick={() => on([...items, structuredClone(nuevo)])} className="inline-flex h-11 items-center gap-1 rounded-xl border-2 border-dashed px-3 text-sm font-semibold"><Plus className="h-4 w-4" />Añadir {nombre.toLowerCase()}</button>
    </div>
  );
}

const bloque = (x: BloqueTexto, s: (p: Partial<BloqueTexto>) => void) => (
  <>
    <label className="block text-sm font-semibold">Icono<select aria-label="Icono" className={cn(inp, "mt-1")} value={x.icono} onChange={(e) => s({ icono: e.target.value })}>
      {(Object.keys(ICONO_LABEL) as Icono[]).map((k) => <option key={k} value={k}>{ICONO_LABEL[k]}</option>)}</select></label>
    <T l="Título" v={x.t} on={(t) => s({ t })} />
    <T l="Texto" v={x.d} on={(d) => s({ d })} largo />
  </>
);
const NB: BloqueTexto = { icono: "home", t: "", d: "" };

export function WebAdmin({ db }: { db: DB }) {
  const [w, setW] = useState<Web>(() => structuredClone(db.web));
  const [ok, setOk] = useState(false);
  const up = (f: (x: Web) => void) => { setOk(false); setW((x) => { const c = structuredClone(x); f(c); return c; }); };
  const pares = db.obras.flatMap((o) => o.antesDespues.map((a, i) => ({ o, a, i })));
  const togPar = (oid: string, i: number) => mutate((d) => { const a = d.obras.find((o) => o.id === oid)!.antesDespues[i]; if (a) a.enLanding = !a.enLanding; });
  const guardar = () => { if (mutate((d) => { d.web = w; })) setOk(true); };
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold"><Globe className="h-5 w-5 text-primary" />Web</h2>
        <Link to="/" target="_blank" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">Ver la web</Link>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Textos de la página pública. El teléfono, la dirección y las redes salen de «Datos de la empresa».</p>
      <div className="space-y-3">
        <Plegable titulo="Portada" abierto>
          <T l="Insignia" v={w.hero.insignia} on={(v) => up((x) => { x.hero.insignia = v; })} />
          <T l="Titular" v={w.hero.titulo} on={(v) => up((x) => { x.hero.titulo = v; })} />
          <T l="Titular destacado" v={w.hero.acento} on={(v) => up((x) => { x.hero.acento = v; })} />
          <T l="Texto de portada" v={w.hero.texto} on={(v) => up((x) => { x.hero.texto = v; })} largo />
          <Lista nombre="Ventaja" items={w.hero.ventajas} nuevo="" on={(l) => up((x) => { x.hero.ventajas = l; })} render={(v, s) => <input aria-label="Ventaja" className={inp} value={v} onChange={(e) => s(e.target.value as never)} />} />
        </Plegable>
        <Plegable titulo="Lo que nos diferencia">
          <T l="Título" v={w.diferencial.titulo} on={(v) => up((x) => { x.diferencial.titulo = v; })} />
          <T l="Texto" v={w.diferencial.texto} on={(v) => up((x) => { x.diferencial.texto = v; })} largo />
          <Lista nombre="Punto" items={w.diferencial.puntos} nuevo={NB} on={(l) => up((x) => { x.diferencial.puntos = l; })} render={bloque} />
        </Plegable>
        <Plegable titulo="Servicios">
          <T l="Título de servicios" v={w.servicios.titulo} on={(v) => up((x) => { x.servicios.titulo = v; })} />
          <T l="Subtítulo de servicios" v={w.servicios.texto} on={(v) => up((x) => { x.servicios.texto = v; })} />
          <Lista nombre="Servicio" items={w.servicios.items} nuevo={NB} on={(l) => up((x) => { x.servicios.items = l; })} render={bloque} />
        </Plegable>
        <Plegable titulo="Galería de obras">
          <T l="Título de galería" v={w.galeria.titulo} on={(v) => up((x) => { x.galeria.titulo = v; })} />
          <T l="Subtítulo de galería" v={w.galeria.texto} on={(v) => up((x) => { x.galeria.texto = v; })} />
          <p className="text-sm font-semibold">Fotos que aparecen (se guarda al momento)</p>
          {pares.length === 0 && <p className="text-sm text-muted-foreground">Ninguna obra tiene antes y después. Añádelos desde la ficha de obra.</p>}
          <ul className="space-y-1">{pares.map(({ o, a, i }) => (
            <li key={o.id + i}><label className="flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-muted">
              <input type="checkbox" className="h-5 w-5 accent-primary" checked={!!a.enLanding} onChange={() => togPar(o.id, i)} />
              <img src={a.despues} alt="" className="h-9 w-12 rounded object-cover" /><span className="text-sm"><b>{o.nombre}</b> · {a.estancia}</span></label></li>))}</ul>
          <label className="flex items-center gap-3 rounded-xl bg-muted p-3 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-primary" checked={w.galeria.mostrarEjemplos} onChange={(e) => up((x) => { x.galeria.mostrarEjemplos = e.target.checked; })} />Mostrar también las 3 obras de ejemplo</label>
        </Plegable>
        <Plegable titulo="Cómo trabajamos">
          <T l="Título de pasos" v={w.pasos.titulo} on={(v) => up((x) => { x.pasos.titulo = v; })} />
          <Lista nombre="Paso" items={w.pasos.items} nuevo={NB} on={(l) => up((x) => { x.pasos.items = l; })} render={bloque} />
        </Plegable>
        <Plegable titulo="Cifras de confianza">
          <Lista nombre="Cifra" items={w.cifras} nuevo={{ v: "", l: "" }} on={(l) => up((x) => { x.cifras = l; })} render={(c, s) => <div className="grid grid-cols-3 gap-2"><input aria-label="Valor" className={inp} value={c.v} onChange={(e) => s({ v: e.target.value })} /><input aria-label="Descripción de la cifra" className={cn(inp, "col-span-2")} value={c.l} onChange={(e) => s({ l: e.target.value })} /></div>} />
        </Plegable>
        <Plegable titulo="Testimonios">
          <Lista nombre="Testimonio" items={w.testimonios} nuevo={{ n: "", b: "", t: "", q: "" }} on={(l) => up((x) => { x.testimonios = l; })} render={(t, s) => <>
            <div className="grid gap-2 sm:grid-cols-3"><T l="Nombre" v={t.n} on={(n) => s({ n })} /><T l="Barrio" v={t.b} on={(b) => s({ b })} /><T l="Tipo de obra" v={t.t} on={(v) => s({ t: v })} /></div>
            <T l="Opinión" v={t.q} on={(q) => s({ q })} largo /></>} />
        </Plegable>
        <Plegable titulo="Preguntas frecuentes">
          <Lista nombre="Pregunta" items={w.faq} nuevo={{ q: "", a: "" }} on={(l) => up((x) => { x.faq = l; })} render={(f, s) => <><T l="Pregunta" v={f.q} on={(q) => s({ q })} /><T l="Respuesta" v={f.a} on={(a) => s({ a })} largo /></>} />
        </Plegable>
        <Plegable titulo="Llamada final y pie">
          <T l="Título final" v={w.cta.titulo} on={(v) => up((x) => { x.cta.titulo = v; })} />
          <T l="Texto final" v={w.cta.texto} on={(v) => up((x) => { x.cta.texto = v; })} largo />
          <T l="Texto del pie" v={w.pie} on={(v) => up((x) => { x.pie = v; })} largo />
        </Plegable>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={guardar} className={btn}>Guardar web</button>
        <button onClick={() => up((x) => { Object.assign(x, structuredClone(WEB_DEFECTO)); })} className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"><RotateCcw className="h-4 w-4" />Volver a los textos originales</button>
        {ok && <span className="text-sm font-semibold text-ok">Guardado. La web ya muestra los cambios.</span>}
      </div>
    </section>
  );
}
