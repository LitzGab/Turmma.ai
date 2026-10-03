import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { Locator, Page, Request, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { abrirNavegacao, entrarComoCoordenacaoNaMesmaAba, esperarEstrutura, lateral, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
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
  vencerConviteNoBanco,
} from './__fixtures__/sessao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A Estrutura da coordenação (A1, tarefa 13.0; `tasks/prd-apresentacao-escola/cenarios.md`): W4 de Estrutura, Lista e
 * Alocação; W10 (o arquivo do Excel e o UTF-8 com BOM); W12 (360 px, dentro do diálogo, cartões, alvos, teclado); o
 * clique duplo em "Gravar lista"; e o recomeço da tela. Tudo pela tela, nos projetos `chromebook` e `celular`, com nomes
 * e matrículas inventados pelo teste.
 */

const ROTA_ANOS = '**/v1/anos-letivos*'
const ROTA_VINCULOS = '**/v1/vinculos?*'
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
    await expect(principal(page).getByRole('status').filter({ hasText: 'Carregando a estrutura da escola…' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Estrutura · Turmma')
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
    await esperarEstrutura(page)
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
    for (const proibido of ['503', 'INDISPONIVEL']) await expect(page.locator('body')).not.toContainText(proibido)
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
    await esperarEstrutura(page)
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
    await esperarEstrutura(page)
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

test.describe('W10 e W4 (Lista): a lista de nomes da turma', () => {
  test('o arquivo do Excel em windows-1252 e o UTF-8 com BOM e vírgula: a prévia com os nomes certos, erros primeiro e em texto; gravar só sem erro, uma vez só', async ({
    page,
    hasTouch,
  }) => {
    test.slow()
    const coordenadora = await criarEquipeComSenha('coordenador')
    const estrutura = await montarEstruturaNoBanco(coordenadora.escolaId)
    const turma = estrutura.turmas[0]
    if (turma === undefined) throw new Error('estrutura sem turma')
    const leiturasDaLista: Request[] = []
    const gravacoes: Request[] = []
    const segurarLeitura = portao()
    page.on('request', (pedido) => {
      const caminho = new URL(pedido.url()).pathname
      if (caminho === `/v1/turmas/${turma.id}/lista` && pedido.method() === 'POST') gravacoes.push(pedido)
      if (caminho === `/v1/turmas/${turma.id}/lista` && pedido.method() === 'GET') leiturasDaLista.push(pedido)
    })
    await page.route(`**/v1/turmas/${turma.id}/lista?*`, async (rota: Route) => {
      await segurarLeitura.aberta
      await rota.continue()
    })
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await esperarEstrutura(page)
    await expect(principal(page).getByRole('region', { name: 'Turmas de 2026' })).toContainText(turma.nome, { timeout: PRAZO_DA_ENTRADA_MS })
    await abrirTurma(page, turma.nome, hasTouch)
    await expect(page).toHaveTitle(`Turma ${turma.nome} · Turmma`)

    // Carregando, e depois o vazio com o que fazer.
    await expect(principal(page).getByRole('status').filter({ hasText: 'Carregando a lista de nomes…' })).toBeVisible()
    segurarLeitura.abrir()
    await expect(principal(page)).toContainText('Cole a lista ou envie o arquivo: nome; matrícula', { timeout: PRAZO_DA_ENTRADA_MS })
    // A leitura leva a finalidade (regra 20, item 10).
    expect(new URL(leiturasDaLista[0]?.url() ?? 'http://x').searchParams.get('finalidade')).toBe('conferencia_de_cadastro')
    await expect(principal(page)).toContainText('nome; matrícula')
    expect(await violacoesGraves(page)).toEqual([])

    // O arquivo do Excel: windows-1252, com `;`, acento, uma linha sem matrícula e uma matrícula repetida.
    const arquivo = principal(page).getByLabel('Ou escolha o arquivo (CSV ou TXT, como o Excel salva)')
    await arquivo.setInputFiles(ARQUIVO_DO_EXCEL)
    await expect(principal(page).getByLabel('Lista colada')).toHaveValue(/João Conceição;900101/)
    // A escolha é limpa depois de lida: a mesma planilha, corrigida e escolhida de novo, dispara outra leitura (no
    // navegador, escolher de novo o arquivo que continua escolhido não avisa a página).
    await expect(arquivo).toHaveValue('')
    await acionar(principal(page).getByRole('button', { name: 'Ver a prévia' }), hasTouch)
    const previa = principal(page).getByRole('region', { name: 'Prévia' })
    await expect(previa.getByRole('status')).toHaveText('1 nome entra · 0 já estão na lista · 3 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    // A prévia que chega leva o foco ao título dela: o leitor de tela lê o resumo e as linhas em seguida.
    await expect(previa.getByRole('heading', { name: 'Prévia' })).toBeFocused()
    // Erros primeiro, na ordem do texto, cada um em texto; depois a linha que entra.
    await expect(previa.getByRole('listitem')).toHaveText([
      /^Linha 2: João Conceição · 900101Erro: Esta matrícula aparece em mais de uma linha do texto\.$/,
      /^Linha 4: Cecília BrandãoErro: Falta a matrícula\.$/,
      /^Linha 5: Érico Ibañez · 900101Erro: Esta matrícula aparece em mais de uma linha do texto\.$/,
      /^Linha 3: Antônia Araújo · 900102Entra na lista\.$/,
    ])
    await expect(previa.getByRole('button', { name: 'Gravar lista' })).toHaveCount(0)
    await expect(previa).toContainText('a lista só é gravada sem erro nenhum')
    expect(await larguraExcedente(page)).toBe(0)
    // O pedido de foco da prévia é atendido uma vez só: com a prévia na tela, o aviso da planilha recusada leva o foco, e
    // a renderização que ele provoca não o devolve ao título da prévia.
    await arquivo.setInputFiles({ name: 'lista.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(500)]) })
    const avisoDaPlanilha = principal(page).getByRole('region', { name: 'Subir a lista de nomes' }).getByRole('alert')
    await expect(avisoDaPlanilha).toContainText('Este arquivo é uma planilha (.xlsx, .xls ou .ods), e não texto.')
    await expect(previa).toBeVisible()
    await expect(avisoDaPlanilha).toBeFocused()
    // Nem outra renderização o atende de novo: abrir e cancelar o diálogo do nome avulso, com a prévia ainda na tela,
    // devolve o foco ao botão que o abriu, e não ao título da prévia.
    const acrescentar = principal(page).getByRole('button', { name: 'Acrescentar um nome' })
    await acionar(acrescentar, hasTouch)
    await acionar(dialogo(page, 'Acrescentar um nome').getByRole('button', { name: 'Cancelar' }), hasTouch)
    await expect(previa).toBeVisible()
    await expect(acrescentar).toBeFocused()
    // Voltar ao campo para corrigir: a tecla errada tira a prévia, e apagá-la a traz de volta, porque o texto voltou a
    // ser o dela. O foco fica no campo, e o que a pessoa digita em seguida entra nele.
    const colada = principal(page).getByLabel('Lista colada')
    const lidaDoArquivo = await colada.inputValue()
    await colada.focus()
    await colada.press('Control+End')
    await page.keyboard.type('x')
    await expect(previa).toHaveCount(0)
    await page.keyboard.press('Backspace')
    await expect(previa).toBeVisible()
    await expect(colada).toBeFocused()
    await page.keyboard.type('Zé;900109')
    await expect(colada).toHaveValue(`${lidaDoArquivo}Zé;900109`)

    // O UTF-8 com BOM e vírgula, como o Google Planilhas salva: sem erro, e grava. O clique duplo manda um pedido só.
    const marca = randomUUID().slice(0, 8)
    // Dois alunos com o mesmo nome na turma, o primeiro e o último, cada um com a sua matrícula.
    const homonimo = `Ígor Ávila ${marca}`
    const nomes = [homonimo, `Luíza Góes ${marca}`, `Otávio Ümit ${marca}`, homonimo]
    const utf8 = `nome,matrícula\n${nomes.map((nome, posicao) => `${nome},${String(880001 + posicao)}`).join('\n')}\n`
    const comBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(utf8, 'utf8')])
    await arquivo.setInputFiles({ name: 'lista.csv', mimeType: 'text/csv', buffer: comBom })
    // Editar o texto descarta a prévia do texto anterior.
    await expect(previa).toHaveCount(0)
    // O controle do navegador volta a dizer que não há arquivo escolhido: a tela diz de onde veio o texto.
    const lido = principal(page).getByText('Arquivo lido: lista.csv. O texto dele está no campo acima.')
    await expect(lido).toBeVisible()
    await acionar(principal(page).getByRole('button', { name: 'Ver a prévia' }), hasTouch)
    await expect(previa.getByRole('status')).toHaveText('4 nomes entram · 0 já estão na lista · 0 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    for (const nome of nomes) await expect(previa).toContainText(nome)
    await expect(principal(page).getByLabel('Lista colada')).not.toHaveValue(/^\uFEFF/)
    await previa.getByRole('button', { name: 'Gravar lista' }).dblclick()
    await expect(anuncio(secao(page, 'Nomes da turma'), '4 nomes gravados na lista.')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(gravacoes).toHaveLength(1)
    await expect(principal(page).getByRole('heading', { name: 'Nomes da turma' })).toBeFocused()
    const lista = principal(page).getByRole('region', { name: 'Nomes da turma' })
    for (const nome of nomes) await expect(lista).toContainText(nome)
    await expect(lista).toContainText('Matrícula 880001')
    await expect(principal(page).getByLabel('Lista colada')).toHaveValue('')
    await expect(lido).toHaveCount(0)

    // Mesma entrada: a mesma lista de novo sai "já existe", sem duplicar, e não há o que gravar.
    await arquivo.setInputFiles({ name: 'lista.csv', mimeType: 'text/csv', buffer: comBom })
    await expect(arquivo).toHaveValue('')
    await acionar(principal(page).getByRole('button', { name: 'Ver a prévia' }), hasTouch)
    await expect(previa.getByRole('status')).toHaveText('0 nomes entram · 4 já estão na lista · 0 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(previa).toContainText('nada muda, nem o nome gravado')
    await expect(previa).toContainText('Nada novo para gravar')
    await expect(previa.getByRole('button', { name: 'Gravar lista' })).toHaveCount(0)
    await expect(lista.getByRole('listitem')).toHaveCount(4)

    // Dois alunos com o mesmo nome: cada "Retirar" diz a matrícula, e a confirmação também. Sai o da matrícula
    // escolhida, e o outro fica.
    await expect(lista.getByRole('button', { name: `Retirar ${homonimo}, matrícula 880001 da lista` })).toBeVisible()
    await acionar(lista.getByRole('button', { name: `Retirar ${homonimo}, matrícula 880004 da lista` }), hasTouch)
    const retirar = dialogo(page, 'Retirar o nome da lista')
    await expect(retirar).toContainText(`${homonimo}, matrícula 880004, sai da lista desta turma`)
    await acionar(retirar.getByRole('button', { name: 'Retirar da lista' }), hasTouch)
    await expect(anuncio(secao(page, 'Nomes da turma'), 'Nome retirado da lista.')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista.getByRole('listitem')).toHaveCount(3)
    await expect(lista).toContainText('Matrícula 880001')
    await expect(lista).not.toContainText('Matrícula 880004')

    // Sem rastro: nome e matrícula não vão para o armazenamento do navegador nem para o endereço, e a tela não cria
    // banco nem cache no navegador.
    const guardado = await page.evaluate(async () => ({
      texto: JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage), location.href]),
      bancos: (await indexedDB.databases()).map((banco) => banco.name),
      caches: await caches.keys(),
    }))
    for (const dado of [...nomes, '880001', 'João', '900101']) expect(guardado.texto).not.toContain(dado)
    expect(guardado.bancos).toEqual([])
    expect(guardado.caches).toEqual([])
  })

  test('a lista paginada, sem releitura ao voltar para a aba; o que a tela segura antes de enviar; a resposta atrasada; a gravação recusada; o avulso e a retirada; o erro', async ({
    page,
    hasTouch,
  }) => {
    test.slow()
    const coordenadora = await criarEquipeComSenha('coordenador')
    const estrutura = await montarEstruturaNoBanco(coordenadora.escolaId, ['7A', '7B'])
    const [turma, outraTurma] = estrutura.turmas
    if (turma === undefined || outraTurma === undefined) throw new Error('estrutura sem as duas turmas')
    const marca = randomUUID().slice(0, 8)
    // 101 nomes: a primeira página traz 100, e o reivindicado é o primeiro depois da primeira.
    await porNaListaDaTurma(coordenadora.escolaId, turma.id, [
      { nome: `Primeira da lista ${marca}`, matricula: '660001' },
      ...Array.from({ length: 99 }, (_, posicao) => ({ nome: `Colega ${String(posicao)} ${marca}`, matricula: String(661000 + posicao) })),
      { nome: `Já pediu o nome ${marca}`, matricula: '669999', estado: 'reivindicado' as const },
    ])
    const leituras: Request[] = []
    const previas: Request[] = []
    page.on('request', (pedido) => {
      const caminho = new URL(pedido.url()).pathname
      if (pedido.method() === 'GET' && caminho === `/v1/turmas/${turma.id}/lista`) leituras.push(pedido)
      if (caminho === `/v1/turmas/${turma.id}/lista/previa`) previas.push(pedido)
    })
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await esperarEstrutura(page)
    await expect(principal(page).getByRole('region', { name: 'Turmas de 2026' })).toContainText(turma.nome, { timeout: PRAZO_DA_ENTRADA_MS })
    await abrirTurma(page, turma.nome, hasTouch)
    const lista = principal(page).getByRole('region', { name: 'Nomes da turma' })
    await expect(lista).toContainText(`Primeira da lista ${marca}`, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista).toContainText('Mostrando os primeiros 100 nomes')
    await expect(lista.getByRole('listitem')).toHaveCount(100)

    // Cada leitura da coordenação vai para a auditoria: voltar para a aba, uma hora depois, relê o que envelhece (a turma
    // aberta), e não a lista. A releitura da turma é o sinal de que a volta foi tratada: a da lista sairia junto com ela,
    // depois de a sessão renovar, e não num prazo que o teste teria de adivinhar.
    expect(leituras).toHaveLength(1)
    const releituraDaTurma = page.waitForResponse((resposta) => resposta.request().method() === 'GET' && new URL(resposta.url()).pathname === `/v1/turmas/${turma.id}`, {
      timeout: PRAZO_DA_ENTRADA_MS,
    })
    await page.evaluate(() => {
      const agora = Date.now()
      Date.now = () => agora + 60 * 60 * 1_000
      window.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('focus'))
    })
    await (await releituraDaTurma).finished()
    expect(leituras).toHaveLength(1)
    await page.evaluate(() => {
      Date.now = () => new Date().getTime()
    })

    // A página seguinte: o nome que o aluno já pediu, sem "Retirar", com o estado em texto.
    await acionar(lista.getByRole('button', { name: 'Ver mais nomes' }), hasTouch)
    await expect(lista.getByRole('listitem')).toHaveCount(101, { timeout: PRAZO_DA_ENTRADA_MS })
    // As leituras até aqui: a de abrir a turma e a da página seguinte, e nenhuma pela volta para a aba.
    expect(leituras).toHaveLength(2)
    await expect(lista).toContainText('101 nomes na lista')
    const reivindicado = lista.getByRole('listitem').filter({ hasText: `Já pediu o nome ${marca}` })
    await expect(reivindicado).toContainText('O aluno pediu o nome: esperando a decisão')
    await expect(reivindicado.getByRole('button')).toHaveCount(0)
    await expect(lista.getByRole('button', { name: `Retirar Primeira da lista ${marca}, matrícula 660001 da lista` })).toBeVisible()

    // O que a tela segura antes de enviar: o texto vazio, a lista acima de 200 nomes e o arquivo acima de 64 KB.
    const campo = principal(page).getByLabel('Lista colada')
    const verPrevia = principal(page).getByRole('button', { name: 'Ver a prévia' })
    const subir = principal(page).getByRole('region', { name: 'Subir a lista de nomes' })
    await acionar(verPrevia, hasTouch)
    await expect(subir.getByRole('alert')).toHaveText('Cole a lista ou escolha o arquivo antes de ver a prévia.')
    await campo.fill(Array.from({ length: 202 }, (_, posicao) => `Aluno ${String(posicao)};${String(700000 + posicao)}`).join('\n'))
    await acionar(verPrevia, hasTouch)
    await expect(subir.getByRole('alert')).toHaveText('A lista passa de 200 nomes. Divida em partes e envie uma de cada vez.')
    await principal(page)
      .getByLabel('Ou escolha o arquivo (CSV ou TXT, como o Excel salva)')
      .setInputFiles({ name: 'grande.csv', mimeType: 'text/csv', buffer: Buffer.alloc(64 * 1024 + 4, 'a') })
    await expect(subir.getByRole('alert')).toHaveText('A lista é grande demais para um envio só. Divida em partes e envie uma de cada vez.')
    // A planilha do Excel (um zip) não é texto: a tela diz para salvar como CSV, em vez de encher o campo de lixo.
    await principal(page)
      .getByLabel('Ou escolha o arquivo (CSV ou TXT, como o Excel salva)')
      .setInputFiles({ name: 'lista.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(2_000)]) })
    await expect(subir.getByRole('alert')).toContainText('Este arquivo é uma planilha (.xlsx, .xls ou .ods), e não texto.')
    await expect(campo).not.toHaveValue(/PK/)
    expect(previas).toHaveLength(0)

    // A prévia que a API recusa (só o cabeçalho, sem aluno): a tela diz o que conferir, e o aviso é do texto que foi
    // recusado, e sai quando o texto muda.
    await campo.fill('nome;matrícula')
    // O aviso do teto era do texto de antes: o texto novo o tira.
    await expect(subir.getByRole('alert')).toHaveCount(0)
    await acionar(verPrevia, hasTouch)
    await expect(subir.getByRole('alert')).toContainText('Não deu para ler a lista. Confira se cada linha tem o nome e a matrícula', { timeout: PRAZO_DA_ENTRADA_MS })
    // O alerta da prévia recusada leva o foco quando a resposta chega; quando ele volta porque o texto voltou a ser o
    // recusado (uma tecla errada e apagada), o foco fica no campo, e o que a pessoa digita em seguida entra nele.
    await expect(subir.getByRole('alert')).toBeFocused()
    await campo.focus()
    await campo.press('Control+End')
    await page.keyboard.type('x')
    await expect(subir.getByRole('alert')).toHaveCount(0)
    await page.keyboard.press('Backspace')
    await expect(subir.getByRole('alert')).toBeVisible()
    await expect(campo).toBeFocused()
    await page.keyboard.type('\nAna;1')
    await expect(campo).toHaveValue('nome;matrícula\nAna;1')
    await expect(subir.getByRole('alert')).toHaveCount(0)
    expect(previas).toHaveLength(1)
    await campo.fill('nome;matrícula\n')
    await expect(subir.getByRole('alert')).toHaveCount(0)
    expect(previas).toHaveLength(1)

    // O que o leitor aceita calado e a tela aponta: o cabeçalho que ele não reconhece entra como aluno, e a coluna que
    // parece CPF segura a gravação (aluno não tem CPF, regra 20).
    await campo.fill(`Aluno;RA\nCom documento ${marca};123.456.789-09`)
    await acionar(verPrevia, hasTouch)
    const comAvisos = principal(page).getByRole('region', { name: 'Prévia' })
    await expect(comAvisos.getByRole('status')).toHaveText('2 nomes entram · 0 já estão na lista · 0 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(comAvisos).toContainText('A primeira linha parece um cabeçalho, e vai entrar como aluno.')
    await expect(comAvisos).toContainText('A segunda coluna parece CPF ou data de nascimento, e não matrícula.')
    // A linha suspeita diz o porquê, em vez de "Entra na lista", e o motivo de não gravar não repete o aviso.
    await expect(comAvisos.getByRole('listitem').filter({ hasText: '123.456.789-09' })).toContainText('Parece CPF ou data de nascimento, e não matrícula: confira esta linha.')
    await expect(comAvisos.getByRole('listitem').filter({ hasText: '123.456.789-09' })).not.toContainText('Entra na lista')
    await expect(comAvisos).toContainText('Nada é gravado enquanto a segunda coluna parecer CPF ou data de nascimento.')
    await expect(comAvisos.getByRole('button', { name: 'Gravar lista' })).toHaveCount(0)
    // O título antes da lista, com vírgula: o leitor passa a separar pela vírgula, as linhas com ";" saem sem matrícula, e
    // a tela diz para tirar o título.
    await campo.fill(`Turma 8ºA, manhã\nAna ${marca};660080\nBia ${marca};660081`)
    await acionar(verPrevia, hasTouch)
    await expect(comAvisos.getByRole('status')).toContainText('2 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(comAvisos).toContainText('Quase todas as linhas ficaram sem matrícula. Se a primeira linha é um título')
    await expect(comAvisos.getByRole('button', { name: 'Gravar lista' })).toHaveCount(0)

    // A resposta que chega com o foco já de volta no campo (a rede lenta): a prévia aparece, o foco fica onde a pessoa
    // está, e o que ela digita em seguida entra no campo.
    let segurada = portao()
    await page.route(`**/v1/turmas/${turma.id}/lista/previa`, async (rota: Route) => {
      await segurada.aberta
      await rota.continue()
    })
    await campo.fill(`Aluno antigo ${marca};660002`)
    const lenta = page.waitForResponse((pedido) => new URL(pedido.url()).pathname.endsWith('/lista/previa'))
    await acionar(verPrevia, hasTouch)
    await campo.focus()
    segurada.abrir()
    await (await lenta).finished()
    await expect(principal(page).getByRole('region', { name: 'Prévia' })).toBeVisible()
    await expect(campo).toBeFocused()
    await campo.press('Control+End')
    await page.keyboard.type('9')
    await expect(campo).toHaveValue(`Aluno antigo ${marca};6600029`)

    // De um botão, o foco vai: quem deu um Tab durante a espera e parou em "Acrescentar um nome" não estava digitando, e
    // é pelo foco no título que o leitor de tela fica sabendo que a prévia pedida chegou.
    segurada = portao()
    await campo.fill(`Aluno do tab ${marca};660005`)
    const comTab = page.waitForResponse((pedido) => new URL(pedido.url()).pathname.endsWith('/lista/previa'))
    await acionar(verPrevia, hasTouch)
    await page.keyboard.press('Tab')
    await expect(lista.getByRole('button', { name: 'Acrescentar um nome' })).toBeFocused()
    segurada.abrir()
    await (await comTab).finished()
    await expect(principal(page).getByRole('region', { name: 'Prévia' }).getByRole('heading', { name: 'Prévia' })).toBeFocused()

    // Resposta atrasada: a prévia do texto de antes chega depois da edição e não aparece.
    segurada = portao()
    await campo.fill(`Aluno antigo ${marca};660002`)
    const resposta = page.waitForResponse((pedido) => new URL(pedido.url()).pathname.endsWith('/lista/previa'))
    await acionar(verPrevia, hasTouch)
    await campo.fill(`Aluno novo ${marca};660003`)
    segurada.abrir()
    await (await resposta).finished()
    await expect(verPrevia).toBeEnabled()
    await expect(principal(page).getByRole('region', { name: 'Prévia' })).toHaveCount(0)
    await expect(principal(page)).not.toContainText(`Aluno antigo ${marca}`)
    await page.unroute(`**/v1/turmas/${turma.id}/lista/previa`)
    // O texto que volta a ser o da prévia atrasada a mostra, porque ela é dele, sem tirar o foco do campo: o foco que a
    // resposta atrasada pediria não fica guardado para depois.
    await campo.fill(`Aluno antigo ${marca};660002`)
    await expect(principal(page).getByRole('region', { name: 'Prévia' })).toBeVisible()
    await expect(campo).toBeFocused()
    await campo.fill(`Aluno novo ${marca};660003`)

    // A gravação recusada: a matrícula passou para a lista de outra turma depois da prévia. Nada é gravado, a prévia
    // sai com o "Gravar lista", a tela pede a prévia de novo, e a lista recarrega (com o nome que outra pessoa pôs nela
    // enquanto isso).
    await acionar(verPrevia, hasTouch)
    const previa = principal(page).getByRole('region', { name: 'Prévia' })
    await expect(previa.getByRole('status')).toHaveText('1 nome entra · 0 já estão na lista · 0 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    await porNaListaDaTurma(coordenadora.escolaId, outraTurma.id, [{ nome: `Da outra turma ${marca}`, matricula: '660003' }])
    await porNaListaDaTurma(coordenadora.escolaId, turma.id, [{ nome: `Chegou durante a prévia ${marca}`, matricula: '660070' }])
    await acionar(previa.getByRole('button', { name: 'Gravar lista' }), hasTouch)
    await expect(subir.getByRole('alert')).toHaveText(
      'Uma das matrículas passou a ser usada em outra turma ou por um aluno depois da prévia. Nada foi gravado: veja a prévia de novo.',
      { timeout: PRAZO_DA_ENTRADA_MS },
    )
    await expect(subir.getByRole('alert')).toBeFocused()
    await expect(previa).toHaveCount(0)
    await expect(lista).not.toContainText(`Aluno novo ${marca}`)
    await expect(lista).toContainText(`Chegou durante a prévia ${marca}`)
    // O aviso é do texto que foi recusado: mudar o texto o tira, e voltar a ele o traz de volta sem tirar o foco do campo.
    await campo.focus()
    await campo.press('Control+End')
    await page.keyboard.type('x')
    await expect(subir.getByRole('alert')).toHaveCount(0)
    await page.keyboard.press('Backspace')
    await expect(subir.getByRole('alert')).toBeVisible()
    await expect(campo).toBeFocused()
    await campo.fill(`Aluno novo ${marca};660004`)
    await expect(subir.getByRole('alert')).toHaveCount(0)

    // A gravação que cai com o servidor fora do ar: a tela diz o que fazer, e a prévia fica, com o "Gravar lista",
    // porque ela não envelheceu. Com o servidor de volta, a mesma prévia grava.
    await acionar(verPrevia, hasTouch)
    await expect(previa.getByRole('status')).toHaveText('1 nome entra · 0 já estão na lista · 0 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    let foraDoAr = true
    await page.route(`**/v1/turmas/${turma.id}/lista`, (rota: Route) =>
      foraDoAr && rota.request().method() === 'POST' ? rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL }) : rota.continue(),
    )
    await acionar(previa.getByRole('button', { name: 'Gravar lista' }), hasTouch)
    await expect(subir.getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(previa.getByRole('button', { name: 'Gravar lista' })).toBeVisible()
    foraDoAr = false
    await acionar(previa.getByRole('button', { name: 'Gravar lista' }), hasTouch)
    await expect(anuncio(lista, '1 nome gravado na lista.')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista).toContainText(`Aluno novo ${marca}`)

    // O nome avulso, o aluno que chega em maio.
    await acionar(lista.getByRole('button', { name: 'Acrescentar um nome' }), hasTouch)
    const avulso = dialogo(page, 'Acrescentar um nome')
    await expect(avulso.getByLabel('Matrícula')).toHaveAttribute('autocomplete', 'off')
    // Nome e matrícula de aluno não vão para o corretor ortográfico do navegador.
    for (const rotulo of ['Nome do aluno', 'Matrícula']) await expect(avulso.getByLabel(rotulo)).toHaveAttribute('spellcheck', 'false')
    // Sem o nome ou sem a matrícula, o erro fica no campo que falta, e nada é enviado.
    const avulsos: Request[] = []
    page.on('request', (pedido) => {
      if (pedido.method() === 'POST' && new URL(pedido.url()).pathname === `/v1/turmas/${turma.id}/lista/nome`) avulsos.push(pedido)
    })
    const semNome = avulso.getByText('Digite o nome do aluno.')
    const semMatricula = avulso.getByText('Digite a matrícula do aluno.')
    await avulso.getByLabel('Matrícula').fill('660001')
    await acionar(avulso.getByRole('button', { name: 'Acrescentar' }), hasTouch)
    await expect(semNome).toBeVisible()
    await expect(semMatricula).toHaveCount(0)
    await expect(avulso.getByLabel('Nome do aluno')).toBeFocused()
    await avulso.getByLabel('Nome do aluno').fill(`Aluno de maio ${marca}`)
    await avulso.getByLabel('Matrícula').fill('  ')
    await acionar(avulso.getByRole('button', { name: 'Acrescentar' }), hasTouch)
    await expect(semMatricula).toBeVisible()
    await expect(semNome).toHaveCount(0)
    await expect(avulso.getByLabel('Matrícula')).toBeFocused()
    // A matrícula que parece CPF ou data de nascimento tem a mesma trava da lista colada (aluno não tem CPF, regra 20).
    for (const documento of ['123.456.789-09', '01/02/2012']) {
      await avulso.getByLabel('Matrícula').fill(documento)
      await acionar(avulso.getByRole('button', { name: 'Acrescentar' }), hasTouch)
      await expect(avulso.getByText('Isto parece CPF ou data de nascimento, e não matrícula.')).toBeVisible()
      await expect(avulso.getByLabel('Matrícula')).toBeFocused()
    }
    expect(avulsos).toHaveLength(0)
    await avulso.getByLabel('Matrícula').fill('660001')
    await porNaListaDaTurma(coordenadora.escolaId, turma.id, [{ nome: `Chegou durante o avulso ${marca}`, matricula: '660071' }])
    await acionar(avulso.getByRole('button', { name: 'Acrescentar' }), hasTouch)
    // A matrícula já está na lista: nada gravado, o que fazer, e a lista recarrega (com o nome que chegou enquanto isso).
    await expect(avulso.getByRole('alert')).toContainText('Esta matrícula já está na lista', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista).toContainText(`Chegou durante o avulso ${marca}`)
    await avulso.getByLabel('Matrícula').fill('660009')
    await acionar(avulso.getByRole('button', { name: 'Acrescentar' }), hasTouch)
    await expect(avulso).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista).toContainText(`Aluno de maio ${marca}`)
    expect(avulsos).toHaveLength(2)

    // Retirar o nome livre: sai, e o foco vai para o título dos nomes. Abrir o diálogo apaga o anúncio da ação anterior.
    await expect(anuncio(lista, 'Nome acrescentado à lista da turma.')).toBeVisible()
    await acionar(lista.getByRole('button', { name: `Retirar Aluno de maio ${marca}, matrícula 660009 da lista` }), hasTouch)
    await expect(dialogo(page, 'Retirar o nome da lista')).toBeVisible()
    await expect(page.getByText('Nome acrescentado à lista da turma.')).toHaveCount(0)
    await acionar(dialogo(page, 'Retirar o nome da lista').getByRole('button', { name: 'Retirar da lista' }), hasTouch)
    await expect(anuncio(secao(page, 'Nomes da turma'), 'Nome retirado da lista.')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista).not.toContainText(`Aluno de maio ${marca}`)
    await expect(principal(page).getByRole('heading', { name: 'Nomes da turma' })).toBeFocused()

    // Outra turma já aberta antes, pelo histórico, sem passar pela Estrutura: a tela recomeça, sem o texto colado na
    // anterior (que "Gravar lista" mandaria para a turma nova).
    const irPara = (destino: string) =>
      page.evaluate((caminho) => {
        window.history.pushState(null, '', caminho)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }, destino)
    await irPara(`/coordenacao/estrutura/turmas/${outraTurma.id}`)
    await expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${outraTurma.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await irPara(`/coordenacao/estrutura/turmas/${turma.id}`)
    await expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${turma.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await campo.fill(`Rascunho da 7A ${marca};669000`)
    await irPara(`/coordenacao/estrutura/turmas/${outraTurma.id}`)
    await expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${outraTurma.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByLabel('Lista colada')).toHaveValue('')
    // A página inicial leva a coordenação para a Estrutura sem ficar no histórico: o Voltar do navegador sai da Estrutura
    // para a turma de antes, em vez de cair na página inicial e ser trazido de volta.
    await irPara('/')
    await esperarEstrutura(page)
    await page.goBack()
    await expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${outraTurma.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // "Voltar para Estrutura" leva de volta à lista de turmas.
    await acionar(principal(page).getByRole('link', { name: 'Voltar para Estrutura' }), hasTouch)
    await esperarEstrutura(page)
    await abrirTurma(page, turma.nome, hasTouch)

    // Erro: a leitura da lista cai, e a seção diz o que fazer, com "Tentar de novo".
    let falhar = true
    await page.route(`**/v1/turmas/${turma.id}/lista?*`, (rota: Route) => (falhar ? rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL }) : rota.continue()))
    await page.reload()
    await expect(lista.getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    expect(await violacoesGraves(page)).toEqual([])
    falhar = false
    await acionar(lista.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(lista).toContainText(`Primeira da lista ${marca}`, { timeout: PRAZO_DA_ENTRADA_MS })

    // A turma aberta tem o seu carregando e o seu erro: a leitura da turma segurada, e depois recusada.
    const turmaSegurada = portao()
    let falharTurma = false
    await page.route(`**/v1/turmas/${turma.id}`, async (rota: Route) => {
      await turmaSegurada.aberta
      await (falharTurma ? rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL }) : rota.continue())
    })
    await page.reload()
    await expect(principal(page).getByRole('status').filter({ hasText: 'Carregando a turma…' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    turmaSegurada.abrir()
    await expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${turma.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    falharTurma = true
    await page.reload()
    await expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('link', { name: 'Voltar para Estrutura' })).toBeVisible()
    falharTurma = false
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${turma.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    // A turma que outra pessoa excluiu entre a prévia e o "Gravar lista": a API responde como inexistente, a tela diz que
    // nada foi gravado, e a prévia sai.
    await campo.fill(`Aluno tardio ${marca};660090`)
    await acionar(verPrevia, hasTouch)
    await expect(previa.getByRole('status')).toHaveText('1 nome entra · 0 já estão na lista · 0 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
    await apagarTurmaNoBanco(coordenadora.escolaId, turma.id)
    await acionar(previa.getByRole('button', { name: 'Gravar lista' }), hasTouch)
    await expect(subir.getByRole('alert')).toHaveText('Esta turma não está mais no ano letivo em curso. Nada foi gravado.', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(previa).toHaveCount(0)
  })
})

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
    await esperarEstrutura(page)
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
    await esperarEstrutura(page)
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
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Estrutura' })).toHaveAttribute('aria-current', 'page')
    await page.keyboard.press('Escape')

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
    await esperarEstrutura(page)
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
