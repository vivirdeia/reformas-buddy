import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, Bath, Building2, CalendarCheck, Camera, CheckCircle2, ChefHat, ChevronDown, Clock, FileSignature,
  Home, Instagram, Facebook, Linkedin, Mail, MapPin, Phone, ShieldCheck, Star, Wallet, ClipboardList, KeyRound, HardHat,
} from "lucide-react";
import { Foto } from "@/components/obria";
import { Comparador } from "@/components/portal";
import { useDB } from "@/lib/store";
import { empresaDe, telHref, webHref } from "@/lib/empresa";
import { icono, webDe } from "@/lib/web";
import { Atribucion } from "@/components/atribucion";
import { EnlacesLegales } from "@/components/legal";
import { cn } from "@/lib/utils";

const HERO = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=75";
const OG = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&h=630&q=70";
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Reformas integrales en Madrid · Reformas Arnal" },
      { name: "description", content: "Reformas integrales en Madrid de pisos, cocinas, baños y locales. Sigue tu obra día a día desde el móvil y pide tu presupuesto sin compromiso." },
      { property: "og:title", content: "Reformas integrales en Madrid · Reformas Arnal" }, { property: "og:url", content: "https://reformas-buddy.lovable.app/" }, { property: "og:locale", content: "es_ES" },
      { property: "og:description", content: "Reformas integrales en Madrid con seguimiento diario desde el móvil, cambios firmados y pagos claros." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG },
    ],
  }),
  component: Landing,
});

const EXTRA = [
  { titulo: "Piso en Chamberí", barrio: "Chamberí", m2: 92, semanas: 11, estancia: "Salón comedor", antes: u("photo-1581858726788-75bc0f6a952d"), despues: u("photo-1600210492486-724fe5c67fb0") },
  { titulo: "Cocina abierta en Retiro", barrio: "Retiro", m2: 18, semanas: 4, estancia: "Cocina", antes: u("photo-1504307651254-35680f356dfd"), despues: u("photo-1556911220-bff31c812dba") },
  { titulo: "Baño en Arganzuela", barrio: "Arganzuela", m2: 7, semanas: 3, estancia: "Baño", antes: u("photo-1541888946425-d81bb19240f5"), despues: u("photo-1552321554-5fefe8c9ef14") },
];

function Cta({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link to="/presupuesto" className={cn("inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-7 font-display text-lg font-semibold shadow-cta transition active:scale-[0.98]", light ? "bg-card text-primary hover:bg-secondary" : "bg-primary text-primary-foreground hover:brightness-110", className)}>
      Pide tu presupuesto <ArrowRight className="h-5 w-5" />
    </Link>
  );
}

function Titulo({ k, t, s }: { k: string; t: string; s?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <div className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">{k}</div>
      <h2 className="text-3xl font-bold md:text-4xl">{t}</h2>
      {s && <p className="mt-3 text-lg text-muted-foreground">{s}</p>}
    </div>
  );
}

function Landing() {
  const db = useDB();
  const emp = empresaDe(db);
  const w = webDe(db);
  const redes = ([["instagram", Instagram, "Instagram"], ["facebook", Facebook, "Facebook"], ["linkedin", Linkedin, "LinkedIn"]] as const).filter(([k]) => emp.redes[k].trim());
  const semanas = (ini: string, f?: string) => Math.max(1, Math.round((new Date(f ?? ini).getTime() - new Date(ini).getTime()) / (7 * 864e5)));
  const galeria = [
    ...(db?.obras.flatMap((o) => o.antesDespues.filter((x) => x.enLanding).map((x) => ({
      titulo: o.nombre.replace(/^Reforma integral |^Adecuación /, "").replace(/^./, (c) => c.toUpperCase()),
      barrio: o.direccion.includes("Ponzano") ? "Ponzano" : o.direccion.includes("Espíritu") ? "Malasaña" : o.barrio,
      m2: o.m2, semanas: semanas(o.fechaInicio, o.fechaFinPrevista), ...x,
    }))) ?? []),
    ...(w.galeria.mostrarEjemplos ? EXTRA : []),
  ];
  const [faq, setFaq] = useState<number | null>(0);

  return (
    <div className="bg-background">
      {/* Cabecera */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-2">
            {emp.logo ? <img src={emp.logo} alt={`Logotipo de ${emp.nombreComercial}`} className="h-10 w-10 rounded-xl bg-card object-contain" /> : <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-cta"><HardHat className="h-5 w-5" /></div>}
            <div className="leading-none text-ink-foreground"><div className="font-display text-xl font-bold">{emp.nombreComercial}</div><div className="text-[11px] font-medium uppercase tracking-wider text-ink-foreground/70">{emp.lema}</div></div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-ink-foreground/85 lg:flex">
            <a href="#obria" className="hover:text-ink-foreground">Seguimiento</a>
            <a href="#servicios" className="hover:text-ink-foreground">Servicios</a>
            <a href="#obras" className="hover:text-ink-foreground">Obras</a>
            <a href="#faq" className="hover:text-ink-foreground">Preguntas</a>
          </nav>
          <Link to="/acceso" className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-foreground/30 bg-ink/30 px-4 text-sm font-semibold text-ink-foreground backdrop-blur hover:bg-ink/50">
            <KeyRound className="h-4 w-4" /><span className="hidden sm:inline">Área de clientes y equipo</span><span className="sm:hidden">Acceso</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden">
        <img src={HERO} alt="Salón reformado por Reformas Arnal" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/80 via-ink/55 to-ink/85" />
        <div className="mx-auto max-w-4xl px-5 pt-24 pb-16 text-center text-ink-foreground">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-ink-foreground/25 bg-ink/30 px-4 py-1.5 text-sm font-semibold backdrop-blur">
            <Star className="h-4 w-4 fill-current text-warn" /> {w.hero.insignia}
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl">{w.hero.titulo}<br /><span className="text-accent">{w.hero.acento}</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-foreground/85 md:text-xl">{w.hero.texto}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Cta />
            <a href={telHref(emp.telefono)} className="inline-flex h-14 items-center gap-2 rounded-2xl border border-ink-foreground/30 px-6 font-semibold hover:bg-ink/30"><Phone className="h-5 w-5" />{emp.telefono}</a>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-foreground/80">
            {w.hero.ventajas.filter(Boolean).map((x) => <span key={x} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" />{x}</span>)}
          </div>
        </div>
      </section>

      {/* Diferencial */}
      <section id="obria" className="overflow-hidden py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2 md:px-8">
          <div>
            <div className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">Lo que nos diferencia</div>
            <h2 className="text-3xl font-bold md:text-4xl">{w.diferencial.titulo}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{w.diferencial.texto}</p>
            <ul className="mt-8 space-y-5">
              {w.diferencial.puntos.map((x) => { const XI = icono(x.icono); return (
                <li key={x.t} className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground"><XI className="h-6 w-6" /></div>
                  <div><div className="font-display text-lg font-semibold">{x.t}</div><p className="text-muted-foreground">{x.d}</p></div>
                </li>
              ); })}
            </ul>
          </div>
          <Mockup />
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="bg-secondary/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Titulo k="Servicios" t={w.servicios.titulo} s={w.servicios.texto} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {w.servicios.items.map((s, i) => { const I = icono(s.icono); return (
              <div key={i} className="rounded-3xl bg-card p-6 shadow-card transition hover:-translate-y-1">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-cta"><I className="h-7 w-7" /></div>
                <h3 className="mt-5 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            ); })}
          </div>
        </div>
      </section>

      {/* Galería */}
      <section id="obras" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Titulo k="Obras terminadas" t={w.galeria.titulo} s={w.galeria.texto} />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {galeria.map((g) => (
              <div key={g.titulo + g.estancia} className="rounded-3xl bg-card p-4 shadow-card">
                <Comparador estancia={g.titulo} antes={g.antes} despues={g.despues} />
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{g.barrio}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1">{g.m2} m²</span>
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3.5 w-3.5" />{g.semanas} semanas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section className="bg-hero py-20 text-ink-foreground md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">Cómo trabajamos</div>
            <h2 className="text-3xl font-bold md:text-4xl">{w.pasos.titulo}</h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-4">
            {w.pasos.items.map((p, i) => { const I = icono(p.icono); return (
              <li key={i} className="rounded-3xl border border-ink-foreground/15 bg-ink/30 p-6 backdrop-blur">
                <div className="flex items-center justify-between"><I className="h-8 w-8 text-accent" /><span className="font-display text-4xl font-bold text-ink-foreground/25">{String(i + 1).padStart(2, "0")}</span></div>
                <h3 className="mt-5 text-xl font-semibold">{p.t}</h3>
                <p className="mt-2 text-ink-foreground/80">{p.d}</p>
              </li>
            ); })}
          </ol>
        </div>
      </section>

      {/* Confianza */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {w.cifras.map((c, i) => (
              <div key={i} className="rounded-3xl border bg-card p-6 text-center">
                <div className="font-display text-4xl font-bold text-primary md:text-5xl">{c.v}</div>
                <div className="mt-1 text-sm font-semibold text-muted-foreground">{c.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {w.testimonios.map((t, i) => (
              <figure key={i} className="flex flex-col rounded-3xl bg-card p-6 shadow-card">
                <div className="flex gap-0.5 text-warn">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <blockquote className="mt-4 flex-1 text-lg">«{t.q}»</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-accent font-display font-bold text-accent-foreground">{t.n.trim()[0] ?? "·"}</div>
                  <div><div className="font-semibold">{t.n}</div><div className="text-sm text-muted-foreground">{t.b} · {t.t}</div></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary/60 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <Titulo k="Preguntas frecuentes" t="Lo que todo el mundo nos pregunta" />
          <div className="space-y-3">
            {w.faq.map((f, i) => (
              <div key={i} className="rounded-2xl bg-card shadow-card">
                <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i} className="flex w-full items-center justify-between gap-4 p-5 text-left font-display text-lg font-semibold">
                  {f.q}<ChevronDown className={cn("h-5 w-5 shrink-0 text-primary transition", faq === i && "rotate-180")} />
                </button>
                {faq === i && <p className="px-5 pb-5 text-muted-foreground">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-hero p-10 text-center text-ink-foreground shadow-card md:p-16">
          <h2 className="text-3xl font-bold md:text-5xl">{w.cta.titulo}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-foreground/85">{w.cta.texto}</p>
          <Cta light className="mt-8" />
        </div>
      </section>

      {/* Pie */}
      <footer className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
          <div className="md:col-span-2">
            <div className="font-display text-2xl font-bold">{emp.nombreComercial}</div>
            <p className="mt-2 max-w-sm text-ink-foreground/70">{w.pie}</p>
            {redes.length > 0 && <div className="mt-5 flex gap-3">
              {redes.map(([k, I, n]) => <a key={k} href={webHref(emp.redes[k].trim())} target="_blank" rel="noopener noreferrer" aria-label={n} className="grid h-11 w-11 place-items-center rounded-full bg-ink-foreground/10 hover:bg-primary"><I className="h-5 w-5" /></a>)}
            </div>}
          </div>
          <div className="space-y-2 text-ink-foreground/80">
            <div className="mb-3 font-semibold text-ink-foreground">Contacto</div>
            <p className="flex gap-2"><MapPin className="h-5 w-5 shrink-0" />{emp.direccion}</p>
            <a href={telHref(emp.telefono)} className="flex gap-2 hover:underline"><Phone className="h-5 w-5" />{emp.telefono}</a>
            <a href={`mailto:${emp.email}`} className="flex gap-2 hover:underline"><Mail className="h-5 w-5" />{emp.email}</a>
          </div>
          <div className="space-y-2 text-ink-foreground/80">
            <div className="mb-3 font-semibold text-ink-foreground">Horario</div>
            {emp.horario.split("\n").filter(Boolean).map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </div>
        <div className="border-t border-ink-foreground/10 py-5 text-center text-sm text-ink-foreground/60">© {new Date().getFullYear()} {emp.razonSocial} · <Link to="/acceso" className="underline">Área de clientes y equipo</Link><EnlacesLegales className="mt-2" /><Atribucion className="mt-2 text-ink-foreground/60" enlace="text-ink-foreground/80 hover:text-ink-foreground" /></div>
      </footer>
    </div>
  );
}

function Mockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="absolute -inset-8 -z-10 rounded-full bg-accent/60 blur-3xl" />
      <div className="rounded-[2.75rem] bg-ink p-3 shadow-card">
        <div className="overflow-hidden rounded-[2.2rem] bg-background">
          <div className="relative h-36">
            <Foto src={u("photo-1502005229762-cf1b2da7c5d6")} alt="Portada de la obra" className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
            <div className="absolute bottom-3 left-4 text-ink-foreground"><div className="text-xs opacity-80">Hola, Isabel</div><div className="font-display font-bold">Ático Malasaña</div></div>
          </div>
          <div className="space-y-3 p-3">
            <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
              <div className="grid h-14 w-14 place-items-center rounded-full border-[5px] border-primary font-display font-bold">86%</div>
              <div><div className="text-xs text-muted-foreground">Fase actual</div><div className="font-semibold">Limpieza final</div><div className="text-xs font-semibold text-ok">Entrega en 4 días</div></div>
            </div>
            <div className="rounded-2xl bg-card p-3 shadow-card">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground"><CalendarCheck className="h-3.5 w-3.5" />Diario de obra · hoy</div>
              <p className="text-sm">Remates de pintura terminados en salón y dormitorio. ¡Ya casi está!</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {["photo-1556909114-f6e7ad7d3136", "photo-1584622650111-993a426fbf0a", "photo-1600210492486-724fe5c67fb0"].map((p) => <Foto key={p} src={u(p)} alt="Foto del día" className="aspect-square w-full rounded-lg" />)}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-ok-soft p-3">
              <ShieldCheck className="h-6 w-6 text-ok" />
              <div className="text-sm"><div className="font-semibold">Cambio firmado</div><div className="text-xs text-muted-foreground">Armario empotrado · 1.452 €</div></div>
            </div>
            <div className="rounded-2xl bg-card p-3 shadow-card">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Pagado</span><span className="font-semibold">90 %</span></div>
              <div className="mt-1.5 h-2 rounded-full bg-muted"><div className="h-full w-[90%] rounded-full bg-primary" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
