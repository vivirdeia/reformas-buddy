# Auditoría de funcionalidad en localStorage — Obria

Esfuerzo: S = menos de 1 h · M = 1–3 h · L = más de 3 h. Gravedad: Alta / Media / Baja.

## Hallazgos transversales (afectan a todos los roles)

| # | Problema | Archivo | Grav. | Esf. |
|---|---|---|---|---|
| T1 | El semáforo (`o.estado`: en plazo / riesgo / retrasada / terminada) **es un dato fijo del seed**: ningún código lo recalcula. Una obra con todas las fases completadas o con 20 días de desviación conserva su color. Afecta al listado, panel, KPIs "en riesgo", "Requiere tu atención" y al mensaje del cliente. | lib/seed.ts, lib/actividad.ts, routes/panel.tsx, obras.index.tsx | Alta | M |
| T2 | El estado de las fases no se puede cambiar desde ninguna pantalla (no hay `mutate` sobre `fases`). Por tanto % de avance, fase actual, desviación, Gantt y el coste proyectado (que divide por avance) nunca cambian en uso real. | store.ts (`avance`), analitica.ts | Alta | M |
| T3 | Cambio de versión del modelo = **borrado total**: `loadDB` reemplaza por el seed si `version !== 6`. Cualquier subida de versión destruye los datos del usuario. No hay migraciones ni copia de seguridad. | lib/store.ts | Alta | M |
| T4 | Sincronización entre pestañas: solo se escucha el evento propio `obria:change`, no el evento `storage`. Otra pestaña muestra datos viejos (y la sesión no se cierra) hasta recargar. Las escrituras no se pisan (cada `mutate` relee), pero la UI queda desfasada. | lib/store.ts | Media | S |
| T5 | Espacio: fotos en base64 dentro de un único JSON (límite ~5 MB). Al llenarse, `mutate` muestra un `alert` y no guarda, pero no hay indicador de uso, ni forma de liberar espacio, ni límite global. `loadDB` hace `setItem` sin `try` en la primera carga. Cada cambio reescribe el JSON completo (lento con muchas fotos). | lib/store.ts, components/fotos.tsx | Alta | M |
| T6 | Si el JSON está corrupto se sustituye en silencio por el seed (pérdida de datos). | lib/store.ts | Media | S |
| T7 | No hay exportar/importar copia de seguridad. | — | Media | S |

## Gerente

1. Acciones sin efecto o incompletas
- Ajustes solo permite "Restablecer demo"; muestra los PIN pero no deja tocarlos. (ajustes.tsx, Alta, —, ver punto 4)
2. Datos fijos en el código
- IBAN y titular/CIF en constantes (lib/economia.ts) — Media, S.
- Plan de pagos 30/30/30/10 y cálculo del presupuesto desde el rango en "Convertir en obra" están en el código (solicitudes.$id.tsx) — Baja, S.
- Duración de fases por defecto (`FASES[].dias`) solo en el seed — Baja, S.
- Tarifas por oficio (`costeHora`) y costes de materiales/gremios: se leen del store pero no se pueden editar — Alta, M.
3. Se crean pero no se editan/borran
- Obras: se crean solo desde una solicitud; no hay alta directa, edición (nombre, dirección, presupuesto, fechas, portada, horario, equipo) ni borrado/archivo — Alta, L.
- Solicitudes: se cambia estado y notas, pero no se editan datos ni se borran — Media, S.
- Hitos de pago: se marcan solicitado/pagado, pero no se deshace, ni se edita el plan (conceptos, %), ni la fecha de pago — Media, M.
- Costes de materiales/gremios: solo seed — Alta, M.
4. Gestiones que faltan
- Alta/baja/edición de usuarios (operarios, jefes, clientes) y PIN — Alta, M.
- Gremios: catálogo solo en seed, sin CRUD ni asignación a obras — Media, M.
- Datos de empresa (nombre, CIF, IBAN, teléfono, email, horario) usados en justificante, avisos de pago y landing — Media, M.
- Archivar obras / obras terminadas — Media, S.
- Copia de seguridad (T7) e indicador de espacio (T5).
6. Cálculos
- KPIs, tabla y alertas dependen de T1/T2. Margen y cobros sí se recalculan con fichajes, órdenes y pagos.
- "Facturación del mes" usa la fecha de pago, que se fija al marcar; correcto, pero no editable.

## Jefe de obra

1. Botones: fichaje, tareas, partes, incidencias, órdenes y resolución de incidencias funcionan y guardan.
2. Fijos: ninguno relevante, salvo las fases fijas (7 tipos) y el horario de obra (solo seed).
3. Se crean pero no se editan/borran
- Tareas: crear y marcar; no editar ni borrar — Media, S.
- Partes diarios: crear; no editar (ni el interruptor "Visible para el cliente" después de enviar) ni borrar — Alta, M.
- Incidencias: crear y resolver; no editar, reabrir ni borrar — Media, S.
- Órdenes de cambio: borrador editable y borrable; enviada no se puede retirar/anular — Baja, S.
- Notas de obra: se muestran pero **no se pueden crear** (no hay `mutate` sobre `notas`) — Media, S.
- Fichajes: no se pueden corregir (olvido de fichar salida queda abierto indefinidamente) — Alta, M.
4. Faltan
- Avance manual de fase y edición de fechas previstas/reales (T2) — Alta, M.
- Subida real de documentos (hoy son ficticios del seed, la vista previa es simulada) — Media, M.
- Añadir antes y después por estancia (solo seed) — Media, S.
- Hitos del diario (`Obra.hitos`) solo seed — Baja, S.

## Operario
- Fichaje, tareas, partes e incidencias funcionan.
- No puede corregir un fichaje olvidado ni cambiar su PIN — Media, S (cubierto por gestión de usuarios y fichajes).
- Aviso de doble fichaje correcto; pero tras el aviso no hay atajo "cerrar el otro y fichar aquí" — Baja, S.

## Cliente
1. Aprobar/firmar y rechazar órdenes funciona y actualiza presupuesto y fecha.
2. Fijos en el código
- Mensajes de estado del portal: el texto "retraso en la llegada de material" se muestra a toda obra retrasada aunque la causa sea otra (portal.tsx) — Media, S. Debería poder escribirlo el jefe ("mensaje para el cliente").
- Documentos: archivo ficticio; la vista previa se genera, no hay fichero real — Media, M.
- Teléfono/WhatsApp del jefe sí salen del store; IBAN y titular, no (constantes).
4. Falta: cambio de PIN propio — Baja, S.

## Landing pública
1. Enlaces de redes sociales con `href="#"` (index.tsx) — Baja, S. Teléfono `tel:+34910000000` fijo.
2. Fijos: cifras de confianza (18 años, 640+, etc.), testimonios, FAQ, servicios, pasos, contacto y horario del pie, y los proyectos extra de la galería — Media, M. El mockup de Obria es estático — Baja.
- El formulario de presupuesto sí guarda en el store y aparece al gerente.

## Plan propuesto (fases cortas)

**F1 — Base segura (Alta, ~1 día)**
Migraciones por versión que conservan datos (sin reseed), guardado protegido en la primera carga, recuperación si hay JSON corrupto (guardar copia), escucha del evento `storage` entre pestañas, indicador de espacio usado en Ajustes, exportar/importar copia JSON.

**F2 — Cálculos vivos (Alta, ~½ día)**
Semáforo derivado automáticamente (terminada si todas las fases están completadas; retrasada/en riesgo según desviación y fin estimado), con opción de forzarlo manualmente. Revisar que listado, panel, KPIs y portal usen la función común.

**F3 — Gestión de obra (Alta, ~1 día)**
Avance de fase (iniciar / completar / bloquear) con fechas reales automáticas, edición de fechas previstas, edición de datos de obra y equipo, alta directa de obra, archivar y borrar con confirmación, mensaje de estado para el cliente.

**F4 — Editar y borrar contenido (Media, ~1 día)**
Editar/borrar partes (incluido "Visible para el cliente"), tareas, incidencias (reabrir), notas (crear/borrar), retirar órdenes enviadas, corregir fichajes, deshacer hitos y editar plan de pagos y fecha de cobro, editar/borrar solicitudes.

**F5 — Administración (Media, ~1 día)**
Usuarios: alta/baja/edición y PIN (cada usuario cambia el suyo). Gremios con CRUD y asignación. Tarifas por oficio y costes de materiales/gremios por obra (apuntes con fecha). Datos de empresa (nombre, CIF, IBAN, contacto, horario) usados en justificantes, avisos de pago, landing y pie.

**F6 — Archivos y escaparate (Media, ~1 día)**
Subida real de documentos (PDF/imagen, con límite de tamaño) y descarga, añadir/quitar antes y después, contenidos de la landing editables por el gerente (cifras, testimonios, FAQ, galería, redes) y limpieza de enlaces `#`.

## Notas técnicas
- Todo el estado vive en una única clave `obria:db:v1`; recomendable mantenerla pero separar fotos/documentos en claves propias (`obria:file:<id>`) para no reescribir megas en cada cambio, o pasar a IndexedDB para archivos si se supera el límite.
- Nuevo campo `DB.empresa` y `DB.landing`; `Obra.archivada`, `Obra.estadoManual?`, `Obra.mensajeCliente?`, `costes` como lista de apuntes.
- Los hallazgos de "no editable" se confirmaron buscando todas las llamadas a `mutate` en rutas y componentes.
