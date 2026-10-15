import type { DB, FaseTipo, Obra } from "./types";
import { vigente } from "./economia";
import { apuntesDesdeCostes, tarifaDe } from "./costes";
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

const CLI: Record<FaseTipo, string[]> = {
  demolicion: [
    "Hoy hemos empezado a dar forma a tu nueva casa: retiramos los azulejos antiguos de cocina y baño, con todo protegido para no molestar a los vecinos.",
    "Ya hemos abierto la cocina al salón, tal y como viste en los planos. ¡Se empieza a notar la amplitud!",
    "Hemos retirado los suelos y techos antiguos. La casa queda lista para las nuevas instalaciones.",
    "Día de orden y limpieza: hemos dejado la obra despejada y el portal protegido.",
  ],
  fontaneria: [
    "Estamos instalando las tuberías nuevas de agua. Hemos repasado contigo dónde irán los grifos de la cocina.",
    "Las tomas del baño ya están colocadas y hemos comprobado que no hay ni una fuga. Todo perfecto.",
    "Ya está colocado tu nuevo plato de ducha y los desagües renovados.",
  ],
  electricidad: [
    "Preparamos la instalación eléctrica de la cocina para el horno, la placa y el lavavajillas.",
    "Hemos llevado la luz a dormitorios y salón, con los enchufes justo donde los querías.",
    "Tu casa ya tiene un cuadro eléctrico nuevo y más seguro. Hemos tapado las rozas, listas para alicatar.",
  ],
  alicatado: [
    "¡Empieza la parte bonita! Ya se ve el nuevo azulejo en las paredes del baño.",
    "Hemos colocado el suelo de la cocina. El acabado madera queda precioso con la luz de la tarde.",
    "Hemos terminado las juntas de la ducha con un material especial que no deja pasar el agua.",
  ],
  carpinteria: [
    "Ya están colocadas las puertas nuevas. La casa empieza a parecer terminada.",
    "Llegaron los muebles de cocina y ya están montados. Hemos medido para la encimera.",
    "Montado el armario empotrado del dormitorio principal y los rodapiés.",
  ],
  pintura: [
    "Estamos preparando las paredes para que la pintura quede perfectamente lisa.",
    "Primera mano de pintura en salón y dormitorios. El blanco roto da mucha calidez.",
    "Segunda mano y últimos retoques de pintura. ¡Ya casi está!",
  ],
  limpieza: [
    "Limpieza a fondo de cristales, suelos y baños para que entres a estrenar.",
    "Hemos repasado los últimos detalles que vimos juntos en la visita. Todo listo para la entrega.",
  ],
};

function faseEn(o: Obra, d: string): FaseTipo | null {
  for (const f of o.fases) if (f.inicioReal && d >= f.inicioReal && (!f.finReal || d <= f.finReal)) return f.tipo;
  return null;
}
const mins = (a: string, b: string) => { const [h1 = 0, m1 = 0] = a.split(":").map(Number); const [h2 = 0, m2 = 0] = b.split(":").map(Number); return h2 * 60 + m2 - (h1 * 60 + m1); };
const pad = (n: number) => String(n).padStart(2, "0");

/** Genera partes diarios, fichajes de los últimos 15 días laborables y tareas de hoy. */
export function generarActividad(db: DB) {
  const hoy = hoyISO();
  const dias: string[] = [];
  const inicioMin = db.obras.map((o) => o.fechaInicio).sort()[0]!;
  for (let d = inicioMin; d < hoy; d = addDias(d, 1)) if (![0, 6].includes(diaSemana(d))) dias.push(d);
  const corte = dias[dias.length - 15]!;

  const activas = db.obras.filter((o) => o.estado !== "terminada");
  const ops = db.usuarios.filter((x) => x.rol === "operario").map((x) => x.id);

  dias.forEach((d, di) => {
    const enMarcha = db.obras.filter((o) => faseEn(o, d));
    const asign: Record<string, string[]> = {};
    ops.forEach((op, oi) => {
      const c = enMarcha.filter((o) => o.equipo.operarioIds.includes(op));
      if (!c.length || (di + oi) % 11 === 0) return; // algún día de ausencia
      (asign[c[(di + oi) % c.length]!.id] ??= []).push(op);
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
      if (d < corte || o.estado === "terminada") return;
      const t = TXT[fase];
      const pool = FOTOS[fase];
      const nf = (di + k) % 3 === 0 ? 2 : 1;
      o.partesDiarios.push({
        id: `p-${o.id}-${d}`, fecha: d, autorId: di % 3 === 1 ? pres[0]! : o.equipo.jefeId,
        horas: Math.round((m / 60) * 10) / 10, operarioIds: pres, trabajos: t[(di + k) % t.length]!,
        fotos: Array.from({ length: nf }, (_, i) => u(pool[(di + k + i) % pool.length]!)), fase,
        visibleCliente: (di + k) % 6 !== 2, resumenCliente: CLI[fase][(di + k) % CLI[fase].length],
      });
    });
  });

  activas.forEach((o) => {
    const f = o.fases.find((x) => x.estado === "en_curso" || x.estado === "bloqueada");
    if (!f) return;
    TAREAS[f.tipo].forEach((titulo, i) => db.tareas.push({
      id: `t-${o.id}-${i}`, obraId: o.id, fecha: hoy, titulo, fase: f.tipo,
      operarioId: o.equipo.operarioIds[i % o.equipo.operarioIds.length]!, hecha: i === 0, hechaEn: i === 0 ? ts(hoy, "09:10") : undefined, creadaPor: o.equipo.jefeId,
    }));
  });

  db.obras.forEach((o, i) => {
    const f = o.fechaInicio;
    o.documentos = [
      { id: `d-${o.id}-1`, nombre: "Presupuesto aprobado firmado.pdf", tipo: "presupuesto", fecha: addDias(f, -14), tamano: `${(380 + i * 37)} KB`, visibleCliente: true },
      { id: `d-${o.id}-2`, nombre: "Plano de distribución reformada.pdf", tipo: "plano", fecha: addDias(f, -10), tamano: `${(1.2 + i * 0.3).toFixed(1).replace(".", ",")} MB`, visibleCliente: true },
      { id: `d-${o.id}-3`, nombre: "Licencia de obra · Ayto. de Madrid.pdf", tipo: "certificado", fecha: addDias(f, -5), tamano: "214 KB", visibleCliente: true },
    ];
    if (o.estado === "terminada" || o.id === "o-5") o.documentos.push(
      { id: `d-${o.id}-4`, nombre: "Boletín eléctrico (CIE).pdf", tipo: "certificado", fecha: addDias(f, 30), tamano: "468 KB", visibleCliente: true },
      { id: `d-${o.id}-5`, nombre: "Certificado de gestión de residuos.pdf", tipo: "certificado", fecha: addDias(f, 12), tamano: "195 KB", visibleCliente: true },
    );
  });
  const ad = (id: string) => u(id);
  const o5 = db.obras.find((o) => o.id === "o-5");
  if (o5) o5.antesDespues = [
    { id: "ad-o-5-1", enLanding: true, estancia: "Salón", antes: ad("photo-1503387762-592deb58ef4e"), despues: ad("photo-1502005229762-cf1b2da7c5d6") },
    { id: "ad-o-5-2", enLanding: false, estancia: "Cocina", antes: ad("photo-1581858726788-75bc0f6a952d"), despues: ad("photo-1556909114-f6e7ad7d3136") },
    { id: "ad-o-5-3", enLanding: false, estancia: "Baño", antes: ad("photo-1504307651254-35680f356dfd"), despues: ad("photo-1584622650111-993a426fbf0a") },
  ];
  const o6 = db.obras.find((o) => o.id === "o-6");
  if (o6) o6.antesDespues = [
    { id: "ad-o-6-1", enLanding: true, estancia: "Sala principal", antes: ad("photo-1541888946425-d81bb19240f5"), despues: ad("photo-1554118811-1e0d58224f24") },
    { id: "ad-o-6-2", enLanding: false, estancia: "Barra", antes: ad("photo-1503387762-592deb58ef4e"), despues: ad("photo-1453614512568-c4024d13c247") },
  ];

  generarEconomia(db, hoy);
  if (![0, 6].includes(diaSemana(hoy))) ["u-op1", "u-op3", "u-op4", "u-op6"].forEach((op, i) => {
    const o = activas.find((x) => x.equipo.operarioIds.includes(op) && x.fases.some((f) => f.estado === "en_curso"));
    if (o) db.fichajes.push({ id: `f-${op}-${hoy}`, userId: op, obraId: o.id, entrada: ts(hoy, i % 2 ? "08:10" : "07:58") });
  });
  generarCostes(db);

  db.obras.find((o) => o.id === "o-3")?.incidencias.push({
    id: "i-o3-1", fecha: addDias(hoy, -10), titulo: "Humedad en pared medianera del baño", descripcion: "Al picar aparece mancha de humedad por filtración del vecino. Se avisó al seguro de la comunidad y se reparó la tubería.",
    gravedad: "media", estado: "resuelta", autorId: "u-op2", fotos: [u(FOTOS.demolicion[0]!)],
  });
}

const firmaDemo = (k: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100'><path d='M15 ${60 + k} C 35 ${15 + k}, 55 15, 65 60 S 95 ${90 - k}, 115 50 S 155 ${20 + k}, 175 60 S 225 80, 245 ${40 + k} S 275 55, 290 40' fill='none' stroke='#2b1d14' stroke-width='3' stroke-linecap='round'/></svg>`)}`;

function generarEconomia(db: DB, hoy: string) {
  const by = (id: string) => db.obras.find((o) => o.id === id)!;
  const cli = (o: Obra) => db.usuarios.find((x) => x.id === o.clienteId)!.nombre;
  const aprobar = (o: Obra, id: string, titulo: string, estancia: string, descripcion: string, partidas: [string, number, number][], diasExtra: number, dia: number, k: number) => {
    const f = addDias(o.fechaInicio, dia);
    o.ordenesCambio.push({ id, fecha: f, titulo, estancia, descripcion, partidas: partidas.map(([concepto, cantidad, precio]) => ({ concepto, cantidad, precio })), diasExtra, fotos: [],
      estado: "aprobada", creadaPor: o.equipo.jefeId, enviadaEn: ts(f, "12:00"), respondidaEn: ts(addDias(f, 1), "19:24"), firma: { imagen: firmaDemo(k), nombre: cli(o), fecha: ts(addDias(f, 1), "19:24") } });
    o.fechaFinPrevista = addDias(o.fechaFinPrevista, diasExtra);
  };
  aprobar(by("o-2"), "oc-o2-1", "Plato de ducha en lugar de bañera", "Baño principal", "Sustituimos la bañera prevista por un plato de ducha extraplano de resina con mampara fija, más cómodo y con más sensación de amplitud.",
    [["Plato de ducha de resina 140×80 cm", 1, 385], ["Mampara fija de vidrio templado 8 mm", 1, 520], ["Grifería termostática empotrada", 1, 298], ["Mano de obra de adaptación", 6, 42]], 1, 3, 0);
  aprobar(by("o-3"), "oc-o3-1", "Puerta corredera empotrada en cocina", "Cocina", "Cambiamos la puerta abatible de la cocina por una corredera empotrada en tabique para ganar espacio en el pasillo.",
    [["Armazón para puerta corredera empotrada", 1, 265], ["Puerta lacada en blanco", 1, 340], ["Mano de obra de albañilería", 5, 42]], 2, 6, 8);
  aprobar(by("o-6"), "oc-o6-1", "Iluminación LED lineal en la barra", "Barra", "Añadimos un perfil LED regulable bajo la barra y en la contrabarra para dar calidez al local.",
    [["Perfil LED empotrado (metro lineal)", 6, 48], ["Driver regulable", 1, 95], ["Instalación eléctrica", 4, 45]], 0, 30, -6);
  const o7 = by("o-7");
  o7.ordenesCambio.push({ id: "oc-o7-1", fecha: addDias(o7.fechaInicio, 5), titulo: "Tarima de roble natural en lugar de laminado", estancia: "Salón y dormitorios",
    descripcion: "Propuesta de sustituir el suelo laminado presupuestado por tarima de roble natural barnizada.", partidas: [{ concepto: "Tarima de roble natural (m²)", cantidad: 62, precio: 58 }, { concepto: "Rodapié de roble (ml)", cantidad: 48, precio: 9 }],
    diasExtra: 3, fotos: [], estado: "rechazada", creadaPor: o7.equipo.jefeId, enviadaEn: ts(addDias(o7.fechaInicio, 5), "10:00"), respondidaEn: ts(addDias(o7.fechaInicio, 6), "21:05"), motivoRechazo: "Preferimos mantener el laminado para no salirnos del presupuesto." });
  const o4 = by("o-4");
  o4.ordenesCambio.push({ id: "oc-o4-1", fecha: addDias(hoy, -1), titulo: "Suelo radiante en el baño ampliado", estancia: "Baño principal",
    descripcion: "Instalamos suelo radiante eléctrico bajo el porcelánico del baño principal (6 m²) con termostato wifi, para que puedas encenderlo desde el móvil antes de llegar a casa.",
    partidas: [{ concepto: "Malla de suelo radiante eléctrico (m²)", cantidad: 6, precio: 145 }, { concepto: "Termostato wifi programable", cantidad: 1, precio: 189 }, { concepto: "Recrecido con mortero autonivelante (m²)", cantidad: 6, precio: 38 }, { concepto: "Mano de obra de instalación (h)", cantidad: 8, precio: 42 }],
    diasExtra: 2, fotos: [u(FOTOS.alicatado[0]!), u(FOTOS.electricidad[0]!)], estado: "enviada", creadaPor: o4.equipo.jefeId, enviadaEn: ts(addDias(hoy, -1), "17:40") });
  const o2 = by("o-2");
  o2.ordenesCambio.push({ id: "oc-o2-2", fecha: addDias(hoy, -5), titulo: "Tres puntos de luz extra en el salón", estancia: "Salón", descripcion: "Añadimos tres puntos de luz empotrados en el techo del salón con regulador.",
    partidas: [{ concepto: "Foco LED empotrable", cantidad: 3, precio: 38 }, { concepto: "Regulador de intensidad", cantidad: 1, precio: 64 }, { concepto: "Mano de obra electricista (h)", cantidad: 3, precio: 45 }],
    diasExtra: 0, fotos: [], estado: "enviada", creadaPor: o2.equipo.jefeId, enviadaEn: ts(addDias(hoy, -5), "11:15") });
  const o8 = by("o-8");
  o8.ordenesCambio.push({ id: "oc-o8-1", fecha: hoy, titulo: "Encimera de cuarzo en lugar de laminada", estancia: "Cocina", descripcion: "Encimera de cuarzo blanco de 2 cm con copete a juego.",
    partidas: [{ concepto: "Encimera de cuarzo (ml)", cantidad: 3.2, precio: 290 }, { concepto: "Copete de cuarzo (ml)", cantidad: 3.2, precio: 45 }], diasExtra: 0, fotos: [], estado: "borrador", creadaPor: o8.equipo.jefeId });

  db.obras.forEach((o) => {
    const cap = (d: string) => (d >= hoy ? addDias(hoy, -1) : d);
    const fin = (i: number) => o.fases[i]!.estado === "completada" ? cap(addDias(o.fases[i]!.finReal!, 3)) : null;
    const h = (id: string, concepto: string, porcentaje: number, pagadoEn: string | null, solicitado = false) => ({
      id: `${o.id}-${id}`, concepto, porcentaje,
      estado: (solicitado ? "solicitado" : pagadoEn ? "pagado" : "pendiente") as "pendiente" | "solicitado" | "pagado",
      solicitadoEn: solicitado ? addDias(hoy, -1) : pagadoEn ? addDias(pagadoEn, -2) : undefined, pagadoEn: solicitado ? undefined : pagadoEn ?? undefined,
    });
    const entrega = o.estado === "terminada" ? fin(6) : null;
    o.pagos = [
      h("h1", "A la firma del contrato", 30, addDias(o.fechaInicio, -5)),
      h("h2", "Al terminar instalaciones", 30, fin(2), o.id === "o-8"),
      h("h3", "Al terminar alicatado y carpintería", 30, fin(4)),
      h("h4", "A la entrega de llaves", 10, entrega, o.id === "o-5"),
    ];
  });
}

/** Margen objetivo por obra para que la demo cuadre (Ponzano holgado, Lavapiés ajustado). */
const MARGEN: Record<string, number> = { "o-1": 0.24, "o-2": 0.17, "o-3": 0.08, "o-4": 0.21, "o-5": 0.22, "o-6": 0.29, "o-7": 0.19, "o-8": 0.25 };

function generarCostes(db: DB) {
  db.obras.forEach((o) => {
    const done = o.fases.filter((f) => f.estado === "completada").length;
    const av = (done + (done < o.fases.length ? 0.5 : 0)) / o.fases.length;
    const mo = db.fichajes.filter((f) => f.obraId === o.id && f.salida)
      .reduce((s, f) => s + ((new Date(f.salida!).getTime() - new Date(f.entrada).getTime()) / 3600000) * tarifaDe(db, f.userId), 0);
    const objetivo = vigente(o) * av * (1 - (MARGEN[o.id] ?? 0.2));
    const resto = Math.max(0, objetivo - mo);
    const pGremios = 0.35 + (o.equipo.gremioIds.length - 2) * 0.05;
    o.apuntes = apuntesDesdeCostes(o, Math.round(resto * (1 - pGremios)), Math.round(resto * pGremios));
  });
}
