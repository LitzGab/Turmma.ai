import type { RouteObject } from 'react-router-dom'
import { Redireciona } from '@/components/turmma/tela'
import { Aprovar } from './Aprovar'
import { Artefato } from './Artefato'
import { Conversa } from './Conversa'
import { Criados } from './Criados'
import { FerramentaForm } from './FerramentaForm'
import { Ferramentas } from './Ferramentas'
import { Home } from './Home'
import { Turma } from './Turma'
import { Turmas } from './Turmas'

/* 14ª rodada (05/10/2026): Início · Turmas · FERRAMENTAS · Criados; /professor/ferramentas é a página (antes ?mais=1,
   que a Home passa a levar para lá).
   O professor, dentro da casca (12ª rodada, 04/10/2026): Início · Turmas · Criados, e Conversas na lateral.
   A Agenda virou "Semana" dentro de Turmas (?ver=semana); Projetos saiu; "Meu uso" mora em Configurações ›
   Privacidade; o catálogo de ferramentas é a janela "Mais" (?mais=1). "Começar aula" fica FORA da casca (App.tsx).
   Os endereços antigos continuam chegando ao lugar certo. */
export const rotasProfessor: RouteObject[] = [
  { index: true, element: <Home /> },
  { path: 'conversa', element: <Conversa /> },
  { path: 'conversa/:id', element: <Conversa /> },
  { path: 'ferramentas', element: <Ferramentas /> },
  { path: 'ferramentas/:id', element: <FerramentaForm /> },
  { path: 'criados', element: <Criados /> },
  { path: 'criados/:id', element: <Artefato /> },
  { path: 'aprovar/:id', element: <Aprovar /> },
  { path: 'turmas', element: <Turmas /> },
  { path: 'turmas/:turma', element: <Turma /> },

  // endereços antigos
  { path: 'agenda', element: <Redireciona para="/professor/turmas?ver=semana" /> },
  { path: 'calendario', element: <Redireciona para="/professor/turmas?ver=semana" /> },
  { path: 'projetos', element: <Redireciona para="/professor" /> },
  { path: 'projetos/*', element: <Redireciona para="/professor" /> },
  { path: 'meu-uso', element: <Redireciona para="/professor?config=privacidade" /> },
  { path: 'biblioteca/:id', element: <Redireciona para="/professor/criados/:id" /> },
  { path: 'aprovar', element: <Redireciona para="/professor/aprovar/prova-2b" /> },
  { path: 'time', element: <Redireciona para="/professor" /> },
  { path: 'time/:agente', element: <Redireciona para="/professor" /> },
  { path: 'sala', element: <Redireciona para="/professor/turmas/2b/aula" /> },
  { path: 'painel', element: <Redireciona para="/professor/turmas" /> },
]
