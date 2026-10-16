import type { RouteObject } from 'react-router-dom'
import { Casca } from '@/components/turmma/Casca'
import { Familia } from './Familia'
import { Rede } from './Rede'
import { RedeAnalista } from './RedeAnalista'
import { RedeEscolas } from './RedeEscolas'
import { BemVindoRede } from './RedeBemVindo'

/* 14ª rodada (05/10/2026): a secretaria ganha a casca (Painel · Analista · Escolas). A introdução continua fora dela,
   em tela de foco, e vem antes para ganhar da casca.
   Painéis de gestão (06/10/2026): as mesmas 3 abas servem às DUAS redes (Prefeitura de Joinville · Estado de SC,
   Regional Joinville); a rede vem do seletor da lateral ou de ?rede=prefeitura|estado (dados/rede-atual.ts). */
export const rotasOutras: RouteObject[] = [
  { path: '/rede/bem-vindo', element: <BemVindoRede /> },
  {
    path: '/rede', element: <Casca papel="rede" />, children: [
      { index: true, element: <Rede /> },
      { path: 'analista', element: <RedeAnalista /> },
      { path: 'escolas', element: <RedeEscolas /> },
    ],
  },
  { path: '/familia', element: <Familia /> },
]
