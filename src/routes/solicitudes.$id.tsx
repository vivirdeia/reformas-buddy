import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Mail, Phone, HardHat, MessageCircle, Pencil } from "lucide-react";
import { useState } from "react";
import { Confirmar } from "@/components/formularios";
import { conDeshacer } from "@/lib/deshacer";
import { AppShell, SoloGerente, Seccion } from "@/components/obria";
import { Galeria } from "@/components/fotos";
import { mutate, uid, SOL_LABEL, fecha } from "@/lib/store";
import { FASES } from "@/lib/seed";
import { addDias, hoyISO } from "@/lib/fechas";
import type { EstadoSolicitud, Fase, Solicitud, DB } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SOL_TONO, haceCuanto } from "./solicitudes.index";

export const Route = createFileRoute("/solicitudes/$id")({
  head: () => ({ meta: [{ title: "Detalle de solicitud · Obria" }, { name: "description", content: "Detalle de una solicitud de presupuesto." }, { property: "og:title", content: "Solicitud · Obria" }, { property: "og:description", content: "Detalle de solicitud de presupuesto." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Detalle,
});

const RANGO_MEDIO: Record<string, number> = { "Menos de 15.000 €": 12000, "15.000 – 40.000 €": 28000, "40.000 – 70.000 €": 55000, "Más de 70.000 €": 85000 };
const PORTADA: Record<string, string> = {
  Cocina: "photo-1556909114-f6e7ad7d3136", "Baño": "photo-1584622650111-993a426fbf0a", "Local comercial": "photo-1554118811-1e0d58224f24",
};

function convertir(db: DB, s: Solicitud): string {
  const oid = uid("o"), cid = uid("c");
  const inicio = s.inicio < hoyISO() ? hoyISO() : s.inicio;
  let cur = inicio;
  const fases: Fase[] = FASES.map((f) => { const ip = cur; const fp = addDias(ip, f.dias - 1); cur = addDias(fp, 1); return { tipo: f.tipo, inicioPrevisto: ip, finPrevisto: fp, estado: "pendiente" }; });
  const barrio = (s.zona.split("·")[0] ?? s.zona).trim();
  db.usuarios.push({ id: cid, nombre: s.nombre, rol: "cliente", pin: String(1000 + Math.floor(Math.random() * 9000)), telefono: s.telefono, email: s.email, obraId: oid });
  db.obras.push({
    id: oid, nombre: `${s.tipo} en ${barrio}`, tipo: s.tipo === "Local comercial" ? "local" : "piso", clienteId: cid, direccion: s.zona, barrio, m2: s.m2,
    presupuesto: RANGO_MEDIO[s.rango] ?? Math.round(s.m2 * 550), fechaInicio: inicio, fechaFinPrevista: addDias(cur, -1), estado: "en_plazo",
    portada: s.fotos[0] ?? `https://images.unsplash.com/${PORTADA[s.tipo] ?? "photo-1600210492486-724fe5c67fb0"}?auto=format&fit=crop&w=1200&q=70`,
    fases, equipo: { jefeId: "u-jefe1", operarioIds: [], gremioIds: [] },
    notas: [{ id: uid("n"), autorId: "u-gerente", fecha: hoyISO(), texto: `Obra creada desde solicitud web.${s.comentario ? ` Cliente: «${s.comentario}»` : ""}` }],
    incidencias: [], ordenesCambio: [], partesDiarios: [], hitos: [], documentos: [], antesDespues: [], costes: { materiales: 0, gremios: 0 },
    horario: "Lunes a viernes de 8:00 a 17:00 · Trabajos ruidosos de 9:00 a 14:00",
    pagos: [["A la firma", 30], ["Fin de instalaciones", 30], ["Alicatado y carpintería", 30], ["A la entrega de llaves", 10]].map(([c, p], i) => ({ id: `h${i + 1}`, concepto: c as string, porcentaje: p as number, estado: "pendiente" as const })),
  });
  const x = db.solicitudes.find((y) => y.id === s.id)!;
  x.estado = "ganada"; x.obraId = oid;
  return oid;
}

function Detalle() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  return (
    <AppShell back={<Link to="/solicitudes" className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Solicitudes</Link>}>
      {({ db, me }) => {
        const s = db.solicitudes.find((x) => x.id === id);
        if (!s) return <p className="text-muted-foreground">Solicitud no encontrada.</p>;
        const upd = (fn: (x: Solicitud) => void) => mutate((d) => { const x = d.solicitudes.find((y) => y.id === id); if (x) fn(x); });
        const tel = s.telefono.replace(/\D/g, "");
        return (
          <SoloGerente me={me}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", SOL_TONO[s.estado])}>{SOL_LABEL[s.estado]}</span>
                  <h1 className="mt-2 text-2xl font-bold md:text-3xl">{s.nombre}</h1>
                  <p className="text-muted-foreground">{s.tipo} · recibida {haceCuanto(s.fecha).toLowerCase()}</p>
                </div>
                <Seccion titulo="Datos de la reforma">
                  <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-card p-5 shadow-card">
                    {[["Tipo", s.tipo], ["Superficie", `${s.m2} m²`], ["Zona", s.zona], ["Inicio deseado", fecha(s.inicio)], ["Presupuesto", s.rango], ["Fotos", String(s.fotos.length)]].map(([k, v]) => (
                      <div key={k}><dt className="text-xs font-semibold uppercase text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
                    ))}
                    {s.comentario && <div className="col-span-2"><dt className="text-xs font-semibold uppercase text-muted-foreground">Comentario</dt><dd>{s.comentario}</dd></div>}
                  </dl>
                </Seccion>
                {s.fotos.length > 0 && <Seccion titulo="Fotos del estado actual"><Galeria fotos={s.fotos} /></Seccion>}
                <Seccion titulo="Notas internas">
                  <textarea defaultValue={s.notas ?? ""} maxLength={1000} onBlur={(e) => upd((x) => { x.notas = e.target.value.trim(); })} rows={3} placeholder="Ej. Llamada hecha, visita el jueves…" className="w-full rounded-2xl border-2 bg-card p-4 outline-none focus:border-primary" />
                </Seccion>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <div className="mb-3 font-semibold">Contacto</div>
                  <div className="grid gap-2">
                    <a href={`tel:${tel}`} className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-4 font-semibold"><Phone className="h-5 w-5 text-primary" />{s.telefono}</a>
                    <a href={`https://wa.me/34${tel.slice(-9)}`} target="_blank" rel="noreferrer" className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-4 font-semibold"><MessageCircle className="h-5 w-5 text-primary" />WhatsApp</a>
                    <a href={`mailto:${encodeURIComponent(s.email)}`} className="flex h-12 items-center gap-2 truncate rounded-xl bg-secondary px-4 font-semibold"><Mail className="h-5 w-5 shrink-0 text-primary" />{s.email}</a>
                  </div>
                </div>
                <EditarSolicitud s={s} />
                <div className="rounded-2xl bg-card p-5 shadow-card">
                  <div className="mb-3 font-semibold">Estado</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(SOL_LABEL) as EstadoSolicitud[]).map((k) => (
                      <button key={k} onClick={() => upd((x) => { x.estado = k; })} className={cn("h-11 rounded-xl border-2 text-sm font-semibold", s.estado === k ? "border-primary bg-accent" : "bg-background")}>{SOL_LABEL[k]}</button>
                    ))}
                  </div>
                </div>
                {s.obraId && db.obras.some((o) => o.id === s.obraId)
                  ? <Link to="/obras/$id" params={{ id: s.obraId }} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-ok-soft font-semibold text-ok"><HardHat className="h-5 w-5" />Ver obra creada</Link>
                  : <button onClick={() => { let oid = ""; if (mutate((d) => { oid = convertir(d, s); })) nav({ to: "/obras/$id", params: { id: oid } }); }} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground shadow-cta"><HardHat className="h-5 w-5" />Convertir en obra</button>}
              </div>
            </div>
          </SoloGerente>
        );
      }}
    </AppShell>
  );
}

const TIPOS_SOL = ["Reforma integral de piso", "Cocina", "Baño", "Local comercial"];
const RANGOS_SOL = ["Menos de 15.000 €", "15.000 – 40.000 €", "40.000 – 70.000 €", "Más de 70.000 €", "Aún no lo sé"];
const inpS = "h-12 w-full rounded-xl border-2 bg-background px-3 outline-none focus:border-primary";

function EditarSolicitud({ s }: { s: Solicitud }) {
  const nav = useNavigate();
  const [v, setV] = useState<Solicitud | null>(null);
  const err = v && (!v.nombre.trim() ? "Falta el nombre." : !/^[\d\s+]{9,}$/.test(v.telefono) ? "Teléfono no válido." : !/^\S+@\S+\.\S+$/.test(v.email) ? "Email no válido." : v.m2 <= 0 ? "Indica los m²." : "");
  const guardar = () => { if (v && !err && mutate((d) => { const i = d.solicitudes.findIndex((x) => x.id === s.id); if (i >= 0) d.solicitudes[i] = { ...v, nombre: v.nombre.trim(), comentario: v.comentario?.trim() || undefined }; })) setV(null); };
  const borrar = () => { if (conDeshacer("Solicitud borrada", (d) => { d.solicitudes = d.solicitudes.filter((x) => x.id !== s.id); })) nav({ to: "/solicitudes" }); };
  const f = (k: keyof Solicitud, l: string, type = "text") => (
    <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{l}</span>
      <input type={type} className={inpS} value={String(v![k] ?? "")} onChange={(e) => setV({ ...v!, [k]: type === "number" ? Number(e.target.value) : e.target.value })} /></label>
  );
  if (!v) return (
    <div className="flex flex-wrap gap-2 rounded-2xl bg-card p-3 shadow-card">
      <button onClick={() => setV(structuredClone(s))} className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl border-2 font-semibold"><Pencil className="h-4 w-4" />Editar datos</button>
      <Confirmar pregunta="¿Borrar la solicitud?" onSi={borrar} />
    </div>
  );
  return (
    <div className="space-y-3 rounded-2xl border-2 border-primary/40 bg-card p-5 shadow-card">
      <div className="font-semibold">Editar solicitud</div>
      {f("nombre", "Nombre")}{f("telefono", "Teléfono", "tel")}{f("email", "Email", "email")}
      <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Tipo</span><select className={inpS} value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value })}>{[...new Set([...TIPOS_SOL, v.tipo])].map((t) => <option key={t}>{t}</option>)}</select></label>
      {f("m2", "Superficie (m²)", "number")}{f("zona", "Barrio o código postal")}{f("inicio", "Inicio deseado", "date")}
      <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Presupuesto</span><select className={inpS} value={v.rango} onChange={(e) => setV({ ...v, rango: e.target.value })}>{[...new Set([...RANGOS_SOL, v.rango])].map((t) => <option key={t}>{t}</option>)}</select></label>
      <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Comentario</span><textarea rows={3} className={cn(inpS, "h-auto py-2")} value={v.comentario ?? ""} onChange={(e) => setV({ ...v, comentario: e.target.value })} /></label>
      {err && <p className="text-sm font-semibold text-danger">{err}</p>}
      <div className="flex gap-2"><button onClick={() => setV(null)} className="h-12 flex-1 rounded-xl border-2 font-semibold">Cancelar</button><button disabled={!!err} onClick={guardar} className="h-12 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-40">Guardar</button></div>
    </div>
  );
}
