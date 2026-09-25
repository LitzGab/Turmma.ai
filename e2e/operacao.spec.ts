import type { Page, Request, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { codigoDoOperador, criarOperadorComSegundoFator as criarOperador, encerrarSessoesDoOperador, removerOperador, type OperadorDeTeste } from './__fixtures__/operacao.ts'
import { criarEquipeComSenha } from './__fixtures__/sessao.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { acionar, entrarNaOperacao, esperarCasca, PRAZO_DA_ENTRADA_MS } from './__fixtures__/tela-da-operacao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

const ROTA_EU_DO_OPERADOR = '**/v1/operacao/eu'
const CHUNK_DA_OPERACAO = /\/assets\/operacao-[^/]+\.js$/

const TEXTO_DA_SESSAO_ENCERRADA = MENSAGENS_DE_ERRO.SESSAO_ENCERRADA
const TEXTO_DO_503 = 'O Turmma está indisponível agora. Tente de novo em instantes.'
const AVISO_DE_INATIVIDADE = 'Sua sessão vai terminar em 2 minutos por falta de uso.'
/** O `caramelo-noite` da 9.9: o anel de foco sobre o preto da faixa. */
const CARAMELO_NOITE = 'rgb(242, 162, 91)'

/** Minutos e segundos no formato do relógio simulado do Playwright. */
const tempo = (minutos: number, segundos = 0): string => `00:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`

/** Nada da sessão em armazenamento do navegador nem na barra (regra 50, item 7). */
async function semNadaGuardadoNoNavegador(page: Page): Promise<void> {
  const guardado = await page.evaluate(() => ({ local: Object.keys(localStorage), sessao: Object.keys(sessionStorage), url: location.href }))
  expect(guardado.local).toEqual([])
  expect(guardado.sessao).toEqual([])
  expect(guardado.url).not.toMatch(/token|desafio|codigo/i)
}

/** Os operadores criados por este teste, apagados no fim dele, passe ou falhe. */
const criados: string[] = []

async function criarOperadorComSegundoFator(): Promise<OperadorDeTeste> {
  const operador = await criarOperador()
  criados.push(operador.operadorId)
  return operador
}

test.afterEach(async () => {
  for (const operadorId of criados.splice(0)) await removerOperador(operadorId)
})

test.describe('área do operador Turmma', () => {
  test('entra por e-mail, senha e código, chega à casca da operação e sai a um clique', async ({ page, hasTouch }) => {
    const operador = await criarOperadorComSegundoFator()

    await page.goto('/operacao/entrar')
    await expect(page.getByRole('heading', { name: 'Entrar na operação' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Entrar · Operação Turmma')
    // A faixa diz que ali é a operação, para ninguém confundir com a tela de uma escola.
    await expect(page.getByRole('banner')).toContainText('Operação Turmma')
    await expect(page.getByLabel('E-mail')).toHaveAttribute('autocomplete', 'username')
    await expect(page.getByLabel('Senha')).toHaveAttribute('autocomplete', 'current-password')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A senha errada diz o que fazer, e a tela fica.
    await page.getByLabel('E-mail').fill(operador.email)
    await page.getByLabel('Senha').fill('senha-que-nao-e-a-dela')
    await acionar(page, /^Entrar$/, hasTouch)
    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos', { timeout: PRAZO_DA_ENTRADA_MS })

    await page.getByLabel('Senha').fill(operador.senha)
    const entrar = page.getByRole('button', { name: /^Entrar$/ })
    const caixa = await entrar.boundingBox()
    expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    await acionar(page, /^Entrar$/, hasTouch)

    await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Segundo fator · Operação Turmma')
    await expect(page.getByLabel('Código do aplicativo')).toHaveAttribute('inputmode', 'numeric')
    await expect(page.getByLabel('Código do aplicativo')).toHaveAttribute('autocomplete', 'one-time-code')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await semNadaGuardadoNoNavegador(page)

    await page.getByLabel('Código do aplicativo').fill(codigoDoOperador(operador))
    await acionar(page, /^Entrar$/, hasTouch)

    await esperarCasca(page, operador)
    await expect(page).toHaveTitle('Escolas · Operação Turmma')
    // O `<h1>` existe para o leitor de tela; a navegação já diz onde a pessoa está (A0b: a casca abre em Escolas).
    await expect(page.getByRole('heading', { level: 1, name: 'Escolas' })).toBeAttached()
    await expect(page.getByRole('navigation', { name: 'Operação' }).getByRole('link', { name: 'Escolas' })).toHaveAttribute('aria-current', 'page')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await semNadaGuardadoNoNavegador(page)

    // O "Sair" está na faixa preta, com alvo de toque de 44 px, e o anel de foco dele é o `caramelo-noite`: o preto
    // da regra geral sumiria sobre o preto da faixa. Aqui na casca de verdade, e não numa faixa montada pelo teste.
    const sair = page.getByRole('banner').getByRole('button', { name: 'Sair' })
    const caixaDoSair = await sair.boundingBox()
    expect(caixaDoSair?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    expect(caixaDoSair?.width ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    if (!hasTouch) {
      for (let tecla = 0; tecla < 10 && !(await sair.evaluate((elemento) => elemento === document.activeElement)); tecla++) await page.keyboard.press('Tab')
      const anel = await sair.evaluate((elemento) => {
        const estilo = getComputedStyle(elemento)
        return { visivel: elemento.matches(':focus-visible'), estilo: estilo.outlineStyle, largura: estilo.outlineWidth, cor: estilo.outlineColor }
      })
      expect(anel).toEqual({ visivel: true, estilo: 'solid', largura: '2px', cor: CARAMELO_NOITE })
      expect(await sair.evaluate((elemento) => getComputedStyle(elemento.closest('header') ?? elemento).backgroundColor)).toBe('rgb(13, 13, 13)')
    }

    await acionar(page, 'Sair', hasTouch)
    await expect(page).toHaveURL(/\/operacao\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('heading', { name: 'Entrar na operação' })).toBeVisible()
    // Depois de sair, voltar a `/operacao` não devolve a sessão: o cookie foi apagado pela API.
    await page.goto('/operacao')
    await expect(page).toHaveURL(/\/operacao\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('sair como um operador e entrar como outro na mesma aba, sem recarregar: nada do primeiro aparece', async ({ page, hasTouch }) => {
    const ana = await criarOperadorComSegundoFator()
    const bruno = await criarOperadorComSegundoFator()
    await entrarNaOperacao(page, ana, hasTouch)

    await acionar(page, 'Sair', hasTouch)
    await expect(page.getByRole('heading', { name: 'Entrar na operação' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // Sem `goto` nem recarga: a aba é a mesma, e o que sobrasse da Ana em memória apareceria aqui.
    await page.getByLabel('E-mail').fill(bruno.email)
    await page.getByLabel('Senha').fill(bruno.senha)
    await acionar(page, /^Entrar$/, hasTouch)
    await page.getByLabel('Código do aplicativo').fill(codigoDoOperador(bruno))
    await acionar(page, /^Entrar$/, hasTouch)

    await expect(page.getByRole('banner')).toContainText(bruno.nome, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('banner')).not.toContainText(ana.nome)
  })

  test('código do segundo fator recusado volta à entrada explicando, porque a API gastou o desafio', async ({ page, hasTouch }) => {
    const operador = await criarOperadorComSegundoFator()
    await page.goto('/operacao/entrar')
    await page.getByLabel('E-mail').fill(operador.email)
    await page.getByLabel('Senha').fill(operador.senha)
    await acionar(page, /^Entrar$/, hasTouch)
    await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const certo = codigoDoOperador(operador)
    await page.getByLabel('Código do aplicativo').fill(certo === '000000' ? '111111' : '000000')
    await acionar(page, /^Entrar$/, hasTouch)

    await expect(page).toHaveURL(/\/operacao\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('alert')).toContainText('O código não foi aceito')
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('E2: a sessão encerrada volta à entrada com a mensagem', async ({ page, hasTouch }) => {
    const operador = await criarOperadorComSegundoFator()
    await page.clock.install()
    await entrarNaOperacao(page, operador, hasTouch)

    // A sessão termina no servidor (outra máquina saiu, ou o operador foi desativado). A próxima ação da aba — a tecla,
    // passado o minuto em que o uso já foi contado — é recusada com `SESSAO_ENCERRADA`.
    await encerrarSessoesDoOperador(operador.operadorId)
    await page.clock.fastForward(tempo(1, 5))
    await page.keyboard.press('Shift')

    await expect(page).toHaveURL(/\/operacao\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('alert')).toHaveText(TEXTO_DA_SESSAO_ENCERRADA)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('E2: o 503 mostra a mensagem e fica na tela, com "Tentar de novo"', async ({ page, hasTouch }) => {
    const operador = await criarOperadorComSegundoFator()
    const falhar = (rota: Route) =>
      rota.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto da API que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }),
      })
    await page.route(ROTA_EU_DO_OPERADOR, falhar)

    await page.goto('/operacao/entrar')
    await page.getByLabel('E-mail').fill(operador.email)
    await page.getByLabel('Senha').fill(operador.senha)
    await acionar(page, /^Entrar$/, hasTouch)
    await page.getByLabel('Código do aplicativo').fill(codigoDoOperador(operador))
    await acionar(page, /^Entrar$/, hasTouch)

    await expect(page.getByRole('alert')).toHaveText(TEXTO_DO_503, { timeout: PRAZO_DA_ENTRADA_MS })
    // O `/eu` não segura a tela (A0b, tarefa 6.0): a tela de Escolas carrega embaixo do erro, junto dele.
    await expect(page.getByRole('main').getByRole('button', { name: 'Nova escola' })).toBeVisible()
    // Fica: nem a entrada, nem a mensagem de sessão encerrada.
    await expect(page).toHaveURL(/\/operacao$/)
    await expect(page.getByRole('banner').getByRole('button', { name: 'Sair' })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    await page.unroute(ROTA_EU_DO_OPERADOR, falhar)
    await acionar(page, 'Tentar de novo', hasTouch)
    await expect(page.getByRole('banner')).toContainText(operador.nome, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('E3: o aviso aparece 2 min antes do fim da sessão parada, e no fim a aba vai à entrada com a mensagem', async ({ page, hasTouch }) => {
    const operador = await criarOperadorComSegundoFator()
    await page.clock.install()
    await entrarNaOperacao(page, operador, hasTouch)
    const aviso = page.getByRole('region', { name: 'Aviso de inatividade' })

    // Aos 26 min e meio parada, nada: ninguém é interrompido antes da hora.
    await page.clock.fastForward(tempo(26, 30))
    await expect(aviso).toBeHidden()

    // Passados os 27 min (o fim desconta o minuto em que a API pode não ter gravado o uso), o aviso.
    await page.clock.fastForward(tempo(1))
    await expect(aviso).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(aviso.getByRole('alert')).toHaveText(AVISO_DE_INATIVIDADE)
    // "Continuar" e "Sair" do mesmo tamanho (D59), com alvo de toque de 44 px.
    const continuar = await aviso.getByRole('button', { name: 'Continuar na sessão' }).boundingBox()
    const sair = await aviso.getByRole('button', { name: 'Sair' }).boundingBox()
    expect(continuar?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    expect(sair?.height ?? 0).toBe(continuar?.height ?? -1)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Continuar conta como uso no servidor, e o aviso sai.
    const uso = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/operacao/eu' && resposta.ok())
    if (hasTouch) await aviso.getByRole('button', { name: 'Continuar na sessão' }).tap()
    else await aviso.getByRole('button', { name: 'Continuar na sessão' }).click()
    await uso
    await expect(aviso).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })

    // Parada de novo até o fim: a sessão é encerrada e a aba vai à entrada com a mensagem.
    await page.clock.fastForward(tempo(27, 30))
    await expect(aviso).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await page.clock.fastForward(tempo(2))
    await expect(page).toHaveURL(/\/operacao\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('alert')).toHaveText(TEXTO_DA_SESSAO_ENCERRADA)
  })

  test('E4: o chunk da operação que não chega mostra a fronteira de erro com "Tente de novo", e a nova tentativa carrega', async ({ page, hasTouch }) => {
    const abortar = (rota: Route) => rota.abort('internetdisconnected')
    await page.route(CHUNK_DA_OPERACAO, abortar)

    await page.goto('/operacao/entrar')
    await expect(page.getByRole('alert')).toContainText('Não foi possível carregar a área da operação', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('button', { name: 'Tente de novo' })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    await page.unroute(CHUNK_DA_OPERACAO, abortar)
    await acionar(page, 'Tente de novo', hasTouch)
    await expect(page.getByRole('heading', { name: 'Entrar na operação' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  })

  test('B2: a web da escola nunca baixa o chunk da operação', async ({ page }) => {
    const pedidos: string[] = []
    page.on('request', (pedido: Request) => pedidos.push(pedido.url()))
    await page.goto('/entrar')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await page.waitForLoadState('networkidle')
    expect(pedidos.some((url) => url.includes('/assets/index-'))).toBe(true)
    expect(pedidos.filter((url) => CHUNK_DA_OPERACAO.test(new URL(url).pathname))).toEqual([])
  })

  test('duas abas da operação: sair numa encerra a outra, e a sessão de escola aberta no mesmo navegador continua', async ({ page, context, hasTouch }) => {
    const operador = await criarOperadorComSegundoFator()
    const professora = await criarEquipeComSenha()

    // A aba da escola, com a professora dentro.
    const escola = await context.newPage()
    await escola.goto('/entrar')
    await escola.getByLabel('E-mail').fill(professora.email)
    await escola.getByLabel('Senha').fill(professora.senha)
    await acionar(escola, /^Entrar$/, hasTouch)
    await expect(escola.getByRole('heading', { name: `Olá, ${professora.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    // Duas abas da operação: a segunda abre pelo cookie da primeira.
    await entrarNaOperacao(page, operador, hasTouch)
    const outra = await context.newPage()
    await outra.goto('/operacao')
    await esperarCasca(outra, operador)

    await acionar(page, 'Sair', hasTouch)
    await expect(page).toHaveURL(/\/operacao\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    // A outra aba da operação sai junto, pelo canal próprio, sem ninguém tocar nela.
    await expect(outra).toHaveURL(/\/operacao\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(outra.getByRole('banner')).not.toContainText(operador.nome)

    // A escola não ouviu nada: a tela continua, e a sessão dela ainda vale no servidor (recarregar reabre pelo cookie).
    await expect(escola.getByRole('heading', { name: `Olá, ${professora.nome}` })).toBeVisible()
    await escola.reload()
    await expect(escola.getByRole('heading', { name: `Olá, ${professora.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  })
})
