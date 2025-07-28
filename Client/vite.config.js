import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** @type {import('tailwindcss').Config} */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open:true,
    proxy: {      '/api': {
        target: 'https://editable-travel-website1-rpfv.vercel.app',
        changeOrigin: true,
      },
    },
  },
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
});
