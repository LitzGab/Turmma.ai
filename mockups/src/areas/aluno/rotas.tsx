import type { RouteObject } from 'react-router-dom'
import { Atividade } from './Atividade'
import { Atividades } from './Atividades'
import { Avisar } from './Avisar'
import { Desempenho } from './Desempenho'
import { Memoria } from './Memoria'
import { Privacidade } from './Privacidade'
import { Prova } from './Prova'
import { Tutor } from './Tutor'

export const rotasAluno: RouteObject[] = [
  { index: true, element: <Tutor /> },
  { path: 'atividades', element: <Atividades /> },
  { path: 'atividades/:id', element: <Atividade /> },
  { path: 'prova', element: <Prova /> },
  { path: 'desempenho', element: <Desempenho /> },
  { path: 'memoria', element: <Memoria /> },
  { path: 'avisar', element: <Avisar /> },
  { path: 'privacidade', element: <Privacidade /> },
]
