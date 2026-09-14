import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { criarClienteDeConsultas } from './api/cliente-de-consultas'
import './estilos.css'
import { Casca } from './paginas/Casca'

const elementoRaiz = document.getElementById('raiz')
if (!elementoRaiz) {
  throw new Error('Elemento #raiz ausente em index.html')
}

const clienteConsultas = criarClienteDeConsultas()

createRoot(elementoRaiz).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <Casca />
    </QueryClientProvider>
  </StrictMode>,
)
