import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/obria";
import { PortalCliente } from "@/components/portal";
import type { Usuario } from "@/lib/types";

export const Route = createFileRoute("/mi-reforma")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Mi reforma · Reformas Arnal" }, { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Sigue el avance de tu reforma con Reformas Arnal: fases, diario de obra y documentos." },
      { property: "og:title", content: "Mi reforma · Reformas Arnal" },
      { property: "og:description", content: "Tu reforma, día a día." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      {({ db, me }) => {
        const o = db.obras.find((x) => x.id === me.obraId);
        if (me.rol !== "cliente") return <Redir />;
        if (!o) return <p className="py-16 text-center text-muted-foreground">No encontramos tu reforma.</p>;
        return <PortalCliente db={db} o={o} nombreCliente={(me as Usuario).nombre} />;
      }}
    </AppShell>
  ),
});

function Redir() {
  const nav = useNavigate();
  useEffect(() => { nav({ to: "/obras" }); }, [nav]);
  return null;
}
