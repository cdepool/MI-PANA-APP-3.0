# Runbook: Gestión de Usuarios y Soporte

**Audiencia**: Equipo de Soporte Nivel 1 y 2

## 1. Verificación de Usuario
- **Herramienta**: Dashboard Administrativo (`/admin/users`).
- **Qué revisar**:
  - Estado: `Activo` vs `Bloqueado`.
  - Rol: `Passenger` o `Driver`.
  - Wallet: ¿Saldo positivo? ¿Transacciones recientes?

## 2. Casos Comunes

### A. "No puedo iniciar sesión"
1. Verificar que el número de teléfono sea correcto (formato internacional +58...).
2. ¿Recibe el SMS?
   - **NO**: Problema de proveedor SMS (Twilio/Supabase). Escalar a Tecnología.
   - **SÍ, pero da error**: Verificar si el usuario está bloqueado manualmente.

### B. "Mi recarga no aparece"
1. Pedir Referencia Bancaria.
2. Buscar en Dashboard > Transacciones usando la referencia.
   - **Encontrada (Pending)**: El sistema está esperando confirmación del banco.
   - **No encontrada**: El usuario quizás no completó el flujo o puso mal la referencia.
3. Seguir protocolo de "Incidente de Pagos" si el dinero salió de su banco.

### C. "Quiero ser conductor"
1. El usuario debe registrarse como pasajero primero.
2. Solicitar documentación (Licencia, Certificado Médico, Datos Vehículo).
3. Un Admin debe cambiar el rol a `Driver` y registrar el vehículo en el Dashboard.

## 3. Seguridad
- **NUNCA pedir**: Contraseñas, códigos de verificación SMS (OTP), datos de tarjeta completos.
- **Validación de Identidad**: Antes de cambios sensibles (email, teléfono), verificar identidad llamando al número registrado.
