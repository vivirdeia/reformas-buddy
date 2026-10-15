import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { HardHat, Settings, LogOut, CalendarCheck, Home as HomeIcon, LayoutDashboard, Users, Wallet, Inbox } from "lucide-react";
import { useDB, useSession, user, ROL_LABEL, ESTADO_LABEL } from "@/lib/store";
import type { DB, EstadoObra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";
import { empresaDe } from "@/lib/empresa";

export function Logo({ light }: { light?: boolean }) {
  const db = useDB();
  const emp = empresaDe(db);
  return (
    <div className="flex items-center gap-2">
      {emp.logo ? <img src={emp.logo} alt="Logotipo" className="h-9 w-9 rounded-xl bg-card object-contain" /> : <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-cta">
        <HardHat className="h-5 w-5" />
      </div>}
      <div className="leading-none">
        <div className={cn("font-display text-xl font-bold", light ? "text-ink-foreground" : "text-foreground")}>Obria</div>
        <div className={cn("text-[11px] font-medium uppercase tracking-wider", light ? "text-ink-foreground/70" : "text-muted-foreground")}>{emp.nombreComercial}</div>
      </div>
    </div>
  );
}

const ST: Record<EstadoObra, string> = {
  en_plazo: "bg-ok-soft text-ok", en_riesgo: "bg-warn-soft text-warn", retrasada: "bg-danger-soft text-danger", terminada: "bg-secondary text-secondary-foreground",
};
const DOT: Record<EstadoObra, string> = { en_plazo: "bg-ok", en_riesgo: "bg-warn", retrasada: "bg-danger", terminada: "bg-muted-foreground" };

export function Semaforo({ estado, className }: { estado: EstadoObra; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", ST[estado], className)}>
      <span className={cn("h-2 w-2 rounded-full", DOT[estado])} />
      {ESTADO_LABEL[estado]}
    </span>
  );
}

export function Progreso({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Foto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className={cn("bg-hero", className)} aria-label={alt} />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={cn("object-cover", className)} />;
}

/** Envuelve las pantallas autenticadas: comprueba sesión, cabecera y navegación inferior. */
export function AppShell({ children, title, back }: { children: (ctx: { db: DB; me: Usuario }) => ReactNode; title?: string; back?: ReactNode }) {
  const db = useDB();
  const { userId, logout } = useSession();
  const nav = useNavigate();
  const loc = useLocation();
  const me = db ? user(db, userId ?? undefined) : undefined;

  useEffect(() => {
    if (db && me && me.activo === false) { logout(); return; }
    if (userId === null || (db && userId && !me)) nav({ to: "/acceso" });
  }, [userId, db, me, nav, logout]);

  if (!db || !me || me.activo === false) return <div className="min-h-screen" />;

  const staff = me.rol === "operario" || me.rol === "jefe_obra";
  const ger = me.rol === "gerente";
  const tabs = ger ? [
    { to: "/panel", label: "Panel", icon: LayoutDashboard },
    { to: "/solicitudes", label: "Solicitudes", icon: Inbox, badge: db.solicitudes.filter((s) => s.estado === "nueva").length },
    { to: "/obras", label: "Obras", icon: HardHat },
    { to: "/equipo", label: "Equipo", icon: Users },
    { to: "/economia", label: "Economía", icon: Wallet },
    { to: "/ajustes", label: "Ajustes", icon: Settings },
  ] as { to: string; label: string; icon: typeof HardHat; badge?: number }[] : [
    ...(staff ? [{ to: "/hoy", label: "Hoy", icon: CalendarCheck }] : []),
    me.rol === "cliente" ? { to: "/mi-reforma", label: "Mi reforma", icon: HomeIcon } : { to: "/obras", label: "Obras", icon: HardHat },
    { to: "/ajustes", label: "Ajustes", icon: Settings },
  ];
  const salir = () => { logout(); nav({ to: "/acceso" }); };

  return (
    <div className="min-h-screen">
      {ger && (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card p-5 md:flex print:hidden">
          <Logo />
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {tabs.map((t) => {
              const active = loc.pathname.startsWith(t.to);
              return (
                <Link key={t.to} to={t.to as "/obras"} className={cn("flex h-12 items-center gap-3 rounded-xl px-4 font-semibold transition", active ? "bg-primary text-primary-foreground shadow-cta" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <t.icon className="h-5 w-5" />{t.label}{!!t.badge && <span className={cn("ml-auto grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold", active ? "bg-card text-primary" : "bg-primary text-primary-foreground")}>{t.badge}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
            <Avatar u={me} className="h-10 w-10" />
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{me.nombre}</div><div className="text-xs text-muted-foreground">{ROL_LABEL[me.rol]}</div></div>
            <button onClick={salir} aria-label="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-full bg-card"><LogOut className="h-4 w-4" /></button>
          </div>
        </aside>
      )}
      <div className={cn(ger && "md:pl-64")}>
        <div className={cn("mx-auto min-h-screen pb-28", ger ? "max-w-7xl md:pb-12" : "max-w-3xl")}>
          <header className={cn("print:hidden sticky top-0 z-20 border-b bg-background/90 backdrop-blur", ger && !back && "md:hidden")}>
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
              {back ?? <Logo />}
              {title && <span className="font-display font-semibold">{title}</span>}
              <div className={cn("flex items-center gap-2", ger && "md:hidden")}>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold">{me.nombre}</div>
                  <div className="text-xs text-muted-foreground">{ROL_LABEL[me.rol]}</div>
                </div>
                <button onClick={salir} aria-label="Cerrar sesión" className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground active:scale-95">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>
          <main className={cn("px-4 pt-4", ger && "md:px-8 md:pt-8")}>{children({ db, me })}</main>
        </div>
      </div>
      <nav className={cn("print:hidden fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur pb-safe", ger && "md:hidden")}>
        <div className="mx-auto grid max-w-3xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => {
            const active = loc.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to as "/obras"} className={cn("flex flex-col items-center gap-1 py-3 text-xs font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                <span className="relative"><t.icon className="h-6 w-6" />{!!("badge" in t && t.badge) && <span className="absolute -right-2.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{(t as { badge: number }).badge}</span>}</span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function SoloGerente({ me, children }: { me: Usuario; children: ReactNode }) {
  const nav = useNavigate();
  useEffect(() => { if (me.rol !== "gerente") nav({ to: "/obras" }); }, [me.rol, nav]);
  return me.rol === "gerente" ? <>{children}</> : null;
}

export function Kpi({ label, value, sub, tone, icon: I }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "warn" | "danger" | "primary"; icon: typeof HardHat }) {
  const t = { ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", danger: "bg-danger-soft text-danger", primary: "bg-accent text-accent-foreground" }[tone ?? "primary"];
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      <div className={cn("mb-3 grid h-10 w-10 place-items-center rounded-xl", t)}><I className="h-5 w-5" /></div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Seccion({ titulo, extra, children, className }: { titulo: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-card p-4 shadow-card md:p-6", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{titulo}</h2>{extra}</div>
      {children}
    </section>
  );
}

export function iniciales(n: string) { return n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join(""); }
export function Avatar({ u, className }: { u: Pick<Usuario, "nombre" | "foto">; className?: string }) {
  if (u.foto) return <img src={u.foto} alt={u.nombre} className={cn("shrink-0 rounded-full object-cover", className)} />;
  return <div className={cn("grid shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground", className)}>{iniciales(u.nombre)}</div>;
}
