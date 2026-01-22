# Protocolo de Incidencias: Pagos Bancamiga

**Prioridad**: ALTA (Afectación de Ingresos)
**Responsable**: DevOps / Soporte Nivel 2

## 1. Detección del Incidente

### Señales de Alerta
- **Múltiples reportes de usuarios**: "Hice el pago pero no se recarga mi saldo".
- **Logs de Edge Functions**: Aumento de errores 500 o Timeouts en `bancamiga-verify-payment`.
- **Discrepancia**: El dashboard de Bancamiga muestra el dinero, pero la App no.

## 2. Respuesta Inmediata (Primeros 5 Minutos)

1.  **Confirmar Incidente**: Verificar si es un caso aislado o generalizado.
2.  **Verificar Estado de Servicios**:
    - [Status Vercel](https://www.vercel-status.com/)
    - [Status Supabase](https://status.supabase.com/)
    - Portal Bancamiga (Acceso manual para verificar disponibilidad).
3.  **Evaluar Impacto**: Determinar número de usuarios afectados y monto estimado.

## 3. Diagnóstico

- Verificar logs de la función `bancamiga-verify-payment` en Supabase/Vercel.
- Buscar errores de conexión con la API de Bancamiga.
- Confirmar si hay cambios recientes en el código (último deploy).

## 4. Mitigación y Solución

- **Si Bancamiga está caído**:
    - Notificar a los usuarios (Banner en la App si es posible).
    - Activar modo "Validación Manual" (si existe la funcionalidad).
- **Si es error de código**:
    - Ejecutar Rollback inmediato en Vercel (ver `docs/rollback/vercel-rollback.md`).
- **Si son fallos de red esporádicos**:
    - Indicar a los usuarios que reintenten en unos minutos.
    - Los pagos no procesados deben conciliarse manualmente.

## 5. Cierre y Post-Mortem

- Validar que los pagos pendientes se hayan procesado.
- Documentar la causa raíz y las acciones tomadas.
- Actualizar este runbook si se descubren nuevos pasos de resolución.
