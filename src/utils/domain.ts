/**
 * Detecta el subdominio actual para habilitar el Enrutamiento basado en Dominio.
 * Soporta simulación en localhost mediante el parámetro 'role'.
 */
export const getSubdomain = (): string | null => {
  const host = window.location.hostname;
  
  // Soporte para desarrollo local: localhost:3000?role=driver
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const params = new URLSearchParams(window.location.search);
    return params.get('role'); // Retorna 'chofer', 'admin', etc.
  }

  const parts = host.split('.');
  
  // Estructura esperada: subdominio.dominio.ext (ej: chofer.mipana.app)
  // parts = ['chofer', 'mipana', 'app'] -> length = 3
  if (parts.length > 2) {
    return parts[0].toLowerCase();
  }
  
  return null;
};

export const isDriverDomain = () => getSubdomain() === 'chofer';
export const isAdminDomain = () => getSubdomain() === 'admin';
export const isPassengerDomain = () => !isDriverDomain() && !isAdminDomain();
