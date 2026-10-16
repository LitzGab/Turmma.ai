import type { RouteObject } from 'react-router-dom'
import { Redireciona } from '@/components/turmma/tela'
import { Atividade } from './Atividade'
import { Atividades } from './Atividades'
import { Avisar } from './Avisar'
import { Eu } from './Eu'
import { Privacidade } from './Privacidade'
import { Tutor } from './Tutor'

/* O aluno, dentro da casca (12ª rodada, 04/10/2026): Início · Tarefas · Eu · Avisar um adulto.
   A prova e o primeiro acesso ficam FORA da casca, em tela de foco (App.tsx). "O que o Tutor lembra" mora dentro de
   Privacidade (#memoria). Os endereços antigos continuam chegando ao lugar certo. */
export const rotasAluno: RouteObject[] = [
  { index: true, element: <Tutor /> },
  { path: 'c/:id', element: <Tutor /> },
  { path: 'tarefas', element: <Atividades /> },
  { path: 'tarefas/:id', element: <Atividade /> },
  { path: 'eu', element: <Eu /> },
  { path: 'eu/memoria', element: <Redireciona para="/aluno/eu/privacidade#memoria" /> },
  { path: 'eu/privacidade', element: <Privacidade /> },
  { path: 'avisar', element: <Avisar /> },

  // endereços antigos
  { path: 'atividades', element: <Redireciona para="/aluno/tarefas" /> },
  { path: 'atividades/:id', element: <Redireciona para="/aluno/tarefas/:id" /> },
  { path: 'prova', element: <Redireciona para="/aluno/prova/prova-estequiometria" /> },
  { path: 'desempenho', element: <Redireciona para="/aluno/eu" /> },
  { path: 'memoria', element: <Redireciona para="/aluno/eu/privacidade#memoria" /> },
  { path: 'privacidade', element: <Redireciona para="/aluno/eu/privacidade" /> },
]
