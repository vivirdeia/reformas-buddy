import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/obria";
import { resetDB, ROL_LABEL } from "@/lib/store";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes · Obria" },
      { name: "description", content: "Ajustes de la cuenta y datos de demostración de Obria." },
      { property: "og:title", content: "Ajustes · Obria" },
      { property: "og:description", content: "Configuración de Obria para Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajustes,
});

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
            <button onClick={() => { if (confirm("¿Restablecer todos los datos de demo? Se perderán los cambios.")) { resetDB(); setOk(true); } }}
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
