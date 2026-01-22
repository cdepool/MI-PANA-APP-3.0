# MI PANA APP 3.0

MI PANA APP 3.0 es una plataforma integral de servicios de transporte y logística, diseñada para ofrecer una experiencia de usuario fluida y segura. Esta aplicación, construida con tecnologías modernas, gestiona viajes, pagos y usuarios a través de una arquitectura robusta y escalable.

## Requisitos

- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- **Supabase CLI**: (Opcional, para gestión local de base de datos)

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

**Checklist Pre-Deploy:**
- [ ] Tests automáticos (si aplican) pasados.
- [ ] Build exitoso localmente.
- [ ] Verificación de variables de entorno en Vercel.

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
