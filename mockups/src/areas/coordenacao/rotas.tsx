import type { RouteObject } from 'react-router-dom'
import { Adaptacoes } from './Adaptacoes'
import { Agentes } from './Agentes'
import { Analista } from './Analista'
import { Auditoria } from './Auditoria'
import { Configuracoes } from './Configuracoes'
import { Conformidade } from './Conformidade'
import { Denuncias } from './Denuncias'
import { Estrutura } from './Estrutura'
import { Exportar } from './Exportar'
import { Governanca } from './Governanca'
import { Material } from './Material'

// A coordenação abre em Governança, não em chat: é a tela que fecha a venda (11.1)
export const rotasCoordenacao: RouteObject[] = [
  { index: true, element: <Governanca /> },
  { path: 'analista', element: <Analista /> },
  { path: 'agentes', element: <Agentes /> },
  { path: 'estrutura', element: <Estrutura /> },
  { path: 'material', element: <Material /> },
  { path: 'adaptacoes', element: <Adaptacoes /> },
  { path: 'conformidade', element: <Conformidade /> },
  { path: 'denuncias', element: <Denuncias /> },
  { path: 'auditoria', element: <Auditoria /> },
  { path: 'exportar', element: <Exportar /> },
  { path: 'configuracoes', element: <Configuracoes /> },
]
