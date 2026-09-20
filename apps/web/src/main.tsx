import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { aoEncerrarSessao } from './api/sessao'
import { criarClienteDeConsultas } from './api/cliente-de-consultas'
import './estilos.css'
import { Rotas } from './rotas'

const elementoRaiz = document.getElementById('raiz')
if (!elementoRaiz) {
  throw new Error('Elemento #raiz ausente em index.html')
}

const clienteConsultas = criarClienteDeConsultas()

// Todo fim de sessão esvazia o cache de consultas. O Chromebook do carrinho passa por quatro turmas por dia, e a
// navegação depois do "Sair" não recarrega a página: sem isto, a pessoa seguinte entraria e a tela mostraria o nome
// e a escola da anterior, direto do cache de `/v1/eu` (regra 20, itens 4 e 5).
aoEncerrarSessao(() => {
  clienteConsultas.clear()
})

createRoot(elementoRaiz).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <Rotas />
    </QueryClientProvider>
  </StrictMode>,
)
