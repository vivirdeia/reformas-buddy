import { cn } from "@/lib/utils";

/** Atribución fija del producto (no editable desde Ajustes). */
export function Atribucion({ className, enlace }: { className?: string; enlace?: string }) {
  const a = cn("font-semibold underline-offset-2 hover:underline", enlace);
  return (
    <p className={cn("text-xs leading-relaxed", className)}>
      Un producto de <a href="https://vivirdeia.com" target="_blank" rel="noopener noreferrer" className={a}>Vivir de IA</a>
      {" · "}creado por <a href="https://linkedin.com/in/isaacwesleey" target="_blank" rel="noopener noreferrer" className={a}>Isaac Wesley</a>
    </p>
  );
}
