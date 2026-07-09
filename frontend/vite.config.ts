import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    emptyOutDir: false,
  },
  server: {
    port: 8113,
    watch: {
      // Bind-mounted files in containers can miss FS events; polling keeps HMR reliable.
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': 'http://localhost:8112',
      '/ws': {
        target: 'ws://localhost:8112',
        ws: true,
      },
    },
  },
  ssr: {
    noExternal: [],
  },
})
