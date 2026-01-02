// Sistema de Diseño MI PANA APP
// Colores corporativos y configuración de tema

export const theme = {
  colors: {
    // Colores primarios
    primary: {
      navy: '#003366',        // Azul marino oscuro (header)
      blue: '#0066CC',        // Azul corporativo
      cyan: '#00BCD4',        // Azul turquesa (gráficos)
      light: '#E3F2FD',       // Azul claro (fondos)
    },
    
    // Colores secundarios
    secondary: {
      orange: '#FF6B35',      // Naranja (acentos)
      yellow: '#FFC107',      // Amarillo (alertas)
      green: '#4CAF50',       // Verde (éxito)
      red: '#F44336',         // Rojo (errores)
    },
    
    // Colores neutrales
    neutral: {
      white: '#FFFFFF',
      gray50: '#FAFAFA',
      gray100: '#F5F5F5',
      gray200: '#EEEEEE',
      gray300: '#E0E0E0',
      gray400: '#BDBDBD',
      gray500: '#9E9E9E',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#424242',
      gray900: '#212121',
      black: '#000000',
    },
    
    // Colores de borde para tarjetas
    borders: {
      cyan: '#00BCD4',
      orange: '#FF6B35',
      navy: '#003366',
      yellow: '#FFC107',
    },
    
    // Colores de estado
    status: {
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#F44336',
      info: '#2196F3',
    },
  },
  
  // Tipografía
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      heading: "'Poppins', 'Inter', sans-serif",
      mono: "'Fira Code', 'Courier New', monospace",
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  
  // Espaciado
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  // Bordes
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',
  },
  
  // Sombras
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  
  // Breakpoints para responsive design
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Transiciones
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
};

export type Theme = typeof theme;
