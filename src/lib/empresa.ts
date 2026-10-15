import type { DB, Empresa } from "./types";

export const EMPRESA_DEFECTO: Empresa = {
  nombreComercial: "Reformas Arnal",
  razonSocial: "Reformas Arnal S.L.",
  cif: "B-86543210",
  direccion: "C/ de Bravo Murillo 120, 28020 Madrid",
  telefono: "91 000 00 00",
  email: "hola@reformasarnal.es",
  web: "reformasarnal.es",
  horario: "Lunes a viernes de 8:00 a 18:00\nSábados (solo visitas) de 10:00 a 13:00",
  iban: "ES76 2100 1234 5602 0031 8890",
  titular: "Reformas Arnal S.L.",
  lema: "Madrid · desde 2008",
  redes: { instagram: "", facebook: "", linkedin: "" },
};

export const empresaDe = (db: DB | null | undefined): Empresa => db?.empresa ?? EMPRESA_DEFECTO;

/** Teléfono para enlaces tel: (añade +34 si es un número español sin prefijo). */
export const telHref = (t: string) => { const d = t.replace(/[^\d+]/g, ""); return `tel:${d.startsWith("+") ? d : `+34${d}`}`; };
export const webHref = (w: string) => (/^https?:\/\//.test(w) ? w : `https://${w}`);
export const ibanFormato = (i: string) => i.replace(/\s/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
/** Validación básica de IBAN español (o vacío). */
export const ibanValido = (i: string) => {
  const s = i.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let m = 0; for (const ch of r) m = (m * 10 + Number(ch)) % 97;
  return m === 1;
};
