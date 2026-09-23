import { Navigate, type RouteObject } from 'react-router-dom'
import { Aprovar } from './Aprovar'
import { Artefato } from './Artefato'
import { Calendario } from './Calendario'
import { Conversa } from './Conversa'
import { FerramentaForm } from './FerramentaForm'
import { Ferramentas } from './Ferramentas'
import { Home } from './Home'
import { Projeto, Projetos } from './Projeto'
import { Sala } from './Sala'
import { Time } from './Time'
import { Turma } from './Turma'
import { Turmas } from './Turmas'

export const rotasProfessor: RouteObject[] = [
  { index: true, element: <Home /> },
  { path: 'conversa', element: <Conversa /> },
  { path: 'conversa/:id', element: <Conversa /> },
  { path: 'ferramentas', element: <Ferramentas /> },
  { path: 'ferramentas/:id', element: <FerramentaForm /> },
  { path: 'biblioteca/:id', element: <Artefato /> },
  { path: 'calendario', element: <Calendario /> },
  { path: 'time', element: <Time /> },
  { path: 'time/:agente', element: <Time /> },
  { path: 'aprovar', element: <Aprovar /> },
  { path: 'turmas', element: <Turmas /> },
  { path: 'turmas/:turma', element: <Turma /> },
  // endereço antigo de "Minhas turmas": continua abrindo
  { path: 'painel', element: <Navigate to="/professor/turmas" replace /> },
  { path: 'projetos', element: <Projetos /> },
  { path: 'projetos/:id', element: <Projeto /> },
  { path: 'sala', element: <Sala /> },
]
