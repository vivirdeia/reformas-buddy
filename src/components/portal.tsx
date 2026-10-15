import { calcularEstadoObra, motivoEstado } from "@/lib/analitica";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Phone, MessageCircle, Clock, FileText, Ruler, BadgeCheck, X, CalendarHeart, Sparkles, Heart, Check, MapPin, ChevronLeft, ChevronRight, PenLine, Wallet, Copy } from "lucide-react";
import { Foto } from "@/components/obria";
import { avance, euro, fecha, fechaLarga, nombreFase, user } from "@/lib/store";
import { addDias, hoyISO } from "@/lib/fechas";
import type { DB, Documento, FaseTipo, Obra, OrdenCambio, ParteDiario } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { cambiosAprobados, concepto, euro2, importeHito, pagado, totales, vigente } from "@/lib/economia";
import { cn } from "@/lib/utils";
import { empresaDe, ibanFormato, telHref } from "@/lib/empresa";
import type { Empresa } from "@/lib/types";

const dias = (a: string, b: string) => Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000);

const largo = (f: { inicioPrevisto: string; finPrevisto: string }) => dias(f.inicioPrevisto, f.finPrevisto) + 1;
/** Fin estimado de la fase en curso, nunca en el pasado. */
function finFaseActual(o: Obra) {
  const hoy = hoyISO();
  const cur = o.fases.find((f) => f.estado !== "completada");
  if (!cur) return hoy;
  const pasado = cur.inicioReal ? dias(cur.inicioReal, hoy) : 0;
  return addDias(hoy, Math.max(2, largo(cur) - pasado));
}
function entrega(o: Obra) {
  const i = o.fases.findIndex((f) => f.estado !== "completada");
  if (i < 0) return o.fechaFinPrevista;
  const pend = o.fases.slice(i + 1).reduce((s, f) => s + largo(f), 0);
  const est = addDias(finFaseActual(o), pend);
  return est > o.fechaFinPrevista ? est : o.fechaFinPrevista;
}

function mensaje(o: Obra): { titulo: string; texto: string; tono: "ok" | "suave" | "fin" } {
  const e = calcularEstadoObra(o);
  const manual = o.mensajeCliente?.trim();
  if (manual) return { titulo: e === "terminada" ? "¡Tu reforma está terminada!" : "Novedades de tu reforma", texto: manual, tono: e === "terminada" ? "fin" : "ok" };
  if (e === "terminada") return { titulo: "¡Tu reforma está terminada!", texto: "Ha sido un placer acompañarte. Disfruta de tu nuevo espacio.", tono: "fin" };
  const m = motivoEstado(o);
  if (m === "material") return { titulo: "Estamos recuperando unos días", texto: "Un retraso en la llegada de material nos ha movido el calendario. El equipo está reorganizando trabajos para recortarlo al máximo.", tono: "suave" };
  if (m === "incidencia") return { titulo: "Avanzamos con un pequeño imprevisto", texto: "Hemos encontrado algo que conviene resolver bien antes de seguir. Tu jefe de obra ya lo está gestionando y te mantendrá al día.", tono: "suave" };
  if (m === "cambio") return { titulo: "Ajustamos el calendario a tus cambios", texto: "Los cambios que has pedido necesitan unos días más. Ya los tenemos planificados para que el resultado sea justo como lo quieres.", tono: "suave" };
  if (m === "general") return { titulo: e === "retrasada" ? "Estamos recuperando unos días" : "Vamos ajustando el ritmo", texto: "El calendario se ha movido un poco y el equipo está reorganizando los trabajos para cumplir lo acordado.", tono: "suave" };
  if (avance(o) >= 85) return { titulo: "¡Ya casi está!", texto: "Estamos con los últimos detalles para que puedas estrenar muy pronto.", tono: "ok" };
  if (avance(o) < 10) return { titulo: "Tu reforma ya ha arrancado", texto: "El equipo ha empezado con buen ritmo. Aquí verás cada avance.", tono: "ok" };
  return { titulo: "Tu reforma va según lo previsto", texto: "Todo avanza conforme al calendario que acordamos.", tono: "ok" };
}

const INTRO: Record<FaseTipo, string> = {
  demolicion: "Seguimos preparando el espacio:", fontaneria: "Avanzamos con las instalaciones de agua:", electricidad: "Avanzamos con la instalación eléctrica:",
  alicatado: "Ya se ven los nuevos acabados:", carpinteria: "Tu casa va tomando forma:", pintura: "Llega el color:", limpieza: "Últimos detalles:",
};
const resumen = (p: ParteDiario) => p.resumenCliente ?? (p.fase ? `${INTRO[p.fase]} ${p.trabajos}` : p.trabajos);

function Bloque({ titulo, icono, children }: { titulo: string; icono?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">{icono}{titulo}</h2>
      {children}
    </section>
  );
}

export function PortalCliente({ db, o, nombreCliente }: { db: DB; o: Obra; nombreCliente: string }) {
  const hoy = hoyISO();
  const a = avance(o);
  const fin = entrega(o);
  const quedan = dias(hoy, fin);
  const m = mensaje(o);
  const jefe = user(db, o.equipo.jefeId);
  const [visor, setVisor] = useState<{ fotos: string[]; i: number } | null>(null);
  const [doc, setDoc] = useState<Documento | null>(null);
  const partes = o.partesDiarios.filter((p) => p.visibleCliente).sort((x, y) => y.fecha.localeCompare(x.fecha));
  const aprobadas = o.ordenesCambio.filter((c) => c.estado === "aprobada" && c.firma);
  const diaOc = (c: OrdenCambio) => c.firma!.fecha.slice(0, 10);
  const diasDiario = [...new Set([...partes.map((p) => p.fecha), ...aprobadas.map(diaOc)])].sort((a, b) => b.localeCompare(a));
  const pendientes = o.ordenesCambio.filter((c) => c.estado === "enviada");
  const solicitados = o.pagos.filter((h) => h.estado === "solicitado");
  const vig = vigente(o), pag = pagado(o);
  const tel = jefe?.telefono.replace(/\s/g, "") ?? "";
  const emp = empresaDe(db);

  return (
    <div className="space-y-5">
      <div className="relative -mx-4 -mt-4 h-80 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl">
        <Foto src={o.portada} alt={o.nombre} className="h-full w-full animate-in fade-in zoom-in-105 duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
        <div className="absolute inset-x-5 bottom-6 text-ink-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="font-display text-lg text-ink-foreground/85">Hola, {nombreCliente.split(" ")[0]}</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight">{o.nombre}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-foreground/80"><MapPin className="h-4 w-4" />{o.direccion}, {o.barrio}</p>
        </div>
      </div>

      <section className="-mt-12 relative rounded-3xl bg-card p-5 shadow-card animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex items-center gap-5">
          <Anillo value={a} />
          <div className="flex-1">
            {calcularEstadoObra(o) === "terminada" ? (
              <><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entregada</div><div className="font-display text-2xl font-bold">{fecha(o.fases.at(-1)?.finReal ?? fin)}</div></>
            ) : (
              <>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entrega prevista</div>
                <div className="font-display text-xl font-bold first-letter:uppercase">{fechaLarga(fin)}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground"><CalendarHeart className="h-4 w-4" />{quedan > 0 ? `Faltan ${quedan} días` : "Muy pronto"}</div>
              </>
            )}
          </div>
        </div>
        <div className={cn("mt-5 rounded-2xl p-4", m.tono === "suave" ? "bg-warn-soft" : m.tono === "fin" ? "bg-accent" : "bg-ok-soft")}>
          <div className="flex items-center gap-2 font-display text-lg font-semibold">{m.tono === "fin" ? <Sparkles className="h-5 w-5 text-primary" /> : <Heart className={cn("h-5 w-5", m.tono === "suave" ? "text-warn" : "text-ok")} />}{m.titulo}</div>
          <p className="mt-1 text-sm text-muted-foreground">{m.texto}</p>
        </div>
      </section>

      {pendientes.map((c) => (
        <Link key={c.id} to="/orden/$obraId/$ocId" params={{ obraId: o.id, ocId: c.id }} className="relative block overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-cta animate-in fade-in slide-in-from-bottom-4">
          <span className="absolute right-4 top-4 h-3 w-3 animate-ping rounded-full bg-primary-foreground" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-85"><PenLine className="h-4 w-4" />Necesitamos tu firma</div>
          <div className="mt-1 font-display text-xl font-bold">{c.titulo}</div>
          <div className="mt-1 text-sm opacity-90">{euro2(totales(c).total)} · {c.diasExtra > 0 ? `+${c.diasExtra} días de plazo` : "sin cambio de plazo"}</div>
          <div className="mt-3 inline-flex h-11 items-center gap-1 rounded-xl bg-card px-4 font-semibold text-foreground">Revisar y firmar<ChevronRight className="h-4 w-4" /></div>
        </Link>
      ))}
      {solicitados.map((h) => (
        <section key={h.id} className="rounded-3xl border-2 border-warn/40 bg-warn-soft p-5">
          <div className="flex items-center gap-2 font-display text-lg font-semibold"><Wallet className="h-5 w-5 text-warn" />Tienes un pago pendiente</div>
          <p className="mt-1 text-sm text-muted-foreground">¡Gracias por tu confianza! Hemos alcanzado el hito «{h.concepto.toLowerCase()}». Cuando te venga bien, puedes hacer la transferencia:</p>
          <dl className="mt-3 space-y-2 rounded-2xl bg-card p-4 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Importe</dt><dd className="font-display text-lg font-bold">{euro2(importeHito(o, h))}</dd></div>
            <div><dt className="text-muted-foreground">IBAN</dt><dd className="flex items-center justify-between gap-2 font-mono font-semibold">{ibanFormato(emp.iban)}<button onClick={() => navigator.clipboard?.writeText(emp.iban.replace(/\s/g, ""))} aria-label="Copiar IBAN" className="grid h-10 w-10 place-items-center rounded-lg bg-secondary"><Copy className="h-4 w-4" /></button></dd></div>
            <div><dt className="text-muted-foreground">Titular</dt><dd className="font-semibold">{emp.titular} · CIF {emp.cif}</dd></div>
            <div><dt className="text-muted-foreground">Concepto</dt><dd className="font-mono text-xs font-semibold">{concepto(o, h)}</dd></div>
          </dl>
        </section>
      ))}

      <Bloque titulo="Las fases de tu reforma">
        <ol>
          {o.fases.map((f, i) => {
            const actual = f.estado === "en_curso" || f.estado === "bloqueada";
            const hecha = f.estado === "completada";
            return (
              <li key={f.tipo} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative grid h-10 w-10 place-items-center">
                    {actual && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2s]" />}
                    <span className={cn("relative grid h-10 w-10 place-items-center rounded-full border-2 font-display font-bold",
                      hecha ? "border-ok bg-ok text-primary-foreground" : actual ? "border-primary bg-primary text-primary-foreground shadow-cta" : "border-input bg-card text-muted-foreground")}>
                      {hecha ? <Check className="h-5 w-5" /> : i + 1}
                    </span>
                  </div>
                  {i < o.fases.length - 1 && <div className={cn("my-1 w-1 flex-1 rounded-full", hecha ? "bg-ok" : "bg-border")} />}
                </div>
                <div className={cn("flex-1 pb-5", actual && "-mt-1 rounded-2xl bg-accent p-3 mb-3")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("font-semibold", !hecha && !actual && "text-muted-foreground")}>{nombreFase(f.tipo)}</span>
                    {actual && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">Ahora</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hecha ? `Terminada el ${fecha(f.finReal)}` : actual ? `Empezó el ${fecha(f.inicioReal)} · prevista hasta el ${fecha(finFaseActual(o))}` : `Prevista del ${fecha(f.inicioPrevisto)} al ${fecha(f.finPrevisto)}`}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Bloque>

      {o.antesDespues.length > 0 && (
        <Bloque titulo="Antes y después" icono={<Sparkles className="h-5 w-5 text-primary" />}>
          <div className="space-y-5">{o.antesDespues.map((x) => <Comparador key={x.estancia} {...x} />)}</div>
        </Bloque>
      )}

      <Bloque titulo="Diario de obra">
        {diasDiario.length === 0 ? <p className="text-muted-foreground">Muy pronto verás aquí cada avance de tu reforma.</p> : (
          <div className="space-y-6">
            {diasDiario.map((d) => (
              <div key={d}>
                <div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /><span className="text-sm font-bold text-primary first-letter:uppercase">{fechaLarga(d)}</span></div>
                {aprobadas.filter((c) => diaOc(c) === d).map((c) => (
                  <Link key={c.id} to="/orden/$obraId/$ocId" params={{ obraId: o.id, ocId: c.id }} className="mb-3 ml-0 flex items-center gap-3 rounded-2xl bg-accent p-3">
                    <PenLine className="h-5 w-5 shrink-0 text-accent-foreground" />
                    <span className="flex-1 text-sm"><span className="block font-semibold">Aprobaste un cambio: {c.titulo}</span><span className="text-muted-foreground">{euro2(totales(c).total)}{c.diasExtra > 0 && ` · +${c.diasExtra} días`}</span></span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
                {partes.filter((p) => p.fecha === d).map((p) => (
                  <article key={p.id} className="mb-3 border-l-2 border-border pl-4">
                    {p.fase && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{nombreFase(p.fase)}</span>}
                    <p className="mt-1 leading-relaxed">{resumen(p)}</p>
                    {p.fotos.length > 0 && (
                      <div className="-mr-5 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 pr-5">
                        {p.fotos.map((f, i) => (
                          <button key={i} onClick={() => setVisor({ fotos: p.fotos, i })} className="h-44 w-64 shrink-0 snap-start overflow-hidden rounded-2xl" aria-label="Ver foto">
                            <Foto src={f} alt="Avance de la obra" className="h-full w-full transition hover:scale-105" />
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ))}
          </div>
        )}
      </Bloque>

      <Bloque titulo="Tu inversión" icono={<Wallet className="h-5 w-5 text-primary" />}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Presupuesto inicial</span><span>{euro2(o.presupuesto)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cambios aprobados</span><span>+ {euro2(cambiosAprobados(o))}</span></div>
          <div className="flex justify-between border-t pt-2 font-display text-lg font-bold"><span>Presupuesto vigente</span><span>{euro2(vig)}</span></div>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-ok transition-all duration-1000" style={{ width: `${(pag / vig) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-sm"><span><span className="font-bold text-ok">{euro2(pag)}</span> pagado</span><span><span className="font-bold">{euro2(vig - pag)}</span> pendiente</span></div>
        <ul className="mt-4 space-y-2">
          {o.pagos.map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-2xl bg-muted p-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", h.estado === "pagado" ? "bg-ok text-primary-foreground" : h.estado === "solicitado" ? "bg-warn text-ink" : "bg-card text-muted-foreground")}>
                {h.estado === "pagado" ? <Check className="h-5 w-5" /> : <span className="text-xs font-bold">{h.porcentaje}%</span>}
              </span>
              <span className="flex-1"><span className="block text-sm font-semibold">{h.concepto}</span><span className="text-xs text-muted-foreground">{h.estado === "pagado" ? `Pagado el ${fecha(h.pagadoEn)}` : h.estado === "solicitado" ? "Solicitado · pendiente de transferencia" : "Pendiente"}</span></span>
              <span className="font-semibold">{euro2(importeHito(o, h))}</span>
            </li>
          ))}
        </ul>
      </Bloque>

      <Bloque titulo="Documentos">
        <ul className="divide-y">
          {o.documentos.map((d) => {
            const I = d.tipo === "plano" ? Ruler : d.tipo === "certificado" ? BadgeCheck : FileText;
            return (
              <li key={d.id}>
                <button onClick={() => setDoc(d)} className="flex w-full items-center gap-3 py-3 text-left">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground"><I className="h-6 w-6" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{d.nombre}</span><span className="text-sm text-muted-foreground">{fecha(d.fecha)} · {d.tamano}</span></span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      </Bloque>

      {jefe && (
        <section className="rounded-3xl bg-hero p-5 text-ink-foreground shadow-card">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-foreground/70">Tu jefe de obra</div>
          <div className="mt-3 flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-card font-display text-2xl font-bold text-primary">{jefe.nombre.split(" ").map((x) => x[0]).join("")}</div>
            <div><div className="font-display text-xl font-bold">{jefe.nombre}</div><div className="text-sm text-ink-foreground/80">Estará encantado de resolver tus dudas</div></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href={`tel:+34${tel}`} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card font-semibold text-foreground"><Phone className="h-5 w-5 text-primary" />Llamar</a>
            <a href={`https://wa.me/34${tel}?text=${encodeURIComponent(`Hola ${jefe.nombre.split(" ")[0]}, te escribo por la ${o.nombre.toLowerCase()}.`)}`} target="_blank" rel="noreferrer" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-ok font-semibold text-primary-foreground"><MessageCircle className="h-5 w-5" />WhatsApp</a>
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm text-ink-foreground/80"><Clock className="mt-0.5 h-4 w-4 shrink-0" />{o.horario}</p>
          <p className="mt-2 flex items-start gap-2 text-sm text-ink-foreground/80"><Phone className="mt-0.5 h-4 w-4 shrink-0" />Oficina de {emp.nombreComercial}: <a href={telHref(emp.telefono)} className="font-semibold underline">{emp.telefono}</a></p>
          {o.notasCliente && <p className="mt-3 whitespace-pre-line rounded-2xl bg-ink-foreground/10 p-3 text-sm text-ink-foreground">{o.notasCliente}</p>}
        </section>
      )}

      {visor && <VisorFotos fotos={visor.fotos} inicio={visor.i} onClose={() => setVisor(null)} />}
      {doc && <VistaDoc doc={doc} o={o} nombreCliente={nombreCliente} emp={emp} onClose={() => setDoc(null)} />}
    </div>
  );
}

function Anillo({ value }: { value: number }) {
  const r = 44, c = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(value), 150); return () => clearTimeout(t); }, [value]);
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} strokeWidth="9" className="fill-none stroke-muted" />
        <circle cx="50" cy="50" r={r} strokeWidth="9" strokeLinecap="round" className="fill-none stroke-primary transition-[stroke-dashoffset] duration-[1500ms] ease-out" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><div className="font-display text-3xl font-bold leading-none">{value}%</div><div className="text-[11px] font-semibold text-muted-foreground">completado</div></div>
      </div>
    </div>
  );
}

export function Comparador({ estancia, antes, despues }: { estancia: string; antes: string; despues: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const mover = (x: number) => { const r = ref.current!.getBoundingClientRect(); setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100))); };
  return (
    <div>
      <div className="mb-2 font-semibold">{estancia}</div>
      <div ref={ref} className="relative aspect-[4/3] touch-none select-none overflow-hidden rounded-2xl"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); mover(e.clientX); }}
        onPointerMove={(e) => e.buttons && mover(e.clientX)}>
        <Foto src={despues} alt={`${estancia} después`} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Foto src={antes} alt={`${estancia} antes`} className="h-full w-full grayscale-[30%]" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-bold text-ink-foreground">Antes</span>
        <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Después</span>
        <div className="absolute inset-y-0 w-1 -translate-x-1/2 bg-card" style={{ left: `${pos}%` }}>
          <div className="absolute top-1/2 left-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-card text-primary shadow-card"><ChevronLeft className="-mr-1 h-4 w-4" /><ChevronRight className="-ml-1 h-4 w-4" /></div>
        </div>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={`Comparar ${estancia}`} className="sr-only" />
    </div>
  );
}

export function VisorFotos({ fotos, inicio, onClose }: { fotos: string[]; inicio: number; onClose: () => void }) {
  const [i, setI] = useState(inicio);
  const x0 = useRef<number | null>(null);
  const ir = (d: number) => setI((v) => (v + d + fotos.length) % fotos.length);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") ir(1); if (e.key === "ArrowLeft") ir(-1); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink animate-in fade-in duration-200"
      onTouchStart={(e) => (x0.current = e.touches[0]!.clientX)}
      onTouchEnd={(e) => { if (x0.current === null) return; const dx = e.changedTouches[0]!.clientX - x0.current; if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1); x0.current = null; }}>
      <div className="flex items-center justify-between p-4 text-ink-foreground">
        <span className="font-semibold">{i + 1} / {fotos.length}</span>
        <button onClick={onClose} aria-label="Cerrar" className="grid h-12 w-12 place-items-center rounded-full bg-ink-foreground/15"><X className="h-6 w-6" /></button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-2">
        <Foto key={i} src={fotos[i]!} alt="Foto de la obra" className="max-h-full w-full rounded-xl object-contain animate-in fade-in duration-300" />
        {fotos.length > 1 && <>
          <button onClick={() => ir(-1)} aria-label="Anterior" className="absolute left-3 grid h-12 w-12 place-items-center rounded-full bg-ink/60 text-ink-foreground"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={() => ir(1)} aria-label="Siguiente" className="absolute right-3 grid h-12 w-12 place-items-center rounded-full bg-ink/60 text-ink-foreground"><ChevronRight className="h-6 w-6" /></button>
        </>}
      </div>
      <div className="flex justify-center gap-2 p-6">{fotos.map((_, j) => <span key={j} className={cn("h-2 rounded-full transition-all", j === i ? "w-6 bg-primary" : "w-2 bg-ink-foreground/40")} />)}</div>
    </div>
  );
}

function VistaDoc({ doc, o, nombreCliente, onClose, emp }: { doc: Documento; o: Obra; nombreCliente: string; onClose: () => void; emp: Empresa }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-4 animate-in fade-in" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-5 sm:rounded-3xl animate-in slide-in-from-bottom-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0"><div className="truncate font-semibold">{doc.nombre}</div><div className="text-xs text-muted-foreground">{fecha(doc.fecha)} · {doc.tamano}</div></div>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="rounded-2xl border bg-background p-5 text-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3"><span className="font-display text-lg font-bold">{emp.nombreComercial}</span><span className="text-xs text-muted-foreground">CIF {emp.cif}</span></div>
          {doc.tipo === "presupuesto" && (
            <>
              <p className="text-muted-foreground">Cliente: <span className="text-foreground">{nombreCliente}</span></p>
              <p className="text-muted-foreground">Obra: <span className="text-foreground">{o.nombre}</span></p>
              <ul className="my-4 space-y-1">{o.fases.map((f) => <li key={f.tipo} className="flex justify-between border-b border-dashed py-1"><span>{nombreFase(f.tipo)}</span><Check className="h-4 w-4 text-ok" /></li>)}</ul>
              <div className="flex justify-between font-display text-lg font-bold"><span>Total aprobado (IVA incl.)</span><span>{euro(o.presupuesto)}</span></div>
              <p className="mt-4 text-xs text-muted-foreground">Firmado digitalmente el {fecha(doc.fecha)}.</p>
            </>
          )}
          {doc.tipo === "plano" && (
            <svg viewBox="0 0 200 140" className="w-full stroke-foreground" fill="none" strokeWidth="2">
              <rect x="5" y="5" width="190" height="130" />
              <line x1="90" y1="5" x2="90" y2="80" /><line x1="5" y1="80" x2="140" y2="80" /><line x1="140" y1="80" x2="140" y2="135" /><line x1="140" y1="45" x2="195" y2="45" />
              <g className="fill-muted-foreground stroke-none text-[8px]"><text x="30" y="45">Salón</text><text x="120" y="28">Dormitorio</text><text x="40" y="110">Cocina</text><text x="155" y="95">Baño</text><text x="150" y="68">Dorm. 2</text></g>
            </svg>
          )}
          {doc.tipo === "certificado" && (
            <div className="py-6 text-center">
              <BadgeCheck className="mx-auto h-12 w-12 text-ok" />
              <p className="mt-3 font-display text-lg font-bold">{doc.nombre.replace(".pdf", "")}</p>
              <p className="mt-2 text-muted-foreground">{o.direccion}, {o.barrio} (Madrid)</p>
              <p className="mt-1 text-muted-foreground">Emitido el {fecha(doc.fecha)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
