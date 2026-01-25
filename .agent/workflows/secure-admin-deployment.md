---
description: Workflow para despliegue seguro de funcionalidades administrativas con validación de entorno
---
# Workflow: Despliegue Seguro de Admin con Validación de Entorno

## Contexto
Este workflow maneja despliegues de funcionalidades administrativas sensibles, detectando bloqueos de red y problemas de permisos.

## Reglas Maestras

### REGLA 1: Detección Preventiva de Bloqueos
Antes de cualquier operación:
1. Ejecutar script de validación: `node scripts/check-deploy-readiness.js`
   - Verifica conectividad a Supabase (`curl -I https://api.supabase.com`)
   - Verifica permisos en `node_modules`
2. Si falla, **DETENER** y notificar al usuario.

### REGLA 2: Seguridad en Admin (Edge Functions)
Para datos sensibles:
1. **NUNCA** exponer consultas directas en el cliente.
2. **SIEMPRE** usar Edge Functions en `/supabase/functions/`.
3. Validar `role === 'admin'` en el servidor.

### REGLA 3: Manejo de Errores EPERM
Si se detecta `EPERM`:
```bash
# Ejecutar limpieza de permisos
sudo chown -R $(whoami) node_modules ~/.npm
rm -rf node_modules package-lock.json
npm install
```

## Pasos de Ejecución

1. **Validación Previa**
   ```bash
   node scripts/check-deploy-readiness.js
   ```

2. **Desarrollo/Refactorización**
   - Identificar lógica sensible.
   - Migrar a Edge Function:
     ```bash
     supabase functions new [nombre-funcion]
     ```
   - Implementar validación de rol admin.

3. **Despliegue**
   - Si la red lo permite:
     ```bash
     supabase functions deploy [nombre-funcion]
     ```
   - Si hay bloqueo, solicitar despliegue manual o uso de VPN.
