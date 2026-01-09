import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // Configuración para producción
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',

    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },

  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    open: true
  },

  // Resolución de imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
