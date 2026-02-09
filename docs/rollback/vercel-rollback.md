# Manual de Emergencia: Rollback en Vercel

**Cuándo usar**: 
- Error crítico en producción (Pantalla blanca, bucle infinito).
- Fallo masivo en funcionalidad core (Login, Solicitar Viaje).

## Opción 1: Instant Rollback (Recomendado)
*Tiempo estimado: < 1 minuto*

1. Ir al **Dashboard de Vercel** > Proyecto `mi-pana-app`.
2. Ir a la pestaña **Deployments**.
3. Identificar el último deploy "Verde" (Exitoso) conocido.
4. Clic en el menú (tres puntos) > **Instant Rollback**.
5. Confirmar.
   - *Esto revierte el frontend y las Edge Functions a la versión anterior inmediatamente.*

## Opción 2: CLI
Si no tienes acceso al dashboard pero sí a la terminal:
```bash
vercel rollback [deployment-url-id]
```

## Consideraciones
- **Variables de Entorno**: Un rollback *puede* no revertir cambios recientes en las variables de entorno si se hicieron manualmente en el dashboard. **Verificar Env Vars**.
- **Base de Datos**: El rollback de Vercel NO revierte la base de datos. Si el error fue por una migración SQL, ver `supabase-rollback.md`.
