# Regla Estricta: Cotización del Dólar Oficial en Venezuela

Esta documentación define la ÚNICA fuente de verdad autorizada para la obtención de la tasa de cambio en la aplicación.

## 1. Endpoint Oficial
Nunca utilizar otro endpoint.
- **Método**: `GET`
- **URL**: `https://ve.dolarapi.com/v1/dolares/oficial`

## 2. Verificación (cURL)
Comando estándar para probar la conexión:
```bash
curl https://ve.dolarapi.com/v1/dolares/oficial
```

## 3. Estructura de Respuesta (JSON)
El servicio debe esperar y validar estrictamente este formato base:

```json
{
  "fuente": "string",            // Ej: "Banco Central de Venezuela"
  "nombre": "string",            // Ej: "Oficial"
  "compra": 0,                   // Valor numérico
  "venta": 0,                    // Valor numérico
  "promedio": 0,                 // ✅ ESTE ES EL VALOR A UTILIZAR PARA CÁLCULOS
  "fechaActualizacion": "string" // ISO Date String
}
```

## 4. Implementación
El campo crítico para la lógica de negocio es `promedio`.

> **Nota**: Cualquier actualización a `pricingService.ts` o `ProfessionalHeader.tsx` debe adherirse estrictamente a esta especificación.
