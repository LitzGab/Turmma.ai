import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { aoAbrirSessao, aoTrocarDeSessao } from './api/sessao'
import { criarClienteDeConsultas } from './api/cliente-de-consultas'
import './estilos.css'
import { Rotas } from './rotas'

const elementoRaiz = document.getElementById('raiz')
if (!elementoRaiz) {
  throw new Error('Elemento #raiz ausente em index.html')
}

const clienteConsultas = criarClienteDeConsultas()

// Toda sessão que acaba, e toda sessão nova que entra no lugar dela, esvaziam o cache de consultas. O Chromebook do
// carrinho passa por quatro turmas por dia, e a navegação depois do "Sair" não recarrega a página: sem isto, a pessoa
// seguinte entraria e a tela mostraria o nome e a escola da anterior, direto do cache de `/v1/eu` (regra 20, itens 4
// e 5). Na troca de escola vale o mesmo, com a turma no lugar do nome (regra 10, item 1).
//
// `resetQueries` e não `clear` (20.0): o `clear` tira as consultas do cache, mas a tela que continua montada — a que
// fica atrás do login por cima — segue mostrando o último dado que recebeu, porque o observador dela fica preso à
// consulta que saiu. O `reset` esvazia a consulta que a tela observa, e é isso que faz o nome, a escola e a turma da
// pessoa anterior sumirem da tela, e não só do cache. Ele também refaz as buscas que estão na tela, e por isso o
// módulo de sessão só o chama com a credencial certa em memória: nunca com a da escola de onde a pessoa saiu.
aoTrocarDeSessao(() => {
  void clienteConsultas.resetQueries()
})

// E a sessão que volta a valer sem ser uma sessão nova — a aba que reabriu pelo cookie, ou a API que voltou depois de
// uma queda — manda a tela buscar de novo o que falhou enquanto ela não valia. A sessão nova (entrada, escolha ou
// troca de escola) não passa por aqui: ela esvazia o cache inteiro, que já refaz as buscas com a credencial certa.
aoAbrirSessao(() => {
  void clienteConsultas.invalidateQueries()
})

createRoot(elementoRaiz).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <Rotas />
    </QueryClientProvider>
  </StrictMode>,
)
