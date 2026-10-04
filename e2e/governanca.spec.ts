import type { Locator, Page, Route } from '@playwright/test'
import { entrarComoCoordenacaoNaMesmaAba, esperarGovernanca, irPelaNavegacao, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { auditoriasNoBanco, montarEscolaComEntregas, suspensoesNoBanco, type EscolaComEntregas } from './__fixtures__/governanca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { criarEquipeComSenha, type EquipeDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A governança e o Analista da coordenação (MVP, A5; `docs/interface.md` 11.7; D9, D45, D60, D64; regra 70, itens 5, 6,
 * 8 e 9), contra a API real com o adaptador falso, nos projetos `chromebook` e `celular`. É o passo 5 do roteiro: a
 * escola já tem entregas (`montarEscolaComEntregas`), e a coordenação abre em Governança.
 */

const INDISPONIVEL = JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })
const COLUNAS = ['O que foi gerado', 'Agente e função', 'Série', 'Gerado em', 'Decisão']

const principal = (page: Page) => page.getByRole('main')
const dialogo = (page: Page) => page.getByRole('alertdialog')
/** O cartão do número de painel: o pai do rótulo. */
const numero = (page: Page, rotulo: string) => principal(page).getByText(rotulo, { exact: true }).first().locator('..')

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

function portao(): { aberta: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

interface Cenario {
  readonly coordenadora: EquipeDeTeste
  readonly escola: EscolaComEntregas | undefined
}

/** A coordenadora entra e cai na Governança. Com `comEntregas`, a escola já tem o que o roteiro deixa até o passo 4. */
async function entrar(page: Page, hasTouch: boolean, comEntregas = true): Promise<Cenario> {
  const coordenadora = await criarEquipeComSenha('coordenador')
  const escola = comEntregas ? await montarEscolaComEntregas(coordenadora.escolaId, coordenadora.usuarioId) : undefined
  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
  await esperarGovernanca(page)
  return { coordenadora, escola }
}

test.describe('Governança de IA', () => {
  test('a coordenação abre em Governança e vê o que a IA gerou e se uma pessoa aprovou, sem professor, e o consumo em tokens', async ({ page, hasTouch }) => {
    const { escola } = await entrar(page, hasTouch)
    if (escola === undefined) throw new Error('escola sem entregas')
    await expect(page).toHaveTitle('Governança · Turmma')
    // Três artefatos (duas listas e uma versão adaptada) e dois lotes; dois aprovados, um esperando.
    await expect(numero(page, 'Gerado por IA')).toContainText('5', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(numero(page, 'Aprovado por gente')).toContainText('2')
    await expect(numero(page, 'Esperando o professor')).toContainText('1')
    await expect(numero(page, 'Rejeitado')).toContainText('0')

    const tabela = principal(page).getByRole('region', { name: 'O que a IA gerou e quem aprovou' }).first()
    await expect(tabela).toContainText('Correção de objetiva de uma turma')
    await expect(tabela).toContainText('Assistente de ensino · Adaptação')
    await expect(tabela).toContainText(escola.serieNome)
    await expect(tabela).toContainText('Aprovado por um professor')
    await expect(tabela).toContainText('Esperando o professor')
    // Estado nunca só em cor: o selo diz o estado em texto, na família dele.
    await expect(tabela.locator('[data-estado="ok"]').first()).toContainText('Aprovado por')
    await expect(tabela.locator('[data-estado="pendente"]').first()).toContainText('Esperando o professor')
    // Nenhuma coluna, filtro ou ordenação por professor (D45, D64). No computador é tabela; no celular, lista.
    if (!hasTouch) await expect(principal(page).getByRole('columnheader')).toHaveText(COLUNAS)
    await expect(principal(page).getByRole('columnheader', { name: /professor/i })).toHaveCount(0)
    await expect(principal(page).getByRole('combobox')).toHaveCount(0)
    // Nenhum nome de professor nem de aluno, nem turma, em lugar nenhum da tela.
    for (const nome of [...Object.values(escola.professoras), escola.aluno, escola.turmas.doB.nome, escola.turmas.doC.nome]) await expect(principal(page)).not.toContainText(nome)

    const consumo = principal(page).getByRole('region', { name: 'Consumo do mês por função' })
    await expect(consumo).toContainText('Assistente de ensino · Conversa e ferramentas')
    await expect(consumo).toContainText('1.500 tokens · 2 execuções')
    await expect(consumo).toContainText('Tutor · Tutor com o aluno')
    await expect(consumo).toContainText('não é medido')
    await expect(consumo).not.toContainText('R$')

    // Um botão de decisão oficial só, à parte, para o dado nominal.
    await expect(principal(page).getByRole('button', { name: 'Abrir dado nominal de uma turma' })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('o pedido de dado nominal avisa da auditoria antes, pede turma e finalidade, e grava uma auditoria por leitura', async ({ page, hasTouch }) => {
    const { coordenadora, escola } = await entrar(page, hasTouch)
    if (escola === undefined) throw new Error('escola sem entregas')
    await acionar(principal(page).getByRole('button', { name: 'Abrir dado nominal de uma turma' }), hasTouch)
    await expect(dialogo(page)).toContainText('Esta abertura fica na auditoria da escola')
    const confirmar = dialogo(page).getByRole('button', { name: 'Abrir dado nominal' })
    // Sem turma e sem finalidade, não confirma.
    await expect(confirmar).toBeDisabled()
    await dialogo(page).getByLabel('Turma').selectOption({ label: `${escola.turmas.doB.nome} · ${escola.serieNome}` })
    await expect(confirmar).toBeDisabled()
    await dialogo(page).getByLabel('Finalidade').selectOption({ label: 'Conversa pedagógica com o professor, a pedido dele' })
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    // Cancelar não lê nada.
    await acionar(dialogo(page).getByRole('button', { name: 'Cancelar' }), hasTouch)
    expect(await auditoriasNoBanco(coordenadora.escolaId, 'analista.nominal_lido')).toEqual([])

    await acionar(principal(page).getByRole('button', { name: 'Abrir dado nominal de uma turma' }), hasTouch)
    await dialogo(page).getByLabel('Turma').selectOption({ label: `${escola.turmas.doB.nome} · ${escola.serieNome}` })
    await dialogo(page).getByLabel('Finalidade').selectOption({ label: 'Conversa pedagógica com o professor, a pedido dele' })
    await acionar(dialogo(page).getByRole('button', { name: 'Abrir dado nominal' }), hasTouch)
    const dado = principal(page).getByRole('region', { name: `Dado nominal da turma ${escola.turmas.doB.nome}` })
    await expect(dado).toContainText('Esta abertura foi registrada na auditoria da escola.', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dado).toContainText(escola.professoras.quimicaDoB)
    await expect(dado).toContainText(escola.professoras.fisicaDoB)
    await expect(dado).not.toContainText(escola.aluno)
    expect(await auditoriasNoBanco(coordenadora.escolaId, 'analista.nominal_lido')).toEqual([
      { autor: coordenadora.usuarioId, entidadeId: escola.turmas.doB.id, finalidade: 'conversa_pedagogica_a_pedido_do_professor' },
    ])
    await acionar(dado.getByRole('button', { name: 'Fechar dado nominal' }), hasTouch)
    await expect(dado).toHaveCount(0)
  })

  test('os quatro estados: carregando, erro com "Tentar de novo", com dado, e a escola sem nada gerado explica o que vai aparecer', async ({ page, hasTouch }) => {
    const segurada = portao()
    let falhar = true
    await page.route(
      (url) => url.pathname === '/v1/governanca/resumo',
      async (rota: Route) => {
        await segurada.aberta
        if (falhar) return rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL })
        return rota.continue()
      },
    )
    const coordenadora = await criarEquipeComSenha('coordenador')
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await expect(principal(page).getByRole('status').filter({ hasText: 'Carregando a governança…' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    segurada.abrir()
    await expect(principal(page).getByRole('alert').filter({ hasText: 'O sistema está indisponível no momento. Tente de novo em instantes.' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(await violacoesGraves(page)).toEqual([])
    falhar = false
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    // Vazio: a escola ainda não tem nada gerado, e a tela diz o que vai aparecer ali.
    await expect(principal(page)).toContainText('A IA ainda não gerou nada nesta escola', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).toContainText('primeiro esperando o professor e depois com a decisão dele')
    await expect(principal(page)).toContainText('Nenhuma função trabalhou neste mês')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})

test.describe('Agentes', () => {
  test('três cartões com as funções; suspender a correção de objetiva pelo diálogo e retomar, com o registro no banco', async ({ page, hasTouch }) => {
    const { coordenadora } = await entrar(page, hasTouch, false)
    await irPelaNavegacao(page, 'Agentes', hasTouch)
    await expect(page).toHaveURL(/\/coordenacao\/agentes$/)
    for (const agente of ['Assistente de ensino', 'Tutor', 'Analista de desempenho escolar']) await expect(principal(page).getByRole('heading', { level: 2, name: agente })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const correcao = principal(page).locator('[data-funcao="correcao_de_objetiva"]')
    await expect(correcao).toContainText('Faz sozinha')
    await expect(correcao).toContainText('Espera aprovação')
    await expect(correcao).toContainText('Alto risco')
    await expect(correcao).toContainText('Funcionando')
    await expect(principal(page).getByRole('region', { name: 'O que a IA nunca faz' })).toContainText('redação e discursiva')
    expect(await violacoesGraves(page)).toEqual([])

    await acionar(correcao.getByRole('button', { name: 'Suspender a função Correção de objetiva' }), hasTouch)
    await expect(dialogo(page)).toContainText('deixa de aceitar pedido novo')
    await expect(dialogo(page)).toContainText('continua podendo ser aprovado ou rejeitado')
    await expect(dialogo(page)).toContainText('auditoria')
    await dialogo(page).getByLabel('Motivo').selectOption({ label: 'A escola está revendo o uso pedagógico' })
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(dialogo(page).getByRole('button', { name: 'Suspender Correção de objetiva' }), hasTouch)
    await expect(dialogo(page)).toHaveCount(0)
    await expect(correcao).toContainText('Suspensa nesta escola desde', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(correcao).toContainText('Motivo: A escola está revendo o uso pedagógico')
    await expect(principal(page).getByRole('status').filter({ hasText: 'A função "Correção de objetiva" está suspensa nesta escola.' })).toBeVisible()
    // Só ela: a Adaptação, do mesmo agente, continua.
    await expect(principal(page).locator('[data-funcao="adaptacao"]')).toContainText('Funcionando')
    expect(await suspensoesNoBanco(coordenadora.escolaId, 'correcao_de_objetiva')).toEqual([{ suspensaPor: coordenadora.usuarioId, motivo: 'revisao_pedagogica', retomada: false }])

    await acionar(correcao.getByRole('button', { name: 'Retomar a função Correção de objetiva' }), hasTouch)
    await expect(correcao).toContainText('Funcionando', { timeout: PRAZO_DA_ENTRADA_MS })
    expect(await suspensoesNoBanco(coordenadora.escolaId, 'correcao_de_objetiva')).toEqual([{ suspensaPor: coordenadora.usuarioId, motivo: 'revisao_pedagogica', retomada: true }])
    expect((await auditoriasNoBanco(coordenadora.escolaId, 'funcao.suspensa')).map((registro) => registro.autor)).toEqual([coordenadora.usuarioId])
    expect((await auditoriasNoBanco(coordenadora.escolaId, 'funcao.retomada')).map((registro) => registro.autor)).toEqual([coordenadora.usuarioId])
    expect(await larguraExcedente(page)).toBe(0)
  })
})

test.describe('Analista', () => {
  test('gera o resumo: o alerta é hipótese com contexto, e o recorte de um professor só aparece sem número', async ({ page, hasTouch }) => {
    const { escola } = await entrar(page, hasTouch)
    if (escola === undefined) throw new Error('escola sem entregas')
    await irPelaNavegacao(page, 'Analista', hasTouch)
    await expect(page).toHaveURL(/\/coordenacao\/analista$/)
    // Vazio: nenhum resumo gerado ainda.
    await expect(principal(page)).toContainText('Nenhum resumo gerado ainda', { timeout: PRAZO_DA_ENTRADA_MS })
    expect(await violacoesGraves(page)).toEqual([])

    await acionar(principal(page).getByRole('button', { name: 'Gerar resumo' }), hasTouch)
    const resumo = principal(page).locator('[data-resumo-do-analista]')
    await expect(resumo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('button', { name: 'Gerar resumo' })).toBeEnabled()

    const alerta = resumo.locator('[data-alerta="habilidade_com_acerto_baixo"]')
    await expect(alerta).toHaveCount(1)
    await expect(alerta).toContainText(`Em ${escola.serieNome} · Química, o acerto em "Identificar o reagente limitante" (QUI.EM.06) ficou em 50%, abaixo da referência de 60%.`)
    await expect(alerta).toContainText('Hipóteses a conferir')
    await expect(resumo).toContainText('É uma hipótese a conferir, não uma conclusão')
    // Química tem duas professoras: tem número. Física, uma só: aparece sem número, dito como tal.
    await expect(resumo.getByRole('region', { name: `${escola.serieNome} · Química` })).toContainText('2 professores no recorte')
    const semNumero = resumo.locator('[data-recorte-nominal]')
    await expect(semNumero).toHaveCount(1)
    await expect(semNumero).toContainText(`${escola.serieNome} · Física`)
    await expect(semNumero).toContainText('Menos de dois professores')
    await expect(resumo.getByRole('region', { name: `${escola.serieNome} · Física` })).toHaveCount(0)
    // Nenhum nome de professor nem de aluno no agregado.
    for (const nome of [...Object.values(escola.professoras), escola.aluno, escola.turmas.doB.nome]) await expect(principal(page)).not.toContainText(nome)
    // O dado nominal também está aqui, à parte, com o mesmo aviso.
    await acionar(principal(page).getByRole('button', { name: 'Abrir dado nominal de uma turma' }), hasTouch)
    await expect(dialogo(page)).toContainText('Esta abertura fica na auditoria da escola')
    await acionar(dialogo(page).getByRole('button', { name: 'Cancelar' }), hasTouch)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
