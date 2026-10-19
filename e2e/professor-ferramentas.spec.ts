import { ROTULOS_DA_ADAPTACAO, TIPOS_DE_ADAPTACAO } from '../packages/shared/src/assistente/conteudo.ts'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { atividadeSintetica, erroDaApi, portao, versaoAdaptada } from './__fixtures__/assistente.ts'
import { irPelaNavegacao, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { caixa } from './__fixtures__/fluxo-do-professor.ts'
import { acionar, entrar, irPara, PRAZO_DA_TELA_MS, recarregar, selosDeIA } from './__fixtures__/professor/cena.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'
import { expect, test } from './__fixtures__/perfis.ts'

/**
 * As ferramentas (D74) e o formulário (A2, pacote W). Separado de `professor-assistente.spec.ts` pela 2.5.
 */

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
    await expect(pronto.getByRole('link', { name: 'Ver e decidir' })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // O atalho da Adaptação, no Início, abre o cartão dela, e o que estava escrito na caixa não vai junto.
    await irPara(page, '/professor/nova-conversa')
    await caixa(page).fill('prova adaptada para um aluno com laudo')
    await acionar(page.getByRole('group', { name: 'Atalhos de ferramenta' }).getByRole('button', { name: /^Adaptação/ }), hasTouch)
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
