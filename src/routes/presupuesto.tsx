import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Bath, Building2, CheckCircle2, ChefHat, Home, PartyPopper, Phone } from "lucide-react";
import { FotoPicker } from "@/components/fotos";
import { mutate, uid } from "@/lib/store";
import { addDias, hoyISO } from "@/lib/fechas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/presupuesto")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Pide tu presupuesto · Reformas Arnal Madrid" },
      { name: "description", content: "Solicita presupuesto sin compromiso para tu reforma en Madrid. Te llamamos en menos de 24 horas laborables." },
      { property: "og:title", content: "Pide tu presupuesto · Reformas Arnal" },
      { property: "og:description", content: "Cuéntanos tu reforma en 2 minutos y te llamamos en menos de 24 horas laborables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://reformas-buddy.lovable.app/presupuesto" },
    ],
    links: [{ rel: "canonical", href: "https://reformas-buddy.lovable.app/presupuesto" }],
  }),
  component: Presupuesto,
});

const TIPOS = [
  { v: "Reforma integral de piso", i: Home }, { v: "Cocina", i: ChefHat }, { v: "Baño", i: Bath }, { v: "Local comercial", i: Building2 },
];
const RANGOS = ["Menos de 15.000 €", "15.000 – 40.000 €", "40.000 – 70.000 €", "Más de 70.000 €", "Aún no lo sé"];
const PASOS = ["Tipo", "Vivienda", "Plazo y presupuesto", "Fotos", "Contacto"];

const contacto = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(100),
  telefono: z.string().trim().regex(/^[+\d\s]{9,16}$/, "Teléfono no válido"),
  email: z.string().trim().email("Email no válido").max(255),
  privacidad: z.literal(true, { message: "Debes aceptar la política de privacidad" }),
});

const input = "h-14 w-full rounded-2xl border-2 bg-background px-4 text-lg outline-none focus:border-primary";

function Presupuesto() {
  const [paso, setPaso] = useState(0);
  const [enviado, setEnviado] = useState(false);
  const [f, setF] = useState({ tipo: "", m2: "", zona: "", inicio: addDias(hoyISO(), 45), rango: "", fotos: [] as string[], nombre: "", telefono: "", email: "", comentario: "", privacidad: false });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const valido = [!!f.tipo, Number(f.m2) > 0 && Number(f.m2) < 5000 && f.zona.trim().length >= 3, !!f.inicio && !!f.rango, true, true][paso];

  const enviar = () => {
    const r = contacto.safeParse(f);
    if (!r.success) { setErr(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    const ok = mutate((db) => db.solicitudes.unshift({
      id: uid("s"), fecha: new Date().toISOString(), tipo: f.tipo, m2: Number(f.m2), zona: f.zona.trim().slice(0, 80), inicio: f.inicio, rango: f.rango,
      fotos: f.fotos, nombre: r.data.nombre, telefono: r.data.telefono, email: r.data.email, comentario: f.comentario.trim().slice(0, 1000) || undefined, estado: "nueva",
    }));
    if (ok) setEnviado(true);
  };

  if (enviado) return (
    <Marco>
      <div className="py-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-ok-soft text-ok"><PartyPopper className="h-10 w-10" /></div>
        <h1 className="mt-6 text-3xl font-bold">¡Gracias, {f.nombre.split(" ")[0]}!</h1>
        <p className="mt-3 text-lg text-muted-foreground">Hemos recibido tu solicitud.</p>
        <div className="mx-auto mt-6 flex max-w-sm items-center gap-3 rounded-2xl bg-accent p-4 text-left text-accent-foreground">
          <Phone className="h-6 w-6 shrink-0" /><span className="font-semibold">Te llamamos en menos de 24 horas laborables para agendar la visita gratuita.</span>
        </div>
        <Link to="/" className="mt-8 inline-flex h-14 items-center gap-2 rounded-2xl bg-primary px-7 font-semibold text-primary-foreground shadow-cta">Volver a la web</Link>
      </div>
    </Marco>
  );

  return (
    <Marco>
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm font-semibold"><span className="text-primary">Paso {paso + 1} de {PASOS.length}</span><span className="text-muted-foreground">{PASOS[paso]}</span></div>
        <div className="flex gap-1.5">{PASOS.map((_, i) => <div key={i} className={cn("h-2 flex-1 rounded-full", i <= paso ? "bg-primary" : "bg-muted")} />)}</div>
      </div>

      {paso === 0 && (<>
        <h1 className="mb-5 text-2xl font-bold">¿Qué quieres reformar?</h1>
        <div className="grid grid-cols-2 gap-3">
          {TIPOS.map((t) => (
            <button key={t.v} onClick={() => { set("tipo", t.v); setPaso(1); }} className={cn("flex min-h-32 flex-col items-start justify-between rounded-2xl border-2 bg-background p-4 text-left font-display text-lg font-semibold transition hover:border-primary", f.tipo === t.v && "border-primary bg-accent")}>
              <t.i className="h-8 w-8 text-primary" />{t.v}
            </button>
          ))}
        </div>
      </>)}

      {paso === 1 && (<div className="space-y-5">
        <h1 className="text-2xl font-bold">Cuéntanos sobre el espacio</h1>
        <label className="block"><span className="mb-1.5 block font-semibold">Metros aproximados</span>
          <div className="relative"><input inputMode="numeric" value={f.m2} onChange={(e) => set("m2", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Ej. 85" className={input} /><span className="absolute right-4 top-4 font-semibold text-muted-foreground">m²</span></div>
        </label>
        <label className="block"><span className="mb-1.5 block font-semibold">Barrio o código postal</span>
          <input value={f.zona} maxLength={80} onChange={(e) => set("zona", e.target.value)} placeholder="Ej. Chamberí o 28010" className={input} />
        </label>
      </div>)}

      {paso === 2 && (<div className="space-y-5">
        <h1 className="text-2xl font-bold">Plazo y presupuesto</h1>
        <label className="block"><span className="mb-1.5 block font-semibold">¿Cuándo te gustaría empezar?</span>
          <input type="date" min={hoyISO()} value={f.inicio} onChange={(e) => set("inicio", e.target.value)} className={input} />
        </label>
        <div><span className="mb-1.5 block font-semibold">Presupuesto orientativo</span>
          <div className="space-y-2">{RANGOS.map((r) => (
            <button key={r} onClick={() => set("rango", r)} className={cn("flex h-14 w-full items-center justify-between rounded-2xl border-2 bg-background px-4 font-semibold", f.rango === r && "border-primary bg-accent")}>
              {r}{f.rango === r && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </button>
          ))}</div>
        </div>
      </div>)}

      {paso === 3 && (<div className="space-y-4">
        <h1 className="text-2xl font-bold">Fotos del estado actual</h1>
        <p className="text-muted-foreground">Opcional, pero nos ayuda a preparar mejor la visita.</p>
        <FotoPicker fotos={f.fotos} onChange={(v) => set("fotos", v)} />
        <label className="block"><span className="mb-1.5 block font-semibold">¿Algo más que debamos saber? <span className="font-normal text-muted-foreground">(opcional)</span></span>
          <textarea value={f.comentario} maxLength={1000} onChange={(e) => set("comentario", e.target.value)} rows={3} className="w-full rounded-2xl border-2 bg-background p-4 outline-none focus:border-primary" />
        </label>
      </div>)}

      {paso === 4 && (<div className="space-y-4">
        <h1 className="text-2xl font-bold">¿Cómo te contactamos?</h1>
        {([["nombre", "Nombre y apellidos", "text"], ["telefono", "Teléfono", "tel"], ["email", "Email", "email"]] as const).map(([k, l, t]) => (
          <label key={k} className="block"><span className="mb-1.5 block font-semibold">{l}</span>
            <input type={t} value={f[k]} maxLength={k === "email" ? 255 : 100} onChange={(e) => { set(k, e.target.value); setErr((x) => ({ ...x, [k]: "" })); }} className={cn(input, err[k] && "border-danger")} />
            {err[k] && <span className="mt-1 block text-sm font-semibold text-danger">{err[k]}</span>}
          </label>
        ))}
        <label className="flex items-start gap-3 pt-1">
          <input type="checkbox" checked={f.privacidad} onChange={(e) => { set("privacidad", e.target.checked); setErr((x) => ({ ...x, privacidad: "" })); }} className="mt-1 h-6 w-6 accent-primary" />
          <span className="text-sm">He leído y acepto la <Link to="/privacidad" target="_blank" className="font-semibold underline">política de privacidad</Link>. Usaremos tus datos solo para contactarte sobre esta reforma.</span>
        </label>
        {err["privacidad"] && <span className="block text-sm font-semibold text-danger">{err["privacidad"]}</span>}
      </div>)}

      <div className="mt-8 flex gap-3">
        {paso > 0 && <button onClick={() => setPaso(paso - 1)} className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary" aria-label="Atrás"><ArrowLeft className="h-5 w-5" /></button>}
        {paso > 0 && (paso < 4
          ? <button disabled={!valido} onClick={() => setPaso(paso + 1)} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground shadow-cta disabled:opacity-40">{paso === 3 && !f.fotos.length ? "Saltar" : "Continuar"}<ArrowRight className="h-5 w-5" /></button>
          : <button onClick={enviar} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground shadow-cta">Enviar solicitud</button>)}
      </div>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hero px-4 py-6">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 font-semibold text-ink-foreground/85"><ArrowLeft className="h-4 w-4" />Reformas Arnal</Link>
        <div className="rounded-3xl bg-card p-6 shadow-card md:p-8">{children}</div>
      </div>
    </div>
  );
}
