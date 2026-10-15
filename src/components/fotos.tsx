import { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Foto } from "@/components/obria";

export async function comprimir(file: File, max = 1024, q = 0.6): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", q);
}

export function FotoPicker({ fotos, onChange, max = 4 }: { fotos: string[]; onChange: (f: string[]) => void; max?: number }) {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files) return;
    setCargando(true);
    const nuevas: string[] = [];
    for (const f of Array.from(files).slice(0, max - fotos.length)) nuevas.push(await comprimir(f));
    onChange([...fotos, ...nuevas]);
    setCargando(false);
  };
  const lleno = fotos.length >= max;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={lleno} onClick={() => cam.current?.click()} className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-background font-semibold disabled:opacity-40"><Camera className="h-5 w-5 text-primary" />Cámara</button>
        <button type="button" disabled={lleno} onClick={() => gal.current?.click()} className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-background font-semibold disabled:opacity-40"><ImagePlus className="h-5 w-5 text-primary" />Galería</button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <input ref={gal} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <p className="mt-2 text-xs text-muted-foreground">{cargando ? "Comprimiendo fotos…" : `${fotos.length} de ${max} fotos`}</p>
      {fotos.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {fotos.map((f, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
              <img src={f} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" aria-label="Quitar foto" onClick={() => onChange(fotos.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/70 text-ink-foreground"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Galeria({ fotos }: { fotos: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!fotos.length) return null;
  return (
    <>
      <div className="mt-2 flex gap-2">
        {fotos.map((f, i) => (
          <button key={i} onClick={() => setOpen(f)} className="h-16 w-16 overflow-hidden rounded-xl" aria-label="Ampliar foto">
            <Foto src={f} alt="Foto de obra" className="h-full w-full" />
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-4" onClick={() => setOpen(null)}>
          <button aria-label="Cerrar" className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-card text-foreground"><X className="h-6 w-6" /></button>
          <Foto src={open} alt="Foto ampliada" className="max-h-[85vh] w-full max-w-2xl rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}
