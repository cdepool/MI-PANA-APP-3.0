# Actualización Manual de Tasa BCV - Manual de Emergencia

Este documento describe los procedimientos para actualizar manualmente la tasa de cambio BCV cuando el sistema automático presenta datos obsoletos.

## 🚨 Cuándo Usar Este Procedimiento

Utilizar **solo cuando**:
- DolarAPI.com tiene datos con más de 24 horas de antigüedad
- La tasa mostrada en la app difiere significativamente de bcv.org.ve (>2%)
- El sistema de actualización automática ha fallado

## ✅ Opción 1: Override Temporal (localStorage) - RECOMENDADO

**Ventajas:** Inmediato, no requiere deploy, válido por 24h

**Pasos:**

1. Verificar tasa actual en https://www.bcv.org.ve/
2. Abrir https://mi-pana-app-3-0.vercel.app/ (producción)
3. Abrir DevTools (F12) → Console
4. Ejecutar:

```javascript
// Ejemplo con tasa 352.71 Bs/$
const nuevaTasa = 352.71; // ⬅️ ACTUALIZAR CON TASA REAL
const validez = 24; // horas de validez

const expiry = Date.now() + (validez * 60 * 60 * 1000);

localStorage.setItem('bcv_rate_override', JSON.stringify({
  rate: nuevaTasa,
  expiry: expiry,
  updatedBy: 'admin',
  timestamp: new Date().toISOString()
}));

console.log(`✅ Override activado: ${nuevaTasa} Bs (válido ${validez}h)`);
location.reload();
```

5. Verificar que el header muestra la nueva tasa (sin ⚠️)

**Desactivar override:**
```javascript
localStorage.removeItem('bcv_rate_override');
location.reload();
```

---

## 💾 Opción 2: SQL Direct Update - Base de Datos

**Ventajas:** Persistente, afecta a todos los usuarios inmediatamente

**Pasos:**

1. Verificar tasa actual en https://www.bcv.org.ve/
2. Ir a Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT
3. SQL Editor → New Query
4. Ejecutar:

```sql
-- Insertar o actualizar tasa de hoy
INSERT INTO exchange_rates (rate, rate_type, effective_date, source)
VALUES (352.71, 'oficial', CURRENT_DATE, 'manual_override')
ON CONFLICT (effective_date, rate_type)
DO UPDATE SET 
  rate = 352.71, 
  source = 'manual_override',
  updated_at = NOW();

-- Verificar inserción
SELECT * FROM exchange_rates 
WHERE effective_date = CURRENT_DATE 
AND rate_type = 'oficial';
```

5. Verificar en app que la tasa se actualizó (puede tardar hasta 5 min)

---

## 🔧 Opción 3: Code Update + Deploy - Permanente

**Ventajas:** Cambio controlado vía Git, auditado

**Pasos:**

1. Verificar tasa en https://www.bcv.org.ve/

2. Editar `src/services/pricingService.ts`:
```typescript
export let currentBcvRate = 352.71; // Actualizado 23-ene-2026
```

3. Editar `src/services/exchangeRateService.ts` (línea 130):
```typescript
return {
  rate: 352.71, // ⬅️ ACTUALIZAR AQUÍ
  source: 'hardcoded_fallback',
  isFresh: false
};
```

4. Commit y push:
```bash
git add src/services/pricingService.ts src/services/exchangeRateService.ts
git commit -m "fix(bcv): Update emergency fallback rate to 352.71 Bs"
git push origin main
```

5. Vercel detectará el push y hará deploy automático (~2 min)

---

## 🔍 Verificación Post-Actualización

### En Producción:
1. Abrir https://mi-pana-app-3-0.vercel.app/
2. Verificar header: debe mostrar 📈 (no ⚠️) y tasa correcta
3. Revisar DevTools Console: buscar `✅ Tasa BCV Actualizada`

### Test de cálculo:
```javascript
// En Console
import('../services/pricingService.js').then(({ calculatePrice }) => {
  const { ves } = calculatePrice(10, 'el_pana'); // 10km El Pana
  console.log('Precio 10km:', ves, 'Bs');
  // Debe coincidir con: ~3.80 USD * tasa_actual
});
```

---

## 📊 Diagnóstico: Verificar Source Actual

```javascript
// En Console de la app
import('../services/exchangeRateService.js').then(async ({ fetchBcvRateWithFallback }) => {
  const { rate, source, isFresh } = await fetchBcvRateWithFallback();
  console.log({
    tasa: rate,
    fuente: source,
    fresco: isFresh ? 'SÍ' : 'NO (>48h)'
  });
});
```

**Interpretación:**
- `source: 'DolarAPI'` + `isFresh: true` → ✅ Sistema funcionando correctamente
- `source: 'DolarAPI'` + `isFresh: false` → ⚠️ DolarAPI desactualizado
- `source: 'Supabase'` → 📊 Fallback activado, DolarAPI falló
- `source: 'manual_override'` → 👤 Override manual activo
- `source: 'hardcoded_fallback'` → 🚨 Todas las fuentes fallaron

---

## ⏰ Monitoreo Preventivo

### Verificación Diaria Recomendada:
1. Comparar tasa en app vs https://www.bcv.org.ve/ (11:00 AM VET)
2. Si diferencia >2%: aplicar Opción 1 (override temporal)
3. Si DolarAPI falla >3 días: contactar soporte de dolarapi.com

### Configurar Alerta (Opcional):
```javascript
// Ejecutar cada 6h en background worker o cron job
const checkStaleness = async () => {
  const { isFresh } = await fetchBcvRateWithFallback();
  if (!isFresh) {
    // Enviar notificación a admin
    alert('⚠️ Tasa BCV desactualizada - Acción requerida');
  }
};
```

---

## 📞 Contacto de Emergencia

- **DolarAPI Status:** https://status.dolarapi.com (verificar outages)
- **BCV Oficial:** https://www.bcv.org.ve/estadisticas/tipo-cambio-de-referencia-smc
- **Backup Source:** https://www.bcv.org.ve/

---

## 🔄 Rollback de Override

Si un override manual causó problemas:

```javascript
// Limpiar override y volver a sources automáticas
localStorage.removeItem('bcv_rate_override');
sessionStorage.clear();
location.reload();
```

---

**Última actualización:** 23 de enero 2026  
**Versión:** 1.0
