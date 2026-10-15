import { useEffect, useRef } from "react";
import { Eraser } from "lucide-react";

export function FirmaPad({ onChange }: { onChange: (img: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dib = useRef(false);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() || "black";
  }, []);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  const limpiar = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); onChange(null); };
  return (
    <div>
      <div className="relative rounded-2xl border-2 border-dashed border-primary/50 bg-background">
        <canvas ref={ref} className="h-48 w-full touch-none"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dib.current = true; const [x, y] = pos(e); const ctx = ref.current!.getContext("2d")!; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke(); }}
          onPointerMove={(e) => { if (!dib.current) return; const [x, y] = pos(e); const ctx = ref.current!.getContext("2d")!; ctx.lineTo(x, y); ctx.stroke(); }}
          onPointerUp={() => { dib.current = false; onChange(ref.current!.toDataURL("image/png")); }} />
        <div className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-border" />
        <span className="pointer-events-none absolute bottom-3 left-6 text-xs text-muted-foreground">Firma aquí con el dedo</span>
      </div>
      <button type="button" onClick={limpiar} className="mt-2 flex items-center gap-1 text-sm font-semibold text-muted-foreground"><Eraser className="h-4 w-4" />Borrar firma</button>
    </div>
  );
}
