import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Plus, Trash2, Check } from "lucide-react";
import { AppShell, SoloGerente } from "@/components/obria";
import { CamposDatos, Campo, SelectorEquipo, inp, btn } from "@/components/gestion-obra";
import { mutate, uid, euro, fecha, nombreFase } from "@/lib/store";
import { FASES } from "@/lib/seed";
import { hoyISO } from "@/lib/fechas";
import { fasesDesde, pinNuevo, planPagosDefecto, PORTADA_DEFECTO, recalcularFechas } from "@/lib/obras";
import type { DB, FaseTipo, HitoPago, Obra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/obras/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva obra · Obria" },
      { name: "description", content: "Alta de una obra nueva en Reformas Arnal: datos, cliente, equipo, fases y pagos." },
      { property: "og:title", content: "Nueva obra · Obria" },
      { property: "og:description", content: "Alta guiada de una obra nueva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell back={<Link to="/obras" className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Obras</Link>}>
      {({ db, me }) => <SoloGerente me={me}><Asistente db={db} me={me} /></SoloGerente>}
    </AppShell>
  ),
});

const PASOS = ["Datos", "Cliente", "Equipo", "Fases", "Pagos"];

function Asistente({ db, me }: { db: DB; me: Usuario }) {
  const nav = useNavigate();
  const [paso, setPaso] = useState(0);
  const [v, setV] = useState({ nombre: "", tipo: "piso" as Obra["tipo"], direccion: "", barrio: "", m2: 0, presupuesto: 0, fechaInicio: hoyISO(), fechaFinPrevista: "", portada: PORTADA_DEFECTO, horario: "Lunes a viernes de 8:00 a 17:00 · Trabajos ruidosos de 9:00 a 14:00", notasCliente: "" });
  const [modoCli, setModoCli] = useState<"nuevo" | "existente">("nuevo");
  const [cliId, setCliId] = useState("");
  const [cli, setCli] = useState({ nombre: "", telefono: "", email: "" });
  const [pin] = useState(() => pinNuevo(db));
  const [eq, setEq] = useState<Obra["equipo"]>({ jefeId: db.usuarios.find((u) => u.rol === "jefe_obra")?.id ?? "", operarioIds: [], gremioIds: [] });
  const [dias, setDias] = useState(() => Object.fromEntries(FASES.map((f) => [f.tipo, f.dias])) as Record<FaseTipo, number>);
  const [pagos, setPagos] = useState<HitoPago[]>(planPagosDefecto);
  const clientes = db.usuarios.filter((u) => u.rol === "cliente");
  const fases = fasesDesde(v.fechaInicio || hoyISO(), dias);
  const suma = pagos.reduce((s, h) => s + (h.porcentaje || 0), 0);

  const errores = [
    !v.nombre.trim() ? "Pon un nombre a la obra." : !v.direccion.trim() ? "Indica la dirección." : v.m2 <= 0 ? "Indica los m²." : v.presupuesto <= 0 ? "Indica el presupuesto." : !v.fechaInicio ? "Indica la fecha de inicio." : "",
    modoCli === "existente" ? (!cliId ? "Elige un cliente." : "") : !cli.nombre.trim() ? "Indica el nombre del cliente." : !/^[\d\s+]{9,}$/.test(cli.telefono) ? "Indica un teléfono válido." : "",
    !eq.jefeId ? "Elige un jefe de obra." : "",
    Object.values(dias).some((d) => !d || d < 1) ? "Cada fase debe durar al menos 1 día." : "",
    suma !== 100 ? `Los porcentajes deben sumar 100 % (ahora ${suma} %).` : pagos.some((h) => !h.concepto.trim()) ? "Cada hito necesita un concepto." : "",
  ];
  const err = errores[paso]!;

  const crear = () => {
    const oid = uid("o");
    let clienteId = cliId;
    const ok = mutate((d) => {
      if (modoCli === "nuevo") {
        clienteId = uid("c");
        d.usuarios.push({ id: clienteId, nombre: cli.nombre.trim(), rol: "cliente", pin, telefono: cli.telefono.trim(), ...(cli.email.trim() ? { email: cli.email.trim() } : {}), obraId: oid });
      } else { const u = d.usuarios.find((x) => x.id === clienteId); if (u) u.obraId = oid; }
      const o: Obra = {
        id: oid, nombre: v.nombre.trim(), tipo: v.tipo, clienteId, direccion: v.direccion.trim(), barrio: v.barrio.trim(), m2: v.m2, presupuesto: v.presupuesto,
        fechaInicio: v.fechaInicio, fechaFinPrevista: v.fechaInicio, estado: "en_plazo", portada: v.portada || PORTADA_DEFECTO, fases,
        equipo: eq, notas: [{ id: uid("n"), autorId: me.id, fecha: hoyISO(), texto: "Obra dada de alta." }], incidencias: [], ordenesCambio: [], partesDiarios: [], hitos: [],
        documentos: [], antesDespues: [], horario: v.horario, pagos: pagos.map((h, i) => ({ ...h, id: `h${i + 1}`, concepto: h.concepto.trim() })), costes: { materiales: 0, gremios: 0 },
        ...(v.notasCliente.trim() ? { notasCliente: v.notasCliente.trim() } : {}),
      };
      recalcularFechas(o);
      d.obras.push(o);
    });
    if (ok) nav({ to: "/obras/$id", params: { id: oid } });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Nueva obra</h1>
      <ol className="flex gap-1">
        {PASOS.map((p, i) => (
          <li key={p} className="flex-1">
            <div className={cn("h-1.5 rounded-full", i <= paso ? "bg-primary" : "bg-muted")} />
            <div className={cn("mt-1 text-xs font-semibold", i === paso ? "text-primary" : "text-muted-foreground")}>{p}</div>
          </li>
        ))}
      </ol>
      <section className="space-y-4 rounded-3xl bg-card p-4 shadow-card">
        {paso === 0 && <CamposDatos v={v} set={(p) => setV({ ...v, ...p })} fechas={false} />}
        {paso === 1 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(["nuevo", "existente"] as const).map((m) => <button key={m} onClick={() => setModoCli(m)} className={cn(btn, "border-2", modoCli === m && "border-primary bg-primary text-primary-foreground")}>{m === "nuevo" ? "Cliente nuevo" : "Cliente existente"}</button>)}
            </div>
            {modoCli === "nuevo" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Nombre y apellidos" className="sm:col-span-2"><input className={inp} value={cli.nombre} onChange={(e) => setCli({ ...cli, nombre: e.target.value })} /></Campo>
                <Campo label="Teléfono"><input type="tel" className={inp} value={cli.telefono} onChange={(e) => setCli({ ...cli, telefono: e.target.value })} /></Campo>
                <Campo label="Email (opcional)"><input type="email" className={inp} value={cli.email} onChange={(e) => setCli({ ...cli, email: e.target.value })} /></Campo>
                <div className="rounded-2xl bg-accent p-3 sm:col-span-2"><div className="text-xs font-semibold text-accent-foreground">PIN de acceso al portal</div><div className="font-display text-3xl font-bold tracking-[0.3em]">{pin}</div><p className="text-xs text-muted-foreground">Compártelo con el cliente para que vea su reforma.</p></div>
              </div>
            ) : (
              <Campo label="Cliente">
                <select className={inp} value={cliId} onChange={(e) => setCliId(e.target.value)}>
                  <option value="">Elige un cliente…</option>
                  {clientes.map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.obraId && db.obras.some((o) => o.id === u.obraId) ? " (pasará a ver esta obra)" : ""}</option>)}
                </select>
              </Campo>
            )}
          </>
        )}
        {paso === 2 && <SelectorEquipo db={db} value={eq} onChange={setEq} />}
        {paso === 3 && (
          <ul className="divide-y">
            {fases.map((f) => (
              <li key={f.tipo} className="flex items-center gap-3 py-2">
                <div className="flex-1"><div className="font-semibold">{nombreFase(f.tipo)}</div><div className="text-xs text-muted-foreground">{fecha(f.inicioPrevisto)} – {fecha(f.finPrevisto)}</div></div>
                <input aria-label={`Días de ${nombreFase(f.tipo)}`} type="number" min={1} className={cn(inp, "w-20 text-center")} value={dias[f.tipo] || ""} onChange={(e) => setDias({ ...dias, [f.tipo]: Number(e.target.value) })} />
                <span className="text-sm text-muted-foreground">días</span>
              </li>
            ))}
            <li className="pt-3 text-sm font-semibold">Fin previsto: {fecha(fases.at(-1)!.finPrevisto)}</li>
          </ul>
        )}
        {paso === 4 && (
          <div className="space-y-2">
            {pagos.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input aria-label="Concepto" className={inp} value={h.concepto} onChange={(e) => setPagos(pagos.map((x, j) => (j === i ? { ...x, concepto: e.target.value } : x)))} />
                <input aria-label="Porcentaje" type="number" min={0} max={100} className={cn(inp, "w-20 text-center")} value={h.porcentaje || ""} onChange={(e) => setPagos(pagos.map((x, j) => (j === i ? { ...x, porcentaje: Number(e.target.value) } : x)))} />
                <span className="w-24 shrink-0 text-right text-sm text-muted-foreground">{euro((v.presupuesto * (h.porcentaje || 0)) / 100)}</span>
                <button aria-label="Quitar hito" disabled={pagos.length < 2} onClick={() => setPagos(pagos.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-danger disabled:opacity-30"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
            <button onClick={() => setPagos([...pagos, { id: "", concepto: "", porcentaje: 0, estado: "pendiente" }])} className={cn(btn, "w-full border-2 border-dashed")}><Plus className="h-5 w-5" />Añadir hito</button>
            <p className={cn("text-sm font-semibold", suma === 100 ? "text-ok" : "text-warn")}>Total: {suma} %</p>
          </div>
        )}
        {err && <p className="text-sm font-semibold text-danger">{err}</p>}
      </section>
      <div className="flex gap-2">
        {paso > 0 && <button onClick={() => setPaso(paso - 1)} className={cn(btn, "flex-1 border-2")}>Atrás</button>}
        {paso < PASOS.length - 1
          ? <button disabled={!!err} onClick={() => setPaso(paso + 1)} className={cn(btn, "flex-1 bg-primary text-primary-foreground shadow-cta disabled:opacity-50")}>Siguiente</button>
          : <button disabled={!!err} onClick={crear} className={cn(btn, "flex-1 bg-primary text-primary-foreground shadow-cta disabled:opacity-50")}><Check className="h-5 w-5" />Crear obra</button>}
      </div>
    </div>
  );
}
