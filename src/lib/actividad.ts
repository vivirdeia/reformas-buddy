import type { DB, FaseTipo, Obra } from "./types";
import { addDias, diaSemana, hoyISO, ts } from "./fechas";

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=60`;

const FOTOS: Record<FaseTipo, string[]> = {
  demolicion: ["photo-1503387762-592deb58ef4e", "photo-1504307651254-35680f356dfd", "photo-1541888946425-d81bb19240f5"],
  fontaneria: ["photo-1585704032915-c3400ca199e7", "photo-1607472586893-edb57bdc0e39", "photo-1581244277943-fe4a9c777189"],
  electricidad: ["photo-1621905251189-08b45d6a269e", "photo-1581092160562-40aa08e78837", "photo-1504307651254-35680f356dfd"],
  alicatado: ["photo-1584622650111-993a426fbf0a", "photo-1620626011761-996317b8d101", "photo-1552321554-5fefe8c9ef14"],
  carpinteria: ["photo-1556909114-f6e7ad7d3136", "photo-1600585154340-be6161a56a0c", "photo-1484154218962-a197022b5858"],
  pintura: ["photo-1562259949-e8e7689d7828", "photo-1589939705384-5185137a7f0f", "photo-1513694203232-719a280e022f"],
  limpieza: ["photo-1502005229762-cf1b2da7c5d6", "photo-1560448204-e02f11c3d0e2", "photo-1513694203232-719a280e022f"],
};

const TXT: Record<FaseTipo, string[]> = {
  demolicion: [
    "Picado de alicatado en cocina y baño. Retirada de sanitarios y bajada de escombro en sacas al contenedor.",
    "Demolición de tabique entre cocina y salón según plano. Apeo provisional revisado por el jefe de obra.",
    "Levantado de tarima y rodapiés en dormitorios. Retirada de falso techo de escayola en pasillo.",
    "Limpieza de escombro y protección de zonas comunes (ascensor y portal). Último contenedor retirado.",
  ],
  fontaneria: [
    "Rozas para nueva red de agua fría y caliente en multicapa. Replanteo de tomas de cocina con el cliente.",
    "Montaje de colectores y tomas de baño principal. Prueba de presión a 10 bar durante 2 h: correcta.",
    "Sustitución de desagües por PVC Ø40 y conexión a bajante. Colocación de plato de ducha extraplano.",
  ],
  electricidad: [
    "Rozas y tubo corrugado para nuevos circuitos de cocina (horno, placa y lavavajillas).",
    "Cableado de dormitorios y salón. Colocación de cajas de mecanismos a 1,10 m.",
    "Montaje del nuevo cuadro con 9 circuitos y diferenciales superinmunizados. Tapado de rozas con yeso.",
  ],
  alicatado: [
    "Alicatado de paredes de baño en porcelánico 30x60 rectificado. Nivelación con crucetas de 2 mm.",
    "Solado de cocina con porcelánico imitación madera. Recrecido previo de 2 cm con mortero autonivelante.",
    "Rejuntado con junta epoxi en zona de ducha y colocación de perfiles de acero inox en esquinas.",
  ],
  carpinteria: [
    "Montaje de premarcos y puertas lacadas en blanco. Ajuste de bisagras y manillas.",
    "Instalación de muebles bajos de cocina y nivelación. Medición de encimera para la marmolería.",
    "Colocación de armario empotrado en dormitorio principal y rodapiés lacados.",
  ],
  pintura: [
    "Lijado y emplastecido de paredes. Imprimación selladora en todo el piso.",
    "Primera mano de plástico mate color blanco roto en salón y dormitorios.",
    "Segunda mano y remates de pintura en techos. Protección de suelos retirada en dormitorios.",
  ],
  limpieza: [
    "Limpieza fina de obra: cristales, carpinterías, suelos y sanitarios. Retirada de protecciones.",
    "Repaso de remates detectados en la visita con el cliente. Revisión de mecanismos y grifería.",
  ],
};

const TAREAS: Record<FaseTipo, string[]> = {
  demolicion: ["Picar alicatado del baño pequeño", "Bajar sacas de escombro al contenedor", "Retirar falso techo del pasillo", "Proteger portal y ascensor"],
  fontaneria: ["Terminar tomas del baño principal", "Prueba de presión de la red de agua", "Conectar desagüe de fregadero", "Colocar plato de ducha"],
  electricidad: ["Tirar cable a circuitos de cocina", "Colocar cajas de mecanismos en salón", "Tapar rozas del dormitorio 2", "Etiquetar circuitos del cuadro"],
  alicatado: ["Alicatar pared de ducha", "Solar cocina (zona office)", "Rejuntar baño principal", "Colocar perfiles inox en esquinas"],
  carpinteria: ["Montar puertas de dormitorios", "Nivelar muebles bajos de cocina", "Ajustar armario empotrado", "Colocar rodapiés del salón"],
  pintura: ["Emplastecer pasillo", "Primera mano en salón", "Remates en techos de cocina", "Retirar protecciones de suelo"],
  limpieza: ["Limpieza de cristales y carpinterías", "Revisar grifería y mecanismos", "Repaso de juntas en baño", "Retirada final de protecciones"],
};

function faseEn(o: Obra, d: string): FaseTipo | null {
  for (const f of o.fases) if (f.inicioReal && d >= f.inicioReal && (!f.finReal || d <= f.finReal)) return f.tipo;
  return null;
}
const mins = (a: string, b: string) => { const [h1, m1] = a.split(":").map(Number); const [h2, m2] = b.split(":").map(Number); return h2 * 60 + m2 - (h1 * 60 + m1); };
const pad = (n: number) => String(n).padStart(2, "0");

/** Genera partes diarios, fichajes de los últimos 15 días laborables y tareas de hoy. */
export function generarActividad(db: DB) {
  const hoy = hoyISO();
  const dias: string[] = [];
  for (let d = addDias(hoy, -1); dias.length < 15; d = addDias(d, -1)) if (![0, 6].includes(diaSemana(d))) dias.unshift(d);

  const activas = db.obras.filter((o) => o.estado !== "terminada");
  const ops = db.usuarios.filter((x) => x.rol === "operario").map((x) => x.id);

  dias.forEach((d, di) => {
    const enMarcha = activas.filter((o) => faseEn(o, d));
    const asign: Record<string, string[]> = {};
    ops.forEach((op, oi) => {
      const c = enMarcha.filter((o) => o.equipo.operarioIds.includes(op));
      if (!c.length || (di + oi) % 11 === 0) return; // algún día de ausencia
      (asign[c[(di + oi) % c.length].id] ??= []).push(op);
    });
    const viernes = diaSemana(d) === 5;
    enMarcha.forEach((o, k) => {
      const pres = asign[o.id] ?? [];
      if (!pres.length) return;
      const fase = faseEn(o, d)!;
      let m = 0;
      pres.forEach((op, j) => {
        const ent = j % 2 ? "08:15" : "08:00";
        const sal = viernes ? "15:00" : j % 2 ? "16:45" : "16:30";
        db.fichajes.push({ id: `f-${op}-${d}`, userId: op, obraId: o.id, entrada: ts(d, ent), salida: ts(d, sal) });
        m += mins(ent, sal) - (viernes ? 0 : 30); // media hora de comida
      });
      const jefeObras = enMarcha.filter((x) => x.equipo.jefeId === o.equipo.jefeId);
      const idx = jefeObras.indexOf(o);
      if ((di + idx) % 2 === 0) {
        const h = 9 + idx * 2;
        db.fichajes.push({ id: `f-${o.equipo.jefeId}-${o.id}-${d}`, userId: o.equipo.jefeId, obraId: o.id, entrada: ts(d, `${pad(h)}:00`), salida: ts(d, `${pad(h + 1)}:30`) });
      }
      const t = TXT[fase];
      const pool = FOTOS[fase];
      const nf = (di + k) % 3 === 0 ? 2 : 1;
      o.partesDiarios.push({
        id: `p-${o.id}-${d}`, fecha: d, autorId: di % 3 === 1 ? pres[0] : o.equipo.jefeId,
        horas: Math.round((m / 60) * 10) / 10, operarioIds: pres, trabajos: t[(di + k) % t.length],
        fotos: Array.from({ length: nf }, (_, i) => u(pool[(di + k + i) % pool.length])), fase,
      });
    });
  });

  activas.forEach((o) => {
    const f = o.fases.find((x) => x.estado === "en_curso" || x.estado === "bloqueada");
    if (!f) return;
    TAREAS[f.tipo].forEach((titulo, i) => db.tareas.push({
      id: `t-${o.id}-${i}`, obraId: o.id, fecha: hoy, titulo, fase: f.tipo,
      operarioId: o.equipo.operarioIds[i % o.equipo.operarioIds.length], hecha: i === 0, hechaEn: i === 0 ? ts(hoy, "09:10") : undefined, creadaPor: o.equipo.jefeId,
    }));
  });

  db.obras.find((o) => o.id === "o-3")?.incidencias.push({
    id: "i-o3-1", fecha: dias[4], titulo: "Humedad en pared medianera del baño", descripcion: "Al picar aparece mancha de humedad por filtración del vecino. Se avisó al seguro de la comunidad y se reparó la tubería.",
    gravedad: "media", estado: "resuelta", autorId: "u-op2", fotos: [u(FOTOS.demolicion[0])],
  });
}
