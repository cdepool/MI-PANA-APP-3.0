# Bancamiga Proxy Relay para Mi Pana App 🚀

Este servidor actúa como un "puente" (Relay) para que las peticiones de Supabase lleguen a Bancamiga a través de tu IP autorizada (**35.202.142.88**).

## Requisitos
- Tener instalada la herramienta `gcloud` en tu Mac.
- Estar logueado en tu proyecto de Google Cloud.

## Instrucciones de Despliegue (GCP App Engine)

1. **Abre la Terminal** en esta carpeta (`gcp-proxy`).
2. **Ejecuta el despliegue:**
   ```bash
   gcloud app deploy
   ```
3. **Obtén la URL:**
   Al terminar, ejecuta:
   ```bash
   gcloud app browse
   ```
   Copia la URL que te dé (ej. `https://tu-proyecto.uc.r.appspot.com`).

## Configuración en Supabase

Una vez tengas la URL del Proxy, ve al Dashboard de Supabase y cambia:
- `BANCAMIGA_HOST` = `[LA_URL_DE_TU_PROXY]` (Sin la barra `/` al final)

---
*Tecnología de Rescate by Antigravity*
