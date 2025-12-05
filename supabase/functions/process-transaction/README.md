# Supabase Edge Function: process-transaction

## Descripción
Edge Function serverless para procesar transacciones de billetera de forma segura en el servidor, eliminando la vulnerabilidad de procesamiento en el cliente.

## Seguridad
- ✅ Autenticación obligatoria vía JWT
- ✅ Validación que usuario solo puede modificar su propia billetera
- ✅ Uso de `service_role` key para operaciones atómicas
- ✅ Verificación de saldo antes de retiros/pagos
- ✅ Rate limiting incorporado por Supabase

## Deployment

### Requisitos Previos
1. Tener CLI de Supabase instalado:
   ```bash
   npm install -g supabase
   ```

2. Autenticarse con el proyecto:
   ```bash
   supabase login
   supabase link --project-ref mdaksestqxfdxpirudsc
   ```

### Deploy de la función
```bash
supabase functions deploy process-transaction
```

### Variables de Entorno
La función ya tiene acceso automático a:
- `SUPABASE_URL`: URL del proyecto
- `SUPABASE_ANON_KEY`: Key pública
- `SUPABASE_SERVICE_ROLE_KEY`: Key administrativa (secreta)

## Uso desde el Cliente

```typescript
const { data, error } = await supabase.functions.invoke('process-transaction', {
  body: {
    userId: user.id,
    amount: 10.00,
    type: 'DEPOSIT',
    description: 'Recarga de billetera',
    reference: 'PM-123456' // Opcional
  }
});
```

## Response

### Success (200)
```json
{
  "success": true,
  "profile": { 
    /* Updated user profile with new wallet balance */
  },
  "transaction": {
    "id": "tx-1234567890-abc",
    "amount": 10.00,
    "currency": "USD",
    "exchangeRate": 46.23,
    "type": "DEPOSIT",
    "status": "COMPLETED",
    ...
  }
}
```

### Error (400)
```json
{
  "error": "Insufficient balance"
}
```

## Testing Local
```bash
supabase functions serve process-transaction
```

Luego hacer requests a: `http://localhost:54321/functions/v1/process-transaction`
