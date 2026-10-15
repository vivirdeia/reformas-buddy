import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Eye } from "lucide-react";
import { AppShell } from "@/components/obria";
import { PortalCliente } from "@/components/portal";
import { user } from "@/lib/store";

export const Route = createFileRoute("/vista-cliente/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Vista del cliente · Reformas Arnal" }, { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Previsualización del portal que ve el cliente de la obra." },
      { property: "og:title", content: "Vista del cliente · Reformas Arnal" },
      { property: "og:description", content: "Así ve el cliente su reforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vista,
});

function Vista() {
  const { id } = Route.useParams();
  return (
    <AppShell back={<Link to="/obras/$id" params={{ id }} className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Ficha</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === id);
        if (!o || me.rol === "cliente") return <p className="py-16 text-center text-muted-foreground">Obra no disponible.</p>;
        return (
          <>
            <div className="sticky top-16 z-10 -mx-4 -mt-4 mb-4 flex items-center justify-center gap-2 bg-warn px-4 py-2 text-sm font-bold text-ink">
              <Eye className="h-4 w-4" />Previsualización: así lo ve el cliente
            </div>
            <PortalCliente db={db} o={o} nombreCliente={user(db, o.clienteId)?.nombre ?? "cliente"} />
          </>
        );
      }}
    </AppShell>
  );
}
