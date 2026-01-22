# Manual de Emergencia: Rollback Vercel

**Cuándo usar**: 
- Errores críticos en producción justo después de un deploy.
- "Pantalla blanca" o loops de redirección infinitos.
- Regresiones bloqueantes.

## 1. Instant Rollback (Recomendado)

Vercel permite reversiones instantáneas a cualquier deployment anterior que haya sido exitoso.

1.  Ir al Dashboard de Vercel del proyecto.
2.  Navegar a la pestaña **Deployments**.
3.  Identificar el último deployment estable (conocido como "Last Good State").
4.  Hacer clic en el menú de tres puntos (•••) del deployment.
5.  Seleccionar **Rollback**.
6.  Confirmar la acción.

**Efecto**: Vercel actualizará inmediatamente los dominios de producción para apuntar a ese build antiguo.

## 2. Rollback vía CLI

Si no tienes acceso al Dashboard, pero sí al CLI:

```bash
vercel rollback [deployment-url]
```
o para usar el anterior inmediato:
```bash
vercel rollback
```

## Consideraciones

> [!WARNING]
> **Variables de Entorno**: Un rollback de código NO revierte cambios en las variables de entorno. Si cambiaste una variable `VITE_` que rompió el site, debes corregirla manualmente en Settings > Environment Variables antes o después del rollback.

> [!CAUTION]
> **Base de Datos**: El rollback de Vercel NO afecta a Supabase. Si el nuevo código hizo migraciones de DB destructivas, revertir el frontend podría causar inconsistencias. Verifica la compatibilidad DB <-> Frontend.
