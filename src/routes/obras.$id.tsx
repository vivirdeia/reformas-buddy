import { AntesDespuesObra, DocumentosObra } from "@/components/documentos";
import { ApuntesObra } from "@/components/admin";
import { calcularEstadoObra, estadoAutomatico } from "@/lib/analitica";
import { ESTADO_LABEL } from "@/lib/store";
import type { EstadoObra } from "@/lib/types";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Phone, MapPin, Euro, CalendarDays, AlertTriangle, FileClock, Check } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, Foto, Progreso, Semaforo } from "@/components/obria";
import { avance, euro, fecha, faseActual, nombreFase, user } from "@/lib/store";
import type { DB, Incidencia, Obra, ParteDiario, Usuario } from "@/lib/types";
import { Confirmar, IncidenciaForm, ParteForm } from "@/components/formularios";
import { FichajesObra, Modal, NotasObra } from "@/components/gestion-contenido";
import { conDeshacer } from "@/lib/deshacer";
import { Galeria } from "@/components/fotos";
import { OrdenesEquipo, PagosEquipo } from "@/components/equipo-economia";
import { totales, vigente } from "@/lib/economia";
import { dur, fechaLarga, msFichaje, mutate } from "@/lib/store";
import { ClipboardList, CheckCircle2, Clock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { EditarObra, FasesObra, MensajeCliente, ZonaPeligro } from "@/components/gestion-obra";

function Gestion({ db, o }: { db: DB; o: Obra }) {
  const [abierto, setAbierto] = useState(false);
  return abierto ? <EditarObra db={db} o={o} onClose={() => setAbierto(false)} /> : (
    <button onClick={() => setAbierto(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 bg-card font-semibold"><Pencil className="h-5 w-5" />Editar datos y equipo</button>
  );
}

export const Route = createFileRoute("/obras/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Ficha de obra · Reformas Arnal" }, { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Datos, fases, equipo y notas de la obra." },
      { property: "og:title", content: "Ficha de obra · Reformas Arnal" },
      { property: "og:description", content: "Seguimiento detallado de la obra de Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ficha,
});

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Ficha() {
  const { id } = Route.useParams();
  return (
    <AppShell back={<Link to="/obras" className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Obras</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === id);
        if (!o || (me.rol === "cliente" && me.obraId !== o.id)) return <p className="py-16 text-center text-muted-foreground">Obra no disponible.</p>;
        const cli = user(db, o.clienteId);
        const jefe = user(db, o.equipo.jefeId);
        const a = avance(o);
        const inc = o.incidencias.filter((i) => i.estado === "abierta");
        const oc = o.ordenesCambio.filter((i) => i.estado === "enviada");
        return (
          <div className="space-y-4">
            <div className="relative -mx-4 -mt-4 h-56 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl">
              <Foto src={o.portada} alt={o.nombre} className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-ink-foreground">
                <Semaforo estado={calcularEstadoObra(o)} />
                <h1 className="mt-2 text-2xl font-bold leading-tight">{o.nombre}</h1>
                <p className="flex items-center gap-1 text-sm text-ink-foreground/80"><MapPin className="h-4 w-4" />{o.direccion}, {o.barrio}</p>
              </div>
            </div>
            {o.archivada && <div className="rounded-2xl bg-secondary p-3 text-sm font-semibold text-secondary-foreground">Obra archivada: no aparece en listados, KPIs ni Gantt.</div>}
            {(me.rol === "gerente" || me.rol === "jefe_obra") && <><Gestion db={db} o={o} /><EstadoControl o={o} /></>}

            <div className="rounded-3xl bg-card p-4 shadow-card">
              <div className="flex items-end justify-between">
                <div><div className="text-xs text-muted-foreground">Fase actual</div><div className="text-lg font-semibold">{faseActual(o)}</div></div>
                <div className="font-display text-3xl font-bold text-primary">{a}%</div>
              </div>
              <div className="mt-2"><Progreso value={a} /></div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-muted p-3"><Euro className="mb-1 h-4 w-4 text-primary" /><div className="text-xs text-muted-foreground">Presupuesto vigente</div><div className="font-display text-lg font-bold">{euro(vigente(o))}</div>{vigente(o) !== o.presupuesto && <div className="text-xs text-muted-foreground">Inicial {euro(o.presupuesto)}</div>}</div>
                <div className="rounded-2xl bg-muted p-3"><CalendarDays className="mb-1 h-4 w-4 text-primary" /><div className="text-xs text-muted-foreground">Inicio → fin previsto</div><div className="font-display text-lg font-bold">{fecha(o.fechaInicio)} → {fecha(o.fechaFinPrevista)}</div></div>
              </div>
            </div>

            {me.rol !== "cliente" && (inc.length > 0 || oc.length > 0) && (
              <div className="space-y-2">
                {inc.map((i) => (
                  <div key={i.id} className="flex gap-3 rounded-2xl border-2 border-danger/30 bg-danger-soft p-4">
                    <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
                    <div><div className="font-semibold text-danger">Incidencia abierta · {fecha(i.fecha)}</div><div className="font-semibold">{i.titulo}</div><p className="text-sm text-muted-foreground">{i.descripcion}</p></div>
                  </div>
                ))}
                {oc.map((c) => (
                  <Link key={c.id} to="/orden/$obraId/$ocId" params={{ obraId: o.id, ocId: c.id }} className="flex gap-3 rounded-2xl border-2 border-warn/40 bg-warn-soft p-4">
                    <FileClock className="h-6 w-6 shrink-0 text-warn" />
                    <div><div className="font-semibold">Orden de cambio pendiente de firma</div><div className="font-semibold">{c.titulo} · {euro(totales(c).total)} · +{c.diasExtra} días</div><p className="text-sm text-muted-foreground">{c.descripcion}</p></div>
                  </Link>
                ))}
              </div>
            )}

            <Card title="Cliente">
              <div className="flex items-center justify-between gap-3">
                <div><div className="font-semibold">{cli?.nombre}</div><div className="text-sm text-muted-foreground">{o.tipo === "local" ? "Local" : "Vivienda"} · {o.m2} m²</div></div>
                {me.rol !== "cliente" && cli && (
                  <a href={`tel:${cli.telefono.replace(/\s/g, "")}`} className="flex h-12 items-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-primary-foreground shadow-cta"><Phone className="h-5 w-5" />Llamar</a>
                )}
              </div>
            </Card>

            <Card title="Fases de la obra"><FasesObra o={o} puede={me.rol === "gerente" || me.rol === "jefe_obra"} /></Card>

            <Card title="Equipo asignado">
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-accent p-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{jefe?.nombre[0]}</div>
                  <div><div className="text-xs font-semibold text-accent-foreground">Jefe de obra</div><div className="font-semibold">{jefe?.nombre}</div></div>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operarios</div>
                <div className="flex flex-wrap gap-2">
                  {o.equipo.operarioIds.map((oid) => { const u = user(db, oid); return <span key={oid} className="rounded-full bg-secondary px-3 py-2 text-sm font-medium">{u?.nombre} <span className="text-muted-foreground">· {u?.oficio}</span></span>; })}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gremios subcontratados</div>
                <ul className="divide-y">
                  {o.equipo.gremioIds.map((gid) => { const g = db.gremios.find((x) => x.id === gid); if (!g) return null; return (
                    <li key={gid} className="flex justify-between py-2 text-sm"><span><span className="font-semibold">{g.oficio}</span> · {g.empresa}</span><span className="text-muted-foreground">{g.contacto}</span></li>
                  ); })}
                </ul>
              </div>
            </Card>

            {me.rol !== "cliente" && <Interno db={db} me={me} o={o} />}
            {(me.rol === "gerente" || me.rol === "jefe_obra") && <MensajeCliente key={o.mensajeCliente ?? ""} o={o} />}

            {(me.rol === "gerente" || me.rol === "jefe_obra") && <ApuntesObra db={db} o={o} />}
            {(me.rol === "gerente" || me.rol === "jefe_obra") && <><DocumentosObra db={db} o={o} /><AntesDespuesObra o={o} /></>}
            {me.rol !== "cliente" && <NotasObra db={db} me={me} o={o} />}
            {me.rol === "gerente" && <ZonaPeligro o={o} />}
          </div>
        );
      }}
    </AppShell>
  );
}

const GRAV = { baja: "bg-ok-soft text-ok", media: "bg-warn-soft text-warn", alta: "bg-danger-soft text-danger" } as const;

function Interno({ db, me, o }: { db: DB; me: Usuario; o: Obra }) {
  const [editParte, setEditParte] = useState<ParteDiario | null>(null);
  const [editInc, setEditInc] = useState<Incidencia | null>(null);
  const ob = (d: DB) => d.obras.find((x) => x.id === o.id)!;
  const horas = db.fichajes.filter((f) => f.obraId === o.id && f.salida).reduce((s, f) => s + msFichaje(f), 0);
  const partes = [...o.partesDiarios].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const dias = [...new Set(partes.map((p) => p.fecha))];
  const puedeResolver = me.rol === "jefe_obra" || me.rol === "gerente";
  const incs = [...o.incidencias].sort((a, b) => (a.estado === b.estado ? b.fecha.localeCompare(a.fecha) : a.estado === "abierta" ? -1 : 1));
  const setEstadoInc = (id: string, e: Incidencia["estado"]) => mutate((d) => { const i = ob(d).incidencias.find((x) => x.id === id); if (i) i.estado = e; });
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Link to="/parte/$id" params={{ id: o.id }} className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground shadow-cta"><ClipboardList className="h-5 w-5" />Nuevo parte</Link>
        <Link to="/vista-cliente/$id" params={{ id: o.id }} className="col-span-3 flex h-12 items-center justify-center gap-2 rounded-2xl border-2 font-semibold"><Eye className="h-5 w-5" />Ver como cliente</Link>
        <Link to="/incidencia/$id" params={{ id: o.id }} className="flex h-14 items-center justify-center gap-1 rounded-2xl bg-danger-soft text-sm font-semibold text-danger"><AlertTriangle className="h-5 w-5" />Incidencia</Link>
      </div>

      <OrdenesEquipo db={db} me={me} o={o} />
      <PagosEquipo me={me} o={o} />

      <Card title="Incidencias">
        {incs.length === 0 ? <p className="text-sm text-muted-foreground">Sin incidencias.</p> : (
          <ul className="space-y-3">
            {incs.map((i) => (
              <li key={i.id} className={cn("rounded-2xl border-2 p-3", i.estado === "abierta" ? "border-danger/30" : "opacity-75")}>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className={cn("rounded-full px-2 py-0.5 uppercase", GRAV[i.gravedad])}>{i.gravedad}</span>
                  {i.estado === "resuelta" ? <span className="flex items-center gap-1 text-ok"><CheckCircle2 className="h-4 w-4" />Resuelta</span> : <span className="text-danger">Abierta</span>}
                  <span className="font-normal text-muted-foreground">{fecha(i.fecha)} · {user(db, i.autorId)?.nombre}</span>
                </div>
                <div className="mt-1 font-semibold">{i.titulo}</div>
                {i.descripcion && <p className="text-sm text-muted-foreground">{i.descripcion}</p>}
                <Galeria fotos={i.fotos} />
                {puedeResolver && i.estado === "abierta" && (
                  <button onClick={() => setEstadoInc(i.id, "resuelta")} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ok-soft font-semibold text-ok"><Check className="h-5 w-5" />Marcar como resuelta</button>
                )}
                {(puedeResolver || i.autorId === me.id) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {puedeResolver && i.estado === "resuelta" && <button onClick={() => setEstadoInc(i.id, "abierta")} className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-muted"><RotateCcw className="h-4 w-4" />Reabrir</button>}
                    <button onClick={() => setEditInc(i)} className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-muted"><Pencil className="h-4 w-4" />Editar</button>
                    {puedeResolver && <Confirmar onSi={() => conDeshacer("Incidencia borrada", (d) => { const x = ob(d); x.incidencias = x.incidencias.filter((y) => y.id !== i.id); })} />}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Partes diarios">
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-muted p-3 text-sm"><Clock className="h-5 w-5 text-primary" />Horas fichadas en la obra: <span className="font-display font-bold">{dur(horas)}</span></div>
        {dias.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay partes.</p> : (
          <div className="space-y-4">
            {dias.map((d) => (
              <div key={d}>
                <div className="mb-2 text-sm font-bold text-primary first-letter:uppercase">{fechaLarga(d)}</div>
                {partes.filter((p) => p.fecha === d).map((p) => (
                  <div key={p.id} className="mb-2 rounded-2xl bg-muted p-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span><span className="font-semibold text-foreground">{user(db, p.autorId)?.nombre}</span>{p.fase && ` · ${nombreFase(p.fase)}`}</span>
                      <span className="flex items-center gap-2 font-bold text-foreground">{!p.visibleCliente && <EyeOff className="h-4 w-4 text-muted-foreground" aria-label="Oculto al cliente" />}{p.horas.toLocaleString("es-ES")} h</span>
                    </div>
                    <p className="mt-1 text-sm">{p.trabajos}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.operarioIds.map((id) => user(db, id)?.nombre).join(", ")}</p>
                    <Galeria fotos={p.fotos} />
                    {(puedeResolver || p.autorId === me.id) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button onClick={() => setEditParte(p)} className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-card"><Pencil className="h-4 w-4" />Editar</button>
                        <Confirmar pregunta="¿Borrar el parte y sus fotos?" onSi={() => conDeshacer("Parte borrado", (d) => { const x = ob(d); x.partesDiarios = x.partesDiarios.filter((y) => y.id !== p.id); })} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
      {puedeResolver && <FichajesObra db={db} me={me} o={o} />}
      <Modal open={!!editParte} onClose={() => setEditParte(null)} titulo="Editar parte diario">{editParte && <ParteForm db={db} me={me} o={o} inicial={editParte} onDone={() => setEditParte(null)} />}</Modal>
      <Modal open={!!editInc} onClose={() => setEditInc(null)} titulo="Editar incidencia">{editInc && <IncidenciaForm o={o} me={me} inicial={editInc} onDone={() => setEditInc(null)} />}</Modal>
    </>
  );
}

function EstadoControl({ o }: { o: Obra }) {
  const auto = estadoAutomatico(o);
  const fijar = (e: EstadoObra | undefined) => mutate((d) => { d.obras.find((x) => x.id === o.id)!.estadoManual = e; });
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-3xl bg-card p-4 shadow-card">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semáforo</div>
        {o.estadoManual
          ? <div className="text-sm"><span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">Estado manual</span> <span className="text-muted-foreground">Automático sería: {ESTADO_LABEL[auto]}</span></div>
          : <div className="text-sm text-muted-foreground">Automático según fases, plazos, incidencias y cambios</div>}
      </div>
      <select aria-label="Forzar estado" value={o.estadoManual ?? ""} onChange={(e) => fijar((e.target.value || undefined) as EstadoObra | undefined)} className="h-11 rounded-xl border bg-background px-3 font-semibold">
        <option value="">Automático ({ESTADO_LABEL[auto]})</option>
        {(Object.keys(ESTADO_LABEL) as EstadoObra[]).map((k) => <option key={k} value={k}>Forzar: {ESTADO_LABEL[k]}</option>)}
      </select>
      {o.estadoManual && <button onClick={() => fijar(undefined)} className="h-11 rounded-xl bg-secondary px-4 font-semibold text-secondary-foreground">Volver a automático</button>}
    </section>
  );
}
