﻿import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      nodePolyfills({
        global: true,
        process: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-redux',
        '@reduxjs/toolkit',
        'recharts',
        'react-is',
      ],
    },
    define: {
      'process.env': env,
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Keep /api prefix
        },
        '/socket.io': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/static/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
      hmr: {
        overlay: false,
      },
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.code === 'CSS_NESTING' ||
            warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
            warning.code === 'SOURCEMAP_ERROR'
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  }
})