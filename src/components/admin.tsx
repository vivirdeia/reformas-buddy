import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Camera, KeyRound, Pencil, Plus, Receipt, UserCheck, UserX, Users, Wrench, X } from "lucide-react";
import { Avatar } from "@/components/obria";
import { Confirmar } from "@/components/formularios";
import { Modal } from "@/components/gestion-contenido";
import { comprimir, Galeria } from "@/components/fotos";
import { conDeshacer } from "@/lib/deshacer";
import { euro2 } from "@/lib/economia";
import { ibanFormato, ibanValido } from "@/lib/empresa";
import { costeReal, salud, SALUD_TXT } from "@/lib/analitica";
import { sumaApuntes, TIPO_APUNTE } from "@/lib/costes";
import { hoyISO } from "@/lib/fechas";
import { borrarGremio, pinOcupado, pinUnico, pinValido, tieneHistorial, vincularCliente } from "@/lib/usuarios";
import { fecha, mutate, ROL_LABEL, uid } from "@/lib/store";
import type { Apunte, DB, Empresa, Gremio, Obra, Rol, TipoApunte, Usuario } from "@/lib/types";
import { cn } from "@/lib/utils";

const inp = "h-12 w-full rounded-xl border-2 bg-background px-3 text-base outline-none focus:border-primary";
const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-40";
const btn2 = "inline-flex h-11 items-center justify-center gap-1 rounded-xl border-2 px-3 text-sm font-semibold";
const Campo = ({ l, children, err }: { l: string; children: React.ReactNode; err?: string | false | undefined }) => (
  <label className="block text-sm font-semibold">{l}<div className="mt-1">{children}</div>{err && <span className="mt-1 block text-xs text-danger">{err}</span>}</label>
);
const Caja = ({ icon: I, titulo, extra, children }: { icon: typeof Users; titulo: string; extra?: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-3xl bg-card p-4 shadow-card">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-semibold"><I className="h-5 w-5 text-primary" />{titulo}</h2>{extra}</div>
    {children}
  </section>
);

/* ---------- Usuarios ---------- */
type FormU = { nombre: string; rol: Rol; telefono: string; email: string; foto?: string | undefined; oficio: string; costeHora: string; obraId: string; pin: string };

function UsuarioForm({ db, u, onClose, onCreado }: { db: DB; u?: Usuario | undefined; onClose: () => void; onCreado: (n: string, p: string) => void }) {
  const [v, setV] = useState<FormU>(() => ({
    nombre: u?.nombre ?? "", rol: u?.rol ?? "operario", telefono: u?.telefono ?? "", email: u?.email ?? "", foto: u?.foto,
    oficio: u?.oficio ?? Object.keys(db.costeHora).find((k) => k !== "Jefe de obra") ?? "Peón",
    costeHora: u?.costeHora != null ? String(u.costeHora) : "", obraId: u?.obraId ?? "", pin: u ? "" : pinUnico(db),
  }));
  const set = (p: Partial<FormU>) => setV((x) => ({ ...x, ...p }));
  const errPin = !u && (!pinValido(v.pin) ? "El PIN debe tener 4 cifras." : pinOcupado(db, v.pin) ? "Ese PIN ya lo usa otra persona." : false);
  const errCoste = v.costeHora !== "" && !(Number(v.costeHora.replace(",", ".")) > 0) && "Importe no válido.";
  const ok = v.nombre.trim() && v.telefono.trim() && !errPin && !errCoste;
  const guardar = () => {
    if (!ok) return;
    const id = u?.id ?? uid("u");
    const coste = v.costeHora === "" ? undefined : Number(v.costeHora.replace(",", "."));
    if (mutate((d) => {
      let x = d.usuarios.find((y) => y.id === id);
      if (!x) { x = { id, nombre: "", rol: v.rol, pin: v.pin, telefono: "", activo: true }; d.usuarios.push(x); }
      x.nombre = v.nombre.trim(); x.rol = v.rol; x.telefono = v.telefono.trim(); x.email = v.email.trim() || undefined; x.foto = v.foto;
      x.oficio = v.rol === "operario" ? v.oficio : undefined;
      x.costeHora = v.rol === "operario" || v.rol === "jefe_obra" ? coste : undefined;
      if (v.rol === "cliente") vincularCliente(d, id, v.obraId || undefined); else x.obraId = undefined;
    })) { if (!u) onCreado(v.nombre.trim(), v.pin); onClose(); }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar u={{ nombre: v.nombre || "?", foto: v.foto }} className="h-16 w-16 text-xl" />
        <label className={cn(btn2, "cursor-pointer")}><Camera className="h-4 w-4" />{v.foto ? "Cambiar foto" : "Añadir foto"}
          <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) set({ foto: await comprimir(f, 320, 0.7) }); }} /></label>
        {v.foto && <button type="button" onClick={() => set({ foto: undefined })} className={btn2}><X className="h-4 w-4" />Usar iniciales</button>}
      </div>
      <Campo l="Nombre y apellidos"><input aria-label="Nombre" className={inp} value={v.nombre} onChange={(e) => set({ nombre: e.target.value })} /></Campo>
      <Campo l="Rol"><select aria-label="Rol" className={inp} value={v.rol} onChange={(e) => set({ rol: e.target.value as Rol })}>
        {(Object.keys(ROL_LABEL) as Rol[]).map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}</select></Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo l="Teléfono"><input aria-label="Teléfono" inputMode="tel" className={inp} value={v.telefono} onChange={(e) => set({ telefono: e.target.value })} /></Campo>
        <Campo l="Email (opcional)"><input aria-label="Email" type="email" className={inp} value={v.email} onChange={(e) => set({ email: e.target.value })} /></Campo>
      </div>
      {v.rol === "operario" && <Campo l="Oficio"><select aria-label="Oficio" className={inp} value={v.oficio} onChange={(e) => set({ oficio: e.target.value })}>
        {Object.keys(db.costeHora).filter((k) => k !== "Jefe de obra").map((k) => <option key={k}>{k}</option>)}</select></Campo>}
      {(v.rol === "operario" || v.rol === "jefe_obra") && (
        <Campo l="Coste/hora propio (€)" err={errCoste}>
          <input aria-label="Coste por hora" inputMode="decimal" className={inp} value={v.costeHora} onChange={(e) => set({ costeHora: e.target.value })}
            placeholder={`Vacío = tarifa del oficio (${db.costeHora[v.rol === "jefe_obra" ? "Jefe de obra" : v.oficio] ?? 20} €/h)`} />
        </Campo>)}
      {v.rol === "cliente" && <Campo l="Obra vinculada"><select aria-label="Obra vinculada" className={inp} value={v.obraId} onChange={(e) => set({ obraId: e.target.value })}>
        <option value="">Sin obra</option>{db.obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo>}
      {!u && (
        <Campo l="PIN de acceso" err={errPin}>
          <div className="flex gap-2"><input aria-label="PIN" inputMode="numeric" maxLength={4} className={cn(inp, "font-mono tracking-widest")} value={v.pin} onChange={(e) => set({ pin: e.target.value.replace(/\D/g, "") })} />
            <button type="button" onClick={() => set({ pin: pinUnico(db) })} className={btn2}>Generar</button></div>
        </Campo>)}
      <div className="flex gap-2 pt-2"><button onClick={guardar} disabled={!ok} className={cn(btn, "flex-1")}>{u ? "Guardar cambios" : "Dar de alta"}</button><button onClick={onClose} className={btn2}>Cancelar</button></div>
    </div>
  );
}

export function UsuariosAdmin({ db, me }: { db: DB; me: Usuario }) {
  const [form, setForm] = useState<Usuario | "nuevo" | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Rol | "todos" | "bajas">("todos");
  const gerentesActivos = db.usuarios.filter((u) => u.rol === "gerente" && u.activo !== false).length;
  const lista = db.usuarios.filter((u) => filtro === "todos" ? u.activo !== false : filtro === "bajas" ? u.activo === false : u.rol === filtro && u.activo !== false);
  const resetPin = (u: Usuario) => { const p = pinUnico(db, u.id); if (mutate((d) => { d.usuarios.find((x) => x.id === u.id)!.pin = p; })) setAviso(`Nuevo PIN de ${u.nombre}: ${p}`); };
  const activo = (u: Usuario, a: boolean) => mutate((d) => { d.usuarios.find((x) => x.id === u.id)!.activo = a; });
  return (
    <Caja icon={Users} titulo="Usuarios" extra={<button onClick={() => setForm("nuevo")} className={cn(btn, "h-11")}><Plus className="h-5 w-5" />Nuevo usuario</button>}>
      <div className="mb-3 flex flex-wrap gap-2">
        {(["todos", "operario", "jefe_obra", "cliente", "gerente", "bajas"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)} className={cn("h-9 rounded-full px-3 text-sm font-semibold", filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
            {f === "todos" ? "Activos" : f === "bajas" ? "Dados de baja" : ROL_LABEL[f]}</button>))}
      </div>
      {aviso && <p role="status" className="mb-3 flex items-center justify-between gap-2 rounded-2xl bg-ok-soft p-3 text-sm font-semibold text-ok">{aviso}<button aria-label="Cerrar aviso" onClick={() => setAviso(null)}><X className="h-4 w-4" /></button></p>}
      {lista.length === 0 ? <p className="text-sm text-muted-foreground">No hay usuarios en este filtro.</p> : (
        <ul className="divide-y">
          {lista.map((u) => {
            const hist = tieneHistorial(db, u.id);
            const protegido = u.id === me.id || (u.rol === "gerente" && gerentesActivos <= 1 && u.activo !== false);
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar u={u} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{u.nombre}{u.activo === false && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">De baja</span>}</div>
                  <div className="text-xs text-muted-foreground">{ROL_LABEL[u.rol]}{u.oficio ? ` · ${u.oficio}` : ""} · {u.telefono}{u.rol === "cliente" && ` · ${db.obras.find((o) => o.id === u.obraId)?.nombre ?? "sin obra"}`} · PIN <span className="font-mono font-bold">{u.pin}</span></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setForm(u)} className={btn2} aria-label={`Editar ${u.nombre}`}><Pencil className="h-4 w-4" />Editar</button>
                  <button onClick={() => resetPin(u)} className={btn2} aria-label={`Restablecer PIN de ${u.nombre}`}><KeyRound className="h-4 w-4" />PIN</button>
                  {u.activo === false
                    ? <button onClick={() => activo(u, true)} className={btn2}><UserCheck className="h-4 w-4" />Reactivar</button>
                    : !protegido && <button onClick={() => activo(u, false)} className={btn2} aria-label={`Dar de baja a ${u.nombre}`}><UserX className="h-4 w-4" />Dar de baja</button>}
                  {!hist && !protegido && <Confirmar pregunta="¿Borrar usuario?" onSi={() => conDeshacer(`${u.nombre} borrado`, (d) => { d.usuarios = d.usuarios.filter((x) => x.id !== u.id); })} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Quien tenga fichajes, partes u obras asignadas solo se puede dar de baja (su historial se conserva).</p>
      <Modal open={!!form} onClose={() => setForm(null)} titulo={form === "nuevo" ? "Nuevo usuario" : "Editar usuario"}>
        {form && <UsuarioForm key={form === "nuevo" ? "n" : form.id} db={db} u={form === "nuevo" ? undefined : form} onClose={() => setForm(null)} onCreado={(n, p) => setAviso(`${n} dado de alta. Su PIN es ${p}`)} />}
      </Modal>
    </Caja>
  );
}

/* ---------- Cambio de PIN propio ---------- */
export function CambiarPin({ db, me }: { db: DB; me: Usuario }) {
  const [a, setA] = useState(""); const [n, setN] = useState(""); const [r, setR] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const cambiar = () => {
    if (a !== me.pin) return setMsg({ ok: false, t: "El PIN actual no es correcto." });
    if (!pinValido(n)) return setMsg({ ok: false, t: "El PIN nuevo debe tener 4 cifras." });
    if (n !== r) return setMsg({ ok: false, t: "Los dos PIN nuevos no coinciden." });
    if (pinOcupado(db, n, me.id)) return setMsg({ ok: false, t: "Ese PIN no está disponible. Elige otro." });
    if (mutate((d) => { d.usuarios.find((x) => x.id === me.id)!.pin = n; })) { setA(""); setN(""); setR(""); setMsg({ ok: true, t: "PIN cambiado. Úsalo la próxima vez que entres." }); }
  };
  const f = (l: string, v: string, s: (x: string) => void) => <Campo l={l}><input aria-label={l} type="password" inputMode="numeric" maxLength={4} className={cn(inp, "font-mono tracking-widest")} value={v} onChange={(e) => { setMsg(null); s(e.target.value.replace(/\D/g, "")); }} /></Campo>;
  return (
    <Caja icon={KeyRound} titulo="Cambiar mi PIN">
      <div className="grid gap-3 sm:grid-cols-3">{f("PIN actual", a, setA)}{f("PIN nuevo", n, setN)}{f("Repite el PIN nuevo", r, setR)}</div>
      <button onClick={cambiar} disabled={a.length < 4 || n.length < 4 || r.length < 4} className={cn(btn, "mt-3 w-full sm:w-auto")}>Cambiar PIN</button>
      {msg && <p className={cn("mt-2 text-sm font-semibold", msg.ok ? "text-ok" : "text-danger")}>{msg.t}</p>}
    </Caja>
  );
}

/* ---------- Gremios ---------- */
export function GremiosAdmin({ db }: { db: DB }) {
  const vacio: Gremio = { id: "", oficio: "", empresa: "", contacto: "", telefono: "", notas: "" };
  const [form, setForm] = useState<Gremio | null>(null);
  const ok = form && form.oficio.trim() && form.empresa.trim();
  const guardar = () => {
    if (!form || !ok) return;
    const g = { ...form, id: form.id || uid("g"), oficio: form.oficio.trim(), empresa: form.empresa.trim(), notas: form.notas?.trim() || undefined };
    if (mutate((d) => { const i = d.gremios.findIndex((x) => x.id === g.id); if (i >= 0) d.gremios[i] = g; else d.gremios.push(g); })) setForm(null);
  };
  const s = (p: Partial<Gremio>) => setForm((f) => f && { ...f, ...p });
  return (
    <Caja icon={Wrench} titulo="Gremios subcontratados" extra={<button onClick={() => setForm(vacio)} className={cn(btn, "h-11")}><Plus className="h-5 w-5" />Nuevo gremio</button>}>
      <ul className="divide-y">
        {db.gremios.map((g) => {
          const n = db.obras.filter((o) => o.equipo.gremioIds.includes(g.id)).length;
          return (
            <li key={g.id} className="flex flex-wrap items-center gap-2 py-3">
              <div className="min-w-0 flex-1"><div className="font-semibold">{g.empresa} <span className="font-normal text-muted-foreground">· {g.oficio}</span></div>
                <div className="text-xs text-muted-foreground">{g.contacto} · {g.telefono} · en {n} obra{n === 1 ? "" : "s"}</div></div>
              <button onClick={() => setForm(g)} className={btn2} aria-label={`Editar ${g.empresa}`}><Pencil className="h-4 w-4" />Editar</button>
              <Confirmar pregunta="¿Borrar gremio?" onSi={() => conDeshacer(`${g.empresa} borrado`, (d) => borrarGremio(d, g.id))} />
            </li>
          );
        })}
      </ul>
      {db.gremios.length === 0 && <p className="text-sm text-muted-foreground">Sin gremios todavía.</p>}
      <Modal open={!!form} onClose={() => setForm(null)} titulo={form?.id ? "Editar gremio" : "Nuevo gremio"}>
        {form && <div className="space-y-3">
          <Campo l="Oficio"><input aria-label="Oficio del gremio" className={inp} value={form.oficio} onChange={(e) => s({ oficio: e.target.value })} placeholder="Fontanería, Electricidad…" /></Campo>
          <Campo l="Empresa"><input aria-label="Empresa" className={inp} value={form.empresa} onChange={(e) => s({ empresa: e.target.value })} /></Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo l="Persona de contacto"><input aria-label="Contacto" className={inp} value={form.contacto} onChange={(e) => s({ contacto: e.target.value })} /></Campo>
            <Campo l="Teléfono"><input aria-label="Teléfono del gremio" inputMode="tel" className={inp} value={form.telefono} onChange={(e) => s({ telefono: e.target.value })} /></Campo>
          </div>
          <Campo l="Notas"><textarea aria-label="Notas" className={cn(inp, "h-20 py-2")} value={form.notas ?? ""} onChange={(e) => s({ notas: e.target.value })} /></Campo>
          <button onClick={guardar} disabled={!ok} className={cn(btn, "w-full")}>Guardar gremio</button>
        </div>}
      </Modal>
    </Caja>
  );
}

/* ---------- Tarifas ---------- */
export function TarifasAdmin({ db }: { db: DB }) {
  const [v, setV] = useState<[string, string][]>(() => Object.entries(db.costeHora).map(([k, n]) => [k, String(n)]));
  const [nuevo, setNuevo] = useState("");
  const [ok, setOk] = useState(false);
  const usados = new Set(db.usuarios.map((u) => u.oficio).filter(Boolean));
  const valido = v.every(([, n]) => Number(n.replace(",", ".")) > 0);
  const guardar = () => { if (valido && mutate((d) => { d.costeHora = Object.fromEntries(v.map(([k, n]) => [k, Number(n.replace(",", "."))])); })) setOk(true); };
  return (
    <Caja icon={Receipt} titulo="Tarifas por oficio (coste/hora)">
      <ul className="space-y-2">
        {v.map(([k, n], i) => (
          <li key={k} className="flex items-center gap-2">
            <span className="flex-1 font-semibold">{k}</span>
            <input aria-label={`Tarifa ${k}`} inputMode="decimal" className={cn(inp, "w-28 text-right")} value={n} onChange={(e) => { setOk(false); setV(v.map((x, j) => j === i ? [k, e.target.value] : x)); }} />
            <span className="text-sm text-muted-foreground">€/h</span>
            {k !== "Jefe de obra" && !usados.has(k) ? <button aria-label={`Quitar ${k}`} onClick={() => { setOk(false); setV(v.filter((_, j) => j !== i)); }} className="grid h-11 w-11 place-items-center rounded-xl text-danger hover:bg-danger-soft"><X className="h-4 w-4" /></button> : <span className="w-11" />}
          </li>))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input aria-label="Nuevo oficio" className={inp} placeholder="Nuevo oficio…" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
        <button disabled={!nuevo.trim() || v.some(([k]) => k.toLowerCase() === nuevo.trim().toLowerCase())} onClick={() => { setV([...v, [nuevo.trim(), "20"]]); setNuevo(""); setOk(false); }} className={btn2}><Plus className="h-4 w-4" />Añadir</button>
      </div>
      <button onClick={guardar} disabled={!valido} className={cn(btn, "mt-3 w-full sm:w-auto")}>Guardar tarifas</button>
      {ok && <span className="ml-3 text-sm font-semibold text-ok">Guardado. Los márgenes ya usan las nuevas tarifas.</span>}
      <p className="mt-2 text-xs text-muted-foreground">Si un operario tiene coste/hora propio, se usa el suyo en lugar del de su oficio.</p>
    </Caja>
  );
}

/* ---------- Empresa ---------- */
export function EmpresaForm({ db }: { db: DB }) {
  const [v, setV] = useState<Empresa>(() => structuredClone(db.empresa));
  const [ok, setOk] = useState(false);
  const s = (p: Partial<Empresa>) => { setOk(false); setV((x) => ({ ...x, ...p })); };
  const errIban = v.iban.trim() && !ibanValido(v.iban) ? "IBAN no válido: revisa los dígitos." : false;
  const errEmail = v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email) ? "Email no válido." : false;
  const valido = v.nombreComercial.trim() && v.razonSocial.trim() && v.telefono.trim() && !errIban && !errEmail;
  const guardar = () => { if (valido && mutate((d) => { d.empresa = { ...v, iban: v.iban.trim() ? ibanFormato(v.iban) : "" }; })) setOk(true); };
  const t = (l: string, k: keyof Omit<Empresa, "redes" | "logo">, extra?: { err?: string | false; mode?: "tel" | "email" }) => (
    <Campo l={l} err={extra?.err}><input aria-label={l} inputMode={extra?.mode} className={inp} value={v[k] as string} onChange={(e) => s({ [k]: e.target.value } as Partial<Empresa>)} /></Campo>
  );
  return (
    <Caja icon={Building2} titulo="Datos de la empresa">
      <div className="mb-3 flex items-center gap-3">
        {v.logo ? <img src={v.logo} alt="Logotipo" className="h-16 w-16 rounded-xl border object-contain" /> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-muted text-xs text-muted-foreground">Sin logo</div>}
        <label className={cn(btn2, "cursor-pointer")}><Camera className="h-4 w-4" />{v.logo ? "Cambiar logo" : "Subir logo"}
          <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) s({ logo: await comprimir(f, 400, 0.85) }); }} /></label>
        {v.logo && <button onClick={() => s({ logo: undefined })} className={btn2}><X className="h-4 w-4" />Quitar</button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {t("Nombre comercial", "nombreComercial")}{t("Razón social", "razonSocial")}{t("CIF", "cif")}{t("Lema", "lema")}
        <div className="sm:col-span-2">{t("Dirección", "direccion")}</div>
        {t("Teléfono", "telefono", { mode: "tel" })}{t("Email", "email", { mode: "email", err: errEmail })}{t("Web", "web")}
        <Campo l="Horario"><textarea aria-label="Horario" className={cn(inp, "h-20 py-2")} value={v.horario} onChange={(e) => s({ horario: e.target.value })} /></Campo>
        {t("IBAN", "iban", { err: errIban })}{t("Titular de la cuenta", "titular")}
        {(["instagram", "facebook", "linkedin"] as const).map((k) => (
          <Campo key={k} l={`${k[0]!.toUpperCase()}${k.slice(1)} (enlace, opcional)`}><input aria-label={k} className={inp} placeholder="https://…" value={v.redes[k]} onChange={(e) => s({ redes: { ...v.redes, [k]: e.target.value } })} /></Campo>))}
      </div>
      <button onClick={guardar} disabled={!valido} className={cn(btn, "mt-4 w-full sm:w-auto")}>Guardar datos de empresa</button>
      {ok && <span className="ml-3 text-sm font-semibold text-ok">Guardado. La web, los justificantes y los avisos de pago ya lo muestran.</span>}
    </Caja>
  );
}

/* ---------- Apuntes de coste ---------- */
type FormA = { id: string; fecha: string; tipo: TipoApunte; concepto: string; proveedor: string; gremioId: string; importe: string; adjunto?: string | undefined };

export function ApuntesObra({ db, o }: { db: DB; o: Obra }) {
  const [form, setForm] = useState<FormA | null>(null);
  const c = costeReal(db, o);
  const sum = sumaApuntes(o);
  const lista = [...o.apuntes].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const s = (p: Partial<FormA>) => setForm((f) => f && { ...f, ...p });
  const imp = form ? Number(form.importe.replace(/\./g, "").replace(",", ".")) : 0;
  const ok = form && form.concepto.trim() && imp > 0 && form.fecha;
  const abrir = (a?: Apunte) => setForm(a ? { id: a.id, fecha: a.fecha, tipo: a.tipo, concepto: a.concepto, proveedor: a.proveedor ?? "", gremioId: a.gremioId ?? "", importe: String(a.importe).replace(".", ","), adjunto: a.adjunto }
    : { id: "", fecha: hoyISO(), tipo: "materiales", concepto: "", proveedor: "", gremioId: "", importe: "" });
  const guardar = () => {
    if (!form || !ok) return;
    const a: Apunte = { id: form.id || uid("ap"), fecha: form.fecha, tipo: form.tipo, concepto: form.concepto.trim(), importe: Math.round(imp * 100) / 100,
      proveedor: form.tipo === "gremio" && form.gremioId ? undefined : form.proveedor.trim() || undefined,
      gremioId: form.tipo === "gremio" ? form.gremioId || undefined : undefined, adjunto: form.adjunto };
    if (mutate((d) => { const ob = d.obras.find((x) => x.id === o.id)!; const i = ob.apuntes.findIndex((x) => x.id === a.id); if (i >= 0) ob.apuntes[i] = a; else ob.apuntes.push(a); })) setForm(null);
  };
  const quien = (a: Apunte) => a.gremioId ? db.gremios.find((g) => g.id === a.gremioId)?.empresa ?? a.proveedor : a.proveedor;
  return (
    <section className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Costes de la obra</h2>
        <button onClick={() => abrir()} className={cn(btn, "h-11")}><Plus className="h-5 w-5" />Añadir apunte</button>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[["Materiales", sum.materiales], ["Gremios", sum.gremios], ["Otros", sum.otros], ["Mano de obra", c.manoObra]].map(([l, n]) => (
          <div key={l as string} className="rounded-2xl bg-muted p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="font-display font-bold tabular-nums">{euro2(n as number)}</div></div>))}
      </div>
      <Link to="/economia" className="mb-3 flex items-center justify-between rounded-2xl border-2 p-3 text-sm hover:border-primary">
        <span>Margen previsto sobre {euro2(c.vigente)}</span>
        <span data-testid="margen-obra" className={cn("font-display text-base font-bold", SALUD_TXT[salud(c.pct)])}>{euro2(c.margen)} · {(c.pct * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%</span>
      </Link>
      {lista.length === 0 ? <p className="text-sm text-muted-foreground">Sin apuntes todavía.</p> : (
        <ul className="divide-y">
          {lista.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{a.concepto}</div>
                <div className="text-xs text-muted-foreground">{fecha(a.fecha)} · {TIPO_APUNTE[a.tipo]}{quien(a) ? ` · ${quien(a)}` : ""}</div>
                {a.adjunto && <Galeria fotos={[a.adjunto]} />}
              </div>
              <span className="font-display font-bold tabular-nums">{euro2(a.importe)}</span>
              <button onClick={() => abrir(a)} aria-label={`Editar ${a.concepto}`} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-muted"><Pencil className="h-4 w-4" /></button>
              <Confirmar texto="Borrar" pregunta="¿Borrar apunte?" onSi={() => conDeshacer("Apunte borrado", (d) => { const ob = d.obras.find((x) => x.id === o.id)!; ob.apuntes = ob.apuntes.filter((x) => x.id !== a.id); })} />
            </li>))}
        </ul>
      )}
      <Modal open={!!form} onClose={() => setForm(null)} titulo={form?.id ? "Editar apunte" : "Nuevo apunte de coste"}>
        {form && <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TIPO_APUNTE) as TipoApunte[]).map((t) => <button key={t} type="button" onClick={() => s({ tipo: t })} className={cn("h-12 rounded-xl border-2 font-semibold", form.tipo === t && "border-primary bg-accent")}>{TIPO_APUNTE[t]}</button>)}
          </div>
          <Campo l="Concepto"><input aria-label="Concepto" className={inp} value={form.concepto} onChange={(e) => s({ concepto: e.target.value })} /></Campo>
          {form.tipo === "gremio"
            ? <Campo l="Gremio"><select aria-label="Gremio" className={inp} value={form.gremioId} onChange={(e) => s({ gremioId: e.target.value })}>
                <option value="">— Otro (escribir abajo) —</option>{db.gremios.map((g) => <option key={g.id} value={g.id}>{g.empresa} · {g.oficio}</option>)}</select></Campo>
            : null}
          {(form.tipo !== "gremio" || !form.gremioId) && <Campo l="Proveedor"><input aria-label="Proveedor" className={inp} value={form.proveedor} onChange={(e) => s({ proveedor: e.target.value })} /></Campo>}
          <div className="grid grid-cols-2 gap-3">
            <Campo l="Fecha"><input aria-label="Fecha" type="date" className={inp} value={form.fecha} onChange={(e) => s({ fecha: e.target.value })} /></Campo>
            <Campo l="Importe (€, sin IVA)"><input aria-label="Importe" inputMode="decimal" className={inp} value={form.importe} onChange={(e) => s({ importe: e.target.value })} /></Campo>
          </div>
          <div className="flex items-center gap-3">
            {form.adjunto && <img src={form.adjunto} alt="Albarán" className="h-16 w-16 rounded-xl object-cover" />}
            <label className={cn(btn2, "cursor-pointer")}><Camera className="h-4 w-4" />{form.adjunto ? "Cambiar foto del albarán" : "Foto del albarán"}
              <input type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) s({ adjunto: await comprimir(f, 1400, 0.7) }); }} /></label>
            {form.adjunto && <button type="button" onClick={() => s({ adjunto: undefined })} className={btn2}><X className="h-4 w-4" />Quitar</button>}
          </div>
          <button onClick={guardar} disabled={!ok} className={cn(btn, "w-full")}>Guardar apunte</button>
        </div>}
      </Modal>
    </section>
  );
}
