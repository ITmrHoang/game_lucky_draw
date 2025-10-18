// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  alias: {
    '~': resolve(__dirname),
    '@': resolve(__dirname),
  },
  serverDir: './server',
  hooks: {
    'vite:resolve': (resolveOptions) => {
      console.log('Resolve alias:', resolveOptions)
    }
  },
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ]
    }
  }
})

