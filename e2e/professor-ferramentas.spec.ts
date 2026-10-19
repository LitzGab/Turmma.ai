import { ROTULOS_DA_ADAPTACAO, TIPOS_DE_ADAPTACAO } from '../packages/shared/src/assistente/conteudo.ts'
import { atividadeSintetica, erroDaApi, simularAssistente, versaoAdaptada } from './__fixtures__/assistente.ts'
import { caixa } from './__fixtures__/fluxo-do-professor.ts'
import { entrarPelaApi, entrarPorEmail, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { entrarEmCriados } from './__fixtures__/professor/criados.ts'
import { acionar, entrar, irPara, PRAZO_DA_TELA_MS, recarregar, selosDeIA } from './__fixtures__/professor/cena.ts'
import { carregarSemRedeLenta, expect, test } from './__fixtures__/perfis.ts'
import { confirmarVinculosNoBanco, criarAlocacaoDoProfessor, criarEquipeComSenha } from './__fixtures__/sessao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As ferramentas (D74) e o formulário (A2, pacote W). Separado de `professor-assistente.spec.ts` pela 2.5.
 */

test.describe('Ferramentas (D74) e o formulário', () => {
  test('o catálogo tem só as três ferramentas que existem, uma seção por categoria da D74, sem a lista do que foi gerado, que mora em Criados', async ({ page }) => {
    // Abre Ferramentas direto, pela API, com um documento já gerado: o login pela tela leva a maior parte dos 15 s do portão.
    await entrarEmCriados(page, {
      endereco: '/professor/ferramentas',
      antes: ({ api, turmaId, disciplinaId }) => {
        api.artefatos = [atividadeSintetica(turmaId, disciplinaId)]
      },
    })
    await expect(page).toHaveTitle('Ferramentas · Turmma', { timeout: PRAZO_DA_TELA_MS })
    const principal = page.getByRole('main')
    await expect(principal.getByRole('heading', { level: 1 })).toHaveText('Ferramentas')
    await expect(principal.getByRole('heading', { level: 2 })).toHaveText(['Planejar', 'Preparar a aula', 'Avaliar'])
    await expect(page.locator('[data-ferramenta]')).toHaveCount(3)
    for (const fora of ['Prova', 'Apresentação', 'Simulado', 'Redação', 'Mapa mental', 'Corrigir', 'Também dá para só pedir', 'Que prova corrigir?']) {
      await expect(principal.getByText(fora, { exact: true })).toHaveCount(0)
    }
    await expect(principal.getByText(/em breve/i)).toHaveCount(0)
    // O que a professora já gerou saiu daqui (telas do professor, 5.0): nem o título da seção, nem o item.
    await expect(page.getByText('O que você já gerou')).toHaveCount(0)
    await expect(page.locator('[data-artefato]')).toHaveCount(0)

    // O cartão: o alvo é o link inteiro, o nome acessível é o da ferramenta e o ícone é decoração de 48 px.
    for (const [ferramenta, nome] of [
      ['plano_de_aula', 'Plano de aula'],
      ['adaptacao', 'Adaptação'],
      ['atividade_objetiva', 'Atividade objetiva'],
    ] as const) {
      const cartao = page.locator(`[data-ferramenta="${ferramenta}"]`)
      const link = cartao.getByRole('link')
      await expect(link).toHaveAttribute('href', `/professor/ferramentas/${ferramenta}`)
      await expect(link).toHaveAccessibleName(new RegExp(`^${nome}`))
      const icone = link.locator(`svg[data-icone-de-ferramenta="${ferramenta}"]`)
      await expect(icone).toHaveAttribute('aria-hidden', 'true')
      const caixaDoIcone = await icone.boundingBox()
      expect([caixaDoIcone?.width, caixaDoIcone?.height]).toEqual([48, 48])
      // 108 px de altura no mínimo, e o alvo de toque principal é a linha inteira.
      const caixaDoCartao = await cartao.boundingBox()
      expect(caixaDoCartao?.height ?? 0, `${nome}: altura do cartão`).toBeGreaterThanOrEqual(108)
      const caixaDoLink = await link.boundingBox()
      expect(caixaDoLink?.height ?? 0, `${nome}: alvo de toque`).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
      expect(caixaDoLink?.width ?? 0, `${nome}: o link ocupa o cartão`).toBeGreaterThanOrEqual((caixaDoCartao?.width ?? 0) - 4)
    }

    // As colunas da grade: 3 a partir de 1280 px, 2 a partir de 768, 1 abaixo. O projeto mede a dele (1366 → 3, 360 → 1) e, em
    // seguida, a 800 px nos dois, que é a única largura em que as duas colunas existem.
    const colunasDaGrade = () => page.locator('[data-ferramenta]').first().locator('xpath=..').evaluate((lista) => getComputedStyle(lista).gridTemplateColumns.split(' ').length)
    const largura = page.viewportSize()?.width ?? 0
    expect(await colunasDaGrade()).toBe(largura >= 1280 ? 3 : largura >= 768 ? 2 : 1)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await page.setViewportSize({ width: 800, height: 900 })
    await expect.poll(colunasDaGrade).toBe(2)
    expect(await larguraExcedente(page)).toBe(0)
  })

  test('cada cartão abre o formulário da ferramenta dele, e "Voltar para Ferramentas" traz de volta ao catálogo', async ({ page, hasTouch }) => {
    await entrarEmCriados(page, { endereco: '/professor/ferramentas' })
    const principal = page.getByRole('main')
    await expect(page.locator('[data-ferramenta]')).toHaveCount(3, { timeout: PRAZO_DA_TELA_MS })
    for (const [ferramenta, nome] of [
      ['plano_de_aula', 'Plano de aula'],
      ['adaptacao', 'Adaptação'],
      ['atividade_objetiva', 'Atividade objetiva'],
    ] as const) {
      await acionar(page.locator(`[data-ferramenta="${ferramenta}"]`).getByRole('link'), hasTouch)
      await expect(page).toHaveURL(new RegExp(`/professor/ferramentas/${ferramenta}$`), { timeout: PRAZO_DA_TELA_MS })
      await expect(principal.getByRole('heading', { level: 1, name: nome })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
      await acionar(page.getByRole('link', { name: 'Voltar para Ferramentas' }), hasTouch)
      await expect(page).toHaveURL(/\/professor\/ferramentas$/, { timeout: PRAZO_DA_TELA_MS })
      await expect(principal.getByRole('heading', { level: 1, name: 'Ferramentas' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    }
  })

  test('a função suspensa tem o selo no cartão e a frase da suspensão, e os três cartões seguem abertos', async ({ page }) => {
    await entrarEmCriados(page, {
      endereco: '/professor/ferramentas',
      antes: ({ api }) => {
        api.suspensas.add('adaptacao')
      },
    })
    const selo = (ferramenta: string) => page.locator(`[data-ferramenta="${ferramenta}"]`).getByText('Suspensa pela coordenação')
    await expect(selo('adaptacao')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(selo('plano_de_aula')).toHaveCount(0)
    await expect(selo('atividade_objetiva')).toHaveCount(0)
    await expect(page.getByRole('main').getByRole('note')).toContainText('A coordenação suspendeu a Adaptação nesta escola.')
    // Suspensa, o cartão continua um link que abre o formulário: quem explica o resto é o formulário.
    await expect(page.locator('[data-ferramenta]').getByRole('link')).toHaveCount(3)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('a leitura do time que falha não tira cartão: o aviso diz que não foi possível conferir, e "Tentar de novo" lê outra vez e põe o selo', async ({ page, hasTouch }) => {
    const { api } = await entrarEmCriados(page, {
      endereco: '/professor/ferramentas',
      antes: ({ api: simulada }) => {
        simulada.trocar('time', () => erroDaApi(404, 'NAO_ENCONTRADO'))
      },
    })
    await expect(page.getByText('Não foi possível conferir se alguma ferramenta está suspensa')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.locator('[data-ferramenta]').getByRole('link')).toHaveCount(3)
    await expect(page.getByText('Suspensa pela coordenação')).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    api.suspensas.add('adaptacao')
    api.trocar('time')
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(page.locator('[data-ferramenta="adaptacao"]').getByText('Suspensa pela coordenação')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Não foi possível conferir')).toHaveCount(0)
    await expect(page.locator('[data-ferramenta]').getByRole('link')).toHaveCount(3)

    // A ferramenta que não existe não tem formulário: o endereço responde como página não encontrada.
    await irPara(page, '/professor/ferramentas/prova')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
  })

  test('recomeço: a professora seguinte entra na mesma aba, sem recarregar, e vê o catálogo e o selo conforme a escola dela, não o da anterior', async ({ page, hasTouch }) => {
    const api = await simularAssistente(page)
    api.suspensas.add('adaptacao')
    const primeira = await criarEquipeComSenha()
    const alocacao = await criarAlocacaoDoProfessor(primeira.escolaId, primeira.usuarioId, ['Química'])
    await confirmarVinculosNoBanco(primeira.escolaId, alocacao.vinculoIds)
    // A segunda é de outra escola e ainda não tem turma confirmada.
    const segunda = await criarEquipeComSenha()
    await carregarSemRedeLenta(page, async () => {
      await entrarPelaApi(page, primeira, '/professor/ferramentas')
      await expect(page.locator('[data-ferramenta="adaptacao"]').getByText('Suspensa pela coordenação')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    })
    await expect(page.getByText('Falta uma turma confirmada')).toHaveCount(0)

    if (hasTouch) await page.getByRole('button', { name: 'Sair' }).tap()
    else await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    api.suspensas.clear()
    // Pela tela, sem recarregar: a recarga apagaria o cache, e o cache é o que este caso quer ver esvaziado.
    await entrarPorEmail(page, segunda, hasTouch)
    await expect(page).toHaveURL(/\/professor\/nova-conversa$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await irPara(page, '/professor/ferramentas')
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Ferramentas' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Falta uma turma confirmada')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.locator('[data-ferramenta]')).toHaveCount(3)
    await expect(page.getByText('Suspensa pela coordenação')).toHaveCount(0)
    await expect(page.locator('[data-funcao-suspensa]')).toHaveCount(0)
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
