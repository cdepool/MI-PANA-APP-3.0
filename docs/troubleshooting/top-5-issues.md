# Top 5 Troubleshooting Issues

Guía rápida de los problemas más frecuentes y sus soluciones en MI PANA APP 3.0.

## 1. E2E Timeout / Tests Fallando
- **Síntoma**: Los tests de Playwright fallan con timeout esperando selectores.
- **Causa**: La aplicación en modo test (`NODE_ENV=test`) a veces no hidrata la sesión de usuario simulada correctamente o la base de datos de prueba está sucia.
- **Fix**:
  - Asegurar reiniciar la DB de prueba antes de la suite.
  - Aumentar el timeout en `playwright.config.ts` si la red es lenta.

## 2. Variables de Entorno Desalineadas
- **Síntoma**: Funcionalidad "X" funciona en local pero falla en Vercel Prod.
- **Causa**: Variable de entorno faltante en Vercel o con nombre incorrecto (ej. falta prefijo `VITE_` para variables públicas).
- **Fix**:
  - Auditar `Settings > Environment Variables` en Vercel.
  - Asegurar que variables cliente empiecen y solo empiecen con `VITE_`.

## 3. Edge Function "Module Not Found"
- **Síntoma**: Error 500 al llamar a una Edge Function. Log dice "Cannot find module...".
- **Causa**: Importación de librerías no soportadas en Edge Runtime (ej. librerías nativas de Node que dependen de `fs` o `net` no estándar).
- **Fix**:
  - Usar polyfills o alternativas compatibles con Edge.
  - Mover la lógica compleja a una función serverless estándar (Node.js runtime) si es necesario.

## 4. RLS Bloqueando Lecturas
- **Síntoma**: La UI muestra listas vacías o spinners infinitos, pero la DB tiene datos.
- **Causa**: Políticas Row Level Security (RLS) mal configuradas que deniegan acceso `SELECT` al rol `authenticated`.
- **Fix**:
  - Revisar policies en Supabase Dashboard > Authentication > Policies.
  - Usar la herramienta "Policy Tester" en el dashboard.

## 5. Wallet Balance "Null"
- **Síntoma**: La UI crashea o muestra "NaN" en el saldo.
- **Causa**: Usuario nuevo sin registro en tabla `wallets`. El frontend no maneja el caso de "sin wallet".
- **Fix**:
  - El trigger de creación de usuario debe asegurar crear la wallet.
  - El frontend debe tener `fallback` (ej. `balance || 0`) y no asumir que siempre existe el objeto.
