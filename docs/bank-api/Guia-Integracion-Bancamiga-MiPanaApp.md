# 📱 Guía Ultra Detallada: Integración API Bancamiga → Mi Pana App

**Documento Base:** Doc API Bancamiga - PM  
**Última modificación:** 2025-05-08  
**Versión de la guía:** Configuración específica para Mi Pana App

---

## 📋 TRANSCRIPCIÓN COMPLETA DEL DOCUMENTO

### 1. REQUERIMIENTOS PREVIOS

Para configurar las credenciales de consumo de APIs, **debes validar que cuentas con:**

- ✅ Cuenta jurídica Bancamiga (activa)
- ✅ Afiliación a pago móvil de Bancamiga
- ✅ Interconexión entre tu servidor y el servidor de Bancamiga
- ✅ Implementación de webhook para recibir notificaciones de pagos
- ✅ Mejores prácticas de seguridad en tu código

### 2. INTERCONEXIÓN

Para consumir las APIs, **necesitas una interconexión activa** entre tu servidor y el servidor de Bancamiga. Tienes 3 opciones:

#### 🔹 Opción A: IP Pública Fija (Tu caso actual ✅)
- Proporcionas tu IP pública fija
- Bancamiga la agrega a una lista blanca
- **Tu IP:** 35.202.142.88
- **Ubicación:** us-central1 (Iowa)
- **Estado:** Activa y lista

#### 🔹 Opción B: AWS Peering
- Proporcionar datos de configuración AWS
- Establecer peering de AWS

#### 🔹 Opción C: VPN Site-to-Site
- Bancamiga envía planilla de configuración
- Establecer conexión VPN con su servidor

### 3. CERTIFICADO SSL

**Información crítica:** Si usas VPN, es probable que obtengas errores de certificado SSL.

**Solución:** Debes saltar la verificación SSL al consumir los endpoints.

#### 📌 Saltar verificación SSL con cURL (Flag -k)
```bash
curl -k --location --request POST '{{HOST}}/public/protected/pm/find' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{ACCESS TOKEN}}' \
--data-raw '{
    "Phone":"584120000000",
    "Bank":"0172",
    "Date":"2025-05-08"
}'
```

#### 📌 Saltar verificación SSL con PHP
```php
$curl = curl_init();
curl_setopt_array($curl, array(
    // Otras configuraciones...
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    // Otras configuraciones...
));
$response = curl_exec($curl);
curl_close($curl);
```

### 4. ENDPOINTS DISPONIBLES

#### A. GET - CHECK (Verificar estado del servicio)

**Descripción:** Permite consultar el estatus del servicio de Bancamiga

**Endpoint:** `{{HOST}}/healthcheck`

**Método:** GET

**Headers requeridos:**
```
Content-Type: application/json
```

**Request (ejemplo):**
```bash
curl '{{HOST}}/healthcheck'
```

**Response (éxito):**
```json
{
    "code": 200,
    "time": "2025-05-08T15:47:36.951226361-04:00"
}
```

---

#### B. POST - NEW PASSWORD (Actualizar contraseña)

**Descripción:** Actualiza la contraseña temporal por una nueva segura. **Debes hacerlo PRIMERO.**

**Endpoint:** `{{HOST}}/public/auth/security/users/password/new`

**Método:** POST

**Headers requeridos:**
```
Authorization: Bearer {{TOKEN_INICIAL}}
Content-Type: application/json
```

**Request (ejemplo):**
```bash
curl --location --request POST '{{HOST}}/public/auth/security/users/password/new' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.tCe4aaOapv43ni5K1KfR9qPLajYl0_dxwYQlF9KEwOg' \
--header 'Content-Type: application/json' \
--data-raw '{
    "Dni":"J40724274",
    "Pass":"AN#LklI#*r1",
    "PassNew":"TuNuevaContraseña123!@#"
}'
```

**Request (para Mi Pana App):**
```bash
curl --location --request POST '{{HOST}}/public/auth/security/users/password/new' \
--header 'Authorization: Bearer {{TOKEN_INICIAL_DE_BANCAMIGA}}' \
--header 'Content-Type: application/json' \
--data-raw '{
    "Dni":"J40724274",
    "Pass":"{{ContraseñaTemporalRecibida}}",
    "PassNew":"{{TuNuevaContraseñaSegura}}"
}'
```

**Response (éxito):**
```json
{
    "code": 200,
    "mensaje": "Contrasena Actualizada",
    "mod": "users"
}
```

**Códigos de respuesta:**

| Código | Mensaje |
|--------|---------|
| 200 | Contraseña Actualizada |
| 511 | Error formato |
| 550 | Error en contraseña |
| 551 | Error en usuario o contraseña inválida |

---

#### C. POST - NEW ACCESS TOKEN (Generar tokens)

**Descripción:** Genera un token de acceso (válido 1 año) y un token de renovación. **Debes hacerlo SEGUNDO.**

**Prerequisito:** Haber ejecutado POST - NEW PASSWORD primero

**Endpoint:** `{{HOST}}/public/auth/security/users/token`

**Método:** POST

**Headers requeridos:**
```
Authorization: Bearer {{TOKEN_INICIAL}}
Content-Type: application/json
```

**Request (ejemplo):**
```bash
curl --location --request POST '{{HOST}}/public/auth/security/users/token' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.tCe4aaOapv43ni5K1KfR9qPLajYl0_dxwYQlF9KEwOg' \
--header 'Content-Type: application/json' \
--data-raw '{
    "Dni": "J40724274",
    "Pass": "TuNuevaContraseña123!@#"
}'
```

**Response (éxito):**
```json
{
    "code": 200,
    "expireDate": 1778246388,
    "mensaje": "Token generado exitosamente",
    "mod": "users",
    "refresToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Códigos de respuesta:**

| Código | Mensaje |
|--------|---------|
| 200 | Token generado exitosamente |
| 511 | Error formato |
| 550 | Error en Contraseña |
| 201 | Su contraseña esta expirada |
| 503 | Credenciales inválidas |

---

#### D. POST - REFRESH TOKEN (Renovar tokens)

**Descripción:** Genera un nuevo token de acceso y refresh token. Debes hacerlo **mínimo 1 mes antes de que expire** tu token actual.

**Endpoint:** `{{HOST}}/public/re/refresh`

**Método:** POST

**Headers requeridos:**
```
Authorization: Bearer {{ACCESS_TOKEN_ACTUAL}}
Content-Type: application/json
```

**Request (ejemplo):**
```bash
curl --location --request POST '{{HOST}}/public/re/refresh' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{ACCESS_TOKEN_ACTUAL}}' \
--data-raw '{
    "refresh_token":"{{REFRESH_TOKEN_ACTUAL}}"
}'
```

**Response (éxito):**
```json
{
    "code": 200,
    "expireDate": 1778246388,
    "mensaje": "Token generado exitosamente",
    "mod": "users",
    "refresToken": "{{REFRESH_TOKEN_NUEVO}}",
    "token": "{{ACCESS_TOKEN_NUEVO}}"
}
```

**Códigos de respuesta:**

| Código | Mensaje |
|--------|---------|
| 200 | Token generado exitosamente |
| 511 | Error formato |
| 512 | Error token expirado o inválido |

---

#### E. POST - FIND PAYMENT MOBILE (Buscar pagos móvil)

**Descripción:** Busca pagos móvil recibidos de un teléfono, banco y fecha específicos. **Este es el más importante para conciliar.**

**Endpoint:** `{{HOST}}/public/protected/pm/find`

**Método:** POST

**Headers requeridos:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json
```

**Request (ejemplo):**
```bash
curl --location --request POST '{{HOST}}/public/protected/pm/find' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{ACCESS_TOKEN}}' \
--data-raw '{
    "Phone":"584240000000",
    "Bank":"0172",
    "Date":"2025-05-08"
}'
```

**Response (éxito con resultados):**
```json
{
    "code": 200,
    "lista": [
        {
            "ID": "b6639593-7623-41c1-b1e0-4b041a64018f",
            "created_at": "2025-05-08T10:12:02.594289-04:00",
            "update_at": "2025-05-08T10:12:03.358268-04:00",
            "deleted_at": null,
            "Dni": "J40724274",
            "PhoneDest": "584120000000",
            "PhoneOrig": "584240000000",
            "Amount": 5.12,
            "BancoOrig": "0172",
            "NroReferenciaCorto": "575202",
            "NroReferencia": "000000575202",
            "HoraMovimiento": "10:12:02",
            "FechaMovimiento": "2025-05-08",
            "Descripcion": "pago",
            "Status": "500",
            "Refpk": "202505080172584240000000575202",
            "Ref": 29211968
        }
    ],
    "mod": "find",
    "num": 1
}
```

**Parámetros del Request:**

| Campo | Formato | Ejemplo | Descripción |
|-------|---------|---------|-------------|
| Phone | String | 584240000000 | 58 + código operadora + número |
| Bank | String | 0172 | Código del banco origen |
| Date | String | 2025-05-08 | Fecha YYYY-MM-DD |

**Campos de la Response:**

| Campo | Descripción |
|-------|-------------|
| ID | ID único del pago |
| created_at | Fecha/hora de creación |
| update_at | Fecha/hora de actualización |
| Dni | RIF/Cédula del receptor |
| PhoneDest | Teléfono destino |
| PhoneOrig | Teléfono origen |
| Amount | Monto recibido |
| BancoOrig | Banco origen (ej: 0172 = Bancamiga) |
| NroReferenciaCorto | Referencia corta |
| NroReferencia | Referencia completa |
| HoraMovimiento | Hora del movimiento |
| FechaMovimiento | Fecha del movimiento |
| Descripcion | Descripción del pago |
| Status | Estado (500 = procesado) |
| Refpk | Referencia primaria única |
| Ref | Número de referencia |

**Códigos de respuesta:**

| Código | Mensaje |
|--------|---------|
| 200 | Respuesta exitosa |
| 511 | Error formato |
| 551 | Error formato Bank |
| 552 | Error formato Phone |
| 553 | Error formato Date |
| 503 | Error token no autorizado o expirado |

---

#### F. POST - FIND PAYMENT MOBILE HISTORY (Historial de pagos)

**Descripción:** Busca TODOS los pagos móvil recibidos en la cuenta bancaria de una fecha específica. **Máximo 1 vez cada 10 minutos.**

**Endpoint:** `{{HOST}}/public/protected/pm/history/find`

**Método:** POST

**Headers requeridos:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json
```

**Request (ejemplo):**
```bash
curl --location --request POST '{{HOST}}/public/protected/pm/history/find' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {{ACCESS_TOKEN}}' \
--data-raw '{
    "Date":"2025-05-08"
}'
```

**Response (éxito):**
```json
{
    "code": 200,
    "lista": [
        {
            "ID": "b6639593-7623-41c1-b1e0-4b041a64018f",
            "created_at": "2025-05-08T10:12:02.594289-04:00",
            "update_at": "2025-05-08T10:12:03.358268-04:00",
            "deleted_at": null,
            "Dni": "J40724274",
            "PhoneDest": "584240000000",
            "PhoneOrig": "584240000000",
            "Amount": 5.12,
            "BancoOrig": "0172",
            "NroReferenciaCorto": "575202",
            "NroReferencia": "000000575202",
            "HoraMovimiento": "10:12:02",
            "FechaMovimiento": "2025-05-08",
            "Descripcion": "pago",
            "Status": "500",
            "Refpk": "202505080172584240000000575202",
            "Ref": 29211968
        }
    ],
    "mod": "find",
    "num": 1
}
```

**Códigos de respuesta:**

| Código | Mensaje |
|--------|---------|
| 200 | Respuesta exitosa |
| 511 | Error formato |
| 553 | Error formato Date |

---

#### G. POST - WEBHOOK PAYMENT MOBILE (Notificaciones automáticas)

**Descripción:** Bancamiga te envía notificaciones automáticas cada vez que se recibe un pago móvil en tu cuenta. Debes proporcionar un endpoint tuyo.

**Headers que Bancamiga enviará a tu endpoint:**
```
Authorization: Bearer {{TU_TOKEN_PERSONALIZADO}}
Content-Type: application/json
```

**Body que recibirás en tu endpoint:**
```json
{
    "BancoOrig": "0172",
    "FechaMovimiento": "2025-05-08",
    "HoraMovimiento": "16:02:49",
    "NroReferencia": "018219",
    "PhoneOrig": "584240000000",
    "PhoneDest": "584240000000",
    "Status": "000",
    "Descripcion": "pago",
    "Amount": "5.64",
    "Refpk": "202505080172584240000000018219"
}
```

**Respuesta que debes enviar (OBLIGATORIA):**
```json
{
    "Code": 200,
    "Refpk": "202505080172584240000000018219"
}
```

**Importante:** 
- Debes responder con HTTP 200
- Content-Type debe ser application/json
- Si no respondes, se marcará como no entregado
- Reintentará el envío

---

## 🚀 GUÍA PASO A PASO: CONFIGURACIÓN PARA MI PANA APP

### FASE 1: PREPARACIÓN INICIAL

#### Paso 1: Validar que tienes todo en orden

**Checklist:**
- [ ] Tienes cuenta jurídica en Bancamiga (Activa)
- [ ] RIF: J-40724274-1 (Confirmado)
- [ ] Teléfono asociado: 0414-5274111
- [ ] Cuenta bancaria receptora: 0172-0251-18-2518546169
- [ ] Correos: ceocanalnext@gmail.com y pagos@mipana.app
- [ ] IP pública: 35.202.142.88 (Agregada a lista blanca por Bancamiga)
- [ ] Tienes acceso a terminal/servidor (SSH, Putty, etc.)
- [ ] Tienes acceso a Postman o similar para testing

#### Paso 2: Guardar tu información de Bancamiga

Bancamiga te habrá enviado por correo:
- **HOST:** (pregunta a Bancamiga si no lo tienes: probablemente algo como `https://adminp2p.sitca-ve.com`)
- **Nombre de usuario (DNI):** J40724274
- **Contraseña temporal:** (la que recibiste por correo)
- **Token inicial Bearer:** (el que recibiste por correo)

Ejemplo de cómo se vería:
```
HOST: https://adminp2p.sitca-ve.com
DNI: J40724274
Contraseña Temporal: AN#LklI#*r1
Token Initial Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.tCe4aaOapv43ni5K1KfR9qPLajYl0_dxwYQlF9KEwOg
```

---

### FASE 2: CONFIGURACIÓN DE CREDENCIALES (Manual en Terminal)

**⚠️ IMPORTANTE:** Estos pasos se deben hacer MANUALMENTE en la terminal del servidor, NO con código automatizado.

#### Paso 3: Verificar conectividad con Bancamiga

**En tu terminal, ejecuta:**

```bash
curl -k https://adminp2p.sitca-ve.com/healthcheck
```

**Respuesta esperada:**
```json
{
    "code": 200,
    "time": "2025-05-08T15:47:36.951226361-04:00"
}
```

Si funciona, continuamos. Si no funciona, verifica:
- La IP 35.202.142.88 esté agregada a lista blanca en Bancamiga
- El HOST sea correcto
- Tengas conexión a internet

#### Paso 4: Actualizar tu contraseña temporal

**En tu terminal, reemplazando las variables con tus datos:**

```bash
curl -k --location --request POST 'https://adminp2p.sitca-ve.com/public/auth/security/users/password/new' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.tCe4aaOapv43ni5K1KfR9qPLajYl0_dxwYQlF9KEwOg' \
--header 'Content-Type: application/json' \
--data-raw '{
    "Dni":"J40724274",
    "Pass":"AN#LklI#*r1",
    "PassNew":"MiPana@Bancamiga#2025!Segura"
}'
```

**Reemplaza:**
- `Authorization Bearer`: Con el token inicial que recibiste
- `Pass`: Con tu contraseña temporal
- `PassNew`: Con una contraseña nueva SEGURA (mayor de 8 caracteres, mayúsculas, minúsculas, números, símbolos)

**Respuesta esperada:**
```json
{
    "code": 200,
    "mensaje": "Contrasena Actualizada",
    "mod": "users"
}
```

✅ **Guarda tu nueva contraseña en un lugar seguro**

#### Paso 5: Generar tokens de acceso (ACCESS TOKEN y REFRESH TOKEN)

**En tu terminal:**

```bash
curl -k --location --request POST 'https://adminp2p.sitca-ve.com/public/auth/security/users/token' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.tCe4aaOapv43ni5K1KfR9qPLajYl0_dxwYQlF9KEwOg' \
--header 'Content-Type: application/json' \
--data-raw '{
    "Dni": "J40724274",
    "Pass": "MiPana@Bancamiga#2025!Segura"
}'
```

**Respuesta esperada:**
```json
{
    "code": 200,
    "expireDate": 1778246388,
    "mensaje": "Token generado exitosamente",
    "mod": "users",
    "refresToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.REFRESH_TOKEN_LARGO",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.ACCESS_TOKEN_LARGO"
}
```

**✅ GUARDA EN UN LUGAR SEGURO:**
- `token` → Este es tu **ACCESS_TOKEN** (válido por 1 año)
- `refresToken` → Este es tu **REFRESH_TOKEN**
- `expireDate` → Timestamp de expiración (1778246388)

---

### FASE 3: IMPLEMENTACIÓN EN MI PANA APP

#### Paso 6: Crear archivo de configuración segura

Crea un archivo `.env` en tu servidor (NUNCA en GitHub):

```bash
# .env
BANCAMIGA_HOST=https://adminp2p.sitca-ve.com
BANCAMIGA_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.ACCESS_TOKEN_LARGO
BANCAMIGA_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.REFRESH_TOKEN_LARGO
BANCAMIGA_TOKEN_EXPIRES=1778246388
BANCAMIGA_DNI=J40724274
BANCAMIGA_ACCOUNT=0172-0251-18-2518546169
BANCAMIGA_PHONE=584145274111
```

#### Paso 7: Crear módulo de integración con Bancamiga

**Archivo: `src/services/bancamiga.service.js`**

```javascript
// bancamiga.service.js
const axios = require('axios');

class BancamigaService {
  constructor() {
    this.host = process.env.BANCAMIGA_HOST;
    this.accessToken = process.env.BANCAMIGA_ACCESS_TOKEN;
    this.refreshToken = process.env.BANCAMIGA_REFRESH_TOKEN;
    this.tokenExpires = process.env.BANCAMIGA_TOKEN_EXPIRES;
    this.dni = process.env.BANCAMIGA_DNI;
  }

  // Verificar salud del servicio
  async healthCheck() {
    try {
      const response = await axios.get(`${this.host}/healthcheck`, {
        httpsAgent: { rejectUnauthorized: false } // Saltar verificación SSL
      });
      return response.data;
    } catch (error) {
      console.error('Error en healthcheck:', error.message);
      throw error;
    }
  }

  // Renovar tokens (llamar 1 mes antes de expiración)
  async refreshTokens() {
    try {
      const response = await axios.post(
        `${this.host}/public/re/refresh`,
        {
          refresh_token: this.refreshToken
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: { rejectUnauthorized: false }
        }
      );

      if (response.data.code === 200) {
        // Actualizar tokens en variables de entorno o BD
        this.accessToken = response.data.token;
        this.refreshToken = response.data.refresToken;
        this.tokenExpires = response.data.expireDate;
        
        console.log('✅ Tokens renovados exitosamente');
        return {
          accessToken: response.data.token,
          refreshToken: response.data.refresToken,
          expiresAt: response.data.expireDate
        };
      }
    } catch (error) {
      console.error('Error renovando tokens:', error.message);
      throw error;
    }
  }

  // Buscar pagos móvil (FUNCIÓN MÁS IMPORTANTE)
  async findPaymentMobile(phoneOrig, bankOrig, date) {
    try {
      const response = await axios.post(
        `${this.host}/public/protected/pm/find`,
        {
          Phone: phoneOrig,
          Bank: bankOrig,
          Date: date
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: { rejectUnauthorized: false }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error buscando pagos móvil:', error.message);
      throw error;
    }
  }

  // Buscar historial de pagos de la cuenta (máximo 1 vez cada 10 minutos)
  async findPaymentHistory(date) {
    try {
      const response = await axios.post(
        `${this.host}/public/protected/pm/history/find`,
        {
          Date: date
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: { rejectUnauthorized: false }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error buscando historial de pagos:', error.message);
      throw error;
    }
  }

  // Validar si token está próximo a expirar
  isTokenExpiringSoon(daysBeforeExpire = 30) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.tokenExpires - now;
    const secondsInDays = daysBeforeExpire * 24 * 60 * 60;
    
    return expiresIn < secondsInDays;
  }
}

module.exports = new BancamigaService();
```

#### Paso 8: Crear endpoint para conciliación de pagos en Mi Pana App

**Archivo: `src/routes/payments.routes.js`**

```javascript
// payments.routes.js
const express = require('express');
const router = express.Router();
const bancamiga = require('../services/bancamiga.service');

// Endpoint para buscar pagos de una fecha específica
router.post('/reconcile-date', async (req, res) => {
  try {
    const { date } = req.body; // Formato: YYYY-MM-DD
    
    if (!date) {
      return res.status(400).json({ error: 'Date es requerida (YYYY-MM-DD)' });
    }

    const result = await bancamiga.findPaymentHistory(date);
    
    if (result.code === 200) {
      res.json({
        success: true,
        totalPayments: result.num,
        payments: result.lista,
        message: `Se encontraron ${result.num} pagos`
      });
    } else {
      res.status(400).json({ error: result.mensaje || 'Error en la búsqueda' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para buscar pagos por teléfono, banco y fecha
router.post('/reconcile-specific', async (req, res) => {
  try {
    const { phoneOrig, bankOrig, date } = req.body;
    
    if (!phoneOrig || !bankOrig || !date) {
      return res.status(400).json({ 
        error: 'phoneOrig, bankOrig y date son requeridas' 
      });
    }

    const result = await bancamiga.findPaymentMobile(phoneOrig, bankOrig, date);
    
    if (result.code === 200) {
      res.json({
        success: true,
        totalPayments: result.num,
        payments: result.lista,
        message: `Se encontraron ${result.num} pagos`
      });
    } else {
      res.status(400).json({ error: result.mensaje || 'Error en la búsqueda' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para recibir notificaciones de pagos (WEBHOOK)
router.post('/webhook', async (req, res) => {
  try {
    const { 
      BancoOrig, 
      FechaMovimiento, 
      HoraMovimiento, 
      NroReferencia, 
      PhoneOrig, 
      PhoneDest, 
      Status, 
      Descripcion, 
      Amount, 
      Refpk 
    } = req.body;

    console.log('📲 Webhook recibido:', {
      monto: Amount,
      referencia: NroReferencia,
      fecha: FechaMovimiento,
      hora: HoraMovimiento
    });

    // Aquí puedes:
    // 1. Guardar el pago en tu BD
    // 2. Actualizar el estado de una orden
    // 3. Enviar notificación al usuario
    // 4. Procesar la lógica de negocio

    // Respuesta OBLIGATORIA para Bancamiga
    res.json({
      Code: 200,
      Refpk: Refpk
    });

  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ Code: 500, error: error.message });
  }
});

module.exports = router;
```

#### Paso 9: Configurar webhook en tu aplicación

**Crear endpoint para recibir notificaciones:**

En tu servidor, necesitas:
1. Un endpoint HTTPS (con certificado válido)
2. Un token personalizado para validar que es Bancamiga quien envía

**Ejemplo de endpoint:**
```
https://v1.mipana.app/api/payments/webhook
```

**Enviar a Bancamiga:**
- **Endpoint:** https://v1.mipana.app/api/payments/webhook
- **Token personalizado:** TuTokenSeguro123!@#$%

#### Paso 10: Tareas programadas para renovación de tokens

**Archivo: `src/jobs/token-refresh.job.js`**

```javascript
// token-refresh.job.js
const cron = require('node-cron');
const bancamiga = require('../services/bancamiga.service');

// Ejecutar cada día a las 3:00 AM para verificar si necesita renovación
cron.schedule('0 3 * * *', async () => {
  try {
    console.log('🔄 Verificando expiración de tokens Bancamiga...');
    
    if (bancamiga.isTokenExpiringSoon(30)) {
      console.log('⚠️ Token expirará en menos de 30 días, renovando...');
      await bancamiga.refreshTokens();
    } else {
      console.log('✅ Tokens aún válidos');
    }
  } catch (error) {
    console.error('❌ Error en renovación de tokens:', error.message);
  }
});
```

---

### FASE 4: PRUEBAS Y VALIDACIÓN

#### Paso 11: Test de conectividad

**Ejecuta en tu terminal:**

```bash
# Test 1: Verificar salud del servicio
curl -k https://adminp2p.sitca-ve.com/healthcheck

# Test 2: Con Access Token (reemplazar con tu token)
curl -k --location --request POST 'https://adminp2p.sitca-ve.com/public/protected/pm/find' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer TU_ACCESS_TOKEN_AQUI' \
--data-raw '{
    "Phone":"584145274111",
    "Bank":"0172",
    "Date":"2025-05-08"
}'
```

#### Paso 12: Test de endpoints en tu app

**Test 1: Buscar pagos por fecha**
```bash
curl -X POST http://localhost:3000/api/payments/reconcile-date \
-H "Content-Type: application/json" \
-d '{
  "date": "2025-05-08"
}'
```

**Test 2: Buscar pagos específicos**
```bash
curl -X POST http://localhost:3000/api/payments/reconcile-specific \
-H "Content-Type: application/json" \
-d '{
  "phoneOrig": "584145274111",
  "bankOrig": "0172",
  "date": "2025-05-08"
}'
```

---

### FASE 5: SEGURIDAD Y MANTENIMIENTO

#### Paso 13: Checklist de seguridad

- [ ] Nunca commitear tokens en GitHub
- [ ] Usar `.env` para credenciales
- [ ] Usar `.gitignore` para archivos de configuración
- [ ] Cambiar contraseña cada 6 meses
- [ ] Renovar tokens automáticamente (1 mes antes de expirar)
- [ ] Usar HTTPS en todos los endpoints
- [ ] Validar el header Authorization en el webhook
- [ ] Loguear todos los pagos recibidos
- [ ] Hacer backup de tokens (encriptados)

#### Paso 14: Monitoreo continuo

**Crear dashboard de monitoreo:**
- Estado de conexión con Bancamiga
- Última conciliación exitosa
- Próxima fecha de renovación de tokens
- Cantidad de pagos recibidos hoy
- Errores recientes

---

## 📊 TABLA RÁPIDA: CÓDIGOS DE BANCO

| Código | Banco |
|--------|-------|
| 0172 | Bancamiga |
| 0104 | Banco de Venezuela |
| 0102 | Banco Agrícola |
| 0106 | Banesco |
| 0134 | Banco del Tesoro |
| 0137 | Banco Exterior |
| 0191 | Banco Actinver |

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Cuánto tiempo es válido mi ACCESS_TOKEN?**
R: 1 año. Debes renovarlo con REFRESH_TOKEN mínimo 1 mes antes.

**P: ¿Qué hago si mi token expira?**
R: Usa POST - REFRESH TOKEN para generar nuevos tokens.

**P: ¿Por qué me da error SSL?**
R: Porque usas VPN o hay interferencia de red. Usa flag `-k` en curl o desactiva verificación SSL en tu código.

**P: ¿Puedo llamar FIND PAYMENT HISTORY más de 1 vez cada 10 minutos?**
R: NO. Bancamiga lo bloqueará si lo haces frecuentemente.

**P: ¿Cuál es la diferencia entre FIND PAYMENT MOBILE y FIND PAYMENT MOBILE HISTORY?**
R: FIND PAYMENT MOBILE busca por teléfono/banco/fecha específicos. HISTORY busca TODOS los pagos de una fecha en toda tu cuenta.

**P: ¿Qué es el WEBHOOK?**
R: Es una notificación automática que Bancamiga te envía cada vez que recibe un pago móvil. Debes tener un endpoint listo para recibirla.

---

## 🔗 REFERENCIA RÁPIDA DE ENDPOINTS

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/healthcheck` | Verificar estado |
| POST | `/public/auth/security/users/password/new` | Cambiar contraseña |
| POST | `/public/auth/security/users/token` | Generar tokens |
| POST | `/public/re/refresh` | Renovar tokens |
| POST | `/public/protected/pm/find` | Buscar pagos específicos |
| POST | `/public/protected/pm/history/find` | Historial de pagos |
| POST | `(Tu endpoint)` | Recibir webhook |

---

## 📞 PRÓXIMOS PASOS

1. **Confirmar HOST con Bancamiga** (probablemente https://adminp2p.sitca-ve.com)
2. **Ejecutar el comando curl de verificación** que Bancamiga te pidió
3. **Completar FASE 1 y 2** de esta guía (manual en terminal)
4. **Implementar FASE 3** en tu código
5. **Hacer testing completo** en ambiente de staging
6. **Ir a producción** cuando todo funcione

---

**Creado:** 2025-12-03  
**Versión:** 1.0  
**Para:** Mi Pana App  
**RIF:** J-40724274-1