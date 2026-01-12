# Guía de Configuración Final - Bancamiga Pago Móvil 🚀

Sigue estos pasos para activar la verificación automática de pagos en **Mi Pana App**.

---

## 1. Configuración de Seguridad (Desde tu Terminal)
Abre la **Terminal** en tu Mac y ejecuta estos comandos.

### A. Cambiar la Contraseña Temporal
Reemplaza `TU_NUEVA_CLAVE` por una contraseña segura y distinta a la actual.
```bash
curl -X POST 'https://adminp2p.sitca-ve.com/public/auth/security/users/password/new' \
-H 'Content-Type: application/json' \
-d '{
    "Dni": "J40724274",
    "Pass": "q12tfcJucU8hO*",
    "PassNew": "TU_NUEVA_CLAVE"
}'
```

### B. Generar Tokens Iniciales
Usa la nueva contraseña que creaste arriba:
```bash
curl -X POST 'https://adminp2p.sitca-ve.com/public/auth/security/users/token' \
-H 'Content-Type: application/json' \
-d '{
    "Dni": "J40724274",
    "Pass": "TU_NUEVA_CLAVE"
}'
```
> [!IMPORTANT]
> Copia los valores de `token`, `refresToken` y `expireDate` de la respuesta. Los necesitarás en el paso 2.

---

## 2. Configurar Secretos en Supabase
Ve al Dashboard de Supabase (**Settings > Edge Functions** o la sección de Secrets) y agrega/actualiza estos valores:

| Nombre del Secreto | Valor |
| :--- | :--- |
| `BANCAMIGA_ACCESS_TOKEN` | Pega el `token` obtenido |
| `BANCAMIGA_REFRESH_TOKEN` | Pega el `refresToken` obtenido |
| `BANCAMIGA_TOKEN_EXPIRES` | Pega el número de `expireDate` |
| `WEBHOOK_AUTH_TOKEN` | Inventa una clave segura (ej. `M1-P4N4-S3CR3T-2026`) |

---

## 3. Registro del Webhook en Bancamiga
Notifica a Bancamiga (vía soporte o su portal) los datos de recepción:

*   **URL de Webhook**: `https://mdaksestqxfdxpirudsc.supabase.co/functions/v1/bancamiga-webhook`
*   **Access Token / Authorization**: Pega aquí la clave que inventaste en `WEBHOOK_AUTH_TOKEN`.

---

## 4. Verificación y Dominios
> [!IMPORTANT]
> **Dominio Autorizado:** Bancamiga tiene en su lista blanca el dominio **`v1.mipana.app`** como origen de confianza (IP Fija). Asegúrate de que todas las pruebas de producción se realicen a través de este dominio para evitar bloqueos en la verificación de pagos.

1. **En la App**: Crea una solicitud de recarga desde `v1.mipana.app`.
2. **Banco**: Realiza el Pago Móvil a **Next TV C.A.** (0272 / 0414-5274111 / J-40724274-1).
3. **Confirmación**: El dinero debería aparecer en tu billetera de la app automáticamente en pocos segundos.

---
**¿Dudas?**
Si Bancamiga solicita una **IP fija**, avísame para ayudarte con la configuración de un Proxy.
