import type { RouteObject } from 'react-router-dom'
import { Entrada } from './Entrada'
import { Fundamentos } from './Fundamentos'
import { Verificacao } from './Verificacao'

export const rotasEntrada: RouteObject[] = [
  { path: '/entrar', element: <Entrada /> },
  { path: '/entrar/verificacao', element: <Verificacao /> },
  { path: '/fundamentos', element: <Fundamentos /> },
]
