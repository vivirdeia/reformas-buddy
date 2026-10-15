import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/obria";
import { ParteForm } from "@/components/formularios";
import { hoyISO } from "@/lib/fechas";
import { fechaLarga } from "@/lib/store";
import type { DB, Obra, Usuario } from "@/lib/types";

export const Route = createFileRoute("/parte/$id")({
  head: () => ({
    meta: [
      { title: "Nuevo parte diario · Obria" },
      { name: "description", content: "Registra los trabajos, horas y fotos del día en la obra." },
      { property: "og:title", content: "Parte diario · Obria" },
      { property: "og:description", content: "Parte diario de obra de Reformas Arnal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Parte,
});

function Parte() {
  const { id } = Route.useParams();
  return (
    <AppShell back={<Link to="/hoy" className="flex h-11 items-center gap-1 font-semibold"><ChevronLeft className="h-6 w-6" />Hoy</Link>}>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === id);
        if (!o || me.rol === "cliente") return <p className="py-16 text-center text-muted-foreground">Obra no disponible.</p>;
        return <div className="space-y-5"><div><p className="text-sm text-muted-foreground first-letter:uppercase">{fechaLarga(hoyISO())}</p><h1 className="text-2xl font-bold">Parte diario</h1><p className="text-muted-foreground">{o.nombre}</p></div><Nav o={o} db={db} me={me} /></div>;
      }}
    </AppShell>
  );
}

function Nav({ db, me, o }: { db: DB; me: Usuario; o: Obra }) {
  const nav = useNavigate();
  return <ParteForm db={db} me={me} o={o} onDone={() => nav({ to: "/obras/$id", params: { id: o.id } })} />;
}
