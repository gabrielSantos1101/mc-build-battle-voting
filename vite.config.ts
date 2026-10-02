import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      routesDirectory: './app/routes',
      generatedRouteTree: './app/routeTree.gen.ts',
    }),
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
