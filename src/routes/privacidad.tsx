import { createFileRoute } from "@tanstack/react-router";
import { legalHead, PaginaLegal, Titular } from "@/components/legal";

export const Route = createFileRoute("/privacidad")({
  staticData: { sitemap: true },
  head: () => legalHead("Política de privacidad", "Cómo trata Reformas Arnal tus datos personales: finalidades, base legal, conservación y tus derechos según el RGPD.", "/privacidad"),
  component: () => (
    <PaginaLegal titulo="Política de privacidad">
      {(e) => <>
        <p>Esta política explica cómo tratamos tus datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).</p>
        <h2>1. Responsable del tratamiento</h2>
        <Titular e={e} />
        <h2>2. Qué datos tratamos</h2>
        <ul>
          <li>Datos de contacto: nombre, teléfono y email.</li>
          <li>Datos de la vivienda o local: tipo de reforma, superficie, zona, fotos y comentarios que nos envíes.</li>
          <li>Datos de la obra: dirección, fases, partes de trabajo, fotos, órdenes de cambio con tu firma y pagos.</li>
          <li>Datos del equipo: nombre, teléfono, oficio, fichajes y partes de trabajo.</li>
        </ul>
        <h2>3. Finalidades y base legal</h2>
        <ul>
          <li><b>Gestión de solicitudes de presupuesto:</b> contactarte, visitar la vivienda y preparar la oferta. Base legal: tu consentimiento y la aplicación de medidas precontractuales a petición tuya (art. 6.1.a y 6.1.b RGPD).</li>
          <li><b>Ejecución de obras:</b> planificar, ejecutar y facturar la reforma, gestionar cambios y cobros. Base legal: ejecución del contrato (art. 6.1.b) y cumplimiento de obligaciones legales fiscales y contables (art. 6.1.c).</li>
          <li><b>Portal del cliente:</b> mostrarte el avance, el diario de obra, los documentos y los pagos de tu reforma. Base legal: ejecución del contrato (art. 6.1.b).</li>
          <li><b>Área de equipo:</b> organizar el trabajo, registrar la jornada y la actividad en obra. Base legal: relación laboral o mercantil y obligación legal de registro de jornada (art. 6.1.b y 6.1.c).</li>
        </ul>
        <h2>4. Conservación</h2>
        <p>Las solicitudes que no se conviertan en obra se conservan un máximo de 12 meses. Los datos de obras y clientes se conservan mientras dure la relación y, después, durante los plazos legales: 6 años para la documentación contable y fiscal, 4 años para el registro de jornada y 10 años para la responsabilidad por defectos de construcción.</p>
        <h2>5. Destinatarios</h2>
        <p>No cedemos tus datos a terceros salvo obligación legal (Administración tributaria, juzgados) o cuando sea necesario para ejecutar la obra (gremios y proveedores que intervienen, con el contrato de encargo correspondiente). No hay transferencias internacionales de datos.</p>
        <h2>6. Dónde se guardan</h2>
        <p>La información del área de clientes y equipo se guarda en el almacenamiento del propio navegador del dispositivo con el que se accede. Recomendamos no usar dispositivos compartidos y cerrar la sesión al terminar.</p>
        <h2>7. Tus derechos</h2>
        <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar tu consentimiento en cualquier momento, escribiendo a <a href={`mailto:${e.email}`}>{e.email}</a> o por correo postal a {e.direccion}, indicando el derecho que ejerces y acompañando un documento que acredite tu identidad. Responderemos en el plazo de un mes.</p>
        <h2>8. Reclamación ante la autoridad de control</h2>
        <p>Si consideras que no hemos atendido correctamente tus derechos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD), C/ Jorge Juan 6, 28001 Madrid, en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.</p>
      </>}
    </PaginaLegal>
  ),
});
