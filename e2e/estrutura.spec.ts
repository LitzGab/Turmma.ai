import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { Locator, Page, Request, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { abrirNavegacao, entrarComoCoordenacaoNaMesmaAba, abrirEstrutura, esperarPainel, lateral, PRAZO_DA_ENTRADA_MS, secoes as secoesDaNavegacao } from './__fixtures__/casca.ts'
import { irPelaCoordenacao } from './__fixtures__/coordenacao.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import {
  apagarDisciplinaNoBanco,
  apagarSerieNoBanco,
  apagarTurmaNoBanco,
  convidarProfessorNoBanco,
  criarAnoLetivoNoBanco,
  criarDisciplinaNoBanco,
  criarEquipeComSenha,
  criarTodasAsSeriesNoBanco,
  montarEstruturaNoBanco,
  porNaListaDaTurma,
} from './__fixtures__/sessao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, codigoCru, larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A Estrutura da coordenação (A1, tarefa 13.0; `tasks/prd-apresentacao-escola/cenarios.md`): W4 de Estrutura; W12 (360 px,
 * dentro do diálogo, cartões, alvos, teclado); e o recomeço da tela. A lista da turma está em `lista-da-turma.spec.ts` e a
 * alocação em `alocacao.spec.ts` (X2, 3.0). Tudo pela tela, nos projetos `chromebook` e `celular`, com nomes
 * e matrículas inventados pelo teste.
 */

const ROTA_ANOS = '**/v1/anos-letivos*'
/** As leituras das seções da Estrutura que têm o seu próprio carregando e o seu próprio erro, e a dos professores, que a Alocação e o roteiro usam. */
const ROTAS_DAS_SECOES = ['**/v1/series?*', '**/v1/disciplinas?*', '**/v1/turmas?*', '**/v1/professores?*']
const INDISPONIVEL = JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })

/** Os nomes que o arquivo do Excel traz, com acento: é por eles que se vê que o windows-1252 foi lido certo. */
const ARQUIVO_DO_EXCEL = 'e2e/__fixtures__/lista-excel.csv'

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

/** As séries do recorte (D43), na ordem em que a escola fala: é a ordem da escolha e a da lista. */
const SERIES_DO_RECORTE = [
  '6º ano do Ensino Fundamental',
  '7º ano do Ensino Fundamental',
  '8º ano do Ensino Fundamental',
  '9º ano do Ensino Fundamental',
  '1º ano do Ensino Médio',
  '2º ano do Ensino Médio',
  '3º ano do Ensino Médio',
]

const principal = (page: Page) => page.getByRole('main')
const dialogo = (page: Page, titulo: string) => page.getByRole('dialog', { name: titulo })
/** O anúncio da ação que terminou, dentro da seção onde ela aconteceu: é lá que quem enxerga o vê. */
const anuncio = (secao: Locator, texto: string | RegExp) => secao.getByRole('status').filter({ hasText: texto })
const secao = (page: Page, nome: string) => principal(page).getByRole('region', { name: nome })

async function alvoDeToque(alvo: Locator, descricao: string): Promise<void> {
  const caixa = await alvo.boundingBox()
  expect(caixa, `${descricao} sem caixa`).not.toBeNull()
  expect(caixa?.height ?? 0, descricao).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
}

/** Abre a turma pela lista de turmas da Estrutura, pelo link "Lista de nomes". */
async function abrirTurma(page: Page, nome: string, hasTouch: boolean): Promise<void> {
  await acionar(principal(page).getByRole('link', { name: `Lista de nomes da turma ${nome}` }), hasTouch)
  await expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
}

test.describe('W4 (Estrutura): do vazio ao roteiro, montando a escola pela tela', () => {
  test('carregando, o vazio "Comece pelo ano letivo" com o roteiro, e o ano, a série, a turma e a disciplina criados pela tela', async ({ page, hasTouch }) => {
    test.slow()
    // Carregando: a leitura dos anos segurada na primeira vez.
    const segurado = portao()
    let primeira = true
    await page.route(ROTA_ANOS, async (rota: Route) => {
      if (primeira && rota.request().method() === 'GET') {
        primeira = false
        await segurado.aberta
      }
      await rota.continue()
    })
    // Turmas e vínculos são do ano em curso: sem ele, a tela nem pergunta.
    const doAnoEmCurso: string[] = []
    // O que a tela segura antes de enviar (o ano fora do intervalo, o nome em branco) não chega à API: as criações que
    // saíram, contadas no fim.
    const criacoes: string[] = []
    page.on('request', (pedido) => {
      const caminho = new URL(pedido.url()).pathname
      if (pedido.method() === 'GET' && (caminho === '/v1/turmas' || caminho === '/v1/vinculos')) doAnoEmCurso.push(caminho)
      if (pedido.method() === 'POST' && ['/v1/anos-letivos', '/v1/turmas', '/v1/disciplinas'].includes(caminho)) criacoes.push(caminho)
    })
    const coordenadora = await criarEquipeComSenha('coordenador', { semAnoLetivo: true })
    // Um professor com o convite em aberto: a alocação espera só a turma e a disciplina.
    await convidarProfessorNoBanco(coordenadora.escolaId, 'pendente')
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    // A coordenação abre em Governança (A5) e chega à Estrutura pela lateral.
    await esperarPainel(page)
    await irPelaCoordenacao(page, 'Turmas', hasTouch)
    await expect(principal(page).getByRole('status').filter({ hasText: 'Carregando a estrutura da escola…' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Escola: turmas · Turmma')
    segurado.abrir()

    // Vazio: o próximo passo e o roteiro até a alocação.
    await expect(principal(page).getByText('Comece pelo ano letivo')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const roteiro = principal(page).getByRole('region', { name: 'O roteiro até a alocação' })
    await expect(roteiro.getByRole('listitem')).toHaveCount(7)
    await expect(roteiro).toContainText('Lista de nomes')
    await expect(roteiro).toContainText('Alocação')
    // No vazio o roteiro é só o caminho: nada foi feito ainda, e nenhum passo leva marca.
    await expect(roteiro).not.toContainText('falta')
    expect(await violacoesGraves(page)).toEqual([])
    expect(await larguraExcedente(page)).toBe(0)

    // O ano letivo, pelo botão do vazio; o foco vai para a seção do ano quando o botão sai com o vazio.
    await acionar(principal(page).getByRole('button', { name: 'Criar o ano letivo' }), hasTouch)
    const doAno = dialogo(page, 'Novo ano letivo')
    await expect(doAno).toBeVisible()
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    // O ano fora do intervalo, com o período certo: o erro fica no campo do ano, e nada é enviado.
    const erroDoAno = doAno.getByText('Digite o ano com quatro algarismos, entre 2000 e 2100.')
    const erroDoPeriodo = doAno.getByText('O fim precisa ser depois do início.')
    await doAno.getByLabel('Ano').fill('26')
    await doAno.getByLabel('Início').fill('2026-02-02')
    await doAno.getByLabel('Fim').fill('2026-12-11')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(erroDoAno).toBeVisible()
    await expect(erroDoPeriodo).toHaveCount(0)
    await expect(doAno.getByLabel('Ano')).toHaveAttribute('aria-invalid', 'true')
    // O foco vai para o campo com erro, e o leitor de tela lê o erro ao chegar nele.
    await expect(doAno.getByLabel('Ano')).toBeFocused()
    // O ano certo, com o fim antes do início: o erro passa para o período. As datas que a pessoa digitou ficam como ela
    // deixou quando o ano muda.
    await doAno.getByLabel('Ano').fill('2026')
    await expect(doAno.getByLabel('Início')).toHaveValue('2026-02-02')
    await doAno.getByLabel('Fim').fill('2026-01-15')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(erroDoPeriodo).toBeVisible()
    await expect(erroDoAno).toHaveCount(0)
    await expect(doAno.getByLabel('Fim')).toBeFocused()
    // O período de outro ano não sai calado: o ano letivo não se altera nem se exclui depois.
    await doAno.getByLabel('Início').fill('2025-02-02')
    await doAno.getByLabel('Fim').fill('2025-12-11')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(doAno.getByText('O início precisa cair em 2026, o ano letivo digitado.')).toBeVisible()
    await expect(doAno.getByLabel('Início')).toBeFocused()
    // O início apagado: o erro vai para o campo que está vazio, e não para o fim.
    await doAno.getByLabel('Início').fill('')
    await doAno.getByLabel('Fim').fill('2026-12-11')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(doAno.getByText('Preencha o início.')).toBeVisible()
    await expect(doAno.getByLabel('Início')).toBeFocused()
    await expect(erroDoPeriodo).toHaveCount(0)
    // O fim apagado, do mesmo jeito.
    await doAno.getByLabel('Início').fill('2026-02-02')
    await doAno.getByLabel('Fim').fill('')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(doAno.getByText('Preencha o fim.')).toBeVisible()
    await expect(doAno.getByLabel('Fim')).toBeFocused()
    await expect(erroDoPeriodo).toHaveCount(0)
    // O ano errado na data do fim (2207 no lugar de 2027) não passa: o fim cai no ano letivo ou no seguinte.
    await doAno.getByLabel('Fim').fill('2207-12-11')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(doAno.getByText('O fim precisa cair em 2026 ou em 2027.')).toBeVisible()
    await expect(doAno.getByLabel('Fim')).toBeFocused()
    await doAno.getByLabel('Fim').fill('2026-12-11')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(doAno).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(anuncio(secao(page, 'Ano letivo'), 'Ano letivo 2026 criado.')).toBeVisible()
    // Na seção da ação, e só nela.
    await expect(principal(page).getByRole('status').filter({ hasText: 'Ano letivo 2026 criado.' })).toHaveCount(1)
    await expect(principal(page).getByRole('heading', { name: 'Ano letivo' })).toBeFocused()
    await expect(principal(page).getByRole('region', { name: 'O que falta para a escola começar' })).toContainText('Ano letivo · falta')
    // Sem ano em curso não há turma nem alocação a ler: os dois passos faltam de fato, e o roteiro diz.
    for (const passo of ['Turmas · falta', 'Alocação · falta']) await expect(principal(page).getByRole('region', { name: 'O que falta para a escola começar' })).toContainText(passo)
    // Sem ano em curso, a turma não nasce: a seção diz o que fazer, sem o botão, e a tela não pediu turma nem vínculo.
    await expect(principal(page).getByRole('button', { name: 'Nova turma' })).toHaveCount(0)
    await expect(principal(page).getByRole('region', { name: 'Alocação' })).toContainText('Abra o ano letivo acima')
    expect(doAnoEmCurso).toEqual([])
    await acionar(principal(page).getByRole('button', { name: 'Abrir o ano letivo 2026' }), hasTouch)
    await expect(anuncio(secao(page, 'Ano letivo'), 'Ano letivo 2026 aberto.')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('heading', { name: 'Ano letivo' })).toBeFocused()
    await expect(principal(page)).toContainText('Em curso')

    // O ano seguinte nasce planejado, e não se abre enquanto 2026 está em curso: só um fica em curso.
    // O período acompanha o ano digitado enquanto a pessoa não mexe nas datas: preparar outro ano não grava o período do
    // ano do relógio. O ano é um que o relógio do teste nunca vai marcar, para a prova não vencer na virada do ano. E o
    // fim pode cair em janeiro do ano seguinte, como na rede que termina o ano letivo depois das férias.
    await acionar(principal(page).getByRole('button', { name: 'Novo ano letivo' }), hasTouch)
    await doAno.getByLabel('Ano').fill('2099')
    await expect(doAno.getByLabel('Início')).toHaveValue('2099-02-01')
    await expect(doAno.getByLabel('Fim')).toHaveValue('2099-12-15')
    await doAno.getByLabel('Fim').fill('2100-01-20')
    await acionar(doAno.getByRole('button', { name: 'Criar ano letivo' }), hasTouch)
    await expect(doAno).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    const anos = principal(page).getByRole('region', { name: 'Ano letivo' })
    await expect(anos.getByRole('listitem')).toHaveCount(2)
    await expect(anos.getByRole('listitem').first()).toContainText('2099Planejado · de 1 de fevereiro de 2099 a 20 de janeiro de 2100')
    await expect(anos.getByRole('button', { name: /Abrir o ano letivo/ })).toHaveCount(0)

    // A turma antes da série: o diálogo diz o que falta, e só oferece "Fechar".
    await acionar(principal(page).getByRole('button', { name: 'Nova turma' }), hasTouch)
    const daTurma = dialogo(page, 'Nova turma em 2026')
    await expect(daTurma).toContainText('Crie a série primeiro')
    await expect(daTurma.getByRole('button', { name: 'Criar turma' })).toHaveCount(0)
    await acionar(daTurma.getByRole('button', { name: 'Fechar' }), hasTouch)

    // A série: só as do recorte são oferecidas (D43), e o "5º ano" nem aparece; a criada sai da escolha.
    await acionar(principal(page).getByRole('button', { name: 'Nova série' }), hasTouch)
    const daSerie = dialogo(page, 'Nova série')
    await expect(daSerie.getByLabel('Série').locator('option')).toHaveText(SERIES_DO_RECORTE)
    await daSerie.getByLabel('Série').selectOption({ label: '7º ano do Ensino Fundamental' })
    await acionar(daSerie.getByRole('button', { name: 'Criar série' }), hasTouch)
    await expect(daSerie).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('region', { name: 'Séries' })).toContainText('7º ano do Ensino Fundamental')
    await expect(anuncio(secao(page, 'Séries'), '7º ano do Ensino Fundamental criado.')).toBeVisible()
    await acionar(principal(page).getByRole('button', { name: 'Nova série' }), hasTouch)
    await expect(daSerie.getByLabel('Série').locator('option')).toHaveText(SERIES_DO_RECORTE.filter((serie) => serie !== '7º ano do Ensino Fundamental'))
    await acionar(daSerie.getByRole('button', { name: 'Cancelar' }), hasTouch)

    // A turma, na série criada.
    const marca = randomUUID().slice(0, 8)
    const turma = `7A ${marca}`
    await acionar(principal(page).getByRole('button', { name: 'Nova turma' }), hasTouch)
    // Sem o nome, o erro fica no campo, e nada é enviado.
    await acionar(daTurma.getByRole('button', { name: 'Criar turma' }), hasTouch)
    await expect(daTurma.getByText('Digite o nome da turma, como 7ºA.')).toBeVisible()
    await expect(daTurma.getByLabel('Nome da turma')).toBeFocused()
    await daTurma.getByLabel('Nome da turma').fill(turma)
    await daTurma.getByLabel('Turno (opcional)').selectOption({ label: 'manhã' })
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    await acionar(daTurma.getByRole('button', { name: 'Criar turma' }), hasTouch)
    await expect(daTurma).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    const turmas = principal(page).getByRole('region', { name: 'Turmas de 2026' })
    await expect(turmas).toContainText(turma)
    await expect(turmas).toContainText('7º ano do Ensino Fundamental · manhã')
    await expect(anuncio(turmas, `Turma ${turma} criada. Abra a turma para subir a lista de nomes.`)).toBeVisible()
    // Com turma e professor, mas sem disciplina, a alocação ainda diz o que criar primeiro.
    const alocacao = principal(page).getByRole('region', { name: 'Alocação' })
    // O título diz só o que falta: com a turma e o professor, não pede outra vez a turma nem o professor (14.0).
    await expect(alocacao).toContainText('Crie uma disciplina primeiro')
    await expect(alocacao).not.toContainText('Crie uma turma')
    await expect(alocacao).toContainText('Falta: uma disciplina.')
    // O professor já existe: o vazio não manda à tela Professores.
    await expect(alocacao.getByRole('link', { name: 'Ir para Professores' })).toHaveCount(0)

    // A disciplina, com o nome repetido recusado pela API e explicado no diálogo.
    const disciplina = `Matemática ${marca}`
    for (const tentativa of [1, 2]) {
      await acionar(principal(page).getByRole('button', { name: 'Nova disciplina' }), hasTouch)
      const daDisciplina = dialogo(page, 'Nova disciplina')
      if (tentativa === 1) {
        // Só espaços não é nome: o erro fica no campo, e nada é enviado.
        await daDisciplina.getByLabel('Nome da disciplina').fill('   ')
        await acionar(daDisciplina.getByRole('button', { name: 'Criar disciplina' }), hasTouch)
        await expect(daDisciplina.getByText('Digite o nome da disciplina.')).toBeVisible()
        await expect(daDisciplina.getByLabel('Nome da disciplina')).toBeFocused()
      }
      await daDisciplina.getByLabel('Nome da disciplina').fill(disciplina)
      await acionar(daDisciplina.getByRole('button', { name: 'Criar disciplina' }), hasTouch)
      if (tentativa === 1) {
        await expect(daDisciplina).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
        await expect(anuncio(secao(page, 'Disciplinas'), `Disciplina ${disciplina} criada.`)).toBeVisible()
      } else {
        await expect(daDisciplina.getByRole('alert')).toHaveText('Já existe uma disciplina com este nome na escola.', { timeout: PRAZO_DA_ENTRADA_MS })
        await expect(daDisciplina.getByRole('alert')).toBeFocused()
        await acionar(daDisciplina.getByRole('button', { name: 'Cancelar' }), hasTouch)
      }
    }

    // O roteiro diz o que falta, e a alocação passa a oferecer a escolha.
    const oQueFalta = principal(page).getByRole('region', { name: 'O que falta para a escola começar' })
    for (const passo of ['Ano letivo · feito', 'Séries · feito', 'Disciplinas · feito', 'Turmas · feito', 'Professores · feito', 'Alocação · falta'])
      await expect(oQueFalta).toContainText(passo)
    await expect(alocacao.getByRole('button', { name: 'Alocar' })).toBeVisible()
    expect(await violacoesGraves(page)).toEqual([])
    expect(await larguraExcedente(page)).toBe(0)
    // Só o que passou pela conferência da tela saiu: os dois anos, a turma, e a disciplina e a repetição dela.
    expect(criacoes).toEqual(['/v1/anos-letivos', '/v1/anos-letivos', '/v1/turmas', '/v1/disciplinas', '/v1/disciplinas'])
  })

  test('depois da virada, só o ano planejado se abre, e os anos vêm do mais novo ao mais antigo; o ano que outra pessoa abriu; erro: a leitura da estrutura cai, a tela diz o que fazer, e "Tentar de novo" traz a estrutura; o carregando e o erro de cada seção', async ({
    page,
    hasTouch,
  }) => {
    // Três recargas com a rede e a CPU do perfil: sem isto o teste encosta nos 30 s do prazo e falha de vez em quando.
    test.slow()
    let falhar = false
    await page.route(ROTA_ANOS, (rota: Route) => (falhar ? rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL }) : rota.continue()))
    // A escola depois da virada: 2025 encerrado, 2026 planejado, nenhum em curso. O encerrado foi criado antes, e a API
    // o lista antes.
    const coordenadora = await criarEquipeComSenha('coordenador', { semAnoLetivo: true })
    await criarAnoLetivoNoBanco(coordenadora.escolaId, 2025, 'encerrado')
    await criarAnoLetivoNoBanco(coordenadora.escolaId, 2026, 'planejado')
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await abrirEstrutura(page, hasTouch)
    await expect(principal(page).getByRole('heading', { name: 'Ano letivo' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const anos = principal(page).getByRole('region', { name: 'Ano letivo' })
    await expect(anos.getByRole('listitem')).toContainText(['2026', '2025'])
    await expect(anos.getByRole('listitem').nth(1)).toContainText('Encerrado · de 1 de fevereiro de 2025 a 15 de dezembro de 2025')
    await expect(anos.getByRole('button', { name: /Abrir o ano letivo/ })).toHaveText(['Abrir o ano letivo 2026'])
    await expect(principal(page).getByRole('region', { name: 'Turmas' })).toContainText('Abra o ano letivo acima para criar as turmas')

    // Falha com a tela aberta: outra pessoa da coordenação abriu 2027 enquanto esta tela oferecia o "Abrir" de 2026. A
    // API recusa, a tela explica, e a lista recarrega com o ano em curso e sem o "Abrir".
    await criarAnoLetivoNoBanco(coordenadora.escolaId, 2027, 'em_curso')
    await acionar(anos.getByRole('button', { name: 'Abrir o ano letivo 2026' }), hasTouch)
    await expect(anos.getByRole('alert')).toHaveText('Já há um ano letivo em curso na escola. Só um fica em curso por vez.', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(anos.getByRole('listitem')).toContainText(['2027', '2026', '2025'])
    await expect(anos.getByRole('listitem').first()).toContainText('Em curso')
    await expect(anos.getByRole('button', { name: /Abrir o ano letivo/ })).toHaveCount(0)

    falhar = true
    await page.reload()
    await expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    for (const proibido of [codigoCru('503'), 'INDISPONIVEL']) await expect(page.locator('body')).not.toContainText(proibido)
    expect(await violacoesGraves(page)).toEqual([])

    falhar = false
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(principal(page).getByRole('heading', { name: 'Ano letivo' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('alert')).toHaveCount(0)

    // Cada seção tem o seu carregando e o seu erro, e a tela continua em pé quando uma delas falha: as leituras das
    // séries, das disciplinas e das turmas seguradas, e depois recusadas.
    const seguradas = portao()
    let falharSecoes = true
    for (const rota of ROTAS_DAS_SECOES)
      await page.route(rota, async (pedido: Route) => {
        await seguradas.aberta
        await (falharSecoes ? pedido.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL }) : pedido.continue())
      })
    await page.reload()
    const secoes = [
      { regiao: principal(page).getByRole('region', { name: 'Séries' }), carregando: 'Carregando as séries…', vazio: 'Nenhuma série ainda' },
      { regiao: principal(page).getByRole('region', { name: 'Disciplinas' }), carregando: 'Carregando as disciplinas…', vazio: 'Nenhuma disciplina ainda' },
      { regiao: principal(page).getByRole('region', { name: 'Turmas de 2027' }), carregando: 'Carregando as turmas…', vazio: 'Nenhuma turma ainda' },
    ]
    for (const { regiao, carregando } of secoes) await expect(regiao.getByRole('status').filter({ hasText: carregando })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // O roteiro não diz "falta" do que ainda não leu: mandaria a coordenação criar o que a escola pode já ter.
    const oQueFalta = principal(page).getByRole('region', { name: 'O que falta para a escola começar' })
    const semLeitura = ['Séries · falta', 'Disciplinas · falta', 'Turmas · falta', 'Professores · falta']
    await expect(oQueFalta).toContainText('Ano letivo · feito')
    for (const passo of semLeitura) await expect(oQueFalta).not.toContainText(passo)
    seguradas.abrir()
    for (const { regiao } of secoes) await expect(regiao.getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(anos.getByRole('listitem')).toHaveCount(3)
    // Nem do que falhou.
    for (const passo of semLeitura) await expect(oQueFalta).not.toContainText(passo)
    expect(await violacoesGraves(page)).toEqual([])
    falharSecoes = false
    for (const { regiao, vazio } of secoes) {
      await acionar(regiao.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
      await expect(regiao).toContainText(vazio, { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(regiao.getByRole('alert')).toHaveCount(0)
    }
    // A alocação ainda espera os professores, e o "Tentar de novo" dela os traz: o vazio diz o que falta, e o roteiro
    // volta a marcar o que a escola de fato não tem.
    const alocacao = principal(page).getByRole('region', { name: 'Alocação' })
    await acionar(alocacao.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(alocacao).toContainText('Falta: uma turma; uma disciplina; um professor cadastrado, com o convite em aberto ou já aceito.', { timeout: PRAZO_DA_ENTRADA_MS })
    for (const passo of semLeitura) await expect(oQueFalta).toContainText(passo)
  })
})

test.describe('a lista maior que o que a tela lê', () => {
  test('as turmas passam de dez páginas: a tela para no teto e diz que mostra só as primeiras', async ({ page, hasTouch }) => {
    const coordenadora = await criarEquipeComSenha('coordenador')
    const estrutura = await montarEstruturaNoBanco(coordenadora.escolaId)
    const turma = estrutura.turmas[0]
    if (turma === undefined) throw new Error('estrutura sem turma')
    // Toda página diz que há outra: sem o teto, a tela pediria para sempre.
    // A turma de verdade, lida da primeira resposta, é o molde das outras: a mesma série e o mesmo ano.
    const paginas: string[] = []
    let molde: Record<string, unknown> | undefined
    await page.route('**/v1/turmas?*', async (rota: Route) => {
      const resposta = await rota.fetch()
      const { itens } = (await resposta.json()) as { itens: Array<Record<string, unknown>> }
      molde ??= itens[0]
      paginas.push(rota.request().url())
      const item = { ...molde, id: randomUUID(), nome: `Turma da página ${String(paginas.length)}` }
      await rota.fulfill({ response: resposta, json: { itens: [item], proxima: randomUUID() } })
    })
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await abrirEstrutura(page, hasTouch)
    const turmas = principal(page).getByRole('region', { name: 'Turmas de 2026' })
    await expect(turmas).toContainText('A lista é maior do que esta tela mostra', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(turmas.getByRole('listitem')).toHaveCount(10)
    // Dez páginas, cada uma com o limite de 100 e a seguinte pelo `proxima` da anterior; nenhuma a mais.
    expect(new Set(paginas.map((url) => new URL(url).searchParams.get('limite')))).toEqual(new Set(['100']))
    expect(paginas.filter((url) => new URL(url).searchParams.get('pagina') === null)).toHaveLength(Math.ceil(paginas.length / 10))
    expect(paginas.length % 10).toBe(0)
  })
})

test.describe('renomear e excluir', () => {
  test('o nome repetido fica no campo; o CONFLITO ao excluir explica o que prende e não sobrevive ao reabrir; a turma que outra pessoa excluiu com o diálogo aberto sai da lista; a turma vazia sai', async ({
    page,
    hasTouch,
  }) => {
    test.slow()
    const coordenadora = await criarEquipeComSenha('coordenador')
    // Criadas fora da ordem do nome (a 7B antes da 7A, a de Ciências antes da de Artes, o 7º ano antes do 6º): a tela
    // mostra pela série e pelo nome, e não pela ordem de criação, que é a da API.
    const estrutura = await montarEstruturaNoBanco(coordenadora.escolaId, ['7C', '7B', '7A'])
    const [deOutraPessoa, vazia, comNome] = estrutura.turmas
    if (comNome === undefined || vazia === undefined || deOutraPessoa === undefined) throw new Error('estrutura sem as três turmas')
    await porNaListaDaTurma(coordenadora.escolaId, comNome.id, [{ nome: `Aluna da lista ${randomUUID().slice(0, 8)}`, matricula: '770001' }])
    await criarTodasAsSeriesNoBanco(coordenadora.escolaId)
    const outraDisciplina = `Artes sintética ${randomUUID().slice(0, 8)}`
    const outraDisciplinaId = await criarDisciplinaNoBanco(coordenadora.escolaId, outraDisciplina)
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await abrirEstrutura(page, hasTouch)
    const turmas = principal(page).getByRole('region', { name: 'Turmas de 2026' })
    await expect(turmas).toContainText(vazia.nome, { timeout: PRAZO_DA_ENTRADA_MS })
    const disciplinas = principal(page).getByRole('region', { name: 'Disciplinas' })
    await expect(turmas.getByRole('listitem')).toContainText([comNome.nome, vazia.nome, deOutraPessoa.nome])
    await expect(disciplinas.getByRole('listitem')).toContainText([outraDisciplina, estrutura.disciplina.nome])
    await expect(principal(page).getByRole('region', { name: 'Séries' }).getByRole('listitem')).toHaveText(SERIES_DO_RECORTE)

    // Renomear sem nome: o erro no campo, com o foco nele, e nada é enviado. Para o nome da outra turma: a API recusa, e
    // o erro fica no campo, com o foco nele; com outro nome, salva.
    const renomeacoes: Request[] = []
    page.on('request', (pedido) => {
      if (pedido.method() === 'PATCH' && new URL(pedido.url()).pathname.startsWith('/v1/turmas/')) renomeacoes.push(pedido)
    })
    await acionar(turmas.getByRole('button', { name: `Renomear a turma ${vazia.nome}` }), hasTouch)
    const renomear = dialogo(page, 'Renomear a turma')
    await renomear.getByLabel('Nome da turma').fill('   ')
    await acionar(renomear.getByRole('button', { name: 'Salvar nome' }), hasTouch)
    await expect(renomear.getByText('Digite o nome novo.')).toBeVisible()
    await expect(renomear.getByLabel('Nome da turma')).toBeFocused()
    await renomear.getByLabel('Nome da turma').fill(comNome.nome)
    await acionar(renomear.getByRole('button', { name: 'Salvar nome' }), hasTouch)
    await expect(renomear.getByText('Já existe uma turma com este nome neste ano letivo. Escolha outro.')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(renomear.getByLabel('Nome da turma')).toBeFocused()
    await expect(renomear.getByLabel('Nome da turma')).toHaveAttribute('aria-invalid', 'true')
    const novoNome = `${vazia.nome} renomeada`
    await renomear.getByLabel('Nome da turma').fill(novoNome)
    await acionar(renomear.getByRole('button', { name: 'Salvar nome' }), hasTouch)
    await expect(renomear).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(anuncio(turmas, `Turma renomeada para ${novoNome}.`)).toBeVisible()
    await expect(principal(page).getByRole('status').filter({ hasText: `Turma renomeada para ${novoNome}.` })).toHaveCount(1)
    await expect(turmas).toContainText(novoNome)
    expect(renomeacoes).toHaveLength(2)
    // O anúncio é da ação que terminou: abrir o diálogo seguinte o apaga.

    // Excluir a turma com nome na lista: CONFLITO, com o que prende, o foco no aviso, e só "Fechar". Um pedido só no
    // clique duplo.
    const exclusoes: Request[] = []
    page.on('request', (pedido) => {
      if (pedido.method() === 'DELETE' && new URL(pedido.url()).pathname.startsWith('/v1/turmas/')) exclusoes.push(pedido)
    })
    const excluirComNome = turmas.getByRole('button', { name: `Excluir a turma ${comNome.nome}` })
    await acionar(excluirComNome, hasTouch)
    const excluir = dialogo(page, 'Excluir a turma')
    await expect(page.getByText(`Turma renomeada para ${novoNome}.`)).toHaveCount(0)
    await expect(excluir.getByText(/Só sai a turma vazia/)).toBeFocused()
    await excluir.getByRole('button', { name: 'Excluir turma' }).dblclick()
    const aviso = excluir.getByRole('alert')
    await expect(aviso).toContainText('ainda tem nomes na lista, professor alocado, pedido de aluno ou acesso da turma em vigor', { timeout: PRAZO_DA_ENTRADA_MS })
    // E o que a tela pode e o que não pode desfazer.
    await expect(aviso).toContainText('Os nomes livres saem pela lista de nomes da turma; a alocação, o pedido e o acesso não se desfazem por esta tela.')
    await expect(aviso).toBeFocused()
    expect(exclusoes).toHaveLength(1)
    await expect(excluir.getByRole('button', { name: 'Excluir turma' })).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(excluir.getByRole('button', { name: 'Fechar' }), hasTouch)
    await expect(excluir).toHaveCount(0)
    await expect(excluirComNome).toBeFocused()
    // Reabrir começa do zero: sem o aviso da tentativa anterior, e o foco no texto, não no alerta.
    await acionar(excluirComNome, hasTouch)
    await expect(excluir.getByRole('alert')).toHaveCount(0)
    await expect(excluir.getByText(/Só sai a turma vazia/)).toBeFocused()
    await acionar(excluir.getByRole('button', { name: 'Cancelar' }), hasTouch)
    await expect(turmas).toContainText(comNome.nome)

    // Falha com o diálogo aberto que muda a lista: outra pessoa da coordenação excluiu a turma enquanto o diálogo estava
    // aberto. A API responde como inexistente, a tela explica, a lista recarrega sem a turma, sobra só "Fechar", e o foco
    // vai para o título das turmas, porque o botão que abriu saiu com ela.
    await acionar(turmas.getByRole('button', { name: `Excluir a turma ${deOutraPessoa.nome}` }), hasTouch)
    await expect(excluir.getByText(/Só sai a turma vazia/)).toBeFocused()
    await apagarTurmaNoBanco(coordenadora.escolaId, deOutraPessoa.id)
    await acionar(excluir.getByRole('button', { name: 'Excluir turma' }), hasTouch)
    await expect(excluir.getByRole('alert')).toHaveText('Esta turma já não existe. A lista foi atualizada.', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(excluir.getByRole('button', { name: 'Excluir turma' })).toHaveCount(0)
    await expect(turmas).not.toContainText(deOutraPessoa.nome)
    await acionar(excluir.getByRole('button', { name: 'Fechar' }), hasTouch)
    await expect(excluir).toHaveCount(0)
    await expect(principal(page).getByRole('heading', { name: 'Turmas de 2026' })).toBeFocused()

    // A turma vazia sai; o botão que abriu sai com ela, e o foco vai para o título das turmas.
    await acionar(turmas.getByRole('button', { name: `Excluir a turma ${novoNome}` }), hasTouch)
    await acionar(excluir.getByRole('button', { name: 'Excluir turma' }), hasTouch)
    await expect(excluir).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(anuncio(turmas, `Turma ${novoNome} excluída.`)).toBeVisible()
    // O anúncio fica na seção das turmas, e diz o nome: quem saiu foi o cartão dela.
    await expect(turmas.getByRole('listitem').filter({ hasText: novoNome })).toHaveCount(0)
    await expect(principal(page).getByRole('heading', { name: 'Turmas de 2026' })).toBeFocused()

    // A escolha da série na turma nova vem na ordem da escola, e não na de criação (o 7º ano nasceu antes do 6º).
    await acionar(principal(page).getByRole('button', { name: 'Nova turma' }), hasTouch)
    const daTurma = dialogo(page, 'Nova turma em 2026')
    await expect(daTurma.getByLabel('Série').locator('option')).toHaveText(SERIES_DO_RECORTE)
    await acionar(daTurma.getByRole('button', { name: 'Cancelar' }), hasTouch)

    // Com as sete séries do recorte, não há o que criar: o diálogo diz isso e só oferece "Fechar".
    await acionar(principal(page).getByRole('button', { name: 'Nova série' }), hasTouch)
    const daSerie = dialogo(page, 'Nova série')
    await expect(daSerie).toContainText('A escola já tem todas as séries')
    await expect(daSerie.getByRole('button', { name: 'Criar série' })).toHaveCount(0)
    await acionar(daSerie.getByRole('button', { name: 'Fechar' }), hasTouch)

    // A série que outra pessoa excluiu com o diálogo da turma nova aberto: a API responde como inexistente, a tela
    // explica, e a escolha e a lista de séries recarregam sem ela.
    await acionar(principal(page).getByRole('button', { name: 'Nova turma' }), hasTouch)
    await daTurma.getByLabel('Série').selectOption({ label: '6º ano do Ensino Fundamental' })
    const turmaNova = `Turma nova ${randomUUID().slice(0, 8)}`
    await daTurma.getByLabel('Nome da turma').fill(turmaNova)
    await apagarSerieNoBanco(coordenadora.escolaId, 'ef_anos_finais', 6)
    await acionar(daTurma.getByRole('button', { name: 'Criar turma' }), hasTouch)
    await expect(daTurma.getByRole('alert')).toHaveText('A série ou o ano letivo mudou enquanto você preenchia. A tela foi atualizada: confira e tente de novo.', {
      timeout: PRAZO_DA_ENTRADA_MS,
    })
    await expect(daTurma.getByLabel('Série').locator('option')).toHaveText(SERIES_DO_RECORTE.slice(1))
    await expect(principal(page).getByRole('region', { name: 'Séries' }).getByRole('listitem')).toHaveText(SERIES_DO_RECORTE.slice(1))
    // A série que saiu sai da escolha: o envio seguinte cria a turma na série que a tela mostra, e não reenvia a que a
    // API acabou de recusar.
    await acionar(daTurma.getByRole('button', { name: 'Criar turma' }), hasTouch)
    await expect(daTurma).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(turmas.getByRole('listitem').filter({ hasText: turmaNova })).toContainText('7º ano do Ensino Fundamental')

    // A disciplina que outra pessoa excluiu com o diálogo aberto: a lista recarrega, e sobra só "Fechar".
    const renomeacoesDeDisciplina: Request[] = []
    page.on('request', (pedido) => {
      if (pedido.method() === 'PATCH' && new URL(pedido.url()).pathname.startsWith('/v1/disciplinas/')) renomeacoesDeDisciplina.push(pedido)
    })
    await acionar(disciplinas.getByRole('button', { name: `Renomear a disciplina ${outraDisciplina}` }), hasTouch)
    const renomearDisciplina = dialogo(page, 'Renomear a disciplina')
    await apagarDisciplinaNoBanco(coordenadora.escolaId, outraDisciplinaId)
    await renomearDisciplina.getByLabel('Nome da disciplina').fill(`${outraDisciplina} nova`)
    await acionar(renomearDisciplina.getByRole('button', { name: 'Salvar nome' }), hasTouch)
    await expect(renomearDisciplina.getByRole('alert')).toHaveText('Este item já não existe. A lista foi atualizada.', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(renomearDisciplina.getByRole('button', { name: 'Salvar nome' })).toHaveCount(0)
    await expect(disciplinas).not.toContainText(outraDisciplina)
    // Sem o botão, o Enter no campo também não manda de novo o que a API acabou de dizer que não existe (contado no fim).
    await renomearDisciplina.getByLabel('Nome da disciplina').press('Enter')
    await acionar(renomearDisciplina.getByRole('button', { name: 'Fechar' }), hasTouch)
    await expect(principal(page).getByRole('heading', { name: 'Disciplinas' })).toBeFocused()

    // Renomear a disciplina que continua lá: o anúncio aparece na seção das disciplinas.
    const renomeada = `${estrutura.disciplina.nome} II`
    await acionar(disciplinas.getByRole('button', { name: `Renomear a disciplina ${estrutura.disciplina.nome}` }), hasTouch)
    await renomearDisciplina.getByLabel('Nome da disciplina').fill(renomeada)
    await acionar(renomearDisciplina.getByRole('button', { name: 'Salvar nome' }), hasTouch)
    await expect(renomearDisciplina).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(anuncio(disciplinas, `Disciplina renomeada para ${renomeada}.`)).toBeVisible()

    // A disciplina sem professor alocado sai também.
    await acionar(disciplinas.getByRole('button', { name: `Excluir a disciplina ${renomeada}` }), hasTouch)
    await acionar(dialogo(page, 'Excluir a disciplina').getByRole('button', { name: 'Excluir disciplina' }), hasTouch)
    await expect(anuncio(disciplinas, `Disciplina ${renomeada} excluída.`)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(disciplinas.getByRole('listitem').filter({ hasText: renomeada })).toHaveCount(0)
    expect(renomeacoesDeDisciplina).toHaveLength(2)
  })
})

test.describe('W12: a Estrutura a 360 px e só com teclado', () => {
  test('sem rolagem horizontal, também no diálogo; cartões abaixo de 768 px; alvos de 44 px; criar a disciplina só com Tab e Enter, com o foco preso e devolvido', async ({
    page,
    hasTouch,
  }) => {
    test.slow()
    await page.setViewportSize({ width: 360, height: 800 })
    const coordenadora = await criarEquipeComSenha('coordenador')
    // Nomes longos, sem espaço, para provar que nada estica a tela.
    const estrutura = await montarEstruturaNoBanco(coordenadora.escolaId, [`7${'A'.repeat(28)}`])
    const turma = estrutura.turmas[0]
    if (turma === undefined) throw new Error('estrutura sem turma')
    // Um professor alocável, para a alocação mostrar a escolha e o "Alocar".
    await convidarProfessorNoBanco(coordenadora.escolaId, 'pendente')
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await abrirEstrutura(page, hasTouch)
    const turmas = principal(page).getByRole('region', { name: 'Turmas de 2026' })
    await expect(turmas).toContainText(turma.nome, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('region', { name: 'Alocação' }).getByRole('button', { name: 'Alocar' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(await larguraExcedente(page)).toBe(0)
    // Cartão: abaixo de 768 px, a turma e as ações em coluna.
    expect(await turmas.getByRole('listitem').first().evaluate((item) => getComputedStyle(item).flexDirection)).toBe('column')
    for (const [alvo, descricao] of [
      [principal(page).getByRole('button', { name: 'Nova turma' }), 'Nova turma'],
      [turmas.getByRole('link', { name: `Lista de nomes da turma ${turma.nome}` }), 'Lista de nomes'],
      [turmas.getByRole('button', { name: `Excluir a turma ${turma.nome}` }), 'Excluir'],
      [principal(page).getByRole('region', { name: 'Alocação' }).getByRole('button', { name: 'Alocar' }), 'Alocar'],
    ] as const)
      await alvoDeToque(alvo, descricao)
    // O item da lateral leva à mesma tela.
    await expect(secoesDaNavegacao(page).getByRole('link', { name: 'Escola' })).toHaveAttribute('aria-current', 'page')

    // Só com teclado: Tab até "Nova disciplina", Enter abre, o foco começa no campo e não sai do diálogo.
    const novaDisciplina = principal(page).getByRole('button', { name: 'Nova disciplina' })
    await novaDisciplina.focus()
    await page.keyboard.press('Enter')
    const doDialogo = dialogo(page, 'Nova disciplina')
    await expect(doDialogo.getByLabel('Nome da disciplina')).toBeFocused()
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    const dentroDoDialogo = () => page.evaluate(() => document.activeElement?.closest('dialog[open]') !== null)
    for (let tecla = 0; tecla < 8; tecla++) {
      await page.keyboard.press('Tab')
      expect(await dentroDoDialogo()).toBe(true)
    }
    for (let tecla = 0; tecla < 8; tecla++) {
      await page.keyboard.press('Shift+Tab')
      expect(await dentroDoDialogo()).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(doDialogo).toHaveCount(0)
    await expect(novaDisciplina).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(doDialogo.getByLabel('Nome da disciplina')).toBeFocused()
    const nome = `História ${randomUUID().slice(0, 8)}`
    await page.keyboard.type(nome)
    await page.keyboard.press('Enter')
    await expect(doDialogo).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(novaDisciplina).toBeFocused()
    await expect(principal(page).getByRole('region', { name: 'Disciplinas' })).toContainText(nome)

    // A turma aberta, com a prévia de uma linha longa, também cabe.
    await abrirTurma(page, turma.nome, hasTouch)
    await principal(page).getByLabel('Lista colada').fill(`${'Nome'.repeat(30)};${'9'.repeat(40)}`)
    await acionar(principal(page).getByRole('button', { name: 'Ver a prévia' }), hasTouch)
    await expect(principal(page).getByRole('region', { name: 'Prévia' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(await larguraExcedente(page)).toBe(0)
    await alvoDeToque(principal(page).getByRole('button', { name: 'Gravar lista' }), 'Gravar lista')
    await alvoDeToque(principal(page).getByRole('button', { name: 'Ver a prévia' }), 'Ver a prévia')
    expect(await violacoesGraves(page)).toEqual([])
  })
})

test.describe('recomeço da Estrutura', () => {
  test('segunda pessoa: a coordenação de B entra na aba da de A, e nenhuma turma nem nome de A aparece, nem pelo endereço da turma', async ({ page, hasTouch }) => {
    test.slow()
    const deA = await criarEquipeComSenha('coordenador')
    const estruturaDeA = await montarEstruturaNoBanco(deA.escolaId)
    const turmaDeA = estruturaDeA.turmas[0]
    if (turmaDeA === undefined) throw new Error('estrutura sem turma')
    const nomeDeA = `Aluno de A ${randomUUID().slice(0, 8)}`
    await porNaListaDaTurma(deA.escolaId, turmaDeA.id, [{ nome: nomeDeA, matricula: '550001' }])
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, deA, hasTouch)
    await abrirEstrutura(page, hasTouch)
    await expect(principal(page).getByRole('region', { name: 'Turmas de 2026' })).toContainText(turmaDeA.nome, { timeout: PRAZO_DA_ENTRADA_MS })
    await abrirTurma(page, turmaDeA.nome, hasTouch)
    await expect(principal(page)).toContainText(nomeDeA, { timeout: PRAZO_DA_ENTRADA_MS })
    await abrirNavegacao(page, hasTouch)
    await acionar(lateral(page).getByRole('button', { name: 'Sair' }), hasTouch)
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })

    // A de B entra na mesma aba, sem recarregar, com a leitura dos anos segurada: é aí que a estrutura de A apareceria.
    const deB = await criarEquipeComSenha('coordenador')
    const segurada = portao()
    await page.route(ROTA_ANOS, async (rota: Route) => {
      await segurada.aberta
      await rota.continue()
    })
    await entrarComoCoordenacaoNaMesmaAba(page, deB, hasTouch)
    // Ela abre em Governança (A5), que também não mostra nada de A, e vai à Estrutura pela lateral.
    await esperarPainel(page)
    for (const deOutra of [turmaDeA.nome, nomeDeA, estruturaDeA.disciplina.nome]) await expect(page.locator('body')).not.toContainText(deOutra)
    await irPelaCoordenacao(page, 'Turmas', hasTouch)
    await expect(principal(page).getByRole('status').filter({ hasText: 'Carregando a estrutura da escola…' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    for (const deOutra of [turmaDeA.nome, nomeDeA, estruturaDeA.disciplina.nome]) await expect(page.locator('body')).not.toContainText(deOutra)
    segurada.abrir()
    await expect(principal(page).getByRole('heading', { name: 'Turmas de 2026' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    for (const deOutra of [turmaDeA.nome, nomeDeA, estruturaDeA.disciplina.nome]) await expect(page.locator('body')).not.toContainText(deOutra)

    // Nem pelo endereço da turma de A: a API responde como inexistente, e nada de A aparece.
    await page.evaluate((destino) => {
      window.history.pushState(null, '', destino)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, `/coordenacao/estrutura/turmas/${turmaDeA.id}`)
    await expect(principal(page)).toContainText('Esta turma não está no ano letivo em curso', { timeout: PRAZO_DA_ENTRADA_MS })
    // Na página que já abre sem a turma, o aviso não puxa o foco: isso é de quando ela sai com a tela aberta (16.0).
    await expect(principal(page).getByRole('status').filter({ hasText: 'Esta turma não está no ano letivo em curso' })).not.toBeFocused()
    for (const deOutra of [turmaDeA.nome, nomeDeA]) await expect(page.locator('body')).not.toContainText(deOutra)
  })
})

// O arquivo do Excel é lido do disco pelo navegador; aqui só se confere que ele continua em windows-1252, e não foi
// regravado em UTF-8 por um editor: sem isso, o W10 passaria sem provar a leitura do Excel.
test('o arquivo de amostra do Excel está em windows-1252, com ; e acento', () => {
  const bytes = readFileSync(ARQUIVO_DO_EXCEL)
  expect(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes)).toThrow()
  expect(new TextDecoder('windows-1252').decode(bytes)).toContain('João Conceição;900101')
})
