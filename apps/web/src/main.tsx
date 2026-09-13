import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Saude } from './Saude'

const elementoRaiz = document.getElementById('raiz')
if (!elementoRaiz) {
  throw new Error('Elemento #raiz ausente em index.html')
}

const clienteConsultas = new QueryClient()

createRoot(elementoRaiz).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <Saude />
    </QueryClientProvider>
  </StrictMode>,
)
