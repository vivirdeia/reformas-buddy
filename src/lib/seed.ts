import type { DB, Fase, FaseTipo, Obra } from "./types";
import { generarActividad } from "./actividad";

export const FASES: { tipo: FaseTipo; nombre: string; dias: number }[] = [
  { tipo: "demolicion", nombre: "Demolición", dias: 7 },
  { tipo: "fontaneria", nombre: "Fontanería", dias: 10 },
  { tipo: "electricidad", nombre: "Electricidad", dias: 9 },
  { tipo: "alicatado", nombre: "Alicatado", dias: 12 },
  { tipo: "carpinteria", nombre: "Carpintería", dias: 10 },
  { tipo: "pintura", nombre: "Pintura", dias: 8 },
  { tipo: "limpieza", nombre: "Limpieza final", dias: 3 },
];

const add = (iso: string, d: number) => {
  const x = new Date(iso + "T12:00:00");
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

/** actual: índice de la fase en curso (7 = todas completadas). retraso: días acumulados. */
function fases(inicio: string, actual: number, retraso = 0, bloqueada = false): Fase[] {
  let cursor = inicio;
  let real = inicio;
  return FASES.map((f, i) => {
    const ip = cursor;
    const fp = add(ip, f.dias - 1);
    cursor = add(fp, 1);
    const extra = Math.round((retraso * (i + 1)) / Math.max(actual, 1));
    const fase: Fase = { tipo: f.tipo, inicioPrevisto: ip, finPrevisto: fp, estado: "pendiente" };
    if (i < actual) {
      fase.inicioReal = real;
      fase.finReal = add(fp, Math.min(extra, retraso));
      real = add(fase.finReal, 1);
      fase.estado = "completada";
    } else if (i === actual) {
      fase.inicioReal = real;
      fase.estado = bloqueada ? "bloqueada" : "en_curso";
    }
    return fase;
  });
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

const base = (o: Partial<Obra> & Pick<Obra, "id">): Obra => ({
  nombre: "", tipo: "piso", clienteId: "", direccion: "", barrio: "", m2: 80, presupuesto: 0,
  fechaInicio: "", fechaFinPrevista: "", estado: "en_plazo", portada: "", fases: [],
  equipo: { jefeId: "u-jefe1", operarioIds: [], gremioIds: [] },
  notas: [], incidencias: [], ordenesCambio: [], partesDiarios: [], hitos: [], documentos: [], antesDespues: [], horario: "Lunes a viernes de 8:00 a 17:00 · Trabajos ruidosos de 9:00 a 14:00", ...o,
});

const fin = (inicio: string) => add(inicio, FASES.reduce((s, f) => s + f.dias, 0) - 1);

export function createSeed(): DB {
  const db: DB = {
    version: 3, fichajes: [], tareas: [],
    usuarios: [
      { id: "u-gerente", nombre: "Javier Arnal", rol: "gerente", pin: "1111", telefono: "600 112 233", email: "javier@reformasarnal.es" },
      { id: "u-jefe1", nombre: "Marta Ruiz", rol: "jefe_obra", pin: "2222", telefono: "611 204 518" },
      { id: "u-jefe2", nombre: "Raúl Moreno", rol: "jefe_obra", pin: "2233", telefono: "622 307 914" },
      { id: "u-op1", nombre: "Antonio Gil", rol: "operario", pin: "3333", telefono: "633 401 112", oficio: "Oficial de 1ª" },
      { id: "u-op2", nombre: "Iván Castro", rol: "operario", pin: "3344", telefono: "633 401 245", oficio: "Albañil" },
      { id: "u-op3", nombre: "Florin Popescu", rol: "operario", pin: "3355", telefono: "633 401 378", oficio: "Albañil" },
      { id: "u-op4", nombre: "Diego Navarro", rol: "operario", pin: "3366", telefono: "633 401 491", oficio: "Peón" },
      { id: "u-op5", nombre: "Youssef El Amrani", rol: "operario", pin: "3377", telefono: "633 401 534", oficio: "Pintor" },
      { id: "u-op6", nombre: "Sergio Prieto", rol: "operario", pin: "3388", telefono: "633 401 667", oficio: "Peón" },
      { id: "c-1", nombre: "Lucía Fernández", rol: "cliente", pin: "4444", telefono: "655 210 330", obraId: "o-1" },
      { id: "c-2", nombre: "Pablo y Elena Martín", rol: "cliente", pin: "4455", telefono: "655 341 902", obraId: "o-2" },
      { id: "c-3", nombre: "Carmen Sánchez Ortega", rol: "cliente", pin: "4466", telefono: "655 778 120", obraId: "o-3" },
      { id: "c-4", nombre: "Alberto Gómez", rol: "cliente", pin: "4477", telefono: "655 902 455", obraId: "o-4" },
      { id: "c-5", nombre: "Isabel Romero", rol: "cliente", pin: "4488", telefono: "655 118 674", obraId: "o-5" },
      { id: "c-6", nombre: "Café Olivar S.L.", rol: "cliente", pin: "4499", telefono: "915 432 190", obraId: "o-6" },
      { id: "c-7", nombre: "Miguel Á. Herrero", rol: "cliente", pin: "4400", telefono: "655 667 231", obraId: "o-7" },
      { id: "c-8", nombre: "Nuria Delgado", rol: "cliente", pin: "4411", telefono: "655 553 879", obraId: "o-8" },
    ],
    gremios: [
      { id: "g-1", oficio: "Fontanería", empresa: "Fontanería Hnos. Lozano", contacto: "Paco Lozano", telefono: "644 120 330" },
      { id: "g-2", oficio: "Electricidad", empresa: "Electro Vallecas", contacto: "Rubén Sanz", telefono: "644 230 441" },
      { id: "g-3", oficio: "Carpintería", empresa: "Carpintería Ebanis", contacto: "Luis Ortega", telefono: "644 340 552" },
      { id: "g-4", oficio: "Climatización", empresa: "Clima Norte Madrid", contacto: "Ana Pérez", telefono: "644 450 663" },
      { id: "g-5", oficio: "Cristalería", empresa: "Cristalería Tetuán", contacto: "José Ramos", telefono: "644 560 774" },
    ],
    obras: [
      base({
        id: "o-1", nombre: "Reforma integral piso Chamberí", clienteId: "c-1", direccion: "C/ de Fuencarral 142, 3º B", barrio: "Chamberí",
        m2: 95, presupuesto: 68500, fechaInicio: "2026-10-12", fechaFinPrevista: fin("2026-10-12"), estado: "en_plazo",
        portada: img("photo-1581858726788-75bc0f6a952d"), fases: fases("2026-10-12", 0),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op2", "u-op4"], gremioIds: ["g-1", "g-2", "g-3"] },
        notas: [{ id: "n1", autorId: "u-jefe1", fecha: "2026-10-12", texto: "Comunidad avisada. Contenedor autorizado hasta el 26/10. Horario de ruidos: 9:00 a 14:00." }],
      }),
      base({
        id: "o-2", nombre: "Reforma cocina y baños en Salamanca", clienteId: "c-2", direccion: "C/ de Lagasca 58, 2º izda.", barrio: "Salamanca",
        m2: 120, presupuesto: 54200, fechaInicio: "2026-09-21", fechaFinPrevista: fin("2026-09-21"), estado: "en_riesgo",
        portada: img("photo-1584622650111-993a426fbf0a"), fases: fases("2026-09-21", 1, 2),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op1", "u-op3"], gremioIds: ["g-1", "g-2"] },
        incidencias: [{ id: "i1", fecha: "2026-10-13", titulo: "Bajante de fibrocemento en baño principal", descripcion: "Aparece bajante comunitaria de fibrocemento. Requiere empresa RERA y aviso al administrador.", gravedad: "alta", estado: "abierta", autorId: "u-op1", fotos: [] }],
        notas: [{ id: "n2", autorId: "u-jefe1", fecha: "2026-10-13", texto: "Pendiente respuesta del administrador de fincas (Gestión Lagasca) sobre la bajante." }],
      }),
      base({
        id: "o-3", nombre: "Reforma integral piso Lavapiés", clienteId: "c-3", direccion: "C/ del Ave María 31, 4º A", barrio: "Embajadores",
        m2: 68, presupuesto: 41800, fechaInicio: "2026-08-24", fechaFinPrevista: fin("2026-08-24"), estado: "retrasada",
        portada: img("photo-1503387762-592deb58ef4e"), fases: fases("2026-08-24", 3, 12),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op2", "u-op6"], gremioIds: ["g-1", "g-2"] },
        notas: [{ id: "n3", autorId: "u-jefe2", fecha: "2026-10-08", texto: "Retraso por rotura de stock del porcelánico elegido (Porcelanosa). Llega el 20/10. Cliente informada." }],
      }),
      base({
        id: "o-4", nombre: "Reforma piso Retiro con ampliación de baño", clienteId: "c-4", direccion: "C/ de Ibiza 27, 5º D", barrio: "Retiro",
        m2: 88, presupuesto: 47600, fechaInicio: "2026-08-31", fechaFinPrevista: fin("2026-08-31"), estado: "en_plazo",
        portada: img("photo-1556909114-f6e7ad7d3136"), fases: fases("2026-08-31", 3),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op1", "u-op5"], gremioIds: ["g-1", "g-2", "g-3"] },
        ordenesCambio: [{ id: "oc1", fecha: "2026-10-14", titulo: "Suelo radiante en baño ampliado", descripcion: "El cliente solicita suelo radiante eléctrico en el baño principal (6 m²) con termostato wifi.", importe: 1850, diasExtra: 2, estado: "pendiente", solicitadaPor: "u-jefe2" }],
      }),
      base({
        id: "o-5", nombre: "Reforma integral ático Malasaña", clienteId: "c-5", direccion: "C/ del Espíritu Santo 19, ático", barrio: "Universidad",
        m2: 74, presupuesto: 58900, fechaInicio: "2026-07-27", fechaFinPrevista: fin("2026-07-27"), estado: "en_plazo",
        portada: img("photo-1502005229762-cf1b2da7c5d6"), fases: fases("2026-07-27", 6),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op5", "u-op6"], gremioIds: ["g-3", "g-5"] },
        notas: [{ id: "n5", autorId: "u-jefe1", fecha: "2026-10-14", texto: "Repaso de remates de pintura hecho. Limpieza final el jueves y entrega de llaves el viernes." }],
      }),
      base({
        id: "o-6", nombre: "Adecuación local cafetería en Ponzano", tipo: "local", clienteId: "c-6", direccion: "C/ de Ponzano 44, local", barrio: "Chamberí",
        m2: 110, presupuesto: 94500, fechaInicio: "2026-06-15", fechaFinPrevista: fin("2026-06-15"), estado: "terminada",
        portada: img("photo-1554118811-1e0d58224f24"), fases: fases("2026-06-15", 7),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op1", "u-op2", "u-op3"], gremioIds: ["g-1", "g-2", "g-4", "g-5"] },
        notas: [{ id: "n6", autorId: "u-gerente", fecha: "2026-08-20", texto: "Obra entregada. Licencia de actividad concedida. Garantía hasta 08/2027." }],
      }),
      base({
        id: "o-7", nombre: "Reforma piso Arganzuela", clienteId: "c-7", direccion: "Paseo de las Delicias 85, 1º C", barrio: "Arganzuela",
        m2: 82, presupuesto: 36400, fechaInicio: "2026-09-14", fechaFinPrevista: fin("2026-09-14"), estado: "en_plazo",
        portada: img("photo-1484154218962-a197022b5858"), fases: fases("2026-09-14", 2),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op3", "u-op4"], gremioIds: ["g-2"] },
      }),
      base({
        id: "o-8", nombre: "Reforma baño y cocina en Tetuán", clienteId: "c-8", direccion: "C/ de Bravo Murillo 301, 6º A", barrio: "Tetuán",
        m2: 60, presupuesto: 18900, fechaInicio: "2026-09-07", fechaFinPrevista: fin("2026-09-07"), estado: "en_plazo",
        portada: img("photo-1560448204-e02f11c3d0e2"), fases: fases("2026-09-07", 4),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op5", "u-op6"], gremioIds: ["g-1", "g-3"] },
      }),
    ],
  };
  generarActividad(db);
  return db;
}
