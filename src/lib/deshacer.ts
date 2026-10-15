import { toast } from "sonner";
import { loadDB, mutate, saveDB } from "./store";
import type { DB } from "./types";

/** Aplica un cambio destructivo y ofrece «Deshacer» durante unos segundos. */
export function conDeshacer(mensaje: string, fn: (db: DB) => void): boolean {
  const antes = loadDB(); // copia con referencias a archivos (no se borran hasta pasado el margen)
  if (!mutate(fn)) return false;
  toast(mensaje, { duration: 7000, action: { label: "Deshacer", onClick: () => { if (saveDB(antes)) toast.success("Cambio deshecho"); } } });
  return true;
}

/** ISO → valor para <input type="datetime-local"> en hora local. */
export const aLocal = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const deLocal = (v: string) => new Date(v).toISOString();
