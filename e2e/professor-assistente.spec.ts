import type { Locator, Page } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { ROTULOS_DA_ADAPTACAO, TIPOS_DE_ADAPTACAO } from '../packages/shared/src/assistente/conteudo.ts'
import { FUNCOES } from '../packages/shared/src/time/funcoes.ts'
import {
  atividadeSintetica,
  erroDaApi,
  mensagemDela,
  portao,
  propostaDeAtividade,
  QUEM_DECIDE,
  respostaComPagina,
  resumoDoArtefato,
  simularAssistente,
  TITULO_DO_MATERIAL,
  versaoAdaptada,
  type ApiDoAssistente,
} from './__fixtures__/assistente.ts'
import { abrirNavegacao, entrarPorEmail, gaveta, irPelaNavegacao, lateral, naGaveta, PRAZO_DA_ENTRADA_MS, esperarNovaConversa } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { confirmarVinculosNoBanco, criarAlocacaoDoProfessor, criarEquipeComSenha, type EquipeDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As telas do Assistente de ensino (A2, pacote W): a navegação do professor, a Home, a conversa com a pergunta da D18,
 * as ferramentas, o artefato e o Seu time. **Os estados de cada tela**, com a API destas telas simulada na página
 * (`__fixtures__/assistente.ts`): a de verdade é do pacote P. A sessão, o `/v1/eu` e as turmas são os da A1, de verdade.
 */

const PRAZO_DA_TELA_MS = 15_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

interface Cena {
  readonly api: ApiDoAssistente
  readonly professora: EquipeDeTeste
  readonly turmaId: string
  readonly turmaNome: string
  readonly disciplinaId: string
}

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  await (hasTouch ? alvo.tap() : alvo.click())
}

/** Navega dentro da aplicação, sem recarregar: a sessão e a memória da aba continuam, como num clique. */
async function irPara(page: Page, caminho: string): Promise<void> {
  await page.evaluate((destino) => {
    window.history.pushState(null, '', destino)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, caminho)
}

/** A professora entra, com a API do Assistente simulada. `comTurma` dá a ela uma turma de Química com o vínculo confirmado. */
async function entrar(page: Page, hasTouch: boolean, { comTurma = true, antes }: { comTurma?: boolean; antes?: (api: ApiDoAssistente) => void } = {}): Promise<Cena> {
  const api = await simularAssistente(page)
  // O que a escola já tinha antes de a professora entrar (uma função suspensa): a Home lê o time logo na entrada.
  antes?.(api)
  const professora = await criarEquipeComSenha()
  let turmaId = ''
  let turmaNome = ''
  if (comTurma) {
    const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['Química'])
    await confirmarVinculosNoBanco(professora.escolaId, alocacao.vinculoIds)
    turmaId = alocacao.turmaId
    turmaNome = alocacao.turmaNome
  }
  await page.goto('/entrar')
  // A professora abre em "Nova conversa", que lê as turmas dela: a resposta de verdade é esperada desde antes da entrada.
  const vinculos = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/meus-vinculos' && resposta.ok())
  await entrarPorEmail(page, professora, hasTouch)
  await esperarNovaConversa(page, professora.nome)
  let disciplinaId = ''
  if (comTurma) {
    // A disciplina da turma, como a API de verdade a devolve: é com ela que as respostas simuladas falam da mesma turma.
    const { itens } = (await (await vinculos).json()) as { itens: { disciplina?: { id: string } }[] }
    disciplinaId = itens[0]?.disciplina?.id ?? ''
    expect(disciplinaId).toMatch(UUID)
  }
  return { api, professora, turmaId, turmaNome, disciplinaId }
}

/**
 * Recarrega a página depois de o teste mudar o que a API simulada devolve: é a professora que volta à tela mais tarde. Sem
 * isto a tela usaria a leitura de segundos atrás, que ainda vale (o que muda por uma ação dela a própria tela relê).
 */
async function recarregar(page: Page): Promise<void> {
  await page.reload()
  // A tela da área só existe com a sessão de volta e o `/v1/eu` lido: antes disso a lateral ainda não tem os itens.
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
}

const caixa = (page: Page) => page.getByRole('textbox', { name: 'Pedido ao Assistente de ensino' })
const selosDeIA = (alvo: Page | Locator) => alvo.locator('[data-selo-ia]')

async function enviarPedido(page: Page, texto: string, hasTouch: boolean): Promise<void> {
  await caixa(page).fill(texto)
  await acionar(page.getByRole('button', { name: 'Enviar' }), hasTouch)
}

test.describe('a navegação do professor na A2 (D73)', () => {
  test('a lateral tem Nova conversa, Ferramentas e Turmas, e "Seu time" com o Assistente e o que espera a professora, e o Tutor sem contador; Calendário e Histórico não aparecem', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, disciplinaId } = await entrar(page, hasTouch)
    const origem = atividadeSintetica(turmaId, disciplinaId)
    api.entregas = [versaoAdaptada(origem).entrega, versaoAdaptada(origem).entrega, versaoAdaptada(origem, 'aprovada').entrega]
    await recarregar(page)
    await irPelaNavegacao(page, 'Nova conversa', hasTouch)
    await expect(page).toHaveURL(/\/professor\/nova-conversa$/)
    await expect(page).toHaveTitle('Nova conversa · Turmma', { timeout: PRAZO_DA_TELA_MS })

    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link')).toHaveText(['Nova conversa', 'Ferramentas', 'Turmas'])
    const time = lateral(page).getByRole('navigation', { name: 'Seu time' })
    // Os dois agentes que já têm tela (fase 3): o Assistente e o Tutor, que não espera ninguém e não leva contador.
    await expect(time.getByRole('link')).toHaveText([/^Assistente de ensino/, /^Tutor$/])
    await expect(time.getByRole('link', { name: 'Tutor' })).toHaveAccessibleName('Tutor')
    const assistente = time.getByRole('link', { name: /Assistente de ensino/ })
    // O contador diz só o que espera a professora: as duas pendentes, e não a que ela já aprovou.
    await expect(assistente).toHaveAccessibleName(/^Assistente de ensino\s*2\s*esperando você$/, { timeout: PRAZO_DA_ENTRADA_MS })
    for (const fora of ['Calendário', 'Histórico']) await expect(lateral(page).getByText(fora, { exact: true })).toHaveCount(0)
    // D59: o contador não se mexe sozinho.
    expect(await assistente.locator('[data-contador-do-time]').evaluate((elemento) => getComputedStyle(elemento).animationName)).toBe('none')
    expect(await violacoesGraves(page)).toEqual([])

    await acionar(assistente, hasTouch)
    await expect(page).toHaveURL(/\/professor\/time\/assistente$/)
    await expect(page).toHaveTitle('Assistente de ensino · Turmma', { timeout: PRAZO_DA_TELA_MS })
    if (naGaveta(page)) await expect(gaveta(page)).toBeHidden()
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seu time' }).getByRole('link', { name: /Assistente de ensino/ })).toHaveAttribute('aria-current', 'page')
    // Dentro da conversa, "Nova conversa" continua selecionado; dentro de um artefato, "Ferramentas".
    await irPara(page, '/professor/conversa')
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Nova conversa' })).toHaveAttribute('aria-current', 'page')
  })
})

test.describe('a Home (11.2): os quatro estados', () => {
  test('sem turma confirmada, a tela diz o que falta e leva a Turmas; não há caixa de pedido', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    await entrar(page, hasTouch, { comTurma: false })
    await irPara(page, '/professor/nova-conversa')
    await expect(page.getByText('Falta uma turma confirmada')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(caixa(page)).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(page.getByRole('button', { name: 'Ir para Turmas' }), hasTouch)
    await expect(page).toHaveURL(/\/professor\/turmas$/)
  })

  test('carregando, erro com "Tentar de novo" e, com dado, a saudação, a caixa com só as três ferramentas e a turma; "Esperando você" só com pendência', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, turmaNome, disciplinaId } = await entrar(page, hasTouch)
    const origem = atividadeSintetica(turmaId, disciplinaId)

    // Carregando e erro: as turmas dela, seguradas e depois recusadas.
    const segura = portao()
    let recusar = true
    await page.route('**/v1/meus-vinculos*', async (route) => {
      await segura.aberta
      if (recusar) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify(erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO').corpo) })
      } else await route.continue()
    })
    await recarregar(page)
    await expect(page.getByText('Carregando as suas turmas…')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    segura.abrir()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    recusar = false
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)

    // Com dado: a saudação pela hora, com o primeiro nome, e nada de enfeite onde não há pendência.
    await expect(page.getByText(/^(Bom dia|Boa tarde|Boa noite), Professora\.$/)).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(caixa(page)).toBeVisible()
    await expect(page.getByLabel('Turma e disciplina')).toHaveValue(`${turmaId}:${disciplinaId}`)
    await expect(page.getByLabel('Turma e disciplina').locator('option')).toHaveText([`${turmaNome} · Química`])
    await expect(page.getByRole('heading', { name: 'Esperando você' })).toHaveCount(0)
    await expect(page.locator('[data-esperando-voce]')).toHaveCount(0)

    // O menu Ferramenta: desfazer a escolha e as três ferramentas que existem, e nenhuma outra.
    await acionar(page.getByRole('button', { name: 'Ferramenta' }), hasTouch)
    await expect(page.getByRole('menuitemradio')).toHaveText([/^Sem ferramenta/, /^Plano de aula/, /^Adaptação/, /^Atividade objetiva/])
    expect(await larguraExcedente(page)).toBe(0)
    await page.keyboard.press('Escape')
    expect(await violacoesGraves(page)).toEqual([])

    // Com entrega pendente, "Esperando você" aparece, com a função, o que é e a turma, e leva ao Seu time.
    api.entregas = [versaoAdaptada(origem).entrega]
    await recarregar(page)
    const esperando = page.locator('[data-esperando-voce]')
    await expect(page.getByRole('heading', { name: 'Esperando você' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(esperando).toHaveCount(1)
    await expect(esperando).toContainText('Adaptação')
    await expect(esperando).toContainText('Versão adaptada')
    await expect(esperando).toContainText(`Atividade de estequiometria (versão adaptada) · ${turmaNome}`)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(esperando, hasTouch)
    await expect(page).toHaveURL(/\/professor\/time\/assistente$/)
  })
})

test.describe('a conversa (11.3)', () => {
  test('o pedido aparece na hora, o Assistente pensa, pergunta se ela quer a ferramenta com duas opções do mesmo tamanho, abre o cartão preenchido, gera e responde com a página citada', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, disciplinaId } = await entrar(page, hasTouch)
    await irPara(page, '/professor/nova-conversa')
    await expect(caixa(page)).toBeVisible({ timeout: PRAZO_DA_TELA_MS })

    const pedido = 'monta uma atividade de estequiometria, dez questões'
    await enviarPedido(page, pedido, hasTouch)
    // Enviando e pensando: o pedido dela na tela, a caixa limpa e a assinatura da IA com o texto de quem está preparando.
    await expect(page).toHaveURL(/\/professor\/conversa$/)
    const conversa = page.getByRole('log', { name: 'Conversa com o Assistente de ensino' })
    await expect(conversa.getByText(pedido)).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(conversa.locator('[data-pensando]')).toContainText('Assistente de ensino')
    await expect(selosDeIA(conversa.locator('[data-pensando]'))).toHaveCount(1)
    await expect(caixa(page)).toHaveValue('')
    // O enviar da Home saiu da tela com ela: o foco chega na caixa da conversa, e não no `body`.
    await expect(caixa(page)).toBeFocused()
    // O pedido saiu uma vez, com a chave do envio, o texto e a turma; nada de escola nem de pessoa.
    await expect.poll(() => api.pedidosEm(/mensagens$/).length).toBe(1)
    const enviado = api.pedidosEm(/mensagens$/)[0]?.corpo as Record<string, unknown>
    expect(Object.keys(enviado).sort()).toEqual(['chaveEnvio', 'disciplinaId', 'texto', 'turmaId'])
    expect(enviado).toMatchObject({ texto: pedido, turmaId, disciplinaId })
    expect(enviado['chaveEnvio']).toMatch(UUID)

    // A execução conclui com a proposta de ferramenta: a pergunta da D18.
    const proposta = propostaDeAtividade(turmaId, disciplinaId)
    api.conversa = [mensagemDela(pedido, turmaId, disciplinaId), proposta]
    // A releitura da conversa demora: enquanto ela não volta, a resposta que a execução trouxe aparece **depois** do
    // pedido, e não acima dele.
    const releitura = portao()
    api.trocar('conversa', async (lido) => {
      await releitura.aberta
      return api.responder('conversa', lido)
    })
    api.concluir(api.ultimaExecucao(), { tipo: 'mensagem', mensagem: proposta })
    const escolha = conversa.getByRole('group', { name: proposta.texto })
    await expect(escolha).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(conversa.locator('article')).toHaveText([new RegExp(`^Você: ${pedido}$`), /Posso fazer isso com a ferramenta Atividade objetiva/])
    releitura.abrir()
    api.trocar('conversa')
    await expect(conversa.locator('[data-pensando]')).toHaveCount(0)
    // O pedido não aparece duas vezes quando a conversa lida o traz.
    await expect(conversa.getByText(pedido)).toHaveCount(1)
    const opcoes = escolha.getByRole('button')
    await expect(opcoes).toHaveText([/^Usar a ferramenta Atividade objetiva/, /^Só conversar/])
    // Duas opções do mesmo peso (D59): mesmo tamanho e mesmo desenho, e nenhuma com o foco.
    const [usar, soConversar] = await Promise.all([opcoes.nth(0).boundingBox(), opcoes.nth(1).boundingBox()])
    expect(Math.round(usar?.width ?? 0)).toBe(Math.round(soConversar?.width ?? -1))
    expect(Math.round(usar?.height ?? 0)).toBe(Math.round(soConversar?.height ?? -1))
    const desenho = (alvo: Locator) => alvo.evaluate((elemento) => [getComputedStyle(elemento).backgroundColor, getComputedStyle(elemento).color, getComputedStyle(elemento).borderTopColor, getComputedStyle(elemento).fontWeight])
    expect(await desenho(opcoes.nth(0))).toEqual(await desenho(opcoes.nth(1)))
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    // A consulta da execução parou quando ela concluiu.
    const consultas = api.consultasDeExecucao.length
    await page.waitForTimeout(2_500)
    expect(api.consultasDeExecucao.length).toBe(consultas)

    // Com o sim, o cartão da ferramenta abre dentro da conversa, com o que o Assistente entendeu.
    await acionar(opcoes.nth(0), hasTouch)
    await expect(conversa.getByText('Você escolheu:')).toContainText('Usar a ferramenta Atividade objetiva')
    const cartao = page.locator('[data-cartao-de-ferramenta="atividade_objetiva"]')
    await expect(cartao.getByLabel('Tema')).toHaveValue('Estequiometria')
    // A opção escolhida saiu da tela: o foco vai para o cartão que abriu.
    await expect(page.getByRole('region', { name: 'Ferramenta Atividade objetiva' })).toBeFocused()
    await expect(cartao.getByLabel('Questões')).toHaveValue('10')
    await expect(cartao.getByLabel('Turma e disciplina')).toHaveValue(`${turmaId}:${disciplinaId}`)
    // Com o cartão aberto, a ação da tela é a dele: a caixa de pedido espera.
    await expect(caixa(page)).toBeDisabled()
    await cartao.getByLabel('Questões').fill('2')
    await acionar(cartao.getByRole('button', { name: 'Gerar atividade' }), hasTouch)
    await expect(cartao.getByRole('status').filter({ hasText: 'Gerando' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    // O botão de gerar deu lugar ao pedido recolhido: o foco fica dentro do cartão.
    expect(await page.evaluate(() => document.activeElement?.closest('[data-motor]') !== null && document.activeElement !== document.body)).toBe(true)
    await expect.poll(() => api.pedidosEm(/gerar$/).length).toBe(1)
    const gerar = api.pedidosEm(/gerar$/)[0]
    expect(gerar?.caminho).toBe('/v1/ferramentas/atividade_objetiva/gerar')
    expect(gerar?.corpo).toMatchObject({ turmaId, disciplinaId, tema: 'Estequiometria', quantidade: 2 })

    // A geração conclui: a resposta com a assinatura, a página de cada questão, as fontes e as ações à vista.
    const artefato = atividadeSintetica(turmaId, disciplinaId)
    api.artefatos = [artefato]
    api.concluir(api.ultimaExecucao(), { tipo: 'artefato', artefatoId: artefato.id, entregaId: null })
    await expect(cartao.getByText(artefato.titulo)).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    // A troca de "Gerando…" pelo resultado é anunciada a quem não vê a tela.
    await expect(cartao.locator('[data-anuncio-do-resultado]')).toHaveText('Atividade objetiva: geração concluída. O resultado está logo abaixo do pedido.')
    await expect(cartao.getByText('Assistente · conversa e ferramentas')).toBeVisible()
    await expect(selosDeIA(cartao)).toHaveCount(1)
    await expect(cartao.getByRole('button', { name: `Fonte: ${TITULO_DO_MATERIAL}, p. 142` })).toBeVisible()
    await expect(cartao.getByText(`Fontes (2): ${TITULO_DO_MATERIAL}, p. 142 · p. 145`)).toBeVisible()
    await expect(cartao.getByRole('link', { name: 'Abrir o artefato' })).toBeVisible()
    await expect(cartao.getByRole('button', { name: 'Exportar em PDF' })).toBeVisible()
    // Toda saída de IA da tela leva o selo: a proposta e o que a ferramenta gerou.
    await expect(selosDeIA(page.getByRole('main'))).toHaveCount(2)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(cartao.getByRole('link', { name: 'Abrir o artefato' }), hasTouch)
    await expect(page).toHaveURL(new RegExp(`/professor/artefatos/${artefato.id}$`))
  })

  test('"Ver mensagens anteriores" traz as antigas, em ordem, sem jogar a tela para o fim da conversa', async ({ page, hasTouch }) => {
    test.slow()
    const { api, turmaId, disciplinaId } = await entrar(page, hasTouch)
    const troca = (numero: number, quando: string) => [mensagemDela(`pergunta ${quando} ${String(numero)}`, turmaId, disciplinaId), respostaComPagina(`Resposta ${quando} ${String(numero)}, com algumas linhas de texto para a conversa ficar mais alta que a janela.`)]
    api.conversaAnterior = [1, 2, 3, 4, 5, 6].flatMap((numero) => troca(numero, 'antiga'))
    api.conversa = [1, 2, 3, 4, 5, 6].flatMap((numero) => troca(numero, 'recente'))
    await irPara(page, '/professor/conversa')
    const conversa = page.getByRole('log')
    const ultima = conversa.getByText('Resposta recente 6,')
    // A conversa abre no fim: a última mensagem à vista.
    await expect(ultima).toBeInViewport({ timeout: PRAZO_DA_TELA_MS })
    await expect(conversa.getByText('Você: pergunta antiga 1')).toHaveCount(0)

    const anteriores = page.getByRole('button', { name: 'Ver mensagens anteriores' })
    await anteriores.scrollIntoViewIfNeeded()
    await expect(ultima).not.toBeInViewport()
    await acionar(anteriores, hasTouch)
    await expect(conversa.getByText('Você: pergunta antiga 1')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(anteriores).toHaveCount(0)
    // Ela foi ler o começo: a tela fica onde ela está, e não volta para o fim.
    await page.evaluate(() => new Promise<void>((pronto) => requestAnimationFrame(() => requestAnimationFrame(() => pronto()))))
    await expect(ultima).not.toBeInViewport()
    // As antigas vêm antes das recentes, cada pergunta antes da resposta dela.
    const falas = await conversa.locator('article').allInnerTexts()
    expect(falas).toHaveLength(24)
    expect(falas[0]).toContain('pergunta antiga 1')
    expect(falas[1]).toContain('Resposta antiga 1,')
    expect(falas[12]).toContain('pergunta recente 1')
    expect(falas[23]).toContain('Resposta recente 6,')
    expect(await larguraExcedente(page)).toBe(0)
  })

  test('os quatro estados da conversa; a resposta com chip de página e fontes; a falha vira aviso com "Tentar de novo", nunca código; a função suspensa vira aviso que explica', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, disciplinaId } = await entrar(page, hasTouch)

    // Carregando e erro.
    const segura = portao()
    api.trocar('conversa', async () => {
      await segura.aberta
      return erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO')
    })
    await irPara(page, '/professor/conversa')
    await expect(page.getByText('Carregando a conversa…')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    segura.abrir()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    // Vazio: o convite para pedir.
    api.trocar('conversa')
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(page.getByText('Nenhuma conversa ainda')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    expect(await violacoesGraves(page)).toEqual([])

    // A execução falha: aviso dentro da conversa, com "Tentar de novo", e nenhum código na tela.
    // O 13º pedido do minuto: a API recusa com 429, e a tela diz com calma que é só esperar, sem alarme e sem código.
    api.trocar('mensagens', () => erroDaApi(429, 'LIMITE_EXCEDIDO'))
    await enviarPedido(page, 'o que é reagente limitante?', hasTouch)
    const limite = page.locator('[data-limite-de-pedidos]')
    await expect(limite).toContainText('Você fez muitos pedidos ao Assistente em pouco tempo.', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('main')).not.toContainText('LIMITE_EXCEDIDO')
    await expect(page.getByRole('log').getByText('o que é reagente limitante?')).toBeVisible()
    // "Pedir de novo" manda o mesmo pedido com a mesma chave: o recusado não chegou a virar execução.
    api.trocar('mensagens')
    await acionar(limite.getByRole('button', { name: 'Pedir de novo' }), hasTouch)
    await expect.poll(() => api.pedidosEm(/mensagens$/).length).toBe(2)
    const [recusado, repetido] = api.pedidosEm(/mensagens$/).map((pedido) => pedido.corpo as { texto: string; chaveEnvio: string })
    expect(repetido).toEqual(recusado)
    await expect(limite).toHaveCount(0)

    api.falhar(api.ultimaExecucao(), 'IA_INDISPONIVEL')
    const aviso = page.locator('[data-aviso-fila="falha"]')
    await expect(aviso).toContainText('Não foi possível responder agora.', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('main')).not.toContainText('IA_INDISPONIVEL')
    await expect(page.getByRole('log').getByText('o que é reagente limitante?')).toBeVisible()
    // "Tentar de novo" manda o mesmo pedido com chave nova: a antiga devolveria a execução que falhou.
    await acionar(aviso.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect.poll(() => api.pedidosEm(/mensagens$/).length).toBe(3)
    const [, primeiro, segundo] = api.pedidosEm(/mensagens$/).map((pedido) => pedido.corpo as { texto: string; chaveEnvio: string })
    expect(segundo?.texto).toBe(primeiro?.texto)
    expect(segundo?.chaveEnvio).not.toBe(primeiro?.chaveEnvio)

    // Com dado: a resposta em texto, com a assinatura, o chip de página e as fontes.
    const resposta = respostaComPagina('O reagente limitante é o que acaba primeiro.\n<b>Ele</b> determina quanto produto se forma.')
    api.conversa = [mensagemDela('o que é reagente limitante?', turmaId, disciplinaId), resposta]
    api.concluir(api.ultimaExecucao(), { tipo: 'mensagem', mensagem: resposta })
    const conversa = page.getByRole('log')
    await expect(conversa.getByText('O reagente limitante é o que acaba primeiro.')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    // O texto do modelo entra como texto: a marcação aparece escrita, e não vira elemento.
    await expect(conversa.locator('[data-texto-da-ia] b')).toHaveCount(0)
    await expect(conversa.getByText('Assistente de ensino', { exact: true })).toHaveCount(1)
    await expect(selosDeIA(conversa)).toHaveCount(1)
    const chip = conversa.getByRole('button', { name: `Fonte: ${TITULO_DO_MATERIAL}, p. 142` })
    await acionar(chip, hasTouch)
    await expect(page.getByRole('group', { name: `Fonte: ${TITULO_DO_MATERIAL}, p. 142` })).toContainText('cada mol de carbono')
    expect(await larguraExcedente(page)).toBe(0)
    await page.keyboard.press('Escape')
    await expect(conversa.getByText(`Fontes (1): ${TITULO_DO_MATERIAL}, p. 142`)).toBeVisible()
    await expect(conversa.getByText('o que é reagente limitante?')).toHaveCount(1)
    expect(await violacoesGraves(page)).toEqual([])

    // A escola suspende a função: aviso que explica, sem alerta, e a caixa não aceita pedido.
    api.suspensas.add('conversa_e_ferramentas')
    await recarregar(page)
    const explicacao = page.getByRole('note')
    await expect(explicacao).toContainText('A coordenação suspendeu a conversa e as ferramentas do Assistente nesta escola.', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(caixa(page)).toBeDisabled()
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('main')).not.toContainText('FUNCAO_SUSPENSA')
    expect(await violacoesGraves(page)).toEqual([])
  })
})

test.describe('Ferramentas (D74) e o formulário', () => {
  test('o catálogo tem só as três ferramentas que existem, nas categorias da D74, e a lista do que foi gerado tem os quatro estados', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, turmaNome, disciplinaId } = await entrar(page, hasTouch)
    const segura = portao()
    api.trocar('artefatos', async () => {
      await segura.aberta
      return erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO')
    })
    await irPelaNavegacao(page, 'Ferramentas', hasTouch)
    await expect(page).toHaveTitle('Ferramentas · Turmma', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('heading', { level: 3 })).toHaveText(['Planejar', 'Preparar a aula', 'Avaliar'])
    await expect(page.locator('[data-ferramenta]')).toHaveCount(3)
    for (const fora of ['Prova', 'Apresentação', 'Simulado', 'Redação', 'Mapa mental']) await expect(page.getByRole('main').getByText(fora, { exact: true })).toHaveCount(0)
    await expect(page.getByText('Carregando o que você já gerou…')).toBeVisible()
    segura.abrir()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    api.trocar('artefatos')
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(page.getByText('Nada gerado ainda')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    const origem = atividadeSintetica(turmaId, disciplinaId)
    const adaptada = versaoAdaptada(origem)
    api.artefatos = [adaptada.artefato, origem]
    // A lista vem em páginas: a primeira, e "Ver mais" traz a seguinte.
    api.porPagina = 1
    await recarregar(page)
    const gerados = page.locator('[data-artefato]')
    await expect(gerados).toHaveCount(1, { timeout: PRAZO_DA_ENTRADA_MS })
    await acionar(page.getByRole('button', { name: 'Ver mais' }), hasTouch)
    await expect(gerados).toHaveCount(2, { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('button', { name: 'Ver mais' })).toHaveCount(0)
    await expect(gerados.nth(0)).toContainText('Versão adaptada · Fonte ampliada + Tempo adicional (50% a mais)')
    await expect(gerados.nth(0)).toContainText('Esperando você')
    await expect(gerados.nth(1)).toContainText(`Atividade objetiva · ${turmaNome}`)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A ferramenta que não existe não tem formulário: o endereço responde como página não encontrada.
    await irPara(page, '/professor/ferramentas/prova')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
  })

  test('D35, D67: a Adaptação não tem campo de texto; pede a atividade, os tipos da lista fechada e o tempo extra; manda só isso; e a versão nasce esperando a professora', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, turmaNome, disciplinaId } = await entrar(page, hasTouch)

    // Vazio: sem atividade para adaptar, a tela diz o que falta e leva até lá.
    await irPara(page, '/professor/ferramentas/adaptacao')
    await expect(page.getByText('Ainda não há atividade para adaptar')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('button', { name: 'Gerar uma atividade' })).toBeVisible()

    const origem = atividadeSintetica(turmaId, disciplinaId)
    api.artefatos = [origem]
    await recarregar(page)
    await irPara(page, '/professor/ferramentas')
    await acionar(page.locator('[data-ferramenta="adaptacao"]'), hasTouch)
    await expect(page).toHaveURL(/\/professor\/ferramentas\/adaptacao$/)
    await expect(page).toHaveTitle('Adaptação · Turmma')
    const formulario = page.locator('[data-motor="formulario"]')
    await expect(formulario).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    // Nenhum campo de texto: nem de uma linha, nem de várias. Só lista fechada.
    await expect(formulario.locator('textarea, input:not([type="checkbox"])')).toHaveCount(0)
    await expect(formulario.getByRole('textbox')).toHaveCount(0)
    await expect(formulario.getByRole('checkbox')).toHaveCount(TIPOS_DE_ADAPTACAO.length)
    for (const tipo of TIPOS_DE_ADAPTACAO) await expect(formulario.getByRole('checkbox', { name: ROTULOS_DA_ADAPTACAO[tipo], exact: true })).toBeVisible()
    await expect(formulario.getByLabel('Atividade de origem').locator('option')).toHaveText(['Escolha…', `${origem.titulo} · ${turmaNome}`])
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Sem atividade e sem tipo, nada sai, e cada campo diz o que falta.
    await acionar(formulario.getByRole('button', { name: 'Gerar versão adaptada' }), hasTouch)
    await expect(formulario.getByRole('alert')).toContainText('Para gerar, confira: Atividade de origem, Tipo de adaptação.')
    // O tempo extra só existe com "Tempo adicional" marcado: sem o tipo, o campo nem aparece, e não há o que recusar
    // depois de enviar. Marcado o tipo, o campo aparece; desmarcado, some de novo.
    await formulario.getByLabel('Atividade de origem').selectOption(origem.id)
    await formulario.getByRole('checkbox', { name: 'Fonte ampliada' }).check()
    await expect(formulario.getByLabel('Tempo extra')).toHaveCount(0)
    await formulario.getByRole('checkbox', { name: 'Tempo adicional' }).check()
    await formulario.getByLabel('Tempo extra').selectOption('50')
    await formulario.getByRole('checkbox', { name: 'Tempo adicional' }).uncheck()
    await expect(formulario.getByLabel('Tempo extra')).toHaveCount(0)
    expect(api.pedidosEm(/adaptar$/)).toHaveLength(0)

    // De volta com o tipo marcado, o campo volta com o que estava escolhido.
    await formulario.getByRole('checkbox', { name: 'Tempo adicional' }).check()
    await expect(formulario.getByLabel('Tempo extra')).toHaveValue('50')
    await acionar(formulario.getByRole('button', { name: 'Gerar versão adaptada' }), hasTouch)
    await expect.poll(() => api.pedidosEm(/adaptar$/).length).toBe(1)
    const adaptar = api.pedidosEm(/adaptar$/)[0]
    expect(adaptar?.caminho).toBe(`/v1/artefatos/${origem.id}/adaptar`)
    const corpo = adaptar?.corpo as Record<string, unknown>
    // Só os tipos, o tempo extra e a chave: o pedido não tem onde levar texto.
    expect(Object.keys(corpo).sort()).toEqual(['chaveEnvio', 'tempoExtraPercentual', 'tipos'])
    expect(corpo).toMatchObject({ tipos: ['fonte_ampliada', 'tempo_adicional'], tempoExtraPercentual: 50 })

    // A versão nasce pendente: a tela diz que espera a professora e onde decidir.
    const adaptada = versaoAdaptada(origem)
    api.artefatos = [adaptada.artefato, origem]
    api.entregas = [adaptada.entrega]
    api.concluir(api.ultimaExecucao(), { tipo: 'artefato', artefatoId: adaptada.artefato.id, entregaId: adaptada.entrega.id })
    const pronto = page.locator('[data-motor="pronto"]')
    await expect(pronto.getByText('Assistente · adaptação')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(selosDeIA(pronto)).toHaveCount(1)
    await expect(pronto.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você')
    await expect(pronto.getByText('Esta versão só pode ir aos alunos depois que você aprovar. Até lá, o PDF dela sai marcado como rascunho.')).toBeVisible()
    // Pendente, a versão só sai em PDF como rascunho, e o botão diz isso antes do clique.
    await expect(pronto.getByRole('button', { name: 'Exportar rascunho em PDF' })).toBeVisible()
    await expect(pronto.getByRole('button', { name: 'Exportar em PDF', exact: true })).toHaveCount(0)
    await expect(pronto.getByRole('link', { name: 'Ver e decidir em Seu time' })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A Adaptação escolhida na caixa de pedido abre o cartão dela, e o que estava escrito na caixa não vai junto.
    await irPara(page, '/professor/nova-conversa')
    await caixa(page).fill('prova adaptada para um aluno com laudo')
    await acionar(page.getByRole('button', { name: 'Ferramenta' }), hasTouch)
    await acionar(page.getByRole('menuitemradio', { name: /^Adaptação/ }), hasTouch)
    await expect(page).toHaveURL(/\/professor\/conversa$/)
    const cartao = page.locator('[data-cartao-de-ferramenta="adaptacao"]')
    await expect(cartao.locator('[data-motor="formulario"]')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(cartao.locator('textarea, input:not([type="checkbox"])')).toHaveCount(0)
    await expect(page.getByRole('main')).not.toContainText('laudo')
    expect(api.pedidosEm(/mensagens$/)).toHaveLength(0)
  })

  test('a função suspensa pela escola tira o formulário e explica, sem alarme', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, disciplinaId } = await entrar(page, hasTouch, { antes: (simulada) => simulada.suspensas.add('adaptacao') })
    api.artefatos = [atividadeSintetica(turmaId, disciplinaId)]
    await irPara(page, '/professor/ferramentas/adaptacao')
    await expect(page.getByRole('note')).toContainText('A coordenação suspendeu a Adaptação nesta escola.', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.locator('[data-motor]')).toHaveCount(0)
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])
    // A recusa do servidor, para quem tinha a tela aberta antes da suspensão, vira o mesmo aviso, e não um erro.
    api.suspensas.clear()
    api.trocar('gerar', () => erroDaApi(409, 'FUNCAO_SUSPENSA'))
    await irPara(page, '/professor/ferramentas/plano_de_aula')
    const formulario = page.locator('[data-motor="formulario"]')
    await formulario.getByLabel('Tema').fill('Introdução à estequiometria')
    await acionar(formulario.getByRole('button', { name: 'Gerar plano de aula' }), hasTouch)
    await expect(page.getByRole('note')).toContainText('A coordenação suspendeu a conversa e as ferramentas', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('main')).not.toContainText('FUNCAO_SUSPENSA')
  })
})

test.describe('o artefato', () => {
  test('os quatro estados; a atividade com gabarito, explicação e a página de cada questão; renomear; exportar em PDF; pedir versão adaptada; e a versão com quem aprovou', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, turmaNome, disciplinaId } = await entrar(page, hasTouch)
    const origem = atividadeSintetica(turmaId, disciplinaId)
    const pendente = versaoAdaptada(origem)
    const aprovada = versaoAdaptada(origem, 'aprovada')
    const rejeitada = versaoAdaptada(origem, 'rejeitada')
    const comVersoes = { ...origem, versoesAdaptadas: [resumoDoArtefato(pendente.artefato), resumoDoArtefato(aprovada.artefato), resumoDoArtefato(rejeitada.artefato)] }
    api.artefatos = [comVersoes, pendente.artefato, aprovada.artefato, rejeitada.artefato]
    api.entregas = [pendente.entrega, aprovada.entrega, rejeitada.entrega]

    // Carregando, erro e o que não existe (ou é de outra turma), que respondem igual.
    const segura = portao()
    api.trocar('artefato', async () => {
      await segura.aberta
      return erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO')
    })
    await irPara(page, `/professor/artefatos/${origem.id}`)
    await expect(page.getByText('Carregando o artefato…')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    segura.abrir()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    api.trocar('artefato', () => erroDaApi(404, 'NAO_ENCONTRADO'))
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(page.getByText('Este artefato não está disponível')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    api.trocar('artefato')
    await irPara(page, '/professor/ferramentas')
    await acionar(page.locator('[data-artefato]').filter({ hasText: 'Atividade objetiva' }), hasTouch)

    // Com dado: o nome da coisa, a assinatura da IA, as questões com gabarito em texto, a explicação e a página.
    await expect(page.getByRole('heading', { level: 1, name: origem.titulo })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page).toHaveTitle(`${origem.titulo} · Turmma`)
    await expect(page.getByRole('main')).toContainText(`Atividade objetiva · ${turmaNome} · Química`)
    await expect(page.getByText('Assistente · conversa e ferramentas')).toBeVisible()
    await expect(selosDeIA(page.getByRole('main'))).toHaveCount(1)
    await expect(page.getByText('Qual a massa de CO₂ formada na queima completa de 24 g de carbono?')).toBeVisible()
    await expect(page.getByText('Gabarito', { exact: true })).toHaveCount(2)
    await expect(page.getByText('24 g de carbono são 2 mol, que formam 2 mol de CO₂, ou 88 g.')).toBeVisible()
    await expect(page.getByRole('button', { name: `Fonte: ${TITULO_DO_MATERIAL}, p. 142` })).toBeVisible()
    await expect(page.getByText(`Página 142 · ${TITULO_DO_MATERIAL}`)).toBeVisible()
    // Aplicar à turma (fase 3): um botão só, no artefato; o fluxo dele está em `professor-turma.spec.ts`.
    await expect(page.getByRole('button', { name: /Aplicar/ })).toHaveCount(1)
    // As versões adaptadas, cada uma com a situação dela: a pendente espera, a aprovada diz quem e quando.
    const versoes = page.getByRole('region', { name: 'Versões adaptadas' })
    await expect(versoes.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você')
    await expect(versoes.locator('[data-aprovacao="aprovada"]')).toContainText(`Aprovada por ${QUEM_DECIDE.nome} · 05/10`)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Renomear manda só o título.
    await acionar(page.getByRole('button', { name: 'Renomear' }), hasTouch)
    await page.getByLabel('Novo título').fill('Lista 3: estequiometria')
    await acionar(page.getByRole('button', { name: 'Salvar o título' }), hasTouch)
    await expect(page.getByRole('heading', { level: 1, name: 'Lista 3: estequiometria' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    expect(api.pedidosEm(/artefatos\/[^/]+$/).map(({ metodo, corpo }) => ({ metodo, corpo }))).toEqual([{ metodo: 'PATCH', corpo: { titulo: 'Lista 3: estequiometria' } }])

    // Exportar em PDF entrega o arquivo que a API mandou.
    const baixado = page.waitForEvent('download')
    await acionar(page.getByRole('button', { name: 'Exportar em PDF' }), hasTouch)
    expect((await baixado).suggestedFilename()).toBe('atividade-sintetica.pdf')

    // A versão que ainda espera a decisão só sai em PDF como rascunho, e a tela diz isso antes do clique.
    await acionar(versoes.getByRole('link').nth(0), hasTouch)
    await expect(page.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('button', { name: 'Exportar rascunho em PDF' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exportar em PDF', exact: true })).toHaveCount(0)
    await expect(page.getByRole('main')).toContainText('o PDF sai marcado como rascunho em todas as páginas')
    await expect(page.getByRole('button', { name: 'Renomear' })).toBeVisible()
    await acionar(page.getByRole('link', { name: 'Abrir a atividade de origem' }), hasTouch)

    // A rejeitada não sai em PDF, e a tela diz por quê; decidida, também não muda de nome.
    await acionar(versoes.getByRole('link').nth(2), hasTouch)
    await expect(page.locator('[data-aprovacao="rejeitada"]')).toContainText(`${QUEM_DECIDE.nome} rejeitou`, { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('button', { name: /Exportar/ })).toHaveCount(0)
    await expect(page.locator('[data-sem-pdf]')).toHaveText('Esta versão foi rejeitada e não pode ser exportada: ela não vai aos alunos. Peça outra versão adaptada a partir da atividade de origem.')
    await expect(page.getByRole('button', { name: 'Renomear' })).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(page.getByRole('link', { name: 'Abrir a atividade de origem' }), hasTouch)

    // A versão adaptada aprovada: a adaptação pelo tipo, a aprovação com quem e quando, e o PDF limpo.
    await acionar(versoes.getByRole('link').nth(1), hasTouch)
    await expect(page.getByRole('heading', { level: 1, name: aprovada.artefato.titulo })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Fonte ampliada + Tempo adicional (50% a mais)')).toBeVisible()
    await expect(page.getByText('Assistente · adaptação')).toBeVisible()
    await expect(page.locator('[data-aprovacao="aprovada"]')).toContainText(`Aprovada por ${QUEM_DECIDE.nome}`)
    await expect(page.getByRole('button', { name: 'Exportar em PDF', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Renomear' })).toHaveCount(0)
    // Versão adaptada não se adapta de novo.
    await expect(page.getByRole('button', { name: 'Pedir versão adaptada' })).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])

    // "Pedir versão adaptada", na atividade, abre a Adaptação já com ela escolhida.
    await acionar(page.getByRole('link', { name: 'Abrir a atividade de origem' }), hasTouch)
    await acionar(page.getByRole('button', { name: 'Pedir versão adaptada' }), hasTouch)
    await expect(page).toHaveURL(new RegExp(`/professor/ferramentas/adaptacao\\?origem=${origem.id}$`))
    await expect(page.locator('[data-motor="formulario"]').getByLabel('Atividade de origem')).toHaveValue(origem.id, { timeout: PRAZO_DA_TELA_MS })
  })
})

test.describe('Seu time › Assistente de ensino (11.4)', () => {
  test('carregando, erro, e sem entrega nenhuma a tela não fica vazia: diz o que o Assistente faz, com o texto da escola, e como pedir', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api } = await entrar(page, hasTouch)
    const segura = portao()
    api.trocar('entregas', async (pedido) => {
      await segura.aberta
      return pedido.url.searchParams.get('estado') === 'pendente' ? api.responder('entregas', pedido) : erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO')
    })
    await irPara(page, '/professor/time/assistente')
    await expect(page.getByText('Carregando o que o Assistente fez…')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    segura.abrir()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    api.trocar('entregas')
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)

    // O vazio abre pelo que o Assistente faz, e só depois diz que não há nada esperando.
    const convite = page.getByRole('region', { name: 'O que o Assistente de ensino faz por você' })
    await expect(convite).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(convite).toContainText('Agora não há nada esperando você.')
    await expect(convite).toContainText(FUNCOES.adaptacao.fazSozinha)
    await expect(convite.getByRole('button', { name: 'Pedir ao Assistente' })).toBeVisible()
    // O cabeçalho diz o que cada função faz sozinha e o que espera aprovação, com o texto que a API dá.
    await acionar(page.getByText('O que cada função faz sozinha, e o que espera você'), hasTouch)
    const adaptacao = page.locator('[data-funcao="adaptacao"]')
    await expect(adaptacao).toContainText(FUNCOES.adaptacao.fazSozinha)
    await expect(adaptacao).toContainText(FUNCOES.adaptacao.esperaAprovacao)
    // Só as funções do Assistente: as do Tutor e do Analista não são dele.
    await expect(page.locator('[data-funcao]')).toHaveCount(3)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(convite.getByRole('button', { name: 'Pedir ao Assistente' }), hasTouch)
    await expect(page).toHaveURL(/\/professor\/nova-conversa$/)
  })

  test('Aprovar mostra o que vai acontecer antes de confirmar, passa pela decisão registrada uma vez só, mesmo com dois cliques, e a tela mostra quem aprovou e quando', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, turmaNome, disciplinaId } = await entrar(page, hasTouch, { antes: (simulada) => simulada.suspensas.add('adaptacao') })
    const origem = atividadeSintetica(turmaId, disciplinaId)
    const adaptada = versaoAdaptada(origem)
    const antiga = versaoAdaptada(origem, 'rejeitada')
    api.artefatos = [origem, adaptada.artefato]
    api.entregas = [adaptada.entrega, antiga.entrega]
    await irPara(page, '/professor/time/assistente')

    // A faixa "Esperando você" presa no alto, o filtro com o contador e a entrega em balão, assinada.
    const faixa = page.locator('[data-faixa-esperando]')
    await expect(faixa).toContainText(`${adaptada.artefato.titulo} · ${turmaNome}`, { timeout: PRAZO_DA_TELA_MS })
    expect(await faixa.evaluate((elemento) => getComputedStyle(elemento).position)).toBe('sticky')
    await expect(page.getByRole('tab')).toHaveText([/^Tudo$/, /^Esperando você1/, /^Correção$/, /^Adaptação$/])
    const pendente = page.locator('[data-entrega="pendente"]')
    await expect(pendente).toContainText(`Preparei "${adaptada.artefato.titulo}" da turma ${turmaNome}. Esta versão adaptada só pode ir aos alunos depois que você aprovar.`)
    await expect(pendente.getByText('Assistente · adaptação')).toBeVisible()
    await expect(selosDeIA(page.getByRole('log'))).toHaveCount(2)
    await expect(pendente.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você')
    // A escola suspendeu a Adaptação: a entrega que espera diz isso, e continua podendo ser decidida. A já decidida não diz.
    await expect(pendente.locator('[data-entrega-de-funcao-suspensa]')).toHaveText('A coordenação suspendeu a função "Adaptação" nesta escola: o Assistente não prepara outra enquanto isso. Esta entrega continua esperando a sua decisão.')
    await expect(page.locator('[data-entrega="rejeitada"] [data-entrega-de-funcao-suspensa]')).toHaveCount(0)
    // A rejeitada de antes diz quem rejeitou e o motivo, e não tem mais o que decidir.
    const rejeitada = page.locator('[data-entrega="rejeitada"]')
    await expect(rejeitada.locator('[data-aprovacao="rejeitada"]')).toContainText(`${QUEM_DECIDE.nome} rejeitou`)
    await expect(rejeitada.locator('[data-aprovacao="rejeitada"]')).toContainText('Motivo: A questão 2 perdeu o enunciado.')
    await expect(rejeitada.getByRole('button')).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Aprovar é o botão preto, e abre a confirmação que diz o que é, de qual turma e o que muda.
    const aprovar = pendente.getByRole('button', { name: /^Aprovar/ })
    expect(await aprovar.evaluate((elemento) => getComputedStyle(elemento).backgroundColor)).toBe('rgb(13, 13, 13)')
    await acionar(aprovar, hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Aprovar a versão adaptada' })
    await expect(dialogo).toContainText(adaptada.artefato.titulo)
    await expect(dialogo).toContainText(turmaNome)
    await expect(dialogo).toContainText('Só depois da sua aprovação esta versão pode ir aos alunos da turma.')
    // Nada foi decidido só por abrir.
    expect(api.pedidosEm(/decidir$/)).toHaveLength(0)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Dois cliques seguidos em confirmar: uma decisão só.
    const segura = portao()
    api.trocar('decidir', async (pedido) => {
      await segura.aberta
      return api.responder('decidir', pedido)
    })
    const confirmar = dialogo.getByRole('button', { name: 'Aprovar a versão adaptada' })
    await confirmar.evaluate((botao: HTMLButtonElement) => {
      botao.click()
      botao.click()
    })
    await expect(dialogo.getByRole('button', { name: 'Aprovando…' })).toBeDisabled()
    segura.abrir()
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    expect(api.pedidosEm(/decidir$/).map(({ caminho, corpo }) => ({ caminho, corpo }))).toEqual([{ caminho: `/v1/entregas/${adaptada.entrega.id}/decidir`, corpo: { decisao: 'aprovar' } }])

    // Depois de decidir, a tela mostra quem e quando, e não oferece decidir de novo.
    const decidida = page.locator('[data-entrega="aprovada"]')
    await expect(decidida.locator('[data-aprovacao="aprovada"]')).toContainText(`Aprovada por ${QUEM_DECIDE.nome} · `, { timeout: PRAZO_DA_TELA_MS })
    await expect(decidida.getByRole('button')).toHaveCount(0)
    // O botão que abriu o diálogo saiu com a decisão: o foco fica na entrega decidida, e não no `body`.
    await expect(decidida).toBeFocused()
    await expect(faixa).toHaveCount(0)
    // O contador da lateral acompanha: não há mais nada esperando.
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seu time' }).getByRole('link', { name: /^Assistente de ensino/ })).toHaveAccessibleName('Assistente de ensino')
  })

  test('Rejeitar exige justificativa de 8 a 500 caracteres antes de mandar, e a tela mostra quem rejeitou e o motivo; a entrega já decidida em outra aba vira a tela atualizada, e não erro', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, disciplinaId } = await entrar(page, hasTouch)
    const origem = atividadeSintetica(turmaId, disciplinaId)
    const primeira = versaoAdaptada(origem)
    const segunda = versaoAdaptada({ ...origem, titulo: 'Lista 4' })
    api.artefatos = [origem, primeira.artefato, segunda.artefato]
    api.entregas = [primeira.entrega, { ...segunda.entrega, criadaEm: '2026-10-05T14:00:00.000Z' }]
    // As entregas vêm em páginas: "Ver mais entregas" traz a seguinte.
    api.porPagina = 1
    await irPara(page, '/professor/time/assistente')
    const pendentes = page.locator('[data-entrega="pendente"]')
    await expect(pendentes).toHaveCount(1, { timeout: PRAZO_DA_TELA_MS })
    await acionar(page.getByRole('button', { name: 'Ver mais entregas' }), hasTouch)
    await expect(pendentes).toHaveCount(2, { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('button', { name: 'Ver mais entregas' })).toHaveCount(0)
    api.porPagina = undefined
    // Com mais de uma pendência a faixa presa fica recolhida no contador, e abre a pedido: não toma a tela do celular.
    const faixa = page.locator('[data-faixa-esperando]')
    await expect(faixa.getByText('2 entregas esperando você')).toBeVisible()
    await expect(faixa.getByRole('button', { name: /^Ver/ })).toHaveCount(0)
    await acionar(faixa.getByText('2 entregas esperando você'), hasTouch)
    await expect(faixa.getByRole('button', { name: /^Ver/ })).toHaveCount(2)
    await acionar(faixa.getByText('2 entregas esperando você'), hasTouch)

    await acionar(pendentes.nth(0).getByRole('button', { name: /^Rejeitar/ }), hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Rejeitar a versão adaptada' })
    const justificativa = dialogo.getByLabel(/Por que você está rejeitando\?/)
    await expect(dialogo).toContainText('Não escreva nome de aluno nem o motivo da adaptação.')
    const confirmar = dialogo.getByRole('button', { name: 'Rejeitar a versão adaptada' })
    // Sem justificativa, e com uma curta demais, nada é mandado, e o campo diz o que falta.
    await acionar(confirmar, hasTouch)
    await expect(dialogo.getByText('Escreva pelo menos 8 caracteres.')).toBeVisible()
    await justificativa.fill('  curta  ')
    await acionar(confirmar, hasTouch)
    await expect(dialogo.getByText('Escreva pelo menos 8 caracteres: faltam 3.')).toBeVisible()
    await expect(justificativa).toHaveAttribute('aria-invalid', 'true')
    expect(api.pedidosEm(/decidir$/)).toHaveLength(0)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    await justificativa.fill('  A questão 2 ficou sem as alternativas.  ')
    await acionar(confirmar, hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    expect(api.pedidosEm(/decidir$/).map(({ caminho, corpo }) => ({ caminho, corpo }))).toEqual([
      { caminho: `/v1/entregas/${primeira.entrega.id}/decidir`, corpo: { decisao: 'rejeitar', justificativa: 'A questão 2 ficou sem as alternativas.' } },
    ])
    const rejeitada = page.locator('[data-entrega="rejeitada"]')
    await expect(rejeitada.locator('[data-aprovacao="rejeitada"]')).toContainText(`${QUEM_DECIDE.nome} rejeitou · `, { timeout: PRAZO_DA_TELA_MS })
    await expect(rejeitada.locator('[data-aprovacao="rejeitada"]')).toContainText('Motivo: A questão 2 ficou sem as alternativas.')
    await expect(rejeitada).toBeFocused()

    // A outra entrega é decidida em outra aba enquanto o diálogo está aberto nesta.
    await acionar(pendentes.nth(0).getByRole('button', { name: /^Aprovar/ }), hasTouch)
    const aprovar = page.getByRole('alertdialog', { name: 'Aprovar a versão adaptada' })
    await expect(aprovar).toBeVisible()
    api.entregas = api.entregas.map((entrega) => (entrega.id === segunda.entrega.id ? { ...entrega, estado: 'aprovada', decididaEm: '2026-10-05T15:00:00.000Z', decididaPor: QUEM_DECIDE } : entrega))
    await acionar(aprovar.getByRole('button', { name: 'Aprovar a versão adaptada' }), hasTouch)
    await expect(aprovar).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('main').getByRole('status').filter({ hasText: 'já tinha sido decidida' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('main')).not.toContainText('ENTREGA_JA_DECIDIDA')
    await expect(page.locator('[data-entrega="aprovada"] [data-aprovacao="aprovada"]')).toContainText(`Aprovada por ${QUEM_DECIDE.nome}`, { timeout: PRAZO_DA_TELA_MS })
    await expect(pendentes).toHaveCount(0)
    // Também aqui o diálogo só fechou depois de a tela reler: o foco está na entrega, e não no `body`.
    await expect(page.locator('[data-entrega="aprovada"]')).toBeFocused()
    expect(await violacoesGraves(page)).toEqual([])
  })
})
