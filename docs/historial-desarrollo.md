# Historial de desarrollo

Obria se construyó en dos etapas. Primero, seis **fases de construcción** dieron forma a la app: acceso por rol y PIN, ficha de obras, día a día del operario y del jefe de obra, portal del cliente, órdenes de cambio y pagos, panel del gerente y web pública con solicitud de presupuesto. Después, una **auditoría de funcionalidad** detectó lo que faltaba para que todo fuera editable y seguro en el navegador, y se resolvió en las seis fases siguientes. Por último, un ajuste de producción eliminó las referencias a datos de prueba y añadió páginas legales, cookies y SEO.

Restricción permanente: sin backend ni nube; solo localStorage e IndexedDB.

## Fases de la auditoría

- [x] F1 — Base segura: migraciones, guardado protegido, recuperación de JSON corrupto, sincronización entre pestañas, fotos en IndexedDB, indicador de espacio y exportar/importar
- [x] F2 — Cálculos vivos (semáforo derivado)
- [x] F3 — Gestión de obra
- [x] F4 — Editar y borrar contenido
- [x] F5 — Administración
- [x] F6 — Archivos, escaparate, atribución y cierre
- [x] Ajuste de producción — sin referencias a datos de prueba, páginas legales, cookies, iconos y SEO
