export type Rol = "operario" | "jefe_obra" | "cliente" | "gerente";

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  pin: string;
  telefono: string;
  email?: string;
  obraId?: string; // solo clientes
  oficio?: string; // operarios
}

export type FaseTipo =
  | "demolicion" | "fontaneria" | "electricidad" | "alicatado" | "carpinteria" | "pintura" | "limpieza";

export type FaseEstado = "pendiente" | "en_curso" | "completada" | "bloqueada";

export interface Fase {
  tipo: FaseTipo;
  inicioPrevisto: string;
  finPrevisto: string;
  inicioReal?: string;
  finReal?: string;
  estado: FaseEstado;
}

export type EstadoObra = "en_plazo" | "en_riesgo" | "retrasada" | "terminada";

export interface Gremio { id: string; oficio: string; empresa: string; contacto: string; telefono: string; }

export interface Nota { id: string; autorId: string; fecha: string; texto: string; }

// Preparado para fases siguientes
export interface Incidencia {
  id: string; fecha: string; titulo: string; descripcion: string;
  gravedad: "baja" | "media" | "alta"; estado: "abierta" | "resuelta"; autorId: string; fotos: string[];
}
export interface Partida { concepto: string; cantidad: number; precio: number; }
export interface Firma { imagen: string; nombre: string; fecha: string; }
export interface OrdenCambio {
  id: string; fecha: string; titulo: string; descripcion: string; estancia: string;
  partidas: Partida[]; diasExtra: number; fotos: string[];
  estado: "borrador" | "enviada" | "aprobada" | "rechazada";
  creadaPor: string; enviadaEn?: string | undefined; respondidaEn?: string | undefined;
  firma?: Firma | undefined; motivoRechazo?: string | undefined;
}
export interface HitoPago {
  id: string; concepto: string; porcentaje: number; estado: "pendiente" | "solicitado" | "pagado";
  solicitadoEn?: string | undefined; pagadoEn?: string | undefined;
}
export interface ParteDiario {
  id: string; fecha: string; autorId: string; horas: number; operarioIds: string[];
  trabajos: string; fotos: string[]; fase?: FaseTipo;
  visibleCliente: boolean;
  resumenCliente?: string | undefined;
}
export interface Documento { id: string; nombre: string; tipo: "presupuesto" | "plano" | "certificado"; fecha: string; tamano: string; }
export interface AntesDespues { estancia: string; antes: string; despues: string; }
export interface Hito { id: string; fecha: string; titulo: string; visibleCliente: boolean; }

export interface Obra {
  id: string;
  nombre: string;
  tipo: "piso" | "local";
  clienteId: string;
  direccion: string;
  barrio: string;
  m2: number;
  presupuesto: number;
  fechaInicio: string;
  fechaFinPrevista: string;
  estado: EstadoObra;
  portada: string;
  fases: Fase[];
  equipo: { jefeId: string; operarioIds: string[]; gremioIds: string[] };
  notas: Nota[];
  incidencias: Incidencia[];
  ordenesCambio: OrdenCambio[];
  partesDiarios: ParteDiario[];
  hitos: Hito[];
  documentos: Documento[];
  antesDespues: AntesDespues[];
  horario: string;
  pagos: HitoPago[];
  /** Costes acumulados a fecha (sin mano de obra propia) */
  costes: { materiales: number; gremios: number };
}

export interface Fichaje { id: string; userId: string; obraId: string; entrada: string; salida?: string; }
export interface Tarea {
  id: string; obraId: string; fecha: string; titulo: string; fase: FaseTipo;
  operarioId: string; hecha: boolean; hechaEn?: string | undefined; creadaPor: string;
}

export type EstadoSolicitud = "nueva" | "contactada" | "visita" | "presupuestada" | "ganada" | "perdida";
export interface Solicitud {
  id: string; fecha: string; tipo: string; m2: number; zona: string; inicio: string; rango: string;
  fotos: string[]; nombre: string; telefono: string; email: string; comentario?: string | undefined;
  estado: EstadoSolicitud; notas?: string | undefined; obraId?: string | undefined;
}

export interface DB {
  version: number;
  solicitudes: Solicitud[];
  fichajes: Fichaje[];
  /** Coste por hora según oficio (o "Jefe de obra") */
  costeHora: Record<string, number>;
  tareas: Tarea[];
  usuarios: Usuario[];
  gremios: Gremio[];
  obras: Obra[];
}
