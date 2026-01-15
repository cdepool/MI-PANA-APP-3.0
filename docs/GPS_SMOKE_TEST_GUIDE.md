# 📱 GPS Smoke Test Guide - MI PANA APP

## Objetivo
Verificar el funcionamiento del GPS en segundo plano antes de ir a producción.
El resultado determina si continuar como PWA pura o migrar a Capacitor para conductores.

---

## Dispositivos de Prueba

| Dispositivo | OS | Tipo | Prioridad |
|-------------|-----|------|-----------|
| iPhone SE 2020 | iOS 17+ | Gama baja iOS | CRÍTICO |
| Samsung Galaxy A03 | Android 12+ | Gama baja Android | CRÍTICO |
| iPhone 13/14 | iOS 17+ | Gama media iOS | Opcional |
| Samsung Galaxy A54 | Android 13+ | Gama media Android | Opcional |

---

## Pre-requisitos

1. **App instalada como PWA**
   - En iOS: Safari → Compartir → Añadir a Inicio
   - En Android: Chrome → Menú → Instalar app

2. **Permisos otorgados**
   - Ubicación: "Permitir siempre" o "Mientras se usa"
   - Notificaciones: Activadas

3. **Servidor corriendo**
   - App desplegada en `app.mipana.app` o
   - Túnel local con `ngrok` para pruebas

---

## Procedimiento de Prueba

### Test 1: GPS en Primer Plano (5 min)

1. Abrir app como conductor
2. Activar toggle "En Línea"
3. Iniciar ruta de 5 km en Google Maps (modo conducción)
4. Monitorear actualizaciones en base de datos:
   ```sql
   SELECT driver_id, 
          ST_AsText(location) as coords, 
          last_updated,
          speed_kmh
   FROM driver_locations 
   WHERE driver_id = 'UUID_DEL_CONDUCTOR'
   ORDER BY last_updated DESC
   LIMIT 20;
   ```

**Criterio de éxito**: Actualizaciones cada 3-5 segundos

---

### Test 2: Pantalla Bloqueada (3 min)

1. Con app activa y online, **bloquear pantalla**
2. Continuar conduciendo
3. Verificar actualizaciones en BD

| Resultado | Acción |
|-----------|--------|
| ✅ Actualizaciones continúan | PWA viable |
| ⚠️ Se detienen después de 30s | Revisar permisos |
| ❌ Se detienen inmediatamente | Requiere Capacitor |

---

### Test 3: App en Background (5 min)

1. Con app online, **cambiar a otra app** (WhatsApp, Maps)
2. Usar la otra app activamente
3. Después de 5 min, volver a MI PANA
4. Verificar actualizaciones en BD durante la ausencia

**iOS esperado**: GPS se detiene tras ~30s (limitación de Safari)
**Android esperado**: GPS continúa si está en apps recientes

---

### Test 4: Viaje Completo Simulado (15 min)

1. Conductor acepta viaje simulado
2. Conduce hacia origen (5 min)
3. Recoge pasajero (simular con botón)
4. Conduce a destino (10 min)
5. Durante el viaje, pasajero verifica en su dispositivo que ve el conductor moverse

**Verificar**:
- [ ] Pasajero ve actualizaciones de ubicación
- [ ] Posición se actualiza en mapa cada 5-10 segundos
- [ ] ETA se recalcula

---

## Registro de Resultados

### iPhone SE 2020 - iOS 17
| Test | Resultado | Notas |
|------|-----------|-------|
| Primer plano | | |
| Pantalla bloqueada | | |
| Background | | |
| Viaje completo | | |

### Samsung Galaxy A03 - Android
| Test | Resultado | Notas |
|------|-----------|-------|
| Primer plano | | |
| Pantalla bloqueada | | |
| Background | | |
| Viaje completo | | |

---

## Decisión Final

| Escenario | Recomendación |
|-----------|---------------|
| Ambos dispositivos pasan Test 1-4 | ✅ Continuar como PWA |
| iOS falla en background, Android OK | ⚠️ PWA por ahora, planear Capacitor para iOS |
| Ambos fallan en background | ❌ Migrar conductores a Capacitor |
| GPS muy impreciso (>100m) | ❌ Revisar configuración de precisión |

---

## Comandos Útiles

```bash
# Ver logs del Edge Function en tiempo real
supabase functions logs match-driver --tail

# Verificar driver_locations recientes
psql $DATABASE_URL -c "SELECT * FROM driver_locations ORDER BY last_updated DESC LIMIT 5;"

# Contar actualizaciones en última hora
psql $DATABASE_URL -c "SELECT COUNT(*) FROM driver_locations WHERE last_updated > NOW() - INTERVAL '1 hour';"
```
