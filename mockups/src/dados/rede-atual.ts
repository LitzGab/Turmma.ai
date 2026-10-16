import { useCallback, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { criarFatia } from './demo/nucleo'

/* QUAL REDE A PESSOA DA REDE ESTÁ OLHANDO (painéis de gestão, 06/10/2026; pesquisa/paineis-gestao/plano.md).

   A persona rede passa a ter DUAS redes, com as mesmas 3 abas (Painel · Analista · Escolas):
   · 'prefeitura' — Prefeitura de Joinville (Secretaria Municipal de Educação; diário no EVN);
   · 'estado'     — Estado de SC, Coordenadoria Regional de Joinville (diário no Professor Online). O Colégio Aurora é
                    escola estadual e aparece nesta lista.

   Como usar:
   · `const [rede, mudarRede] = useRedeAtual()` dentro das telas (precisa do roteador);
   · `redeAtual()` fora do React; `REDES_DO_PAINEL[rede]` traz nome, nome completo e o sistema oficial;
   · o recorte dos números é o mesmo id: `painelDa(rede)` em dados/gestao.ts.

   Ordem de quem manda: `?rede=estado|prefeitura` no endereço (vale e fica guardado) › o que ficou guardado na fatia
   `turmma-demo-v2:rede-atual` › 'prefeitura'. "Recomeçar a demonstração" volta para a prefeitura.
   O nome `useRede` já existe em dados/rede.ts (a vista agregada da rede municipal); por isso este hook se chama
   `useRedeAtual`. */

export type RedeId = 'prefeitura' | 'estado'

export const REDES_DO_PAINEL: Record<RedeId, {
  id: RedeId
  /** o nome no seletor ("Prefeitura de Joinville") */
  nome: string
  /** o nome curto para pílula estreita */
  curto: string
  /** o órgão por extenso */
  completo: string
  /** de onde vêm a chamada e as notas */
  sistema: 'EVN' | 'Professor Online'
  /** as etapas em que o Turmma está nesta rede */
  etapas: string
}> = {
  prefeitura: {
    id: 'prefeitura', nome: 'Prefeitura de Joinville', curto: 'Prefeitura',
    completo: 'Secretaria Municipal de Educação de Joinville', sistema: 'EVN', etapas: 'Anos finais (6º ao 9º ano)',
  },
  estado: {
    id: 'estado', nome: 'Estado de SC · Regional Joinville', curto: 'Estado de SC',
    completo: 'Secretaria de Estado da Educação de SC · Coordenadoria Regional de Joinville', sistema: 'Professor Online',
    etapas: 'Anos finais e Ensino Médio',
  },
}

export const LISTA_REDES: RedeId[] = ['prefeitura', 'estado']

const ehRede = (v: unknown): v is RedeId => v === 'prefeitura' || v === 'estado'

const fatia = criarFatia<RedeId>('rede-atual', 'prefeitura')

const daBusca = (search: string): RedeId | null => {
  try {
    const v = new URLSearchParams(search).get('rede')
    return ehRede(v) ? v : null
  } catch { return null }
}

// A primeira carga com ?rede= já começa na rede certa (sem piscar a outra).
if (typeof window !== 'undefined') {
  const inicial = daBusca(window.location.search)
  if (inicial && inicial !== fatia.ler()) fatia.mudar(() => inicial)
}

/** A rede de agora, fora do React. */
export function redeAtual(): RedeId {
  const v = fatia.ler()
  return ehRede(v) ? v : 'prefeitura'
}

/** Troca a rede fora do React (não mexe no endereço). */
export function mudarRedeAtual(r: RedeId): void {
  fatia.mudar(() => r)
}

/** A rede de agora e a troca. O `?rede=` do endereço manda; trocar pelo menu atualiza o endereço se ele tiver o
    parâmetro, para os dois não brigarem. */
export function useRedeAtual(): [RedeId, (r: RedeId) => void] {
  const { pathname, search, hash } = useLocation()
  const navegar = useNavigate()
  const guardada = fatia.useValor()
  const daUrl = daBusca(search)

  useLayoutEffect(() => {
    if (daUrl && daUrl !== fatia.ler()) fatia.mudar(() => daUrl)
  }, [daUrl])

  const mudar = useCallback((r: RedeId) => {
    fatia.mudar(() => r)
    const p = new URLSearchParams(search)
    if (p.has('rede')) {
      p.set('rede', r)
      navegar(`${pathname}?${p.toString()}${hash}`, { replace: true })
    }
  }, [pathname, search, hash, navegar])

  return [daUrl ?? (ehRede(guardada) ? guardada : 'prefeitura'), mudar]
}
