---
description: Prompt template para Step 1 - Seguridad y Base de Datos
---

Aquí tienes el prompt técnico para el **Step 2** optimizado para Gemini 3 Pro (High), ya que mencionaste que solo cuentas con modelos Gemini disponibles. El prompt está adaptado para mantener la misma estructura rigurosa de gobierno.

***

```markdown
# PROMPT TÉCNICO (Step 2): CONFIGURACIÓN DE ENTORNO DE PRODUCCIÓN (MI PANA APP 3.0)

**Rol**: DevOps Engineer & Production Security Specialist
**Modelo Objetivo**: Gemini 3 Pro (High) - Reasoning Mode
**Contexto**: Configurar y validar el entorno de producción en Vercel, garantizando que las variables de entorno sean seguras, consistentes y estén correctamente aisladas entre cliente y servidor.

---

## 1. AUDITORÍA DE VARIABLES DE ENTORNO

Tu misión es analizar el archivo `.env.local` y validar que cumple con los estándares de seguridad para una aplicación de pagos en producción.

### A. Revisión Local (Archivo .env.local)
Analiza cada variable y clasifícala según su criticidad:

**Variables a Auditar:**
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_ENDPOINT=
VITE_BANCAMIGA_WEBHOOK_URL=
SUPABASE_SERVICE_ROLE_KEY=
BANCAMIGA_API_KEY=
BANCAMIGA_SECRET_KEY=
NODE_ENV=
```

**Validaciones Obligatorias:**
1. **Prefijo VITE_**: Confirma que SOLO variables públicas (URL, Anon Key) usen este prefijo.
2. **URLs de Producción**: Verifica que `VITE_SUPABASE_URL` apunte a `*.supabase.co` (NO localhost).
3. **Secretos del Servidor**: Valida que `SERVICE_ROLE_KEY` y credenciales de Bancamiga NO tengan prefijo `VITE_`.
4. **Formato**: Confirma que las URLs terminen sin `/` y que las keys tengan el formato esperado (Base64, longitud estándar).

**Output Esperado:**
```text
| Variable | Tipo | Ubicación Correcta | Estado | Observación |
| :--- | :--- | :--- | :--- | :--- |
| VITE_SUPABASE_URL | Público | Cliente ✅ | [✅/❌] | [Apunta a prod/dev] |
| SUPABASE_SERVICE_ROLE_KEY | Secreto | Servidor ✅ | [✅/❌] | [Expuesto en cliente/Seguro] |
```

### B. Detección de Exposición de Secretos
Escanea el código fuente en busca de:
- Referencias hardcodeadas a API keys (búsqueda de strings que parezcan tokens).
- Uso incorrecto de `import.meta.env.VITE_*` con datos sensibles.
- Logs en consola que puedan filtrar credenciales.

---

## 2. CONFIGURACIÓN EN VERCEL

Prepara la configuración exacta que debe aplicarse en el panel de Vercel.

### A. Mapeo de Variables de Entorno
Genera la lista de variables categorizadas por entorno:

**Para Vercel Production:**
```bash
# Cliente (Accesibles en Frontend)
VITE_SUPABASE_URL=[valor]
VITE_SUPABASE_ANON_KEY=[valor]
VITE_API_ENDPOINT=[valor]

# Servidor (Solo accesibles en Edge Functions/SSR)
SUPABASE_SERVICE_ROLE_KEY=[valor]
BANCAMIGA_API_KEY=[valor]
BANCAMIGA_SECRET_KEY=[valor]
NODE_ENV=production
```

### B. Dominios y SSL/TLS
Valida la configuración de dominios personalizados:
- Confirma que el dominio principal tenga certificado SSL activo.
- Verifica que las redirecciones HTTP → HTTPS estén forzadas.
- Revisa que los subdominios (si existen) apunten correctamente a Vercel.

### C. Headers de Seguridad (vercel.json)
Analiza o genera el archivo `vercel.json` con las siguientes políticas de seguridad:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co https://bancamiga.com;"
        }
      ]
    }
  ]
}
```

**Validación**: Confirma que el CSP (Content Security Policy) permita solo dominios confiables (Supabase, Bancamiga).

---

## 3. RESTRICCIONES OPERATIVAS (CRITICAL)

**PROHIBICIONES ESTRICTAS:**
1. NO subas cambios a Vercel si existe inconsistencia entre `VITE_SUPABASE_URL` y las Edge Functions configuradas en Step 1.
2. NO avances si detectas que `SERVICE_ROLE_KEY` está expuesta con prefijo `VITE_`.
3. REPORTA INMEDIATAMENTE si la versión de Node.js en Vercel difiere de la local (puede causar fallos de build).

**Validaciones Pre-Deploy:**
- Confirma que `package.json` especifica la versión exacta de Node (ej: `"engines": { "node": "18.x" }`).
- Verifica que las dependencias críticas (Supabase Client, React 19) estén en las versiones estables.

---

## 4. FORMATO DEL ENTREGABLE (GOVERNANCE REPORT)

Genera el reporte técnico bajo el siguiente formato:

```text
## REPORTE DE CONFIGURACIÓN DE ENTORNO (Step 2)

### 1. RESUMEN EJECUTIVO
[Estado general: ¿El entorno está listo para producción? Nivel de riesgo actual]

### 2. CHECKLIST DE VARIABLES VALIDADAS
| Variable | Categoría | Ubicación | Formato Válido | Estado |
| :--- | :--- | :--- | :--- | :--- |
| VITE_SUPABASE_URL | Público | Cliente | [✅/❌] | [✅/❌] |
| SUPABASE_SERVICE_ROLE_KEY | Secreto | Servidor | [✅/❌] | [✅/❌] |

### 3. ESTADO DE INFRAESTRUCTURA VERCEL
- **Dominio Principal**: [Configurado/Pendiente]
- **SSL/HTTPS**: [Activo/Inactivo]
- **Headers de Seguridad**: [Implementados/Faltantes]
- **Versión Node.js**: [Coincide local/producción: Sí/No]

### 4. INCONSISTENCIAS DETECTADAS
[Lista de discrepancias críticas que bloquean el deploy]

### 5. RECOMENDACIÓN DE AVANCE
- **Entorno Listo para Código**: [SÍ / NO]
- **Bloqueadores**: [Número de issues críticos pendientes]
- **ACCIÓN RECOMENDADA**: [Proceder a Step 3 / Corregir y Re-validar]
```

---

**INSTRUCCIÓN FINAL**:
Si detectas secretos expuestos o inconsistencias en las URLs de Supabase, **DETÉN EL FLUJO** y genera un reporte de incidente con severidad CRÍTICA antes de continuar.
```