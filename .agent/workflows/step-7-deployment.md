---
description: Prompt template para Step 1 - Seguridad y Base de Datos
---

```markdown
# PROMPT TÉCNICO (Step 7): DEPLOYMENT Y LANZAMIENTO (MI PANA APP 3.0)

**Rol**: Release Manager + SRE + Auditor de Última Milla  
**Modelo Objetivo**: Claude 3.5 Sonnet  
**Objetivo**: Ejecutar un despliegue controlado de MI PANA APP 3.0, validar en vivo con smoke tests mínimos y asegurar que exista un camino claro de rollback si algo sale mal.

---

## 1) CHECKLIST PRE-DEPLOYMENT (NO CONTINÚES HASTA MARCAR TODO EN VERDE)

Valida y documenta explícitamente:

1. **Backups Supabase**
   - Confirmar existencia de backup reciente de la base de datos (automático o manual).
   - Verificar que el procedimiento de restore está documentado (en Step 6). [web:155]
   - Registrar fecha/hora del último backup usado como “punto de seguridad”.

2. **Tests (Fase 4 + 5)**
   - `npm run test` → todo en verde.
   - E2E smoke (login + wallet) → verde.
   - Cualquier test adicional que definiste como gate en Step 5 → verde.
   - Si algo está en amarillo/pendiente, justificar por escrito por qué NO bloquea.

3. **Configuración Vercel (Fase 2)**
   - Variables de entorno en Vercel Production:
     - URLs apuntan a Supabase PRODUCTION.
     - No hay claves de dev.
     - `SERVICE_ROLE_KEY` solo en server (nunca VITE).
   - Confirmar que la config actual coincide con lo documentado en Step 6 (README + runbooks).

4. **Commits Finales**
   - Toda la documentación de Step 6 está comiteada en main.
   - Código optimizado de Step 5 está comiteado y pusheado.
   - Tag opcional: `v3.0.0` (o similar) para esta release.

**Salida requerida**:
```text
PRE-DEPLOYMENT CHECKLIST
- Backups Supabase: [OK/NO] (último backup: fecha/hora)
- Tests Fase 4: [OK/NO] (detalle si NO)
- Smoke E2E: [OK/NO]
- Config Vercel/Env: [OK/NO]
- Documentación Step 6: [OK/NO]
- Listo para desplegar: [SÍ/NO + razón]
```

---

## 2) DESPLIEGUE CONTROLADO (STAGING → PRODUCCIÓN)

### 2.1 Deploy a Staging (o Preview)
1. Ejecuta deploy a entorno de staging/preview en Vercel:
   - vía push a rama staging o
   - `vercel --prod` apuntando a entorno de pruebas (según tu flujo).
2. Verifica que staging apunte a:
   - Supabase de staging o producción “clonada” (según diseño).
3. Espera a que el build termine y registra:
   - URL de staging
   - commit asociado
   - tiempo de despliegue

### 2.2 Smoke Tests en Staging (en caliente)
Ejecuta un smoke test mínimo orientado a negocio: [web:156][web:158][web:154]

- App carga en `/`.
- Login de usuario real de prueba (passenger).
- Vista de Wallet:
  - se ve saldo y botón “Recargar”.
- Solicitud de viaje:
  - formulario se muestra
  - se crea un viaje (si staging lo permite) o se mockea éxito.

Documenta:
```text
SMOKE STAGING
- Carga landing: [OK/FAIL]
- Login pasajero: [OK/FAIL]
- Vista wallet (botón recargar visible): [OK/FAIL]
- Flujo solicitar viaje: [OK/FAIL]
- Observaciones: [...]
```

### 2.3 Promoción a Producción
Si Staging = OK:
1. Autoriza promoción a producción:
   - merge a `main` o
   - promote el mismo build a producción (según tu flujo).
2. Ejecuta deploy a producción en Vercel.
3. Registra:
   - URL de producción
   - commit hash
   - hora exacta de go-live

**Nota**: Documenta también cómo harías un **Instant Rollback** en Vercel si algo sale mal (enlace a tu doc de Step 6 + resumen breve). [web:125][web:151]

---

## 3) MONITOREO POST-LANZAMIENTO (PRIMERAS 24H)

Define un pequeño plan de observabilidad/manual watching:

### 3.1 Logs y Errores
- Vercel:
  - observar errores 5xx y spikes anormales en logs durante primeras horas.
- Supabase Edge Functions:
  - revisar logs de `process-transaction`, `wallet-recharge`, `bancamiga-verify-payment`, `match-driver`. [web:160]
- Anotar cualquier error recurrente (mismo mensaje/código).

### 3.2 Flujos de Dinero (Chequeo Manual)
- Registrar manualmente las **primeras 3 transacciones reales**:
  - ID de usuario
  - referencia Bancamiga (o método pago)
  - monto
  - estado en DB (wallet_transactions/payment_records)
- Confirmar:
  - que saldo se actualiza correctamente
  - que no hay duplicados
  - que logs de Edge Functions no muestran anomalías

### 3.3 Performance Básico
- Revisar:
  - latencia de DB (si tienes métricas)
  - tiempo de respuesta medio de Edge Functions
  - errores de conexión

**Salida**:
```text
POST-LAUNCH (0–24h)
- Errores 5xx App: [bajo/medio/alto] + ejemplos
- Errores Edge Functions: [listado corto]
- Transacciones verificadas: [3/3 OK] o [detalles]
- Performance DB: [normal/degradado]
```

---

## 4) CIERRE DEL PROCESO Y READINESS FINAL

Genera un reporte compacto de lanzamiento:

```text
## REPORTE FINAL DE LANZAMIENTO (Step 7)

### 1. RESUMEN EJECUTIVO
- Resultado: [EXITOSO / EXITOSO CON OBSERVACIONES / REVERTIDO]
- Fecha/hora de go-live:
- Entorno: Vercel + Supabase (producción)
- Comentario breve: [1–3 líneas de contexto]

### 2. ESTADO DEL DEPLOYMENT
- Último commit desplegado: [hash + mensaje]
- URL de producción: [url]
- ¿Se necesitó rollback? [SÍ/NO]
  - Si SÍ: indicar por qué y a qué versión se volvió (Instant Rollback de Vercel, etc.) [vercel](https://vercel.com/docs/instant-rollback)

### 3. READINESS PRODUCTIVA (DECLARACIÓN)
- Tests unitarios: [OK]
- Smoke E2E en prod (mínimos): [OK/NO + por qué]
- Flujos críticos:
  - Auth: [OK/Observaciones]
  - Wallet/Recargas: [OK/Observaciones]
  - Trips/Match-driver: [OK/Observaciones]
- Logs y errores en primeras 24h: [Resumen]

### 4. LISTA DE DECISIONES TÉCNICAS DE ÚLTIMA HORA
- Cambios realizados durante el deploy (hotfixes, ajustes de env vars, toggles).
- Motivo de cada cambio.
- Impacto esperado.
- Si algún cambio debe “formalizarse” luego (PR/documentación).

### 5. RECOMENDACIÓN FINAL
- ¿MI PANA APP 3.0 está declarada OPERATIVA EN PRODUCCIÓN?: [SÍ/NO]
- Riesgo residual: [BAJO/MEDIO/ALTO] (explicar)
- Próximos pasos:
  - estabilización
  - métricas/monitorización
  - roadmap de mejoras post-lanzamiento
```

---

## NOTA FINAL PARA EL MODELO
- Sé extremadamente conservador: si detectas un riesgo crítico (pagos inconsistentes, errores 5xx persistentes, auth roto), **recomienda no marcar como EXITOSO** y sugiere Rolling Back inmediato en Vercel + plan de corrección. [web:125][web:154]
- Prioriza siempre:
  1. Cobros correctos
  2. Seguridad de datos
  3. Disponibilidad básica
  4. Performance
```

Puedes copiar este prompt tal cual en Antigravity con **Claude Sonnet 3.5** (o 4.5 si lo prefieres) para ejecutar el Step 7.