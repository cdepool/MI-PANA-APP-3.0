---
description: Prompt template para Step 1 - Seguridad y Base de Datos
---

# PROMPT TÉCNICO FASE 1: AUDITORÍA DE SEGURIDAD Y BASE DE DATOS (MI PANA APP 3.0)

**Rol**: Arquitecto de Seguridad Backend (Especialista en Supabase, PostgreSQL, Deno)
**Modelo Objetivo**: Claude 3.5 Sonnet
**Contexto**: Auditoría crítica de infraestructura para plataforma de movilidad y pagos en Venezuela.

---

## 1. INSTRUCCIONES DE ANÁLISIS (NO EJECUTAR CAMBIOS AÚN)

Realiza una auditoría técnica profunda de los siguientes componentes antes de cualquier modificación:

### A. Seguridad SQL y RLS (Row Level Security)
Analiza el archivo `supabase_hardening_v1.sql` y el esquema actual para las tablas: `profiles`, `trips`, `recharge_requests`.
- **Verificación**: Confirma que RLS esté habilitado y activo.
- **Políticas**: Identifica reglas permisivas (ej: `true`, falta de `auth.uid()`).
- **Aislamiento**: Valida que conductores y pasajeros solo accedan a su propia data.
- **Riesgo**: Detecta vulnerabilidades en `INSERT`/`UPDATE` sin cláusulas `WITH CHECK`.

### B. Integridad de Datos (Financiera)
Valida la inmutabilidad de registros críticos en: `payment_transactions`, `wallet_balances`, `trip_history`.
- **Triggers**: Busca triggers de protección `BEFORE UPDATE/DELETE` en tablas financieras.
- **Inmutabilidad**: Garantiza que montos y estados de pago no sean editables post-creación.
- **Relaciones**: Verifica integridad referencial (Foreign Keys) entre `wallets`, `trips` y `users`.

### C. Auditoría de Edge Functions
Revisa línea por línea la lógica de seguridad en:
1. `process-transaction` (Crítico: Pagos)
2. `wallet-recharge` (Crítico: Balance)
3. `bancamiga-verify-payment` (Integración Bancaria)
4. `match-driver` (Lógica de Negocio)
5. `exchange-rate-sync` (Datos Externos)

**Para cada función valida:**
- Sanitización de inputs y prevención de inyección SQL.
- Verificación estricta de JWT y coincidencia de `auth.uid()`.
- Manejo de secretos (API Keys Bancamiga) mediante variables de entorno, NUNCA en código.
- Idempotencia en transacciones financieras.

---

## 2. VERIFICACIÓN DE INFRAESTRUCTURA

- **Migraciones**: Lista las pendientes y detecta conflictos potenciales.
- **Índices**: Confirma existencia de índices en claves foráneas para evitar problemas de rendimiento.
- **Constraints**: Valida restricciones lógicas (ej: `balance >= 0`).

---

## 3. RESTRICCIONES OPERATIVAS (STRICT MODE)

1. **PROHIBIDO** aplicar migraciones o RLS sin advertencia explícita de impacto en usuarios activos.
2. **PROHIBIDO** modificar lógica de pagos sin validar firmas de webhooks (Bancamiga).
3. **REPORTE INMEDIATO** si detectas:
   - Inyección SQL potencial.
   - Acceso cross-user en RLS.
   - Exposición de credenciales bancarias.

---

## 4. FORMATO DEL ENTREGABLE (OUTPUT)

Genera un reporte técnico estructurado bajo el siguiente formato de gobierno:

```text
## 1. RESUMEN EJECUTIVO
[Estado general de seguridad y nivel de riesgo actual]

## 2. ANÁLISIS DE IMPACTO DE SEGURIDAD (RLS & SQL)
[Tabla: Tabla Afectada | Vulnerabilidad | Severidad | Recomendación]

## 3. AUDITORÍA DE EDGE FUNCTIONS
[Lista: Función | Fallos de Seguridad | Riesgo Financiero | Estado Validación]

## 4. INTEGRIDAD DE DATOS
[Hallazgos sobre triggers, inmutabilidad y consistencia]

## 5. LISTA DE MIGRACIONES A APLICAR
[Nombre Migración | Propósito | ¿Requiere Downtime?]

## ESTADO FINAL
Total Críticos: [X]
Total Altos: [X]
ESTADO: ESPERANDO APROBACIÓN PARA EJECUCIÓN


# PROMPT TÉCNICO (Step 1.1): VALIDACIÓN DE SEGURIDAD FASE 1 (MI PANA APP 3.0)

**Rol**: QA Security Engineer & Supabase Specialist
**Modelo Objetivo**: Gemini 3 Pro (High) - Reasoning Mode
**Contexto**: Fase de validación post-auditoría. El objetivo es confirmar "matemáticamente" que las reglas de seguridad (RLS) y la lógica de negocio son impenetrables antes de pasar a configuración de entorno.

---

## 1. INSTRUCCIONES DE EJECUCIÓN (PENETRATION TESTING)

Tu tarea es diseñar y simular la ejecución de una batería de pruebas de seguridad ("Smoke Tests") sobre la infraestructura actual. Genera el código de validación necesario (SQL o TypeScript) y predice los resultados basándote en el análisis estático del código.

### A. Pruebas de Acceso y RLS (Row Level Security)
Analiza y genera scripts de prueba para los siguientes vectores de ataque:
1.  **Acceso Anónimo (Anonymous Access)**:
    *   Intenta `SELECT * FROM profiles` y `INSERT INTO recharge_requests` sin header de autorización.
    *   *Resultado Esperado*: Rechazo total (401/403 o retorno vacío).
2.  **Aislamiento de Usuarios (Tenant Isolation)**:
    *   Simula un User A (`auth.uid() = 'uuid-a'`) intentando leer `trips` donde `passenger_id = 'uuid-b'`.
    *   *Resultado Esperado*: Retorno de 0 filas (RLS activo).
3.  **Inmutabilidad Financiera**:
    *   Genera una query que intente `UPDATE payment_transactions SET amount = 0` sobre un registro existente.
    *   *Resultado Esperado*: Error disparado por Trigger de base de datos o política RLS `check`.

### B. Verificación de Lógica de Transacciones (Edge Functions)
Evalúa la robustez del archivo `validation_queries.sql` y las Edge Functions asociadas:
1.  **Bypass de Autenticación**:
    *   Analiza qué sucede si se invoca `process-transaction` sin un JWT válido.
    *   Confirma que la función aborta *antes* de tocar la base de datos.
2.  **Auditoría de Triggers**:
    *   Verifica si los intentos de modificación en tablas sensibles (`wallet_balances`) dejan rastro en logs o tablas de auditoría.

---

## 2. FORMATO DEL REPORTE DE RESULTADOS

Genera un informe técnico simulando la ejecución de estas pruebas. Sé binario en tus conclusiones (PASA / FALLA).

```text
## REPORTE DE VALIDACIÓN DE SEGURIDAD (Step 1.1)

### 1. RESULTADO DE PRUEBAS NEGATIVAS (PEN TESTING)
| Prueba | Vector | Resultado Simulado | Estado |
| :--- | :--- | :--- | :--- |
| Acceso Anónimo | Lectura en 'profiles' | [Bloqueado/Permitido] | [✅/❌] |
| Integridad RLS | User A lee datos de User B | [0 filas retornadas/Datos expuestos] | [✅/❌] |
| Inmutabilidad | Edición de pago histórico | [Error SQL Trigger/Update exitoso] | [✅/❌] |

### 2. ESTADO DE INTEGRIDAD DEL SISTEMA
- **Flujos Críticos**: [Confirmar si conductores/pasajeros pueden operar legítimamente sin bloqueos falsos positivos]
- **Edge Functions**: [Evaluación de resistencia ante invocaciones maliciosas]

### 3. RIESGOS RESIDUALES
[Lista aquí cualquier borde (edge case) que no esté cubierto por las reglas actuales. Ej: ¿Qué pasa si Bancamiga responde con timeout?]

### 4. CONCLUSIÓN Y RECOMENDACIÓN
- ESTADO ACTUAL: [SEGURO / VULNERABLE]
- ACCIÓN RECOMENDADA: [Autorizar paso a Fase 2 / Bloquear y Corregir]


NOTA PARA EL MODELO:
Si no puedes ejecutar los comandos en tiempo real contra la base de datos, GENERA LOS SCRIPTS SQL/CURL exactos que yo (Carlos) debo correr en la terminal de Supabase para verificar esto manualmente, y proporciona el resultado lógico esperado basado en tu lectura del código supabase_hardening_v1.sql.


