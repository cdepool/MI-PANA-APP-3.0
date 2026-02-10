# MI PANA APP 3.0

MI PANA APP 3.0 es una plataforma integral de servicios de transporte y logística, diseñada para ofrecer una experiencia de usuario fluida y segura. Esta aplicación, construida con tecnologías modernas, gestiona viajes, pagos y usuarios a través de una arquitectura robusta y escalable.

## Requisitos

- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- **Supabase CLI**: (Opcional, para gestión local de base de datos)
- **Docker**: Requerido para operaciones de base de datos locales con Supabase CLI.

## Instalación

1.  Clonar el repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd mi-pana-app-3.0
    ```

2.  Instalar dependencias:
    ```bash
    npm install
    ```

3.  Configurar variables de entorno:
    - Copiar el archivo de ejemplo (si existe) o crear `.env.local`.
    - Definir las variables necesarias.

## Variables de Entorno

| Nombre | Propósito | Configuración | Ejemplo |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Local / Vercel | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Llave pública anónima de Supabase | Local / Vercel | `eyJhbGci...` |

> [!IMPORTANT]
> **Nunca** exponer variables privadas o `service_role_key` en el cliente. Las operaciones sensibles deben manejarse exclusivamente a través de Edge Functions.

## Comandos Disponibles

- **Desarrollo**:
  ```bash
  npm run dev
  ```
  Inicia el servidor de desarrollo local en `http://localhost:5173`.

- **Build**:
  ```bash
  npm run build
  ```
  Compila la aplicación para producción.

- **Preview**:
  ```bash
  npm run preview
  ```
  Previsualiza el build de producción localmente.

## Deployment

El despliegue se gestiona a través de **Vercel**.

1.  **Preview**: Cada Push a una rama (excepto `main`) genera un deploy de previsualización.
2.  **Producción**: Un Merge a `main` dispara el despliegue a producción.

- [ ] Build exitoso localmente.
- [ ] Verificación de variables de entorno en Vercel.

### Despliegue de Edge Functions (Supabase)

Las funciones críticas de negocio (Pagos, Billetera) residen en Supabase Edge Functions. Para desplegarlas o actualizarlas:

1.  Asegúrate de tener la CLI de Supabase instalada y logueada (`supabase login`).
2.  Despliega las funciones individuales:
    ```bash
    supabase functions deploy wallet-get-balance --no-verify-jwt
    supabase functions deploy wallet-recharge --no-verify-jwt
    supabase functions deploy exchange-rate-sync --no-verify-jwt
    ```
    *(Nota: `--no-verify-jwt` se usa si la función maneja su propia validación o es pública/webhook. Revisa `config.toml` para detalles específicos de cada función).*

3.  Configura las variables de entorno (secrets) en Supabase:
    ```bash
    supabase secrets set --env-file .env.local
    ```

## Documentación Adicional

*   **[Guía de Usuario: Billetera](./USER_GUIDE_WALLET.md)**: Manual para el usuario final.
*   **[Arquitectura de Pagos](./PAYMENT_ARCHITECTURE.md)**: Detalles técnicos sobre el flujo de dinero y base de datos.
*   **[Reporte de Testing (Step 4)](./TESTING_REPORT_STEP4.md)**: Resultados de auditoría de calidad.
*   **[Reporte de Optimización (Step 5)](./OPTIMIZATION_REPORT_STEP5.md)**: Mejoras de rendimiento implementadas.

## Arquitectura

El flujo de datos sigue un modelo seguro y eficiente:

```text
[Vite UI] -> [Supabase Auth] -> Gestión de Sesión/JWT
[Vite UI] -> [Edge Functions] -> Lógica de Negocio Crítica (Pagos, Recargas, Validaciones)
[Edge Functions] -> [Base de Datos] -> Transacciones Seguras y Datos Privados
[Base de Datos] -> [Vite UI] -> Lectura de Datos (Protegida por RLS)
```

**Principios de Seguridad:**
- "El dinero siempre se mueve por Edge Functions".
- Row Level Security (RLS) es la primera línea de defensa para los datos.
- Las claves administrativas nunca salen del entorno seguro del servidor.
