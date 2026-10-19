import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { atividadeSintetica, erroDaApi, portao, QUEM_DECIDE, resumoDoArtefato, TITULO_DO_MATERIAL, versaoAdaptada } from './__fixtures__/assistente.ts'
import { acionar, entrar, irPara, PRAZO_DA_TELA_MS, recarregar, selosDeIA } from './__fixtures__/professor/cena.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'
import { expect, test } from './__fixtures__/perfis.ts'

/**
 * O artefato (A2, pacote W). Separado de `professor-assistente.spec.ts` pela 2.5.
 */

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
    // A pendente leva a decidir pelo sino, na tela do Assistente, e nenhum texto diz "Seu time".
    await expect(page.getByRole('link', { name: 'Ver e decidir' })).toHaveAttribute('href', '/professor/time/assistente')
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Renomear' })).toBeVisible()
    await acionar(page.getByRole('link', { name: 'Abrir a atividade de origem' }), hasTouch)

    // A rejeitada não sai em PDF, e a tela diz por quê; decidida, também não muda de nome.
    await acionar(versoes.getByRole('link').nth(2), hasTouch)
    await expect(page.locator('[data-aprovacao="rejeitada"]')).toContainText(`${QUEM_DECIDE.nome} rejeitou`, { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('button', { name: /Exportar/ })).toHaveCount(0)
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
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
    // Sem a leitura das entregas da turma, a decisão só é afirmada com quem decidiu: a tela diz onde ver, pelo sino.
    api.entregas = []
    await recarregar(page)
    await expect(page.getByText('A decisão desta versão está em “O que o Assistente fez”, pelo sino.')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText(/Seu time/)).toHaveCount(0)

    // "Pedir versão adaptada", na atividade, abre a Adaptação já com ela escolhida.
    await acionar(page.getByRole('link', { name: 'Abrir a atividade de origem' }), hasTouch)
    await acionar(page.getByRole('button', { name: 'Pedir versão adaptada' }), hasTouch)
    await expect(page).toHaveURL(new RegExp(`/professor/ferramentas/adaptacao\\?origem=${origem.id}$`))
    await expect(page.locator('[data-motor="formulario"]').getByLabel('Atividade de origem')).toHaveValue(origem.id, { timeout: PRAZO_DA_TELA_MS })
  })
})
