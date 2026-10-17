import type { Locator, Page, Route } from '@playwright/test'
import { entrarComoCoordenacaoNaMesmaAba, esperarPainel, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { irPelaCoordenacao } from './__fixtures__/coordenacao.ts'
import { montarEscolaComEntregas, type EscolaComEntregas } from './__fixtures__/governanca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { criarEquipeComSenha, type EquipeDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A governança de IA da coordenação, na aba IA de Registros (MVP, A5; `docs/interface.md` 11.7; D9, D45, D60, D64; regra 70, itens 5, 6,
 * 8 e 9), contra a API real com o adaptador falso, nos projetos `chromebook` e `celular`. É o passo 5 do roteiro: a
 * escola já tem entregas (`montarEscolaComEntregas`), e a coordenação chega à aba IA de Registros pela lateral.
 * Os Agentes estão em `agentes.spec.ts`, e o Analista e o dado nominal em `analista.spec.ts` (vieram daqui na X2, 3.0; na 4.0 o nominal ganhou casos próprios, e a asserção do botão no fim deste arquivo passou a dizer que ele não está aqui).
 */

const INDISPONIVEL = JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })
const COLUNAS = ['O que foi gerado', 'Agente e função', 'Série', 'Gerado em', 'Decisão']

const principal = (page: Page) => page.getByRole('main')
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

/**
 * A coordenadora entra, abre no Painel e vai à aba IA de Registros, que é a Governança. Com `comEntregas`, a escola já tem o que
 * o roteiro deixa até o passo 4.
 */
async function entrar(page: Page, hasTouch: boolean, comEntregas = true): Promise<Cenario> {
  const coordenadora = await criarEquipeComSenha('coordenador')
  const escola = comEntregas ? await montarEscolaComEntregas(coordenadora.escolaId, coordenadora.usuarioId) : undefined
  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
  await esperarPainel(page)
  await irPelaCoordenacao(page, 'IA', hasTouch)
  return { coordenadora, escola }
}

test.describe('Governança de IA', () => {
  test('a coordenação vai à aba IA de Registros e vê o que a IA gerou e se uma pessoa aprovou, sem professor, e o consumo em tokens', async ({ page, hasTouch }) => {
    const { escola } = await entrar(page, hasTouch)
    if (escola === undefined) throw new Error('escola sem entregas')
    await expect(page).toHaveTitle('Registros: IA · Turmma')
    // Quatro artefatos (três listas e uma versão adaptada) e três lotes; três aprovados, um esperando.
    await expect(numero(page, 'Gerado por IA')).toContainText('7', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(numero(page, 'Aprovado por gente')).toContainText('3')
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

    // O dado nominal de uma turma não abre aqui: mora no fim da página do Analista (X2, 4.0), e a Governança é só agregado.
    await expect(principal(page).getByRole('button', { name: 'Abrir dado nominal de uma turma' })).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
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
    await esperarPainel(page)
    await irPelaCoordenacao(page, 'IA', hasTouch)
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
