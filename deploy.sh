#!/bin/bash

# MI PANA APP 3.0 - Deployment Script

echo "🚀 Iniciando despliegue a Supabase..."

# 1. Login (Skipped - Assumed already logged in via Token)
# echo "🔑 Verificando sesión..."
# npx supabase login

# 2. Database Push
echo "🗄️  Sincronizando base de datos..."
npx supabase db push

# 3. Functions Deploy
echo "⚡ Desplegando Edge Functions..."
npx supabase functions deploy request-ride
npx supabase functions deploy calculate-fare
npx supabase functions deploy process-payment
npx supabase functions deploy update-ride-status

echo "✅ ¡Despliegue completado con éxito!"
