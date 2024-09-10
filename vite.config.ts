import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            'ws': path.resolve(__dirname, './node_modules/ws/index.js'),
        },
    },
    build: {
        rollupOptions: {
            external: ['ws'],
        },
    },
    server: {
        fs: {
            allow: [
                path.resolve(__dirname), // Allow serving files from the current project directory
                path.resolve(__dirname, 'node_modules/rhino3dm'), // Allow serving .wasm files
            ],
        },
        mimeTypes: {
            'application/wasm': ['wasm'], // Explicitly declare MIME type for .wasm files
        },
    },
});
