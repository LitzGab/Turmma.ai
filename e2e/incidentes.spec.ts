import { randomUUID } from 'node:crypto'
import type { Browser, BrowserContext, BrowserContextOptions, Locator, Page, Route } from '@playwright/test'
import { TEXTO_DO_PRAZO_LEGAL_DO_INCIDENTE } from '../packages/shared/src/privacidade/incidente.ts'
import { abrirNavegacao, entrarComoCoordenacaoNaMesmaAba, entrarPorEmail, esperarGovernanca, irPelaNavegacao, lateral, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { campoCodigo } from './__fixtures__/segundo-fator.ts'
import { codigoDoAutenticador, confirmacaoDoIncidenteNoBanco, criarCoordenadoraNaEscola, criarEquipeComSenha, criarIncidenteNoBanco } from './__fixtures__/sessao.ts'
import { focoVisivel, larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * O aviso de incidente da coordenação e a aba Incidentes (F3, 10.0; RF9 e RF20; `tasks/prd-lgpd-e-titular/cenarios.md`):
 * o diálogo ao entrar, com "Ver depois" e a faixa fixa, e a aba que lista e confirma. Contra a API real, nos projetos
 * `chromebook` e `celular`. O incidente é semeado no banco, como o `ops:incidente` o deixa, em escolas novas por teste: a
 * tabela `incidente` é global e o banco acumula, então cada aviso leva uma marca única no texto, e a tela se confere só por ela.
 */

const TITULO_DO_AVISO = 'Aviso de incidente de segurança'
const NOME_DA_ABA = 'Incidentes'
const ENDERECO_DA_ABA = /\/coordenacao\/privacidade\/incidentes$/
const CONFIRMAR = 'Confirmo que recebi'
const VER_DEPOIS = 'Ver depois'
const VER_O_AVISO = 'Ver o aviso'
const CARREGANDO = 'Carregando os incidentes…'
const VAZIO = 'Nenhum incidente afetou esta escola'
const INDISPONIVEL = JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })

const principal = (page: Page) => page.getByRole('main')
/** O diálogo do aviso, ao entrar. */
const aviso = (page: Page) => page.getByRole('alertdialog', { name: TITULO_DO_AVISO, exact: true })
/** A faixa que fica depois do "Ver depois". */
const faixa = (page: Page) => page.getByRole('region', { name: TITULO_DO_AVISO, exact: true })
/** O cartão de um incidente na aba, achado pela marca do texto dele. */
const cartaoDa = (page: Page, marca: string) => principal(page).getByRole('article').filter({ hasText: marca })
const botao = (lugar: Locator, nome: string) => lugar.getByRole('button', { name: nome, exact: true })
const marca = () => `Marca ${randomUUID().slice(0, 8)}`

/** Um texto de 1.000 caracteres quase cheio (o máximo de uma seção), para o diálogo passar da altura da janela. */
const textoLongo = (inicio: string) => `${inicio}. ${'Detalhe do incidente com palavras comuns para ocupar linhas do diálogo. '.repeat(13)}`

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

const ehLeituraDosIncidentes = (url: URL, metodo: string) => metodo === 'GET' && url.pathname === '/v1/privacidade/incidentes'
const ehConfirmacao = (url: URL, metodo: string) => metodo === 'POST' && /^\/v1\/privacidade\/incidentes\/[^/]+\/confirmar$/.test(url.pathname)

/** Quantas leituras e quantas confirmações a aba fez, contadas desde que esta função rodou. */
function contarPedidos(page: Page): { leituras: () => number; confirmacoes: () => number } {
  let leituras = 0
  let confirmacoes = 0
  page.on('request', (pedido) => {
    const url = new URL(pedido.url())
    if (ehLeituraDosIncidentes(url, pedido.method())) leituras += 1
    if (ehConfirmacao(url, pedido.method())) confirmacoes += 1
  })
  return { leituras: () => leituras, confirmacoes: () => confirmacoes }
}

const contextos: BrowserContext[] = []
/** Outro navegador, com as opções do projeto: o computador da segunda pessoa da coordenação. */
async function outroNavegador(browser: Browser): Promise<Page> {
  const uso = test.info().project.use
  const opcoes: BrowserContextOptions = {}
  if (uso.baseURL !== undefined) opcoes.baseURL = uso.baseURL
  if (uso.viewport !== undefined) opcoes.viewport = uso.viewport
  if (uso.isMobile !== undefined) opcoes.isMobile = uso.isMobile
  if (uso.hasTouch !== undefined) opcoes.hasTouch = uso.hasTouch
  if (uso.userAgent !== undefined) opcoes.userAgent = uso.userAgent
  if (uso.deviceScaleFactor !== undefined) opcoes.deviceScaleFactor = uso.deviceScaleFactor
  if (uso.locale !== undefined) opcoes.locale = uso.locale
  if (uso.timezoneId !== undefined) opcoes.timezoneId = uso.timezoneId
  const contexto = await browser.newContext(opcoes)
  contextos.push(contexto)
  return contexto.newPage()
}

test.afterEach(async () => {
  for (const contexto of contextos.splice(0)) await contexto.close()
})

/** A coordenação entra, pela tela de entrada, e chega à Governança, onde ela abre. */
async function entrar(page: Page, hasTouch: boolean, pessoa: Parameters<typeof entrarComoCoordenacaoNaMesmaAba>[1]): Promise<void> {
  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, pessoa, hasTouch)
}

/** Abre a aba Incidentes pela navegação da lateral e pela aba. */
async function abrirAAba(page: Page, hasTouch: boolean): Promise<void> {
  await irPelaNavegacao(page, 'Privacidade', hasTouch)
  await acionar(page.getByRole('tab', { name: NOME_DA_ABA, exact: true }), hasTouch)
  await expect(page).toHaveURL(ENDERECO_DA_ABA, { timeout: PRAZO_DA_ENTRADA_MS })
}

test.describe('Aviso de incidente: o diálogo ao entrar', () => {
  test('o aviso traz todos os campos do incidente que espera, não traz o já confirmado, e a coordenação o confirma só com o teclado, com rolagem dentro do diálogo', async ({ page, hasTouch }) => {
    test.setTimeout(60_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    const doAviso = marca()
    const jaConfirmado = marca()
    const secoes = await criarIncidenteNoBanco({
      escolas: [coordenadora.escolaId],
      circunstancias: textoLongo(doAviso),
      conhecidoHaHoras: 30,
      // Uma palavra sem espaço, mais larga que o diálogo a 360 px: sem `break-words` ela o alargaria.
      contencao: `Contenção feita. ${'Detalhe do incidente com palavras comuns. '.repeat(10)} ${'U'.repeat(120)}`,
      correcao: textoLongo('Correção em curso'),
      titularesEstimados: 1200,
      risco: 'alto',
      categorias: ['conversa_do_aluno', 'trabalho_do_aluno'],
    })
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: jaConfirmado, confirmado: true })
    const secao = secoes[coordenadora.escolaId]
    if (secao === undefined) throw new Error('o incidente de teste não criou a seção da escola')
    const pedidos = contarPedidos(page)

    await entrar(page, hasTouch, coordenadora)
    const dialogo = aviso(page)
    await expect(dialogo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // Com o texto longo, o diálogo abre no topo: o título e a frase que diz o que o aviso é estão à vista.
    await expect(dialogo.getByRole('heading', { name: TITULO_DO_AVISO })).toBeInViewport()
    await expect(dialogo.getByText('A Turmma registrou um incidente de segurança que afetou dados desta escola.')).toBeInViewport()

    // Todos os campos do aviso, ditos por extenso: nada de chave crua, e nada do incidente que já foi confirmado.
    await expect(dialogo).toContainText(doAviso)
    await expect(dialogo).toContainText('Contenção feita')
    await expect(dialogo).toContainText('Correção em curso')
    await expect(dialogo).toContainText('Conversa do aluno com o Tutor; Respostas e correção das atividades do aluno')
    await expect(dialogo).toContainText('1.200 pessoas (estimativa)')
    await expect(dialogo.getByText('Alto', { exact: true })).toBeVisible()
    await expect(dialogo).toContainText('Quando a Turmma soube')
    await expect(dialogo).toContainText('Quando o aviso chegou à escola')
    // Cada rótulo lê o seu campo: a Turmma soube há 30 horas (dia anterior); o aviso foi registrado agora (hoje).
    const hoje = await page.evaluate(() => new Date().toLocaleDateString('pt-BR'))
    const dataDe = (rotulo: string) => dialogo.locator('dt', { hasText: rotulo }).locator('xpath=following-sibling::dd')
    await expect(dataDe('Quando o aviso chegou à escola')).toContainText(hoje)
    await expect(dataDe('Quando a Turmma soube')).not.toContainText(hoje)
    await expect(dialogo).toContainText(TEXTO_DO_PRAZO_LEGAL_DO_INCIDENTE)
    await expect(dialogo).not.toContainText(jaConfirmado)
    await expect(dialogo).not.toContainText('conversa_do_aluno')
    // O já confirmado não entra na fila: só um aviso espera, e o diálogo não fala em "avisos".
    await expect(dialogo).not.toContainText('avisos esperam a sua confirmação')
    // O texto da operação respeita a quebra de linha que ele trouxe.
    expect(await dialogo.getByText(doAviso).evaluate((elemento) => getComputedStyle(elemento).whiteSpace)).toBe('pre-line')

    // A rolagem é dentro do diálogo: ele passa do que cabe, não passa da janela, e a página não ganha barra de lado.
    const caixa = await dialogo.evaluate((elemento) => ({ rola: elemento.scrollHeight > elemento.clientHeight, cabe: elemento.getBoundingClientRect().height <= window.innerHeight }))
    expect(caixa).toEqual({ rola: true, cabe: true })
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Só com o teclado. O foco começa no texto, e não no botão que confirma: um Enter a mais não confirma nada.
    const confirmar = botao(dialogo, CONFIRMAR)
    const adiar = botao(dialogo, VER_DEPOIS)
    // D59: recusar nunca é mais difícil que aceitar. Os dois botões têm a mesma altura (e o alvo de toque da ação principal).
    const tamanhoDeConfirmar = await confirmar.boundingBox()
    const tamanhoDeAdiar = await adiar.boundingBox()
    expect(tamanhoDeConfirmar).not.toBeNull()
    expect(tamanhoDeAdiar?.height).toBe(tamanhoDeConfirmar?.height)
    expect(tamanhoDeAdiar?.height).toBeGreaterThanOrEqual(44)
    await expect(confirmar).not.toBeFocused()
    await page.keyboard.press('Enter')
    await expect(dialogo).toBeVisible()
    expect(pedidos.confirmacoes()).toBe(0)
    await page.keyboard.press('Tab')
    await expect(confirmar).toBeFocused()
    await expect(confirmar).toBeInViewport()
    expect(await focoVisivel(page)).toBe(true)
    await page.keyboard.press('Tab')
    await expect(adiar).toBeFocused()
    // O foco fica preso no diálogo: depois do último volta ao primeiro.
    await page.keyboard.press('Tab')
    await expect(confirmar).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(faixa(page)).toHaveCount(0)
    expect(pedidos.confirmacoes()).toBe(1)

    // Quem e quando ficaram na seção da escola.
    const gravada = await confirmacaoDoIncidenteNoBanco(secao)
    expect(gravada.confirmadoEm).not.toBeNull()
    expect(gravada.confirmadoPor).toBe(coordenadora.usuarioId)

    // Confirmado, o aviso não volta: nem ao recarregar a página.
    const lida = page.waitForResponse((resposta) => ehLeituraDosIncidentes(new URL(resposta.url()), resposta.request().method()))
    await page.reload()
    await lida
    await esperarGovernanca(page)
    await expect(aviso(page)).toHaveCount(0)
    await expect(faixa(page)).toHaveCount(0)
  })

  test('"Ver depois" e o Esc deixam a faixa fixa até a confirmação, que acompanha as telas com o Sair a um toque; a leitura é uma por sessão, e a aba confirma e tira a faixa', async ({ page, hasTouch }) => {
    test.setTimeout(90_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    const doAviso = marca()
    const secoes = await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: textoLongo(doAviso), contencao: textoLongo('Contenção'), correcao: textoLongo('Correção') })
    const secao = secoes[coordenadora.escolaId]
    if (secao === undefined) throw new Error('o incidente de teste não criou a seção da escola')
    const pedidos = contarPedidos(page)
    await page.clock.install()

    await entrar(page, hasTouch, coordenadora)
    const dialogo = aviso(page)
    await expect(dialogo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(pedidos.leituras()).toBe(1)

    await acionar(botao(dialogo, VER_DEPOIS), hasTouch)
    await expect(dialogo).toBeHidden()
    const aFaixa = faixa(page)
    await expect(aFaixa).toContainText('Um aviso de incidente de segurança que afetou a escola espera a confirmação da coordenação.')
    // A faixa não fecha: tem um botão só, o que reabre o aviso, e o foco vai para ele.
    await expect(aFaixa.getByRole('button')).toHaveCount(1)
    await expect(botao(aFaixa, VER_O_AVISO)).toBeFocused()
    expect(pedidos.confirmacoes()).toBe(0)

    // O Esc faz o mesmo que "Ver depois": reabre pela faixa, fecha no Esc, e a faixa volta com o foco.
    await acionar(botao(aFaixa, VER_O_AVISO), hasTouch)
    await expect(dialogo).toBeVisible()
    await expect(aFaixa).toHaveCount(0)
    // "Ver o aviso" monta o diálogo de novo com o mesmo texto: ele reabre no topo, com o título e a frase que diz o que o aviso é à vista, e o foco no começo do texto.
    await expect(dialogo.getByRole('heading', { name: TITULO_DO_AVISO })).toBeInViewport()
    await expect(dialogo.getByText('A Turmma registrou um incidente de segurança que afetou dados desta escola.')).toBeInViewport()
    await expect(dialogo.locator('div[tabindex="-1"]')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialogo).toBeHidden()
    await expect(aFaixa).toBeVisible()
    await expect(botao(aFaixa, VER_O_AVISO)).toBeFocused()

    // O Sair continua a um toque, com a faixa na tela.
    const sair = page.getByRole('button', { name: 'Sair', exact: true })
    await expect(sair).toBeVisible()
    await expect(sair).toBeEnabled()

    // A faixa acompanha a coordenação por outra tela, e andar pela navegação não lê de novo.
    await irPelaNavegacao(page, 'Estrutura', hasTouch)
    await expect(page).toHaveURL(/\/coordenacao\/estrutura$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(aFaixa).toBeVisible()
    // Voltar à aba do navegador, um minuto depois, também não lê: a leitura é uma por sessão.
    await page.clock.fastForward(60_000)
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange', { bubbles: true })))
    await page.waitForTimeout(1_000)
    expect(pedidos.leituras()).toBe(1)

    // A aba Incidentes relê ao abrir e confirma. A faixa sai junto, e o cartão passa a dizer que foi confirmado.
    await abrirAAba(page, hasTouch)
    const cartao = cartaoDa(page, doAviso)
    await expect(cartao).toContainText('Aguardando a confirmação da coordenação', { timeout: PRAZO_DA_ENTRADA_MS })
    expect(pedidos.leituras()).toBe(2)
    await expect(aFaixa).toBeVisible()
    await acionar(botao(cartao, CONFIRMAR), hasTouch)
    await expect(cartao).toContainText('Recebimento confirmado em', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(cartao.getByRole('heading', { level: 3 })).toBeFocused()
    await expect(botao(cartao, CONFIRMAR)).toHaveCount(0)
    await expect(aFaixa).toHaveCount(0)
    expect(pedidos.confirmacoes()).toBe(1)
    expect((await confirmacaoDoIncidenteNoBanco(secao)).confirmadoPor).toBe(coordenadora.usuarioId)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('sair com o aviso adiado e entrar de novo traz o diálogo de volta, e o Sair deixa a coordenação sair a um toque', async ({ page, hasTouch }) => {
    // O segundo fator só aceita o código do passo seguinte ao do primeiro login, depois da virada de 30 s do relógio.
    test.setTimeout(150_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: marca() })
    const respostaDoSegredo = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/configurar')

    await entrar(page, hasTouch, coordenadora)
    const fimDoLogin = Date.now()
    const { segredo } = (await (await respostaDoSegredo).json()) as { segredo: string }
    await expect(aviso(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await acionar(botao(aviso(page), VER_DEPOIS), hasTouch)
    await expect(faixa(page)).toBeVisible()

    await abrirNavegacao(page, hasTouch)
    await acionar(botao(lateral(page), 'Sair'), hasTouch)
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })

    await entrarPorEmail(page, coordenadora, hasTouch)
    await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const PASSO_MS = 30_000
    const proximaVirada = (Math.floor(fimDoLogin / PASSO_MS) + 1) * PASSO_MS
    await new Promise((resolver) => setTimeout(resolver, Math.max(0, proximaVirada + 1_000 - Date.now())))
    await campoCodigo(page).fill(codigoDoAutenticador(segredo, PASSO_MS / 1_000))
    await acionar(page.getByRole('button', { name: /^Entrar$|Entrando/ }), hasTouch)

    // Outra entrada, outra sessão: o adiamento da anterior não vale, e o diálogo volta, sem faixa.
    await expect(aviso(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(faixa(page)).toHaveCount(0)
  })
})

test.describe('Aviso de incidente: duas pessoas da coordenação, dois avisos e as falhas', () => {
  test('duas coordenadoras: quem chega depois da confirmação da outra confirma sem erro e a primeira confirmação fica; a faixa da outra some ao abrir a aba', async ({ page, browser, hasTouch }) => {
    test.setTimeout(120_000)
    const primeira = await criarEquipeComSenha('coordenador')
    const segunda = await criarCoordenadoraNaEscola(primeira)
    const doAviso = marca()
    const secoes = await criarIncidenteNoBanco({ escolas: [primeira.escolaId], circunstancias: doAviso })
    const secao = secoes[primeira.escolaId]
    if (secao === undefined) throw new Error('o incidente de teste não criou a seção da escola')
    const naOutra = await outroNavegador(browser)

    await entrar(page, hasTouch, primeira)
    await naOutra.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(naOutra, segunda, hasTouch)
    await expect(aviso(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(aviso(naOutra)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    // A segunda deixa para depois; a primeira confirma.
    await acionar(botao(aviso(naOutra), VER_DEPOIS), hasTouch)
    await expect(faixa(naOutra)).toBeVisible()
    await acionar(botao(aviso(page), CONFIRMAR), hasTouch)
    await expect(aviso(page)).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    expect((await confirmacaoDoIncidenteNoBanco(secao)).confirmadoPor).toBe(primeira.usuarioId)

    // A faixa da segunda só sabe da confirmação quando ela relê: a aba Incidentes sempre relê ao abrir.
    await abrirAAba(naOutra, hasTouch)
    const cartao = cartaoDa(naOutra, doAviso)
    await expect(cartao).toContainText('Recebimento confirmado em', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(botao(cartao, CONFIRMAR)).toHaveCount(0)
    await expect(faixa(naOutra)).toHaveCount(0)
    await expect(aviso(naOutra)).toHaveCount(0)
  })

  test('duas coordenadoras com o aviso aberto: a que confirma depois da outra não recebe erro, o diálogo dela fecha, e a confirmação que vale é a primeira', async ({ page, browser, hasTouch }) => {
    test.setTimeout(120_000)
    const primeira = await criarEquipeComSenha('coordenador')
    const segunda = await criarCoordenadoraNaEscola(primeira)
    const secoes = await criarIncidenteNoBanco({ escolas: [primeira.escolaId], circunstancias: marca() })
    const secao = secoes[primeira.escolaId]
    if (secao === undefined) throw new Error('o incidente de teste não criou a seção da escola')
    const naOutra = await outroNavegador(browser)

    await entrar(page, hasTouch, primeira)
    await naOutra.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(naOutra, segunda, hasTouch)
    await expect(aviso(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(aviso(naOutra)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    await acionar(botao(aviso(page), CONFIRMAR), hasTouch)
    await expect(aviso(page)).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    // O diálogo da segunda continua aberto, com o aviso velho: confirmar de novo responde igual, sem erro, e ele fecha.
    await acionar(botao(aviso(naOutra), CONFIRMAR), hasTouch)
    await expect(aviso(naOutra)).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(faixa(naOutra)).toHaveCount(0)
    expect((await confirmacaoDoIncidenteNoBanco(secao)).confirmadoPor).toBe(primeira.usuarioId)
  })

  test('dois incidentes: os dois esperam, a faixa e o diálogo contam os dois, a aba mostra os dois e cada um é confirmado por vez', async ({ page, hasTouch }) => {
    test.setTimeout(90_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    const um = marca()
    const outro = marca()
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: um })
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: outro })

    await entrar(page, hasTouch, coordenadora)
    const dialogo = aviso(page)
    await expect(dialogo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dialogo).toContainText('2 avisos esperam a sua confirmação. Este é o primeiro.')
    await acionar(botao(dialogo, VER_DEPOIS), hasTouch)
    await expect(faixa(page)).toContainText('2 avisos de incidente de segurança que afetaram a escola esperam a confirmação da coordenação.')

    // A aba mostra os dois, esperando; confirma um e o outro continua esperando.
    await abrirAAba(page, hasTouch)
    await expect(cartaoDa(page, um)).toContainText('Aguardando a confirmação da coordenação', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(cartaoDa(page, outro)).toContainText('Aguardando a confirmação da coordenação')
    await acionar(botao(cartaoDa(page, um), CONFIRMAR), hasTouch)
    await expect(cartaoDa(page, um)).toContainText('Recebimento confirmado em', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(cartaoDa(page, outro)).toContainText('Aguardando a confirmação da coordenação')
    await expect(faixa(page)).toContainText('Um aviso de incidente de segurança que afetou a escola espera a confirmação da coordenação.')

    // O diálogo, pela faixa, mostra só o que falta, sem a frase da fila, e confirmar o último tira tudo.
    await acionar(botao(faixa(page), VER_O_AVISO), hasTouch)
    await expect(dialogo).toContainText(outro)
    await expect(dialogo).not.toContainText(um)
    await expect(dialogo).not.toContainText('avisos esperam a sua confirmação')
    await acionar(botao(dialogo, CONFIRMAR), hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(faixa(page)).toHaveCount(0)
    await expect(cartaoDa(page, outro)).toContainText('Recebimento confirmado em', { timeout: PRAZO_DA_ENTRADA_MS })
  })

  test('dois incidentes no diálogo: confirmado o primeiro, o diálogo mostra o seguinte com o foco no texto, e não no botão', async ({ page, hasTouch }) => {
    test.setTimeout(90_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    const um = marca()
    const outro = marca()
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: textoLongo(um), contencao: textoLongo('Contenção'), correcao: textoLongo('Correção') })
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: textoLongo(outro), contencao: textoLongo('Contenção'), correcao: textoLongo('Correção') })

    await entrar(page, hasTouch, coordenadora)
    const dialogo = aviso(page)
    await expect(dialogo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // A ordem da lista é da API; o teste lê qual veio primeiro e espera o outro depois.
    const primeiro = (await dialogo.textContent())?.includes(um) === true ? um : outro
    const segundo = primeiro === um ? outro : um
    await expect(dialogo).not.toContainText(segundo)
    await acionar(botao(dialogo, CONFIRMAR), hasTouch)
    await expect(dialogo).toContainText(segundo, { timeout: PRAZO_DA_ENTRADA_MS })
    // O aviso seguinte abre no topo: o título e a frase que diz o que o aviso é estão à vista.
    await expect(dialogo.getByRole('heading', { name: TITULO_DO_AVISO })).toBeInViewport()
    await expect(dialogo.getByText('A Turmma registrou um incidente de segurança que afetou dados desta escola.')).toBeInViewport()
    await expect(dialogo).not.toContainText(primeiro)
    await expect(dialogo).not.toContainText('avisos esperam a sua confirmação')
    // O foco voltou ao começo do texto novo (o botão que confirmou perde o foco ao desligar, então "não está no botão" não prova nada).
    await expect(dialogo.locator('div[tabindex="-1"]')).toBeFocused()
    await acionar(botao(dialogo, CONFIRMAR), hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
  })

  test('o clique duplo manda uma confirmação só; a falha diz o que fazer, deixa o diálogo aberto, e tentar de novo confirma', async ({ page, hasTouch }) => {
    test.setTimeout(90_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    const secoes = await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: marca() })
    const secao = secoes[coordenadora.escolaId]
    if (secao === undefined) throw new Error('o incidente de teste não criou a seção da escola')
    const segurada = portao()
    let falhar = true
    let confirmacoes = 0
    await page.route(
      (url) => ehConfirmacao(url, 'POST'),
      async (rota: Route) => {
        if (rota.request().method() !== 'POST') return rota.continue()
        confirmacoes += 1
        if (!falhar) return rota.continue()
        await segurada.aberta
        return rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL })
      },
    )

    await entrar(page, hasTouch, coordenadora)
    const dialogo = aviso(page)
    await expect(dialogo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // Dois cliques seguidos no mesmo botão, com o primeiro pedido ainda no ar: o segundo cai no botão já desligado.
    await botao(dialogo, CONFIRMAR).dblclick()
    await expect(botao(dialogo, 'Confirmando…')).toBeDisabled()
    expect(confirmacoes).toBe(1)

    segurada.abrir()
    await expect(dialogo.getByRole('alert')).toContainText('Tente de novo em instantes', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dialogo).toBeVisible()
    expect((await confirmacaoDoIncidenteNoBanco(secao)).confirmadoEm).toBeNull()
    expect(await violacoesGraves(page)).toEqual([])

    // Tentar de novo, agora com o pedido aceito e a releitura dos incidentes segurada: o botão só volta a valer com a lista nova.
    falhar = false
    const releitura = portao()
    await page.route(
      (url) => ehLeituraDosIncidentes(url, 'GET'),
      async (rota: Route) => {
        await releitura.aberta
        return rota.continue()
      },
    )
    await acionar(botao(dialogo, CONFIRMAR), hasTouch)
    // Tempo para o pedido ser aceito: a releitura segurada é o que mantém o botão desligado depois disso.
    await page.waitForTimeout(1_500)
    await expect(botao(dialogo, 'Confirmando…')).toBeDisabled()
    await expect(dialogo.getByRole('alert')).toHaveCount(0)
    releitura.abrir()
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(confirmacoes).toBe(2)
    expect((await confirmacaoDoIncidenteNoBanco(secao)).confirmadoPor).toBe(coordenadora.usuarioId)
  })
})

test.describe('Incidentes: a confirmação na aba', () => {
  test('a falha da confirmação aparece só no cartão do aviso que falhou, e enquanto um pedido está no ar os outros botões esperam', async ({ page, hasTouch }) => {
    test.setTimeout(90_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    const um = marca()
    const outro = marca()
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: um })
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: outro })
    const segurada = portao()
    await page.route(
      (url) => ehConfirmacao(url, 'POST'),
      async (rota: Route) => {
        await segurada.aberta
        return rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL })
      },
    )

    await entrar(page, hasTouch, coordenadora)
    await expect(aviso(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await acionar(botao(aviso(page), VER_DEPOIS), hasTouch)
    await abrirAAba(page, hasTouch)
    await expect(cartaoDa(page, um)).toContainText('Aguardando a confirmação da coordenação', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(cartaoDa(page, outro)).toContainText('Aguardando a confirmação da coordenação')

    // Com o pedido de um no ar, o botão do outro espera.
    await acionar(botao(cartaoDa(page, um), CONFIRMAR), hasTouch)
    await expect(botao(cartaoDa(page, um), 'Confirmando…')).toBeDisabled()
    await expect(botao(cartaoDa(page, outro), CONFIRMAR)).toBeDisabled()

    // O pedido falha: o texto aparece no cartão dele, e não no do outro; os dois botões voltam.
    segurada.abrir()
    await expect(cartaoDa(page, um).getByRole('alert')).toContainText('Tente de novo em instantes', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(cartaoDa(page, outro).getByRole('alert')).toHaveCount(0)
    await expect(botao(cartaoDa(page, um), CONFIRMAR)).toBeEnabled()
    await expect(botao(cartaoDa(page, outro), CONFIRMAR)).toBeEnabled()
    expect(await violacoesGraves(page)).toEqual([])
  })
})

test.describe('Incidentes: os quatro estados da aba', () => {
  test('carregando, erro com "Tentar de novo", vazio e com dado, sem violação grave de acessibilidade e sem rolagem de lado', async ({ page, hasTouch }) => {
    test.setTimeout(90_000)
    const coordenadora = await criarEquipeComSenha('coordenador')
    const doAviso = marca()
    await criarIncidenteNoBanco({ escolas: [coordenadora.escolaId], circunstancias: doAviso })
    const segurada = portao()
    let modo: 'erro' | 'vazio' | 'real' = 'erro'
    await page.route(
      (url) => ehLeituraDosIncidentes(url, 'GET'),
      async (rota: Route) => {
        if (rota.request().method() !== 'GET') return rota.continue()
        await segurada.aberta
        if (modo === 'erro') return rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL })
        if (modo === 'vazio') return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ incidentes: [], prazoLegal: TEXTO_DO_PRAZO_LEGAL_DO_INCIDENTE }) })
        return rota.continue()
      },
    )

    await entrar(page, hasTouch, coordenadora)
    await abrirAAba(page, hasTouch)
    await expect(page.getByRole('tab', { name: NOME_DA_ABA, exact: true })).toHaveAttribute('aria-selected', 'true')
    await expect(principal(page).getByRole('status').filter({ hasText: CARREGANDO })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(await larguraExcedente(page)).toBe(0)

    // Erro: a leitura falha, a tela diz o que fazer, e o aviso da coordenação não aparece nem derruba a tela.
    segurada.abrir()
    await expect(principal(page).getByRole('alert')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(botao(principal(page), 'Tentar de novo')).toBeVisible()
    await expect(aviso(page)).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Vazio: nenhum incidente afetou a escola, e a tela diz isso; o prazo legal continua à vista.
    modo = 'vazio'
    await acionar(botao(principal(page), 'Tentar de novo'), hasTouch)
    await expect(principal(page).getByText(VAZIO)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('alert')).toHaveCount(0)
    await expect(principal(page)).toContainText(TEXTO_DO_PRAZO_LEGAL_DO_INCIDENTE)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Com dado: a resposta real. O aviso abre ao recarregar; "Ver depois" deixa a aba à vista, com o cartão esperando.
    modo = 'real'
    await page.reload()
    await expect(aviso(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await acionar(botao(aviso(page), VER_DEPOIS), hasTouch)
    const cartao = cartaoDa(page, doAviso)
    await expect(cartao).toContainText('Aguardando a confirmação da coordenação', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByText(VAZIO)).toHaveCount(0)
    await expect(botao(cartao, CONFIRMAR)).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
