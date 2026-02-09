# Troubleshooting: Top 5 Problemas Comunes

## 1. Timeout en E2E / Error 500 en Auth
- **Síntoma**: Tests fallan esperando selectores. Logs muestran error de sesión.
- **Causa**: Token JWT expirado o falta de hidratación de sesión en tests.
- **Solución**: Verificar que `setup` de tests (Playwright) esté logueando correctamente y guardando el estado (`auth.json`).

## 2. Variables de Entorno Desincronizadas
- **Síntoma**: Funciona en local, falla en Vercel.
- **Causa**: Se agregó una variable nueva en `.env.local` pero no se agregó al Dashboard de Vercel.
- **Solución**: Ir a Vercel > Settings > Environment Variables y agregar la faltante.

## 3. "Permission denied" (RLS)
- **Síntoma**: Query retorna arreglo vacío `[]` o error 403.
- **Causa**: Políticas Row Level Security (RLS) no permiten la lectura.
- **Solución**: Revisar política en SQL (`supabase/migrations`).
  - *Debug*: Usar el "Policy Tester" en el Dashboard de Supabase.

## 4. Wallet no carga (Spinner infinito)
- **Síntoma**: Pantalla de billetera se queda cargando.
- **Causa**: La función `wallet-get-balance` falló o retornó formato inesperado.
- **Solución**: Revisar logs de Edge Function. Verificar si Bancamiga está respondiendo lento.

## 5. Google Maps "Development Purpose Only"
- **Síntoma**: Mapa con marca de agua y oscurecido.
- **Causa**: API Key inválida, cuota excedida o restricciones de referer incorrectas.
- **Solución**: Verificar consola de Google Cloud Console > Billing / Quotas. Asegurar que `localhost` o el dominio de Vercel esté en la lista permitida.
