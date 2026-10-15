import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { FUENTES_URL, guardarConsentimiento, useConsentimiento } from "@/lib/cookies";
import { cn } from "@/lib/utils";

/** Carga Google Fonts solo si se han aceptado los recursos de terceros. */
function Fuentes({ ok }: { ok: boolean }) {
  useEffect(() => {
    if (!ok || document.getElementById("fuentes-google")) return;
    const pre = document.createElement("link"); pre.rel = "preconnect"; pre.href = "https://fonts.gstatic.com"; pre.crossOrigin = "";
    const l = document.createElement("link"); l.id = "fuentes-google"; l.rel = "stylesheet"; l.href = FUENTES_URL;
    document.head.append(pre, l);
  }, [ok]);
  return null;
}

const btn = "inline-flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-primary px-4 text-sm font-semibold";

export function BannerCookies() {
  const c = useConsentimiento();
  const [listo, setListo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [config, setConfig] = useState(false);
  const [terceros, setTerceros] = useState(false);

  useEffect(() => {
    setListo(true);
    const f = () => { setAbierto(true); setConfig(true); };
    window.addEventListener("obria:cookies-abrir", f);
    return () => window.removeEventListener("obria:cookies-abrir", f);
  }, []);
  useEffect(() => { setTerceros(!!c?.terceros); }, [c]);

  const visible = listo && (!c || abierto);
  const elegir = (v: boolean) => { guardarConsentimiento(v); setAbierto(false); setConfig(false); };

  return (
    <>
      <Fuentes ok={!!c?.terceros} />
      {visible && (
        <div role="dialog" aria-modal="false" aria-labelledby="cookies-t" className="fixed inset-x-0 bottom-0 z-[60] p-3 print:hidden sm:p-4">
          <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-5 text-card-foreground shadow-card">
            <h2 id="cookies-t" className="flex items-center gap-2 font-display text-lg font-semibold"><Cookie className="h-5 w-5 text-primary" />Tu privacidad</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Usamos almacenamiento local técnico, necesario para que la web y el área de clientes funcionen. Con tu permiso, cargamos también las tipografías de Google Fonts.
              {" "}<Link to="/cookies" className="font-semibold text-foreground underline">Política de cookies</Link>
            </p>
            {config && (
              <div className="mt-4 space-y-2">
                <label className="flex items-start gap-3 rounded-2xl bg-muted p-3 text-sm">
                  <input type="checkbox" checked disabled className="mt-0.5 h-5 w-5 accent-primary" />
                  <span><b>Técnicas necesarias</b> · Siempre activas. Guardan tu sesión, tus datos de la obra y estas preferencias.</span>
                </label>
                <label className="flex items-start gap-3 rounded-2xl bg-muted p-3 text-sm">
                  <input type="checkbox" checked={terceros} onChange={(e) => setTerceros(e.target.checked)} className="mt-0.5 h-5 w-5 accent-primary" />
                  <span><b>Recursos de terceros</b> · Tipografías de Google Fonts (Google comparte tu dirección IP al descargarlas).</span>
                </label>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => elegir(false)} className={cn(btn, "bg-card text-foreground")}>Rechazar</button>
              {config
                ? <button onClick={() => elegir(terceros)} className={cn(btn, "bg-card text-foreground")}>Guardar preferencias</button>
                : <button onClick={() => setConfig(true)} className={cn(btn, "bg-card text-foreground")}>Configurar</button>}
              <button onClick={() => elegir(true)} className={cn(btn, "bg-card text-foreground")}>Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
