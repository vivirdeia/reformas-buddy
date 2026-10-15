import { createFileRoute } from "@tanstack/react-router";
import { legalHead, PaginaLegal } from "@/components/legal";
import { abrirCookies } from "@/lib/cookies";

export const Route = createFileRoute("/cookies")({
  staticData: { sitemap: true },
  head: () => legalHead("Política de cookies", "Qué almacenamiento local y recursos de terceros usa la web de Reformas Arnal y cómo cambiar tus preferencias.", "/cookies"),
  component: () => (
    <PaginaLegal titulo="Política de cookies">
      {(e) => <>
        <p>Conforme al artículo 22.2 de la LSSI-CE, te explicamos qué tecnologías de almacenamiento usa esta web.</p>
        <h2>1. Almacenamiento técnico necesario</h2>
        <p>{e.nombreComercial} no usa cookies publicitarias ni de analítica. La web utiliza el almacenamiento local del navegador (localStorage e IndexedDB), que es imprescindible para funcionar y está exento de consentimiento:</p>
        <ul>
          <li><b>obria:db:v1</b> (localStorage): datos de las obras, solicitudes y ajustes. Hasta que se borren.</li>
          <li><b>obria:session</b> (localStorage): mantiene abierta tu sesión en el área de clientes y equipo. Hasta que cierres sesión.</li>
          <li><b>obria-archivos</b> (IndexedDB): fotos, firmas y documentos de las obras. Hasta que se borren.</li>
          <li><b>obria:cookies</b> (localStorage): guarda tus preferencias de esta política. 12 meses.</li>
        </ul>
        <h2>2. Recursos de terceros</h2>
        <ul>
          <li><b>Google Fonts</b> (Google Ireland Ltd.): tipografías de la web. Solo se cargan si las aceptas; al descargarlas, Google recibe tu dirección IP. Si las rechazas, se usan las tipografías de tu dispositivo.</li>
          <li><b>Unsplash</b> (images.unsplash.com): algunas fotografías de la web se sirven desde este servicio para mostrar el contenido. No instalan cookies, aunque el servidor recibe tu dirección IP.</li>
        </ul>
        <h2>3. Cómo cambiar tus preferencias</h2>
        <p>Puedes cambiar tu elección en cualquier momento desde el enlace «Configurar cookies» del pie de la web o aquí:</p>
        <p><button type="button" onClick={abrirCookies} className="inline-flex h-11 items-center rounded-2xl border-2 border-primary px-4 font-semibold">Configurar cookies</button></p>
        <p>También puedes borrar el almacenamiento desde los ajustes de tu navegador. Si lo haces, se cerrará tu sesión y se perderán los datos guardados en ese dispositivo.</p>
      </>}
    </PaginaLegal>
  ),
});
