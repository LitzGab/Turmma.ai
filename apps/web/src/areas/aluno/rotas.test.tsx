// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { Suspense } from 'react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { prepararTela, redeFalsa, renderizarTela } from '../../__fixtures__/tela'
import RotasDoAluno from './rotas'

/**
 * Os endereços da área do aluno (telas do aluno e primeiro acesso, 2.0; RF2): o de "Minha turma" não é mais tela e leva a
 * Eu **trocando** a entrada do histórico, e o que a área não conhece responde "não encontrada". A navegação e o selecionado
 * são de `navegacao.test.ts`; o que cada lugar mostra, dos testes de cada tela.
 */
prepararTela()

const REQUISICAO = '0190f5a0-0000-7000-8000-000000000001'
const NAO_ACHADA = { status: 404, corpo: { erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'x', requisicaoId: REQUISICAO } } } as const

function abrir(caminho: string) {
  const localizacao = memoryLocation({ path: caminho, record: true })
  renderizarTela(
    <Router base="/aluno" hook={localizacao.hook}>
      <Suspense fallback={null}>
        <RotasDoAluno />
      </Suspense>
    </Router>,
  )
  return localizacao
}

describe('os endereços do aluno', () => {
  it('"/aluno/minha-turma" abre Eu e some do histórico: o "voltar" não devolve o endereço que já não é tela', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minha-turma', NAO_ACHADA)
    const localizacao = abrir('/aluno/minha-turma')

    expect(await screen.findByRole('heading', { level: 1, name: 'Eu' })).toBeTruthy()
    expect(localizacao.history).toEqual(['/aluno/eu'])
  })

  it('"/aluno/inicio" abre o Início', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minhas-atividades', { status: 200, corpo: { itens: [] } })
    abrir('/aluno/inicio')
    expect(await screen.findByRole('heading', { level: 1, name: 'Início' })).toBeTruthy()
    // A leitura que o Início faz foi respondida de verdade: o vazio, e não o erro de uma chamada sem resposta preparada.
    expect(await screen.findByText('Nenhuma atividade para pedir ajuda agora')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('um endereço que a área não tem responde "não encontrada"', async () => {
    abrir('/aluno/desempenho')
    expect(await screen.findByText(/não encontrada/i)).toBeTruthy()
  })
})
