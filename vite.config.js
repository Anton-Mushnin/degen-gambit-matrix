import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
