---
description: Gobierno y reglas maestras para MI PANA APP 3.0
---

# 🎯 GOBIERNO PROMPT MAESTRO - MI PANA APP 3.0

## Principios Fundamentales

### 1. Coherencia de Workspace
- **Regla**: Todas las operaciones de producción se ejecutan en el mismo workspace
- **Workspace**: `mi-pana-app`
- **Razón**: Mantener contexto completo y evitar fragmentación de información

### 2. Conversaciones Separadas por Step
- **Regla**: Cada Step principal tiene su propia conversación
- **Razón**: Control granular, auditoría clara, rollback específico
- **Formato de título**: `MI PANA APP 3.0 - Step X: [Nombre]`

### 3. Workflow Obligatorio
- **Regla**: Seguir estrictamente el workflow de producción 3.0
- **Razón**: Orden, trazabilidad, prevención de errores
- **Documento**: `.agent/workflows/produccion-3-0.md`

## Reglas de Operación

### 🔒 Seguridad
1. **Nunca** modificar código de seguridad sin validación previa
2. **Siempre** documentar cambios en variables de entorno
3. **Obligatorio** backup antes de modificar RLS policies

### 🗄️ Base de Datos
1. **Nunca** ejecutar migraciones en producción sin testing previo
2. **Siempre** usar transacciones para cambios múltiples
3. **Obligatorio** validar integridad referencial

### 💻 Código
1. **Nunca** hacer deploy sin build exitoso
2. **Siempre** seguir convenciones establecidas
3. **Obligatorio** code review en cambios críticos

### ✅ Testing
1. **Nunca** skipear tests en features críticas
2. **Siempre** validar en ambiente de staging
3. **Obligatorio** regression testing antes de deploy

### 📊 Deployment
1. **Nunca** deployar en horario pico
2. **Siempre** tener plan de rollback
3. **Obligatorio** validación post-deployment

## Protocolo de Comunicación

### Formato de Reporte Obligatorio
```
## Step [X.Y]: [Nombre]
### Estado: [En Progreso / Completado / Bloqueado]
### Acciones Realizadas:
- [Acción 1]
- [Acción 2]

### Validaciones:
- [✓] Validación 1
- [✗] Validación 2 (pendiente)

### Próximos Pasos:
1. [Paso 1]
2. [Paso 2]

### Bloqueos/Riesgos:
- [Descripción si aplica]
```
