# Obria · Gestión de obras para Reformas Arnal

Obria es una aplicación hecha a medida para una empresa de reformas integrales: web pública con solicitud de presupuesto, gestión de obras para el equipo y portal de seguimiento para el cliente. Es un **caso de uso de desarrollo a medida**, no un SaaS: el cliente, **Reformas Arnal** (Madrid), es ficticio y la app funciona íntegramente en el navegador, sin backend.

![Portada de la web pública de Reformas Arnal](docs/captura-portada.jpg)

> Un producto de [Vivir de IA](https://vivirdeia.com) · creado por [Isaac Wesley](https://linkedin.com/in/isaacwesleey)

---

## Índice

1. [Qué incluye](#qué-incluye)
2. [Roles y accesos](#roles-y-accesos)
3. [Recorrido recomendado](#recorrido-recomendado)
4. [Instalación en local](#instalación-en-local)
5. [Estructura de carpetas](#estructura-de-carpetas)
6. [Arquitectura de datos](#arquitectura-de-datos)
7. [Qué es real y qué es simulado](#qué-es-real-y-qué-es-simulado)
8. [Datos y copias de seguridad](#datos-y-copias-de-seguridad)
9. [Límites de almacenamiento](#límites-de-almacenamiento)
10. [Legal, cookies y SEO](#legal-cookies-y-seo)
11. [Remixar y adaptar a otra empresa](#remixar-y-adaptar-a-otra-empresa)
12. [Llevarlo a producción con backend](#llevarlo-a-producción-con-backend)
13. [Créditos](#créditos)

---

## Qué incluye

| Área | Ruta | Qué hace |
|---|---|---|
| Web pública | `/` | Portada, servicios, galería antes/después, cómo trabajamos, cifras, testimonios, preguntas frecuentes y contacto. Todo el texto se edita en Ajustes → Web. |
| Solicitud de presupuesto | `/presupuesto` | Formulario en varios pasos con fotos y aceptación de la política de privacidad. Llega a la bandeja del gerente. |
| Acceso | `/acceso` | Entrada por perfil, usuario y PIN de 4 cifras. |
| Gerente | `/panel`, `/solicitudes`, `/obras`, `/equipo`, `/economia`, `/ajustes` | KPIs, «Requiere tu atención», Gantt, solicitudes convertibles en obra, alta de obras, equipo, economía con márgenes y administración. |
| Jefe de obra | `/hoy`, `/obras/$id` | Fichajes, tareas, partes diarios, incidencias, órdenes de cambio, costes, documentos y antes/después de sus obras. |
| Operario | `/hoy`, `/parte/$id`, `/incidencia/$id` | Fichar entrada y salida, marcar tareas, enviar partes con fotos y avisar de incidencias. |
| Cliente | `/mi-reforma` | Avance, próximos hitos, diario de obra, antes/después, documentos, órdenes de cambio con firma táctil y plan de pagos con IBAN. |
| Legal | `/aviso-legal`, `/privacidad`, `/cookies`, `/terminos` | Textos legales rellenados con los datos de empresa. |

El cliente nunca ve fichajes, horas, incidencias internas ni importes de gremios: solo los partes marcados como «Visible para el cliente».

## Roles y accesos

La interfaz **no muestra los PIN** en ningún sitio. Están documentados solo aquí, para quien pruebe o remixe el proyecto. El gerente los restablece desde **Ajustes → Usuarios** (botón «PIN») y cada usuario puede cambiar el suyo en **Ajustes → Cambiar mi PIN**, introduciendo el actual.

| Rol | Usuario | PIN | Notas |
|---|---|---|---|
| Gerente | Javier Arnal | 1111 | Acceso completo |
| Jefe de obra | Marta Ruiz | 2222 | |
| Jefe de obra | Raúl Moreno | 2233 | |
| Operario | Antonio Gil (Oficial de 1ª) | 3333 | Otros operarios: 3344 a 3388 |
| Cliente | Lucía Fernández | 4444 | Piso en Chamberí, obra en curso |
| Cliente | Isabel Romero | 4488 | Obra terminada con antes/después |
| Cliente | Nuria Delgado | 4411 | Con un pago solicitado |

Los PIN son únicos. Los usuarios dados de baja no aparecen en el acceso y, si tenían la sesión abierta, se cierra.

## Recorrido recomendado

Unos 10 minutos:

1. **Web pública**: pulsa «Pide tu presupuesto» y envía una solicitud con una foto.
2. **Gerente**: en el Panel revisa KPIs, «Requiere tu atención» y el Gantt. En Solicitudes, avanza la nueva y conviértela en obra.
3. **Gerente**: en Economía compara el margen de Ponzano (holgado) con el de Lavapiés (ajustado).
4. **Jefe de obra**: en Hoy revisa las tareas del equipo. En una obra, crea una orden de cambio y envíala.
5. **Operario**: en Hoy ficha la entrada, marca una tarea y envía un parte con foto.
6. **Cliente**: en Mi reforma lee el diario, desliza el antes/después, abre un documento y firma la orden de cambio con el dedo.
7. **Gerente**: en Ajustes → Web cambia el titular de la portada y compruébalo en la web.

Para volver al punto de partida: **Ajustes → Mantenimiento → «Restaurar datos iniciales»**.

## Instalación en local

**Requisitos:** [Bun](https://bun.sh) 1.x (el proyecto usa `bun.lock`). Node.js 20 o superior también sirve para ejecutar Vite.

```bash
bun install        # instala dependencias
bun run dev        # servidor de desarrollo
bun run build      # compilación de producción
bun run preview    # sirve la compilación
bun run lint       # ESLint
bun run test       # pruebas con Vitest
```

### Scripts disponibles

| Script | Comando | Uso |
|---|---|---|
| `dev` | `vite dev` | Desarrollo con recarga en caliente |
| `build` | `vite build` | Compilación de producción |
| `build:dev` | `vite build --mode development` | Compilación en modo desarrollo |
| `preview` | `vite preview` | Previsualizar la compilación |
| `lint` | `eslint .` | Revisión de código |
| `format` | `prettier --write .` | Formateo |
| `test` | `vitest run` | Pruebas una vez |
| `test:watch` | `vitest` | Pruebas en modo vigilancia |

Tecnología: TanStack Start v1 (React 19), Vite 7, Tailwind CSS v4 y TypeScript.

## Estructura de carpetas

```text
public/          Iconos, manifest y robots.txt
docs/            Documentación interna e historial de desarrollo
src/
  routes/        Una ruta por archivo (enrutado por archivos de TanStack)
  components/    Pantallas y piezas reutilizables
  lib/           Modelo de datos, almacenamiento y reglas de negocio
  styles.css     Tokens de diseño (colores, tipografías)
```

### `src/lib`

| Archivo | Contenido |
|---|---|
| `types.ts` | Tipos del modelo (`DB`, `Obra`, `Usuario`, `Apunte`, `Empresa`, `Web`…) |
| `store.ts` | `loadDB`, `saveDB`, `mutate`, migraciones (`MIGRACIONES`), sesión, copias y `resetDB` |
| `seed.ts` | Datos iniciales (`createSeed`), fases (`FASES`) y `DB_VERSION` |
| `archivos.ts` | Almacén de archivos en IndexedDB y referencias `idb:<id>` |
| `analitica.ts` | Semáforo (`calcularEstadoObra`, `UMBRALES`), avance, desviación, `costeReal` y `salud` |
| `economia.ts` | Órdenes de cambio, IVA y plan de pagos |
| `costes.ts` | Apuntes de coste y `tarifaDe` |
| `obras.ts` | Acciones de fases, recálculo de fechas, borrado y `PLAN_PAGOS` |
| `usuarios.ts` | PIN únicos (`pinUnico`), historial y gremios |
| `empresa.ts` | Datos de empresa por defecto (`EMPRESA_DEFECTO`), `empresaDe` y validación de IBAN |
| `web.ts` | Textos de la web (`WEB_DEFECTO`, `webDe`) |
| `cookies.ts` | Consentimiento de cookies |
| `deshacer.ts` | `conDeshacer`: deshacer acciones destructivas |
| `actividad.ts` | Actividad inicial de las obras (partes, tareas, incidencias) |
| `fechas.ts` | Utilidades de fechas |
| `sitemap.ts` | Generación de `/sitemap.xml` a partir de las rutas |

### `src/components`

| Archivo | Contenido |
|---|---|
| `obria.tsx` | Estructura de la app (`AppShell`), `Logo`, `Avatar` y navegación |
| `portal.tsx` | Portal del cliente y comparador antes/después |
| `gestion-obra.tsx` | Fases, edición de obra, equipo, mensaje al cliente y zona de borrado |
| `gestion-contenido.tsx` | Notas, fichajes y avisos de fichajes olvidados |
| `formularios.tsx` | `Confirmar`, formularios de parte e incidencia |
| `admin.tsx` | Usuarios, cambio de PIN, gremios, tarifas, datos de empresa y apuntes de coste |
| `documentos.tsx` | Documentos y antes/después de cada obra |
| `web-admin.tsx` | Editor de la web pública |
| `equipo-economia.tsx` | Vistas de equipo y economía |
| `firma.tsx` / `justificante.tsx` | Firma táctil y justificante imprimible |
| `fotos.tsx` | Subida y compresión de fotos |
| `avisos-almacen.tsx` | Avisos de espacio lleno y recuperación de datos |
| `legal.tsx` / `cookies.tsx` | Páginas legales y aviso de cookies |
| `atribucion.tsx` | Atribución fija del producto |

## Arquitectura de datos

No hay servidor, base de datos remota ni nube. Todo se guarda en el dispositivo:

| Pieza | Dónde | Qué guarda |
|---|---|---|
| Base de datos | localStorage `obria:db:v1` | Un JSON con obras, usuarios, fichajes, partes, solicitudes, empresa y web |
| Sesión | localStorage `obria:session` | Usuario con la sesión abierta |
| Cookies | localStorage `obria:cookies` | Preferencias del aviso de cookies |
| Archivos | IndexedDB `obria-archivos` | Fotos, firmas, logos, albaranes y documentos; el JSON solo guarda referencias `idb:<id>` |

- **Migraciones**: cada cambio de formato sube `DB_VERSION` (`src/lib/seed.ts`) y añade una entrada en `MIGRACIONES` (`src/lib/store.ts`) que completa los campos nuevos. Los datos existentes nunca se vuelven a sembrar.
- **Guardado protegido**: `saveDB` y `mutate` nunca lanzan errores. Si el espacio se llena, se avisa en pantalla. Si el JSON se corrompe, se guarda una copia descargable y se cargan los datos iniciales.
- **Sincronización**: las pestañas abiertas se actualizan entre sí con el evento `storage`, incluido el cierre de sesión.
- **Cálculos vivos**: el semáforo, el avance, la desviación, la fecha fin estimada, los márgenes y los cobros se calculan siempre a partir de los datos (`src/lib/analitica.ts`, `src/lib/economia.ts`). Solo `estadoManual` permite forzar el estado de una obra.

## Qué es real y qué es simulado

| Real (funciona en el navegador) | Simulado o fuera de alcance |
|---|---|
| Usuarios con PIN, altas, bajas y restablecimiento | Los PIN no son una autenticación segura |
| Fichajes, tareas, partes con fotos comprimidas e incidencias | No se envían emails, SMS ni WhatsApp |
| Órdenes de cambio con firma táctil y justificante imprimible | La firma no tiene validez legal certificada |
| Plan de pagos y avisos con IBAN | No hay pagos online |
| Apuntes de coste, márgenes y economía | Cada dispositivo tiene sus propios datos |
| Documentos PDF e imagen con vista previa y descarga | Algunos documentos iniciales no tienen archivo adjunto |
| Edición de la web, páginas legales y aviso de cookies | Cifras, testimonios y fotos iniciales de la web son ficticios |

## Datos y copias de seguridad

Todo está en **Ajustes**, solo para el gerente:

- **Exportar copia de seguridad** (Datos y copias de seguridad): descarga un `.json` con la base de datos y todos los archivos.
- **Importar copia de seguridad**: valida el archivo y, tras confirmarlo, sustituye los datos del dispositivo.
- **Restaurar datos iniciales** (Mantenimiento): vuelve a cargar los datos de partida, con confirmación en dos pasos.

## Límites de almacenamiento

| Almacén | Límite aproximado |
|---|---|
| localStorage | Unos 5 MB por navegador (solo el JSON; Ajustes muestra el uso) |
| IndexedDB | Depende del navegador y del disco, normalmente cientos de MB |
| Documentos | Máximo 5 MB por archivo |

Las fotos se comprimen al subirlas. Borrar los datos del navegador o usar el modo incógnito elimina todo: conviene exportar copias con frecuencia.

## Legal, cookies y SEO

- **Páginas legales** (`/aviso-legal`, `/privacidad`, `/cookies`, `/terminos`), conforme a RGPD y LSSI, rellenadas con razón social, CIF, dirección y email de Ajustes → Datos de la empresa. Enlazadas desde el pie de la web y desde el formulario de presupuesto.
- **Aviso de cookies** con Aceptar, Rechazar y Configurar con la misma relevancia. Google Fonts solo se carga si se acepta; si no, se usan las tipografías del dispositivo. Se puede cambiar desde «Configurar cookies» en el pie.
- **SEO**: título y descripción propios en cada ruta, Open Graph y Twitter card, `lang="es"`, `theme-color`, icono, `apple-touch-icon` y `manifest.webmanifest`. Las rutas internas llevan `noindex`; `public/robots.txt` y `/sitemap.xml` solo incluyen las páginas públicas.

## Remixar y adaptar a otra empresa

1. **Remixar en Lovable**: abre el proyecto y usa «Remix» para crear tu copia. Los datos viven en cada navegador, así que la copia arranca con los datos iniciales.
2. **Datos de empresa, web, usuarios, gremios y tarifas**: desde Ajustes, sin tocar código. Para cambiar los valores de partida, edita `EMPRESA_DEFECTO` (`src/lib/empresa.ts`), `WEB_DEFECTO` (`src/lib/web.ts`) y `createSeed` (`src/lib/seed.ts`).
3. **Fases de obra**: `FASES` en `src/lib/seed.ts`.
4. **Plan de pagos**: `PLAN_PAGOS` en `src/lib/obras.ts`.
5. **Umbrales**: semáforo en `UMBRALES` y salud de margen en `salud` (`src/lib/analitica.ts`).
6. **Diseño**: colores y tipografías en `src/styles.css`; iconos y manifest en `public/`.

Si cambias el formato de los datos, sube `DB_VERSION` y añade su migración en `MIGRACIONES`.

## Llevarlo a producción con backend

Para que varias personas compartan datos entre dispositivos haría falta:

- **Base de datos y API**: sustituir `loadDB`, `saveDB` y `mutate` (`src/lib/store.ts`) por llamadas a un servidor, con una tabla por entidad, y mover los cálculos sensibles al servidor.
- **Autenticación real**: email y contraseña o enlace mágico en lugar de PIN, con roles y permisos por fila (el cliente solo ve su obra; el operario, sus obras asignadas).
- **Archivos**: sustituir IndexedDB (`src/lib/archivos.ts`) por almacenamiento de objetos con URLs firmadas.
- **Notificaciones**: email o WhatsApp al enviar una orden de cambio, solicitar un pago o publicar un parte.
- **Cumplimiento**: firma electrónica con validez legal, pasarela de pago, facturación y gestión RGPD de consentimientos, conservación y borrado.

## Créditos

Un producto de [Vivir de IA](https://vivirdeia.com) · creado por [Isaac Wesley](https://linkedin.com/in/isaacwesleey). Construido con [Lovable](https://lovable.dev). Fotografías de [Unsplash](https://unsplash.com).

El historial de construcción está en [docs/historial-desarrollo.md](docs/historial-desarrollo.md).
