import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat, ClipboardCheck, Home, Briefcase, ChevronLeft, Delete } from "lucide-react";
import { Logo } from "@/components/obria";
import { useDB, useSession, ROL_LABEL } from "@/lib/store";
import type { Rol } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acceso · Obria — Reformas Arnal" },
      { name: "description", content: "Accede a Obria, la app de gestión de obras de Reformas Arnal en Madrid." },
      { property: "og:title", content: "Obria — Reformas Arnal" },
      { property: "og:description", content: "Gestión de obras y reformas integrales a pie de obra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

const ROLES: { rol: Rol; icon: typeof HardHat; desc: string }[] = [
  { rol: "operario", icon: HardHat, desc: "Trabajo diario en obra" },
  { rol: "jefe_obra", icon: ClipboardCheck, desc: "Coordinación de obras" },
  { rol: "cliente", icon: Home, desc: "Sigue tu reforma" },
  { rol: "gerente", icon: Briefcase, desc: "Visión global" },
];

function Login() {
  const db = useDB();
  const { userId, login } = useSession();
  const nav = useNavigate();
  const [rol, setRol] = useState<Rol | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId || !db) return;
    const r = db.usuarios.find((u) => u.id === userId)?.rol;
    if (r) nav({ to: r === "operario" || r === "jefe_obra" ? "/hoy" : r === "cliente" ? "/mi-reforma" : "/obras" });
  }, [userId, db, nav]);

  const usuarios = db?.usuarios.filter((u) => u.rol === rol) ?? [];
  const sel = db?.usuarios.find((u) => u.id === uid);

  const press = (d: string) => {
    if (!sel) return;
    setError(false);
    const p = (pin + d).slice(0, 4);
    setPin(p);
    if (p.length === 4) {
      if (p === sel.pin) login(sel.id);
      else setTimeout(() => { setError(true); setPin(""); }, 150);
    }
  };

  const demo = db ? (["operario", "jefe_obra", "cliente", "gerente"] as Rol[]).map((r) => db.usuarios.find((u) => u.rol === r)!) : [];

  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <Logo light />
        <div className="mt-10 mb-6 text-ink-foreground">
          <h1 className="text-3xl font-bold">{!rol ? "Bienvenido" : !sel ? ROL_LABEL[rol] : `Hola, ${sel.nombre.split(" ")[0]}`}</h1>
          <p className="mt-1 text-ink-foreground/75">{!rol ? "Elige cómo quieres entrar" : !sel ? "Selecciona tu usuario" : "Introduce tu PIN de 4 dígitos"}</p>
        </div>

        <div className="rounded-3xl bg-card p-4 shadow-card">
          {rol && (
            <button onClick={() => { if (sel) { setUid(null); setPin(""); setError(false); } else setRol(null); }}
              className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" />Volver</button>
          )}
          {!rol && (
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button key={r.rol} onClick={() => setRol(r.rol)}
                  className="flex min-h-32 flex-col items-start justify-between rounded-2xl border-2 border-border bg-background p-4 text-left transition active:scale-[0.98] hover:border-primary">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground"><r.icon className="h-6 w-6" /></div>
                  <div><div className="font-display text-lg font-semibold">{ROL_LABEL[r.rol]}</div><div className="text-xs text-muted-foreground">{r.desc}</div></div>
                </button>
              ))}
            </div>
          )}
          {rol && !sel && (
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {usuarios.map((u) => (
                <button key={u.id} onClick={() => setUid(u.id)} className="flex min-h-14 items-center gap-3 rounded-2xl border-2 bg-background px-4 py-3 text-left active:scale-[0.99] hover:border-primary">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-display font-bold text-secondary-foreground">{u.nombre[0]}</div>
                  <div><div className="font-semibold">{u.nombre}</div>{u.oficio && <div className="text-xs text-muted-foreground">{u.oficio}</div>}</div>
                </button>
              ))}
            </div>
          )}
          {sel && (
            <div>
              <div className={cn("my-4 flex justify-center gap-4", error && "animate-in shake")}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={cn("h-4 w-4 rounded-full border-2", i < pin.length ? "border-primary bg-primary" : "border-input", error && "border-danger")} />
                ))}
              </div>
              <p className={cn("mb-3 h-5 text-center text-sm font-semibold text-danger", !error && "invisible")}>PIN incorrecto</p>
              <div className="grid grid-cols-3 gap-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k) =>
                  k === "" ? <div key="e" /> : (
                    <button key={k} onClick={() => (k === "del" ? setPin(pin.slice(0, -1)) : press(k))} aria-label={k === "del" ? "Borrar" : k}
                      className="grid h-16 place-items-center rounded-2xl bg-secondary font-display text-2xl font-semibold text-secondary-foreground active:scale-95 active:bg-accent">
                      {k === "del" ? <Delete className="h-6 w-6" /> : k}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-ink-foreground/20 bg-ink/40 p-4 text-ink-foreground backdrop-blur">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-foreground/70">Accesos de demo</div>
          <ul className="space-y-1 text-sm">
            {demo.map((u) => (
              <li key={u.id} className="flex justify-between gap-2">
                <span><span className="text-ink-foreground/70">{ROL_LABEL[u.rol]}:</span> {u.nombre}</span>
                <span className="font-mono font-bold tracking-widest">{u.pin}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-foreground/60">Resto de usuarios: ver Ajustes una vez dentro.</p>
        </div>
      </div>
    </div>
  );
}
