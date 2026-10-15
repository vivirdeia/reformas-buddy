import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, HardDrive, RotateCcw, Upload } from "lucide-react";
import { AppShell } from "@/components/obria";
import { descargar } from "@/components/avisos-almacen";
import { espacioUsado, exportarCopia, importarCopia, resetDB, ROL_LABEL } from "@/lib/store";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes · Obria" },
      { name: "description", content: "Ajustes de la cuenta, copias de seguridad y datos de demostración de Obria." },
      { property: "og:title", content: "Ajustes · Obria" },
      { property: "og:description", content: "Configuración de Obria para Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajustes,
});

const mb = (n: number) => n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

function Barra({ v, max }: { v: number; max: number }) {
  const p = Math.min(100, (v / max) * 100);
  return <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${p > 85 ? "bg-danger" : p > 60 ? "bg-warn" : "bg-primary"}`} style={{ width: `${Math.max(p, 1)}%` }} /></div>;
}

function Datos() {
  const [esp, setEsp] = useState<Awaited<ReturnType<typeof espacioUsado>> | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const medir = useCallback(() => { void espacioUsado().then(setEsp); }, []);
  useEffect(() => { medir(); window.addEventListener("obria:change", medir); return () => window.removeEventListener("obria:change", medir); }, [medir]);

  const importar = async (f: File) => {
    setMsg(null);
    try {
      const txt = await f.text();
      if (!confirm("Importar esta copia sustituirá TODOS los datos actuales de este dispositivo. ¿Continuar?")) return;
      await importarCopia(txt);
      setMsg({ ok: true, t: "Copia importada correctamente." });
    } catch (e) { setMsg({ ok: false, t: e instanceof Error ? e.message : "No se pudo importar la copia." }); }
  };

  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <h2 className="mb-1 flex items-center gap-2 font-semibold"><HardDrive className="h-5 w-5 text-primary" />Datos y copias de seguridad</h2>
      <p className="mb-4 text-sm text-muted-foreground">Todo se guarda solo en este dispositivo. Exporta una copia de vez en cuando.</p>
      {esp ? (
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm"><span>Datos</span><span className="font-semibold">{mb(esp.localTotal)} de {mb(esp.localCuota)}</span></div>
            <Barra v={esp.localTotal} max={esp.localCuota} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm"><span>Fotos y firmas ({esp.nArchivos})</span><span className="font-semibold">{mb(esp.archivos)}{esp.cuota ? ` de ${mb(esp.cuota)}` : ""}</span></div>
            <Barra v={esp.archivos} max={esp.cuota ?? 200 * 1024 * 1024} />
          </div>
        </div>
      ) : <p className="text-sm text-muted-foreground">Calculando espacio…</p>}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button onClick={() => descargar(`obria-copia-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`, exportarCopia())}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground"><Download className="h-5 w-5" />Exportar copia de seguridad</button>
        <button onClick={() => file.current?.click()} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 font-semibold"><Upload className="h-5 w-5" />Importar copia de seguridad</button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" aria-label="Archivo de copia de seguridad"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importar(f); }} />
      </div>
      {msg && <p className={`mt-3 text-sm font-semibold ${msg.ok ? "text-ok" : "text-danger"}`}>{msg.t}</p>}
    </section>
  );
}

function Ajustes() {
  const [ok, setOk] = useState(false);
  return (
    <AppShell>
      {({ db, me }) => (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Ajustes</h1>
          <section className="rounded-3xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">{me.nombre[0]}</div>
              <div><div className="text-lg font-semibold">{me.nombre}</div><div className="text-sm text-muted-foreground">{ROL_LABEL[me.rol]} · {me.telefono}</div></div>
            </div>
          </section>
          {me.rol === "gerente" && <Datos />}
          {me.rol !== "cliente" && (
            <section className="rounded-3xl bg-card p-4 shadow-card">
              <h2 className="mb-2 font-semibold">Usuarios de demo</h2>
              <ul className="divide-y text-sm">
                {db.usuarios.map((u) => (
                  <li key={u.id} className="flex justify-between py-2"><span>{u.nombre} <span className="text-muted-foreground">· {ROL_LABEL[u.rol]}</span></span><span className="font-mono font-bold">{u.pin}</span></li>
                ))}
              </ul>
            </section>
          )}
          <div className="pt-4 text-center">
            <button onClick={() => { if (confirm("¿Restablecer todos los datos de demo? Se perderán los cambios.")) { setOk(resetDB()); } }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
              <RotateCcw className="h-4 w-4" />Restablecer datos de demo
            </button>
            {ok && <p className="text-sm font-semibold text-ok">Datos restablecidos.</p>}
            <p className="mt-2 text-xs text-muted-foreground">Obria v1 · Reformas Arnal, Madrid</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
