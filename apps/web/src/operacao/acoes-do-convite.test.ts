import { ESTADOS_DA_COORDENACAO, type EstadoDaCoordenacao } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { acoesDoConvite, type AcaoDoConvite } from './acoes-do-convite'

const CONVITE = '0192a4c0-5b1e-7c3d-8e4f-a0b1c2d3e4f5'

/**
 * As ações da linha da escola pela matriz da seção 5 (tarefa 7.0, subtarefa 7.1), escrita aqui por extenso: uma célula
 * trocada na matriz de `@educa/shared`, ou um estado novo sem linha, deixa vermelho.
 */
const ESPERADO: Readonly<Record<EstadoDaCoordenacao, readonly AcaoDoConvite[]>> = {
  sem_convite: ['gerar'],
  revogado: ['gerar'],
  sem_coordenacao: ['gerar'],
  aceito: ['gerar', 'revogar'],
  pendente: ['refazer', 'revogar'],
  vencido: ['refazer', 'revogar'],
  ativa: [],
}

describe('as ações do convite na linha da escola (Tech Spec da A0b, seção 5; tarefa 7.0)', () => {
  it('cada estado mostra só o que a matriz permite, na ordem da linha', () => {
    for (const estado of ESTADOS_DA_COORDENACAO) {
      expect(acoesDoConvite({ estado, conviteId: CONVITE }), estado).toEqual(ESPERADO[estado])
    }
  })

  it('sem o id do último convite, refazer e revogar não aparecem: a tela não inventa convite que a API não deu', () => {
    expect(acoesDoConvite({ estado: 'pendente' })).toEqual([])
    expect(acoesDoConvite({ estado: 'vencido' })).toEqual([])
    // Em `aceito` sobra o gerar, que é da escola e não de um convite.
    expect(acoesDoConvite({ estado: 'aceito' })).toEqual(['gerar'])
    expect(acoesDoConvite({ estado: 'sem_convite' })).toEqual(['gerar'])
  })
})
