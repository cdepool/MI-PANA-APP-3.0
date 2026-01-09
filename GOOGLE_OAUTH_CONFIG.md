# CONFIGURACIÓN OAUTH GOOGLE - MI PANA APP

## Contexto del Proyecto
- **App**: MI PANA APP (ride-hailing platform)
- **Proyecto Google Cloud**: modo-ia (ID: 174366307351)
- **Cliente OAuth**: MODO IA Web Local
- **Client ID**: 174366307351-5ofo1ia0ve9pegkod7nni0bqo4eajbtf.apps.googleusercontent.com
- **Deployment**: Vercel (https://mi-pana-app-3-0.vercel.app y v1.mipana.app)

## Error Común: 400 redirect_uri_mismatch

### Causa
Google bloquea el intento porque la URL de redirección no está en la lista blanca del cliente OAuth, incluso si los orígenes JavaScript ya están configurados.

### Solución Permanente

Siempre configurar AMBAS secciones en Google Cloud Console → Credenciales → Cliente OAuth:

#### 1. Orígenes JavaScript autorizados (Authorized JavaScript origins)
```
http://localhost:5173
https://mi-pana-app-3-0.vercel.app
https://v1.mipana.app
```

#### 2. URIs de redireccionamiento autorizados (Authorized redirect URIs)
```
http://localhost:5173
https://mi-pana-app-3-0.vercel.app
https://mi-pana-app-3-0.vercel.app/
https://v1.mipana.app
https://v1.mipana.app/
http://localhost:5173/
```

**Nota crítica**: Agregar versiones con y sin barra final (/), ya que Google es estricto con esto.

### Variables de Entorno en Vercel
```
VITE_GOOGLE_CLIENT_ID=174366307351-5ofo1ia0ve9pegkod7nni0bqo4eajbtf.apps.googleusercontent.com
```

### Checklist Post-Cambio
- [ ] Guardar cambios en Google Cloud Console
- [ ] Esperar 1-2 minutos para propagación
- [ ] Hacer redeploy en Vercel si se cambió variable de entorno
- [ ] Probar login en incógnito
- [ ] Si falla, revisar en error de Google qué URL exacta está intentando usar (busca "redirect_uri" en el error)

### Debugging
Si el error persiste, hacer clic en "Más información" en el error de Google para ver la URL exacta que está intentando usar, copiarla y agregarla exactamente como aparece en URIs de redireccionamiento.

---
Última actualización: 09/01/2026
