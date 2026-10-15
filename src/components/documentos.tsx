import { useEffect, useState } from "react";
import { BadgeCheck, Download, Eye, EyeOff, FileText, Image as ImageIcon, Link2, Pencil, Plus, Ruler, Upload, X } from "lucide-react";
import { Confirmar } from "@/components/formularios";
import { Modal } from "@/components/gestion-contenido";
import { comprimir } from "@/components/fotos";
import { Comparador } from "@/components/portal";
import { conDeshacer } from "@/lib/deshacer";
import { hoyISO } from "@/lib/fechas";
import { fecha, mutate, uid } from "@/lib/store";
import type { AntesDespues, DB, Documento, Obra, TipoDocumento } from "@/lib/types";
import { cn } from "@/lib/utils";

export const MAX_DOC = 5 * 1024 * 1024;
export const TIPO_DOC: Record<TipoDocumento, string> = { presupuesto: "Presupuesto", plano: "Planos", certificado: "Certificados", otro: "Otros" };
export const iconoDoc = (t: TipoDocumento) => (t === "plano" ? Ruler : t === "certificado" ? BadgeCheck : FileText);
export const tamanoTxt = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const inp = "h-12 w-full rounded-xl border-2 bg-background px-3 text-base outline-none focus:border-primary";
const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-40";
const btn2 = "inline-flex h-11 items-center justify-center gap-1 rounded-xl border-2 px-3 text-sm font-semibold";

const leer = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const esPdf = (d: Pick<Documento, "mime" | "archivo">) => d.mime === "application/pdf" || !!d.archivo?.startsWith("data:application/pdf");

/** URL de blob para un data URL (los navegadores bloquean data: en visores de PDF). */
function useBlobUrl(data?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!data?.startsWith("data:")) { setUrl(null); return; }
    let u: string | null = null; let vivo = true;
    void fetch(data).then((r) => r.blob()).then((b) => { if (!vivo) return; u = URL.createObjectURL(b); setUrl(u); }).catch(() => setUrl(null));
    return () => { vivo = false; if (u) URL.revokeObjectURL(u); };
  }, [data]);
  return url;
}

/** Vista previa real (PDF o imagen) y botón de descarga. */
export function VistaArchivo({ doc }: { doc: Documento }) {
  const url = useBlobUrl(doc.archivo);
  if (!doc.archivo) return null;
  if (!url) return <p className="py-8 text-center text-sm text-muted-foreground">Cargando documento…</p>;
  return (
    <div className="space-y-3">
      {esPdf(doc)
        ? <iframe src={url} title={doc.nombre} className="h-[60vh] w-full rounded-2xl border bg-background" />
        : <img src={url} alt={doc.nombre} className="max-h-[60vh] w-full rounded-2xl border object-contain" />}
      <div className="flex flex-wrap gap-2">
        <a href={url} download={doc.nombre} className={cn(btn, "flex-1")}><Download className="h-5 w-5" />Descargar</a>
        <a href={url} target="_blank" rel="noopener noreferrer" className={cn(btn2, "h-12")}>Abrir en pestaña nueva</a>
      </div>
    </div>
  );
}

/* ---------- Documentos en la ficha ---------- */
type FormD = { id: string; nombre: string; tipo: TipoDocumento; visibleCliente: boolean; archivo?: string | undefined; mime?: string | undefined; tamano: string };

export function DocumentosObra({ o }: { db: DB; o: Obra }) {
  const [form, setForm] = useState<FormD | null>(null);
  const [ver, setVer] = useState<Documento | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const s = (p: Partial<FormD>) => setForm((f) => f && { ...f, ...p });
  const elegir = async (f: File) => {
    setErr(null);
    if (f.size > MAX_DOC) return setErr(`«${f.name}» ocupa ${tamanoTxt(f.size)}. El máximo es 5 MB por archivo.`);
    const pdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    if (!pdf && !f.type.startsWith("image/")) return setErr("Solo se admiten PDF o imágenes.");
    setCargando(true);
    try {
      const data = pdf ? await leer(f) : await comprimir(f, 2000, 0.8);
      const bytes = Math.round((data.length - data.indexOf(",") - 1) * 0.75);
      s({ archivo: data, mime: pdf ? "application/pdf" : "image/jpeg", tamano: tamanoTxt(bytes), nombre: form?.nombre || (pdf ? f.name : f.name.replace(/\.\w+$/, ".jpg")) });
    } catch { setErr("No se ha podido leer el archivo."); }
    setCargando(false);
  };
  const guardar = () => {
    if (!form || !form.nombre.trim() || (!form.id && !form.archivo)) return;
    const prev = o.documentos.find((d) => d.id === form.id);
    const d: Documento = { id: form.id || uid("doc"), nombre: form.nombre.trim(), tipo: form.tipo, visibleCliente: form.visibleCliente, fecha: prev?.fecha ?? hoyISO(), tamano: form.tamano, archivo: form.archivo, mime: form.mime };
    if (mutate((db) => { const ob = db.obras.find((x) => x.id === o.id)!; const i = ob.documentos.findIndex((x) => x.id === d.id); if (i >= 0) ob.documentos[i] = d; else ob.documentos.push(d); })) setForm(null);
  };
  const toggle = (d: Documento) => mutate((db) => { const x = db.obras.find((y) => y.id === o.id)!.documentos.find((y) => y.id === d.id)!; x.visibleCliente = x.visibleCliente === false; });
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <button onClick={() => { setErr(null); setForm({ id: "", nombre: "", tipo: "otro", visibleCliente: true, tamano: "" }); }} className={cn(btn, "h-11")}><Plus className="h-5 w-5" />Subir documento</button>
      </div>
      {o.documentos.length === 0 ? <p className="text-sm text-muted-foreground">Sin documentos.</p> : (
        <ul className="divide-y">
          {o.documentos.map((d) => { const I = iconoDoc(d.tipo); return (
            <li key={d.id} className="flex flex-wrap items-center gap-2 py-3">
              <button onClick={() => setVer(d)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Ver ${d.nombre}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><I className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block truncate font-semibold">{d.nombre}</span>
                  <span className="text-xs text-muted-foreground">{TIPO_DOC[d.tipo]} · {fecha(d.fecha)} · {d.tamano}{!d.archivo && " · ejemplo"}</span></span>
              </button>
              <button onClick={() => toggle(d)} className={cn(btn2, d.visibleCliente === false ? "text-muted-foreground" : "border-ok text-ok")} aria-label={d.visibleCliente === false ? "Mostrar al cliente" : "Ocultar al cliente"}>
                {d.visibleCliente === false ? <><EyeOff className="h-4 w-4" />Interno</> : <><Eye className="h-4 w-4" />Cliente</>}</button>
              <button onClick={() => setForm({ id: d.id, nombre: d.nombre, tipo: d.tipo, visibleCliente: d.visibleCliente !== false, archivo: d.archivo, mime: d.mime, tamano: d.tamano })} aria-label={`Editar ${d.nombre}`} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-muted"><Pencil className="h-4 w-4" /></button>
              <Confirmar pregunta="¿Borrar documento?" onSi={() => conDeshacer("Documento borrado", (db) => { const ob = db.obras.find((x) => x.id === o.id)!; ob.documentos = ob.documentos.filter((x) => x.id !== d.id); })} />
            </li>); })}
        </ul>
      )}
      <Modal open={!!form} onClose={() => setForm(null)} titulo={form?.id ? "Editar documento" : "Subir documento"}>
        {form && <div className="space-y-3">
          <label className={cn("flex h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed font-semibold", form.archivo && "border-primary bg-accent")}>
            <Upload className="h-5 w-5 text-primary" />{cargando ? "Leyendo archivo…" : form.archivo ? `Archivo listo (${form.tamano}) · cambiar` : form.id ? "Adjuntar archivo real (PDF o imagen)" : "Elegir PDF o imagen"}
            <input aria-label="Archivo del documento" type="file" accept="application/pdf,image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void elegir(f); }} />
          </label>
          <p className="text-xs text-muted-foreground">Máximo 5 MB por archivo. Se guarda solo en este dispositivo.</p>
          {err && <p role="alert" className="text-sm font-semibold text-danger">{err}</p>}
          <label className="block text-sm font-semibold">Nombre<input aria-label="Nombre del documento" className={cn(inp, "mt-1")} value={form.nombre} onChange={(e) => s({ nombre: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(TIPO_DOC) as TipoDocumento[]).map((t) => <button key={t} type="button" onClick={() => s({ tipo: t })} className={cn("h-11 rounded-xl border-2 text-sm font-semibold", form.tipo === t && "border-primary bg-accent")}>{TIPO_DOC[t]}</button>)}
          </div>
          <label className="flex items-center gap-3 rounded-2xl bg-muted p-3 font-semibold"><input type="checkbox" className="h-5 w-5 accent-primary" checked={form.visibleCliente} onChange={(e) => s({ visibleCliente: e.target.checked })} />Visible para el cliente</label>
          <button onClick={guardar} disabled={!form.nombre.trim() || (!form.id && !form.archivo) || cargando} className={cn(btn, "w-full")}>Guardar documento</button>
        </div>}
      </Modal>
      <Modal open={!!ver} onClose={() => setVer(null)} titulo={ver?.nombre ?? ""}>
        {ver && (ver.archivo ? <VistaArchivo doc={ver} /> : <p className="text-sm text-muted-foreground">Documento de ejemplo sin archivo. Edítalo para adjuntar el PDF o la imagen real.</p>)}
      </Modal>
    </section>
  );
}

/* ---------- Antes y después ---------- */
function FotoCampo({ l, v, on }: { l: string; v: string; on: (x: string) => void }) {
  const [url, setUrl] = useState(v.startsWith("http") ? v : "");
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{l}</div>
      {v ? <img src={v} alt={l} className="aspect-[4/3] w-full rounded-xl object-cover" /> : <div className="grid aspect-[4/3] place-items-center rounded-xl bg-muted text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}
      <label className={cn(btn2, "w-full cursor-pointer")}><Upload className="h-4 w-4" />Subir foto
        <input aria-label={`Subir foto ${l}`} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) on(await comprimir(f, 1400, 0.75)); }} /></label>
      <div className="flex gap-1"><input aria-label={`URL ${l}`} className={cn(inp, "h-11 text-sm")} placeholder="o pega una URL https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="button" disabled={!/^https?:\/\//.test(url)} onClick={() => on(url.trim())} className={btn2} aria-label={`Usar URL ${l}`}><Link2 className="h-4 w-4" /></button></div>
    </div>
  );
}

export function AntesDespuesObra({ o }: { o: Obra }) {
  const [form, setForm] = useState<AntesDespues | null>(null);
  const ok = form && form.estancia.trim() && form.antes && form.despues;
  const guardar = () => {
    if (!form || !ok) return;
    const x = { ...form, id: form.id || uid("ad"), estancia: form.estancia.trim() };
    if (mutate((db) => { const ob = db.obras.find((y) => y.id === o.id)!; const i = ob.antesDespues.findIndex((y) => y.id === x.id); if (i >= 0) ob.antesDespues[i] = x; else ob.antesDespues.push(x); })) setForm(null);
  };
  const landing = (x: AntesDespues) => mutate((db) => { const y = db.obras.find((z) => z.id === o.id)!.antesDespues.find((z) => z.id === x.id); if (y) y.enLanding = !y.enLanding; });
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Antes y después</h2>
        <button onClick={() => setForm({ id: "", estancia: "", antes: "", despues: "", enLanding: false })} className={cn(btn, "h-11")}><Plus className="h-5 w-5" />Añadir estancia</button>
      </div>
      {o.antesDespues.length === 0 ? <p className="text-sm text-muted-foreground">Sin fotos de antes y después todavía. El cliente las ve en su portal.</p> : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {o.antesDespues.map((x, i) => (
            <li key={x.id ?? i} className="rounded-2xl border p-3">
              <Comparador estancia={x.estancia} antes={x.antes} despues={x.despues} />
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <label className="mr-auto flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-primary" checked={!!x.enLanding} onChange={() => landing(x)} />Mostrar en la web</label>
                <button onClick={() => setForm({ ...x })} aria-label={`Editar ${x.estancia}`} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                <Confirmar texto="Quitar" pregunta="¿Quitar?" onSi={() => conDeshacer(`«${x.estancia}» quitado`, (db) => { const ob = db.obras.find((y) => y.id === o.id)!; ob.antesDespues = ob.antesDespues.filter((y) => y !== ob.antesDespues[i]); })} />
              </div>
            </li>))}
        </ul>
      )}
      <Modal open={!!form} onClose={() => setForm(null)} titulo={form?.id ? "Editar antes y después" : "Nueva estancia"}>
        {form && <div className="space-y-3">
          <label className="block text-sm font-semibold">Estancia<input aria-label="Estancia" className={cn(inp, "mt-1")} value={form.estancia} onChange={(e) => setForm({ ...form, estancia: e.target.value })} placeholder="Cocina, baño, salón…" /></label>
          <div className="grid grid-cols-2 gap-3">
            <FotoCampo l="Antes" v={form.antes} on={(v) => setForm((f) => f && { ...f, antes: v })} />
            <FotoCampo l="Después" v={form.despues} on={(v) => setForm((f) => f && { ...f, despues: v })} />
          </div>
          <label className="flex items-center gap-3 rounded-2xl bg-muted p-3 font-semibold"><input type="checkbox" className="h-5 w-5 accent-primary" checked={!!form.enLanding} onChange={(e) => setForm({ ...form, enLanding: e.target.checked })} />Mostrar en la galería de la web</label>
          <div className="flex gap-2"><button onClick={guardar} disabled={!ok} className={cn(btn, "flex-1")}>Guardar</button><button onClick={() => setForm(null)} className={btn2}><X className="h-4 w-4" />Cancelar</button></div>
        </div>}
      </Modal>
    </section>
  );
}
