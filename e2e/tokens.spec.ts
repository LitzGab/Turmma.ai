import type { Locator, Page, Request } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { expect, test } from './__fixtures__/perfis.ts'
import { criarEquipeComSenha, criarUsuarioEmOutraEscola } from './__fixtures__/sessao.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A pele da D72 nos componentes compartilhados (tarefa 1.0 da A0): os tokens da 9.9 do `docs/interface.md` chegam ao
 * navegador, o botão primário é o laranja com texto preto, o foco é o anel de 2 px, e a marca vem em curvas.
 *
 * O teste de unidade `apps/web/src/estilos.test.ts` confere o fonte. Este confere o que o navegador recebe e desenha:
 * com a paleta zerada, um token que não chegou ao CSS servido faz a classe sair sem regra nenhuma, caladamente.
 */

/** O Chromebook com CPU ×4 e rede Fast 3G carrega a página e ainda faz o hash da senha no servidor. */
const PRAZO_DA_ENTRADA_MS = 20_000

/** Os hex da 9.9 que os componentes desta tarefa pintam, como o navegador os devolve no estilo calculado. */
const RGB = {
  caramelo: 'rgb(232, 115, 46)',
  carameloClaro: 'rgb(238, 135, 71)',
  carameloNoite: 'rgb(242, 162, 91)',
  tinta: 'rgb(13, 13, 13)',
  inativo: 'rgb(143, 143, 143)',
} as const

/** Os tokens de cor do bloco `@theme` da 9.9, com o hex de cada um: o documento é a fonte, não uma cópia aqui. */
function tokensDaD72(): Map<string, string> {
  const documento = readFileSync(new URL('../docs/interface.md', import.meta.url), 'utf8')
  const secao = documento.slice(documento.indexOf('### 9.9'))
  const inicio = secao.indexOf('```css')
  const bloco = secao.slice(inicio, secao.indexOf('```', inicio + 6))
  return new Map([...bloco.matchAll(/--color-([a-z]+(?:-[a-z0-9]+)*)\s*:\s*(#[0-9a-fA-F]{6})/g)].map(([, nome, hex]) => [nome ?? '', (hex ?? '').toLowerCase()]))
}

/** `#fff` e `#FFFFFF` são o mesmo hex: o minificador encurta o que pode. */
function hexCompleto(valor: string): string {
  const hex = valor.trim().toLowerCase()
  return /^#[0-9a-f]{3}$/.test(hex) ? `#${[...hex.slice(1)].map((digito) => digito + digito).join('')}` : hex
}

/** As declarações `--color-*` de todas as folhas que a página carrega, com o valor em hex de seis dígitos. */
async function coresServidas(page: Page): Promise<Map<string, string>> {
  const folhas = await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href))
  expect(folhas.length).toBeGreaterThan(0)
  const cores = new Map<string, string>()
  for (const folha of folhas) {
    const css = await (await page.request.get(folha)).text()
    for (const [, nome, valor] of css.matchAll(/--color-([a-z]+(?:-[a-z0-9]+)*)\s*:\s*([^;}]+)/g)) cores.set(nome ?? '', hexCompleto(valor ?? ''))
  }
  return cores
}

/** Luminância relativa da WCAG 2.1 de uma cor `rgb(r, g, b)` do estilo calculado. */
function luminancia(rgb: string): number {
  const canais = (rgb.match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 3).map((canal) => {
    const c = Number(canal) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const [r = 0, g = 0, b = 0] = canais
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [clara, escura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return ((clara ?? 0) + 0.05) / ((escura ?? 0) + 0.05)
}

async function corDe(alvo: Locator): Promise<{ fundo: string; texto: string }> {
  return alvo.evaluate((elemento) => {
    const estilo = getComputedStyle(elemento)
    return { fundo: estilo.backgroundColor, texto: estilo.color }
  })
}

/** O anel de foco como o navegador desenha, no elemento que tem o foco agora. */
function anelDoFoco(page: Page): Promise<{ visivel: boolean; estilo: string; largura: string; cor: string; afastamento: string }> {
  return page.evaluate(() => {
    const elemento = document.activeElement
    if (elemento === null) return { visivel: false, estilo: '', largura: '', cor: '', afastamento: '' }
    const estilo = getComputedStyle(elemento)
    return { visivel: elemento.matches(':focus-visible'), estilo: estilo.outlineStyle, largura: estilo.outlineWidth, cor: estilo.outlineColor, afastamento: estilo.outlineOffset }
  })
}

/** Caminha pelo teclado até o alvo e confere o anel dele: 2 px sólido em `noite`, com 2 px de afastamento (9.1). */
async function tabAteOAnel(page: Page, alvo: Locator, descricao: string, maximoDeTeclas = 30): Promise<void> {
  for (let tecla = 0; tecla < maximoDeTeclas; tecla++) {
    await page.keyboard.press('Tab')
    if (await alvo.evaluate((elemento) => elemento === document.activeElement)) {
      expect(await anelDoFoco(page), `anel de foco em ${descricao}`).toEqual({ visivel: true, estilo: 'solid', largura: '2px', cor: RGB.tinta, afastamento: '2px' })
      return
    }
  }
  throw new Error(`${descricao} não foi alcançado pelo teclado em ${String(maximoDeTeclas)} teclas`)
}

/** Uma porta que segura a resposta até o teste abrir. */
function portao(): { aberta: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

test.describe('pele da D72 nos componentes compartilhados', () => {
  test('E5: o CSS servido tem cada token de cor da 9.9, com o hex do documento', async ({ page }) => {
    await page.goto('/sistema')
    const tokens = tokensDaD72()
    // `white` e `black` incluídas; outro número é o bloco do documento lido pela metade, e o teste passaria vazio.
    expect(tokens.size).toBe(33)
    const servidas = await coresServidas(page)
    const divergentes = [...tokens].filter(([nome, hex]) => servidas.get(nome) !== hex).map(([nome, hex]) => `${nome}: a 9.9 diz ${hex}, o CSS servido tem ${servidas.get(nome) ?? 'nada'}`)
    expect(divergentes).toEqual([])
  })

  test('botão primário: caramelo com texto tinta, sem violação do axe, e o desligado em inativo', async ({ page, hasTouch }) => {
    const segurada = portao()
    await page.route('**/v1/sessao/email', async (rota) => {
      await segurada.aberta
      await rota.abort()
    })
    await page.goto('/entrar')
    const entrar = page.getByRole('button', { name: 'Entrar' })
    await expect(entrar).toBeVisible()

    const ligado = await corDe(entrar)
    expect(ligado).toEqual({ fundo: RGB.caramelo, texto: RGB.tinta })
    // 6,4:1 na 9.1: passa o AA de texto (4,5:1), e o axe confere o mesmo na página inteira.
    expect(contraste(ligado.fundo, ligado.texto)).toBeGreaterThanOrEqual(4.5)
    expect(await violacoesGraves(page)).toEqual([])

    // O hover existe só onde há ponteiro; no toque o pressionado é o que dá o sinal, e ele não depende de hover.
    if (!hasTouch) {
      await entrar.hover()
      await expect.poll(async () => (await corDe(entrar)).fundo).toBe(RGB.carameloClaro)
    }

    await page.getByLabel('E-mail').fill('professora-sintetica@educa.invalid')
    await page.getByLabel('Senha').fill('senha-sintetica-do-botao')
    await (hasTouch ? entrar.tap() : entrar.click())
    const entrando = page.getByRole('button', { name: 'Entrando…' })
    await expect(entrando).toBeDisabled()
    // O ponteiro continua em cima do botão, como fica com quem acabou de clicar: o hover não pinta o desligado.
    const desligado = await corDe(entrando)
    // Desligado é outro fundo, e não o laranja apagado: distinguível do ligado e ainda legível.
    expect(desligado).toEqual({ fundo: RGB.inativo, texto: RGB.tinta })
    expect(contraste(desligado.fundo, desligado.texto)).toBeGreaterThanOrEqual(4.5)
    segurada.abrir()
  })

  test('foco de 2 px em noite com 2 px de afastamento nos componentes, e em caramelo-noite sobre o preto', async ({ page }) => {
    const emA = await criarEquipeComSenha()
    await criarUsuarioEmOutraEscola(emA.contaId)
    await page.goto('/entrar')

    // A entrada: os dois campos e o botão primário, pelo teclado.
    await tabAteOAnel(page, page.getByLabel('E-mail'), 'campo de e-mail')
    await page.keyboard.type(emA.email)
    await tabAteOAnel(page, page.getByLabel('Senha'), 'campo de senha')
    await page.keyboard.type(emA.senha)
    await tabAteOAnel(page, page.getByRole('button', { name: 'Entrar' }), 'botão Entrar')
    await page.keyboard.press('Enter')

    await expect(page.getByRole('heading', { name: 'Escolher a escola' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await page.getByRole('button', { name: `${emA.escolaNome} · professor` }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: `Olá, ${emA.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    // O cabeçalho: a marca em curvas, o seletor de escola, o link dos vínculos e o "Sair".
    const cabecalho = page.getByRole('banner')
    await expect(cabecalho.getByText('Turmma')).toBeVisible()
    await expect(cabecalho.locator('img[src="/marca/turmma-pinta.svg"]')).toHaveJSProperty('complete', true)
    expect(await cabecalho.locator('img[src="/marca/turmma-pinta.svg"]').evaluate((imagem) => (imagem as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    expect(await larguraExcedente(page)).toBe(0)
    await tabAteOAnel(page, cabecalho.locator('summary'), 'seletor de escola')
    const link = page.getByRole('link', { name: 'Meus vínculos' })
    await tabAteOAnel(page, link, 'link Meus vínculos')
    // O link é `caramelo-texto` sublinhado: laranja como texto só nesse tom (5,1:1), nunca o `caramelo` (3,0:1).
    expect(await link.evaluate((elemento) => [getComputedStyle(elemento).color, getComputedStyle(elemento).textDecorationLine])).toEqual(['rgb(180, 82, 15)', 'underline'])
    await tabAteOAnel(page, page.getByRole('button', { name: 'Sair' }), 'botão Sair')

    // Sobre o preto, o anel preto some: ali ele é `caramelo-noite`. Aqui a faixa é montada na página, para provar a regra
    // do `estilos.css` sem depender da API da operação; na faixa de verdade, o "Sair" da casca da operação é conferido
    // em `operacao.spec.ts` (tarefa 10.0).
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('beforeend', '<div class="bg-noite" style="background:#0d0d0d;padding:8px"><button type="button">Botão sobre o preto</button></div>')
    })
    await page.getByRole('button', { name: 'Botão sobre o preto' }).focus()
    expect(await anelDoFoco(page)).toEqual({ visivel: true, estilo: 'solid', largura: '2px', cor: RGB.carameloNoite, afastamento: '2px' })
  })

  test('a marca vem dos SVGs em curvas, sem nenhuma requisição de fonte', async ({ page }) => {
    const fontes: string[] = []
    page.on('request', (pedido: Request) => {
      if (pedido.resourceType() === 'font' || /\.(?:woff2?|ttf|otf)(?:[?#]|$)/i.test(pedido.url())) fontes.push(pedido.url())
    })
    // O segundo fator aberto sem desafio: a casca pública inteira, sem depender da API.
    await page.goto('/mfa')
    await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible()

    const marca = page.getByRole('banner')
    await expect(marca.getByText('Turmma')).toBeVisible()
    const pinta = marca.locator('img[src="/marca/turmma-pinta.svg"]')
    await expect(pinta).toBeVisible()
    // Decorativa: o nome ao lado já diz o que ela é, e o leitor de tela não ouve "Turmma" duas vezes.
    await expect(pinta).toHaveAttribute('alt', '')
    await expect(pinta).toHaveJSProperty('complete', true)
    expect(await pinta.evaluate((imagem) => (imagem as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // O ícone do aplicativo é o `turmma-icone.svg` do manual (9.6), servido pelo próprio app.
    const icone = await page.locator('link[rel="icon"]').getAttribute('href')
    expect(icone).toBe('/marca/turmma-icone.svg')
    const resposta = await page.request.get(icone ?? '')
    expect(resposta.status()).toBe(200)
    expect(resposta.headers()['content-type']).toContain('image/svg+xml')

    await page.waitForLoadState('networkidle')
    expect(fontes).toEqual([])
  })
})
