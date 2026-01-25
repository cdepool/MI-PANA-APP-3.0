Asunto: Registro de Webhook para Notificaciones de Pago Móvil - NEXT TV, C.A.

Estimado equipo de Soporte Técnico de Bancamiga,

Soy [Tu Nombre], representante de **NEXT TV, C.A.** (RIF: J-40724274-1), y me comunico para solicitar el registro de nuestro endpoint de webhook para recibir notificaciones automáticas de pagos móvil.

## Datos de la Empresa
- **Razón Social:** NEXT TV, C.A.
- **RIF:** J-40724274-1
- **Cuenta Bancamiga:** 0172-0251-18-2518546169
- **Teléfono:** 0414-5274111
- **Correos:** ceocanalnext@gmail.com, pagos@mipana.app

## Datos del Webhook

Por favor, registren el siguiente endpoint para recibir notificaciones push de pagos móvil:

**URL del Webhook:**
```
https://mdaksestqxfdxpirudsc.supabase.co/functions/v1/bancamiga-webhook
```

**Método:** POST

**Authorization Header:**
```
Authorization: Bearer MiPana2026-Webhook-beauec6986ab713cab9baa1b3ddd17885ce172a083be9f674
```

## Especificaciones Técnicas

Nuestro endpoint está configurado para:
- Recibir notificaciones en formato JSON
- Responder con HTTP 200 y el formato esperado: `{"Code": 200, "Refpk": "[refpk_del_pago]"}`
- Procesar notificaciones con validación HMAC-SHA256 (si está disponible)
- Implementar protección contra replay attacks
- Registrar todas las notificaciones recibidas para auditoría

## Campos que Esperamos Recibir

Según la documentación de la API, esperamos recibir:
- `BancoOrig`: Código del banco origen
- `FechaMovimiento`: Fecha del movimiento (YYYY-MM-DD)
- `HoraMovimiento`: Hora del movimiento (HH:MM:SS)
- `NroReferencia`: Número de referencia del pago
- `PhoneOrig`: Teléfono origen (formato 584XXXXXXXXX)
- `PhoneDest`: Teléfono destino (584145274111)
- `Status`: Estado del pago
- `Descripcion`: Descripción del pago
- `Amount`: Monto del pago
- `Refpk`: Referencia primaria única

## Información Adicional

- Nuestro sistema está desplegado en infraestructura de Supabase (Google Cloud Platform, región us-central1)
- IP pública actual: 35.202.142.88 (ya registrada en su whitelist)
- Dominio de producción: v1.mipana.app
- Horario de operación: 24/7

## Pruebas

Una vez registrado el webhook, agradeceríamos poder realizar una transacción de prueba para verificar que las notificaciones se reciben correctamente.

---

Quedo atento a su confirmación y cualquier información adicional que requieran para completar el registro.

Saludos cordiales,

[Tu Nombre]
[Tu Cargo]
NEXT TV, C.A.
[Tu Teléfono]
[Tu Email]
