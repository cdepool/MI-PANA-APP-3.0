# Gestión de Usuarios y Soporte

**Audiencia**: Equipo de Soporte / Admin

## Verificación de Usuario

Pasos para diagnosticar problemas comunes de cuentas:

1.  **Buscar Usuario**: Usar email o teléfono en el Panel Administrativo.
2.  **Verificar Estado**:
    - ¿Email confirmado?
    - ¿Cuenta bloqueada?
    - ¿Rol asignado correcto (Pasajero/Conductor/Admin)?

## Casos Comunes

### "No puedo iniciar sesión"
1.  Verificar si el usuario existe.
2.  Confirmar si ha validado su email (si aplica).
3.  Sugerir restablecimiento de contraseña.

### "No me aparece mi saldo/wallet"
1.  Verificar que el usuario tenga una wallet creada en la base de datos.
2.  Revisar logs de errores recientes asociados al `user_id`.
3.  Escalar a ingeniería si la wallet no existe.

### "Mi recarga no se reflejó"
**Datos a solicitar:**
- Referencia bancaria completa.
- Fecha y hora exacta del pago.
- Monto exacto.
- Banco de origen.

**Datos a NO solicitar:**
- Contraseñas.
- Tokens de sesión.
- Fotos de tarjetas de crédito/débito.

## Desbloqueo de Perfil

Si un perfil está bloqueado por seguridad:
1.  Validar identidad del usuario (según protocolo de seguridad interno).
2.  Acceder al panel de administración.
3.  Cambiar estado de `blocked` a `active`.
4.  Registrar la razón del desbloqueo en las notas del usuario.
