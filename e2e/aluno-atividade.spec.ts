import type { Locator, Page } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { diagnosticoDa, erroDaApi, minhaAtividade, portao, provaDa, QUEM_APROVA, simularAluno, type ApiDoAluno } from './__fixtures__/aluno.ts'
import { entrarComoAluno, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { colocarAlunoNaTurma, criarAlunoComMatricula, type AlunoDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As telas da atividade do aluno (MVP, A3, pacote X): "Atividades" e a atividade aberta. **Os estados de cada tela**, com
 * a API destas telas simulada na página (`__fixtures__/aluno.ts`). A sessão, o `/v1/eu` e a turma são os de verdade. O
 * fluxo inteiro contra a API real está em `aluno-fluxo.spec.ts`.
 */

const PRAZO_DA_TELA_MS = 15_000
/** A fila de respostas tenta de novo sozinha em 2 s, 4 s e 8 s: o teste espera até a terceira tentativa, com folga. */
const PRAZO_DO_REENVIO_MS = 25_000
const AVISO_DA_AVALIACAO = 'Avaliação: o Tutor fica pausado até a professora encerrar.'
const ESPERA_PELA_CORRECAO = 'Sua professora ainda vai revisar a correção.'
/** O que a área do aluno nunca diz: nota, conceito, e nada que compare (D46; regra 50, item 9). */
const PROIBIDO_NA_AREA = /\bnotas?\b|\bconceito\b|ranking|média da turma|colegas?\b/i

interface Cena {
  readonly api: ApiDoAluno
  readonly aluno: AlunoDeTeste
  /** Um colega de verdade, na mesma turma: o nome dele não pode aparecer em tela nenhuma do aluno. */
  readonly colega: AlunoDeTeste
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

async function recarregar(page: Page): Promise<void> {
  await page.reload()
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
}

/** O aluno entra, com a API das telas dele simulada e um colega de verdade na mesma turma. */
async function entrar(page: Page, hasTouch: boolean, antes?: (api: ApiDoAluno) => void): Promise<Cena> {
  const api = await simularAluno(page)
  antes?.(api)
  const aluno = await criarAlunoComMatricula()
  const turma = await colocarAlunoNaTurma(aluno)
  const colega = await criarAlunoComMatricula({ escola: aluno })
  await colocarAlunoNaTurma(colega, turma)
  await entrarComoAluno(page, aluno, hasTouch)
  return { api, aluno, colega }
}

const principal = (page: Page) => page.getByRole('main')
const mapa = (page: Page) => principal(page).getByRole('navigation', { name: 'Questões' })
const alternativa = (page: Page, indice: number) => principal(page).locator(`[data-alternativa="${String(indice)}"]`)
const estadoDaResposta = (page: Page) => principal(page).locator('[data-resposta]')
/** O que o mapa das questões diz de cada uma, pelo nome de cada botão. */
const nomesNoMapa = (page: Page) => mapa(page).getByRole('button').evaluateAll((botoes) => botoes.map((botao) => botao.getAttribute('aria-label')))

/** Abre uma atividade pela lista, como o aluno faz. */
async function abrirAtividade(page: Page, titulo: string, hasTouch: boolean): Promise<void> {
  await acionar(principal(page).getByRole('link', { name: new RegExp(titulo) }), hasTouch)
  await expect(principal(page).getByRole('heading', { level: 1, name: titulo })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
}

test.describe('Atividades: os quatro estados', () => {
  test('carregando, vazia sem culpa, erro com "Tentar de novo" e a lista com o estado de cada atividade em texto, sem nada de colega', async ({ page, hasTouch }) => {
    test.slow()
    const segurada = portao()
    const { api, colega } = await entrar(page, hasTouch, (simulada) => {
      simulada.trocar('atividades', async (entrada) => {
        await segurada.aberta
        return simulada.responder('atividades', entrada)
      })
    })

    // Carregando: o texto, e nada de lista.
    await expect(principal(page).getByRole('status')).toHaveText('Carregando as suas atividades…')
    await expect(page).toHaveTitle('Atividades · Turmma')

    // Vazia: diz que não há o que fazer agora, sem cobrar nada.
    segurada.abrir()
    await expect(principal(page).getByText('Nada para fazer agora')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(principal(page)).toContainText('Quando a sua professora passar uma atividade para a turma, ela aparece aqui.')
    await expect(principal(page).getByRole('link')).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Erro: a tela diz o que fazer, sem código nem status.
    api.trocar('atividades', () => erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO'))
    await recarregar(page)
    await expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    for (const cru of ['503', 'INDISPONIVEL']) await expect(page.locator('body')).not.toContainText(cru)

    // Com dado: cada atividade com o estado em texto, e a avaliação avisada antes de abrir.
    api.atividades = [
      minhaAtividade({ titulo: 'Lista de estequiometria' }),
      minhaAtividade({ titulo: 'Prova de reagente limitante', avaliativa: true, situacao: 'em_andamento', respondidas: 1 }),
      minhaAtividade({ titulo: 'Lista de mol', situacao: 'enviada', respondidas: 3, enviadaEm: '2026-10-05T13:30:00.000Z' }),
      minhaAtividade({ titulo: 'Lista de balanceamento', situacao: 'encerrada', respondidas: 1 }),
      minhaAtividade({ titulo: 'Lista de massa molar', situacao: 'com_diagnostico', respondidas: 3, enviadaEm: '2026-10-04T13:30:00.000Z' }),
    ]
    api.trocar('atividades')
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    const paraResponder = principal(page).getByRole('region', { name: 'Para responder' })
    await expect(paraResponder.getByRole('link')).toHaveCount(2, { timeout: PRAZO_DA_TELA_MS })
    await expect(paraResponder.getByRole('link', { name: /Lista de estequiometria/ })).toContainText('Para responder')
    const prova = paraResponder.getByRole('link', { name: /Prova de reagente limitante/ })
    await expect(prova).toContainText('Você respondeu 1 de 3.')
    await expect(prova).toContainText(AVISO_DA_AVALIACAO)
    const feitas = principal(page).getByRole('region', { name: 'Já feitas' })
    await expect(feitas.getByRole('link', { name: /Lista de mol/ })).toContainText('Enviada')
    await expect(feitas.getByRole('link', { name: /Lista de mol/ })).toContainText(ESPERA_PELA_CORRECAO)
    await expect(feitas.getByRole('link', { name: /Lista de balanceamento/ })).toContainText('Encerrada')
    await expect(feitas.getByRole('link', { name: /Lista de massa molar/ })).toContainText('Com resultado')
    // Só a atividade com a correção aprovada fala de resultado.
    await expect(feitas.getByRole('link', { name: /Lista de mol/ })).not.toContainText(/resultado|acert/i)

    // Nada de colega, de nota nem de comparação, e nada que se mexa sozinho ou cobre (regra 50, item 9; D46; D59).
    await expect(page.locator('body')).not.toContainText(colega.nome)
    await expect(page.locator('body')).not.toContainText(PROIBIDO_NA_AREA)
    await expect(principal(page)).not.toContainText(/atrasad|faltam \d+ (dias|horas)|!/)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})

test.describe('a atividade aberta: uma questão por vez, e a resposta salva no servidor a cada escolha', () => {
  test('carregando, erro e a atividade que não existe; depois, cada escolha vira um PUT, a tela diz "Resposta salva" e o mapa diz quais já têm resposta', async ({ page, hasTouch }) => {
    test.slow()
    const atividade = minhaAtividade()
    const segurada = portao()
    const { api, colega } = await entrar(page, hasTouch, (simulada) => {
      simulada.atividades = [atividade]
      simulada.provas.set(atividade.id, provaDa(atividade))
      simulada.trocar('prova', async (entrada) => {
        await segurada.aberta
        return simulada.responder('prova', entrada)
      })
    })

    // Carregando.
    await acionar(principal(page).getByRole('link', { name: /Lista de estequiometria/ }), hasTouch)
    await expect(page).toHaveURL(new RegExp(`/aluno/atividades/${atividade.id}$`))
    await expect(principal(page).getByRole('status')).toHaveText('Carregando a atividade…', { timeout: PRAZO_DA_TELA_MS })

    // Com dado: uma questão por vez.
    segurada.abrir()
    await expect(principal(page).getByRole('heading', { level: 1, name: 'Lista de estequiometria' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page).toHaveTitle('Lista de estequiometria · Turmma')
    await expect(mapa(page)).toContainText('Questão 1 de 3')
    await expect(principal(page).getByRole('radio')).toHaveCount(4)
    await expect(principal(page)).toContainText('Qual é a massa molar da água')
    await expect(principal(page)).not.toContainText('reagente limitante')
    expect(await nomesNoMapa(page)).toEqual(['Questão 1, sem resposta', 'Questão 2, sem resposta', 'Questão 3, sem resposta'])
    await expect(estadoDaResposta(page)).toHaveText('')
    await expect(principal(page).getByRole('button', { name: 'Anterior' })).toBeDisabled()

    // A escolha vai ao servidor na hora, e só então a tela diz "Resposta salva".
    await acionar(alternativa(page, 1), hasTouch)
    await expect(estadoDaResposta(page)).toHaveText('Resposta salva', { timeout: PRAZO_DA_TELA_MS })
    await expect(principal(page).getByRole('radio', { name: /^B\./ })).toBeChecked()
    expect(api.pedidosEm(/\/respostas\/1$/)).toEqual([{ metodo: 'PUT', caminho: `/v1/atividades-aplicadas/${atividade.id}/respostas/1`, corpo: { alternativa: 1 } }])
    await expect(mapa(page).getByRole('button', { name: 'Questão 1, respondida' })).toHaveAttribute('aria-current', 'step')

    // Pelo teclado: o rádio nativo anda com as setas, e a troca também é salva.
    if (!hasTouch) {
      await principal(page).getByRole('radio', { name: /^B\./ }).focus()
      await page.keyboard.press('ArrowDown')
      await expect(principal(page).getByRole('radio', { name: /^C\./ })).toBeChecked()
      await expect.poll(() => api.provas.get(atividade.id)?.respostas).toEqual([{ questao: 1, alternativa: 2 }])
      await expect(estadoDaResposta(page)).toHaveText('Resposta salva', { timeout: PRAZO_DA_TELA_MS })
    }

    // "Próxima" leva à questão 2, e só ela aparece; "Anterior" volta, com a escolha salva marcada.
    await acionar(principal(page).getByRole('button', { name: 'Próxima' }), hasTouch)
    await expect(mapa(page)).toContainText('Questão 2 de 3')
    await expect(principal(page)).toContainText('quantos mols de amônia')
    await expect(principal(page)).not.toContainText('Qual é a massa molar da água')
    await expect(principal(page).getByRole('radio', { checked: true })).toHaveCount(0)
    await acionar(principal(page).getByRole('button', { name: 'Anterior' }), hasTouch)
    await expect(principal(page).getByRole('radio', { checked: true })).toHaveCount(1)
    // O mapa leva direto a qualquer questão.
    await acionar(mapa(page).getByRole('button', { name: 'Questão 3, sem resposta' }), hasTouch)
    await expect(mapa(page)).toContainText('Questão 3 de 3')
    await expect(principal(page).getByRole('button', { name: 'Próxima' })).toBeDisabled()

    // Atividade comum: o Tutor está a um toque, levando a atividade e a questão.
    await expect(principal(page).getByRole('link', { name: 'Pedir ajuda ao Tutor nesta questão' })).toHaveAttribute('href', `/aluno/tutor/${atividade.id}?questao=3`)
    await expect(principal(page)).not.toContainText(AVISO_DA_AVALIACAO)
    await expect(page.locator('body')).not.toContainText(colega.nome)
    await expect(page.locator('body')).not.toContainText(PROIBIDO_NA_AREA)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Erro ao abrir: "Tentar de novo". E a atividade que não é dele responde como a que não existe.
    api.trocar('prova', () => erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO'))
    await recarregar(page)
    await expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    api.trocar('prova')
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(mapa(page)).toContainText('Questão 1 de 3', { timeout: PRAZO_DA_TELA_MS })
    await irPara(page, '/aluno/atividades/0190f5a0-0000-7000-8000-00000000dead')
    await expect(principal(page).getByText('Esta atividade não está disponível')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(principal(page).getByRole('button', { name: 'Tentar de novo' })).toHaveCount(0)
  })

  test('a resposta que falha ao salvar continua marcada, a tela diz que não salvou, e ela é reenviada sozinha quando a rota volta', async ({ page, hasTouch }) => {
    test.slow()
    const atividade = minhaAtividade()
    const { api } = await entrar(page, hasTouch, (simulada) => {
      simulada.atividades = [atividade]
      simulada.provas.set(atividade.id, provaDa(atividade))
    })
    await abrirAtividade(page, 'Lista de estequiometria', hasTouch)

    // A rota cai: a escolha não é salva, e a tela não diz que foi.
    api.trocar('responder', () => erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO'))
    await acionar(alternativa(page, 3), hasTouch)
    await expect(estadoDaResposta(page)).toContainText('Não foi possível salvar agora.', { timeout: PRAZO_DA_TELA_MS })
    await expect(estadoDaResposta(page)).not.toContainText('Resposta salva')
    // A escolha não se perde: continua marcada, e o mapa diz que ainda não foi salva.
    await expect(principal(page).getByRole('radio', { name: /^D\./ })).toBeChecked()
    await expect(mapa(page).getByRole('button', { name: 'Questão 1, resposta ainda não salva' })).toBeVisible()
    expect(api.provas.get(atividade.id)?.respostas).toEqual([])
    for (const cru of ['503', 'INDISPONIVEL']) await expect(page.locator('body')).not.toContainText(cru)

    // Com resposta não salva, o envio é segurado, e o diálogo diz por quê.
    await acionar(principal(page).getByRole('button', { name: 'Enviar a atividade' }), hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Enviar a atividade?' })
    await expect(dialogo).toContainText('Uma resposta ainda não foi salva.')
    await expect(dialogo.getByRole('button', { name: 'Enviar a atividade' })).toBeDisabled()
    await acionar(dialogo.getByRole('button', { name: 'Continuar respondendo' }), hasTouch)
    expect(api.pedidosEm(/\/enviar$/)).toEqual([])

    // A rota volta: sem o aluno fazer nada, a mesma escolha é mandada de novo e passa a constar como salva.
    api.trocar('responder')
    await expect(estadoDaResposta(page)).toHaveText('Resposta salva', { timeout: PRAZO_DO_REENVIO_MS })
    expect(api.provas.get(atividade.id)?.respostas).toEqual([{ questao: 1, alternativa: 3 }])
    const envios = api.pedidosEm(/\/respostas\/1$/)
    expect(envios.length).toBeGreaterThanOrEqual(2)
    for (const envio of envios) expect(envio.corpo).toEqual({ alternativa: 3 })
    await expect(mapa(page).getByRole('button', { name: 'Questão 1, respondida' })).toBeVisible()
    await expect(principal(page).getByRole('radio', { name: /^D\./ })).toBeChecked()
  })

  test('enviar pede confirmação dizendo quantas ficaram em branco; depois de enviar nada muda, e o resultado só aparece depois de a professora aprovar', async ({ page, hasTouch }) => {
    test.slow()
    const atividade = minhaAtividade({ situacao: 'em_andamento', respondidas: 2 })
    const { api, colega } = await entrar(page, hasTouch, (simulada) => {
      simulada.atividades = [atividade]
      simulada.provas.set(atividade.id, provaDa(atividade, { respostas: [{ questao: 1, alternativa: 1 }, { questao: 2, alternativa: 0 }] }))
    })
    await abrirAtividade(page, 'Lista de estequiometria', hasTouch)
    // Quem volta continua de onde parou: as respostas salvas vêm marcadas.
    await expect(principal(page).getByRole('radio', { name: /^B\./ })).toBeChecked()
    expect(await nomesNoMapa(page)).toEqual(['Questão 1, respondida', 'Questão 2, respondida', 'Questão 3, sem resposta'])

    // A confirmação mostra o que vai acontecer, e cancelar não manda nada.
    await acionar(principal(page).getByRole('button', { name: 'Enviar a atividade' }), hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Enviar a atividade?' })
    await expect(dialogo).toContainText('Lista de estequiometria')
    await expect(dialogo).toContainText('2 de 3 questões')
    await expect(dialogo).toContainText('1 questão em branco')
    await expect(dialogo).toContainText('Depois de enviar, não dá para mudar as respostas.')
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(dialogo.getByRole('button', { name: 'Continuar respondendo' }), hasTouch)
    await expect(dialogo).toBeHidden()
    expect(api.pedidosEm(/\/enviar$/)).toEqual([])

    // Confirmar manda uma vez só, mesmo com o toque repetido enquanto a resposta não chega.
    const segurado = portao()
    api.trocar('enviar', async (entrada) => {
      await segurado.aberta
      return api.responder('enviar', entrada)
    })
    await acionar(principal(page).getByRole('button', { name: 'Enviar a atividade' }), hasTouch)
    await acionar(dialogo.getByRole('button', { name: 'Enviar a atividade' }), hasTouch)
    await expect(dialogo.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
    segurado.abrir()
    await expect(principal(page).getByRole('heading', { name: 'Atividade enviada' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    expect(api.pedidosEm(/\/enviar$/)).toEqual([{ metodo: 'POST', caminho: `/v1/atividades-aplicadas/${atividade.id}/enviar`, corpo: {} }])

    // Enviada: a tela não deixa mudar, e do resultado só diz que a professora ainda vai revisar.
    await expect(principal(page).getByRole('radio')).toHaveCount(0)
    await expect(principal(page).getByRole('button', { name: 'Enviar a atividade' })).toHaveCount(0)
    await expect(principal(page)).toContainText('Você respondeu 2 de 3 questões. Não dá mais para mudar as respostas.')
    await expect(principal(page).locator('[data-resultado="aguardando"]')).toContainText(ESPERA_PELA_CORRECAO, { timeout: PRAZO_DA_TELA_MS })
    await expect(principal(page)).not.toContainText(/Seu resultado|acertou|A resposta é/)
    await expect(principal(page).getByRole('alert')).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A professora aprova a correção: o diagnóstico aparece, por habilidade, com quem aprovou e o selo de IA.
    api.diagnosticos.set(atividade.id, diagnosticoDa(atividade))
    await recarregar(page)
    const resultado = principal(page).getByRole('region', { name: 'Seu resultado' })
    await expect(resultado).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(resultado).toContainText('Você acertou 2 de 3 questões.')
    await expect(resultado).toContainText(`Correção aprovada por ${QUEM_APROVA}`)
    await expect(resultado.locator('[data-selo-ia]')).toHaveCount(1)
    const porHabilidade = resultado.getByRole('region', { name: 'Acertos por habilidade' })
    await expect(porHabilidade).toContainText('Calcular a massa molar de uma substância')
    await expect(porHabilidade).toContainText('1 de 2 questões')
    await expect(resultado.locator('[data-questao-corrigida="certa"]')).toHaveCount(2)
    await expect(resultado.locator('[data-questao-corrigida="outra"]')).toContainText('A resposta é: C. 4 mol')
    await expect(resultado.getByRole('button', { name: 'Fonte: Material da escola, p. 3' })).toHaveCount(1)

    // Diagnóstico, e não nota: sem nota, conceito, percentual nem comparação com ninguém.
    await expect(page.locator('body')).not.toContainText(PROIBIDO_NA_AREA)
    await expect(principal(page)).not.toContainText('%')
    await expect(page.locator('body')).not.toContainText(colega.nome)
    await expect(principal(page).locator('[data-resultado="aguardando"]')).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('a avaliação avisa que o Tutor fica pausado e não oferece o caminho até ele; a que a professora encerra para de receber resposta', async ({ page, hasTouch }) => {
    test.slow()
    const avaliacao = minhaAtividade({ titulo: 'Prova de estequiometria', avaliativa: true })
    const { api } = await entrar(page, hasTouch, (simulada) => {
      simulada.atividades = [avaliacao]
      simulada.provas.set(avaliacao.id, provaDa(avaliacao))
    })
    await abrirAtividade(page, 'Prova de estequiometria', hasTouch)
    await expect(principal(page).getByRole('note')).toHaveText(AVISO_DA_AVALIACAO)
    await expect(principal(page).getByRole('link', { name: /Tutor/ })).toHaveCount(0)

    // A professora encerra enquanto o aluno responde: a escolha seguinte é recusada, e a tela passa a dizer o que houve.
    const prova = api.provas.get(avaliacao.id)
    if (prova === undefined) throw new Error('prova sintética não criada')
    api.provas.set(avaliacao.id, { ...prova, estado: 'encerrada' })
    await acionar(alternativa(page, 0), hasTouch)
    await expect(principal(page).getByRole('heading', { name: 'A professora encerrou esta atividade' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(principal(page).getByRole('radio')).toHaveCount(0)
    // A escolha que não chegou a ser salva é dita, em vez de sumir em silêncio.
    await expect(principal(page).getByRole('alert')).toHaveText('A atividade foi encerrada antes de a resposta da questão 1 ser salva. Se isso fizer diferença, avise a professora.')
    await expect(principal(page)).toContainText('Você respondeu 0 de 3 questões.')
    await expect(principal(page).locator('[data-resultado="aguardando"]')).toContainText(ESPERA_PELA_CORRECAO, { timeout: PRAZO_DA_TELA_MS })
    await expect(page.locator('body')).not.toContainText(PROIBIDO_NA_AREA)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
