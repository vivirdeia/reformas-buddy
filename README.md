# Obria · Gestión de obras para Reformas Arnal

**Obria** es un **caso de uso de desarrollo a medida** para una empresa de reformas integrales. El cliente, **Reformas Arnal** (Madrid), es **ficticio**. Obria no es un SaaS ni un producto comercial: es una demostración de cómo sería una herramienta interna hecha a medida para una empresa concreta, con su web pública, su equipo, sus clientes y su forma de trabajar.

> Un producto de [Vivir de IA](https://vivirdeia.com) · creado por [Isaac Wesley](https://linkedin.com/in/isaacwesleey)

---

## Qué incluye

| Área | Qué hace |
|---|---|
| **Web pública** (`/`) | Landing con portada, servicios, galería antes/después, testimonios, preguntas frecuentes y datos de contacto. Todo editable desde Ajustes → Web. |
| **Solicitud de presupuesto** (`/presupuesto`) | Formulario en varios pasos con fotos. Llega a la bandeja del gerente. |
| **Gerente** | Panel con KPIs, «Requiere tu atención», Gantt, solicitudes (que se convierten en obra), obras, equipo, economía con márgenes, usuarios, gremios, tarifas, datos de empresa y web. |
| **Jefe de obra** | Día a día: fichajes, tareas, partes diarios con fotos, incidencias, órdenes de cambio, costes, documentos y antes/después de sus obras. |
| **Operario** | Fichar entrada y salida, ver y marcar sus tareas, enviar partes con fotos y avisar de incidencias. |
| **Cliente** (`/mi-reforma`) | Portal con avance, próximos hitos, diario de obra (solo lo marcado como visible), antes/después, documentos, órdenes de cambio con firma táctil y plan de pagos con IBAN. |

El cliente **nunca** ve fichajes, horas, incidencias internas ni importes de gremios.

## Arquitectura: 100 % en el navegador

No hay backend, ni base de datos remota, ni nube. Todo se guarda **en el dispositivo**:

- **localStorage** (`obria:db:v1`): un único JSON con obras, usuarios, fichajes, partes, etc. La sesión va en `obria:session`.
- **IndexedDB** (`obria-archivos`): fotos, firmas, logos, albaranes y documentos (PDF/imagen). El JSON solo guarda referencias `idb:<id>`.
- **Migraciones por versión** (`src/lib/store.ts` → `MIGRACIONES`): al actualizar la app, los datos existentes se convierten sin borrarse. Nunca se vuelve a sembrar la demo por un cambio de versión.
- **Guardado protegido**: si se llena el espacio, la app avisa con un aviso en pantalla y no pierde lo que hay en memoria. Si el JSON se corrompe, se guarda una copia de respaldo descargable.
- **Varias pestañas**: se sincronizan entre sí (incluido cerrar sesión o dar de baja a un usuario).
- **Cálculos vivos**: el semáforo de cada obra, el avance, la desviación, los márgenes y los cobros se calculan siempre a partir de los datos (`src/lib/analitica.ts`, `src/lib/economia.ts`).

Tecnología: TanStack Start (React 19), Vite, Tailwind CSS v4, TypeScript.

## Usuarios y PIN de demo

| Rol | Usuario | PIN |
|---|---|---|
| Gerente | Javier Arnal | 1111 |
| Jefe de obra | Marta Ruiz · Raúl Moreno | 2222 · 2233 |
| Operario | Antonio Gil (Oficial de 1ª) | 3333 |
| Cliente | Lucía Fernández (piso Chamberí) | 4444 |
| Cliente | Isabel Romero (obra terminada con antes/después) | 4488 |
| Cliente | Nuria Delgado (pago solicitado) | 4411 |

La pantalla `/acceso` muestra en «Accesos de demo» el usuario y PIN de cada rol. El gerente ve todos los PIN en Ajustes → Usuarios y puede restablecerlos.

## Recorrido recomendado para la demo (≈10 min)

1. **Web pública** → «Pide tu presupuesto» y envía una solicitud con una foto.
2. **Gerente** → Panel: KPIs, «Requiere tu atención» y Gantt. Abre **Solicitudes**, avanza la nueva y conviértela en obra.
3. **Gerente** → Economía: compara el margen de Ponzano (holgado) y Lavapiés (ajustado).
4. **Jefe de obra** → Hoy: tareas del equipo. En una obra, crea una **orden de cambio** y envíala.
5. **Operario** → Hoy: ficha entrada, marca una tarea y envía un parte con foto.
6. **Cliente** → Mi reforma: lee el diario, desliza el antes/después, abre un documento y **firma la orden de cambio** con el dedo.
7. **Gerente** → Ajustes → Web: cambia el titular de la portada y míralo en la web.

## Qué es real y qué es simulado

**Real (funciona de verdad en el navegador):** usuarios con PIN, fichajes, tareas, partes con fotos comprimidas, incidencias, órdenes de cambio con firma táctil y justificante imprimible, plan de pagos, apuntes de coste y márgenes, documentos PDF/imagen con vista previa y descarga, antes/después, edición de la web, copias de seguridad.

**Simulado:** no se envían emails, SMS ni WhatsApp; no hay pagos online (solo transferencia con IBAN); los PIN no son una autenticación segura; los documentos de ejemplo del seed no tienen archivo (muestran una vista generada); las cifras, testimonios y fotos de ejemplo de la web son ficticios; cada dispositivo tiene sus propios datos (no se comparten entre móviles).

## Restablecer, exportar e importar

- **Restablecer la demo**: Ajustes → «Restablecer datos de demo».
- **Exportar copia** (gerente): Ajustes → Datos y copias de seguridad → «Exportar copia de seguridad». Descarga un `.json` con todos los datos y archivos.
- **Importar copia**: mismo apartado. Se valida el archivo antes de sustituir los datos.

## Límites de almacenamiento

- localStorage: unos **5 MB** por navegador (solo el JSON principal; Ajustes muestra el uso).
- IndexedDB: depende del navegador y del espacio libre (normalmente cientos de MB). Las fotos se comprimen al subirlas.
- Documentos: **máximo 5 MB por archivo**.
- Borrar los datos del navegador o usar modo incógnito elimina todo: exporta copias con frecuencia.

## Cómo adaptarlo a un caso real

1. **Datos de empresa, web, usuarios, gremios y tarifas**: todo se edita desde Ajustes, sin tocar código.
2. **Fases de obra y plan de pagos**: `src/lib/seed.ts` (`FASES`) y `src/lib/obras.ts` (`PLAN_PAGOS`).
3. **Umbrales del semáforo y de salud de margen**: `src/lib/analitica.ts` (`UMBRAL`, `salud`).
4. **Diseño**: tokens de color y tipografía en `src/styles.css`.

### Si se lleva a producción (con backend)

Para que varias personas compartan datos entre dispositivos haría falta:

- **Base de datos y API**: sustituir `loadDB`/`saveDB`/`mutate` (`src/lib/store.ts`) por llamadas a un servidor, tabla por entidad (obras, fases, partes, fichajes…), y mover los cálculos sensibles al servidor.
- **Autenticación real**: email/contraseña o enlace mágico en lugar de PIN, con roles y permisos por fila (el cliente solo ve su obra; el operario, sus obras asignadas).
- **Almacenamiento de archivos**: sustituir IndexedDB (`src/lib/archivos.ts`) por un almacenamiento de objetos con URLs firmadas.
- **Notificaciones**: email/WhatsApp al enviar una orden de cambio, solicitar un pago o publicar un parte.
- **Firma con validez legal**, pasarela de pago y facturación, y cumplimiento RGPD (consentimientos, conservación y borrado).
