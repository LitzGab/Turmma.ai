import type { Locator, Page, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { entrarComoProfessora, gaveta, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, focoVisivel, larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

const ROTA_ESTADO = '**/v1/sistema/estado'
const ROTA_AVISOS = '**/v1/sistema/avisos'
const PRAZO_DO_DADO_MS = 5_000

const envelope = (codigo: keyof typeof MENSAGENS_DE_ERRO) => ({
  erro: { codigo, mensagem: 'mensagem da API que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' },
})

function falharCom(status: number, codigo: keyof typeof MENSAGENS_DE_ERRO) {
  return (rota: Route) => rota.fulfill({ status, contentType: 'application/json', body: JSON.stringify(envelope(codigo)) })
}

function estadoFalso(sobreposicao: { versao?: string; ambiente?: string; banco?: 'disponivel' | 'indisponivel' } = {}) {
  return {
    versao: sobreposicao.versao ?? 'local',
    ambiente: sobreposicao.ambiente ?? 'local',
    componentes: [
      { nome: 'api', situacao: 'disponivel', verificadoEm: '2026-09-14T13:05:00.000Z' },
      { nome: 'banco', situacao: sobreposicao.banco ?? 'disponivel', verificadoEm: '2026-09-14T13:05:00.000Z' },
    ],
  }
}

/** Uma porta que segura a resposta até o teste abrir. */
function portao(): { aberta: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

const secaoComponentes = (page: Page) => page.getByRole('region', { name: 'Componentes' })
const secaoAvisos = (page: Page) => page.getByRole('region', { name: 'Avisos' })

/** O dado do estado na tela: a API e o banco com a situação por escrito. */
async function esperarEstadoComDado(page: Page, prazo = PRAZO_DO_DADO_MS): Promise<void> {
  const secao = secaoComponentes(page)
  await expect(secao.getByRole('listitem').filter({ hasText: 'API' })).toContainText('Disponível', { timeout: prazo })
  await expect(secao.getByRole('listitem').filter({ hasText: 'Banco de dados' })).toContainText('Disponível', { timeout: prazo })
}

/** Toque no celular, clique no Chromebook: a mesma ação pela entrada que cada aparelho tem. */
async function acionar(page: Page, nome: string, hasTouch: boolean): Promise<void> {
  const botao = page.getByRole('button', { name: nome })
  if (hasTouch) await botao.tap()
  else await botao.click()
}

async function esperarAlvoDeToque(page: Page, nome: string): Promise<void> {
  const caixa = await page.getByRole('button', { name: nome }).boundingBox()
  expect(caixa, `${nome} sem caixa`).not.toBeNull()
  expect(caixa?.width ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
  expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
}

// A casca do estado do sistema mora em `/sistema` desde a 18.0: com rotas e sessão, `/` passou a ser a área de
// quem entrou. Ela continua pública, porque é a tela que se abre justamente quando não se consegue entrar.
test.describe('casca da web', () => {
  test('com dado: versão e componentes vindos da API real, em até 5 s, sem rolagem horizontal e sem violação grave', async ({ page }) => {
    const respostaEstado = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/sistema/estado')
    const inicio = Date.now()
    await page.goto('/sistema')
    await esperarEstadoComDado(page)
    const decorrido = Date.now() - inicio
    expect(decorrido, `dado na tela em ${decorrido} ms`).toBeLessThanOrEqual(PRAZO_DO_DADO_MS)

    const estado = await respostaEstado
    expect(estado.status()).toBe(200)
    const corpo = (await estado.json()) as { versao: string }
    await expect(secaoComponentes(page)).toContainText(`Versão ${corpo.versao}`)
    await expect(secaoComponentes(page)).toContainText('Ambiente Local')
    // Hora pelo Intl pt-BR: dd/mm/aaaa, hh:mm.
    await expect(secaoComponentes(page)).toContainText(/Verificado em \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/)

    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', 'width=device-width, initial-scale=1')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('vazio: sem avisos na configuração, a seção convida a verificar de novo, e o botão busca de novo', async ({ page, hasTouch }) => {
    await page.goto('/sistema')
    const avisos = secaoAvisos(page)
    await expect(avisos).toContainText('Nenhum aviso por enquanto', { timeout: PRAZO_DO_DADO_MS })
    await expect(avisos).toContainText('Manutenção e atualização do sistema são avisadas aqui.')
    await esperarAlvoDeToque(page, 'Verificar de novo')

    // A nova busca fica segurada: o toque precisa dar sinal de que foi recebido.
    const segurada = portao()
    await page.route(ROTA_AVISOS, async (rota) => {
      await segurada.aberta
      await rota.continue()
    })
    const novaBusca = page.waitForRequest((pedido) => new URL(pedido.url()).pathname === '/v1/sistema/avisos')
    await acionar(page, 'Verificar de novo', hasTouch)
    await novaBusca
    await expect(avisos.getByRole('status')).toHaveText('Verificando…')
    segurada.abrir()
    await expect(avisos.getByRole('status')).toHaveText('')
    await expect(avisos).toContainText('Nenhum aviso por enquanto')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('com avisos: texto, data e quantidade pelo Intl pt-BR', async ({ page }) => {
    await page.route(ROTA_AVISOS, (rota) =>
      rota.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          itens: [
            { id: 'manutencao-sabado', texto: 'Manutenção programada no sábado, das 8h às 10h.', publicadoEm: '2026-09-13' },
            { id: 'nova-versao', texto: 'Uma versão nova entra no domingo à noite.', publicadoEm: '2026-09-01' },
          ],
        }),
      }),
    )
    await page.goto('/sistema')
    const avisos = secaoAvisos(page)
    await expect(avisos).toContainText('2 avisos', { timeout: PRAZO_DO_DADO_MS })
    await expect(avisos).toContainText('Manutenção programada no sábado, das 8h às 10h.')
    await expect(avisos).toContainText('Publicado em 13 de setembro de 2026')
    await expect(avisos).toContainText('Publicado em 1 de setembro de 2026')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('carregando: com a resposta atrasada, a seção avisa que está carregando, e o dado substitui o aviso', async ({ page }) => {
    const segurada = portao()
    await page.route(ROTA_ESTADO, async (rota) => {
      await segurada.aberta
      await rota.continue()
    })
    await page.goto('/sistema')

    const carregando = secaoComponentes(page).getByRole('status')
    await expect(carregando).toHaveText('Carregando o estado do sistema…')
    expect(await violacoesGraves(page)).toEqual([])

    segurada.abrir()
    await esperarEstadoComDado(page)
    await expect(secaoComponentes(page).getByText('Carregando o estado do sistema…')).toHaveCount(0)
  })

  test('erro: a mensagem vem do catálogo pelo código, com "Tentar de novo", e nenhum status HTTP na tela', async ({ page }) => {
    await page.route(ROTA_ESTADO, falharCom(500, 'INDISPONIVEL_TENTE_DE_NOVO'))
    await page.route(ROTA_AVISOS, falharCom(429, 'LIMITE_EXCEDIDO'))
    await page.goto('/sistema')

    const erroEstado = secaoComponentes(page).getByRole('alert')
    const erroAvisos = secaoAvisos(page).getByRole('alert')
    // Mesmo status 500, a mensagem é a do código, e não a genérica.
    await expect(erroEstado).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DO_DADO_MS })
    await expect(erroAvisos).toContainText(MENSAGENS_DE_ERRO.LIMITE_EXCEDIDO, { timeout: PRAZO_DO_DADO_MS })
    await expect(secaoComponentes(page).getByRole('button', { name: 'Tentar de novo' })).toBeVisible()
    await expect(secaoAvisos(page).getByRole('button', { name: 'Tentar de novo' })).toBeVisible()

    const tela = page.locator('body')
    for (const proibido of ['500', '429', 'INDISPONIVEL_TENTE_DE_NOVO', 'LIMITE_EXCEDIDO', 'mensagem da API']) {
      await expect(tela).not.toContainText(proibido)
    }
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('erro: sem rede até a API, a tela diz para tentar de novo em instantes', async ({ page }) => {
    await page.route(ROTA_ESTADO, (rota) => rota.abort('internetdisconnected'))
    await page.goto('/sistema')
    await expect(secaoComponentes(page).getByRole('alert')).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, {
      timeout: PRAZO_DO_DADO_MS,
    })
  })

  test('"Tentar de novo" com a rede de volta mostra o dado, sem recarregar a página', async ({ page, hasTouch }) => {
    let falhar = true
    const segurada = portao()
    await page.route(ROTA_ESTADO, async (rota) => {
      if (falhar) return falharCom(503, 'INDISPONIVEL_TENTE_DE_NOVO')(rota)
      await segurada.aberta
      return rota.continue()
    })
    await page.goto('/sistema')
    await expect(secaoComponentes(page).getByRole('alert')).toBeVisible({ timeout: PRAZO_DO_DADO_MS })
    await esperarAlvoDeToque(page, 'Tentar de novo')

    // Marca a página: se ela recarregar, a marca some.
    await page.evaluate(() => document.body.setAttribute('data-sem-recarga', 'sim'))
    falhar = false
    await acionar(page, 'Tentar de novo', hasTouch)
    // Sem dado ainda, a nova busca volta ao carregando: o toque foi recebido.
    await expect(secaoComponentes(page).getByRole('status')).toHaveText('Carregando o estado do sistema…')
    segurada.abrir()
    await esperarEstadoComDado(page)
    await expect(secaoComponentes(page).getByRole('alert')).toHaveCount(0)
    await expect(page.locator('body')).toHaveAttribute('data-sem-recarga', 'sim')
  })

  test('teclado: o percurso inteiro só com Tab, Enter e espaço, com foco visível em cada parada', async ({ page }) => {
    let falhar = true
    await page.route(ROTA_ESTADO, (rota) => (falhar ? falharCom(503, 'INDISPONIVEL_TENTE_DE_NOVO')(rota) : rota.continue()))
    await page.goto('/sistema')
    await expect(secaoComponentes(page).getByRole('alert')).toBeVisible({ timeout: PRAZO_DO_DADO_MS })
    await expect(secaoAvisos(page)).toContainText('Nenhum aviso por enquanto')

    // Primeira parada: o "Tentar de novo" do estado, que vem antes na ordem da tela.
    await page.keyboard.press('Tab')
    await expect(secaoComponentes(page).getByRole('button', { name: 'Tentar de novo' })).toBeFocused()
    expect(await focoVisivel(page)).toBe(true)

    falhar = false
    await page.keyboard.press('Enter')
    await esperarEstadoComDado(page)
    // O botão sumiu com o erro: o foco vai para o título da seção, e não se perde no body.
    await expect(page.getByRole('heading', { name: 'Componentes' })).toBeFocused()

    // Segunda parada: o convite do vazio. Espaço aciona o botão, como Enter.
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Verificar de novo' })).toBeFocused()
    expect(await focoVisivel(page)).toBe(true)
    const novaBusca = page.waitForRequest((pedido) => new URL(pedido.url()).pathname === '/v1/sistema/avisos')
    await page.keyboard.press('Space')
    await novaBusca
  })

  test('banco fora: a tela diz "Indisponível" no banco, por escrito, e não mostra o banco como disponível', async ({ page }) => {
    await page.route(ROTA_ESTADO, (rota) =>
      rota.fulfill({ contentType: 'application/json', body: JSON.stringify(estadoFalso({ banco: 'indisponivel', ambiente: 'producao' })) }),
    )
    await page.goto('/sistema')
    const banco = secaoComponentes(page).getByRole('listitem').filter({ hasText: 'Banco de dados' })
    await expect(banco).toContainText('Indisponível', { timeout: PRAZO_DO_DADO_MS })
    await expect(banco).not.toContainText(/Disponível/)
    await expect(secaoComponentes(page).getByRole('listitem').filter({ hasText: 'API' })).toContainText('Disponível')
    await expect(secaoComponentes(page)).toContainText('Ambiente Produção')
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('texto longo sem espaço (versão de 64 caracteres e aviso de 280) não cria rolagem horizontal', async ({ page }) => {
    const versao = 'a'.repeat(64)
    const texto = 'x'.repeat(280)
    await page.route(ROTA_ESTADO, (rota) => rota.fulfill({ contentType: 'application/json', body: JSON.stringify(estadoFalso({ versao, ambiente: 'staging' })) }))
    await page.route(ROTA_AVISOS, (rota) =>
      rota.fulfill({ contentType: 'application/json', body: JSON.stringify({ itens: [{ id: 'longo', texto, publicadoEm: '2026-09-13' }] }) }),
    )
    await page.goto('/sistema')
    await expect(secaoComponentes(page)).toContainText(versao, { timeout: PRAZO_DO_DADO_MS })
    await expect(secaoComponentes(page)).toContainText('Ambiente Homologação')
    await expect(secaoAvisos(page)).toContainText(texto)
    expect(await larguraExcedente(page)).toBe(0)
  })

  test('falha passageira depois do dado não apaga o dado: o erro aparece junto, com "Tentar de novo"', async ({ page, hasTouch }) => {
    await page.goto('/sistema')
    const avisos = secaoAvisos(page)
    await expect(avisos).toContainText('Nenhum aviso por enquanto', { timeout: PRAZO_DO_DADO_MS })

    let falhar = true
    let pedidos = 0
    const segurada = portao()
    await page.route(ROTA_AVISOS, async (rota) => {
      if (falhar) return falharCom(503, 'INDISPONIVEL_TENTE_DE_NOVO')(rota)
      pedidos++
      await segurada.aberta
      return rota.continue()
    })
    await acionar(page, 'Verificar de novo', hasTouch)
    await expect(avisos.getByRole('alert')).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DO_DADO_MS })
    await expect(avisos).toContainText('Nenhum aviso por enquanto')

    // Com a rede de volta mas lenta: o toque dá sinal, e toques repetidos não reiniciam a busca em andamento.
    falhar = false
    await acionar(page, 'Tentar de novo', hasTouch)
    await expect(avisos.getByText('Tentando de novo…')).toBeVisible()
    await acionar(page, 'Tentar de novo', hasTouch)
    await acionar(page, 'Tentar de novo', hasTouch)
    segurada.abrir()
    await expect(avisos.getByRole('alert')).toHaveCount(0)
    await expect(avisos).toContainText('Nenhum aviso por enquanto')
    expect(pedidos).toBe(1)
  })

  test('E5: o CSS servido tem os hex da D72, não usa oklch() nem color-mix(), e pinta o aviso de atenção', async ({ page }) => {
    await page.goto('/sistema')
    const folhas = await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href))
    expect(folhas.length).toBeGreaterThan(0)
    const css = (await Promise.all(folhas.map(async (folha) => (await page.request.get(folha)).text()))).join('\n')
    // Os hex que as telas do F1 pintam: o laranja do botão, o texto, a borda de campo e as duas famílias de aviso.
    for (const hex of ['#e8732e', '#0d0d0d', '#8f8f8f', '#fdf0e8', '#8a3e0c', '#fdecec', '#b42318']) expect(css, `${hex} fora do CSS servido`).toContain(hex)
    // O Chrome 109 do laboratório descarta a declaração inteira com qualquer um dos dois: `oklch()` é a paleta de
    // fábrica do Tailwind 4, e `color-mix()` é o que o modificador de opacidade (`bg-tinta/40`) vira (9.9).
    expect(css).not.toContain('oklch(')
    expect(css).not.toContain('color-mix(')
    // A paleta anterior saiu inteira do `@theme`, e nenhuma fonte é baixada: o logotipo vem em curvas (9.6).
    expect(css).not.toMatch(/--color-(?:slate|blue|amber|red|emerald)-/)
    expect(css).not.toContain('@font-face')
    // A paleta zerada do `@theme` faz classe com cor fora da lista não gerar regra nenhuma, caladamente: a caixa
    // de aviso fica sem fundo e sem borda, e o axe não vê, porque o texto herda o contraste da página. O teste de
    // unidade `apps/web/src/estilos.test.ts` cobre o fonte; esta linha cobre o que o navegador recebe.
    for (const classe of ['.bg-pendente-cx', '.border-pendente', '.text-pendente', '.bg-erro-cx', '.border-erro', '.text-erro']) expect(css, `${classe} sem regra no CSS servido`).toContain(classe)
  })

  test('o aviso de atenção aparece com fundo e borda, na cor da D72 e com contraste AA', async ({ page }) => {
    // O segundo fator aberto sem desafio: "entre de novo", o aviso que sumiu calado no F0 quando a cor não tinha regra.
    await page.goto('/mfa')
    const aviso = page.getByRole('alert').filter({ hasText: 'entre de novo' })
    await expect(aviso).toBeVisible()
    const pintura = await aviso.evaluate((elemento) => {
      const estilo = getComputedStyle(elemento)
      return { fundo: estilo.backgroundColor, borda: estilo.borderTopColor, larguraDaBorda: estilo.borderTopWidth, estiloDaBorda: estilo.borderTopStyle, texto: estilo.color }
    })
    // `pendente-cx` de fundo, `pendente` na borda e no texto (6,8:1 na 9.1): sem a regra, o fundo seria transparente.
    expect(pintura).toEqual({ fundo: 'rgb(253, 240, 232)', borda: 'rgb(138, 62, 12)', larguraDaBorda: '1px', estiloDaBorda: 'solid', texto: 'rgb(138, 62, 12)' })
    expect(await violacoesGraves(page)).toEqual([])
  })
})

/**
 * W12 da casca da escola (A1, tarefa 11.0; `docs/interface.md` 11.1): a lateral aberta a partir de 1024 px, o trilho de
 * 768 a 1023 px e a gaveta abaixo de 768 px, sem rolagem horizontal a 360 px, com alvos de 44 px e percorrida pelo
 * teclado.
 */
test.describe('casca da escola', () => {
  test('W12: abaixo de 768 px, a barra do topo com o "Sair" a um toque, e a gaveta modal que prende e devolve o foco', async ({ page, hasTouch }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await entrarComoProfessora(page, hasTouch)

    // Sem lateral: a barra do topo tem o menu, a pinta, a escola e o "Sair", e nada passa da largura.
    const menu = page.getByRole('button', { name: 'Abrir o menu' })
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('navigation', { name: 'Seções' })).toHaveCount(0)
    for (const alvo of [menu, page.getByRole('button', { name: 'Sair' }), page.getByRole('link', { name: 'Turmma, página inicial' })]) await esperarAlvoDeToqueEm(alvo)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A gaveta abre por cima, com o foco dentro, e o Tab não chega à tela atrás dela: depois do último item ele vai para
    // o navegador (o `body`, visto de dentro da página) e volta ao primeiro, como em todo `dialog` modal.
    await menu.focus()
    await page.keyboard.press('Enter')
    await expect(gaveta(page)).toBeVisible()
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    expect(await gaveta(page).evaluate((dialogo) => dialogo.contains(document.activeElement))).toBe(true)
    const ondeFoi: string[] = []
    for (let tecla = 0; tecla < 12; tecla++) {
      await page.keyboard.press('Tab')
      ondeFoi.push(
        await gaveta(page).evaluate((dialogo) => (dialogo.contains(document.activeElement) ? 'gaveta' : document.activeElement === document.body ? 'navegador' : 'atrás')),
      )
    }
    expect(ondeFoi).not.toContain('atrás')
    expect(ondeFoi).toContain('gaveta')
    await esperarAlvoDeToqueEm(gaveta(page).getByRole('link', { name: 'Turmas' }))
    await esperarAlvoDeToqueEm(gaveta(page).getByRole('button', { name: 'Sair' }))
    await esperarAlvoDeToqueEm(gaveta(page).getByRole('button', { name: 'Fechar o menu' }))
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Esc fecha, e o foco volta ao botão que abriu.
    await page.keyboard.press('Escape')
    await expect(gaveta(page)).toBeHidden()
    await expect(menu).toBeFocused()
    await expect(menu).toHaveAttribute('aria-expanded', 'false')

    // O toque fora da lateral também fecha.
    if (hasTouch) await menu.tap()
    else await menu.click()
    await expect(gaveta(page)).toBeVisible()
    await page.mouse.click(350, 400)
    await expect(gaveta(page)).toBeHidden()
  })

  test('W12: no computador, a lateral aberta percorrida só com Tab, com o "Sair" a um clique e do tamanho dos itens', async ({ page, hasTouch }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    const professora = await entrarComoProfessora(page, hasTouch)

    await expect(page.getByRole('button', { name: 'Abrir o menu' })).toHaveCount(0)
    const paradas = [
      page.getByRole('link', { name: 'Turmma, página inicial' }),
      page.getByRole('button', { name: 'Recolher a lateral' }),
      page.getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Turmas' }),
      page.getByRole('button', { name: 'Sair' }),
    ]
    await page.locator('body').focus()
    for (const parada of paradas) {
      await page.keyboard.press('Tab')
      await expect(parada).toBeFocused()
      expect(await focoVisivel(page)).toBe(true)
    }
    // O "Sair" tem a altura e a largura da linha dos itens (P18, D59), e está à vista, sem menu para abrir.
    const [item, sair] = await Promise.all([page.getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Turmas' }).boundingBox(), page.getByRole('button', { name: 'Sair' }).boundingBox()])
    expect(sair?.height).toBe(item?.height)
    expect(sair?.width).toBe(item?.width)
    expect(item?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    await expect(page.getByText(professora.nome, { exact: true })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('W12: recolher a lateral para o trilho fica guardado, o trilho dá a dica pelo teclado, e abrir desfaz', async ({ page, hasTouch }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await entrarComoProfessora(page, hasTouch)

    const recolher = page.getByRole('button', { name: 'Recolher a lateral' })
    if (hasTouch) await recolher.tap()
    else await recolher.click()
    const abrir = page.getByRole('button', { name: 'Abrir a lateral' })
    // O botão que tinha o foco saiu com a lateral: o foco vai para o que faz o contrário, e não se perde.
    await expect(abrir).toBeFocused()
    await expect(abrir).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByText('Turmma', { exact: true })).toHaveCount(0)

    // No trilho, o item é só o ícone, com o nome para o leitor de tela e a dica que aparece ao chegar pelo teclado.
    const turmas = page.getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Turmas' })
    await page.keyboard.press('Tab')
    await expect(turmas).toBeFocused()
    await expect(turmas.getByText('Turmas', { exact: true }).last()).toBeVisible()
    await esperarAlvoDeToqueEm(turmas)
    await esperarAlvoDeToqueEm(page.getByRole('button', { name: 'Sair' }))
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A escolha fica guardada neste navegador.
    await page.reload()
    await expect(page.getByRole('button', { name: 'Abrir a lateral' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('button', { name: 'Recolher a lateral' })).toHaveCount(0)

    if (hasTouch) await page.getByRole('button', { name: 'Abrir a lateral' }).tap()
    else await page.getByRole('button', { name: 'Abrir a lateral' }).click()
    await expect(page.getByRole('button', { name: 'Recolher a lateral' })).toBeFocused()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Recolher a lateral' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  })

  test('W12: de 768 a 1023 px, o trilho, e a lateral abre por cima do conteúdo, sem mudar a escolha do computador', async ({ page, hasTouch }) => {
    await page.setViewportSize({ width: 900, height: 768 })
    await entrarComoProfessora(page, hasTouch)

    const abrir = page.getByRole('button', { name: 'Abrir a lateral' })
    await expect(abrir).toBeVisible()
    await expect(page.getByRole('button', { name: 'Recolher a lateral' })).toHaveCount(0)
    if (hasTouch) await abrir.tap()
    else await abrir.click()
    await expect(gaveta(page)).toBeVisible()
    await expect(abrir).toHaveAttribute('aria-expanded', 'true')
    await expect(gaveta(page).getByRole('navigation', { name: 'Seções' }).getByRole('link')).toHaveText(['Turmas'])
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(gaveta(page)).toBeHidden()
    await expect(abrir).toBeFocused()

    // Entre o trilho e o celular (o celular deitado que é girado) a gaveta continua montada: aberta, ela segue aberta, e
    // o botão de cada largura diz isso.
    if (hasTouch) await abrir.tap()
    else await abrir.click()
    await expect(gaveta(page)).toBeVisible()
    await page.setViewportSize({ width: 360, height: 800 })
    await expect(gaveta(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir o menu' })).toHaveAttribute('aria-expanded', 'true')
    await page.setViewportSize({ width: 900, height: 768 })
    await expect(gaveta(page)).toBeVisible()
    await expect(abrir).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(gaveta(page)).toBeHidden()

    // Abrir por cima aqui não recolhe nem abre a lateral do computador.
    if (hasTouch) await abrir.tap()
    else await abrir.click()
    await expect(gaveta(page)).toBeVisible()
    await page.setViewportSize({ width: 1366, height: 768 })
    await expect(page.getByRole('button', { name: 'Recolher a lateral' })).toBeVisible()

    // A gaveta aberta que saiu com a troca de largura não volta aberta, nem o botão diz que ela está.
    await page.setViewportSize({ width: 900, height: 768 })
    await expect(abrir).toHaveAttribute('aria-expanded', 'false')
    await expect(gaveta(page)).toBeHidden()
  })
})

async function esperarAlvoDeToqueEm(alvo: Locator): Promise<void> {
  const caixa = await alvo.boundingBox()
  expect(caixa, 'alvo sem caixa').not.toBeNull()
  expect(caixa?.width ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
  expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
}
