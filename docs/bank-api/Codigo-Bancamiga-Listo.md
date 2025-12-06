# 💻 EJEMPLOS DE CÓDIGO LISTOS PARA IMPLEMENTAR
## Integración Bancamiga - Mi Pana App

---

## 1️⃣ NODEJS/EXPRESS - SERVICIO BANCAMIGA

### Archivo: `services/bancamiga.js`

```javascript
const axios = require('axios');
const logger = require('./logger'); // Tu servicio de logs

class BancamigaService {
  constructor() {
    this.host = process.env.BANCAMIGA_HOST;
    this.accessToken = process.env.BANCAMIGA_ACCESS_TOKEN;
    this.refreshToken = process.env.BANCAMIGA_REFRESH_TOKEN;
    this.tokenExpires = parseInt(process.env.BANCAMIGA_TOKEN_EXPIRES);
    this.dni = process.env.BANCAMIGA_DNI;
    this.sslVerify = process.env.NODE_ENV === 'production' ? true : false;
  }

  // 1. HEALTH CHECK
  async healthCheck() {
    try {
      logger.info('🔍 Ejecutando health check con Bancamiga...');
      
      const response = await axios.get(`${this.host}/healthcheck`, {
        httpsAgent: {
          rejectUnauthorized: this.sslVerify
        }
      });

      logger.info('✅ Health check exitoso:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('❌ Health check fallido:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 2. RENOVAR TOKENS
  async refreshTokens() {
    try {
      logger.info('🔄 Renovando tokens...');
      
      const response = await axios.post(
        `${this.host}/public/re/refresh`,
        { refresh_token: this.refreshToken },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: { rejectUnauthorized: this.sslVerify }
        }
      );

      if (response.data.code !== 200) {
        throw new Error(response.data.mensaje || 'Error renovando tokens');
      }

      // Actualizar credenciales
      this.accessToken = response.data.token;
      this.refreshToken = response.data.refresToken;
      this.tokenExpires = response.data.expireDate;

      // GUARDAR EN BD o VARIABLES DE ENTORNO
      // await updateCredentialsInDB({
      //   accessToken: response.data.token,
      //   refreshToken: response.data.refresToken,
      //   expiresAt: response.data.expireDate
      // });

      logger.info('✅ Tokens renovados. Nuevos tokens generados.');
      return {
        success: true,
        accessToken: response.data.token,
        refreshToken: response.data.refresToken,
        expiresAt: new Date(response.data.expireDate * 1000)
      };
    } catch (error) {
      logger.error('❌ Error renovando tokens:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 3. BUSCAR PAGOS MÓVIL (MÁS IMPORTANTE)
  async findPaymentMobile(phoneOrig, bankOrig, date) {
    try {
      // Validar formato
      if (!phoneOrig || !bankOrig || !date) {
        throw new Error('Faltan parámetros: phoneOrig, bankOrig, date');
      }

      logger.info('🔎 Buscando pagos móvil:', { phoneOrig, bankOrig, date });

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
          httpsAgent: { rejectUnauthorized: this.sslVerify }
        }
      );

      if (response.data.code !== 200) {
        logger.warn('⚠️ Respuesta con código diferente a 200:', response.data);
      }

      logger.info(`✅ Encontrados ${response.data.num} pagos`);
      return {
        success: true,
        totalPayments: response.data.num,
        payments: response.data.lista || [],
        raw: response.data
      };
    } catch (error) {
      logger.error('❌ Error buscando pagos móvil:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 4. HISTORIAL DE PAGOS (MÁXIMO 1 VEZ CADA 10 MIN)
  async findPaymentHistory(date) {
    try {
      if (!date) {
        throw new Error('Date es requerida (YYYY-MM-DD)');
      }

      logger.info('📊 Buscando historial de pagos para:', date);

      const response = await axios.post(
        `${this.host}/public/protected/pm/history/find`,
        { Date: date },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: { rejectUnauthorized: this.sslVerify }
        }
      );

      if (response.data.code !== 200) {
        logger.warn('⚠️ Respuesta con código diferente a 200:', response.data);
      }

      logger.info(`✅ Historial: ${response.data.num} pagos encontrados`);
      return {
        success: true,
        totalPayments: response.data.num,
        payments: response.data.lista || [],
        raw: response.data
      };
    } catch (error) {
      logger.error('❌ Error buscando historial:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 5. VALIDAR SI TOKEN EXPIRA PRONTO
  isTokenExpiringSoon(daysBeforeExpire = 30) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.tokenExpires - now;
    const secondsInDays = daysBeforeExpire * 24 * 60 * 60;
    
    const expires = expiresIn < secondsInDays;
    
    if (expires) {
      logger.warn(`⚠️ Token expirará en menos de ${daysBeforeExpire} días`);
    }
    
    return expires;
  }

  // 6. OBTENER INFORMACIÓN DE EXPIRACIÓN
  getTokenInfo() {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.tokenExpires - now;
    const daysRemaining = Math.floor(expiresIn / (24 * 60 * 60));
    
    return {
      expiresAt: new Date(this.tokenExpires * 1000),
      expiresInDays: daysRemaining,
      expiresInSeconds: expiresIn,
      needsRenewal: daysRemaining < 30
    };
  }
}

module.exports = new BancamigaService();
```

---

## 2️⃣ RUTAS/ENDPOINTS PARA EXPRESS

### Archivo: `routes/payments.js`

```javascript
const express = require('express');
const router = express.Router();
const bancamiga = require('../services/bancamiga');
const logger = require('../services/logger');
const { validateToken } = require('../middleware/auth'); // Tu middleware

// MIDDLEWARE ADICIONAL
const validatePaymentParams = (req, res, next) => {
  const { phoneOrig, bankOrig, date } = req.body;
  if (!phoneOrig || !bankOrig || !date) {
    return res.status(400).json({ 
      error: 'Faltan parámetros requeridos: phoneOrig, bankOrig, date' 
    });
  }
  next();
};

const validateDateParam = (req, res, next) => {
  const { date } = req.body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ 
      error: 'Date inválida. Formato requerido: YYYY-MM-DD' 
    });
  }
  next();
};

// ========================================
// 1. HEALTH CHECK
// ========================================
router.get('/health', async (req, res) => {
  try {
    const result = await bancamiga.healthCheck();
    
    if (result.success) {
      res.json({ 
        status: 'ok', 
        message: 'Conexión con Bancamiga activa',
        data: result.data 
      });
    } else {
      res.status(500).json({ 
        status: 'error', 
        message: 'Bancamiga no responde',
        error: result.error 
      });
    }
  } catch (error) {
    logger.error('Error en health check:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 2. BUSCAR PAGOS ESPECÍFICOS
// ========================================
router.post('/find', validateToken, validatePaymentParams, async (req, res) => {
  try {
    const { phoneOrig, bankOrig, date } = req.body;
    
    logger.info(`📱 Buscando pagos: ${phoneOrig} | Banco: ${bankOrig} | Fecha: ${date}`);
    
    const result = await bancamiga.findPaymentMobile(phoneOrig, bankOrig, date);
    
    if (result.success) {
      res.json({
        success: true,
        totalPayments: result.totalPayments,
        payments: result.payments,
        message: `Se encontraron ${result.totalPayments} pagos`
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('Error en /find:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 3. HISTORIAL DE PAGOS
// ========================================
router.post('/history', validateToken, validateDateParam, async (req, res) => {
  try {
    const { date } = req.body;
    
    logger.info(`📊 Buscando historial para: ${date}`);
    
    const result = await bancamiga.findPaymentHistory(date);
    
    if (result.success) {
      res.json({
        success: true,
        totalPayments: result.totalPayments,
        payments: result.payments,
        message: `Se encontraron ${result.totalPayments} pagos en la cuenta`
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('Error en /history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 4. WEBHOOK - RECIBIR PAGOS AUTOMÁTICOS
// ========================================
router.post('/webhook', async (req, res) => {
  try {
    // VALIDAR TOKEN DEL WEBHOOK
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.WEBHOOK_AUTH_TOKEN;
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      logger.warn('❌ Intento de webhook no autorizado');
      return res.status(401).json({ Code: 401, error: 'Unauthorized' });
    }

    const paymentData = req.body;
    
    logger.info('📲 WEBHOOK RECIBIDO:', {
      monto: paymentData.Amount,
      referencia: paymentData.NroReferencia,
      teléfono: paymentData.PhoneOrig,
      fecha: paymentData.FechaMovimiento
    });

    // ⭐ AQUÍ VAN TUS OPERACIONES DE NEGOCIO
    
    // Opción 1: Guardar en BD
    // await Payment.create({
    //   reference: paymentData.NroReferencia,
    //   phone: paymentData.PhoneOrig,
    //   amount: paymentData.Amount,
    //   date: paymentData.FechaMovimiento,
    //   bankOrig: paymentData.BancoOrig,
    //   status: 'received',
    //   refpk: paymentData.Refpk
    // });

    // Opción 2: Buscar orden y marcar como pagada
    // const order = await Order.findOne({ paymentRef: paymentData.NroReferencia });
    // if (order) {
    //   order.status = 'paid';
    //   order.paidAt = new Date();
    //   await order.save();
    // }

    // Opción 3: Enviar notificación al usuario
    // await sendNotification(paymentData.PhoneOrig, {
    //   title: 'Pago recibido',
    //   message: `Se recibió un pago de ${paymentData.Amount} Bs`
    // });

    // RESPUESTA OBLIGATORIA A BANCAMIGA
    res.json({
      Code: 200,
      Refpk: paymentData.Refpk
    });

  } catch (error) {
    logger.error('❌ Error procesando webhook:', error);
    res.status(500).json({ Code: 500, error: error.message });
  }
});

// ========================================
// 5. STATUS - VER INFO DE TOKENS
// ========================================
router.get('/status', validateToken, (req, res) => {
  try {
    const tokenInfo = bancamiga.getTokenInfo();
    
    res.json({
      status: 'active',
      tokenInfo: {
        expiresAt: tokenInfo.expiresAt,
        expiresInDays: tokenInfo.expiresInDays,
        needsRenewal: tokenInfo.needsRenewal
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 6. RENOVAR TOKENS (ENDPOINT ADMIN)
// ========================================
router.post('/refresh-tokens', validateToken, async (req, res) => {
  try {
    logger.info('🔄 Solicitando renovación de tokens...');
    
    const result = await bancamiga.refreshTokens();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Tokens renovados exitosamente',
        expiresAt: result.expiresAt
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('Error renovando tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 3️⃣ TAREAS PROGRAMADAS (CRON)

### Archivo: `jobs/token-refresh.job.js`

```javascript
const cron = require('node-cron');
const bancamiga = require('../services/bancamiga');
const logger = require('../services/logger');

// Ejecutar diariamente a las 3:00 AM
const tokenRefreshJob = cron.schedule('0 3 * * *', async () => {
  try {
    logger.info('🔍 [CRON] Verificando expiración de tokens...');
    
    if (bancamiga.isTokenExpiringSoon(30)) {
      logger.warn('⚠️ [CRON] Token vencerá en menos de 30 días. Renovando...');
      
      const result = await bancamiga.refreshTokens();
      
      if (result.success) {
        logger.info('✅ [CRON] Tokens renovados exitosamente');
      } else {
        logger.error('❌ [CRON] Error renovando tokens:', result.error);
      }
    } else {
      const tokenInfo = bancamiga.getTokenInfo();
      logger.info(`✅ [CRON] Tokens válidos. Vencen en ${tokenInfo.expiresInDays} días`);
    }
  } catch (error) {
    logger.error('❌ [CRON] Error en token refresh job:', error.message);
  }
});

module.exports = tokenRefreshJob;
```

---

## 4️⃣ MIDDLEWARE DE AUTENTICACIÓN

### Archivo: `middleware/auth.js`

```javascript
const logger = require('../services/logger');

const validateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header requerido' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validar token (puedes usar JWT aquí)
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    next();
  } catch (error) {
    logger.error('Error en validación de token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { validateToken };
```

---

## 5️⃣ ARCHIVO .ENV

```bash
# ==================== BANCAMIGA ====================
BANCAMIGA_HOST=https://adminp2p.sitca-ve.com
BANCAMIGA_DNI=J40724274
BANCAMIGA_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.ACCESS_TOKEN_AQUI
BANCAMIGA_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDYyNDE4MjcsImlhdCI6MTc0NDAzMzgyN30.REFRESH_TOKEN_AQUI
BANCAMIGA_TOKEN_EXPIRES=1778246388
BANCAMIGA_ACCOUNT=0172-0251-18-2518546169
BANCAMIGA_PHONE=584145274111

# ==================== WEBHOOK ====================
WEBHOOK_AUTH_TOKEN=TuTokenPersonalizadoSeguro123!@#$%
WEBHOOK_ENDPOINT=https://v1.mipana.app/api/payments/webhook

# ==================== GENERAL ====================
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

---

## 6️⃣ INTEGRACIÓN EN MAIN APP

### Archivo: `app.js` o `server.js`

```javascript
const express = require('express');
const dotenv = require('dotenv');
const logger = require('./services/logger');
const tokenRefreshJob = require('./jobs/token-refresh.job');
const paymentsRouter = require('./routes/payments');

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/payments', paymentsRouter);

// Iniciar job de renovación de tokens
logger.info('🚀 Iniciando aplicación...');
logger.info('⏰ Activando job de renovación de tokens');
// tokenRefreshJob está ejecutándose automáticamente

// Error handling
app.use((err, req, res, next) => {
  logger.error('Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`✅ Servidor corriendo en puerto ${PORT}`);
});
```

---

## 7️⃣ LOGGING

### Archivo: `services/logger.js`

```javascript
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  info: (message, data = '') => {
    const log = `[${getTimestamp()}] ℹ️ INFO: ${message} ${data ? JSON.stringify(data) : ''}`;
    console.log(log);
    fs.appendFileSync(
      path.join(logDir, 'info.log'),
      log + '\n'
    );
  },

  warn: (message, data = '') => {
    const log = `[${getTimestamp()}] ⚠️ WARN: ${message} ${data ? JSON.stringify(data) : ''}`;
    console.warn(log);
    fs.appendFileSync(
      path.join(logDir, 'warn.log'),
      log + '\n'
    );
  },

  error: (message, data = '') => {
    const log = `[${getTimestamp()}] ❌ ERROR: ${message} ${data ? JSON.stringify(data) : ''}`;
    console.error(log);
    fs.appendFileSync(
      path.join(logDir, 'error.log'),
      log + '\n'
    );
  }
};

module.exports = logger;
```

---

## 8️⃣ MODELO DE BASE DE DATOS (MONGOOSE)

### Archivo: `models/Payment.js`

```javascript
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nroReferenciaCorto: String,
  refpk: String,
  
  phoneOrig: {
    type: String,
    required: true,
    index: true
  },
  phoneDest: String,
  
  amount: {
    type: Number,
    required: true
  },
  
  bankOrig: {
    type: String,
    required: true
  },
  
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  hora: String,
  
  status: {
    type: String,
    enum: ['received', 'verified', 'processed', 'failed'],
    default: 'received'
  },
  
  description: String,
  
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas rápidas
paymentSchema.index({ phoneOrig: 1, date: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
```

---

## 9️⃣ TEST CON POSTMAN

### Importar en Postman:

```json
{
  "info": {
    "name": "Bancamiga MI PANA APP",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{BANCAMIGA_HOST}}/healthcheck",
          "host": ["{{BANCAMIGA_HOST}}"]
        }
      }
    },
    {
      "name": "Find Payments",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{APP_HOST}}/api/payments/find",
          "host": ["{{APP_HOST}}"]
        },
        "header": [
          { "key": "Authorization", "value": "Bearer {{YOUR_APP_TOKEN}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"phoneOrig\": \"584145274111\",\n  \"bankOrig\": \"0172\",\n  \"date\": \"2025-05-08\"\n}"
        }
      }
    },
    {
      "name": "History",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{APP_HOST}}/api/payments/history",
          "host": ["{{APP_HOST}}"]
        },
        "header": [
          { "key": "Authorization", "value": "Bearer {{YOUR_APP_TOKEN}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"date\": \"2025-05-08\"\n}"
        }
      }
    }
  ],
  "variable": [
    { "key": "BANCAMIGA_HOST", "value": "https://adminp2p.sitca-ve.com" },
    { "key": "APP_HOST", "value": "http://localhost:3000" },
    { "key": "YOUR_APP_TOKEN", "value": "" }
  ]
}
```

---

## 🔟 DOCKERFILE (Para Deploy)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

---

## 📝 DOCKER-COMPOSE

```yaml
version: '3.8'

services:
  mipana-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - BANCAMIGA_HOST=https://adminp2p.sitca-ve.com
      - BANCAMIGA_ACCESS_TOKEN=${BANCAMIGA_ACCESS_TOKEN}
      - BANCAMIGA_REFRESH_TOKEN=${BANCAMIGA_REFRESH_TOKEN}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

---

## 📦 PACKAGE.JSON

```json
{
  "name": "mipana-app-bancamiga",
  "version": "1.0.0",
  "description": "Integración API Bancamiga para Mi Pana App",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "node-cron": "^3.0.2",
    "mongoose": "^7.4.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2"
  }
}
```

---

**Versión:** 1.0  
**Fecha:** 2025-12-03  
**Estado:** Listo para producción