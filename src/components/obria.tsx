import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { HardHat, Settings, LogOut, CalendarCheck, Home as HomeIcon } from "lucide-react";
import { useDB, useSession, user, ROL_LABEL, ESTADO_LABEL } from "@/lib/store";
import type { DB, EstadoObra, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-cta">
        <HardHat className="h-5 w-5" />
      </div>
      <div className="leading-none">
        <div className={cn("font-display text-xl font-bold", light ? "text-ink-foreground" : "text-foreground")}>Obria</div>
        <div className={cn("text-[11px] font-medium uppercase tracking-wider", light ? "text-ink-foreground/70" : "text-muted-foreground")}>Reformas Arnal</div>
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
    if (userId === null || (db && userId && !me)) nav({ to: "/" });
  }, [userId, db, me, nav]);

  if (!db || !me) return <div className="min-h-screen" />;

  const staff = me.rol === "operario" || me.rol === "jefe_obra";
  const tabs = [
    ...(staff ? [{ to: "/hoy", label: "Hoy", icon: CalendarCheck }] : []),
    me.rol === "cliente" ? { to: "/mi-reforma", label: "Mi reforma", icon: HomeIcon } : { to: "/obras", label: "Obras", icon: HardHat },
    { to: "/ajustes", label: "Ajustes", icon: Settings },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-3xl pb-28">
      <header className="print:hidden sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          {back ?? <Logo />}
          {title && <span className="font-display font-semibold">{title}</span>}
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{me.nombre}</div>
              <div className="text-xs text-muted-foreground">{ROL_LABEL[me.rol]}</div>
            </div>
            <button onClick={() => { logout(); nav({ to: "/" }); }} aria-label="Cerrar sesión"
              className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground active:scale-95">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="px-4 pt-4">{children({ db, me })}</main>
      <nav className="print:hidden fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur pb-safe">
        <div className="mx-auto grid max-w-3xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => {
            const active = loc.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to as "/obras"} className={cn("flex flex-col items-center gap-1 py-3 text-xs font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                <t.icon className="h-6 w-6" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
