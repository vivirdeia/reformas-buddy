import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Printer } from "lucide-react";
import { AppShell } from "@/components/obria";
import { DocJustificante } from "@/components/justificante";
import { user } from "@/lib/store";

export const Route = createFileRoute("/justificante/$obraId/$ocId")({
  head: () => ({
    meta: [
      { title: "Justificante de orden de cambio · Obria" },
      { name: "description", content: "Justificante firmado de la orden de cambio, listo para imprimir." },
      { property: "og:title", content: "Justificante · Obria" },
      { property: "og:description", content: "Orden de cambio firmada de Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { obraId, ocId } = Route.useParams();
  return (
    <AppShell back={<Link to="/orden/$obraId/$ocId" params={{ obraId, ocId }} className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Orden</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === obraId);
        const oc = o?.ordenesCambio.find((x) => x.id === ocId);
        if (!o || !oc || (me.rol === "cliente" && me.obraId !== o.id)) return <p className="py-16 text-center text-muted-foreground">No disponible.</p>;
        return (
          <div className="space-y-4">
            <button onClick={() => window.print()} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-cta print:hidden"><Printer className="h-5 w-5" />Imprimir o guardar en PDF</button>
            <DocJustificante o={o} oc={oc} cliente={user(db, o.clienteId)?.nombre ?? ""} />
          </div>
        );
      }}
    </AppShell>
  );
}
