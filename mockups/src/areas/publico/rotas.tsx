import type { RouteObject } from 'react-router-dom'
import { AceitarConvite } from './AceitarConvite'
import { AvisarEscola } from './AvisarEscola'
import { PedidoDados } from './PedidoDados'
import { EntrarNaEscola } from './EntrarNaEscola'
import { TurmaPublica } from './TurmaPublica'

/* As páginas públicas, sem sessão (04/10/2026, do produto real): a entrada da escola para o aluno aprovado, a página
   da turma onde o aluno pede o próprio nome, e o aceite do convite do professor. 12ª rodada: o canal da escola sem
   conta (ECA Digital, art. 28 — lei) e o pedido sobre dados de um aluno (LGPD, art. 18 — lei). */
export const rotasPublicas: RouteObject[] = [
  { path: '/e/:escola', element: <EntrarNaEscola /> },
  { path: '/e/:escola/turma', element: <TurmaPublica /> },
  { path: '/e/:escola/avisar', element: <AvisarEscola /> },
  { path: '/e/:escola/dados', element: <PedidoDados /> },
  { path: '/convite', element: <AceitarConvite /> },
]
