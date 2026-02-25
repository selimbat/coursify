import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit(),
        SvelteKitPWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Sparfux',
                short_name: 'Sparfux',
                description: 'Gérez vos listes de courses partagées',
                theme_color: '#51d9cb',
                background_color: '#06453e',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                lang: 'fr',
                icons: [
                    {
                        src: 'pwa-64x64.png',
                        sizes: '64x64',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'maskable-icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                // Cache app shell and static assets
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
                // Network-first for navigation so visited pages work offline
                runtimeCaching: [
                    {
                        // Navigation requests (full page loads)
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages-cache',
                            networkTimeoutSeconds: 3,
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        // SvelteKit client-side data fetches (__data.json)
                        urlPattern: ({ url }) => url.pathname.endsWith('__data.json'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'sveltekit-data-cache',
                            networkTimeoutSeconds: 3,
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            },
            useCredentials: true,
            devOptions: {
                enabled: true,
                type: 'module'
            }
        })
    ]
});
