import type { RouteObject } from 'react-router-dom'
import { Redireciona } from '@/components/turmma/tela'
import { AnalistaCoordenacao } from './AnalistaTela'
import { Configuracoes } from './Configuracoes'
import { Estrutura } from './Estrutura'
import { InicioCoordenacao } from './Inicio'
import { ListaDaTurma } from './ListaDaTurma'
import { Registros } from './Registros'

/* 14ª rodada (05/10/2026): Painel · Analista · Escola · Registros. A página IA virou a primeira aba de Registros
   (/coordenacao/ia → ?aba=ia, levando a consulta) e o Dossiê o botão DOSSIÊ de Registros (?dossie=1).
   A coordenação, dentro da casca (décima rodada, 04/10/2026): Início · Escola · IA · Registros. As Configurações da
   escola são uma página, aberta pelo menu da pessoa. Os 13 endereços antigos continuam chegando ao lugar certo. */
export const rotasCoordenacao: RouteObject[] = [
  { index: true, element: <InicioCoordenacao /> },
  { path: 'escola', element: <Estrutura /> },
  { path: 'escola/turmas/:turma', element: <ListaDaTurma /> },
  { path: 'analista', element: <AnalistaCoordenacao /> },
  { path: 'registros', element: <Registros /> },
  { path: 'configuracoes', element: <Configuracoes /> },

  // endereços antigos
  { path: 'estrutura', element: <Redireciona para="/coordenacao/escola" /> },
  { path: 'estrutura/turmas/:turma', element: <Redireciona para="/coordenacao/escola/turmas/:turma" /> },
  { path: 'professores', element: <Redireciona para="/coordenacao/escola?aba=professores" /> },
  { path: 'material', element: <Redireciona para="/coordenacao/escola?aba=material" /> },
  { path: 'adaptacoes', element: <Redireciona para="/coordenacao/escola?aba=turmas&filtro=adaptacao" /> },
  { path: 'ia', element: <Redireciona para="/coordenacao/registros?aba=ia" /> },
  { path: 'agentes', element: <Redireciona para="/coordenacao/registros?aba=ia&ver=como" /> },
  { path: 'conformidade', element: <Redireciona para="/coordenacao/registros?dossie=1" tirar={['aba']} /> },
  { path: 'denuncias', element: <Redireciona para="/coordenacao/registros?aba=avisos" /> },
  { path: 'auditoria', element: <Redireciona para="/coordenacao/registros?aba=auditoria" /> },
  { path: 'exportar', element: <Redireciona para="/coordenacao/registros?exportar=1" /> },
]
