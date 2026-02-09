# Manual de Emergencia: Rollback en Supabase (Base de Datos)

**Advertencia**: Supabase NO tiene un botón de "Deshacer" para migraciones aplicadas.
**Estrategia**: *Rollback Forward* (Aplicar una nueva migración que invierte los cambios).

## Procedimiento

1. **Identificar la migración problemática**
   Revisar `supabase/migrations/` y localizar el último archivo `.sql` aplicado.

2. **Crear script de reversión (Down Migration)**
   Crear un nuevo archivo SQL:
   ```bash
   supabase migration new revert_feature_x
   ```

3. **Escribir SQL Inverso**
   - Si la migración original hizo `CREATE TABLE x`, el revert hace `DROP TABLE x`.
   - Si agregó una columna, la elimina.
   
   *Ejemplo:*
   ```sql
   -- Archivo: supabase/migrations/2024..._revert_feature.sql
   ALTER TABLE rides DROP COLUMN IF EXISTS new_experimental_column;
   ```

4. **Aplicar a Producción**
   ```bash
   supabase db push
   ```

## Checklist de Seguridad
- [ ] ¿Hay datos nuevos en las columnas/tablas que voy a eliminar? (Hacer backup manual si es necesario: `supabase db dump`).
- [ ] ¿El rollback romperá el backend actual? (A veces se requiere revertir el código en Vercel *antes* de revertir la DB).
