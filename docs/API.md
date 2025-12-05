# MI PANA APP 3.0 - API Documentation

## Overview
Documentación de servicios y APIs utilizados en MI PANA APP 3.0.

---

## Table of Contents
- [Authentication Service](#authentication-service)
- [Pricing Service](#pricing-service)
- [Wallet Service](#wallet-service)
- [External APIs](#external-apis)

---

## Authentication Service

### `authService.checkEmail(email: string)`
Verifica si un email existe en la base de datos.

**Returns:** `Promise<{ exists: boolean; user?: StoredUser }>`

```typescript
const result = await authService.checkEmail('user@example.com');
if (result.exists) {
  console.log('User found:', result.user);
}
```

---

### `authService.sendOtp(email: string)`
Envía código OTP de verificación vía email usando Supabase Auth.

**Returns:** `Promise<{ success: boolean, message: string }>`

```typescript
const result = await authService.sendOtp('user@example.com');
// Check email for OTP code
```

---

### `authService.verifyOtp(email: string, code: string)`
Verifica código OTP y crea sesión.

**Returns:** `Promise<{ valid: boolean; message?: string; session?: any }>`

```typescript
const result = await authService.verifyOtp('user@example.com', '123456');
if (result.valid) {
  // User is now authenticated
}
```

---

### `authService.registerUser(data: RegistrationData)`
Registra nuevo usuario pasajero.

**Parameters:**
```typescript
interface RegistrationData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  idType: 'V' | 'E' | 'J';
  idNumber: string;
  age: number;
  pin: string;
}
```

**Returns:** `Promise<User>`

---

### `authService.loginPassenger(identifier: string, pin: string)`
Inicia sesión de pasajero con email y PIN.

**Returns:** `Promise<User>`

```typescript
const user = await authService.loginPassenger('user@example.com', '123456');
```

---

### `authService.updateUser(userId: string, data: Partial<User>)`
Actualiza perfil de usuario.

**Returns:** `Promise<User>`

```typescript
const updated = await authService.updateUser(userId, {
  name: 'Nuevo Nombre',
  phone: '+58 414 1234567'
});
```

---

## Pricing Service

### `calculatePrice(distanceKm: number, serviceId?: ServiceId)`
Calcula precio de viaje y liquidación completa.

**Service IDs:**
- `'mototaxi'` - Servicio en moto
- `'el_pana'` - Servicio en carro estándar
- `'el_amigo'` - Servicio en carro económico  
- `'full_pana'` - Servicio de carga

**Returns:**
```typescript
{
  usd: number,
  ves: number,
  liquidation: LiquidationResult
}
```

**Example:**
```typescript
const price = calculatePrice(10, 'el_pana');
console.log(`Precio: $${price.usd} USD / Bs ${price.ves}`);
console.log(`Conductor recibe: $${price.liquidation.conductor.deposito_neto_usd}`);
```

---

### `calculateLiquidation(serviceId: ServiceId, distanceKm: number)`
Calcula liquidación detallada del viaje.

**Returns:** `LiquidationResult`

```typescript
interface LiquidationResult {
  input: {
    servicio_nombre: string;
    distancia_km: number;
    pfs_usd: number;
    pfs_ves: number;
  };
  conductor: {
    pago_bruto_usd: number;        // 95% del PFS
    islr_retenido_usd: number;     // 3% de retención ISLR
    deposito_neto_usd: number;     // Pago neto al conductor
    deposito_neto_ves: number;     // Pago en Bs
  };
  plataforma: {
    comision_bruta_usd: number;    // 5% del PFS
    ingreso_neto_app_usd: number;  // Ingreso neto (sin IVA)
    ingreso_neto_app_ves: number;
    iva_debito_fiscal_usd: number; // 16% IVA
    iva_debito_fiscal_ves: number;
  };
  seniat: {
    total_retenciones_usd: number; // ISLR + IVA
    total_retenciones_ves: number;
  };
  meta: {
    tasa_bcv: number;              // Tasa oficial BCV usada
    valid: boolean;                // Validación de balances
    timestamp: Date;
  };
}
```

---

### `fetchBcvRate()`
Obtiene tasa oficial del BCV. Se ejecuta automáticamente cada 5 minutos.

**Source API:** `https://ve.dolarapi.com/v1/dolares/oficial`

**Updates:** Global variables `currentBcvRate` and `lastBcvUpdate`

---

### `getTariffs()`
Obtiene tarifas actuales.

**Returns:**
```typescript
{
  currentBcvRate: number,
  lastUpdate: Date
}
```

---

## Wallet Service

### Edge Function: `process-transaction`

**⚠️ IMPORTANTE**: Las transacciones de billetera se procesan server-side vía Edge Function.

**Endpoint:** `supabase.functions.invoke('process-transaction')`

**Authentication:** Requiere JWT token válido

**Request Body:**
```typescript
{
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND';
  description: string;
  reference?: string; // Opcional, para Pago Móvil
}
```

**Response:**
```typescript
{
  success: boolean;
  profile: User;          // Perfil actualizado
  transaction: Transaction; // Transacción creada
}
```

**Example:**
```typescript
const { data, error } = await supabase.functions.invoke('process-transaction', {
  body: {
    userId: user.id,
    amount: 25.00,
    type: 'DEPOSIT',
    description: 'Recarga de billetera',
    reference: 'PM-1234567890'
  }
});

if (error) {
  console.error('Transaction failed:', error);
} else {
  console.log('New balance:', data.profile.wallet.balance);
}
```

**Error Handling:**
- `"Unauthorized"` - Usuario no autenticado
- `"Cannot perform transactions on other user accounts"` - Intento de modificar cuenta ajena
- `"User profile not found"` - Perfil no existe
- `"Insufficient balance"` - Saldo insuficiente para retiro/pago

**Deployment:**
```bash
# Link to Supabase project
supabase link --project-ref mdaksestqxfdxpirudsc

# Deploy function
supabase functions deploy process-transaction
```

---

## External APIs

### BCV Exchange Rate API
**Provider:** DolarApi  
**URL:** `https://ve.dolarapi.com/v1/dolares/oficial`  
**Documentation:** https://dolarapi.com/docs/venezuela/operations/get-dolar-oficial

**Response:**
```json
{
  "promedio": 46.23,
  "fechaActualizacion": "2025-11-22T12:00:00.000Z",
  "fuente": "BCV"
}
```

**Update Frequency:** Every 5 minutes (automatic)

**Fallback Value:** 46.23 (if API fails)

---

### Google Maps API
**Service:** `@react-google-maps/api`  
**Features Used:**
- Traffic Layer
- Directions API
- Geocoding

**Configuration:**
- API Key: `VITE_GOOGLE_MAPS_API_KEY` (env variable)
- Restrictions: HTTP Referrer (localhost + production domain)

---

### Google OAuth
**Service:** `@react-oauth/google`  
**Provider:** Supabase Auth

**Configuration:**
```typescript
<GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>
  <App />
</GoogleOAuthProvider>
```

**Scopes:**
- `email`
- `profile`
- (Optional) `calendar` - For calendar sync
- (Optional) `tasks` - For task sync

---

## Type Definitions

All types are defined in `types.ts`. Key interfaces:

- `User` - Usuario del sistema
- `Ride` - Viaje
- `Transaction` - Transacción de billetera
- `LiquidationResult` - Resultado de liquidación
- `ServiceConfig` - Configuración de servicio
- `DriverProfile` - Perfil extendido de conductor
- `PassengerProfile` - Perfil extendido de pasajero

---

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Test Coverage
- ✅ `pricingService.ts` - 100% coverage
- 🔄 Additional services pending

---

## Security Considerations

### ✅ Implemented
- Server-side wallet transactions via Edge Functions
- Supabase Row Level Security (RLS)
- JWT authentication for all API calls
- Input validation on Edge Functions
- Conditional logging (dev only)

### ⚠️ Recommendations
- Implement rate limiting on Edge Functions
- Add transaction audit logs
- Enable 2FA for sensitive operations
- Regular security audits

---

## Environment Variables

Required in `.env` file:

```bash
# Supabase
VITE_SUPABASE_URL=https://mdaksestqxfdxpirudsc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Google
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```

---

**Last Updated:** 2025-11-22  
**Version:** 3.0
