import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import basicSsl from '@vitejs/plugin-basic-ssl'; // <-- 1. Impor plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // basicSsl(), // <-- 2. Tambahkan plugin di sini
  ],
  server: {
    allowedHosts: ['.ngrok-free.app'],
    host: true, // <-- 3. Pastikan host diatur agar bisa diakses di jaringan
  },
});
