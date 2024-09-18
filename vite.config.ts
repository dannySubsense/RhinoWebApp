import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            // Define your aliases here
        },
    },
    base: './', // Relative paths for GitHub Pages
    build: {
        rollupOptions: {
            // Add any external dependencies if needed
        },
    },
    server: {
        fs: {
            allow: [
                path.resolve(__dirname), // Allow serving files from the current project directory
                path.resolve(__dirname, 'node_modules/rhino3dm'), // Allow serving .wasm files
            ],
        },
        hmr: {
            protocol: 'ws', // Use WebSockets for HMR
        },
    },
});
