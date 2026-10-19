import { ALUNOS_DO_LOTE, desempenhoSintetico } from './__fixtures__/assistente.ts'
import { PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { principal } from './__fixtures__/fluxo-do-professor.ts'
import { acionar, comLote, entrar, irPara, PRAZO_DA_TELA_MS, VOCABULARIO_DE_NOTA } from './__fixtures__/professor/cena.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'
import { expect, test } from './__fixtures__/perfis.ts'

/**
 * A turma aberta: Visão Geral e Alunos (D69, A4, pacote W). Separado de `professor-turma.spec.ts` pela 2.5.
 */

test.describe('a turma aberta: Visão Geral e Alunos (D69)', () => {
  test('sem correção aprovada, o vazio tracejado diz o que falta; com lote aprovado, o acerto por habilidade em barra neutra e os alunos em ordem de nome; e a aba Alunos continua com o acesso e os pedidos da A1', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaId } = await entrar(page, hasTouch)
    await irPara(page, `/professor/turmas/${turmaId}`)
    await expect(page.getByRole('tab')).toHaveText(['Visão Geral', 'Alunos'], { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('tab', { name: 'Visão Geral' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Ainda não há correção aprovada nesta turma')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Nenhuma atividade aplicada a esta turma')).toBeVisible()
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A aba Alunos: o que a A1 já mostrava, sem regressão.
    await acionar(page.getByRole('tab', { name: 'Alunos' }), hasTouch)
    await expect(page.getByRole('heading', { name: 'Acesso dos alunos' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Nenhum pedido esperando')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })

    // Com um lote aprovado.
    api.desempenho = desempenhoSintetico(turmaId)
    comLote(api, turmaId)
    await page.reload()
    const habilidades = page.getByRole('region', { name: 'Acerto por habilidade' })
    await expect(habilidades).toContainText('QUI.EM.04', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(habilidades).toContainText('20 de 28')
    await expect(habilidades).toContainText('8 alunos acertaram menos da metade das questões desta habilidade nas atividades aprovadas.')
    await expect(habilidades).toContainText('Nenhum aluno acertou menos da metade das questões desta habilidade nas atividades aprovadas.')
    // A barra é neutra: cinza, nunca vermelha.
    expect(await habilidades.locator('svg rect').evaluateAll((retangulos) => [...new Set(retangulos.map((retangulo) => getComputedStyle(retangulo).fill))])).toEqual(['rgb(240, 240, 240)', 'rgb(93, 93, 93)'])
    const alunos = page.getByRole('region', { name: 'Por aluno' })
    // Em ordem de nome, como a API entrega: não é ranking.
    const nomes = await alunos.getByText(/Sintétic[ao]$/).allInnerTexts()
    // No celular a tabela empilha, e a célula leva o rótulo da coluna antes do valor.
    expect(nomes.map((nome) => nome.replace(/^Aluno:\s*/, ''))).toEqual(ALUNOS_DO_LOTE.map((aluno) => aluno.nome))
    await expect(alunos).toContainText('Sem correção aprovada')
    await expect(principal(page)).not.toContainText(VOCABULARIO_DE_NOTA)
    await expect(principal(page)).not.toContainText(/ranking|pódio|posição|º lugar/i)
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    // As atividades da turma, com o caminho para a correção.
    const atividades = page.getByRole('region', { name: 'Atividades da turma' })
    await expect(atividades).toContainText('Encerrada · avaliativa · 26 de 30 alunos enviaram')
    await expect(atividades.getByRole('link', { name: /^Revisar a correção/ })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
