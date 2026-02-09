# Runbook: Incidente con Pagos Bancamiga

**Severidad**: ALTA (Afecta ingresos y confianza)
**Dueño**: Finanzas / Tecnología

## 1. Detección
- **Síntomas**: 
  - Usuarios reportan "Pago realizado pero no recargado".
  - Logs de `bancamiga-verify-payment` muestran timeouts o errores 500.
  - Alerta de discrepancia en Dashboard Administrativo.

## 2. Diagnóstico (Primeros 5 min)
1. Verificar estado de Bancamiga (redes sociales / portal oficial).
2. Revisar logs de Supabase Edge Functions:
   ```bash
   # En Dashboard Supabase > Edge Functions > bancamiga-verify-payment > Logs
   # Buscar errores de conexión o "Invalid response"
   ```
3. Confirmar si es masivo (múltiples usuarios) o aislado.

## 3. Mitigación
- **Si Bancamiga está caído**:
  1. Notificar a usuarios mediante banner en app (Configuración Remota / Tabla `system_settings`).
  2. Pausar temporalmente nuevas recargas vía Bancamiga si el fallo es crítico (evitar retenciones).
- **Si es error interno (App)**:
  1. Identificar último deploy.
  2. Ejecutar Rollback en Vercel si coincide con un deploy reciente.

## 4. Resolución Manual (Reconciliación)
Para recargas no acreditadas pero cobradas:
1. Solicitar al usuario: Referencia bancaria, fecha, monto exacto.
2. Validar en Portal Bancamiga que el dinero entró.
3. Usar herramienta interna de admin para "Recarga Manual" (Admin Dashboard).
   *No modificar base de datos directamente.*

## 5. Post-Mortem
- Registrar hora inicio/fin.
- Cantidad de usuarios afectados.
- Acciones correctivas para evitar recurrencia (ej. mejorar retries).
