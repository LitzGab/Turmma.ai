import type { Locator, Page } from '@playwright/test'
import { entregasNoBanco } from './__fixtures__/a2.ts'
import { abrirNavegacao, entrarComoCoordenacaoNaMesmaAba, entrarPorEmail, esperarEstrutura, esperarNovaConversa, irPelaNavegacao, lateral, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { CAMINHO_DO_PDF_DE_DEMONSTRACAO } from './__fixtures__/material.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { confirmarVinculosNoBanco, criarAlocacaoDoProfessor, criarCoordenadoraNaEscola, criarEquipeComSenha, type EquipeDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * **O fluxo da A2 de verdade** (`docs/mvp-rapido.md`, seção 1, passos 1 e 2), contra a API real e o adaptador falso, que
 * é o do ambiente de teste: a coordenação sobe o material com licença; a professora conversa com o Assistente de ensino,
 * responde à pergunta da D18, gera a atividade com a página citada, exporta o PDF, pede a versão adaptada pelo **tipo**
 * de adaptação e decide a entrega, que só vale com a decisão dela registrada.
 *
 * Nada aqui é simulado na página: os estados de cada tela, com a API simulada, estão em `professor-assistente.spec.ts`.
 */

/** A leitura do PDF e cada geração passam pela fila curta da API e pela consulta da execução, com a CPU ×4 do perfil. */
const PRAZO_DA_IA_MS = 45_000
const TITULO_DO_MATERIAL = 'Química 2, capítulo 7: Estequiometria'
const DISCIPLINA = 'Química'

interface Escola {
  readonly professora: EquipeDeTeste
  readonly turmaNome: string
}

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  await (hasTouch ? alvo.tap() : alvo.click())
}

const principal = (page: Page) => page.getByRole('main')
const caixa = (page: Page) => page.getByRole('textbox', { name: 'Pedido ao Assistente de ensino' })
const conversa = (page: Page) => page.getByRole('log', { name: 'Conversa com o Assistente de ensino' })

/**
 * A escola como a demonstração a encontra: a professora com a turma de Química confirmada (A1), e o material que a
 * **coordenação sobe pela tela**, com titularidade e licença declaradas (D75). Depois a coordenação sai, e a professora
 * entra na mesma aba, em "Nova conversa".
 */
async function montarEscolaEEntrar(page: Page, hasTouch: boolean): Promise<Escola> {
  const professora = await criarEquipeComSenha()
  const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, [DISCIPLINA])
  await confirmarVinculosNoBanco(professora.escolaId, alocacao.vinculoIds)
  const coordenadora = await criarCoordenadoraNaEscola(professora)

  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
  await esperarEstrutura(page)
  await irPelaNavegacao(page, 'Material', hasTouch)
  await expect(page).toHaveURL(/\/coordenacao\/material$/)
  await page.getByTestId('arquivo-do-material').setInputFiles(CAMINHO_DO_PDF_DE_DEMONSTRACAO)
  await principal(page).getByLabel('Título').fill(TITULO_DO_MATERIAL)
  await principal(page).getByLabel('Disciplina').selectOption({ label: DISCIPLINA })
  await principal(page).getByLabel('De quem é o material').selectOption({ label: 'Material próprio da escola' })
  await principal(page).getByLabel('Licença de uso (obrigatória)').selectOption({ label: 'Autoria da escola ou de professor dela' })
  await principal(page).getByLabel(/^Declaro que a escola pode usar este material/).check()
  await acionar(principal(page).getByRole('button', { name: 'Enviar material' }), hasTouch)
  const material = principal(page).getByRole('region', { name: 'Materiais da escola' }).getByRole('listitem').filter({ hasText: TITULO_DO_MATERIAL })
  await expect(material.getByText('Pronto · 6 páginas')).toBeVisible({ timeout: PRAZO_DA_IA_MS })

  // A coordenação sai, e a professora entra no mesmo computador.
  await acionar(page.getByRole('button', { name: 'Sair' }).first(), hasTouch)
  await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
  await entrarPorEmail(page, professora, hasTouch)
  await esperarNovaConversa(page, professora.nome)
  return { professora, turmaNome: alocacao.turmaNome }
}

/** Pede ao Assistente, pela caixa de pedido, e espera a pergunta da D18 sobre a atividade objetiva. */
async function pedirAtividade(page: Page, pedido: string, hasTouch: boolean): Promise<Locator> {
  await caixa(page).fill(pedido)
  await acionar(page.getByRole('button', { name: 'Enviar' }), hasTouch)
  await expect(page).toHaveURL(/\/professor\/conversa$/)
  // A fala dela, uma vez só (o "Você:" é o que o leitor de tela ouve antes da bolha).
  await expect(conversa(page).getByText(`Você: ${pedido}`)).toHaveCount(1, { timeout: PRAZO_DA_ENTRADA_MS })
  const escolha = conversa(page).getByRole('group', { name: /Quer que eu abra a ferramenta de atividade objetiva com 5 questões/ })
  await expect(escolha).toBeVisible({ timeout: PRAZO_DA_IA_MS })
  await expect(escolha.getByRole('button')).toHaveText([/^Usar a ferramenta Atividade objetiva/, /^Só conversar/])
  return escolha
}

/** Gera a atividade de estequiometria pelo formulário da ferramenta, com a turma já escolhida, e espera o resultado. */
async function gerarAtividade(cartao: Locator, hasTouch: boolean, questoes: string): Promise<void> {
  await cartao.getByLabel('Tema').fill('Estequiometria')
  await cartao.getByLabel('Questões').fill(questoes)
  await acionar(cartao.getByRole('button', { name: 'Gerar atividade' }), hasTouch)
  await expect(cartao.locator('[data-motor="pronto"]').getByText('Atividade — Estequiometria')).toBeVisible({ timeout: PRAZO_DA_IA_MS })
}

/** Do resultado da atividade até a versão adaptada pendente, pelo "Pedir versão adaptada" do artefato. */
async function pedirVersaoAdaptada(page: Page, cartao: Locator, tipos: readonly string[], hasTouch: boolean): Promise<void> {
  await acionar(cartao.getByRole('link', { name: 'Abrir o artefato' }), hasTouch)
  await expect(page.getByRole('heading', { level: 1, name: 'Atividade — Estequiometria' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  await acionar(page.getByRole('button', { name: 'Pedir versão adaptada' }), hasTouch)
  await expect(page).toHaveURL(/\/professor\/ferramentas\/adaptacao\?origem=/)
  const formulario = page.locator('[data-motor="formulario"]')
  // A atividade de onde ela veio já está escolhida, e o formulário não tem onde escrever sobre aluno.
  await expect(formulario.getByLabel('Atividade de origem').locator('option:checked')).toContainText('Atividade — Estequiometria', { timeout: PRAZO_DA_ENTRADA_MS })
  await expect(formulario.locator('textarea, input:not([type="checkbox"])')).toHaveCount(0)
  for (const tipo of tipos) await formulario.getByRole('checkbox', { name: tipo, exact: true }).check()
  await acionar(formulario.getByRole('button', { name: 'Gerar versão adaptada' }), hasTouch)
  const pronto = page.locator('[data-motor="pronto"]')
  await expect(pronto.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você', { timeout: PRAZO_DA_IA_MS })
  await expect(pronto.getByText('Assistente · adaptação')).toBeVisible()
  await acionar(pronto.getByRole('link', { name: 'Ver e decidir em Seu time' }), hasTouch)
  await expect(page).toHaveURL(/\/professor\/time\/assistente$/)
}

test.describe('A2 de ponta a ponta, contra a API real', () => {
  test('a coordenação sobe o material; a professora pede a atividade, usa a ferramenta, vê a página citada, exporta o PDF, pede a versão adaptada e aprova, e a tela diz quem aprovou e quando', async ({ page, hasTouch }) => {
    test.setTimeout(300_000)
    const { professora, turmaNome } = await montarEscolaEEntrar(page, hasTouch)

    // A conversa: o pedido, a pergunta da D18 e, com o sim, o cartão da ferramenta com o que o Assistente entendeu.
    const escolha = await pedirAtividade(page, 'monta uma atividade de estequiometria com 5 questões', hasTouch)
    await expect(conversa(page).locator('[data-selo-ia]')).toHaveCount(1)
    await acionar(escolha.getByRole('button', { name: /^Usar a ferramenta Atividade objetiva/ }), hasTouch)
    const cartao = page.locator('[data-cartao-de-ferramenta="atividade_objetiva"]')
    await expect(cartao.getByLabel('Questões')).toHaveValue('5')
    await expect(cartao.getByLabel('Turma e disciplina').locator('option:checked')).toHaveText(`${turmaNome} · ${DISCIPLINA}`)
    // Sem "sobre", o Assistente não separa o tema do pedido: ela o ajusta no cartão antes de gerar.
    await gerarAtividade(cartao, hasTouch, '5')

    // A resposta: a assinatura com o selo "IA", cinco questões e, em cada uma, o chip da página do material da escola.
    const resultado = cartao.locator('[data-motor="pronto"]')
    await expect(resultado.getByText('Assistente · conversa e ferramentas')).toBeVisible()
    await expect(resultado.locator('[data-selo-ia]')).toHaveCount(1)
    await expect(resultado.locator('ol > li')).toHaveCount(5)
    const chips = resultado.getByRole('button', { name: new RegExp(`^Fonte: ${TITULO_DO_MATERIAL}, p\\. [1-6]$`) })
    await expect(chips).toHaveCount(5)
    await acionar(chips.first(), hasTouch)
    await expect(page.getByRole('group', { name: new RegExp(`^Fonte: ${TITULO_DO_MATERIAL}, p\\. [1-6]$`) })).toContainText(/Página [1-6]/)
    expect(await larguraExcedente(page)).toBe(0)
    await page.keyboard.press('Escape')
    await expect(resultado.getByText(new RegExp(`^Fontes \\(\\d\\): ${TITULO_DO_MATERIAL}, p\\. `))).toBeVisible()
    expect(await violacoesGraves(page)).toEqual([])

    // O artefato aberto: o gabarito e a explicação de cada questão, e o PDF com o nome que a API deu.
    await acionar(resultado.getByRole('link', { name: 'Abrir o artefato' }), hasTouch)
    await expect(page.getByRole('heading', { level: 1, name: 'Atividade — Estequiometria' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).toContainText(`Atividade objetiva · ${turmaNome} · ${DISCIPLINA}`)
    await expect(page.getByText('Gabarito', { exact: true })).toHaveCount(5)
    await expect(principal(page).locator('[data-selo-ia]')).toHaveCount(1)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    const baixado = page.waitForEvent('download')
    await acionar(page.getByRole('button', { name: 'Exportar em PDF' }), hasTouch)
    const arquivo = await baixado
    expect(arquivo.suggestedFilename()).toBe('atividade-estequiometria.pdf')
    expect(await arquivo.failure()).toBeNull()

    // A versão adaptada, pelo tipo de adaptação: nasce esperando a professora, e é no Seu time que ela decide.
    await acionar(page.getByRole('button', { name: 'Pedir versão adaptada' }), hasTouch)
    const formulario = page.locator('[data-motor="formulario"]')
    await expect(formulario.getByLabel('Atividade de origem').locator('option:checked')).toContainText('Atividade — Estequiometria', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(formulario.locator('textarea, input:not([type="checkbox"])')).toHaveCount(0)
    await formulario.getByRole('checkbox', { name: 'Fonte ampliada', exact: true }).check()
    await formulario.getByRole('checkbox', { name: 'Tempo adicional', exact: true }).check()
    await acionar(formulario.getByRole('button', { name: 'Gerar versão adaptada' }), hasTouch)
    const pronto = page.locator('[data-motor="pronto"]')
    await expect(pronto.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você', { timeout: PRAZO_DA_IA_MS })
    await expect(pronto).toContainText('Adaptação: Fonte ampliada + Tempo adicional')
    expect(await entregasNoBanco(professora.escolaId)).toEqual([{ tipo: 'versao_adaptada', funcao: 'adaptacao', estado: 'pendente', decididaPor: null, decidida: false, justificativa: null }])
    await acionar(pronto.getByRole('link', { name: 'Ver e decidir em Seu time' }), hasTouch)

    // Seu time: a entrega esperando, na faixa e na conversa do Assistente, e o contador na lateral.
    await expect(page).toHaveURL(/\/professor\/time\/assistente$/)
    const pendente = page.locator('[data-entrega="pendente"]')
    await expect(pendente).toContainText(`Preparei "Atividade — Estequiometria (versão adaptada)" da turma ${turmaNome}. Esta versão adaptada só pode ir aos alunos depois que você aprovar.`, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.locator('[data-faixa-esperando]')).toContainText(`Atividade — Estequiometria (versão adaptada) · ${turmaNome}`)
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seu time' }).getByRole('link')).toHaveAccessibleName(/^Assistente de ensino\s*1\s*esperando você$/)
    if (await page.getByRole('dialog', { name: 'Menu' }).isVisible()) await page.keyboard.press('Escape')

    // Aprovar: a confirmação diz o que é, de qual turma, e que só depois disso a versão pode ir aos alunos.
    await acionar(pendente.getByRole('button', { name: /^Aprovar/ }), hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Aprovar a versão adaptada' })
    await expect(dialogo).toContainText('Atividade — Estequiometria (versão adaptada)')
    await expect(dialogo).toContainText(turmaNome)
    await expect(dialogo).toContainText('Só depois da sua aprovação esta versão pode ir aos alunos da turma.')
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(dialogo.getByRole('button', { name: 'Aprovar a versão adaptada' }), hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })

    // Depois de decidir: quem aprovou e quando, nada mais esperando, e a decisão registrada no banco, com a autora.
    const aprovada = page.locator('[data-entrega="aprovada"]')
    await expect(aprovada.locator('[data-aprovacao="aprovada"]')).toContainText(new RegExp(`^Aprovada por ${professora.nome} · \\d{2}/\\d{2}, \\d{2}h\\d{2}$`), { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(aprovada.getByRole('button')).toHaveCount(0)
    await expect(page.locator('[data-entrega="pendente"]')).toHaveCount(0)
    await expect(page.locator('[data-faixa-esperando]')).toHaveCount(0)
    expect(await entregasNoBanco(professora.escolaId)).toEqual([{ tipo: 'versao_adaptada', funcao: 'adaptacao', estado: 'aprovada', decididaPor: professora.usuarioId, decidida: true, justificativa: null }])
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seu time' }).getByRole('link')).toHaveAccessibleName('Assistente de ensino')
  })

  test('"Só conversar" recebe a resposta em texto, sem a ferramenta abrir de novo; e o pedido de corrigir redação recebe a recusa que explica, como mensagem do Assistente', async ({ page, hasTouch }) => {
    test.setTimeout(240_000)
    await montarEscolaEEntrar(page, hasTouch)
    const escolha = await pedirAtividade(page, 'monta uma atividade sobre estequiometria com 5 questões', hasTouch)
    await acionar(escolha.getByRole('button', { name: /^Só conversar/ }), hasTouch)

    // A escolha vira a fala dela, e o Assistente responde em texto ao pedido, com a página do material.
    await expect(conversa(page).getByText('Você escolheu:')).toContainText('Só conversar')
    const resposta = conversa(page).locator('[data-texto-da-ia]').filter({ hasText: 'Sem abrir a ferramenta, então.' })
    await expect(resposta).toBeVisible({ timeout: PRAZO_DA_IA_MS })
    await expect(resposta.getByRole('button', { name: new RegExp(`^Fonte: ${TITULO_DO_MATERIAL}, p\\. [1-6]$`) })).toHaveCount(1)
    await expect(page.locator('[data-cartao-de-ferramenta]')).toHaveCount(0)
    await expect(conversa(page).getByRole('group', { name: /Quer que eu abra a ferramenta/ })).toHaveCount(0)
    // Toda mensagem do Assistente é assinada: a pergunta e a resposta.
    await expect(conversa(page).locator('[data-selo-ia]')).toHaveCount(2)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A conversa é da API: recarregada, continua lá, na ordem, e a proposta antiga não volta a perguntar.
    await page.reload()
    await expect(conversa(page).locator('[data-texto-da-ia]').filter({ hasText: 'Sem abrir a ferramenta, então.' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(conversa(page).getByText('Você: Só conversar')).toHaveCount(1)
    await expect(conversa(page).getByRole('group', { name: /Quer que eu abra a ferramenta/ })).toHaveCount(0)

    // D55: a IA não corrige redação nem discursiva. A recusa é uma mensagem do Assistente, assinada, e não um erro.
    await caixa(page).fill('corrige a redação do meu aluno e sugere uma nota')
    await acionar(page.getByRole('button', { name: 'Enviar' }), hasTouch)
    const recusa = conversa(page).locator('[data-texto-da-ia]').filter({ hasText: 'Eu não corrijo nem avalio redação ou resposta discursiva de aluno' })
    await expect(recusa).toBeVisible({ timeout: PRAZO_DA_IA_MS })
    await expect(conversa(page).locator('[data-selo-ia]')).toHaveCount(3)
    await expect(principal(page).getByRole('alert')).toHaveCount(0)
    await expect(page.locator('[data-cartao-de-ferramenta]')).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('o plano de aula sai com objetivos, etapas e a página citada; e rejeitar a versão adaptada exige a justificativa, com a tela e o banco guardando quem rejeitou e por quê', async ({ page, hasTouch }) => {
    test.setTimeout(300_000)
    const { professora, turmaNome } = await montarEscolaEEntrar(page, hasTouch)

    // O plano de aula, pelo formulário: objetivos, etapas com o tempo de cada uma, a assinatura da IA e as fontes.
    await irPelaNavegacao(page, 'Ferramentas', hasTouch)
    await acionar(page.locator('[data-ferramenta="plano_de_aula"]'), hasTouch)
    const plano = page.locator('[data-cartao-de-ferramenta="plano_de_aula"]')
    await plano.getByLabel('Tema').fill('Estequiometria', { timeout: PRAZO_DA_ENTRADA_MS })
    await acionar(plano.getByRole('button', { name: 'Gerar plano de aula' }), hasTouch)
    const planoPronto = plano.locator('[data-motor="pronto"]')
    await expect(planoPronto.getByText('Plano de aula — Estequiometria')).toBeVisible({ timeout: PRAZO_DA_IA_MS })
    await expect(planoPronto.locator('[data-selo-ia]')).toHaveCount(1)
    await expect(planoPronto.getByRole('heading', { name: 'Objetivos' })).toBeVisible()
    await expect(planoPronto.getByRole('heading', { name: 'Etapas' })).toBeVisible()
    await expect(planoPronto.getByText(new RegExp(`^Fontes \\(\\d\\): ${TITULO_DO_MATERIAL}, p\\. `))).toBeVisible()
    await acionar(planoPronto.getByRole('link', { name: 'Abrir o artefato' }), hasTouch)
    await expect(page.getByRole('heading', { level: 1, name: 'Plano de aula — Estequiometria' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).toContainText(`Plano de aula · ${turmaNome} · ${DISCIPLINA}`)
    await expect(principal(page).getByText(/^Duração: \d+ min$/)).toBeVisible()
    await expect(principal(page).getByRole('heading', { name: 'Como avaliar' })).toBeVisible()
    await expect(principal(page).getByRole('button', { name: new RegExp(`^Fonte: ${TITULO_DO_MATERIAL}, p\\. [1-6]$`) }).first()).toBeVisible()
    // Plano de aula não tem versão adaptada: só a atividade objetiva se adapta.
    await expect(page.getByRole('button', { name: 'Pedir versão adaptada' })).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    // Sem conversar: o formulário de Ferramentas é o mesmo motor do cartão.
    await irPelaNavegacao(page, 'Ferramentas', hasTouch)
    await acionar(page.locator('[data-ferramenta="atividade_objetiva"]'), hasTouch)
    const cartao = page.locator('[data-cartao-de-ferramenta="atividade_objetiva"]')
    await expect(cartao.locator('[data-motor="formulario"]')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await gerarAtividade(cartao, hasTouch, '2')
    await pedirVersaoAdaptada(page, cartao, ['Linguagem direta'], hasTouch)

    const pendente = page.locator('[data-entrega="pendente"]')
    await acionar(pendente.getByRole('button', { name: /^Rejeitar/ }), hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Rejeitar a versão adaptada' })
    const confirmar = dialogo.getByRole('button', { name: 'Rejeitar a versão adaptada' })
    // Sem justificativa nada é decidido.
    await acionar(confirmar, hasTouch)
    await expect(dialogo.getByText('Escreva pelo menos 8 caracteres.')).toBeVisible()
    expect((await entregasNoBanco(professora.escolaId)).map((entrega) => entrega.estado)).toEqual(['pendente'])
    await dialogo.getByLabel(/Por que você está rejeitando\?/).fill('A questão 2 ficou sem o dado da massa.')
    await acionar(confirmar, hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })

    const rejeitada = page.locator('[data-entrega="rejeitada"] [data-aprovacao="rejeitada"]')
    await expect(rejeitada).toContainText(`${professora.nome} rejeitou · `, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(rejeitada).toContainText('Motivo: A questão 2 ficou sem o dado da massa.')
    await expect(page.locator('[data-entrega="pendente"]')).toHaveCount(0)
    expect(await entregasNoBanco(professora.escolaId)).toEqual([
      { tipo: 'versao_adaptada', funcao: 'adaptacao', estado: 'rejeitada', decididaPor: professora.usuarioId, decidida: true, justificativa: 'A questão 2 ficou sem o dado da massa.' },
    ])
    expect(await violacoesGraves(page)).toEqual([])

    // Em Ferramentas, o que foi gerado vem do mais novo para o mais antigo, e a versão adaptada diz a situação dela.
    await irPelaNavegacao(page, 'Ferramentas', hasTouch)
    const gerados = page.locator('[data-artefato]')
    await expect(gerados).toHaveCount(3, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(gerados.nth(0)).toContainText(`Versão adaptada · Linguagem direta · ${turmaNome}`)
    await expect(gerados.nth(0)).toContainText('Rejeitada')
    await expect(gerados.nth(1)).toContainText(`Atividade objetiva · ${turmaNome}`)
    await expect(gerados.nth(2)).toContainText(`Plano de aula · ${turmaNome}`)
    // A versão rejeitada, aberta: a adaptação pelo tipo, e quem rejeitou e por quê, lidos da API.
    await acionar(gerados.nth(0), hasTouch)
    await expect(page.getByRole('heading', { level: 1, name: 'Atividade — Estequiometria (versão adaptada)' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).locator('[data-aprovacao="rejeitada"]')).toContainText(`${professora.nome} rejeitou · `, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).locator('[data-aprovacao="rejeitada"]')).toContainText('Motivo: A questão 2 ficou sem o dado da massa.')
    await expect(page.getByRole('button', { name: 'Pedir versão adaptada' })).toHaveCount(0)
    // Rejeitada, a versão não sai em PDF nem muda de nome, e a tela diz por quê.
    await expect(page.getByRole('button', { name: /Exportar/ })).toHaveCount(0)
    await expect(page.locator('[data-sem-pdf]')).toContainText('Esta versão foi rejeitada e não pode ser exportada')
    await expect(page.getByRole('button', { name: 'Renomear' })).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
