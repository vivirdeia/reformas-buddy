import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useDB } from "@/lib/store";
import { empresaDe } from "@/lib/empresa";
import { abrirCookies } from "@/lib/cookies";
import type { Empresa } from "@/lib/types";
import { Atribucion } from "@/components/atribucion";

/** Enlaces a las páginas legales (pie de la web y formularios). */
export function EnlacesLegales({ className }: { className?: string }) {
  const a = "underline-offset-2 hover:underline";
  return (
    <nav aria-label="Información legal" className={className}>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <li><Link to="/aviso-legal" className={a}>Aviso legal</Link></li>
        <li><Link to="/privacidad" className={a}>Privacidad</Link></li>
        <li><Link to="/cookies" className={a}>Cookies</Link></li>
        <li><Link to="/terminos" className={a}>Términos de uso</Link></li>
        <li><button type="button" onClick={abrirCookies} className={a}>Configurar cookies</button></li>
      </ul>
    </nav>
  );
}

export function PaginaLegal({ titulo, children }: { titulo: string; children: (e: Empresa) => ReactNode }) {
  const emp = empresaDe(useDB());
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-bold">{emp.nombreComercial}</Link>
          <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Volver a la web</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold">{titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última actualización: octubre de 2026</p>
        <div className="legal mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_a]:font-semibold [&_a]:underline">
          {children(emp)}
        </div>
      </main>
      <footer className="border-t bg-card py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {emp.razonSocial}</p>
        <EnlacesLegales className="mt-2" />
        <Atribucion className="mt-3" enlace="text-foreground/80" />
      </footer>
    </div>
  );
}

export const Titular = ({ e }: { e: Empresa }) => (
  <ul>
    <li><b>Titular:</b> {e.razonSocial}{e.nombreComercial !== e.razonSocial ? ` (nombre comercial: ${e.nombreComercial})` : ""}</li>
    <li><b>CIF:</b> {e.cif}</li>
    <li><b>Domicilio:</b> {e.direccion}</li>
    <li><b>Email:</b> <a href={`mailto:${e.email}`}>{e.email}</a></li>
    <li><b>Teléfono:</b> {e.telefono}</li>
  </ul>
);

export const legalHead = (titulo: string, desc: string, path: string) => ({
  meta: [
    { title: `${titulo} · Reformas Arnal` },
    { name: "description", content: desc },
    { property: "og:title", content: `${titulo} · Reformas Arnal` },
    { property: "og:description", content: desc },
    { property: "og:type", content: "article" },
    { property: "og:url", content: `https://reformas-buddy.lovable.app${path}` },
    { name: "twitter:card", content: "summary" },
  ],
  links: [{ rel: "canonical", href: `https://reformas-buddy.lovable.app${path}` }],
});
