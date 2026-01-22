---
description: Prompt template para Step 1 - Seguridad y Base de Datos
---

```markdown
# PROMPT TÉCNICO (Step 6): DOCUMENTACIÓN Y RUNBOOKS (MI PANA APP 3.0)

**Rol**: Technical Writer + SRE/DevOps + Support Enablement Lead  
**Modelo Objetivo**: GPT-4.1  
**Objetivo**: Generar la base de conocimientos técnica y operativa para que el equipo pueda operar MI PANA APP 3.0 sin depender de la IA, con guías claras de instalación, operación, incidentes, y rollback.

---

## CONTEXTO Y ALCANCE
Esta documentación cubre MI PANA APP 3.0 con:
- Frontend: Vite (SPA/PWA)
- Backend: Supabase (DB + Auth + RLS) + Edge Functions (procesos críticos)
- Hosting: Vercel

**Regla**: No incluir secretos reales. Usar `.env.example` y placeholders.

---

## 1) ACTUALIZACIÓN TÉCNICA (README.md)

### 1.1 README: Instalación y ejecución local
Actualizar/crear un README.md principal con:

**Secciones obligatorias**
1. **Descripción del proyecto** (1 párrafo)
2. **Requisitos**
   - Node.js (versión requerida)
   - npm/pnpm
   - Supabase CLI (si aplica)
3. **Instalación**
   - `npm install`
4. **Variables de entorno**
   - Explicar diferencias:
     - Variables públicas `VITE_*` (cliente)
     - Variables privadas (solo servidor/CI)
   - Incluir tabla con:
     - Nombre
     - Propósito
     - Dónde se configura (Local/Vercel/Supabase)
     - Ejemplo (placeholder)
5. **Comandos**
   - `npm run dev`
   - `npm run build`
   - `npm run test`
   - `npm run test:coverage` (si existe)
   - `npx playwright test` (si existe)
6. **Deploy**
   - Cómo se despliega en Vercel (preview/prod)
   - Checklist pre-deploy (build + tests + smoke e2e)
7. **Estructura del repositorio** (breve)
8. **Políticas de seguridad**
   - “Dinero siempre por Edge Functions”
   - “Nunca exponer service_role_key”

### 1.2 Arquitectura (explicación breve y clara)
Documenta el flujo de datos:
- UI (Vite) → Supabase Auth (sesión)
- UI → Edge Functions (pagos, recargas, match driver, tasas)
- Edge Functions → DB (transacciones, wallet, trips)
- DB → UI (lecturas protegidas por RLS)

Incluye un diagrama simple en texto:

```text
[Vite UI] -> [Supabase Auth] -> session/jwt
[Vite UI] -> [Edge Functions] -> (validación JWT + lógica negocio)
[Edge Functions] -> [Postgres/Supabase DB] -> (RLS + triggers)
```

---

## 2) RUNBOOKS OPERATIVOS (GUÍAS DE ACCIÓN)

Crear carpeta `docs/runbooks/` con estos documentos Markdown:

### 2.1 Protocolo de Incidencias: Bancamiga (pagos)
Archivo: `docs/runbooks/incidente-pagos-bancamiga.md`

**Debe incluir**
- Señales de fallo:
  - verificación falla
  - timeouts
  - errores 500
  - discrepancia entre “pagado” vs “registrado”
- “Primeros 5 minutos”:
  - confirmar incidente
  - alcance (cuántos usuarios / cuánto dinero)
  - check status de Vercel + Supabase + Bancamiga
  - revisar últimas deploys
- Checklist de diagnóstico:
  - Edge Function `bancamiga-verify-payment`
  - logs relevantes (sin exponer secretos)
  - reintentos/idempotencia
- Acciones de mitigación:
  - pausar recargas (feature flag si existe)
  - activar modo “pendiente de verificación”
  - reconciliación manual
- Comunicación interna (soporte/operaciones)
- Cierre de incidente:
  - verificación post-fix
  - retro (root cause + acciones preventivas)

(Usa un formato tipo “runbook de incident management”) [web:130][web:133]

### 2.2 Gestión de Usuarios (Soporte)
Archivo: `docs/runbooks/soporte-gestion-usuarios.md`

**Incluye**
- Cómo verificar estado de cuenta
- Cómo revisar rol (admin/driver/passenger)
- Protocolo para desbloquear perfil (si aplica)
- Qué hacer si un usuario reporta:
  - “no puedo iniciar sesión”
  - “no me aparece wallet”
  - “mi recarga no se reflejó”
- Qué datos pedir al usuario:
  - email/teléfono
  - referencia de pago
  - hora aproximada
- Qué datos NO pedir:
  - claves
  - tokens
  - información sensible

### 2.3 Actualización de Tasa de Cambio (manual)
Archivo: `docs/runbooks/tasa-cambio-manual.md`

**Incluye**
- Síntomas de fallo del sync:
  - tasa no actualiza
  - errores en `exchange-rate-sync`
- Procedimiento manual:
  - cómo ejecutar la Edge Function manualmente (si se puede)
  - o cómo actualizar tabla de tasa con un comando seguro (si existe procedimiento)
- Validación:
  - comprobar que nuevas recargas/cálculos usan la nueva tasa
- Plan de regreso a modo automático

---

## 3) PLAN DE CONTINGENCIA Y ROLLBACK

Crear carpeta `docs/rollback/` con:

### 3.1 Manual de Emergencia (Rollback Vercel)
Archivo: `docs/rollback/vercel-rollback.md`

**Debe incluir**
- Cuándo hacer rollback (criterios SEV1/SEV2)
- Rollback desde Dashboard (Instant Rollback) [web:125]
- Rollback desde CLI:
  - `vercel rollback [deployment-id-or-url]` [web:124]
- Consideraciones importantes:
  - env vars pueden “volver” al estado del build anterior
  - configuración puede quedar stale
  - cron jobs pueden revertirse [web:125]

### 3.2 Rollback Supabase (DB + Migraciones)
Archivo: `docs/rollback/supabase-rollback.md`

**Regla realista**:
- En Supabase normalmente NO existe “db rollback” automático en prod; se revierte creando una **nueva migración** que deshace los cambios (down migration manual). [web:135][web:138]

Incluye:
- Cómo identificar última migración aplicada
- Cómo escribir migración de reversión (ejemplos)
- Cómo validar en staging antes de aplicar a prod
- Checklist de “DB safety”:
  - backups/restore point
  - locks/impacto
  - verificación de RLS y triggers post-reversión

### 3.3 Troubleshooting Top 5
Archivo: `docs/troubleshooting/top-5-issues.md`

Lista los 5 errores más comunes detectados en las fases previas y su solución probada (ejemplos típicos):
1. E2E timeout por sesión no hidratada / token inválido
2. Variables VITE apuntando a dev en prod
3. Edge Function falla por missing env vars
4. RLS bloquea flujo legítimo (política demasiado estricta)
5. Wallet UI crashea por null wallet (null-safety)

Para cada uno:
- Síntoma
- Causa raíz
- Fix
- Cómo verificar que quedó bien
- Cómo prevenir recurrencia

---

## 4) ENTREGABLE DE FASE (REPORTE DE GOBIERNO)

Genera un reporte final (Markdown) con el formato:

```text
## REPORTE DE DOCUMENTACIÓN (Step 6)

### 1. RESUMEN EJECUTIVO
[Qué se documentó y por qué. Riesgos mitigados.]

### 2. LISTA DE DOCUMENTOS GENERADOS / ACTUALIZADOS
- README.md (actualizado)
- docs/runbooks/incidente-pagos-bancamiga.md (nuevo)
- docs/runbooks/soporte-gestion-usuarios.md (nuevo)
- docs/runbooks/tasa-cambio-manual.md (nuevo)
- docs/rollback/vercel-rollback.md (nuevo)
- docs/rollback/supabase-rollback.md (nuevo)
- docs/troubleshooting/top-5-issues.md (nuevo)

### 3. RESUMEN DEL PLAN DE ROLLBACK
- Vercel: pasos exactos + criterios de uso
- Supabase: estrategia por “migración de reversión” + validación en staging [vercel](https://vercel.com/docs/instant-rollback)

### 4. CONFIRMACIÓN DE COMPLETITUD
- ¿Soporte puede operar solo?: [SÍ/NO]
- Gaps pendientes: [lista]

### 5. RECOMENDACIÓN DE AVANCE
- ¿Listos para Deployment final?: [SÍ/NO]
- Bloqueadores de release: [lista]
```

---

## RESTRICCIONES
- No pegar secretos reales (keys/tokens).
- Usar placeholders y ejemplos sintéticos.
- Mantener el lenguaje claro para soporte (no jerga innecesaria).

---

## INSTRUCCIÓN FINAL
Entrega:
1) Contenido final de cada documento (listo para copiar/pegar).
2) Un checklist de “Release Readiness” final para el Deployment.
```

Si quieres, pega tu `README.md` actual y el listado real de variables (solo nombres, no valores), y lo dejo exactamente adaptado a tu repo.