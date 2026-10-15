import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, CalendarPlus, PenLine, X, FileText, CheckCircle2, Send, Pencil, Trash2, Clock } from "lucide-react";
import { AppShell } from "@/components/obria";
import { Galeria } from "@/components/fotos";
import { FirmaPad } from "@/components/firma";
import { ESTADO_OC, ESTADO_OC_CLS, euro2, totales, vigente } from "@/lib/economia";
import { addDias } from "@/lib/fechas";
import { fecha, fechaLarga, mutate, user } from "@/lib/store";
import type { DB, Obra, OrdenCambio, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orden/$obraId/$ocId")({
  head: () => ({
    meta: [
      { title: "Orden de cambio · Obria" },
      { name: "description", content: "Detalle de la orden de cambio: qué cambia, cuánto cuesta y cuántos días añade." },
      { property: "og:title", content: "Orden de cambio · Obria" },
      { property: "og:description", content: "Revisa y firma la orden de cambio de tu reforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { obraId, ocId } = Route.useParams();
  return (
    <AppShell back={<Volver obraId={obraId} />}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === obraId);
        const oc = o?.ordenesCambio.find((x) => x.id === ocId);
        if (!o || !oc || (me.rol === "cliente" && (me.obraId !== o.id || oc.estado === "borrador"))) return <p className="py-16 text-center text-muted-foreground">Orden no disponible.</p>;
        return <Detalle db={db} me={me} o={o} oc={oc} />;
      }}
    </AppShell>
  );
}

function Volver({ obraId }: { obraId: string }) {
  return <button onClick={() => history.back()} className="flex h-11 items-center gap-1 font-semibold" aria-label={`Volver a ${obraId}`}><ChevronLeft className="h-6 w-6" />Volver</button>;
}

function Detalle({ db, me, o, oc }: { db: DB; me: Usuario; o: Obra; oc: OrdenCambio }) {
  const nav = useNavigate();
  const t = totales(oc);
  const esCliente = me.rol === "cliente";
  const equipo = me.rol === "jefe_obra" || me.rol === "gerente";
  const [modo, setModo] = useState<"firmar" | "rechazar" | null>(null);
  const [firma, setFirma] = useState<string | null>(null);
  const cli = user(db, o.clienteId);
  const [nombre, setNombre] = useState(cli?.nombre ?? "");
  const [motivo, setMotivo] = useState("");
  const [hecho, setHecho] = useState(false);
  const actual = vigente(o);
  const nuevo = oc.estado === "aprobada" ? actual : actual + t.total;
  const finNuevo = oc.estado === "aprobada" ? o.fechaFinPrevista : addDias(o.fechaFinPrevista, oc.diasExtra);

  const upd = (fn: (x: OrdenCambio, ob: Obra) => void) => mutate((d) => { const ob = d.obras.find((x) => x.id === o.id)!; fn(ob.ordenesCambio.find((x) => x.id === oc.id)!, ob); });
  const aprobar = () => {
    if (!firma || !nombre.trim()) return;
    const ahora = new Date().toISOString();
    if (upd((x, ob) => { x.estado = "aprobada"; x.respondidaEn = ahora; x.firma = { imagen: firma, nombre: nombre.trim(), fecha: ahora }; ob.fechaFinPrevista = addDias(ob.fechaFinPrevista, x.diasExtra); })) { setModo(null); setHecho(true); }
  };
  const rechazar = () => { if (upd((x) => { x.estado = "rechazada"; x.respondidaEn = new Date().toISOString(); x.motivoRechazo = motivo.trim() || undefined; })) setModo(null); };

  return (
    <div className="space-y-4">
      {hecho && (
        <div className="rounded-3xl bg-ok-soft p-5 text-center animate-in zoom-in-95 fade-in duration-500">
          <CheckCircle2 className="mx-auto h-14 w-14 text-ok animate-in zoom-in duration-700" />
          <div className="mt-2 font-display text-xl font-bold">¡Cambio aprobado!</div>
          <p className="text-sm text-muted-foreground">Gracias, {nombre.split(" ")[0]}. Ya lo hemos incorporado a tu reforma y tu jefe de obra lo tiene en el calendario.</p>
          <button onClick={() => nav({ to: "/mi-reforma" })} className="mt-3 h-12 rounded-xl bg-card px-5 font-semibold">Volver a mi reforma</button>
        </div>
      )}

      <div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", ESTADO_OC_CLS[oc.estado])}>{ESTADO_OC[oc.estado]}</span>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{oc.titulo}</h1>
        <p className="text-muted-foreground">{oc.estancia} · {o.nombre}</p>
      </div>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="mb-2 font-display text-lg font-semibold">Qué cambia</h2>
        <p className="leading-relaxed">{oc.descripcion}</p>
        <Galeria fotos={oc.fotos} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-primary p-4 text-primary-foreground shadow-cta">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Cuesta</div>
          <div className="font-display text-2xl font-bold">{euro2(t.total)}</div>
          <div className="text-xs opacity-80">IVA incluido</div>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><CalendarPlus className="h-4 w-4" />Plazo</div>
          <div className="font-display text-2xl font-bold">{oc.diasExtra === 0 ? "Sin cambios" : `+${oc.diasExtra} ${oc.diasExtra === 1 ? "día" : "días"}`}</div>
          <div className="text-xs text-muted-foreground first-letter:uppercase">Entrega {fechaLarga(finNuevo)}</div>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        <h2 className="mb-3 font-display text-lg font-semibold">Desglose</h2>
        <ul className="divide-y text-sm">
          {oc.partidas.map((p, i) => (
            <li key={i} className="flex justify-between gap-3 py-2"><span><span className="block font-medium">{p.concepto}</span><span className="text-muted-foreground">{p.cantidad.toLocaleString("es-ES")} × {euro2(p.precio)}</span></span><span className="font-semibold">{euro2(p.cantidad * p.precio)}</span></li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 rounded-2xl bg-muted p-3 text-sm">
          <div className="flex justify-between"><span>Base imponible</span><span>{euro2(t.base)}</span></div>
          <div className="flex justify-between"><span>IVA (21%)</span><span>{euro2(t.iva)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>{euro2(t.total)}</span></div>
        </div>
      </section>

      {oc.estado !== "rechazada" && (
        <section className="rounded-3xl bg-accent p-5">
          <h2 className="mb-2 font-display text-lg font-semibold text-accent-foreground">Tu presupuesto {oc.estado === "aprobada" ? "con este cambio" : "si lo apruebas"}</h2>
          <div className="flex items-center justify-between text-sm"><span>Presupuesto {oc.estado === "aprobada" ? "anterior" : "actual"}</span><span>{euro2(oc.estado === "aprobada" ? actual - t.total : actual)}</span></div>
          <div className="flex items-center justify-between text-sm"><span>Este cambio</span><span>+ {euro2(t.total)}</span></div>
          <div className="mt-2 flex items-center justify-between border-t border-accent-foreground/20 pt-2 font-display text-xl font-bold"><span>Nuevo total</span><span>{euro2(nuevo)}</span></div>
        </section>
      )}

      {oc.estado === "aprobada" && oc.firma && (
        <section className="rounded-3xl bg-card p-5 shadow-card">
          <h2 className="mb-2 font-display text-lg font-semibold">Firma</h2>
          <img src={oc.firma.imagen} alt="Firma del cliente" className="h-24 rounded-xl bg-background object-contain p-2" />
          <div className="mt-1 font-semibold">{oc.firma.nombre}</div>
          <div className="text-sm text-muted-foreground">{new Date(oc.firma.fecha).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}</div>
          <Link to="/justificante/$obraId/$ocId" params={{ obraId: o.id, ocId: oc.id }} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary font-semibold"><FileText className="h-5 w-5" />Ver justificante</Link>
        </section>
      )}
      {oc.estado === "rechazada" && (
        <section className="rounded-3xl bg-danger-soft p-5"><div className="font-semibold text-danger">Rechazada el {fecha(oc.respondidaEn?.slice(0, 10))}</div>{oc.motivoRechazo && <p className="mt-1 text-sm">«{oc.motivoRechazo}»</p>}</section>
      )}

      {esCliente && oc.estado === "enviada" && !hecho && (
        <div className="sticky bottom-24 z-10 grid grid-cols-3 gap-3">
          <button onClick={() => setModo("rechazar")} className="h-16 rounded-2xl bg-card font-bold shadow-card">Rechazar</button>
          <button onClick={() => setModo("firmar")} className="col-span-2 flex h-16 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-cta"><PenLine className="h-5 w-5" />Aprobar y firmar</button>
        </div>
      )}
      {!esCliente && oc.estado === "enviada" && <p className="flex items-center gap-2 rounded-2xl bg-warn-soft p-4 text-sm font-semibold"><Clock className="h-5 w-5 text-warn" />Enviada el {fecha(oc.enviadaEn?.slice(0, 10))}. Esperando la firma del cliente.</p>}
      {equipo && oc.estado === "borrador" && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => { if (confirm("¿Eliminar este borrador?") && mutate((d) => { const ob = d.obras.find((x) => x.id === o.id)!; ob.ordenesCambio = ob.ordenesCambio.filter((x) => x.id !== oc.id); })) nav({ to: "/obras/$id", params: { id: o.id } }); }} className="flex h-14 items-center justify-center gap-1 rounded-2xl bg-danger-soft font-semibold text-danger"><Trash2 className="h-5 w-5" />Borrar</button>
          <Link to="/orden-nueva/$id" params={{ id: o.id }} search={{ oc: oc.id }} className="flex h-14 items-center justify-center gap-1 rounded-2xl bg-secondary font-semibold"><Pencil className="h-5 w-5" />Editar</Link>
          <button onClick={() => upd((x) => { x.estado = "enviada"; x.enviadaEn = new Date().toISOString(); })} className="flex h-14 items-center justify-center gap-1 rounded-2xl bg-primary font-semibold text-primary-foreground"><Send className="h-5 w-5" />Enviar</button>
        </div>
      )}

      {modo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 sm:items-center sm:p-4 animate-in fade-in" onClick={() => setModo(null)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-card p-5 pb-8 sm:rounded-3xl animate-in slide-in-from-bottom-10 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">{modo === "firmar" ? "Aprobar y firmar" : "Rechazar cambio"}</h2><button onClick={() => setModo(null)} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full bg-secondary"><X className="h-5 w-5" /></button></div>
            {modo === "firmar" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Apruebas «{oc.titulo}» por <span className="font-bold text-foreground">{euro2(t.total)}</span>{oc.diasExtra > 0 && <> y {oc.diasExtra} días más de plazo</>}.</p>
                <FirmaPad onChange={setFirma} />
                <label className="block text-sm font-semibold">Nombre completo<input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 h-14 w-full rounded-2xl border-2 bg-background px-4 text-base outline-none focus:border-primary" /></label>
                <p className="text-xs text-muted-foreground">Fecha y hora: {new Date().toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}</p>
                <button disabled={!firma || !nombre.trim()} onClick={aprobar} className="h-16 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-cta disabled:opacity-40">Firmar y aprobar</button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Motivo (opcional)" className="w-full rounded-2xl border-2 bg-background p-4 text-base outline-none focus:border-primary" />
                <button onClick={rechazar} className="h-16 w-full rounded-2xl bg-danger text-lg font-bold text-destructive-foreground">Rechazar cambio</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
