import type { RouteObject } from 'react-router-dom'
import { AceitarConvite } from './AceitarConvite'
import { EntrarNaEscola } from './EntrarNaEscola'
import { TurmaPublica } from './TurmaPublica'

/* As páginas públicas, sem sessão (04/10/2026, do produto real): a entrada da escola para o aluno aprovado, a página
   da turma onde o aluno pede o próprio nome, e o aceite do convite do professor. */
export const rotasPublicas: RouteObject[] = [
  { path: '/e/:escola', element: <EntrarNaEscola /> },
  { path: '/e/:escola/turma', element: <TurmaPublica /> },
  { path: '/convite', element: <AceitarConvite /> },
]
