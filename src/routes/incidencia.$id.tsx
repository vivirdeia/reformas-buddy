import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/obria";
import { IncidenciaForm } from "@/components/formularios";
import type { Obra, Usuario } from "@/lib/types";

export const Route = createFileRoute("/incidencia/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Reportar incidencia · Reformas Arnal" }, { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Comunica una incidencia de obra con fotos y gravedad." },
      { property: "og:title", content: "Reportar incidencia · Reformas Arnal" },
      { property: "og:description", content: "Incidencias de obra de Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const { id } = Route.useParams();
  return (
    <AppShell back={<Link to="/obras/$id" params={{ id }} className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Obra</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === id);
        if (!o || me.rol === "cliente") return <p className="py-16 text-center text-muted-foreground">Obra no disponible.</p>;
        return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Reportar incidencia</h1><p className="text-muted-foreground">{o.nombre}</p></div><Nav o={o} me={me} /></div>;
      }}
    </AppShell>
  );
}

function Nav({ me, o }: { me: Usuario; o: Obra }) {
  const nav = useNavigate();
  return <IncidenciaForm o={o} me={me} onDone={() => nav({ to: "/obras/$id", params: { id: o.id } })} />;
}
