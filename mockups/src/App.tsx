import { useLayoutEffect } from 'react'
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom'
import { Casca } from '@/components/turmma/Casca'
import { Redireciona } from '@/components/turmma/tela'
import { Mapa } from '@/areas/Mapa'
import { rotasEntrada } from '@/areas/entrada/rotas'
import { rotasProfessor } from '@/areas/professor/rotas'
import { rotasAluno } from '@/areas/aluno/rotas'
import { rotasCoordenacao } from '@/areas/coordenacao/rotas'
import { rotasOutras } from '@/areas/outras/rotas'
import { rotasPublicas } from '@/areas/publico/rotas'
import { Operacao } from '@/areas/operacao/Operacao'
import { BemVindo } from '@/areas/aluno/BemVindo'
import { BemVindoProfessor } from '@/areas/professor/BemVindo'
import { BemVindoCoordenacao } from '@/areas/coordenacao/BemVindo'
import { BemVindoOperacao } from '@/areas/operacao/BemVindo'
import { Prova } from '@/areas/aluno/Prova'
import { Sala } from '@/areas/professor/Sala'
import { sessao } from '@/dados/sessao'
import { registrar } from '@/dados/demo/nucleo'
import { aplicarTema, forcarTema } from '@/dados/tema'

// o tema antes da primeira tela (o script do index.html já escreveu; aqui o React passa a ouvir o sistema)
aplicarTema()

/* AS ROTAS (12ª rodada, 04/10/2026; plano de polimento, seção 3).
   · Telas de foco, FORA da casca (R2): a prova do aluno, as introduções de cada papel (/<papel>/bem-vindo; a da rede
     mora em outras/rotas.tsx) e "Começar aula". Vêm antes das cascas para ganhar delas.
   · `?como=<pessoa>` (só nos links do Mapa, R12) troca a pessoa da sessão antes de a tela desenhar — o aluno em
     /aluno/*, o professor em /professor/* — e sai da URL com replace.
   · 14ª rodada: `?tema=escuro|claro` em qualquer endereço força o tema na aba e sai do endereço no mesmo replace.
   · A PRIMEIRA ENTRADA DA COORDENAÇÃO: o convite leva à primeira verificação (`/entrar/verificacao?primeira=1&para=
     /coordenacao`), que deixa uma marca de uma vez; a chegada a /coordenacao vira o evento `convite-aceito` (papel
     coordenação), o passo 1 do Roteiro 1 no Mapa. */

const MARCA_DA_PRIMEIRA = 'turmma-coordenacao-primeira'

function Raiz() {
  const { pathname, search, hash } = useLocation()
  const navegar = useNavigate()
  useLayoutEffect(() => {
    const p = new URLSearchParams(search)
    const como = p.get('como')
    const tema = p.get('tema')
    if (!como && !tema) return
    if (como) {
      if (pathname.startsWith('/aluno')) sessao.entrarComoAluno(como)
      else if (pathname.startsWith('/professor')) sessao.entrarComoProfessor(como)
      p.delete('como')
    }
    // ?tema=escuro|claro força o tema nesta aba (para fotografar); ?tema=sistema tira o forçado. Sai do endereço junto
    // com o ?como=, num replace só.
    if (tema) {
      forcarTema(tema === 'escuro' || tema === 'claro' ? tema : null)
      p.delete('tema')
    }
    const resto = p.toString()
    navegar(`${pathname}${resto ? `?${resto}` : ''}${hash}`, { replace: true })
  }, [pathname, search, hash, navegar])
  useLayoutEffect(() => {
    try {
      const p = new URLSearchParams(search)
      if (pathname === '/entrar/verificacao' && p.get('primeira') === '1' && (p.get('para') ?? '').startsWith('/coordenacao')) sessionStorage.setItem(MARCA_DA_PRIMEIRA, '1')
      else if (pathname.startsWith('/coordenacao') && sessionStorage.getItem(MARCA_DA_PRIMEIRA) === '1') {
        sessionStorage.removeItem(MARCA_DA_PRIMEIRA)
        registrar('convite-aceito', { papel: 'coordenacao', escolaId: 'aurora' }, { nome: 'Helena Martins', papel: 'coordenacao' })
      }
    } catch { /* modo privado: o passo fica sem o visto */ }
  }, [pathname, search])
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      { path: '/', element: <Mapa /> },
      ...rotasEntrada,
      { path: '/aluno/prova/estequiometria', element: <Redireciona para="/aluno/prova/prova-estequiometria" /> },
      { path: '/aluno/prova/:id', element: <Prova /> },
      { path: '/aluno/bem-vindo', element: <BemVindo /> },
      { path: '/professor/bem-vindo', element: <BemVindoProfessor /> },
      { path: '/coordenacao/bem-vindo', element: <BemVindoCoordenacao /> },
      { path: '/operacao/bem-vindo', element: <BemVindoOperacao /> },
      { path: '/professor/turmas/:turma/aula', element: <Sala /> },
      { path: '/professor', element: <Casca papel="professor" />, children: rotasProfessor },
      { path: '/aluno', element: <Casca papel="aluno" />, children: rotasAluno },
      { path: '/coordenacao', element: <Casca papel="coordenacao" />, children: rotasCoordenacao },
      ...rotasOutras,
      ...rotasPublicas,
      { path: '/operacao', element: <Operacao /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
