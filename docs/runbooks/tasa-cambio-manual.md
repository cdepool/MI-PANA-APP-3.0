# Runbook: Gestión de Tasa de Cambio

**Propósito**: Mantener la tasa VES/USD actualizada para cálculos de precios.

## 1. Funcionamiento Automático
- Existe un Cron Job (Edge Function `exchange-rate-sync`) que corre cada X horas.
- Fuente de datos: BCV (Banco Central de Venezuela) o Monitor (se define en config).

## 2. Actualización Manual (Fallo de Sync)
Si el sync automático falla o hay una volatilidad extrema:

### Opción A: Dashboard Admin (Recomendado)
1. Ir a Configuración del Sistema.
2. Buscar "Tasa de Cambio".
3. Editar valor y guardar.
   - *Efecto inmediato en nuevas estimaciones de viaje.*

### Opción B: Tasa de Contingencia
Si no hay acceso al Dashboard:
- Contactar a equipo de desarrollo para actualizar la variable de entorno o registro en BD directamente.

## 3. Validación
- Simular un viaje en la App.
- Verificar que el `priceVes` corresponda a `priceUsd * TasaNueva`.

## 4. Alertas
- El sistema debería alertar si la tasa no se actualiza en >24h.
