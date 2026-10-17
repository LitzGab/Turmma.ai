import type { Locator, Page } from '@playwright/test'
import { entrarComoCoordenacaoNaMesmaAba, esperarPainel, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { irPelaCoordenacao } from './__fixtures__/coordenacao.ts'
import { conferirAssinaturas, conferirTamanhoDoAvatar } from './__fixtures__/avatar.ts'
import { auditoriasNoBanco, montarEscolaComEntregas, type EscolaComEntregas } from './__fixtures__/governanca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { criarEquipeComSenha, type EquipeDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * O Analista e o pedido de dado nominal da coordenação (X2, 3.0; movidos de `governanca.spec.ts` sem editar o corpo): o resumo,
 * o alerta como hipótese com contexto, o recorte de um professor sem número e a leitura nominal com a auditoria avisada antes.
 */

const principal = (page: Page) => page.getByRole('main')

const dialogo = (page: Page) => page.getByRole('alertdialog')

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
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

test.describe('Governança de IA: o pedido de dado nominal', () => {
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
    // O botão que tinha o foco sumiu com o resultado: o foco volta para quem abriu, e não cai no `body`.
    await expect(principal(page).getByRole('button', { name: 'Abrir dado nominal de uma turma' })).toBeFocused()
  })
})

test.describe('Analista', () => {
  test('gera o resumo: o alerta é hipótese com contexto, e o recorte de um professor só aparece sem número', async ({ page, hasTouch }) => {
    const { escola } = await entrar(page, hasTouch)
    if (escola === undefined) throw new Error('escola sem entregas')
    await irPelaCoordenacao(page, 'Analista', hasTouch)
    await expect(page).toHaveURL(/\/coordenacao\/analista$/)
    // Vazio: nenhum resumo gerado ainda.
    await expect(principal(page)).toContainText('Nenhum resumo gerado ainda', { timeout: PRAZO_DA_ENTRADA_MS })
    // O Analista assina com o avatar, o nome da função e o selo "IA" no mesmo bloco (RF10).
    expect(await conferirAssinaturas(principal(page))).toBe(1)
    expect(await conferirTamanhoDoAvatar(principal(page), 48)).toBe(1)
    expect(await violacoesGraves(page)).toEqual([])

    await acionar(principal(page).getByRole('button', { name: 'Gerar resumo' }), hasTouch)
    const resumo = principal(page).locator('[data-resumo-do-analista]')
    await expect(resumo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('button', { name: 'Gerar resumo' })).toBeEnabled()
    // O foco vai para o resumo que chegou.
    await expect(resumo.getByText(/^Resumo gerado em/)).toBeFocused()

    const alerta = resumo.locator('[data-alerta="habilidade_com_acerto_baixo"]')
    await expect(alerta).toHaveCount(1)
    await expect(alerta).toContainText(`Em ${escola.serieNome} · Química, o acerto em "Identificar o reagente limitante" (QUI.EM.06) ficou em 50%, abaixo de 60%, um limite provisório desta versão, a definir com a escola.`)
    await expect(alerta).toContainText('Hipóteses a conferir')
    await expect(resumo).toContainText('É uma hipótese a conferir, não uma conclusão')
    // Química tem duas professoras: tem número. Física, uma só: aparece sem número, dito como tal.
    const quimica = resumo.getByRole('region', { name: `${escola.serieNome} · Química` })
    await expect(quimica).toContainText('2 correções aprovadas')
    // O recorte não diz quantos professores tem: nem os com vínculo, nem os com correção.
    await expect(quimica).not.toContainText('professor')
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
