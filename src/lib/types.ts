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
export interface OrdenCambio {
  id: string; fecha: string; titulo: string; descripcion: string; importe: number;
  diasExtra: number; estado: "pendiente" | "aprobada" | "rechazada"; solicitadaPor: string; respondidaEn?: string;
}
export interface ParteDiario {
  id: string; fecha: string; autorId: string; horas: number; operarioIds: string[];
  trabajos: string; fotos: string[]; fase?: FaseTipo;
}
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
}

export interface Fichaje { id: string; userId: string; obraId: string; entrada: string; salida?: string; }
export interface Tarea {
  id: string; obraId: string; fecha: string; titulo: string; fase: FaseTipo;
  operarioId: string; hecha: boolean; hechaEn?: string; creadaPor: string;
}

export interface DB {
  version: number;
  fichajes: Fichaje[];
  tareas: Tarea[];
  usuarios: Usuario[];
  gremios: Gremio[];
  obras: Obra[];
}
