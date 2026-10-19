import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { ALUNOS_DO_LOTE, erroDaApi, portao, QUEM_DECIDE } from './__fixtures__/assistente.ts'
import { principal } from './__fixtures__/fluxo-do-professor.ts'
import { acionar, comLote, entrar, irPara, PRAZO_DA_TELA_MS, recarregar, VOCABULARIO_DE_NOTA } from './__fixtures__/professor/cena.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'
import { expect, test } from './__fixtures__/perfis.ts'

/**
 * Aprovar a correção (11.5, A3, pacote W). Separado de `professor-turma.spec.ts` pela 2.5.
 */

test.describe('aprovar a correção (11.5)', () => {
  test('carregando, erro e a correção que não existe; e, com dado, o resumo assinado pela IA, sem falar em nota', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaId, turmaNome } = await entrar(page, hasTouch, { antes: (simulada, turma) => void comLote(simulada, turma) })
    const atividadeId = [...api.correcoes.keys()][0] ?? ''
    const segura = portao()
    api.trocar('correcao', async () => {
      await segura.aberta
      return erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO')
    })
    await irPara(page, `/professor/aprovar/${atividadeId}`)
    await expect(page.getByText('Carregando a correção…')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    segura.abrir()
    await expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    api.trocar('correcao', () => erroDaApi(404, 'NAO_ENCONTRADO'))
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(page.getByText('Esta correção não está disponível')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    // Nenhum texto diz "Seu time", e sem a turma da correção o caminho de volta é a lista de turmas.
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Voltar para a turma' })).toHaveAttribute('href', '/professor/turmas')
    api.trocar('correcao')
    // Sai e volta: a tela de aprovar só desmonta quando a outra aparece, e é a volta que relê a correção.
    await irPara(page, '/professor/time/assistente')
    await expect(page.getByRole('heading', { level: 1, name: 'Assistente de ensino' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await irPara(page, `/professor/aprovar/${atividadeId}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Revisar a correção' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page).toHaveTitle('Revisar a correção · Turmma')
    await expect(principal(page)).toContainText(`Atividade de estequiometria · ${turmaNome}`)
    // A correção é saída de IA: a função assina, com o selo.
    await expect(page.getByText('Assistente · correção de objetiva')).toBeVisible()
    await expect(principal(page).locator('[data-selo-ia]')).toHaveCount(1)
    // Com a entrega lida, "Voltar para a turma" leva à turma da correção, e nenhum texto diz "Seu time".
    await expect(page.getByRole('link', { name: 'Voltar para a turma' })).toHaveAttribute('href', `/professor/turmas/${turmaId}`, { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    await expect(principal(page)).toContainText('28 alunos responderam · 30 na turma hoje')
    await expect(principal(page)).toContainText('1,3 de 2 questões')
    await expect(page.getByRole('region', { name: 'Distribuição dos acertos' })).toContainText('2 acertos')
    await expect(page.getByRole('region', { name: 'Acerto por habilidade' })).toContainText('QUI.EM.05')
    await expect(page.getByRole('region', { name: 'Acerto por habilidade' })).toContainText('15 de 28')
    await expect(page.getByRole('region', { name: 'Por questão' })).toContainText('a: 8 · b: 2 · c: 15 · d: 2')
    await expect(page.getByRole('region', { name: 'As outras 2 correções' })).toContainText('Caio Sintético')
    await expect(page.locator('[data-situacao-do-lote="pendente"] [data-aprovacao="pendente"]')).toHaveText('Esperando você')
    // D46: é diagnóstico, não nota. A tela inteira fala em acertos e habilidades.
    await expect(principal(page)).not.toContainText(VOCABULARIO_DE_NOTA)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('o botão de aprovar fica desligado até o último destaque ser aberto, com o contador dizendo por quê; abrir fica registrado; a confirmação diz o que acontece; e a tela mostra a validação registrada', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaNome } = await entrar(page, hasTouch, { antes: (simulada, turma) => void comLote(simulada, turma) })
    const atividadeId = [...api.correcoes.keys()][0] ?? ''
    const entregaId = api.correcoes.get(atividadeId)?.entrega.id ?? ''
    await irPara(page, `/professor/aprovar/${atividadeId}`)

    const destaques = page.getByRole('region', { name: 'Abra estes 2 antes de aprovar' })
    await expect(destaques.locator('[data-destaque="fechado"]')).toHaveCount(2, { timeout: PRAZO_DA_TELA_MS })
    // Cada destaque diz o motivo em texto, como fato do trabalho, e está fechado como pendente.
    const ana = destaques.getByRole('listitem').filter({ hasText: 'Ana Sintética' })
    await expect(ana).toContainText('Em branco')
    await expect(ana).toContainText('Nenhuma questão foi respondida.')
    await expect(ana).toContainText('0 de 2 acertos · 2 em branco')
    await expect(ana).toContainText('Falta abrir')
    const bruno = destaques.getByRole('listitem').filter({ hasText: 'Bruno Sintético' })
    await expect(bruno).toContainText('Os acertos ficaram bem acima ou bem abaixo dos que ele teve nas correções aprovadas desta disciplina.')

    // O único `oficial` da tela, preso embaixo e desligado, com o contador ao lado dizendo por quê.
    const barra = page.getByRole('group', { name: 'Aprovação do lote' })
    expect(await barra.evaluate((elemento) => getComputedStyle(elemento).position)).toBe('sticky')
    const aprovar = barra.getByRole('button', { name: 'Aprovar 28 correções' })
    await expect(aprovar).toBeDisabled()
    const contador = barra.locator('[data-contador-dos-destaques]')
    await expect(contador).toHaveText('0 de 2 destaques abertos. Abra os 2 destaques que faltam para liberar a aprovação.')
    // O leitor de tela lê o porquê junto do botão desligado.
    await expect(aprovar).toHaveAccessibleDescription('0 de 2 destaques abertos. Abra os 2 destaques que faltam para liberar a aprovação.')
    expect(await principal(page).getByRole('button').evaluateAll((botoes) => botoes.filter((botao) => getComputedStyle(botao).backgroundColor === 'rgb(232, 115, 46)').length)).toBe(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Abrir chama a rota que registra a abertura, e mostra as respostas do aluno e o histórico dele.
    await acionar(ana.getByRole('button', { name: /^Abrir/ }), hasTouch)
    await expect(ana.locator('[data-destaque-aberto]')).toContainText('Em branco', { timeout: PRAZO_DA_TELA_MS })
    await expect(ana.locator('[data-destaque-aberto]')).toContainText('Atividade de balanceamento: 4 de 5 acertos')
    await expect(ana).toContainText(/Aberto · \d{2}\/\d{2}, \d{2}h\d{2}/)
    expect(api.pedidosEm(/abrir$/).map(({ caminho, corpo }) => ({ caminho, corpo }))).toEqual([{ caminho: `/v1/atividades-aplicadas/${atividadeId}/correcao/destaques/${ALUNOS_DO_LOTE[0]?.alunoId ?? ''}/abrir`, corpo: {} }])
    await expect(contador).toHaveText('1 de 2 destaques abertos. Abra o destaque que falta para liberar a aprovação.')
    await expect(aprovar).toBeDisabled()

    await acionar(bruno.getByRole('button', { name: /^Abrir/ }), hasTouch)
    await expect(contador).toHaveText('2 de 2 destaques abertos. Tudo aberto: a aprovação está liberada.', { timeout: PRAZO_DA_TELA_MS })
    await expect(aprovar).toBeEnabled()
    expect(await aprovar.evaluate((botao) => getComputedStyle(botao).backgroundColor)).toBe('rgb(51, 51, 51)')

    // A confirmação diz a atividade, a turma, quantas correções, e que o diagnóstico chega aos alunos.
    await acionar(aprovar, hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Aprovar 28 correções' })
    await expect(dialogo).toContainText('Atividade de estequiometria')
    await expect(dialogo).toContainText(turmaNome)
    await expect(dialogo).toContainText('28 alunos responderam · 30 na turma hoje')
    await expect(dialogo).toContainText('O diagnóstico por habilidade chega aos alunos da turma.')
    await expect(dialogo).not.toContainText(VOCABULARIO_DE_NOTA)
    expect(api.pedidosEm(/aprovar-lote$/)).toHaveLength(0)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Dois cliques em confirmar: uma aprovação só, de corpo vazio (a tela não manda o que mostrou).
    const segura = portao()
    api.trocar('aprovarLote', async (pedido) => {
      await segura.aberta
      return api.responder('aprovarLote', pedido)
    })
    await dialogo.getByRole('button', { name: 'Aprovar 28 correções' }).evaluate((botao: HTMLButtonElement) => {
      botao.click()
      botao.click()
    })
    await expect(dialogo.getByRole('button', { name: 'Aprovando…' })).toBeDisabled()
    segura.abrir()
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    expect(api.pedidosEm(/aprovar-lote$/).map(({ caminho, corpo }) => ({ caminho, corpo }))).toEqual([{ caminho: `/v1/entregas/${entregaId}/aprovar-lote`, corpo: {} }])

    // Depois: a validação registrada, com quem e quando; a barra de decisão sai; o foco fica na situação.
    const situacao = page.locator('[data-situacao-do-lote="aprovada"]')
    await expect(situacao.locator('[data-aprovacao="aprovada"]')).toContainText(new RegExp(`^Validação registrada por ${QUEM_DECIDE.nome} · \\d{2}/\\d{2}, \\d{2}h\\d{2}$`), { timeout: PRAZO_DA_TELA_MS })
    await expect(situacao).toBeFocused()
    await expect(barra).toHaveCount(0)
    await expect(principal(page)).not.toContainText(VOCABULARIO_DE_NOTA)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('rejeitar a correção exige justificativa; e a aprovação recusada porque o lote mudou vira aviso calmo, com a tela relida', async ({ page, hasTouch }) => {
    test.slow()
    const { api } = await entrar(page, hasTouch, { antes: (simulada, turma) => void comLote(simulada, turma) })
    const atividadeId = [...api.correcoes.keys()][0] ?? ''
    const lote = api.correcoes.get(atividadeId)
    if (lote === undefined) throw new Error('faltou o lote')
    // Todos os destaques já abertos: a aprovação está liberada.
    api.correcoes.set(atividadeId, { ...lote, destaques: lote.destaques.map((destaque) => ({ ...destaque, abertoEm: '2026-10-05T14:10:00.000Z' })), destaquesAbertos: 2, podeAprovar: true })
    await irPara(page, `/professor/aprovar/${atividadeId}`)
    const barra = page.getByRole('group', { name: 'Aprovação do lote' })
    const aprovar = barra.getByRole('button', { name: 'Aprovar 28 correções' })
    await expect(aprovar).toBeEnabled({ timeout: PRAZO_DA_TELA_MS })

    // O lote mudou desde a leitura: a API recusa com conflito, e a tela relê e pede para conferir de novo, sem erro cru.
    api.trocar('aprovarLote', () => erroDaApi(409, 'CONFLITO'))
    await acionar(aprovar, hasTouch)
    await acionar(page.getByRole('alertdialog').getByRole('button', { name: 'Aprovar 28 correções' }), hasTouch)
    await expect(page.getByRole('alertdialog')).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    await expect(principal(page).getByRole('status').filter({ hasText: 'A correção mudou desde que você abriu esta tela, e nada foi aprovado.' })).toBeVisible()
    await expect(principal(page).getByRole('alert')).toHaveCount(0)
    await expect(principal(page)).not.toContainText('CONFLITO')
    // O lote continua pendente e liberado: o foco volta ao botão que abriu o diálogo, e não se perde no `body`.
    await expect(page.locator('[data-situacao-do-lote="pendente"]')).toBeVisible()
    await expect(aprovar).toBeFocused()
    api.trocar('aprovarLote')

    // Rejeitar é `perigo`, e pede a justificativa antes de mandar.
    await acionar(barra.getByRole('button', { name: 'Rejeitar…' }), hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Rejeitar a correção' })
    await expect(dialogo).toContainText('Nenhum aluno recebe o diagnóstico desta correção.')
    await acionar(dialogo.getByRole('button', { name: 'Rejeitar a correção' }), hasTouch)
    await expect(dialogo.getByText('Escreva pelo menos 8 caracteres.')).toBeVisible()
    expect(api.pedidosEm(/decidir$/)).toHaveLength(0)
    await dialogo.getByLabel(/Por que você está rejeitando\?/).fill('O gabarito da questão 2 está errado.')
    await acionar(dialogo.getByRole('button', { name: 'Rejeitar a correção' }), hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    expect(api.pedidosEm(/decidir$/).map((pedido) => pedido.corpo)).toEqual([{ decisao: 'rejeitar', justificativa: 'O gabarito da questão 2 está errado.' }])
    const situacao = page.locator('[data-situacao-do-lote="rejeitada"]')
    await expect(situacao.locator('[data-aprovacao="rejeitada"]')).toContainText(`${QUEM_DECIDE.nome} rejeitou`, { timeout: PRAZO_DA_TELA_MS })
    await expect(situacao.locator('[data-aprovacao="rejeitada"]')).toContainText('Motivo: O gabarito da questão 2 está errado.')
    await expect(barra).toHaveCount(0)
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Sem a leitura das entregas, a decisão só é afirmada com quem decidiu: a tela diz onde ver, pelo sino, sem "Seu time".
    api.entregas = []
    await recarregar(page)
    await expect(principal(page)).toContainText('Esta correção foi rejeitada. Quem rejeitou e por quê está em “O que o Assistente fez”, pelo sino.', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    const decidida = api.correcoes.get(atividadeId)
    if (decidida === undefined) throw new Error('faltou o lote')
    api.correcoes.set(atividadeId, { ...decidida, entrega: { ...decidida.entrega, estado: 'aprovada' } })
    await recarregar(page)
    await expect(principal(page)).toContainText('Esta correção já foi decidida. A decisão está em “O que o Assistente fez”, pelo sino.', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
  })
})
