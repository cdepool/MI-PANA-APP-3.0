# Rollback de Base de Datos (Supabase)

**Realidad**: Supabase (PostgreSQL) no tiene un botón de "Undo" automático para producción. Las reversiones deben ser deliberadas y manuales via migraciones "Down".

## Estrategia de Reversión

La mejor forma de "revertir" es avanzar hacia un estado previo corregido.

### 1. Identificar el Cambio Problemático
Revisar el historial de migraciones (`supabase/migrations/`) para saber cuál fue la última aplicada.

### 2. Crear Migración de Reversión ("Down Migration")

Si aplicaste una tabla nueva o columna:
1.  Generar nueva migración:
    ```bash
    supabase migration new revert_feature_x
    ```
2.  Escribir el SQL inverso.
    - Si fue `CREATE TABLE x`, el inverso es `DROP TABLE x`.
    - Si fue `ALTER TABLE add column`, el inverso es `ALTER TABLE drop column`.

### 3. Aplicar en Producción

**Opción A: CLI (CI/CD)**
Push de la nueva migración al repositorio. El pipeline de CI/CD debería aplicarla automáticamente.

**Opción B: Manual (Emergencia)**
Si el CI/CD está roto, usar SQL Editor en el Dashboard de Supabase con precaución extrema.

## Checklist de Seguridad DB

- [ ] **Backups**: Antes de cualquier operación manual destructiva, verificar el último backup en Supabase Dashboard > Database > Backups.
- [ ] **Locks**: Evitar operaciones que bloqueen tablas muy usadas (`ALTER TABLE` en horas pico) si es posible.
- [ ] **Data Loss**: Confirmar que borrar la columna/tabla no elimina datos de usuario irrecuperables (hacer dump previo si es necesario).
