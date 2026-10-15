import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, HardDrive, RotateCcw, Upload } from "lucide-react";
import { AppShell, Avatar } from "@/components/obria";
import { WebAdmin } from "@/components/web-admin";
import { CambiarPin, EmpresaForm, GremiosAdmin, TarifasAdmin, UsuariosAdmin } from "@/components/admin";
import { descargar } from "@/components/avisos-almacen";
import { espacioUsado, exportarCopia, importarCopia, resetDB, ROL_LABEL } from "@/lib/store";

export const Route = createFileRoute("/ajustes")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Ajustes · Reformas Arnal" }, { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Ajustes de la cuenta y copias de seguridad de Reformas Arnal." },
      { property: "og:title", content: "Ajustes · Reformas Arnal" },
      { property: "og:description", content: "Configuración del área privada de Reformas Arnal." },
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

function Mantenimiento() {
  const [paso, setPaso] = useState(0);
  return (
    <details className="rounded-3xl border border-dashed p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-muted-foreground">Mantenimiento</summary>
      <p className="mt-3 text-muted-foreground">Vuelve a cargar los datos iniciales de la empresa. Se perderán todos los cambios hechos en este dispositivo. Exporta antes una copia de seguridad.</p>
      {paso === 0 && <button onClick={() => setPaso(1)} className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl border-2 px-4 font-semibold"><RotateCcw className="h-4 w-4" />Restaurar datos iniciales</button>}
      {paso === 1 && <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => { if (resetDB()) setPaso(2); }} className="inline-flex h-11 items-center rounded-2xl bg-danger px-4 font-semibold text-primary-foreground">Sí, restaurar todo</button>
        <button onClick={() => setPaso(0)} className="inline-flex h-11 items-center rounded-2xl border-2 px-4 font-semibold">Cancelar</button></div>}
      {paso === 2 && <p className="mt-3 font-semibold text-ok">Datos iniciales restaurados.</p>}
    </details>
  );
}

function Ajustes() {
  return (
    <AppShell>
      {({ db, me }) => (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Ajustes</h1>
          <section className="rounded-3xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar u={me} className="h-14 w-14 text-xl" />
              <div><div className="text-lg font-semibold">{me.nombre}</div><div className="text-sm text-muted-foreground">{ROL_LABEL[me.rol]} · {me.telefono}</div></div>
            </div>
          </section>
          {me.rol === "gerente" && <Datos />}
          <CambiarPin db={db} me={me} />
          {me.rol === "gerente" && <>
            <UsuariosAdmin db={db} me={me} />
            <GremiosAdmin db={db} />
            <TarifasAdmin key={JSON.stringify(db.costeHora)} db={db} />
            <EmpresaForm key={JSON.stringify(db.empresa).length} db={db} />
            <WebAdmin key={JSON.stringify(db.web).length} db={db} />
          </>}
          {me.rol === "gerente" && <Mantenimiento />}
          <p className="pt-2 text-center text-xs text-muted-foreground">{db.empresa.nombreComercial} · Área privada</p>
        </div>
      )}
    </AppShell>
  );
}
