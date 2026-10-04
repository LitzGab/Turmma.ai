import { randomUUID } from 'node:crypto'
import type { Locator, Page } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import {
  ALUNOS_DO_LOTE,
  atividadeSintetica,
  desempenhoSintetico,
  entregaDoLote,
  erroDaApi,
  loteSintetico,
  portao,
  QUEM_DECIDE,
  simularAssistente,
  versaoAdaptada,
  type ApiDoAssistente,
} from './__fixtures__/assistente.ts'
import { abrirNavegacao, entrarPorEmail, esperarNovaConversa, lateral, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { confirmarVinculosNoBanco, criarAlocacaoDoProfessor, criarEquipeComSenha } from './__fixtures__/sessao.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As telas do professor da fase 3 (A3 e A4, pacote W): aplicar e encerrar a atividade, **aprovar a correção**, o lote e o
 * Tutor no Seu time, e a turma aberta com a Visão Geral. Os estados de cada tela, com a API destas telas simulada na
 * página (`__fixtures__/assistente.ts`); o fluxo de verdade, contra a API real, está em `a3-a4-professor.spec.ts`.
 */

const PRAZO_DA_TELA_MS = 15_000
/** A tela inteira não fala em nota: é diagnóstico (D46). */
const VOCABULARIO_DE_NOTA = /\bnotas?\b|\bconceitos?\b|pontuaç/i

interface Cena {
  readonly api: ApiDoAssistente
  readonly turmaId: string
  readonly turmaNome: string
  readonly disciplinaId: string
}

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  await (hasTouch ? alvo.tap() : alvo.click())
}

async function irPara(page: Page, caminho: string): Promise<void> {
  await page.evaluate((destino) => {
    window.history.pushState(null, '', destino)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, caminho)
}

/** A professora entra, com a turma de Química confirmada (de verdade) e a API da fase 3 simulada. `antes` monta o que a escola já tinha. */
async function entrar(page: Page, hasTouch: boolean, antes?: (api: ApiDoAssistente, turmaId: string) => void): Promise<Cena> {
  const api = await simularAssistente(page)
  const professora = await criarEquipeComSenha()
  const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['Química'])
  await confirmarVinculosNoBanco(professora.escolaId, alocacao.vinculoIds)
  antes?.(api, alocacao.turmaId)
  await page.goto('/entrar')
  const vinculos = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/meus-vinculos' && resposta.ok())
  await entrarPorEmail(page, professora, hasTouch)
  await esperarNovaConversa(page, professora.nome)
  const { itens } = (await (await vinculos).json()) as { itens: { disciplina?: { id: string } }[] }
  return { api, turmaId: alocacao.turmaId, turmaNome: alocacao.turmaNome, disciplinaId: itens[0]?.disciplina?.id ?? randomUUID() }
}

const principal = (page: Page) => page.getByRole('main')

test.describe('aplicar à turma e encerrar, no artefato (A3)', () => {
  test('aplicar pede a escolha "é avaliativa?" e diz o que acontece com o Tutor; a atividade fica atribuída; encerrar diz o que acontece, e a correção fica para revisar', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaId, turmaNome, disciplinaId } = await entrar(page, hasTouch)
    const atividade = atividadeSintetica(turmaId, disciplinaId)
    const pendente = versaoAdaptada(atividade)
    api.artefatos = [atividade, pendente.artefato]
    api.entregas = [pendente.entrega]
    api.loteAoEncerrar = loteSintetico

    // A versão adaptada que ainda espera a aprovação não vai à turma: a tela diz por quê, e não oferece o botão.
    await irPara(page, `/professor/artefatos/${pendente.artefato.id}`)
    const naTurma = page.locator('[data-aplicacao-do-artefato]')
    await expect(naTurma).toContainText('Esta versão adaptada só pode ser aplicada à turma depois que você aprovar.', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('button', { name: 'Aplicar à turma' })).toHaveCount(0)

    // Carregando e com falha, a seção não afirma que a atividade não foi aplicada, nem oferece "Aplicar à turma".
    const segura = portao()
    api.trocar('aplicadas', async () => {
      await segura.aberta
      return erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO')
    })
    // A recarga esquece a lista que a versão adaptada já leu (é a mesma turma), e a tela lê de novo.
    await page.reload()
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeAttached({ timeout: PRAZO_DA_TELA_MS })
    await irPara(page, `/professor/artefatos/${atividade.id}`)
    await expect(naTurma.getByText('Carregando as aplicações desta atividade…')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(naTurma).not.toContainText('ainda não foi aplicada')
    await expect(page.getByRole('button', { name: 'Aplicar à turma' })).toHaveCount(0)
    segura.abrir()
    await expect(naTurma.getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    await expect(naTurma).not.toContainText('ainda não foi aplicada')
    await expect(page.getByRole('button', { name: 'Aplicar à turma' })).toHaveCount(0)
    api.trocar('aplicadas')
    await acionar(naTurma.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(naTurma).toContainText('Esta atividade ainda não foi aplicada.', { timeout: PRAZO_DA_TELA_MS })
    const aplicar = page.getByRole('button', { name: 'Aplicar à turma' })
    // Decisão da professora, registrada: o botão é o preto. O ponteiro sai de cima dele: o "Tentar de novo" estava ali.
    if (!hasTouch) await page.mouse.move(0, 0)
    expect(await aplicar.evaluate((botao) => getComputedStyle(botao).backgroundColor)).toBe('rgb(13, 13, 13)')
    await acionar(aplicar, hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Aplicar à turma' })
    await expect(dialogo).toContainText(atividade.titulo)
    await expect(dialogo).toContainText(turmaNome)
    await expect(dialogo).toContainText('Os alunos da turma passam a ver a atividade e podem responder.')
    // As duas escolhas dizem o que acontece com o Tutor, e nenhuma vem marcada.
    await expect(dialogo.getByRole('radio')).toHaveCount(2)
    await expect(dialogo.getByRole('radio', { checked: true })).toHaveCount(0)
    await expect(dialogo).toContainText('O Tutor continua disponível para a turma, conduzindo por perguntas.')
    await expect(dialogo).toContainText('O Tutor fica pausado para a turma até você encerrar a atividade.')
    // Sem escolher, nada é aplicado.
    await acionar(dialogo.getByRole('button', { name: 'Aplicar à turma' }), hasTouch)
    await expect(dialogo.getByText('Escolha se a atividade é prática ou avaliativa.')).toBeVisible()
    expect(api.pedidosEm(/atividades-aplicadas$/)).toHaveLength(0)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    await dialogo.getByRole('radio', { name: /^É avaliativa/ }).check()
    await acionar(dialogo.getByRole('button', { name: 'Aplicar à turma' }), hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    expect(api.pedidosEm(/atividades-aplicadas$/).map((pedido) => pedido.corpo)).toEqual([{ artefatoId: atividade.id, turmaId, avaliativa: true }])
    const aplicada = naTurma.locator('[data-atividade-aplicada="aberta"]')
    await expect(aplicada).toContainText('Aberta para a turma · avaliativa · 0 de 30 alunos enviaram', { timeout: PRAZO_DA_TELA_MS })
    await expect(aplicada).toContainText('É avaliativa: o Tutor está pausado para a turma até você encerrar.')
    // Aberta para a turma, não se aplica de novo.
    await expect(page.getByRole('button', { name: 'Aplicar à turma' })).toHaveCount(0)
    await expect(naTurma).toBeFocused()

    // Encerrar diz o que vai acontecer antes de confirmar.
    await acionar(aplicada.getByRole('button', { name: 'Encerrar a atividade' }), hasTouch)
    const encerrar = page.getByRole('alertdialog', { name: 'Encerrar a atividade' })
    await expect(encerrar).toContainText('As respostas param agora')
    await expect(encerrar).toContainText('a correção fica esperando você revisar e aprovar')
    await expect(encerrar).toContainText('0 de 30 alunos')
    expect(api.pedidosEm(/encerrar$/)).toHaveLength(0)
    await acionar(encerrar.getByRole('button', { name: 'Encerrar a atividade' }), hasTouch)
    await expect(encerrar).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    const encerrada = naTurma.locator('[data-atividade-aplicada="encerrada"]')
    await expect(encerrada).toContainText('Encerrada · avaliativa', { timeout: PRAZO_DA_TELA_MS })
    await expect(encerrada.getByRole('button', { name: 'Encerrar a atividade' })).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(encerrada.getByRole('link', { name: 'Revisar a correção' }), hasTouch)
    await expect(page).toHaveURL(/\/professor\/aprovar\/[0-9a-f-]+$/)
  })

  test('com a correção suspensa pela escola, a atividade encerra sem corrigir, e a tela diz por quê e como pedir a correção de novo', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaId, disciplinaId } = await entrar(page, hasTouch)
    const atividade = atividadeSintetica(turmaId, disciplinaId)
    api.artefatos = [atividade]
    api.aplicadas = [
      { id: randomUUID(), artefatoId: atividade.id, turmaId, titulo: atividade.titulo, avaliativa: false, estado: 'aberta', questoes: 2, aplicadaEm: '2026-10-05T13:00:00.000Z', encerradaEm: null, participacao: { alunos: 30, iniciaram: 12, enviaram: 10 }, entrega: null },
    ]
    await irPara(page, `/professor/artefatos/${atividade.id}`)
    const naTurma = page.locator('[data-aplicacao-do-artefato]')
    await expect(naTurma).toContainText('Aberta para a turma · prática · 10 de 30 alunos enviaram', { timeout: PRAZO_DA_TELA_MS })
    await acionar(naTurma.getByRole('button', { name: 'Encerrar a atividade' }), hasTouch)
    await acionar(page.getByRole('alertdialog').getByRole('button', { name: 'Encerrar a atividade' }), hasTouch)
    const semCorrecao = naTurma.locator('[data-sem-correcao="correcao_suspensa"]')
    await expect(semCorrecao).toContainText('a coordenação suspendeu a correção de objetiva nesta escola', { timeout: PRAZO_DA_TELA_MS })
    await expect(naTurma.getByRole('link', { name: 'Revisar a correção' })).toHaveCount(0)
    await expect(principal(page).getByRole('alert')).toHaveCount(0)
    // A função volta: "Corrigir de novo" encerra de novo, e agora a correção nasce.
    api.loteAoEncerrar = loteSintetico
    await acionar(naTurma.getByRole('button', { name: 'Corrigir de novo' }), hasTouch)
    await expect(naTurma.getByRole('link', { name: 'Revisar a correção' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(naTurma.getByRole('status')).toHaveText('Correção feita. Ela está esperando você revisar.')
    expect(api.pedidosEm(/encerrar$/)).toHaveLength(2)
    expect(await violacoesGraves(page)).toEqual([])
  })
})

/** Uma atividade encerrada, com o lote de correção pendente e a entrega dele no Seu time. */
function comLote(api: ApiDoAssistente, turmaId: string): { atividadeId: string; titulo: string } {
  const aplicada = { id: randomUUID(), titulo: 'Atividade de estequiometria' }
  const lote = loteSintetico(aplicada)
  api.correcoes.set(aplicada.id, lote)
  api.entregas = [entregaDoLote(lote, turmaId)]
  api.aplicadas = [
    { id: aplicada.id, artefatoId: randomUUID(), turmaId, titulo: aplicada.titulo, avaliativa: true, estado: 'encerrada', questoes: 2, aplicadaEm: '2026-10-05T13:00:00.000Z', encerradaEm: '2026-10-05T13:50:00.000Z', participacao: { alunos: 30, iniciaram: 28, enviaram: 26 }, entrega: lote.entrega },
  ]
  return { atividadeId: aplicada.id, titulo: aplicada.titulo }
}

test.describe('aprovar a correção (11.5)', () => {
  test('carregando, erro e a correção que não existe; e, com dado, o resumo assinado pela IA, sem falar em nota', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaNome } = await entrar(page, hasTouch, (simulada, turma) => void comLote(simulada, turma))
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
    api.trocar('correcao')
    // Sai e volta: a tela de aprovar só desmonta quando a outra aparece, e é a volta que relê a correção.
    await irPara(page, '/professor/time/assistente')
    await expect(page.getByRole('heading', { level: 1, name: 'Seu time: Assistente de ensino' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await irPara(page, `/professor/aprovar/${atividadeId}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Revisar a correção' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page).toHaveTitle('Revisar a correção · Turmma')
    await expect(principal(page)).toContainText(`Atividade de estequiometria · ${turmaNome}`)
    // A correção é saída de IA: a função assina, com o selo.
    await expect(page.getByText('Assistente · correção de objetiva')).toBeVisible()
    await expect(principal(page).locator('[data-selo-ia]')).toHaveCount(1)
    await expect(principal(page)).toContainText('28 de 30 alunos')
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
    const { api, turmaNome } = await entrar(page, hasTouch, (simulada, turma) => void comLote(simulada, turma))
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
    expect(await aprovar.evaluate((botao) => getComputedStyle(botao).backgroundColor)).toBe('rgb(13, 13, 13)')

    // A confirmação diz a atividade, a turma, quantas correções, e que o diagnóstico chega aos alunos.
    await acionar(aprovar, hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Aprovar 28 correções' })
    await expect(dialogo).toContainText('Atividade de estequiometria')
    await expect(dialogo).toContainText(turmaNome)
    await expect(dialogo).toContainText('28 de 30 alunos')
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
    const { api } = await entrar(page, hasTouch, (simulada, turma) => void comLote(simulada, turma))
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
    expect(await violacoesGraves(page)).toEqual([])
  })
})

test.describe('Seu time com a correção e o Tutor (11.4)', () => {
  test('o lote de correção espera a professora com "Revisar", que leva à tela de aprovar: não se aprova de dentro do balão; e a Home aponta para a mesma tela', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaNome } = await entrar(page, hasTouch, (simulada, turma) => void comLote(simulada, turma))
    const atividadeId = [...api.correcoes.keys()][0] ?? ''
    // A Home: "Esperando você" com o lote, e "Revisar".
    const esperando = page.locator('[data-esperando-voce]')
    await expect(esperando).toContainText('Correção de objetiva', { timeout: PRAZO_DA_TELA_MS })
    await expect(esperando).toContainText(`Atividade de estequiometria · ${turmaNome}`)
    await expect(esperando).toContainText('Revisar')

    await irPara(page, '/professor/time/assistente')
    const lote = page.locator('[data-entrega="pendente"]')
    await expect(lote).toContainText(`Corrigi "Atividade de estequiometria" da turma ${turmaNome}. O diagnóstico só chega aos alunos depois que você revisar os destaques e aprovar.`, { timeout: PRAZO_DA_TELA_MS })
    await expect(lote.getByText('Assistente · correção de objetiva')).toBeVisible()
    await expect(lote.locator('[data-selo-ia]')).toHaveCount(1)
    await expect(lote.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você')
    // Nenhum botão de decidir no balão: a decisão do lote é na tela dos destaques.
    await expect(lote.getByRole('button')).toHaveCount(0)
    // A aba "Correção" tem conteúdo.
    await acionar(page.getByRole('tab', { name: 'Correção' }), hasTouch)
    await expect(page.locator('[data-entrega]')).toHaveCount(1)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(lote.getByRole('link', { name: /^Revisar/ }), hasTouch)
    await expect(page).toHaveURL(new RegExp(`/professor/aprovar/${atividadeId}$`))
    await expect(page.getByRole('group', { name: 'Aprovação do lote' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
  })

  test('o Tutor na lateral, sem contador; a conversa dele mostra sinais e uso da turma, a atenção humana à parte e sem conteúdo, e nada abre a conversa de um aluno', async ({ page, hasTouch }) => {
    test.slow()
    const atividade = { id: randomUUID(), titulo: 'Atividade de estequiometria' }
    const [ana, bruno, caio] = ALUNOS_DO_LOTE.map((aluno) => ({ id: aluno.alunoId, nome: aluno.nome }))
    if (ana === undefined || bruno === undefined || caio === undefined) throw new Error('faltou aluno sintético')
    const { api, turmaId } = await entrar(page, hasTouch)

    await abrirNavegacao(page, hasTouch)
    const time = lateral(page).getByRole('navigation', { name: 'Seu time' })
    await expect(time.getByRole('link')).toHaveText([/^Assistente de ensino/, /^Tutor$/])
    await acionar(time.getByRole('link', { name: 'Tutor' }), hasTouch)
    await expect(page).toHaveURL(/\/professor\/time\/tutor$/)
    await expect(page).toHaveTitle('Tutor · Turmma', { timeout: PRAZO_DA_TELA_MS })

    // Sem sinal e sem uso, a tela não fica vazia: diz o que o Tutor avisa, e que ninguém usou ainda.
    await expect(page.getByText('Nenhum sinal desta turma ainda')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Nenhum aluno desta turma usou o Tutor ainda')).toBeVisible()
    await expect(principal(page).locator('[data-selo-ia]')).toHaveCount(1)
    expect(await violacoesGraves(page)).toEqual([])

    // A turma passa a ter atividade, sinais e uso; e a leitura dos sinais falha: a mensagem e "Tentar de novo".
    api.aplicadas = [{ id: atividade.id, artefatoId: randomUUID(), turmaId, titulo: atividade.titulo, avaliativa: false, estado: 'aberta', questoes: 5, aplicadaEm: '2026-10-05T13:00:00.000Z', encerradaEm: null, participacao: { alunos: 30, iniciaram: 20, enviaram: 3 }, entrega: null }]
    api.sinais = {
      itens: [
        { id: randomUUID(), tipo: 'atencao_humana', aluno: caio, criadoEm: '2026-10-05T13:40:00.000Z' },
        { id: randomUUID(), tipo: 'travou', aluno: ana, atividadeAplicadaId: atividade.id, questao: 3, materialId: null, pagina: null, criadoEm: '2026-10-05T13:20:00.000Z' },
        { id: randomUUID(), tipo: 'resposta_pronta', aluno: bruno, atividadeAplicadaId: atividade.id, questao: 1, materialId: null, pagina: null, criadoEm: '2026-10-05T13:25:00.000Z' },
      ],
      grupos: [{ tipo: 'travou', atividadeAplicadaId: atividade.id, questao: 3, alunos: 8 }],
    }
    api.uso = {
      turmaId,
      limiteDoDia: 60,
      trocasDaTurmaNoMes: 412,
      pacoteDaTurmaNoMes: 9000,
      alunos: [
        { aluno: ana, trocasHoje: 12, ultimaTrocaEm: '2026-10-05T13:42:00.000Z', ultimaReferencia: { atividadeAplicadaId: atividade.id, questao: 3, materialId: null, pagina: null } },
        { aluno: bruno, trocasHoje: 2, ultimaTrocaEm: '2026-10-05T13:26:00.000Z', ultimaReferencia: { atividadeAplicadaId: null, questao: null, materialId: null, pagina: null } },
      ],
    }
    api.trocar('sinais', () => erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO'))
    await page.reload()
    await expect(page.getByRole('region', { name: 'Sinais da turma' }).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })

    // Com dado.
    api.trocar('sinais')
    await acionar(page.getByRole('region', { name: 'Sinais da turma' }).getByRole('button', { name: 'Tentar de novo' }), hasTouch)

    // A atenção humana vem à parte, no alto: quem e quando, sem conteúdo e sem caminho para conversa.
    const atencao = page.locator('[data-atencao-humana]')
    await expect(atencao).toContainText('Um aluno precisa de um adulto', { timeout: PRAZO_DA_TELA_MS })
    await expect(atencao).toContainText('Caio Sintético · 05/10, 10h40')
    await expect(atencao).toContainText('O que foi dito não aparece aqui')
    await expect(atencao.getByRole('link')).toHaveCount(0)
    await expect(atencao.getByRole('button')).toHaveCount(0)

    // O grupo, sem nome de ninguém, assinado pela função do Tutor; e os sinais por aluno, com a questão.
    const sinais = page.getByRole('region', { name: 'Sinais da turma' })
    await expect(sinais.getByRole('log')).toContainText('8 alunos travaram na questão 3 de "Atividade de estequiometria".')
    await expect(sinais.getByRole('log').getByText('Tutor · sinais para o professor')).toBeVisible()
    await expect(sinais).toContainText('Travou na questão 3 de "Atividade de estequiometria"')
    await expect(sinais).toContainText('Pediu a resposta pronta na questão 1 de "Atividade de estequiometria"')
    // A atenção humana não se repete entre os sinais de trabalho.
    await expect(sinais).not.toContainText('Caio Sintético')

    // O uso: por aluno, as trocas de hoje, a hora da última troca como hora, e em que estava.
    const uso = page.getByRole('region', { name: 'Uso do Tutor pela turma' })
    await expect(uso).toContainText('412 de 9000')
    await expect(uso).toContainText('12 de 60')
    await expect(uso).toContainText('05/10, 10h42')
    await expect(uso).toContainText('Na questão 3 de "Atividade de estequiometria"')
    await expect(uso).toContainText('Sem atividade nem material')
    // Sem tempo relativo, sem ociosidade, sem lista de quem não usou.
    await expect(principal(page)).not.toContainText(/há \d+ (min|hora|segundo)|ocios|não usou|não usaram/i)
    // Nada nesta tela abre a conversa de um aluno: nos sinais e no uso não há link nem botão.
    await expect(sinais.getByRole('link')).toHaveCount(0)
    await expect(uso.getByRole('link')).toHaveCount(0)
    await expect(uso.getByRole('button')).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // O cabeçalho diz o que o Tutor faz sozinho, com o texto da API, e quando ele avisa.
    await acionar(page.getByText('O que o Tutor faz sozinho, e o que você vê aqui'), hasTouch)
    await expect(page.locator('[data-funcao="sinais_para_o_professor"]')).toBeVisible()
    await expect(principal(page)).toContainText('Travou: a quarta troca seguida na mesma questão ou página, no mesmo dia.')
    // A linha do Tutor na lateral não leva contador.
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seu time' }).getByRole('link', { name: 'Tutor' })).toHaveAccessibleName('Tutor')
  })
})

test.describe('a turma aberta: Visão Geral e Alunos (D69)', () => {
  test('sem correção aprovada, o vazio tracejado diz o que falta; com lote aprovado, o acerto por habilidade em barra neutra e os alunos em ordem de nome; e a aba Alunos continua com o acesso e os pedidos da A1', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaId } = await entrar(page, hasTouch)
    await irPara(page, `/professor/turmas/${turmaId}`)
    await expect(page.getByRole('tab')).toHaveText(['Visão Geral', 'Alunos'], { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('tab', { name: 'Visão Geral' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Ainda não há correção aprovada nesta turma')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Nenhuma atividade aplicada a esta turma')).toBeVisible()
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
    await expect(habilidades).toContainText('8 alunos abaixo da metade nesta habilidade.')
    await expect(habilidades).toContainText('Nenhum aluno abaixo da metade nesta habilidade.')
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
    // As atividades da turma, com o caminho para a correção.
    const atividades = page.getByRole('region', { name: 'Atividades da turma' })
    await expect(atividades).toContainText('Encerrada · avaliativa · 26 de 30 alunos enviaram')
    await expect(atividades.getByRole('link', { name: /^Revisar a correção/ })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
