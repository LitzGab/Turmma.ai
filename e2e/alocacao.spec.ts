import { randomUUID } from 'node:crypto'
import type { Locator, Page, Request, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { entrarComoCoordenacaoNaMesmaAba, abrirEstrutura, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import {
  apagarDisciplinaNoBanco,
  apagarTurmaNoBanco,
  convidarProfessorNoBanco,
  criarDisciplinaNoBanco,
  criarEquipeComSenha,
  montarEstruturaNoBanco,
  vencerConviteNoBanco,
} from './__fixtures__/sessao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A alocação do professor com convite em aberto (X2, 3.0; movida de `estrutura.spec.ts` sem editar o corpo): W4 (Alocação).
 * Tudo pela tela, nos projetos `chromebook` e `celular`, com nomes inventados pelo teste.
 */

const ROTA_VINCULOS = '**/v1/vinculos?*'

const INDISPONIVEL = JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

/** Uma porta que segura a resposta até o teste abrir. */
function portao(): { aberta: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

const principal = (page: Page) => page.getByRole('main')

/** O anúncio da ação que terminou, dentro da seção onde ela aconteceu: é lá que quem enxerga o vê. */
const anuncio = (secao: Locator, texto: string | RegExp) => secao.getByRole('status').filter({ hasText: texto })


async function alvoDeToque(alvo: Locator, descricao: string): Promise<void> {
  const caixa = await alvo.boundingBox()
  expect(caixa, `${descricao} sem caixa`).not.toBeNull()
  expect(caixa?.height ?? 0, descricao).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
}

test.describe('W4 (Alocação): o professor com convite em aberto', () => {
  test('vazio sem professor alocável e sem turma; carregando; com dado, só os alocáveis, pelo nome, e o vínculo esperando a confirmação; o convite que vence e a turma e a disciplina que saem com a tela aberta; o erro com "Tentar de novo"', async ({
    page,
    hasTouch,
  }) => {
    test.slow()
    const coordenadora = await criarEquipeComSenha('coordenador')
    // Turmas e disciplinas criadas fora da ordem do nome: as escolhas vêm pelo nome.
    const estrutura = await montarEstruturaNoBanco(coordenadora.escolaId, ['7B', '7A'])
    const [outraTurma, turma] = estrutura.turmas
    if (turma === undefined || outraTurma === undefined) throw new Error('estrutura sem as duas turmas')
    const artes = `Artes sintética ${randomUUID().slice(0, 8)}`
    await criarDisciplinaNoBanco(coordenadora.escolaId, artes)
    // Só um professor, de convite vencido: ele não é alocável, e não conta na alocação nem no roteiro.
    const vencido = await convidarProfessorNoBanco(coordenadora.escolaId, 'vencido')
    const alocacoes: Request[] = []
    page.on('request', (pedido) => {
      if (pedido.method() === 'POST' && new URL(pedido.url()).pathname === '/v1/vinculos') alocacoes.push(pedido)
    })
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await abrirEstrutura(page, hasTouch)
    const alocacao = principal(page).getByRole('region', { name: 'Alocação' })
    const oQueFalta = principal(page).getByRole('region', { name: 'O que falta para a escola começar' })
    // Vazio: há turma e disciplina, mas não há professor alocável.
    await expect(alocacao).toContainText('Crie um professor primeiro', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(alocacao).not.toContainText('Crie uma turma')
    await expect(alocacao).toContainText('Falta: um professor cadastrado, com o convite em aberto ou já aceito.')
    await expect(oQueFalta).toContainText('Professores · falta')
    // O caminho até a tela onde o professor se cadastra e o convite vencido se refaz (14.0), no vazio e no roteiro.
    const paraProfessores = alocacao.getByRole('link', { name: 'Ir para Professores' })
    await expect(paraProfessores).toHaveAttribute('href', '/coordenacao/professores')
    await alvoDeToque(paraProfessores, 'Ir para Professores')
    await expect(oQueFalta.getByRole('link', { name: 'Professores' })).toHaveAttribute('href', '/coordenacao/professores')

    // Dois com o convite em aberto, criados fora da ordem do nome: a escolha vem pelo nome, e não pela ordem da API.
    const bruno = await convidarProfessorNoBanco(coordenadora.escolaId, 'pendente', 'Bruno')
    const ana = await convidarProfessorNoBanco(coordenadora.escolaId, 'pendente', 'Ana')
    let falhar = false
    const vinculosSegurados = portao()
    await page.route(ROTA_VINCULOS, async (rota: Route) => {
      await vinculosSegurados.aberta
      await (falhar ? rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL }) : rota.continue())
    })
    await page.reload()
    // Carregando: a leitura dos vínculos segurada.
    await expect(alocacao.getByRole('status').filter({ hasText: 'Carregando a alocação…' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // Sem os vínculos lidos, o roteiro não diz que a alocação falta.
    await expect(oQueFalta).toContainText('Turmas · feito')
    await expect(oQueFalta).not.toContainText('Alocação · falta')
    vinculosSegurados.abrir()
    await expect(oQueFalta).toContainText('Alocação · falta', { timeout: PRAZO_DA_ENTRADA_MS })
    // Exato: "Professores alocados", o nome da lista de vínculos, também começa por "Professor".
    const professor = alocacao.getByLabel('Professor', { exact: true })
    await expect(professor).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(professor.locator('option')).toHaveText(['Escolha o professor', `${ana.nome} (convite em aberto)`, `${bruno.nome} (convite em aberto)`])
    await expect(alocacao.getByLabel('Turma').locator('option')).toHaveText(['Escolha a turma', turma.nome, outraTurma.nome])
    await expect(alocacao.getByLabel('Disciplina').locator('option')).toHaveText(['Escolha a disciplina', artes, estrutura.disciplina.nome])
    await expect(alocacao).not.toContainText(vencido.nome)
    await expect(alocacao).toContainText('Nenhum professor alocado ainda')
    await expect(oQueFalta).toContainText('Professores · feito')

    // Sem escolher tudo, diz o que falta, e nada sai.
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')
    expect(alocacoes).toHaveLength(0)
    await professor.selectOption({ label: `${ana.nome} (convite em aberto)` })
    await alocacao.getByLabel('Turma').selectOption({ label: turma.nome })
    await alocacao.getByLabel('Disciplina').selectOption({ label: estrutura.disciplina.nome })
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    const alocado = anuncio(alocacao, `Alocação feita: ${ana.nome} em ${turma.nome} · ${estrutura.disciplina.nome}. A turma abre depois que quem foi alocado confirmar.`)
    await expect(alocado).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const alocados = alocacao.getByRole('list', { name: 'Professores alocados' })
    await expect(alocados.getByRole('listitem')).toHaveCount(1)
    await expect(alocados).toContainText(ana.nome)
    await expect(alocados).toContainText('Esperando o professor confirmar')
    await expect(oQueFalta).toContainText('Alocação · feito')
    // A mesma alocação de novo: a API recusa, a tela explica, e o anúncio da alocação anterior sai.
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText('Este professor já está alocado nesta turma e nesta disciplina.', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(alocado).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])
    // A mesma professora em outra disciplina da mesma turma: os vínculos vêm pela turma e pela disciplina, e não pela
    // ordem em que foram criados.
    await alocacao.getByLabel('Disciplina').selectOption({ label: artes })
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocados.getByRole('listitem')).toHaveCount(2, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(alocados.getByRole('listitem')).toContainText([`${turma.nome} · ${artes}`, `${turma.nome} · ${estrutura.disciplina.nome}`])

    // O convite do outro professor vence com a tela aberta: a API responde como inexistente, a tela explica, a escolha
    // recarrega sem ele, e o "Alocar" seguinte pede a escolha de novo, em vez de mandar quem acabou de ser recusado.
    await vencerConviteNoBanco(bruno.usuarioId)
    await professor.selectOption({ label: `${bruno.nome} (convite em aberto)` })
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText('O professor, a turma ou a disciplina mudou enquanto você escolhia. A tela foi atualizada: confira e tente de novo.', {
      timeout: PRAZO_DA_ENTRADA_MS,
    })
    await expect(professor.locator('option')).toHaveText(['Escolha o professor', `${ana.nome} (convite em aberto)`], { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(professor).toHaveValue('')
    expect(alocacoes).toHaveLength(4)
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')
    expect(alocacoes).toHaveLength(4)
    await expect(alocados.getByRole('listitem')).toHaveCount(2)

    // Erro: a leitura dos vínculos cai; a alocação diz o que fazer, e a tela continua em pé.
    falhar = true
    await page.reload()
    await expect(alocacao.getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('region', { name: 'Turmas de 2026' })).toContainText(turma.nome)
    falhar = false
    await acionar(alocacao.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(alocados).toContainText(ana.nome, { timeout: PRAZO_DA_ENTRADA_MS })

    // A turma que outra pessoa excluiu com a escolha feita: a API responde como inexistente, a turma sai da escolha
    // quando a tela recarrega, e o "Alocar" seguinte pede a escolha de novo, com o professor e a disciplina ainda
    // escolhidos.
    const daTurma = alocacao.getByLabel('Turma')
    const daDisciplina = alocacao.getByLabel('Disciplina')
    const mudou = 'O professor, a turma ou a disciplina mudou enquanto você escolhia. A tela foi atualizada: confira e tente de novo.'
    await professor.selectOption({ label: `${ana.nome} (convite em aberto)` })
    await daTurma.selectOption({ label: turma.nome })
    await daDisciplina.selectOption({ label: artes })
    await apagarTurmaNoBanco(coordenadora.escolaId, turma.id)
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText(mudou, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(daTurma.locator('option')).toHaveText(['Escolha a turma', outraTurma.nome], { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(daTurma).toHaveValue('')
    await expect(alocacao).toContainText('Nenhum professor alocado ainda')
    expect(alocacoes).toHaveLength(5)
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')
    expect(alocacoes).toHaveLength(5)
    // E a disciplina, do mesmo jeito (a de Ciências ficou sem vínculo com a turma que saiu).
    await daTurma.selectOption({ label: outraTurma.nome })
    await daDisciplina.selectOption({ label: estrutura.disciplina.nome })
    await apagarDisciplinaNoBanco(coordenadora.escolaId, estrutura.disciplina.id)
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText(mudou, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(daDisciplina.locator('option')).toHaveText(['Escolha a disciplina', artes], { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(daDisciplina).toHaveValue('')
    expect(alocacoes).toHaveLength(6)
    await acionar(alocacao.getByRole('button', { name: 'Alocar' }), hasTouch)
    await expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')
    expect(alocacoes).toHaveLength(6)

    // Vazio de novo, agora sem turma: há professor alocável e disciplina, e falta a turma.
    await apagarTurmaNoBanco(coordenadora.escolaId, outraTurma.id)
    await page.reload()
    await expect(alocacao).toContainText('Crie uma turma primeiro', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(alocacao).toContainText('Falta: uma turma.')
    await expect(alocacao.getByRole('link', { name: 'Ir para Professores' })).toHaveCount(0)
    await expect(alocacao.getByRole('button', { name: 'Alocar' })).toHaveCount(0)
  })
})
