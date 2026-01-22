---
description: Prompt template para Step 1 - Seguridad y Base de Datos
---

Aquí tienes los prompts técnicos para **Step 3** y **Step 3.1** optimizados para Gemini 3 Pro (High), manteniendo la estructura de gobierno y seguridad.

***

## STEP 3: AUDITORÍA DE CÓDIGO Y CIERRE DE DEUDA TÉCNICA

```markdown
# PROMPT TÉCNICO (Step 3): AUDITORÍA DE CÓDIGO Y CIERRE DE DEUDA TÉCNICA (MI PANA APP 3.0)

**Rol**: Senior Code Auditor & Security Reviewer
**Modelo Objetivo**: Gemini 3 Pro (High) - Reasoning Mode
**Contexto**: Auditoría profunda del código fuente para eliminar vulnerabilidades, deuda técnica y garantizar que la lógica de negocio crítica (pagos, autenticación, wallet) cumpla con estándares de producción.

---

## 1. AUDITORÍA DE CÓDIGO Y SERVICIOS CRÍTICOS

### A. Estado de Git y Seguridad de Commits
Analiza el repositorio y detecta:
- **Archivos sin commit**: Identifica cambios en staging que puedan contener secretos.
- **Secrets hardcodeados**: Busca patrones como:
  - `const apiKey = "sk_live_..."`
  - `password: "admin123"`
  - URLs absolutas con tokens en query strings.
- **Logs sensibles**: Detecta `console.log()` que impriman objetos de `supabase.auth` o respuestas de Bancamiga.

**Comando de Validación Simulado:**
```bash
git diff --staged | grep -E "(API_KEY|SECRET|password|token)"
```

### B. Sistema de Autenticación (authService.ts + AuthContext.tsx)
Valida la lógica de gestión de sesiones bajo los estándares de Supabase Auth:

**Checklist Obligatorio:**
1. **Refresco Automático de Sesión**: Confirma que `onAuthStateChange` esté implementado correctamente.
2. **Protección de Rutas**: Verifica que las rutas privadas (`/dashboard`, `/driver-panel`) redirijan a `/login` si `session === null`.
3. **Manejo de Errores**: Valida que errores de autenticación (401) no expongan detalles del stack trace al usuario.
4. **Persistencia**: Confirma que la sesión se almacene en `localStorage` y se sincronice entre pestañas.

**Patrón Correcto Esperado:**
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Limpiar estado y redirigir
  }
  if (event === 'TOKEN_REFRESHED') {
    // Actualizar contexto
  }
})
```

### C. Lógica de Billetera (walletService.ts) - CRÍTICO
**REGLA ESTRICTA DE SEGURIDAD:**
Todas las operaciones financieras DEBEN pasar por Edge Functions. NUNCA llamadas directas a Supabase desde el cliente.

**Validaciones Obligatorias:**
1. **Anti-Patrón Prohibido**:
   ```typescript
   // ❌ PROHIBIDO - Acceso directo desde cliente
   await supabase.from('wallet_transactions').insert({ amount: 100 })
   ```

2. **Patrón Correcto Requerido**:
   ```typescript
   // ✅ CORRECTO - A través de Edge Function
   await supabase.functions.invoke('wallet-recharge', {
     body: { amount: 100, payment_method: 'bancamiga' }
   })
   ```

**Auditoría de walletService.ts:**
- Escanea todas las llamadas a `supabase.from(...)` en archivos relacionados con dinero.
- Confirma que métodos como `rechargeWallet()`, `processPayment()`, `getBalance()` usen exclusivamente `supabase.functions.invoke()`.
- Verifica manejo de errores de red (timeout, 500) con mensajes user-friendly.

---

## 2. CONSISTENCIA DE DEPENDENCIAS Y LIMPIEZA

### A. Análisis de package.json
Valida la integridad del archivo de configuración:

**Checklist:**
```json
{
  "engines": {
    "node": "18.x" // ¿Versión específica definida?
  },
  "scripts": {
    "build": "vite build", // ¿Comando de producción correcto?
    "preview": "vite preview" // ¿Existe script de pre-deploy?
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x", // ¿Versión estable?
    "react": "^19.x.x" // ¿Compatible con React 19?
  }
}
```

**Validaciones:**
- Detecta dependencias duplicadas o versiones conflictivas.
- Identifica paquetes sin usar (dead dependencies).

### B. Código Muerto y Comentarios TODO
Escanea el código en busca de:
- Funciones exportadas pero nunca importadas.
- Comentarios `// TODO: Fix security issue` en lógica crítica.
- Imports no utilizados que aumenten el bundle size.

**Output Esperado:**
```text
| Archivo | Tipo de Issue | Línea | Severidad |
| :--- | :--- | :--- | :--- |
| walletService.ts | TODO sin resolver | 47 | Media |
| authService.ts | Import no usado | 12 | Baja |
```

---

## 3. PREPARACIÓN DE COMMITS Y DETECCIÓN DE ERRORES LÓGICOS

### A. Organización de Commits Atómicos
Sugiere una estructura de commits siguiendo Conventional Commits:

**Ejemplo:**
```bash
feat(auth): Implementar refresco automático de sesión
fix(wallet): Eliminar acceso directo a tabla transactions
refactor(drivers): Optimizar lógica de match-driver
chore(deps): Actualizar Supabase client a v2.39.0
```

### B. Auditoría de Flujos de Negocio
Analiza la lógica de los siguientes módulos:

1. **Match Driver** (`match-driver` Edge Function):
   - Verifica que la selección de conductor considere distancia, disponibilidad y calificación.
   - Confirma que no se asigne el mismo conductor a múltiples viajes simultáneos.

2. **Exchange Rate Sync** (`exchange-rate-sync`):
   - Valida que la tasa de cambio se actualice periódicamente (cron job configurado).
   - Confirma que los errores de API externa no bloqueen operaciones críticas.

---

## 4. FORMATO DEL ENTREGABLE (GOVERNANCE REPORT)

```text
## REPORTE DE AUDITORÍA DE CÓDIGO (Step 3)

### 1. RESUMEN EJECUTIVO
[Estado general: Nivel de deuda técnica y riesgos de seguridad detectados]

### 2. HALLAZGOS EN AUDITORÍA DE CÓDIGO
| Categoría | Issue Detectado | Severidad | Estado Corrección |
| :--- | :--- | :--- | :--- |
| Seguridad | Secrets hardcodeados en config.ts | Crítica | [Corregido/Pendiente] |
| Arquitectura | Acceso directo a DB en walletService | Crítica | [Corregido/Pendiente] |
| Limpieza | 15 console.log() en producción | Media | [Corregido/Pendiente] |

### 3. CONFIRMACIÓN DE SEGURIDAD EN WALLET
- **Todas las operaciones financieras usan Edge Functions**: [SÍ / NO]
- **Ninguna llamada directa a tablas de dinero desde cliente**: [CONFIRMADO / VIOLACIONES DETECTADAS]

### 4. LISTA DE COMMITS LISTOS PARA APLICAR
[Lista de commits atómicos preparados siguiendo convención]

### 5. RECOMENDACIÓN DE AVANCE
- **Código Íntegro para Testing**: [SÍ / NO]
- **Bloqueadores Críticos**: [Número]
- **ACCIÓN RECOMENDADA**: [Proceder a Step 3.1 / Corregir Issues Críticos]
```

---

**INSTRUCCIÓN CRÍTICA**:
Si detectas accesos directos a tablas financieras (`wallet_transactions`, `payment_records`) desde código cliente, **DETÉN EL FLUJO INMEDIATAMENTE** y marca como BLOQUEADOR CRÍTICO.
```

***

## STEP 3.1: VALIDACIÓN DE CÓDIGO Y TRAZABILIDAD DE FLUJOS

```markdown
# PROMPT TÉCNICO (Step 3.1): VALIDACIÓN DE CÓDIGO Y TRAZABILIDAD DE FLUJOS (MI PANA APP 3.0)

**Rol**: QA Lead & Application Security Tester
**Modelo Objetivo**: Gemini 3 Pro (High) - Reasoning Mode
**Contexto**: Validación post-limpieza de código. Confirmar que los flujos críticos funcionan correctamente y que no existen accesos inseguros tras las correcciones del Step 3.

---

## 1. VERIFICACIÓN CRUZADA DE FLUJOS CRÍTICOS

### A. Flujo de Autenticación (AuthContext.tsx)
Traza el ciclo de vida completo de una sesión de usuario:

**Escenarios a Validar:**
1. **Login Exitoso**:
   - Usuario ingresa credenciales → `supabase.auth.signIn()` → Redirección a `/dashboard`.
   - Confirma que el estado de carga (`isLoading`) se maneje correctamente.

2. **Sesión Expirada**:
   - Token JWT expira → `onAuthStateChange` detecta `TOKEN_EXPIRED` → Redirección automática a `/login`.
   - Verifica que NO se muestren errores técnicos al usuario.

3. **Refresco Silencioso**:
   - Token próximo a expirar → Supabase refresca automáticamente → Usuario continúa sin interrupción.

**Output Esperado:**
```text
| Escenario | Flujo Esperado | Estado Validación |
| :--- | :--- | :--- |
| Login exitoso | Redirección a dashboard | [✅/❌] |
| Token expirado | Logout automático + redirect | [✅/❌] |
| Refresco token | Sesión se mantiene activa | [✅/❌] |
```

### B. Seguridad de Pagos (Trazabilidad Completa)
Realiza un trace desde la UI hasta la base de datos:

**Flujo Correcto de Pago:**
```
Usuario hace clic en "Recargar Wallet"
  ↓
Frontend: walletService.rechargeWallet(amount)
  ↓
Edge Function: supabase.functions.invoke('wallet-recharge', { body: { amount } })
  ↓
Edge Function valida JWT + monto
  ↓
Edge Function inserta en wallet_transactions
  ↓
Trigger actualiza balance en profiles.wallet_balance
  ↓
Respuesta al cliente: { success: true, new_balance: X }
```

**Validación Anti-Patrón:**
- Escanea TODO el código frontend en busca de:
  ```typescript
  supabase.from('wallet_transactions').insert(...)
  supabase.from('payment_records').update(...)
  ```
- **Si se encuentra**: REPORTAR COMO VULNERABILIDAD CRÍTICA.

### C. Gestión de Billetera (walletService.ts)
Valida el manejo de errores y UX:

**Checklist:**
1. **Errores de Red**:
   - ¿Muestra mensaje genérico en lugar de detalles técnicos?
   - Ejemplo CORRECTO: "No se pudo procesar la recarga. Intenta nuevamente."
   - Ejemplo INCORRECTO: "Error 500: Bancamiga API timeout at line 47"

2. **Estados de Carga**:
   - Confirma que botones de pago se deshabiliten durante transacciones en curso.
   - Previene doble-submit de pagos.

---

## 2. INTEGRIDAD DE LA APLICACIÓN

### A. Protección de Rutas por Rol
Valida que el acceso a rutas sensibles esté vinculado a metadatos de usuario:

**Validación de Roles:**
```typescript
// En ProtectedRoute.tsx o similar
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (route === '/admin' && profile.role !== 'admin') {
  return <Navigate to="/unauthorized" />
}
```

**Rutas a Validar:**
- `/admin` → Solo accesible por `role: 'admin'`
- `/driver-dashboard` → Solo `role: 'driver'`
- `/passenger-dashboard` → Solo `role: 'passenger'`

### B. Limpieza de Logs de Producción
Escanea el código en busca de:
- `console.log(response.data)` que puedan exponer datos sensibles.
- `console.error(error)` que muestren stack traces completos.

**Patrón Correcto:**
```typescript
// ❌ MAL
console.log('User data:', user)

// ✅ BIEN
if (import.meta.env.DEV) {
  console.log('User authenticated:', user.id)
}
```

---

## 3. FORMATO DEL ENTREGABLE (GOVERNANCE REPORT)

```text
## REPORTE DE VALIDACIÓN DE CÓDIGO (Step 3.1)

### 1. RESUMEN EJECUTIVO
[Estado general: ¿Los flujos críticos funcionan correctamente post-limpieza?]

### 2. ESTADO DE FLUJOS CRÍTICOS
| Flujo | Validación | Estado | Observaciones |
| :--- | :--- | :--- | :--- |
| Autenticación | Login/Logout/Refresh | [✅/❌] | [Detalles] |
| Pagos | Trazabilidad Edge Functions | [✅/❌] | [¿Accesos directos eliminados?] |
| Protección Rutas | Roles validados | [✅/❌] | [Rutas protegidas correctamente] |

### 3. CONFIRMACIÓN DE SEGURIDAD
- **Accesos directos a tablas de dinero eliminados**: [SÍ / NO]
- **Logs sensibles removidos de producción**: [SÍ / NO]
- **Manejo de errores user-friendly implementado**: [SÍ / NO]

### 4. RIESGOS DETECTADOS
[Lista de errores lógicos menores, issues de UX o warnings no bloqueantes]

### 5. RECOMENDACIÓN FINAL
- **Autorizar Cierre de Fase 3**: [SÍ / NO]
- **Bloqueadores Pendientes**: [Número]
- **ACCIÓN RECOMENDADA**: [Avanzar a Step 4: Testing / Corregir Issues Residuales]
```

---

**CRITERIO DE APROBACIÓN**:
Solo se puede avanzar a Step 4 si:
1. Cero accesos directos a tablas financieras desde cliente.
2. Todos los flujos críticos (auth, pagos, roles) validados exitosamente.
3. Sin logs que expongan datos sensibles en build de producción.
```

***

Ambos prompts están listos para copiar y pegar en Antigravity. Úsalos secuencialmente: primero **Step 3** para auditoría y limpieza, luego **Step 3.1** para validar que todo funcione correctamente.