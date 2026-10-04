import type { Locator, Page } from '@playwright/test'
import { expect, test } from './__fixtures__/perfis.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, focoVisivel, larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As peças do MVP de apresentação (`docs/mvp-rapido.md` 9.3; `docs/interface.md` 11.1 e 11.3), na galeria (`/galeria`),
 * nos projetos `chromebook` e `celular`: o que a regra de cada peça promete, visto no navegador. A galeria não chama a
 * API e não tem sessão; o dado é inventado, escrito nela.
 *
 * A lógica de cada peça tem teste de unidade ao lado dela (`apps/web/src/componentes/**`). Aqui fica o que só a tela
 * prova: o desenho que o CSS servido de fato entrega, o foco, o teclado, o toque e a largura a 360 px.
 */

/** Os hex da 9.1 do `docs/interface.md`, como o navegador os devolve no estilo calculado. */
const RGB = {
  caramelo: 'rgb(232, 115, 46)',
  noite: 'rgb(13, 13, 13)',
  erro: 'rgb(180, 35, 24)',
  superficie: 'rgb(255, 255, 255)',
  iaFundo: 'rgb(240, 240, 240)',
  iaTexto: 'rgb(66, 66, 66)',
  okFundo: 'rgb(233, 245, 238)',
  pendenteFundo: 'rgb(253, 240, 232)',
  erroFundo: 'rgb(253, 236, 236)',
} as const

/** A galeria baixa o pedaço dela com a CPU ×4 e a rede lenta do perfil. */
const PRAZO_DA_GALERIA_MS = 20_000

const secao = (page: Page, nome: string) => page.locator(`[data-galeria="${nome}"]`)

async function abrirGaleria(page: Page): Promise<void> {
  await page.goto('/galeria')
  await expect(page.getByRole('heading', { level: 1, name: 'Galeria de peças' })).toBeVisible({ timeout: PRAZO_DA_GALERIA_MS })
}

/** Clica ou toca, conforme o projeto: no celular não existe clique de mouse. */
async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  await (hasTouch ? alvo.tap() : alvo.click())
}

function desenho(alvo: Locator): Promise<{ fundo: string; texto: string; borda: string; peso: string; fonte: string; canto: string; enchimento: string }> {
  return alvo.evaluate((elemento) => {
    const estilo = getComputedStyle(elemento)
    return {
      fundo: estilo.backgroundColor,
      texto: estilo.color,
      borda: `${estilo.borderTopWidth} ${estilo.borderTopStyle} ${estilo.borderTopColor}`,
      peso: estilo.fontWeight,
      fonte: estilo.fontSize,
      canto: estilo.borderTopLeftRadius,
      enchimento: estilo.padding,
    }
  })
}

async function caixa(alvo: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const medida = await alvo.boundingBox()
  if (medida === null) throw new Error('a peça não está na tela')
  return medida
}

/** O que flutua aberto fica inteiro dentro da janela, e a página não ganha rolagem horizontal por causa dele. */
async function conferirQueCabeNaJanela(page: Page, flutuante: Locator): Promise<void> {
  const medida = await caixa(flutuante)
  const largura = page.viewportSize()?.width ?? 0
  expect(medida.x).toBeGreaterThanOrEqual(0)
  expect(medida.x + medida.width).toBeLessThanOrEqual(largura)
  expect(await larguraExcedente(page)).toBe(0)
}

test.describe('peças do MVP de apresentação, na galeria', () => {
  test('o selo de IA e a assinatura: o texto "IA" em toda saída de IA, um desenho só, e avatar em círculo com ícone, nunca rosto', async ({ page }) => {
    await abrirGaleria(page)
    const seloDeIa = secao(page, 'selo-de-ia')

    // A assinatura: o nome da função e o selo com o texto "IA", para o agente e para a função dele.
    for (const nome of ['Assistente de ensino', 'Tutor', 'Analista de desempenho escolar', 'Assistente · correção de objetiva']) {
      const assinatura = seloDeIa.locator('p', { hasText: nome }).filter({ has: page.locator('[data-agente]') })
      await expect(assinatura, nome).toHaveCount(1)
      await expect(assinatura.getByText('IA', { exact: true }), nome).toBeVisible()
    }

    // Um conjunto só, igual em todo o produto: todo selo "IA" da tela tem o mesmo desenho, em família `ia`.
    const selos = page.locator('[title="Gerado por inteligência artificial"]')
    expect(await selos.count()).toBeGreaterThanOrEqual(9)
    const desenhos = new Set<string>()
    for (const selo of await selos.all()) {
      await expect(selo).toHaveText('IA')
      desenhos.add(JSON.stringify(await desenho(selo)))
    }
    expect([...desenhos]).toHaveLength(1)
    expect(await desenho(selos.first())).toMatchObject({ fundo: RGB.iaFundo, texto: RGB.iaTexto })

    // Toda mensagem de IA da conversa assina: avatar, nome e selo. Nas duas variantes, a sem bolha e a de balão.
    const mensagensDeIa = secao(page, 'conversa')
      .locator('article')
      .filter({ has: page.locator('[data-agente]') })
    expect(await mensagensDeIa.count()).toBe(4)
    for (const mensagem of await mensagensDeIa.all()) await expect(mensagem.getByText('IA', { exact: true })).toBeVisible()
    await expect(mensagensDeIa.filter({ hasText: 'Corrigi as 32 atividades' }).getByText('Assistente · correção de objetiva')).toBeVisible()
    await expect(mensagensDeIa.filter({ hasText: 'Oito alunos travaram' }).getByText('Tutor · sinais para o professor')).toBeVisible()

    // O avatar: círculo com um ícone desenhado, um por agente, e nenhuma imagem dentro (D58).
    const avatares = page.locator('[data-agente]')
    for (const agente of ['assistente_de_ensino', 'tutor', 'analista_de_desempenho_escolar']) expect(await page.locator(`[data-agente="${agente}"]`).count(), agente).toBeGreaterThan(0)
    for (const avatar of await avatares.all()) {
      const medida = await caixa(avatar)
      expect(medida.width).toBe(medida.height)
      expect(Number.parseFloat((await desenho(avatar)).canto)).toBeGreaterThanOrEqual(medida.width / 2)
      await expect(avatar.locator('svg')).toHaveCount(1)
      await expect(avatar.locator('img, image, picture')).toHaveCount(0)
    }
    expect(await desenho(page.locator('[data-agente="assistente_de_ensino"]').first())).toMatchObject({ fundo: RGB.noite })
    expect(await desenho(page.locator('[data-agente="tutor"]').first())).toMatchObject({ fundo: RGB.caramelo })

    // A linha da aprovação: quem aprovou e quando, em `ok`; a pendente e a rejeitada com o motivo. O ano só aparece
    // quando não é o de agora, e por isso é opcional aqui.
    const aprovada = seloDeIa.locator('[data-aprovacao="aprovada"]')
    await expect(aprovada).toHaveText(/^Aprovado por Camila Souza · 19\/09(\/2026)?, 10h42$/)
    expect(await desenho(aprovada)).toMatchObject({ fundo: RGB.okFundo })
    await expect(aprovada.locator('svg')).toHaveCount(1)
    await expect(seloDeIa.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você')
    expect(await desenho(seloDeIa.locator('[data-aprovacao="pendente"]'))).toMatchObject({ fundo: RGB.pendenteFundo })
    const rejeitada = seloDeIa.locator('[data-aprovacao="rejeitada"]')
    await expect(rejeitada).toContainText(/Rejeitado por Camila Souza · 19\/09(\/2026)?, 10h42/)
    await expect(rejeitada).toContainText('Motivo: A questão 3 não é do capítulo 7.')
    expect(await desenho(rejeitada)).toMatchObject({ fundo: RGB.erroFundo })
  })

  test('a Escolha da D18: duas opções do mesmo tamanho e do mesmo desenho, nenhuma primária, e o cartão encolhe depois da escolha', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const escolha = page.getByRole('group', { name: 'Posso fazer isso com a ferramenta Atividade, ou só conversar.' })
    const opcoes = escolha.getByRole('button')
    await expect(opcoes).toHaveCount(2)
    const ferramenta = opcoes.filter({ hasText: 'Usar a ferramenta Atividade' })
    const conversa = opcoes.filter({ hasText: 'Só conversar' })

    // Mesmo tamanho, lado a lado no Chromebook e empilhadas no celular.
    const [medidaDaFerramenta, medidaDaConversa] = [await caixa(ferramenta), await caixa(conversa)]
    expect(medidaDaFerramenta.width).toBeCloseTo(medidaDaConversa.width, 0)
    expect(medidaDaFerramenta.height).toBeCloseTo(medidaDaConversa.height, 0)
    expect(medidaDaFerramenta.height).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)

    // Mesmo desenho, e nenhum é o da ação primária (laranja) nem o da decisão oficial (preto): nenhuma é a "certa" (D59).
    const [desenhoDaFerramenta, desenhoDaConversa] = [await desenho(ferramenta), await desenho(conversa)]
    expect(desenhoDaFerramenta).toEqual(desenhoDaConversa)
    expect(desenhoDaFerramenta.fundo).toBe(RGB.superficie)
    expect([RGB.caramelo, RGB.noite]).not.toContain(desenhoDaFerramenta.fundo)
    // Nenhuma vem com o foco: o Enter de quem chega não escolhe por ela.
    expect(await opcoes.evaluateAll((botoes) => botoes.some((botao) => botao === document.activeElement))).toBe(false)

    await acionar(conversa, hasTouch)
    const feita = secao(page, 'conversa').locator('[data-escolha="feita"]')
    await expect(feita).toHaveText('Você escolheu: Só conversar')
    await expect(escolha).toHaveCount(0)
    // Uma linha: o cartão de duas opções deu lugar a uma pílula da altura de um texto.
    expect((await caixa(feita)).height).toBeLessThan(medidaDaConversa.height)
  })

  test('o ChipFonte abre pelo teclado e pelo toque, mostra material, página e trecho, e não passa da janela', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const chip = page.getByRole('button', { name: 'Fonte: Química 2, cap. 7, p. 142' })
    // O que se vê é só a página: o material é dito ao leitor de tela.
    await expect(chip).toHaveText(/p\. 142$/)
    await expect(chip).toHaveAttribute('aria-expanded', 'false')
    expect((await caixa(chip)).height).toBeGreaterThanOrEqual(24)

    await chip.focus()
    await page.keyboard.press('Enter')
    await expect(chip).toHaveAttribute('aria-expanded', 'true')
    const cartao = page.getByRole('group', { name: 'Fonte: Química 2, cap. 7, p. 142' })
    await expect(cartao).toBeVisible()
    await expect(cartao).toContainText('Química 2, cap. 7')
    await expect(cartao).toContainText('Página 142')
    await expect(cartao).toContainText('A proporção entre as quantidades de matéria de reagentes e produtos é dada pelos coeficientes da equação balanceada.')
    await conferirQueCabeNaJanela(page, cartao)
    expect(await violacoesGraves(page)).toEqual([])

    // O Esc fecha e devolve o foco ao chip, com o anel à vista.
    await page.keyboard.press('Escape')
    await expect(cartao).toHaveCount(0)
    await expect(chip).toBeFocused()
    expect(await focoVisivel(page)).toBe(true)

    // Pelo toque (ou pelo clique) abre do mesmo jeito, e o toque fora fecha.
    await acionar(chip, hasTouch)
    await expect(cartao).toBeVisible()
    await acionar(page.getByRole('heading', { level: 1, name: 'Galeria de peças' }), hasTouch)
    await expect(cartao).toHaveCount(0)

    // A lista de fontes: a linha recolhida já diz as páginas, sem repetir a que foi citada duas vezes.
    const fontes = secao(page, 'conversa').locator('summary')
    await expect(fontes).toHaveText('Fontes (3): Química 2, cap. 7, p. 142 · p. 145 · p. 151')
    await fontes.focus()
    await page.keyboard.press('Enter')
    const lista = secao(page, 'conversa').locator('details li')
    await expect(lista).toHaveCount(3)
    await expect(lista.nth(1)).toContainText('O reagente limitante é o que acaba primeiro')
    expect(await larguraExcedente(page)).toBe(0)
  })

  test('a CaixaPedido envia com Enter e pelo botão, Shift+Enter quebra a linha, e enviar vira Parar enquanto gera', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const doProfessor = secao(page, 'caixa-pedido')
    const campo = doProfessor.getByLabel('Pedido ao Assistente de ensino')
    const enviar = doProfessor.getByRole('button', { name: 'Enviar' })
    const enviado = doProfessor.locator('[data-enviado]')

    // Vazia, não envia: o botão está desligado e o Enter não faz nada.
    await expect(enviar).toBeDisabled()
    await campo.focus()
    await page.keyboard.press('Enter')
    await expect(enviado).toHaveText('')

    // Shift+Enter quebra a linha e não envia; o campo cresce com o texto. A altura de partida é a de uma linha digitada,
    // e não a do campo vazio: a 360 px o texto de exemplo ocupa duas linhas.
    await page.keyboard.type('monta uma atividade')
    const alturaDeUmaLinha = (await caixa(campo)).height
    await page.keyboard.press('Shift+Enter')
    await page.keyboard.type('de estequiometria')
    await expect(campo).toHaveValue('monta uma atividade\nde estequiometria')
    await expect(enviado).toHaveText('')
    await expect.poll(async () => (await caixa(campo)).height).toBeGreaterThan(alturaDeUmaLinha)

    // O botão de enviar é o primário da tela, redondo, com 44 px.
    await expect(enviar).toBeEnabled()
    expect(await desenho(enviar)).toMatchObject({ fundo: RGB.caramelo })
    const medidaDoEnviar = await caixa(enviar)
    expect(medidaDoEnviar.width).toBe(ALVO_DE_TOQUE_PRINCIPAL_PX)
    expect(medidaDoEnviar.height).toBe(ALVO_DE_TOQUE_PRINCIPAL_PX)

    // Enter envia, com as duas linhas.
    await page.keyboard.press('Enter')
    await expect(enviado).toHaveText('Enviado: monta uma atividade de estequiometria')
    await expect(campo).toHaveValue('')

    // Enquanto a resposta chega, enviar vira "Parar", e um segundo pedido não sai, nem pelo Enter.
    const parar = doProfessor.getByRole('button', { name: 'Parar' })
    await expect(parar).toBeVisible()
    await expect(enviar).toHaveCount(0)
    await campo.focus()
    await page.keyboard.type('outro pedido')
    await page.keyboard.press('Enter')
    await expect(enviado).toHaveText('Enviado: monta uma atividade de estequiometria')
    // Parar só para: o pedido que está escrito no campo não sai junto com o clique.
    await acionar(parar, hasTouch)
    await expect(enviar).toBeEnabled()
    await expect(campo).toHaveValue('outro pedido')
    await expect(enviado).toHaveText('Enviado: monta uma atividade de estequiometria')

    // E pelo botão, para quem está no toque.
    await acionar(enviar, hasTouch)
    await expect(enviado).toHaveText('Enviado: outro pedido')

    // Os encaixes: o menu de ferramenta à esquerda e a turma à direita, passados por quem usa.
    await expect(doProfessor.getByRole('button', { name: 'Ferramenta: Só conversar' })).toBeVisible()
    await expect(doProfessor.getByLabel('Turma do pedido')).toHaveValue('turma-2b')

    // A do aluno é só texto e enviar: sem menu, sem seleção, sem mais nenhum controle.
    const doAluno = secao(page, 'caixa-do-aluno')
    await expect(doAluno.locator('[data-caixa-pedido="so-texto"]')).toHaveCount(1)
    await expect(doAluno.locator('[data-caixa-pedido] select')).toHaveCount(0)
    await expect(doAluno.locator('[data-caixa-pedido] button')).toHaveCount(1)
    await doAluno.getByLabel('Pergunta para o Tutor').fill('o que é reagente limitante?')
    await acionar(doAluno.getByRole('button', { name: 'Enviar' }), hasTouch)
    await expect(doAluno.locator('[data-enviado]')).toHaveText('Enviado: o que é reagente limitante?')
  })

  test('nenhuma peça passa da largura da janela, com o menu aberto também, e o axe não acha violação na galeria', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    expect(await larguraExcedente(page)).toBe(0)
    // Cada bloco da galeria cabe na janela: uma peça que estourasse dentro de um contêiner com rolagem passaria na
    // conta do documento.
    const largura = page.viewportSize()?.width ?? 0
    const blocos = page.locator('[data-galeria]')
    expect(await blocos.count()).toBeGreaterThanOrEqual(12)
    for (const bloco of await blocos.all()) {
      const nome = (await bloco.getAttribute('data-galeria')) ?? ''
      const medida = await caixa(bloco)
      expect(medida.x + medida.width, nome).toBeLessThanOrEqual(largura)
      expect(await bloco.evaluate((elemento) => elemento.scrollWidth - elemento.clientWidth), nome).toBe(0)
    }
    expect(await violacoesGraves(page)).toEqual([])

    // O menu de ferramenta da caixa de pedido: abre, cabe na janela a 360 px, e continua sem violação.
    const ferramenta = secao(page, 'caixa-pedido').getByRole('button', { name: 'Ferramenta: Só conversar' })
    await acionar(ferramenta, hasTouch)
    const menu = page.getByRole('menu', { name: 'Ferramenta: Só conversar' })
    await expect(menu).toBeVisible()
    await conferirQueCabeNaJanela(page, menu)
    expect(await violacoesGraves(page)).toEqual([])
    // É menu de escolha única: o item de agora vem marcado, e escolher outro troca o texto do botão.
    await expect(menu.getByRole('menuitemradio', { name: /Só conversar/ })).toHaveAttribute('aria-checked', 'true')
    await acionar(menu.getByRole('menuitemradio', { name: /Atividade objetiva/ }), hasTouch)
    await expect(menu).toHaveCount(0)
    await expect(secao(page, 'caixa-pedido').getByRole('button', { name: 'Ferramenta: Atividade objetiva' })).toBeFocused()

    // Os selos de estado dizem o estado em texto, e não só na cor.
    const estado = secao(page, 'estado')
    for (const texto of ['Esperando você', 'Aprovado', 'Rejeitado', 'Faz e avisa']) await expect(estado.getByText(texto, { exact: true })).toBeVisible()
    // A faixa do aluno não fecha: não tem botão nenhum.
    const faixa = estado.getByRole('note')
    await expect(faixa).toHaveText('Seu professor acompanha como você usa o Tutor.')
    await expect(faixa.getByRole('button')).toHaveCount(0)
    // A barra diz o valor em texto, e o número de painel vem no formato local.
    await expect(secao(page, 'painel').getByText('12 de 60 perguntas')).toBeVisible()
    await expect(secao(page, 'painel').getByText('72%')).toBeVisible()
    await expect(secao(page, 'painel').getByText('1.412')).toBeVisible()
  })

  test('botões: cinco variantes, só a oficial em preto e só a primária em laranja, com o alvo de toque do projeto', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const botoes = secao(page, 'botoes')
    const principais = botoes.locator('[data-tamanho="principal"] [data-variante]')
    await expect(principais).toHaveCount(5)
    const fundos: Record<string, string> = {}
    for (const botao of await principais.all()) {
      const variante = (await botao.getAttribute('data-variante')) ?? ''
      fundos[variante] = (await desenho(botao)).fundo
      const medida = await caixa(botao)
      expect(medida.height, variante).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
      // Pílula: o canto é pelo menos metade da altura.
      expect(Number.parseFloat((await desenho(botao)).canto), variante).toBeGreaterThanOrEqual(medida.height / 2)
    }
    expect(Object.keys(fundos).sort()).toEqual(['discreto', 'oficial', 'perigo', 'primario', 'secundario'])
    expect(Object.entries(fundos).filter(([, fundo]) => fundo === RGB.noite).map(([variante]) => variante)).toEqual(['oficial'])
    expect(Object.entries(fundos).filter(([, fundo]) => fundo === RGB.caramelo).map(([variante]) => variante)).toEqual(['primario'])
    // O perigo fora do diálogo é texto em erro, sem o fundo de erro.
    expect(fundos['perigo']).toBe(RGB.superficie)
    expect((await desenho(principais.filter({ hasText: 'perigo' }))).texto).toBe(RGB.erro)

    // O compacto tem 36 px no computador e 44 px onde se toca com o dedo.
    const compactos = botoes.locator('[data-tamanho="compacto"] [data-variante]')
    await expect(compactos).toHaveCount(5)
    for (const botao of await compactos.all()) expect((await caixa(botao)).height).toBeGreaterThanOrEqual(hasTouch ? ALVO_DE_TOQUE_PRINCIPAL_PX : 36)
  })

  test('abas e menu pelo teclado: uma parada só no Tab, setas, item desligado pulado, e o Esc devolve o foco', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const abas = secao(page, 'abas')
    const lista = abas.getByRole('tablist', { name: 'Seções da turma' })
    const painel = abas.getByRole('tabpanel')
    await expect(lista.getByRole('tab')).toHaveCount(3)
    await expect(lista.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute('aria-selected', 'true')
    await expect(painel).toHaveText('Conteúdo de Visão geral.')

    // Só a aba ativa está na ordem do Tab; as setas trocam de aba e levam o foco junto.
    expect(await lista.getByRole('tab').evaluateAll((guias) => guias.map((guia) => (guia as HTMLElement).tabIndex))).toEqual([0, -1, -1])
    await lista.getByRole('tab', { name: 'Visão geral' }).focus()
    await page.keyboard.press('ArrowRight')
    const alunos = lista.getByRole('tab', { name: /Alunos/ })
    await expect(alunos).toHaveAttribute('aria-selected', 'true')
    await expect(alunos).toBeFocused()
    expect(await focoVisivel(page)).toBe(true)
    await expect(painel).toHaveText('Conteúdo de Alunos.')
    // O contador diz o que conta, e não só o número.
    await expect(alunos).toHaveText(/2 esperando você/)
    await page.keyboard.press('End')
    await expect(lista.getByRole('tab', { name: 'Atividades' })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(lista.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute('aria-selected', 'true')
    // O Tab seguinte entra no painel, e não na aba ao lado.
    await page.keyboard.press('Tab')
    await expect(painel).toBeFocused()

    // O menu: a seta para baixo abre com o foco no primeiro item, e as setas pulam o desligado.
    const bloco = secao(page, 'selecao-e-menu')
    const botao = bloco.getByRole('button', { name: 'Ações da atividade' })
    await botao.focus()
    await page.keyboard.press('ArrowDown')
    const menu = page.getByRole('menu', { name: 'Ações da atividade' })
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()
    expect(await focoVisivel(page)).toBe(true)
    await page.keyboard.press('ArrowDown')
    await expect(menu.getByRole('menuitem', { name: 'Gerar versão adaptada' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    // "Aplicar à turma" está desligado: a seta vai direto ao "Excluir".
    await expect(menu.getByRole('menuitem', { name: 'Excluir' })).toBeFocused()
    await expect(menu.getByRole('menuitem', { name: /Aplicar à turma/ })).toHaveAttribute('aria-disabled', 'true')
    expect(await violacoesGraves(page)).toEqual([])
    await page.keyboard.press('Home')
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()

    // O Esc fecha sem escolher e devolve o foco ao botão.
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(botao).toBeFocused()
    await expect(bloco.locator('[data-acao]')).toHaveText('')

    // O toque fora fecha, e só fecha: o botão vizinho, que estava embaixo do toque, não é acionado junto. O toque vai
    // pela coordenada, como o dedo: para o Playwright o vizinho está coberto, e ele esperaria o menu sair da frente.
    await page.keyboard.press('ArrowDown')
    await expect(menu).toBeVisible()
    // Inerte, o vizinho some da árvore de acessibilidade: aqui ele é achado pelo texto, e não pelo papel.
    const vizinho = bloco.locator('button', { hasText: 'Vizinho' })
    await expect(vizinho).toHaveAttribute('inert', '')
    const alvo = await caixa(vizinho)
    const [x, y] = [alvo.x + alvo.width / 2, alvo.y + alvo.height / 2]
    await (hasTouch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y))
    await expect(menu).toHaveCount(0)
    await expect(botao).toBeFocused()
    await expect(bloco.locator('[data-acao]')).toHaveText('')
    await expect(vizinho).not.toHaveAttribute('inert')
    // O controle: com o menu fechado, o mesmo toque aciona o vizinho.
    await acionar(vizinho, hasTouch)
    await expect(bloco.locator('[data-acao]')).toHaveText('Escolhido: vizinho')
    await botao.focus()

    // Enter abre, e Enter no item escolhe.
    await page.keyboard.press('Enter')
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(menu).toHaveCount(0)
    await expect(bloco.locator('[data-acao]')).toHaveText('Escolhido: exportar')
    await expect(botao).toBeFocused()
  })

  test('o diálogo de confirmação mostra o que vai acontecer, não começa com o foco em confirmar, e cancelar tem o tamanho de confirmar', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const bloco = secao(page, 'confirmacao')

    await acionar(bloco.getByRole('button', { name: 'Aprovar 32 correções' }), hasTouch)
    const oficial = page.getByRole('alertdialog', { name: 'Aprovar 32 correções' })
    await expect(oficial).toBeVisible()
    // O que vai acontecer, antes de confirmar: a atividade, a turma, quantas correções, e o efeito (regra 50, item 8).
    await expect(oficial).toContainText('Estequiometria: lista 3')
    await expect(oficial).toContainText('2ºB')
    await expect(oficial).toContainText('O diagnóstico por habilidade chega aos alunos da turma.')
    const aprovar = oficial.getByRole('button', { name: 'Aprovar 32 correções' })
    const cancelar = oficial.getByRole('button', { name: 'Cancelar' })
    // O foco começa no texto: um Enter a mais não aprova nada.
    await expect(aprovar).not.toBeFocused()
    await page.keyboard.press('Enter')
    await expect(oficial).toBeVisible()
    await expect(bloco.locator('[data-decisao]')).toHaveText('')
    // O botão que confirma é o preto, e o de cancelar tem a mesma altura (D59).
    expect(await desenho(aprovar)).toMatchObject({ fundo: RGB.noite })
    expect((await caixa(cancelar)).height).toBe((await caixa(aprovar)).height)
    expect((await caixa(cancelar)).height).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    // O Esc cancela, sem decidir.
    await page.keyboard.press('Escape')
    await expect(oficial).toHaveCount(0)
    await expect(bloco.locator('[data-decisao]')).toHaveText('')

    // A ação de perigo: o cheio em erro só existe aqui dentro, e o aviso da auditoria vem antes do botão.
    const suspender = bloco.getByRole('button', { name: 'Suspender a função' })
    expect(await desenho(suspender)).toMatchObject({ fundo: RGB.superficie, texto: RGB.erro })
    await acionar(suspender, hasTouch)
    const perigo = page.getByRole('alertdialog', { name: 'Suspender a correção de objetiva' })
    await expect(perigo).toContainText('A suspensão fica na auditoria da escola.')
    const confirmar = perigo.getByRole('button', { name: 'Suspender a função' })
    expect(await desenho(confirmar)).toMatchObject({ fundo: RGB.erro })
    await acionar(confirmar, hasTouch)
    await expect(perigo).toHaveCount(0)
    await expect(bloco.locator('[data-decisao]')).toHaveText('Suspensa')
  })

  test('o motor de formulário diz o que falta, entrega os valores validados, e a Adaptação não tem campo de texto', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const motor = secao(page, 'motor')
    const gerar = motor.getByRole('button', { name: 'Gerar atividade' })
    // O botão que gera é o primário, e o de cancelar tem o mesmo tamanho.
    expect(await desenho(gerar)).toMatchObject({ fundo: RGB.caramelo })
    expect((await caixa(motor.getByRole('button', { name: 'Cancelar' }))).height).toBe((await caixa(gerar)).height)

    // Gerar com o que falta não sai: a tela diz o que falta, e o foco vai ao primeiro campo pendente.
    await acionar(gerar, hasTouch)
    await expect(motor.getByRole('alert')).toHaveText('Para gerar, confira: Turma, Tema.')
    await expect(motor.getByLabel('Turma')).toBeFocused()
    await expect(motor.getByText('Escolha uma opção em "Turma".')).toBeVisible()
    await expect(motor.getByText('Preencha "Tema".')).toBeVisible()
    await expect(motor.locator('[data-pedido]')).toHaveText('')

    await motor.getByLabel('Turma').selectOption('turma-2b')
    await motor.getByLabel('Tema').fill('  Estequiometria ')
    // Número fora da faixa também não sai.
    await motor.getByLabel('Questões').fill('40')
    await acionar(gerar, hasTouch)
    await expect(motor.getByRole('alert')).toHaveText('Para gerar, confira: Questões.')
    await expect(motor.getByText('Use um número inteiro de 1 a 20 em "Questões".')).toBeVisible()
    await motor.getByLabel('Questões').fill('8')
    await acionar(gerar, hasTouch)

    // Gerando: o pedido recolhido numa linha e o aviso em texto. Depois, pronto, com o resultado e "Editar os campos".
    await expect(motor.locator('[data-motor="gerando"]')).toContainText('Atividade objetiva · 2ºB · Química · Estequiometria · Questões: 8')
    await expect(motor.getByRole('status').filter({ hasText: 'Gerando…' })).toBeVisible()
    expect(JSON.parse((await motor.locator('[data-pedido]').textContent()) ?? '')).toEqual({ turmaId: 'turma-2b', tema: 'Estequiometria', quantidade: 8 })
    await acionar(motor.getByRole('button', { name: 'Simular a resposta' }), hasTouch)
    await expect(motor.locator('[data-motor="pronto"]')).toContainText('O artefato gerado aparece aqui')
    await acionar(motor.getByRole('button', { name: 'Editar os campos' }), hasTouch)
    // Voltar a editar traz o que foi preenchido.
    await expect(motor.getByLabel('Tema')).toHaveValue('  Estequiometria ')

    // A Adaptação: só a lista fechada de tipos. Nenhum campo de texto, nem de uma linha nem de várias (D35, D67).
    const adaptacao = secao(page, 'motor-da-adaptacao')
    await expect(adaptacao.locator('form input[type="checkbox"]')).toHaveCount(6)
    await expect(adaptacao.locator('form input:not([type="checkbox"]), form textarea, form [contenteditable]')).toHaveCount(0)
    await acionar(adaptacao.getByRole('button', { name: 'Gerar versão adaptada' }), hasTouch)
    await expect(adaptacao.getByRole('alert')).toHaveText('Para gerar, confira: Tipo de adaptação.')
    await adaptacao.getByLabel('Tempo adicional').check()
    await adaptacao.getByLabel('Fonte ampliada').check()
    await acionar(adaptacao.getByRole('button', { name: 'Gerar versão adaptada' }), hasTouch)
    // Os tipos saem na ordem da lista, e não na do clique.
    expect(JSON.parse((await adaptacao.locator('[data-pedido]').textContent()) ?? '')).toEqual({ tipos: ['fonte_ampliada', 'tempo_adicional'] })
    expect(await larguraExcedente(page)).toBe(0)
  })
})
