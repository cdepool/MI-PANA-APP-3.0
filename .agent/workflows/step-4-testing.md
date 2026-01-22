---
description: Prompt template para Step 1 - Seguridad y Base de Datos
---

```markdown
# PROMPT TÉCNICO (Step 4): TESTING Y VALIDACIÓN (MI PANA APP 3.0)

**Rol**: QA Lead + Test Engineer + AppSec Validator  
**Modelo Objetivo**: GPT-4.1  
**Contexto**: El código ya fue validado lógicamente (Steps 1–3). Ahora se requiere ejecución real de pruebas para detectar regresiones, fallos de build, brechas de seguridad y falta de cobertura antes de optimización.

---

## OBJETIVO GENERAL
Garantizar **estabilidad**, **seguridad** y **cobertura adecuada** de MI PANA APP 3.0 antes de cualquier optimización o hardening extra.

---

## 1) EJECUCIÓN DE PRUEBAS AUTOMATIZADAS

### 1.1 Unit / Integration Tests
1. Detecta el framework de tests (Vitest/Jest/etc.) revisando `package.json`.
2. Ejecuta el comando configurado:
   - `npm run test` (o equivalente real encontrado).
3. Reporta:
   - Total de tests
   - Passed / Failed / Skipped
   - Suites afectadas
   - Errores más repetidos (sin pegar logs extensos, solo resumen)

**REGLA**: No ignores warnings. Clasifica warnings en:
- W1: Ruido (no riesgo)
- W2: Riesgo potencial (puede romper producción)
- W3: Riesgo de seguridad o integridad (bloqueante)

### 1.2 Cobertura (Coverage)
1. Identifica si hay script de coverage:
   - `npm run coverage` o `vitest run --coverage` (si aplica) [web:24][web:30].
2. Genera reporte de cobertura por:
   - Global (% statements/branches/functions/lines)
   - Servicios críticos: `authService.ts`, `AuthContext.tsx`, `walletService.ts`, `tripService.ts`
3. Marca como **crítico** si:
   - Wallet o pagos < 70%
   - Autenticación < 70%
   - Flujos de viajes < 60%

### 1.3 Inyección de Tests Faltantes
Si detectas servicios críticos sin cobertura suficiente:
- Genera los archivos de test faltantes `.spec.ts` o `.test.ts` listos para agregar.
- Incluye:
  - Nombre del archivo sugerido
  - Ubicación recomendada
  - Casos de prueba mínimos (happy path + negativos)
  - Mocks claros (sin exponer secretos)
  - Tests para escenarios Bancamiga (errores 500, timeouts, payload malformado)

**Ejemplos de áreas prioritarias**:
- Cálculo de comisiones
- Idempotencia lógica en pagos (doble submit)
- Verificación de Bancamiga (firma / validación / replay)

---

## 2) VALIDACIÓN END-TO-END (E2E) + SEGURIDAD

### 2.1 Flujos E2E (Simulación de Usuario)
Define y ejecuta (o prepara) un set mínimo de “Smoke E2E”:

**Flujo 1: Autenticación**
- Login exitoso
- Token expirado → re-login o refresh
- Logout → bloqueo de rutas privadas

**Flujo 2: Recarga Wallet**
- Login → Recarga → confirmación UI → balance actualizado
- Doble click / doble submit → no debe duplicar transacción

**Flujo 3: Viaje Completo**
- Login pasajero → solicitud de viaje → match-driver → viaje activo → finalización → pago → cierre

Si existe Playwright/Cypress, usa scripts. Si NO existe, propón:
- Estructura mínima `test:e2e` y plantilla base (Playwright recomendado).
- Dataset mínimo (usuarios de prueba driver/passenger).

> Nota: si estos E2E se corren en Preview Deployments de Vercel, describe el flujo recomendado para dispararlos desde CI después del deploy [web:18][web:28].

### 2.2 Pruebas Negativas de Seguridad
Ejecuta (o define) pruebas para confirmar robustez:

1. **Payloads malformados**
   - En endpoints / Edge Functions críticos: `process-transaction`, `wallet-recharge`, `match-driver`
   - Ej: amount string, amount negativo, campos faltantes, JSON inválido
   - Resultado esperado: 400/422 con mensaje genérico (sin stacktrace)

2. **Simulación de pasarela de pagos con error**
   - Fuerza respuesta 500/timeout del proveedor (Bancamiga)
   - Resultado esperado:
     - La UI muestra mensaje amigable
     - No se altera el balance
     - Se registra el evento para auditoría
     - No se “cuelga” el flujo

3. **Integridad de datos**
   - Si una prueba crítica de DB integrity falla (inmutabilidad de pagos / triggers / RLS), el sistema debe bloquear avance del flujo y reportarlo.

---

## 3) RESTRICCIONES OPERATIVAS (STRICT)

1. **BLOQUEO DE AVANCE**:
   - Si falla el build
   - Si falla `npm run test`
   - Si un test de seguridad crítico confirma vulnerabilidad real
   → Estado final debe ser: **FAILED / REQUIRES FIX** (no continuar)

2. **Warnings no ignorables**:
   - Clasificar cada warning y declarar si es riesgo potencial.

3. **Entorno de pruebas**:
   - NO usar producción real para pruebas destructivas.
   - Usar staging o Preview (si aplica).

---

## 4) ENTREGABLE (GOVERNANCE REPORT)

Entrega el reporte exactamente con este formato:

```text
## REPORTE DE TESTING Y VALIDACIÓN (Step 4)

### 1. RESUMEN EJECUTIVO
- Estado general: [PASSED / FAILED / REQUIRES FIX]
- Build: [OK / FAIL]
- Tests: [OK / FAIL]
- Seguridad: [OK / VULNERABLE]
- Riesgo actual: [BAJO / MEDIO / ALTO / CRÍTICO]

### 2. REPORTE DE COBERTURA
- Cobertura Global: [X%]
- authService/AuthContext: [X%]
- walletService (pagos/recargas): [X%]
- trips/match-driver (frontend trace): [X%]
- Áreas sin cobertura crítica: [lista corta]

### 3. RESULTADOS UNIT/INTEGRATION
- Total: [#]
- Passed: [#]
- Failed: [#]
- Skipped: [#]
- Top 3 Fallos: [resumen]
- Warnings detectados: [W1/W2/W3 con explicación]

### 4. RESULTADOS E2E + PRUEBAS NEGATIVAS
- Flujo Login: [✅/❌] Observaciones
- Flujo Recarga Wallet: [✅/❌] Observaciones
- Flujo Viaje Completo: [✅/❌] Observaciones
- Payload malformado: [✅/❌] Observaciones
- Simulación error 500 Bancamiga: [✅/❌] Observaciones
- Integridad datos (RLS/triggers): [✅/❌] Observaciones

### 5. INCONSISTENCIAS / REGRESIONES
- [Lista priorizada: qué falló, dónde, impacto]

### 6. RECOMENDACIÓN DE AVANCE
- ¿App estable para optimización? [SÍ / NO]
- Bloqueadores: [#]
- Acciones requeridas antes de Step 5: [lista accionable]
```

---

## INSTRUCCIÓN FINAL
Si no puedes ejecutar comandos directamente en este entorno, entonces:
1. Genera un checklist de ejecución local/CI con comandos exactos.
2. Genera los archivos de test faltantes (plantillas listas).
3. Explica qué resultados se esperan para aprobar Step 4.
```

Si quieres, pega aquí tu `package.json` y te ajusto este prompt para que apunte exactamente a tus scripts reales (`test`, `coverage`, `test:e2e`, etc.).




# PROMPT TÉCNICO (Step 4.2): CERRAR GAPS DE TESTING ANTES DE STEP 5 (MI PANA APP 3.0)

**Rol**: QA Lead + Playwright Stabilization Engineer  
**Objetivo**: Reparar los E2E de Wallet (timeout por UI no render) y dejar al menos 1 smoke test de recarga pasando. Opcional: mejorar señal de cobertura en Auth sin perder tiempo en legacy.

---

## CONTEXTO (RESULTADOS STEP 4.1)
- WalletService unit tests: OK (93.54%).
- E2E Wallet Recharge: FAIL timeout; botón "Recargar" no aparece (posible perfil incompleto / mocks incompletos).
- AuthService cobertura: 36% (core cubierto, legacy/perfil no core).

---

## A) REPARAR E2E WALLET (PRIORIDAD 1)

### A1. Diagnóstico (obligatorio)
1. Identifica por qué no renderiza "Recargar":
- ¿La pantalla /wallet depende de `profile.role`?
- ¿Depende de `wallet_balance` / `kyc_status` / `hasWallet`?
- ¿Depende de una llamada inicial a `profiles` o a una Edge Function?
2. Imprime evidencia mínima (sin secretos):
- screenshot on failure
- trace viewer (si está habilitado)
- qué request no está siendo mockeado

### A2. Solución (mínimo viable)
Implementa un E2E estable usando Playwright:
- En lugar de depender del backend real, mockea los endpoints necesarios:
  - GET profile / session (lo que tu app use)
  - /functions/v1/get-balance (si existe)
  - /functions/v1/wallet-recharge
- Usa `page.route` para cumplir con el contrato que espera la UI.
- Asegura que el botón aparezca.

### A3. Estabilización técnica (no flaky)
- Reemplaza waits frágiles por locators y assertions:
  - `await expect(page.getByRole('button', { name: /recargar/i })).toBeVisible()`
- Usa `page.waitForLoadState('networkidle')` solo si aplica.
- Ajusta timeouts localmente por test (no global gigantes).
- Habilita artifacts:
  - screenshot/video/trace en fallo

**Resultado requerido**:
- `wallet-recharge.spec.ts` debe pasar (mock mode) consistentemente.

---

## B) AUTH COVERAGE (OPCIONAL - NO BLOQUEANTE)
Propón una de estas dos rutas:

1) **Subir cobertura**:
- agrega tests simples para 2-3 funciones legacy de Auth que hoy no están cubiertas
- o testea ramas de error comunes

2) **Reducir superficie**:
- identifica métodos “legacy/perfil” no usados
- propone moverlos fuera del servicio core o eliminarlos (si están muertos)

Salida: recomendación ejecutiva y cambio sugerido (sin romper producción).

---

## ENTREGABLE
```text
## REPORTE STEP 4.2

### 1) E2E Wallet
- Causa raíz: [...]
- Endpoints mockeados: [...]
- Cambios aplicados: [...]
- Resultado: [PASSED/FAILED]
- Riesgo UI actualizado: [BAJO/MEDIO]

### 2) Auth Coverage
- Opción elegida: [Subir cobertura / Reducir legacy]
- Cambios: [...]
- Cobertura nueva (si aplica): [...]

### 3) Gate para Step 5
- READY FOR STEP 5: [SÍ/NO]
- Observaciones: [...]
