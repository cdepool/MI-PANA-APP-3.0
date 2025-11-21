import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Asegura que el output vaya al directorio que Vercel espera por defecto si no se configura otra cosa
    outDir: 'dist',
  }
})