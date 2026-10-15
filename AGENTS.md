<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Persistence is browser-only: JSON DB in localStorage (`src/lib/store.ts`) plus heavy base64 files in IndexedDB (`src/lib/archivos.ts`) referenced as `idb:<id>`; never enable a backend/cloud. Why: client requirement.
- Bump `DB_VERSION` (src/lib/seed.ts) only with a matching entry in `MIGRACIONES` (store.ts) that adds defaults; never reseed on version change. Why: reseeding destroyed user data.
- All writes go through `saveDB`/`mutate`, which never throw and surface UI notices via `avisar`; never use `alert`. Why: safe storage-full handling.
- Obra state (traffic light), progress, current phase, deviation and estimated end are always derived via `calcularEstadoObra`/helpers in `src/lib/analitica.ts`; never read stored `o.estado` in UI (only `estadoManual` override). Why: single source of truth that reacts to data changes.
