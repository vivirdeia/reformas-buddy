import { Bath, Building2, Camera, ClipboardList, FileSignature, Hammer, Home, KeyRound, Paintbrush, ShieldCheck, Sofa, Wallet, Wrench, ChefHat, Zap, Ruler } from "lucide-react";
import type { DB, Web } from "./types";

export const ICONOS = { home: Home, cocina: ChefHat, bano: Bath, local: Building2, lista: ClipboardList, firma: FileSignature, camara: Camera, llave: KeyRound, cartera: Wallet, escudo: ShieldCheck, martillo: Hammer, brocha: Paintbrush, llaveinglesa: Wrench, sofa: Sofa, rayo: Zap, regla: Ruler } as const;
export type Icono = keyof typeof ICONOS;
export const ICONO_LABEL: Record<Icono, string> = { home: "Casa", cocina: "Cocina", bano: "Baño", local: "Local", lista: "Lista", firma: "Firma", camara: "Cámara", llave: "Llave", cartera: "Cartera", escudo: "Escudo", martillo: "Martillo", brocha: "Brocha", llaveinglesa: "Herramienta", sofa: "Sofá", rayo: "Electricidad", regla: "Regla" };
export const icono = (k: string) => ICONOS[k as Icono] ?? Home;

export const WEB_DEFECTO: Web = {
  hero: {
    insignia: "4,9/5 en más de 300 opiniones",
    titulo: "Tu reforma, sin sorpresas.",
    acento: "Síguela día a día desde el móvil.",
    texto: "Reformas integrales de pisos, cocinas, baños y locales en Madrid. Presupuesto cerrado, plazos por fase y un diario de obra con fotos que ves cada tarde.",
    ventajas: ["Visita gratuita", "Presupuesto en 5 días", "2 años de garantía"],
  },
  diferencial: {
    titulo: "Tu obra, en tu bolsillo. Todos los días.",
    texto: "Con Obria, nuestra app para clientes, dejas de preguntarte «¿cómo irá la obra?». Lo ves.",
    puntos: [
      { icono: "camara", t: "Progreso diario con fotos", d: "Cada tarde, tu jefe de obra publica lo que se ha hecho, con fotos de cada estancia." },
      { icono: "firma", t: "Cambios aprobados por escrito", d: "Cualquier extra llega con precio e IVA desglosado. Lo firmas desde el móvil antes de empezar." },
      { icono: "cartera", t: "Pagos siempre claros", d: "Sabes cuánto llevas pagado, qué falta y cuándo toca cada hito." },
    ],
  },
  servicios: {
    titulo: "Reformamos de principio a fin",
    texto: "Un único interlocutor para albañilería, fontanería, electricidad, carpintería y pintura.",
    items: [
      { icono: "home", t: "Reforma integral de pisos", d: "Distribución, instalaciones nuevas, suelos, carpintería y pintura. Llave en mano." },
      { icono: "cocina", t: "Cocinas", d: "Diseño a medida, mobiliario, encimeras y electrodomésticos integrados." },
      { icono: "bano", t: "Baños", d: "Platos de ducha a ras de suelo, alicatados y fontanería renovada en 2–3 semanas." },
      { icono: "local", t: "Locales comerciales", d: "Adecuación para hostelería y comercio, con licencia de actividad incluida." },
    ],
  },
  galeria: { titulo: "Antes y después", texto: "Desliza para ver la transformación. Proyectos reales en Madrid.", mostrarEjemplos: true },
  pasos: {
    titulo: "Cuatro pasos, cero sorpresas",
    items: [
      { icono: "lista", t: "Visita y presupuesto", d: "Vamos a tu casa, medimos y en 5 días tienes un presupuesto cerrado y detallado por partidas." },
      { icono: "firma", t: "Firma y planificación", d: "Fijamos fechas por fase, equipo asignado y plan de pagos por hitos. Sin letra pequeña." },
      { icono: "camara", t: "Obra con seguimiento diario", d: "Cada día ves fotos y avances en Obria. Tu jefe de obra está a un WhatsApp." },
      { icono: "llave", t: "Entrega y garantía", d: "Repaso final contigo, limpieza profesional y 2 años de garantía por escrito." },
    ],
  },
  cifras: [
    { v: "18", l: "años reformando Madrid" }, { v: "640+", l: "reformas entregadas" },
    { v: "94 %", l: "entregadas en plazo" }, { v: "4,9/5", l: "valoración media" },
  ],
  testimonios: [
    { n: "Lucía F.", b: "Chamberí", t: "Reforma integral de piso", q: "Vivía fuera de Madrid y aun así sabía cada día qué se había hecho. Las fotos del diario de obra me daban una tranquilidad enorme." },
    { n: "Óscar y Ana", b: "Arganzuela", t: "Cocina y baño", q: "Quisimos cambiar el plato de ducha a mitad de obra y nos llegó el cambio con precio al móvil. Firmamos en un minuto. Cero sustos." },
    { n: "Café Olivar", b: "Ponzano", t: "Local de hostelería", q: "Abrimos en la fecha prevista con la licencia de actividad lista. Marta y su equipo fueron impecables." },
  ],
  faq: [
    { q: "¿Cuánto dura una reforma integral?", a: "Un piso de 80–100 m² suele llevar entre 10 y 12 semanas. Un baño, 2–3 semanas y una cocina, 3–4. En el presupuesto te damos fechas por fase y en Obria ves si vamos en plazo." },
    { q: "¿Os encargáis de las licencias?", a: "Sí. Tramitamos la declaración responsable o licencia ante el Ayuntamiento de Madrid, el contenedor y los avisos a la comunidad. Está incluido en el presupuesto." },
    { q: "¿Cómo se paga la obra?", a: "Por hitos: 30 % a la firma, 30 % al terminar instalaciones, 30 % tras alicatado y carpintería y 10 % a la entrega. En la app ves siempre cuánto llevas pagado y lo pendiente." },
    { q: "¿Qué garantía tengo?", a: "Dos años de garantía sobre la obra ejecutada, además de la garantía de fabricante de materiales y electrodomésticos. Te lo dejamos por escrito en la entrega." },
    { q: "¿Y si quiero cambiar algo en mitad de la obra?", a: "Sin problema. Tu jefe de obra prepara una orden de cambio con el precio (IVA desglosado) y los días extra, si los hay. La revisas y la firmas desde el móvil antes de que empecemos." },
  ],
  cta: { titulo: "¿Empezamos tu reforma?", texto: "Cuéntanos qué tienes en mente en 2 minutos. Te llamamos en menos de 24 horas laborables para agendar la visita gratuita." },
  pie: "Reformas integrales en Madrid desde 2008. Seguimiento diario con Obria.",
};

export const webDe = (db: DB | null | undefined): Web => db?.web ?? WEB_DEFECTO;
