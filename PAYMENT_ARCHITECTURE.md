# Arquitectura de Billetera y Pagos

Este documento describe la arquitectura técnica del sistema de billetera digital y pagos de **Mi Pana App 3.0**. El sistema está diseñado para manejar saldos en USD con visualización en Bolívares (VES) basada en la tasa oficial del BCV.

## 1. Modelo de Datos (Base de Datos)

El núcleo del sistema reside en PostgreSQL (Supabase), protegido por **Row Level Security (RLS)**.

### Tablas Principales

#### `wallets`
Almacena el saldo actual de cada usuario.
*   `id`: UUID (Primary Key)
*   `user_id`: UUID (Foreign Key a `auth.users`)
*   `balance_usd`: DECIMAL (Saldo real en Dólares)
*   `balance_ves`: DECIMAL (Saldo remanente en Bolívares, si aplica)
*   `status`: enum ('active', 'frozen')
*   `updated_at`: Timestamp

#### `transactions`
Registro inmutable de todos los movimientos.
*   `id`: UUID
*   `wallet_id`: UUID
*   `type`: enum ('recharge', 'payment', 'transfer', 'adjustment')
*   `amount_usd`: DECIMAL
*   `amount_ves`: DECIMAL
*   `rate`: DECIMAL (Tasa de cambio aplicada en el momento)
*   `status`: enum ('completed', 'pending', 'failed')
*   `metadata`: JSONB (Detalles del banco, referencia, etc.)

#### `exchange_rates`
Histórico y tasa vigente del BCV.
*   `id`: UUID
*   `rate`: DECIMAL (Bs. por Dólar)
*   `rate_type`: 'oficial' (BCV) o 'paralelo'
*   `effective_date`: DATE (Fecha de vigencia)
*   `source`: String (ej. 'dolarapi.com')

## 2. Lógica de Negocio (Edge Functions)

Las operaciones críticas se ejecutan en el servidor (Deno Edge Functions) para garantizar seguridad e integridad.

### `wallet-get-balance` (Lectura con Lazy Sync)
Obtiene el saldo del usuario y la tasa del día.
*   **Lazy Sync:**
    1.  Verifica si existe una tasa para `hoy` en la BD.
    2.  Si **NO existe**: Consulta la API externa (`DolarAPI`), guarda el valor en la BD y lo retorna.
    3.  Si **SI existe**: Retorna el valor de la BD (o caché de memoria).
*   **Seguridad:** Valida token JWT del usuario.

### `wallet-recharge` (Escritura)
Procesa recargas de saldo.
*   **Entrada:** `userId`, `monto`, `referencia`, `banco`.
*   **Proceso:**
    1.  Verifica unicidad de la referencia (para evitar duplicados).
    2.  (En producción) Validaría contra API bancaria.
    3.  Inicia transacción SQL:
        *   Incrementa `wallet.balance_usd`.
        *   Inserta registro en `transactions`.
*   **Salida:** Nuevo saldo.

### `process-payment` (Escritura)
Dedica saldo para pagar un viaje.
*   **Proceso:**
    1.  Verifica saldo suficiente (`balance >= amount`).
    2.  Transacción atómica: Restar saldo, crear registro de pago.

## 3. Seguridad

### Principios Fundamentales
1.  **Frontend Ciego:** El cliente (React) nunca calcula saldos ni escribe directamente en `wallets`. Solo visualiza datos y solicita acciones a las Edge Functions.
2.  **RLS Estricto:** Incluso si un usuario logra consultar la tabla `wallets` directamente, RLS asegura que solo vea su propio registro (`auth.uid() = user_id`).
3.  **Validación de Servidor:** Todos los inputs (montos positivos, referencias válidas) se validan en el backend.

### Gestión de Tasa de Cambio
La tasa se sincroniza automáticamente para asegurar que los usuarios siempre vean la conversión correcta. El mecanismo "Lazy Sync" actúa como respaldo robusto ante fallos de tareas programadas (Cron Jobs).
