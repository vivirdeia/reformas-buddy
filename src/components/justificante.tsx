import { HardHat } from "lucide-react";
import { euro2, totales } from "@/lib/economia";
import { fecha } from "@/lib/store";
import type { Obra, OrdenCambio } from "@/lib/types";

export function DocJustificante({ o, oc, cliente }: { o: Obra; oc: OrdenCambio; cliente: string }) {
  const t = totales(oc);
  const f = oc.firma;
  return (
    <article className="mx-auto max-w-2xl rounded-3xl bg-card p-6 text-sm shadow-card print:rounded-none print:shadow-none">
      <header className="flex items-start justify-between border-b-2 border-primary pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><HardHat className="h-6 w-6" /></div>
          <div><div className="font-display text-xl font-bold">Reformas Arnal</div><div className="text-xs text-muted-foreground">Reformas integrales · Madrid · CIF B-86543210</div></div>
        </div>
        <div className="text-right text-xs text-muted-foreground"><div className="font-bold text-foreground">Orden de cambio</div><div>Nº {oc.id.toUpperCase()}</div><div>{fecha(oc.fecha)}</div></div>
      </header>
      <div className="my-4 grid grid-cols-2 gap-4">
        <div><div className="text-xs font-bold uppercase text-muted-foreground">Cliente</div><div className="font-semibold">{cliente}</div></div>
        <div><div className="text-xs font-bold uppercase text-muted-foreground">Obra</div><div className="font-semibold">{o.nombre}</div><div className="text-muted-foreground">{o.direccion}, {o.barrio}</div></div>
      </div>
      <h2 className="font-display text-lg font-bold">{oc.titulo}</h2>
      <p className="text-muted-foreground">Estancia: {oc.estancia}. {oc.descripcion}</p>
      <table className="mt-4 w-full">
        <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Concepto</th><th className="py-2 text-right">Cant.</th><th className="py-2 text-right">Precio</th><th className="py-2 text-right">Importe</th></tr></thead>
        <tbody>{oc.partidas.map((p, i) => <tr key={i} className="border-b border-dashed"><td className="py-2 pr-2">{p.concepto}</td><td className="py-2 text-right">{p.cantidad.toLocaleString("es-ES")}</td><td className="py-2 text-right">{euro2(p.precio)}</td><td className="py-2 text-right">{euro2(p.cantidad * p.precio)}</td></tr>)}</tbody>
      </table>
      <div className="ml-auto mt-3 w-60 space-y-1">
        <div className="flex justify-between"><span>Base imponible</span><span>{euro2(t.base)}</span></div>
        <div className="flex justify-between"><span>IVA 21%</span><span>{euro2(t.iva)}</span></div>
        <div className="flex justify-between border-t pt-1 font-display text-base font-bold"><span>Total</span><span>{euro2(t.total)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Ampliación de plazo</span><span>{oc.diasExtra} días</span></div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
        <div><div className="text-xs font-bold uppercase text-muted-foreground">Conformidad del cliente</div>
          {f ? <><img src={f.imagen} alt="Firma del cliente" className="mt-1 h-20 object-contain" /><div className="font-semibold">{f.nombre}</div><div className="text-xs text-muted-foreground">Firmado el {new Date(f.fecha).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}</div></>
            : <div className="mt-6 text-muted-foreground">Pendiente de firma</div>}
        </div>
        <div className="text-xs text-muted-foreground">Al firmar, el cliente acepta las partidas descritas, su importe y la ampliación de plazo indicada, que se incorporan al presupuesto vigente de la obra.</div>
      </div>
    </article>
  );
}
