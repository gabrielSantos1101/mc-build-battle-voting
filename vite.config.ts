import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
  },
})
