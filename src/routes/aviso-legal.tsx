import { createFileRoute } from "@tanstack/react-router";
import { legalHead, PaginaLegal, Titular } from "@/components/legal";

export const Route = createFileRoute("/aviso-legal")({
  staticData: { sitemap: true },
  head: () => legalHead("Aviso legal", "Aviso legal de Reformas Arnal: datos del titular, condiciones de uso de la web y propiedad intelectual.", "/aviso-legal"),
  component: () => (
    <PaginaLegal titulo="Aviso legal">
      {(e) => <>
        <h2>1. Datos identificativos</h2>
        <p>En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
        <Titular e={e} />
        <h2>2. Objeto</h2>
        <p>Este sitio web informa sobre los servicios de reformas integrales de {e.nombreComercial}, permite solicitar presupuestos y da acceso al área privada de clientes y equipo, donde se realiza el seguimiento de las obras.</p>
        <h2>3. Condiciones de uso</h2>
        <p>El acceso a la web es gratuito y supone la aceptación de este aviso legal. La persona usuaria se compromete a hacer un uso adecuado de los contenidos, a no emplearlos para actividades ilícitas y a no dañar los sistemas de {e.razonSocial} ni de terceros.</p>
        <h2>4. Propiedad intelectual e industrial</h2>
        <p>Los textos, diseños, logotipos y demás contenidos de la web pertenecen a {e.razonSocial} o a sus licenciantes. Las fotografías de terceros se usan con su licencia correspondiente. Queda prohibida su reproducción o distribución sin autorización.</p>
        <h2>5. Responsabilidad</h2>
        <p>{e.razonSocial} procura que la información sea correcta y esté actualizada, pero no garantiza la ausencia de errores ni la disponibilidad continua de la web. Los precios orientativos no son vinculantes hasta la firma del presupuesto.</p>
        <h2>6. Enlaces</h2>
        <p>La web puede incluir enlaces a sitios de terceros. {e.razonSocial} no se responsabiliza de sus contenidos ni de sus políticas.</p>
        <h2>7. Legislación y jurisdicción</h2>
        <p>Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Madrid, salvo que la normativa de consumidores establezca otro fuero.</p>
      </>}
    </PaginaLegal>
  ),
});
