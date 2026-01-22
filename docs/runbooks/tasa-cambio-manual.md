# Actualización Manual de Tasa de Cambio

**Propósito**: Mantener la paridad cambiaria (BCV) cuando la automatización falla.

## Síntomas de Malla

- La tasa en la App no coincide con la tasa oficial del BCV.
- Errores en los logs del cron job o función `exchange-rate-sync`.
- Alertas de monitoreo sobre "Tasa desactualizada".

## Procedimiento Manual

1.  **Obtener Tasa Oficial**: Consultar [bcv.org.ve](http://www.bcv.org.ve/) para obtener el valor actual del USD.

2.  **Acceder a la Base de Datos**: Entrar al Dashboard de Supabase -> Table Editor -> `config` (o tabla pertinente).
3.  **Actualizar Valor**:
    - Localizar la fila correspondiente a `exchange_rate` o `tasa_bcv`.
    - Editar el valor con la tasa vigente.
    - Guardar cambios.
4.  **Verificar**:
    - Entrar a la App como usuario.
    - Simular una operación que use la tasa (ej. calculadora de recarga) y verificar que el cálculo sea correcto.

## Restablecer Automatización

- Una vez resuelta la emergencia manual, notificar al equipo de desarrollo para que revisen el servicio de sincronización automática.
- No dejar el sistema en modo manual indefinidamente.
