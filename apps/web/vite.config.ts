import react from '@vitejs/plugin-react'
import { defaultClientConditions, defineConfig } from 'vite'

// Dentro do compose a API é `http://api:3000`. A web chama caminho relativo e o proxy
// encaminha, então o navegador nunca precisa conhecer o endereço da API nem de CORS.
const destinoApi = process.env['API_URL_INTERNA'] ?? 'http://127.0.0.1:3000'
const proxy = { '/saude': { target: destinoApi, changeOrigin: false } }

export default defineConfig({
  plugins: [react()],
  resolve: { conditions: ['source', ...defaultClientConditions] },
  server: { proxy },
  preview: { proxy },
})
