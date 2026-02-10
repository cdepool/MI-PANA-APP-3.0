# Checklist Pre-Despliegue (Step 7)

Antes de proceder con el despliegue a Staging/Producción, por favor valida los siguientes puntos críticos.

## 1. Estado del Repositorio
*   **Rama Actual:** `main` (o branch de feature).
*   **Cambios Pendientes:** Existen múltiples archivos modificados y reportes no rastreados.
    *   [ ] Comitear cambios de Optimización (Step 5) y Documentación (Step 6).
    *   [ ] (Opcional) Crear tag de versión `v3.0.0-rc1`.

## 2. Pruebas Automáticas
*   **Unit Tests:** ✅ PASARON (45/45 tests).
*   **Smoke E2E (Local):** ⚠️ Parcial (Login OK, Wallet Navigation OK, UI Interaction requires manual check).

## 3. Infraestructura (Manual)
### Supabase
*   [ ] **Backups:** Confirmar que existe un backup reciente de la base de datos de producción.
    *   *Tip:* Ir a `Supabase Dashboard > Database > Backups`.
*   **Edge Functions:**
    *   [ ] Desplegar funciones actualizadas (`wallet-get-balance`, etc.):
        ```bash
        supabase functions deploy --no-verify-jwt
        ```
    *   [ ] Verificar secrets en Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`):
        ```bash
        supabase secrets list
        ```

### Vercel
*   [ ] **Variables de Entorno:** Verificar en `Project Settings > Environment Variables` que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` apunten al proyecto de PRODUCCIÓN.
*   [ ] **Build Logs:** Revisar que el último despliegue (si es automático) no tenga errores de build.

## 4. Decisión de Go/No-Go
*   [ ] ¿Backups confirmados?
*   [ ] ¿Funciones desplegadas?
*   [ ] ¿Variables de entorno correctas?

**Resultado:** [ PROCEDER / DETENER ]
