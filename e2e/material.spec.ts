import type { Locator, Page, Request, Route } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { entrarComoCoordenacaoNaMesmaAba, esperarEstrutura, irPelaNavegacao, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { CAMINHO_DO_PDF_DE_DEMONSTRACAO, criarMaterialNoBanco, materiaisNoBanco, recusasNaAuditoria } from './__fixtures__/material.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { criarEquipeComSenha, montarEstruturaNoBanco, type EquipeDeTeste, type EstruturaDeTeste } from './__fixtures__/sessao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A tela Material da coordenação (MVP de apresentação, A2; `docs/mvp-rapido.md`, seções 1 e 9.2; D5, D22, D75): é o
 * primeiro passo do roteiro da demonstração. Tudo pela tela, nos projetos `chromebook` e `celular`, com o PDF de
 * demonstração, que é texto nosso. Os textos esperados estão aqui por extenso.
 */

const TITULO = 'Química 2 — Capítulo 7: Estequiometria'
/** A leitura do PDF acontece depois da resposta do envio, e a tela a acompanha de 1,5 em 1,5 s. */
const PRAZO_DA_LEITURA_MS = 30_000
const INDISPONIVEL = JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })
const TEXTO_SEM_LICENCA =
  'Sem uma licença que permita o uso, o material não entra na base da escola. O arquivo não foi enviado nem lido. Peça a autorização ao dono do conteúdo e envie de novo com a licença.'
const TEXTO_SEM_DECLARACAO = 'Falta a declaração de que a escola pode usar este material. O arquivo não foi enviado nem lido. Marque a declaração e envie de novo.'

const ehALista = (url: URL) => url.pathname === '/v1/materiais'
const ehOEnvio = (pedido: Request) => new URL(pedido.url()).pathname === '/v1/materiais' && pedido.method() === 'POST'

const principal = (page: Page) => page.getByRole('main')
const lista = (page: Page) => principal(page).getByRole('region', { name: 'Materiais da escola' })
const itemDe = (page: Page, titulo: string) => lista(page).getByRole('listitem').filter({ hasText: titulo })
const arquivo = (page: Page) => page.getByTestId('arquivo-do-material')
const enviar = (page: Page) => principal(page).getByRole('button', { name: /^Enviar material$|^Enviando…$/ })
const declaracao = (page: Page) => principal(page).getByLabel(/^Declaro que a escola pode usar este material/)
const dialogo = (page: Page) => page.getByRole('alertdialog')
/** O arquivo escolhido, como a área de envio o mostra: o nome e o tamanho (o anúncio para o leitor de tela começa por outro texto). */
const escolhido = (page: Page, nome: string) => principal(page).getByText(new RegExp(`^${nome.replaceAll('.', '\\.')} · \\d`))

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

interface Cenario {
  readonly coordenadora: EquipeDeTeste
  readonly estrutura: EstruturaDeTeste
}

/** Uma escola com uma disciplina, e a coordenadora dela na tela Material. `antes` roda com a sessão ainda fechada. */
async function abrirMaterial(page: Page, hasTouch: boolean, antes?: (cenario: Cenario) => Promise<void>): Promise<Cenario> {
  const coordenadora = await criarEquipeComSenha('coordenador')
  const estrutura = await montarEstruturaNoBanco(coordenadora.escolaId)
  const cenario = { coordenadora, estrutura }
  await antes?.(cenario)
  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
  await esperarEstrutura(page)
  await irPelaNavegacao(page, 'Material', hasTouch)
  await expect(page).toHaveURL(/\/coordenacao\/material$/)
  return cenario
}

/** Preenche o formulário de envio. Sem `licenca`, o campo fica como está. */
async function preencher(page: Page, cenario: Cenario, campos: { titulo?: string; licenca?: string; declarar?: boolean; comArquivo?: boolean } = {}): Promise<void> {
  const { titulo = TITULO, licenca = 'Autoria da escola ou de professor dela', declarar = true, comArquivo = true } = campos
  if (comArquivo) await arquivo(page).setInputFiles(CAMINHO_DO_PDF_DE_DEMONSTRACAO)
  await principal(page).getByLabel('Título').fill(titulo)
  await principal(page).getByLabel('Disciplina').selectOption({ label: cenario.estrutura.disciplina.nome })
  await principal(page).getByLabel('De quem é o material').selectOption({ label: 'Material próprio da escola' })
  await principal(page).getByLabel('Licença de uso (obrigatória)').selectOption({ label: licenca })
  if (declarar) await declaracao(page).check()
}

test.describe('Material da coordenação', () => {
  test('a coordenação sobe o PDF de demonstração com licença e vê "Pronto · 6 páginas", sem recarregar a página', async ({ page, hasTouch }) => {
    const cenario = await abrirMaterial(page, hasTouch)
    await expect(page).toHaveTitle('Material · Turmma')
    // O vazio convida a enviar o primeiro material.
    await expect(lista(page).getByText('Nenhum material ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await page.evaluate(() => {
      ;(window as unknown as { semRecarga?: boolean }).semRecarga = true
    })

    await arquivo(page).setInputFiles(CAMINHO_DO_PDF_DE_DEMONSTRACAO)
    // O arquivo escolhido aparece com o nome e o tamanho, e o título é sugerido pelo nome dele.
    await expect(escolhido(page, 'quimica-2-cap-7-estequiometria.pdf')).toBeVisible()
    await expect(principal(page).getByLabel('Título')).toHaveValue('quimica 2 cap 7 estequiometria')
    await preencher(page, cenario, { comArquivo: false })
    await acionar(enviar(page), hasTouch)

    await expect(lista(page).getByRole('status').filter({ hasText: 'Material enviado. A leitura das páginas começa agora e leva alguns instantes.' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const item = itemDe(page, TITULO)
    await expect(item).toContainText(`${cenario.estrutura.disciplina.nome} · Material próprio da escola · Autoria da escola ou de professor dela`)
    await expect(item.getByText('Pronto · 6 páginas')).toBeVisible({ timeout: PRAZO_DA_LEITURA_MS })
    expect(await page.evaluate(() => (window as unknown as { semRecarga?: boolean }).semRecarga)).toBe(true)

    // O formulário está pronto para o próximo: sem arquivo, sem título e com a declaração desmarcada.
    await expect(principal(page).getByLabel('Título')).toHaveValue('')
    await expect(declaracao(page)).not.toBeChecked()
    await expect(principal(page).getByRole('button', { name: 'Escolher arquivo' })).toBeVisible()

    expect(await materiaisNoBanco(cenario.coordenadora.escolaId)).toEqual([expect.objectContaining({ titulo: TITULO, estado: 'pronto', paginas: 6, trechos: 6, excluido: false })])
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('enquanto o material está sendo lido a tela consulta sozinha, e troca "Processando" por "Pronto" sem recarregar', async ({ page, hasTouch }) => {
    let leituras = 0
    const material = (estado: 'processando' | 'pronto') => ({
      id: '0190f5a0-0000-7000-8000-0000000000aa',
      titulo: TITULO,
      disciplinaId: '0190f5a0-0000-7000-8000-0000000000bb',
      titularidade: 'escola',
      licenciante: null,
      licenca: 'autoria_da_escola',
      estado,
      falha: null,
      paginas: estado === 'pronto' ? 6 : null,
      trechos: estado === 'pronto' ? 6 : 0,
      enviadoEm: '2026-10-04T12:00:00.000Z',
    })
    // As duas primeiras leituras dizem `processando`; da terceira em diante, `pronto`.
    await page.route(
      (url) => ehALista(url),
      async (rota: Route) => {
        if (rota.request().method() !== 'GET') return rota.continue()
        leituras += 1
        await rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ itens: [material(leituras <= 2 ? 'processando' : 'pronto')] }) })
      },
    )
    await abrirMaterial(page, hasTouch)

    const item = itemDe(page, TITULO)
    await expect(item.getByText('Processando')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista(page).getByRole('status').filter({ hasText: 'Um material está sendo lido.' })).toBeAttached()
    await expect(item.getByText('Pronto · 6 páginas')).toBeVisible({ timeout: PRAZO_DA_LEITURA_MS })
    await expect(item.getByText('Processando')).toHaveCount(0)

    // Pronto, a consulta para: nada de leitura em laço com a tela parada.
    const depoisDePronto = leituras
    await page.waitForTimeout(4_000)
    expect(leituras).toBe(depoisDePronto)
  })

  test('sem licença, a tela diz "Envio recusado" e por quê; o arquivo não sai do computador, nada vira material e a recusa fica na auditoria', async ({ page, hasTouch }) => {
    const cenario = await abrirMaterial(page, hasTouch)
    await expect(lista(page).getByText('Nenhum material ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await preencher(page, cenario, { licenca: 'Não tenho a licença, ou não sei' })
    // Antes de enviar, a tela já diz o que vai acontecer.
    await expect(principal(page).getByText('Sem licença, o envio é recusado: o arquivo não é enviado nem lido, e a tentativa fica registrada na auditoria da escola.')).toBeVisible()

    const pedido = page.waitForRequest(ehOEnvio)
    await acionar(enviar(page), hasTouch)
    const corpo = (await pedido).postDataBuffer()

    const alerta = principal(page).getByRole('alert').filter({ hasText: 'Envio recusado.' })
    await expect(alerta).toHaveText(`Envio recusado. ${TEXTO_SEM_LICENCA}`, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(alerta).toBeFocused()
    const recusado = itemDe(page, TITULO)
    await expect(recusado.getByText('Envio recusado · sem licença')).toBeVisible()
    await expect(recusado).toContainText(TEXTO_SEM_LICENCA)
    // A recusa aparece em borda tracejada, e não se confunde com um material.
    expect(await recusado.evaluate((no) => getComputedStyle(no).borderTopStyle)).toBe('dashed')
    await expect(recusado.getByRole('button', { name: /Excluir/ })).toHaveCount(0)

    // O pedido foi sem o arquivo: nem um byte do PDF saiu do computador.
    expect(corpo).not.toBeNull()
    expect(corpo?.includes('%PDF-')).toBe(false)
    expect(corpo?.includes('sem_licenca')).toBe(true)
    expect(await materiaisNoBanco(cenario.coordenadora.escolaId)).toEqual([])
    expect(await recusasNaAuditoria(cenario.coordenadora.escolaId)).toEqual([{ motivo: 'sem_licenca', licenca: 'sem_licenca', declaracao: true }])

    // Com a licença e sem a declaração, também é recusado, com o outro motivo.
    await principal(page).getByLabel('Título').fill('Outro capítulo')
    await principal(page).getByLabel('Licença de uso (obrigatória)').selectOption({ label: 'Licença aberta (Creative Commons e semelhantes)' })
    await declaracao(page).uncheck()
    await acionar(enviar(page), hasTouch)
    await expect(principal(page).getByRole('alert').filter({ hasText: 'Envio recusado.' })).toHaveText(`Envio recusado. ${TEXTO_SEM_DECLARACAO}`, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(itemDe(page, 'Outro capítulo').getByText('Envio recusado · sem declaração')).toBeVisible()
    expect(await materiaisNoBanco(cenario.coordenadora.escolaId)).toEqual([])
    expect((await recusasNaAuditoria(cenario.coordenadora.escolaId)).map((recusa) => recusa.motivo)).toEqual(['sem_licenca', 'sem_declaracao'])

    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Dispensar tira o aviso da tela; a lista volta ao vazio.
    await acionar(itemDe(page, 'Outro capítulo').getByRole('button', { name: /Dispensar/ }), hasTouch)
    await acionar(itemDe(page, TITULO).getByRole('button', { name: /Dispensar/ }), hasTouch)
    await expect(lista(page).getByText('Nenhum material ainda')).toBeVisible()
  })

  test('o formulário incompleto diz o que falta em cada campo, e o arquivo que não é PDF é recusado na tela, sem pedido à API', async ({ page, hasTouch }) => {
    await abrirMaterial(page, hasTouch)
    await expect(lista(page).getByText('Nenhum material ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    let envios = 0
    page.on('request', (pedido) => {
      if (ehOEnvio(pedido)) envios += 1
    })

    await acionar(enviar(page), hasTouch)
    await expect(principal(page).getByText('Escolha o PDF do material.')).toBeVisible()
    await expect(principal(page).getByText('Dê um título ao material, como ele aparece no livro ou na apostila.')).toBeVisible()
    await expect(principal(page).getByText('Escolha a disciplina do material.')).toBeVisible()
    await expect(principal(page).getByText('Diga de quem é o material.')).toBeVisible()
    await expect(principal(page).getByText('Escolha a licença de uso. Sem licença declarada, o material não entra.')).toBeVisible()
    // O foco vai ao primeiro campo com erro: o arquivo.
    await expect(principal(page).getByRole('button', { name: 'Escolher arquivo' })).toBeFocused()

    await arquivo(page).setInputFiles({ name: 'apostila.pdf', mimeType: 'application/pdf', buffer: Buffer.from('nome;turma\nAluno sintético;7A\n') })
    await expect(principal(page).getByText('O arquivo não é um PDF que conseguimos abrir. Confira o arquivo e envie de novo.')).toBeVisible()
    await expect(principal(page).getByRole('button', { name: 'Escolher arquivo' })).toBeVisible()

    // Material de terceiro pede quem deu a licença.
    await principal(page).getByLabel('De quem é o material').selectOption({ label: 'Material de terceiro, com licença' })
    await expect(principal(page).getByLabel('Quem deu a licença')).toBeVisible()
    await acionar(enviar(page), hasTouch)
    await expect(principal(page).getByText('Diga quem é o dono do conteúdo que deu a licença.')).toBeVisible()
    expect(envios).toBe(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('o arquivo entra arrastado e também pelo botão, com o teclado: nada só funciona arrastando', async ({ page, hasTouch }) => {
    await abrirMaterial(page, hasTouch)
    await expect(lista(page).getByText('Nenhum material ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const botao = principal(page).getByRole('button', { name: 'Escolher arquivo' })
    const caixa = await botao.boundingBox()
    expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)

    // Pelo botão: com o toque no celular; com o foco e o Enter no computador.
    const seletor = page.waitForEvent('filechooser')
    if (hasTouch) await botao.tap()
    else {
      await botao.focus()
      await page.keyboard.press('Enter')
    }
    await (await seletor).setFiles(CAMINHO_DO_PDF_DE_DEMONSTRACAO)
    await expect(escolhido(page, 'quimica-2-cap-7-estequiometria.pdf')).toBeVisible()
    await expect(principal(page).getByRole('button', { name: 'Trocar arquivo' })).toBeVisible()

    // Arrastado: o mesmo PDF solto na área, com outro nome.
    const bytes = [...readFileSync(CAMINHO_DO_PDF_DE_DEMONSTRACAO)]
    const transferencia = await page.evaluateHandle((conteudo) => {
      const dados = new DataTransfer()
      dados.items.add(new File([new Uint8Array(conteudo)], 'capitulo-arrastado.pdf', { type: 'application/pdf' }))
      return dados
    }, bytes)
    await escolhido(page, 'quimica-2-cap-7-estequiometria.pdf').dispatchEvent('drop', { dataTransfer: transferencia })
    await expect(escolhido(page, 'capitulo-arrastado.pdf')).toBeVisible()

    // Dois arquivos soltos de uma vez: um por vez.
    const duas = await page.evaluateHandle(() => {
      const dados = new DataTransfer()
      dados.items.add(new File(['%PDF-1.4 a'], 'a.pdf', { type: 'application/pdf' }))
      dados.items.add(new File(['%PDF-1.4 b'], 'b.pdf', { type: 'application/pdf' }))
      return dados
    })
    await escolhido(page, 'capitulo-arrastado.pdf').dispatchEvent('drop', { dataTransfer: duas })
    await expect(principal(page).getByText('Envie um arquivo por vez. Escolha só o PDF deste material.')).toBeVisible()
  })

  test('os quatro estados: carregando, erro com "Tentar de novo", vazio que convida a enviar, e com dado em cada situação', async ({ page, hasTouch }) => {
    const segurada = portao()
    let falhar = true
    await page.route(
      (url) => ehALista(url),
      async (rota: Route) => {
        if (rota.request().method() !== 'GET') return rota.continue()
        await segurada.aberta
        if (falhar) return rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL })
        return rota.continue()
      },
    )
    const cenario = await abrirMaterial(page, hasTouch)

    // Carregando: a lista ainda não chegou.
    await expect(principal(page).getByRole('status').filter({ hasText: 'Carregando os materiais…' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('heading', { level: 1, name: 'Material' })).toBeAttached()

    // Erro: diz o que fazer, e "Tentar de novo" lê outra vez.
    segurada.abrir()
    await expect(principal(page).getByRole('alert').filter({ hasText: 'O sistema está indisponível no momento. Tente de novo em instantes.' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(await violacoesGraves(page)).toEqual([])
    falhar = false
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)

    // Vazio: convida a enviar o primeiro material, e o botão abre a escolha do arquivo.
    await expect(lista(page).getByText('Nenhum material ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(lista(page)).toContainText('Envie o primeiro PDF da escola, com a licença declarada.')
    const seletor = page.waitForEvent('filechooser')
    await acionar(lista(page).getByRole('button', { name: 'Escolher o primeiro arquivo' }), hasTouch)
    await seletor
    expect(await violacoesGraves(page)).toEqual([])

    // Com dado: o que entrou, o que está sendo lido e o que falhou, o mais novo primeiro.
    const { escolaId } = cenario.coordenadora
    await criarMaterialNoBanco(escolaId, cenario.estrutura.disciplina.id, { titulo: 'Capítulo pronto', estado: 'pronto', paginas: 12 })
    await criarMaterialNoBanco(escolaId, cenario.estrutura.disciplina.id, { titulo: 'Capítulo sem texto', estado: 'falhou', falha: 'sem_texto' })
    await criarMaterialNoBanco(escolaId, cenario.estrutura.disciplina.id, { titulo: 'Capítulo em leitura', estado: 'processando' })
    await page.reload()
    await expect(itemDe(page, 'Capítulo pronto').getByText('Pronto · 12 páginas')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(itemDe(page, 'Capítulo em leitura').getByText('Processando')).toBeVisible()
    const falhou = itemDe(page, 'Capítulo sem texto')
    await expect(falhou.getByText('Falhou')).toBeVisible()
    await expect(falhou).toContainText('O PDF não tem texto para ler: parece ser só imagem. Envie a versão com texto.')
    await expect(lista(page).getByRole('listitem')).toHaveText([/Capítulo em leitura/, /Capítulo sem texto/, /Capítulo pronto/])
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // "Tentar de novo" devolve ao formulário o que o material declarava, e pede o arquivo.
    await acionar(falhou.getByRole('button', { name: /^Tentar de novo/ }), hasTouch)
    await expect(principal(page).getByLabel('Título')).toHaveValue('Capítulo sem texto')
    await expect(principal(page).getByLabel('Licença de uso (obrigatória)')).toHaveValue('autoria_da_escola')
    await expect(declaracao(page)).not.toBeChecked()
    await expect(principal(page).getByRole('button', { name: 'Escolher arquivo' })).toBeFocused()
    await expect(lista(page).getByRole('status').filter({ hasText: 'Escolha o arquivo de novo, marque a declaração e envie.' })).toBeVisible()

    // Com o arquivo de verdade, o material entra, e o que falhou sai da lista.
    await arquivo(page).setInputFiles(CAMINHO_DO_PDF_DE_DEMONSTRACAO)
    await declaracao(page).check()
    await acionar(enviar(page), hasTouch)
    await expect(itemDe(page, 'Capítulo sem texto').getByText('Pronto · 6 páginas')).toBeVisible({ timeout: PRAZO_DA_LEITURA_MS })
    await expect(itemDe(page, 'Capítulo sem texto')).toHaveCount(1)
    await expect(lista(page).getByText('Falhou')).toHaveCount(0)
  })

  test('excluir é ação de perigo: a confirmação diz o que acontece, cancelar não exclui, e confirmar tira o material e os trechos', async ({ page, hasTouch }) => {
    let materialId = ''
    const cenario = await abrirMaterial(page, hasTouch, async ({ coordenadora, estrutura }) => {
      materialId = await criarMaterialNoBanco(coordenadora.escolaId, estrutura.disciplina.id, { titulo: TITULO, estado: 'pronto', paginas: 6 })
      await criarMaterialNoBanco(coordenadora.escolaId, estrutura.disciplina.id, { titulo: 'Capítulo que fica', estado: 'pronto', paginas: 2 })
    })
    const item = itemDe(page, TITULO)
    await expect(item.getByText('Pronto · 6 páginas')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    await acionar(item.getByRole('button', { name: /^Excluir/ }), hasTouch)
    await expect(dialogo(page).getByRole('heading', { name: 'Excluir material' })).toBeVisible()
    await expect(dialogo(page)).toContainText(TITULO)
    await expect(dialogo(page)).toContainText(cenario.estrutura.disciplina.nome)
    await expect(dialogo(page)).toContainText(
      'As atividades e os planos já gerados continuam citando a página deste material. Daqui em diante, a busca do Assistente e do Tutor deixa de achá-lo, e o texto lido dele é apagado.',
    )
    // O foco começa no texto, e não no botão que exclui; cancelar tem o mesmo tamanho de confirmar.
    const confirmar = dialogo(page).getByRole('button', { name: 'Excluir material' })
    const cancelar = dialogo(page).getByRole('button', { name: 'Cancelar' })
    await expect(confirmar).not.toBeFocused()
    expect((await cancelar.boundingBox())?.height).toBe((await confirmar.boundingBox())?.height)
    expect((await confirmar.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    await acionar(cancelar, hasTouch)
    await expect(dialogo(page)).toHaveCount(0)
    await expect(item).toBeVisible()
    expect((await materiaisNoBanco(cenario.coordenadora.escolaId)).find((material) => material.id === materialId)).toMatchObject({ excluido: false, trechos: 6 })

    await acionar(item.getByRole('button', { name: /^Excluir/ }), hasTouch)
    await acionar(dialogo(page).getByRole('button', { name: 'Excluir material' }), hasTouch)
    await expect(lista(page).getByRole('status').filter({ hasText: 'Material excluído. A busca do Assistente e do Tutor deixou de achá-lo.' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dialogo(page)).toHaveCount(0)
    await expect(itemDe(page, TITULO)).toHaveCount(0)
    await expect(itemDe(page, 'Capítulo que fica')).toBeVisible()
    // O botão que abriu o diálogo saiu com o item: o foco vai para o título da lista, e não para o `body`.
    await expect(lista(page).getByRole('heading', { name: 'Materiais da escola' })).toBeFocused()

    const noBanco = await materiaisNoBanco(cenario.coordenadora.escolaId)
    expect(noBanco.find((material) => material.id === materialId)).toMatchObject({ excluido: true, trechos: 0 })
    expect(noBanco.find((material) => material.titulo === 'Capítulo que fica')).toMatchObject({ excluido: false, trechos: 2 })
  })
})
