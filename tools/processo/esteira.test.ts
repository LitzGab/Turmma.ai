import { describe, expect, it } from 'vitest'
import {
  ehSoDocumento,
  estadoDaExecucao,
  execucaoDe,
  relatorioDaEsteira,
  situacaoDaTarefa,
  situacaoDoFechamento,
  type Commit,
  type Execucao,
} from './esteira.ts'

function commit(sha: string, soDocumento = false): Commit {
  return { sha, assunto: `commit ${sha}`, soDocumento }
}

function execucao(sha: string, estado: Execucao['estado'], criadaEm = '2026-10-11T10:00:00Z', id = 1): Execucao {
  return { id, sha, estado, criadaEm }
}

describe('o que conta como commit só de documento', () => {
  it('documento não roda em suíte nenhuma, menos o runbook, que a guarda dos alertas lê', () => {
    expect(ehSoDocumento(['tasks/prd-x/estado.md', 'ROADMAP.md'])).toBe(true)
    expect(ehSoDocumento(['tasks/prd-x/estado.md', 'docs/runbook.md'])).toBe(false)
    expect(ehSoDocumento(['tasks/prd-x/estado.md', 'apps/api/src/x.ts'])).toBe(false)
    expect(ehSoDocumento(['.github/workflows/ci.yml'])).toBe(false)
  })
})

describe('a execução que vale para um commit', () => {
  it('é a mais nova dele: a reexecução de um vermelho troca o veredito', () => {
    const execucoes = [execucao('a', 'vermelha', '2026-10-11T10:00:00Z', 1), execucao('a', 'verde', '2026-10-11T11:00:00Z', 2), execucao('b', 'verde')]
    expect(execucaoDe('a', execucoes)?.id).toBe(2)
    expect(execucaoDe('c', execucoes)).toBeUndefined()
  })

  it('só é verde a que terminou com sucesso: cancelada e com falha são vermelhas, e a que não terminou está rodando', () => {
    expect(estadoDaExecucao({ status: 'completed', conclusion: 'success' })).toBe('verde')
    expect(estadoDaExecucao({ status: 'completed', conclusion: 'failure' })).toBe('vermelha')
    expect(estadoDaExecucao({ status: 'completed', conclusion: 'cancelled' })).toBe('vermelha')
    expect(estadoDaExecucao({ status: 'in_progress', conclusion: null })).toBe('rodando')
    expect(estadoDaExecucao({ status: 'queued', conclusion: null })).toBe('rodando')
  })
})

describe('ao fechar uma tarefa: a esteira não segura a linha, só o vermelho segura', () => {
  const commits = [commit('c3'), commit('c2'), commit('c1')]

  it('sem execução nenhuma, segue', () => {
    expect(situacaoDaTarefa(commits, []).tipo).toBe('sem-execucao')
  })

  it('a execução do commit novo ainda rodando não segura, mesmo sem nenhuma terminada', () => {
    expect(situacaoDaTarefa(commits, [execucao('c3', 'rodando')]).tipo).toBe('rodando')
  })

  it('o vermelho do commit anterior aparece mesmo com a execução do commit novo no ar, e o relatório diz as duas coisas', () => {
    const situacao = situacaoDaTarefa(commits, [execucao('c3', 'rodando'), execucao('c2', 'vermelha', '2026-10-11T09:00:00Z', 7)])
    expect(situacao).toMatchObject({ tipo: 'vermelha', commit: { sha: 'c2' }, rodandoDepois: { sha: 'c3' } })
    const texto = relatorioDaEsteira(situacao, 'spec/x', false, ['e2e 2/4'])
    expect(texto).toContain('VERMELHA em c2')
    expect(texto).toContain('Jobs que caíram: e2e 2/4')
    expect(texto).toContain('execução mais nova rodando, em c3')
  })

  it('o verde mais novo encerra a conta: vermelho de commit mais antigo já foi corrigido', () => {
    const situacao = situacaoDaTarefa(commits, [execucao('c2', 'verde'), execucao('c1', 'vermelha')])
    expect(situacao).toMatchObject({ tipo: 'verde', commit: { sha: 'c2' } })
  })

  it('verde no anterior e rodando no novo é "rodando": o veredito do novo se lê na tarefa seguinte', () => {
    expect(situacaoDaTarefa(commits, [execucao('c3', 'rodando'), execucao('c2', 'verde')])).toMatchObject({ tipo: 'rodando', commit: { sha: 'c3' } })
  })
})

describe('no fechamento: a esteira precisa estar verde no último commit que alterou código', () => {
  it('o verde de um commit só de documento posterior ao código vale, e o do próprio commit de código também', () => {
    const commits = [commit('doc2', true), commit('doc1', true), commit('codigo'), commit('antes')]
    expect(situacaoDoFechamento(commits, [execucao('doc1', 'verde')]).tipo).toBe('verde')
    expect(situacaoDoFechamento(commits, [execucao('codigo', 'verde')]).tipo).toBe('verde')
  })

  it('o verde de um commit anterior ao último código não vale: o código já é outro', () => {
    const commits = [commit('doc', true), commit('codigo'), commit('antes')]
    const situacao = situacaoDoFechamento(commits, [execucao('antes', 'verde')])
    expect(situacao).toMatchObject({ tipo: 'sem-execucao', commit: { sha: 'codigo' } })
    expect(relatorioDaEsteira(situacao, 'spec/x', true)).toContain('gh workflow run esteira --ref spec/x')
  })

  it('rodando manda esperar, e vermelha não fecha', () => {
    const commits = [commit('doc', true), commit('codigo')]
    const rodando = situacaoDoFechamento(commits, [execucao('doc', 'rodando', '2026-10-11T10:00:00Z', 9)])
    expect(rodando.tipo).toBe('rodando')
    expect(relatorioDaEsteira(rodando, 'spec/x', true)).toContain('gh run watch 9 --exit-status')
    expect(situacaoDoFechamento(commits, [execucao('codigo', 'vermelha')]).tipo).toBe('vermelha')
  })

  it('com um verde e um vermelho entre os candidatos, vale o verde: o que rodou foi o mesmo código', () => {
    const commits = [commit('doc', true), commit('codigo')]
    expect(situacaoDoFechamento(commits, [execucao('doc', 'verde'), execucao('codigo', 'vermelha')]).tipo).toBe('verde')
  })
})
