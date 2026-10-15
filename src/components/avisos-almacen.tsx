import { useEffect, useState } from "react";
import { AlertTriangle, Download, HardDrive, X } from "lucide-react";
import { AVISO_EVT, descartarRespaldo, respaldoCorrupto, type Aviso } from "@/lib/store";

export function descargar(nombre: string, contenido: string, tipo = "application/json") {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Avisos globales de almacenamiento local (sin alert del navegador). */
export function AvisosAlmacen() {
  const [espacio, setEspacio] = useState(false);
  const [corrupto, setCorrupto] = useState(false);
  useEffect(() => {
    const chk = () => setCorrupto(!!respaldoCorrupto());
    chk();
    const on = (e: Event) => { const a = (e as CustomEvent<Aviso>).detail; if (a.tipo === "espacio") setEspacio(true); else chk(); };
    window.addEventListener(AVISO_EVT, on);
    return () => window.removeEventListener(AVISO_EVT, on);
  }, []);
  if (!espacio && !corrupto) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[60] space-y-2 p-3" role="alert">
      {espacio && (
        <div className="mx-auto flex max-w-xl gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger shadow-card">
          <HardDrive className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">No se ha guardado: no queda espacio en este dispositivo.</p>
            <p className="mt-1 text-foreground/80">Quita alguna foto del formulario, o en Ajustes exporta una copia de seguridad y elimina datos antiguos. Lo que ves seguirá disponible hasta que cierres la pestaña.</p>
          </div>
          <button aria-label="Cerrar aviso" onClick={() => setEspacio(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-background/50"><X className="h-4 w-4" /></button>
        </div>
      )}
      {corrupto && (
        <div className="mx-auto flex max-w-xl gap-3 rounded-2xl border border-warn/30 bg-warn-soft p-4 text-sm shadow-card">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
          <div className="flex-1">
            <p className="font-semibold text-warn">Los datos guardados estaban dañados.</p>
            <p className="mt-1 text-foreground/80">Hemos guardado una copia de lo que había y restaurado los datos iniciales. Descárgala por si necesitas recuperarla.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => { const r = respaldoCorrupto(); if (r) descargar(`obria-respaldo-danado-${new Date().toISOString().slice(0, 10)}.json`, r); }}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"><Download className="h-4 w-4" />Descargar copia</button>
              <button onClick={() => { if (confirm("¿Descartar la copia dañada? No podrás recuperarla.")) { descartarRespaldo(); setCorrupto(false); } }}
                className="h-10 rounded-xl border px-4 font-semibold">Descartar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
