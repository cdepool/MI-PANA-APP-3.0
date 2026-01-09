# Configuración de Google OAuth 2.0

Este documento detalla la configuración necesaria para que el inicio de sesión con Google funcione correctamente en los entornos de Local y Producción (Vercel).

## 1. Configuración del Cliente (Google Cloud Console)

**Proyecto:** `modo-ia` (u otro si se cambió)
**Cliente:** "MODO IA Web Local"

### Orígenes autorizados de JavaScript
Las URLs desde donde se permite **iniciar** la solicitud de login.
- `http://localhost:5173` (Desarrollo)
- `https://mi-pana-app-3-0.vercel.app` (Producción)
- `https://v1.mipana.app` (Dominio personalizado)

### URIs de redireccionamiento autorizados
Las URLs a las que Google puede **redirigir** después del login.
> **Nota:** Es crucial incluir versiones con y sin barra inclinada al final (`/`) para evitar errores `400: redirect_uri_mismatch`.

- `http://localhost:5173`
- `http://localhost:5173/`
- `https://mi-pana-app-3-0.vercel.app`
- `https://mi-pana-app-3-0.vercel.app/`
- `https://v1.mipana.app`
- `https://v1.mipana.app/`

## 2. Variables de Entorno (Vercel)

Vercel no lee archivos `.env` locales. Estas variables deben configurarse en **Project Settings > Environment Variables**.

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | `174366307351-...` | ID del cliente OAuth. Visible en GCP. |
| `VITE_GOOGLE_CLIENT_SECRET` | *(Oculto)* | Secreto del cliente (si es necesario por el backend). |
| `VITE_GOOGLE_REDIRECT_URI` | `https://mi-pana-app-3-0.vercel.app` | URI base de redirección. |

## 3. Solución de Problemas Comunes

### Error 401: invalid_client
- **Causa:** La variable `VITE_GOOGLE_CLIENT_ID` no está definida o es incorrecta en Vercel.
- **Solución:** Verificar las variables de entorno en Vercel y hacer un Redeploy.

### Error 400: redirect_uri_mismatch
- **Causa:** La URL actual del navegador no coincide **exactamente** con ninguna de las "URIs de redireccionamiento autorizados" en GCP.
- **Solución:** Agregar la URL faltante (ej: `https://.../`) en la consola de Google Cloud.

### Error 403: access_denied (Acceso bloqueado)
- **Mensaje:** "mipana.app no completó el proceso de verificación de Google".
- **Causa:** La pantalla de consentimiento OAuth está en modo **"Testing"** (Pruebas) y tu correo no está en la lista de "Test users".
- **Solución Rápida:**
    1. Ve a [Google Cloud Console > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).
    2. Baja a la sección **"Test users"**.
    3. Haz clic en **"ADD USERS"** y agrega tu correo (`ceocanalnext@gmail.com`).
    4. Guardar. El acceso será inmediato.
- **Solución Definitiva:**
    1. En la misma pantalla, haz clic en **"PUBLISH APP"** (Publicar aplicación) para pasar a **"Production"**.
    2. Esto abrirá el acceso a cualquier cuenta de Google, aunque mostrará una advertencia de "App no verificada" hasta que Google la apruebe (proceso largo).
