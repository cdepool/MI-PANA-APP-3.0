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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-maps': ['@react-google-maps/api'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['chart.js', 'react-chartjs-2', 'recharts'],
          'vendor-ui': ['lucide-react', 'sonner'],
        }
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
