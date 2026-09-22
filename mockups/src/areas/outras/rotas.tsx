import type { RouteObject } from 'react-router-dom'
import { Familia } from './Familia'
import { Rede } from './Rede'

export const rotasOutras: RouteObject[] = [
  { path: '/rede', element: <Rede /> },
  { path: '/familia', element: <Familia /> },
]
