import type { DB, Fase, FaseTipo, Obra } from "./types";
import { generarActividad } from "./actividad";
import { addDias, hoyISO } from "./fechas";

/** Versión del modelo de datos. Al subirla, añade su migración en store.ts. */
export const DB_VERSION = 8;

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
  notas: [], incidencias: [], ordenesCambio: [], partesDiarios: [], hitos: [], documentos: [], antesDespues: [], pagos: [], costes: { materiales: 0, gremios: 0 }, horario: "Lunes a viernes de 8:00 a 17:00 · Trabajos ruidosos de 9:00 a 14:00", ...o,
});

const fin = (inicio: string) => add(inicio, FASES.reduce((s, f) => s + f.dias, 0) - 1);

export function createSeed(): DB {
  const hoy = hoyISO();
  const S = (n: number) => addDias(hoy, -n);
  const db: DB = {
    version: DB_VERSION, fichajes: [], tareas: [],
    solicitudes: [
      { id: "s-1", fecha: new Date(Date.now() - 2 * 3600e3).toISOString(), tipo: "Reforma integral de piso", m2: 85, zona: "Chamberí · 28010", inicio: addDias(hoy, 60), rango: "40.000 – 70.000 €", fotos: [img("photo-1503387762-592deb58ef4e"), img("photo-1581858726788-75bc0f6a952d")], nombre: "Laura Benítez", telefono: "644 218 905", email: "laura.benitez@gmail.com", comentario: "Piso de los años 60, queremos tirar un tabique para abrir la cocina al salón.", estado: "nueva" },
      { id: "s-2", fecha: new Date(Date.now() - 20 * 3600e3).toISOString(), tipo: "Baño", m2: 6, zona: "Moratalaz · 28030", inicio: addDias(hoy, 30), rango: "Menos de 15.000 €", fotos: [img("photo-1504307651254-35680f356dfd")], nombre: "Andrés Pineda", telefono: "678 330 412", email: "apineda@hotmail.es", comentario: "Cambiar bañera por plato de ducha.", estado: "nueva" },
      { id: "s-3", fecha: S(2) + "T09:40:00.000Z", tipo: "Cocina", m2: 14, zona: "Retiro · 28009", inicio: addDias(hoy, 45), rango: "15.000 – 40.000 €", fotos: [], nombre: "Sofía Lozano", telefono: "699 104 223", email: "sofia.lozano@outlook.es", estado: "contactada", notas: "Llamada hecha. Prefiere visita por la tarde." },
      { id: "s-4", fecha: S(5) + "T17:15:00.000Z", tipo: "Local comercial", m2: 140, zona: "Malasaña · 28004", inicio: addDias(hoy, 21), rango: "Más de 70.000 €", fotos: [img("photo-1541888946425-d81bb19240f5")], nombre: "Hugo Marín (Panadería Masa Madre)", telefono: "910 223 548", email: "hugo@masamadre.es", comentario: "Necesitamos licencia de actividad y obrador visto desde la calle.", estado: "visita", notas: "Visita agendada el jueves a las 10:00 con Raúl." },
      { id: "s-5", fecha: S(9) + "T11:05:00.000Z", tipo: "Reforma integral de piso", m2: 110, zona: "Salamanca · 28006", inicio: addDias(hoy, 40), rango: "40.000 – 70.000 €", fotos: [], nombre: "Teresa Villalba", telefono: "655 908 117", email: "tvillalba@gmail.com", estado: "presupuestada", notas: "Presupuesto enviado: 62.400 €. Seguimiento el lunes." },
      { id: "s-6", fecha: S(25) + "T10:00:00.000Z", tipo: "Baño", m2: 5, zona: "Usera · 28026", inicio: S(5), rango: "Menos de 15.000 €", fotos: [], nombre: "Rubén Ortiz", telefono: "633 772 019", email: "rortiz@yahoo.es", estado: "perdida", notas: "Ha elegido otra empresa por precio." },
    ],
    costeHora: { "Jefe de obra": 32, "Oficial de 1ª": 26, "Albañil": 23, "Peón": 18, "Pintor": 22 },
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
        m2: 95, presupuesto: 68500, fechaInicio: S(3), fechaFinPrevista: fin(S(3)), estado: "en_plazo",
        portada: img("photo-1581858726788-75bc0f6a952d"), fases: fases(S(3), 0),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op2", "u-op4"], gremioIds: ["g-1", "g-2", "g-3"] },
        notas: [{ id: "n1", autorId: "u-jefe1", fecha: S(3), texto: "Comunidad avisada. Contenedor autorizado hasta el 26/10. Horario de ruidos: 9:00 a 14:00." }],
      }),
      base({
        id: "o-2", nombre: "Reforma cocina y baños en Salamanca", clienteId: "c-2", direccion: "C/ de Lagasca 58, 2º izda.", barrio: "Salamanca",
        m2: 120, presupuesto: 54200, fechaInicio: S(13), fechaFinPrevista: fin(S(13)), estado: "en_riesgo",
        portada: img("photo-1584622650111-993a426fbf0a"), fases: fases(S(13), 1, 2),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op1", "u-op3"], gremioIds: ["g-1", "g-2"] },
        incidencias: [{ id: "i1", fecha: S(2), titulo: "Bajante de fibrocemento en baño principal", descripcion: "Aparece bajante comunitaria de fibrocemento. Requiere empresa RERA y aviso al administrador.", gravedad: "alta", estado: "abierta", autorId: "u-op1", fotos: [] }],
        notas: [{ id: "n2", autorId: "u-jefe1", fecha: S(2), texto: "Pendiente respuesta del administrador de fincas (Gestión Lagasca) sobre la bajante." }],
      }),
      base({
        id: "o-3", nombre: "Reforma integral piso Lavapiés", clienteId: "c-3", direccion: "C/ del Ave María 31, 4º A", barrio: "Embajadores",
        m2: 68, presupuesto: 41800, fechaInicio: S(43), fechaFinPrevista: fin(S(43)), estado: "retrasada",
        portada: img("photo-1503387762-592deb58ef4e"), fases: fases(S(43), 3, 12),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op2", "u-op6"], gremioIds: ["g-1", "g-2"] },
        notas: [{ id: "n3", autorId: "u-jefe2", fecha: S(7), texto: "Retraso por rotura de stock del porcelánico elegido (Porcelanosa). Llega el 20/10. Cliente informada." }],
      }),
      base({
        id: "o-4", nombre: "Reforma piso Retiro con ampliación de baño", clienteId: "c-4", direccion: "C/ de Ibiza 27, 5º D", barrio: "Retiro",
        m2: 88, presupuesto: 47600, fechaInicio: S(32), fechaFinPrevista: fin(S(32)), estado: "en_plazo",
        portada: img("photo-1556909114-f6e7ad7d3136"), fases: fases(S(32), 3),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op1", "u-op5"], gremioIds: ["g-1", "g-2", "g-3"] },
      }),
      base({
        id: "o-5", nombre: "Reforma integral ático Malasaña", clienteId: "c-5", direccion: "C/ del Espíritu Santo 19, ático", barrio: "Universidad",
        m2: 74, presupuesto: 58900, fechaInicio: S(57), fechaFinPrevista: fin(S(57)), estado: "en_plazo",
        portada: img("photo-1502005229762-cf1b2da7c5d6"), fases: fases(S(57), 6),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op5", "u-op6"], gremioIds: ["g-3", "g-5"] },
        notas: [{ id: "n5", autorId: "u-jefe1", fecha: S(1), texto: "Repaso de remates de pintura hecho. Limpieza final el jueves y entrega de llaves el viernes." }],
      }),
      base({
        id: "o-6", nombre: "Adecuación local cafetería en Ponzano", tipo: "local", clienteId: "c-6", direccion: "C/ de Ponzano 44, local", barrio: "Chamberí",
        m2: 110, presupuesto: 94500, fechaInicio: S(120), fechaFinPrevista: fin(S(120)), estado: "terminada",
        portada: img("photo-1554118811-1e0d58224f24"), fases: fases(S(120), 7),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op1", "u-op2", "u-op3"], gremioIds: ["g-1", "g-2", "g-4", "g-5"] },
        notas: [{ id: "n6", autorId: "u-gerente", fecha: S(56), texto: "Obra entregada. Licencia de actividad concedida. Garantía hasta 08/2027." }],
      }),
      base({
        id: "o-7", nombre: "Reforma piso Arganzuela", clienteId: "c-7", direccion: "Paseo de las Delicias 85, 1º C", barrio: "Arganzuela",
        m2: 82, presupuesto: 36400, fechaInicio: S(21), fechaFinPrevista: fin(S(21)), estado: "en_plazo",
        portada: img("photo-1484154218962-a197022b5858"), fases: fases(S(21), 2),
        equipo: { jefeId: "u-jefe1", operarioIds: ["u-op3", "u-op4"], gremioIds: ["g-2"] },
      }),
      base({
        id: "o-8", nombre: "Reforma baño y cocina en Tetuán", clienteId: "c-8", direccion: "C/ de Bravo Murillo 301, 6º A", barrio: "Tetuán",
        m2: 60, presupuesto: 18900, fechaInicio: S(43), fechaFinPrevista: fin(S(43)), estado: "en_plazo",
        portada: img("photo-1560448204-e02f11c3d0e2"), fases: fases(S(43), 4),
        equipo: { jefeId: "u-jefe2", operarioIds: ["u-op5", "u-op6"], gremioIds: ["g-1", "g-3"] },
      }),
    ],
  };
  generarActividad(db);
  return db;
}
