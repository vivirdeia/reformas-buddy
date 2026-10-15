import { createFileRoute } from "@tanstack/react-router";
import { legalHead, PaginaLegal } from "@/components/legal";

export const Route = createFileRoute("/terminos")({
  staticData: { sitemap: true },
  head: () => legalHead("Términos y condiciones de uso", "Condiciones de uso del portal del cliente y del área de equipo de Reformas Arnal.", "/terminos"),
  component: () => (
    <PaginaLegal titulo="Términos y condiciones de uso">
      {(e) => <>
        <p>Estas condiciones regulan el uso del área privada de {e.nombreComercial} ({e.razonSocial}, CIF {e.cif}): el portal del cliente «Mi reforma» y el área de equipo.</p>
        <h2>1. Acceso</h2>
        <p>El acceso es personal y se realiza con el usuario y el PIN de 4 cifras que te facilita {e.nombreComercial}. Debes mantener tu PIN en secreto, cambiarlo desde Ajustes si crees que otra persona lo conoce y cerrar la sesión en dispositivos compartidos. Puedes pedir un PIN nuevo en <a href={`mailto:${e.email}`}>{e.email}</a>.</p>
        <h2>2. Portal del cliente</h2>
        <ul>
          <li>Muestra el avance, el diario de obra, las fotos, los documentos y el plan de pagos de tu reforma. La información tiene carácter informativo; el presupuesto y el contrato firmados prevalecen.</li>
          <li>Las órdenes de cambio que apruebes con tu firma en pantalla modifican el presupuesto vigente en los términos indicados en cada orden, con el IVA desglosado.</li>
          <li>Los pagos se realizan por transferencia a la cuenta indicada en cada aviso de pago.</li>
        </ul>
        <h2>3. Área de equipo</h2>
        <ul>
          <li>Es de uso exclusivo del personal y colaboradores de {e.nombreComercial} para fichar, registrar partes, tareas e incidencias.</li>
          <li>La información registrada debe ser veraz. Los fichajes constituyen el registro de jornada.</li>
          <li>Solo se pueden publicar fotos de la obra; no deben aparecer personas sin su permiso ni datos ajenos a la reforma.</li>
        </ul>
        <h2>4. Datos en el dispositivo</h2>
        <p>La información del área privada se guarda en el navegador del dispositivo. Si borras los datos del navegador, se perderá la información guardada en él. El equipo de gestión dispone de copias de seguridad.</p>
        <h2>5. Uso indebido</h2>
        <p>{e.razonSocial} podrá desactivar el acceso de quien haga un uso indebido del área privada, intente acceder a datos de otras personas o comparta su PIN.</p>
        <h2>6. Modificaciones y legislación</h2>
        <p>Estas condiciones pueden actualizarse; te avisaremos de los cambios relevantes. Se rigen por la legislación española y, para cualquier controversia, por los juzgados de Madrid, salvo fuero distinto de consumidores.</p>
      </>}
    </PaginaLegal>
  ),
});
