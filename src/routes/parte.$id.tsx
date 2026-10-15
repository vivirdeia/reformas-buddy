import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { AppShell } from "@/components/obria";
import { FotoPicker } from "@/components/fotos";
import { FASES } from "@/lib/seed";
import { hoyISO } from "@/lib/fechas";
import { fechaLarga, msFichaje, mutate, uid, user } from "@/lib/store";
import type { DB, FaseTipo, Obra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parte/$id")({
  head: () => ({
    meta: [
      { title: "Nuevo parte diario · Obria" },
      { name: "description", content: "Registra los trabajos, horas y fotos del día en la obra." },
      { property: "og:title", content: "Parte diario · Obria" },
      { property: "og:description", content: "Parte diario de obra de Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Parte,
});

function Parte() {
  const { id } = Route.useParams();
  return (
    <AppShell back={<Link to="/hoy" className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Hoy</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === id);
        if (!o || me.rol === "cliente") return <p className="py-16 text-center text-muted-foreground">Obra no disponible.</p>;
        return <Form db={db} me={me} o={o} />;
      }}
    </AppShell>
  );
}

const label = "mb-2 block text-sm font-bold uppercase tracking-wider text-muted-foreground";

function Form({ db, me, o }: { db: DB; me: Usuario; o: Obra }) {
  const nav = useNavigate();
  const hoy = hoyISO();
  const fichHoy = db.fichajes.filter((f) => f.obraId === o.id && f.entrada.slice(0, 10) === hoy && o.equipo.operarioIds.includes(f.userId));
  const [fase, setFase] = useState<FaseTipo>((o.fases.find((f) => f.estado !== "completada")?.tipo ?? "limpieza") as FaseTipo);
  const [trabajos, setTrabajos] = useState("");
  const [pres, setPres] = useState<string[]>(() => {
    const ids = [...new Set(fichHoy.map((f) => f.userId))];
    return ids.length ? ids : me.rol === "operario" ? [me.id] : [];
  });
  const [horas, setHoras] = useState<number>(() => {
    const h = fichHoy.reduce((s, f) => s + msFichaje(f), 0) / 3600000;
    return h > 0.25 ? Math.round(h * 2) / 2 : 8;
  });
  const [fotos, setFotos] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const ok = trabajos.trim().length > 3 && pres.length > 0 && horas > 0;

  const enviar = () => {
    if (!ok) return;
    const saved = mutate((d) => {
      d.obras.find((x) => x.id === o.id)!.partesDiarios.push({ id: uid("p"), fecha: hoy, autorId: me.id, horas, operarioIds: pres, trabajos: trabajos.trim(), fotos, fase, visibleCliente: visible });
    });
    if (saved) nav({ to: "/obras/$id", params: { id: o.id } });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground first-letter:uppercase">{fechaLarga(hoy)}</p>
        <h1 className="text-2xl font-bold">Parte diario</h1>
        <p className="text-muted-foreground">{o.nombre}</p>
      </div>

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
          {o.equipo.operarioIds.map((id) => {
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
          <button onClick={() => setHoras(Math.max(0, horas - 0.5))} className="h-14 w-14 rounded-2xl bg-secondary text-2xl font-bold">−</button>
          <div className="flex-1 text-center font-display text-3xl font-bold">{horas.toLocaleString("es-ES")} h</div>
          <button onClick={() => setHoras(horas + 0.5)} className="h-14 w-14 rounded-2xl bg-secondary text-2xl font-bold">+</button>
        </div>
      </div>

      <div>
        <span className={label}>Fotos</span>
        <FotoPicker fotos={fotos} onChange={setFotos} />
      </div>

      <button type="button" role="switch" aria-checked={visible} onClick={() => setVisible(!visible)} className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left shadow-card">
        <span><span className="block font-semibold">Visible para el cliente</span><span className="text-sm text-muted-foreground">Aparecerá en su diario de obra con las fotos</span></span>
        <span className={cn("relative h-8 w-14 shrink-0 rounded-full transition", visible ? "bg-primary" : "bg-input")}><span className={cn("absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-all", visible ? "left-7" : "left-1")} /></span>
      </button>

      <button disabled={!ok} onClick={enviar} className="h-16 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-cta disabled:opacity-40">Enviar parte</button>
    </div>
  );
}
