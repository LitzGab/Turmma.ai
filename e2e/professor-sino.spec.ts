import { randomUUID } from 'node:crypto'
import type { BrowserContextOptions, Browser, Locator, Page } from '@playwright/test'
import { abrirAbaAlunos, abrirNavegacao, entrarComoCoordenacaoNaMesmaAba, entrarPorEmail, escolherNoSeletor, esperarNovaConversa, esperarPainel, lateral, nomeNoSeletor, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { mensagemDela } from './__fixtures__/assistente.ts'
import { cacheDeConsultas, semAcessosDaConta } from './__fixtures__/consultas.ts'
import { caixa as caixaDoPedido } from './__fixtures__/fluxo-do-professor.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { irPara } from './__fixtures__/professor/cena.ts'
import { entrarNaCena, esperarSino, listaDoSino, peDoSino, portao, prepararCena, semAnimacao, sinoDe, TITULO_DA_CORRECAO, TITULO_DA_VERSAO } from './__fixtures__/professor/sino.ts'
import { confirmarVinculosNoBanco, criarAlocacaoDoProfessor, criarCoordenadoraNaEscola, criarProfessoraNaEscola, criarUsuarioEmOutraEscola } from './__fixtures__/sessao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * O sino "Esperando você" da professora (telas do professor, 1.0; RF3 a RF5), pela tela, nos projetos `chromebook` e
 * `celular`: um item de cada tipo e o destino de cada um, a decisão que tira o item, a entrega decidida em outra aba, a
 * coordenação que entra na mesma aba depois dela, o recomeço na troca de escola e os 360 px. A sessão, os vínculos e os pedidos
 * são os de verdade; as entregas e a correção, as da API simulada do Assistente. Nomes e e-mails inventados pelo teste.
 */

const PRAZO_DA_TELA_MS = 15_000
const contextos: Array<{ close: () => Promise<void> }> = []

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

/** Outro navegador, com as mesmas condições do projeto: é a outra aba da mesma professora. */
async function outroNavegador(browser: Browser): Promise<Page> {
  const uso = test.info().project.use
  const opcoes: BrowserContextOptions = {}
  if (uso.baseURL !== undefined) opcoes.baseURL = uso.baseURL
  if (uso.viewport !== undefined) opcoes.viewport = uso.viewport
  if (uso.isMobile !== undefined) opcoes.isMobile = uso.isMobile
  if (uso.hasTouch !== undefined) opcoes.hasTouch = uso.hasTouch
  if (uso.userAgent !== undefined) opcoes.userAgent = uso.userAgent
  if (uso.deviceScaleFactor !== undefined) opcoes.deviceScaleFactor = uso.deviceScaleFactor
  if (uso.locale !== undefined) opcoes.locale = uso.locale
  if (uso.timezoneId !== undefined) opcoes.timezoneId = uso.timezoneId
  const contexto = await browser.newContext(opcoes)
  contextos.push(contexto)
  return contexto.newPage()
}

test.afterEach(async () => {
  for (const contexto of contextos.splice(0)) await contexto.close()
})

const pathDe = (url: string): string => new URL(url).pathname
const literal = (texto: string): string => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test.describe('do sino à tela', () => {
  test('um item de cada tipo: o sino conta 4, cada item leva à tela dele, o contador não se mexe e decidir os pedidos tira o item', async ({ page, hasTouch }) => {
    test.slow()
    const cena = await prepararCena(page)
    await entrarNaCena(page, cena, hasTouch)

    const sino = await esperarSino(page, 'Esperando você, 4')
    const caixa = await sino.boundingBox()
    expect(caixa?.height ?? 0, 'alvo do sino').toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    expect(caixa?.width ?? 0, 'alvo do sino').toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    await semAnimacao(sino)

    // A lista agrupa por turma, com o item de cada tipo e o texto do trabalho (nunca o nome de aluno).
    await acionar(sino, hasTouch)
    const lista = listaDoSino(page)
    await expect(lista).toBeVisible()
    await expect(lista.getByRole('region', { name: cena.turmaA.turmaNome })).toBeVisible()
    await expect(lista.getByRole('region', { name: cena.turmaB.turmaNome })).toBeVisible()
    await expect(lista.getByRole('link', { name: new RegExp(`Correção para revisar.*${TITULO_DA_CORRECAO}`) })).toBeVisible()
    await expect(lista.getByRole('link', { name: new RegExp(`Versão adaptada para decidir.*${literal(TITULO_DA_VERSAO)}`) })).toBeVisible()
    await expect(lista.getByRole('link', { name: /Pedidos de nome para decidir.*2 pedidos esperando a decisão/ })).toBeVisible()
    await expect(lista.getByRole('link', { name: /Confirme sua turma.*Física/ })).toBeVisible()
    // O pé: as duas telas do que a IA fez, depois da fila e fora da conta do número.
    await expect(peDoSino(page).getByRole('link')).toHaveText([/O que o Assistente fez/, /O que o Tutor viu/])
    await expect(lista).not.toContainText('Sintética do sino')
    await expect(lista).not.toContainText('Sintético do sino')
    await semAnimacao(lista)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Os quatro destinos. Cada clique fecha a lista e leva à tela do item.
    const destinos: ReadonlyArray<readonly [RegExp, RegExp]> = [
      [/Correção para revisar/, new RegExp(`/professor/aprovar/${cena.atividadeAplicadaId}$`)],
      [/Versão adaptada para decidir/, /\/professor\/time\/assistente$/],
      [/Pedidos de nome para decidir/, new RegExp(`/professor/turmas/${cena.turmaA.turmaId}(\\?aba=alunos)?$`)],
      [/Confirme sua turma/, /\/professor\/turmas$/],
    ]
    await page.keyboard.press('Escape')
    await expect(lista).toHaveCount(0)
    await expect(sino).toBeFocused()
    for (const [item, endereco] of destinos) {
      await acionar(sino, hasTouch)
      await acionar(listaDoSino(page).getByRole('link', { name: item }), hasTouch)
      await expect(page).toHaveURL(endereco, { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(listaDoSino(page)).toHaveCount(0)
    }

    // Decidir os dois pedidos na turma tira o item do sino, sem recarregar.
    await page.evaluate((destino) => {
      window.history.pushState(null, '', destino)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, `/professor/turmas/${cena.turmaA.turmaId}`)
    await abrirAbaAlunos(page, hasTouch)
    const secao = page.getByRole('main').getByRole('region', { name: 'Pedidos de nome' })
    for (const pedido of cena.pedidos) await acionar(secao.getByRole('checkbox', { name: new RegExp(pedido.nome) }), hasTouch)
    await acionar(secao.getByRole('button', { name: 'Recusar 2 pedidos' }), hasTouch)
    const dialogo = page.getByRole('dialog', { name: 'Recusar pedidos' })
    await expect(dialogo).toBeVisible()
    await acionar(dialogo.getByRole('button', { name: 'Recusar 2 pedidos' }), hasTouch)
    await expect(dialogo.getByRole('list', { name: 'Resultado de cada pedido' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await acionar(dialogo.getByRole('button', { name: 'Fechar' }), hasTouch)
    await esperarSino(page, 'Esperando você, 3')
    await acionar(sino, hasTouch)
    await expect(listaDoSino(page).getByRole('link', { name: /Pedidos de nome para decidir/ })).toHaveCount(0)
    // Os três itens que restam e os dois links do pé, que a fila não gasta.
    await expect(listaDoSino(page).getByRole('link')).toHaveCount(3 + 2)
    await expect(peDoSino(page).getByRole('link')).toHaveCount(2)
  })

  test('entrega decidida em outra aba: o item segue no sino até a tentativa, a tela diz que já estava decidida, e o item sai sem recarregar', async ({ page, browser, hasTouch }) => {
    test.slow()
    const cena = await prepararCena(page)
    await entrarNaCena(page, cena, hasTouch)
    const sino = await esperarSino(page, 'Esperando você, 4')
    await page.evaluate(() => {
      ;(window as unknown as { __semRecarga: boolean }).__semRecarga = true
    })

    // A: a tela do Assistente com a versão adaptada esperando.
    await acionar(sino, hasTouch)
    await acionar(listaDoSino(page).getByRole('link', { name: /Versão adaptada para decidir/ }), hasTouch)
    await expect(page).toHaveURL(/\/professor\/time\/assistente$/, { timeout: PRAZO_DA_ENTRADA_MS })
    const pendente = page.locator('[data-entrega="pendente"]').filter({ hasText: TITULO_DA_VERSAO })
    await expect(pendente).toBeVisible({ timeout: PRAZO_DA_TELA_MS })

    // B: a mesma professora, em outra aba, decide a mesma entrega.
    const outra = await outroNavegador(browser)
    await cena.api.ligar(outra)
    await outra.goto('/entrar')
    await entrarPorEmail(outra, cena.professora, hasTouch)
    await esperarNovaConversa(outra, cena.professora.nome)
    await outra.evaluate(() => {
      window.history.pushState(null, '', '/professor/time/assistente')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    const pendenteEmB = outra.locator('[data-entrega="pendente"]').filter({ hasText: TITULO_DA_VERSAO })
    await expect(pendenteEmB).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await acionar(pendenteEmB.getByRole('button', { name: /^Aprovar/ }), hasTouch)
    const dialogoDeB = outra.getByRole('alertdialog', { name: 'Aprovar a versão adaptada' })
    await acionar(dialogoDeB.getByRole('button', { name: 'Aprovar a versão adaptada' }), hasTouch)
    await expect(dialogoDeB).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    expect(cena.api.entregas.find((entrega) => entrega.id === cena.entregaDaVersao)?.estado).toBe('aprovada')

    // A não leu nada de novo: o item segue no sino, com o dado de antes.
    await expect(sino).toHaveAccessibleName('Esperando você, 4')
    await acionar(sino, hasTouch)
    await expect(listaDoSino(page).getByRole('link', { name: /Versão adaptada para decidir/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(listaDoSino(page)).toHaveCount(0)

    // A tenta decidir: a tela diz que já estava decidida, e o item sai do sino, na mesma página.
    await acionar(pendente.getByRole('button', { name: /^Aprovar/ }), hasTouch)
    const dialogo = page.getByRole('alertdialog', { name: 'Aprovar a versão adaptada' })
    await acionar(dialogo.getByRole('button', { name: 'Aprovar a versão adaptada' }), hasTouch)
    await expect(dialogo).toBeHidden({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('main').getByRole('status').filter({ hasText: 'já tinha sido decidida' })).toBeVisible()
    await expect(page.getByRole('main')).not.toContainText('ENTREGA_JA_DECIDIDA')
    await esperarSino(page, 'Esperando você, 3')
    await acionar(sino, hasTouch)
    await expect(listaDoSino(page).getByRole('link', { name: /Versão adaptada para decidir/ })).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __semRecarga?: boolean }).__semRecarga)).toBe(true)
  })

  test('permissão: a coordenação que entra na mesma aba depois da professora não chama entregas, vínculos nem pedidos, e não vê os itens dela', async ({ page, hasTouch }) => {
    test.slow()
    const cena = await prepararCena(page)
    await entrarNaCena(page, cena, hasTouch)
    await esperarSino(page, 'Esperando você, 4')

    // A professora sai com a lista aberta, e a coordenação da mesma escola entra na mesma aba, sem recarregar.
    await abrirNavegacao(page, hasTouch)
    await acionar(lateral(page).getByRole('button', { name: 'Sair' }), hasTouch)
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    const coordenadora = await criarCoordenadoraNaEscola(cena.professora)
    const caminhos: string[] = []
    page.on('request', (pedido) => caminhos.push(pathDe(pedido.url())))
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await esperarPainel(page)

    const sino = sinoDe(page)
    await expect(sino).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(sino).not.toHaveAccessibleName('Esperando você, 4')
    await acionar(sino, hasTouch)
    await expect(listaDoSino(page)).toBeVisible()
    for (const daProfessora of [/Correção para revisar/, /Versão adaptada para decidir/, /Pedidos de nome para decidir/, /Confirme sua turma/]) await expect(listaDoSino(page).getByRole('link', { name: daProfessora })).toHaveCount(0)
    // Tempo para uma leitura da fila da professora sair, se saísse.
    await page.waitForTimeout(1_500)
    expect(caminhos.filter((caminho) => caminho === '/v1/entregas' || caminho === '/v1/meus-vinculos' || caminho.endsWith('/reivindicacoes'))).toEqual([])
    expect(caminhos.length).toBeGreaterThan(0)
  })

  test('recomeço: a troca de escola não deixa itens nem número da anterior, e a contagem que chega atrasada não entra', async ({ page, hasTouch }) => {
    test.slow()
    const cena = await prepararCena(page)
    const emB = await criarUsuarioEmOutraEscola(cena.professora.contaId)
    const deB = await criarAlocacaoDoProfessor(emB.escolaId, emB.usuarioId, ['História'])
    await confirmarVinculosNoBanco(emB.escolaId, deB.vinculoIds)

    // A contagem de pedidos da turma A, depois do primeiro "Atualizar", fica no ar até o teste abrir.
    const segura = portao()
    let segurar = false
    await page.route(new RegExp(`/v1/turmas/${cena.turmaA.turmaId}/reivindicacoes`), async (rota) => {
      if (segurar) await segura.aberta
      await rota.continue().catch(() => undefined)
    })

    await page.goto('/entrar')
    await entrarPorEmail(page, cena.professora, hasTouch)
    await acionar(page.getByRole('button', { name: `${cena.professora.escolaNome} · professor` }), hasTouch)
    await esperarNovaConversa(page, cena.professora.nome)
    const sino = await esperarSino(page, 'Esperando você, 4')

    // "Atualizar" reabre a leitura; a dos pedidos da turma A fica no ar enquanto a professora troca de escola.
    await acionar(sino, hasTouch)
    segurar = true
    await acionar(listaDoSino(page).getByRole('button', { name: 'Atualizar' }), hasTouch)
    await page.keyboard.press('Escape')
    // Na escola B não há entrega, e a turma dela não tem pedido.
    cena.api.entregas = []
    await escolherNoSeletor(page, nomeNoSeletor(emB, 'professor'), hasTouch)
    await esperarNovaConversa(page, 'Professora sintética na outra escola')
    await esperarSino(page, 'Esperando você, nada')

    // A resposta atrasada de A chega agora: nada dela entra no sino de B.
    segurar = false
    segura.abrir()
    await page.waitForTimeout(1_500)
    await expect(sinoDe(page)).toHaveAccessibleName('Esperando você, nada')
    await acionar(sinoDe(page), hasTouch)
    await expect(listaDoSino(page).getByText('Tudo em dia')).toBeVisible()
    // Sem nada esperando, só o pé tem link.
    await expect(listaDoSino(page).getByRole('link')).toHaveCount(2)
    await expect(peDoSino(page).getByRole('link')).toHaveCount(2)
    await expect(page.locator('body')).not.toContainText(cena.turmaA.turmaNome)
    const cache = semAcessosDaConta(await cacheDeConsultas(page))
    for (const deA of [cena.professora.escolaId, cena.professora.usuarioId, cena.turmaA.turmaId, cena.turmaA.turmaNome, cena.turmaB.turmaNome, ...cena.turmaA.vinculoIds, ...cena.turmaB.vinculoIds]) expect(cache).not.toContain(deA)
  })

  test('recomeço: a segunda professora da mesma escola, na mesma aba, não herda o sino, as turmas nem as contagens da anterior', async ({ page, hasTouch }) => {
    test.slow()
    const cena = await prepararCena(page)
    await entrarNaCena(page, cena, hasTouch)
    await esperarSino(page, 'Esperando você, 4')
    // A primeira deixa também uma conversa lida e um cartão aberto na conversa (telas do professor, 4.0): a segunda, na mesma
    // aba, não encontra nenhum dos dois. Volta ao Início sem recarregar, porque recarregar esvaziaria a memória da aba.
    cena.api.conversa = [mensagemDela('pedido da primeira professora', cena.turmaA.turmaId, randomUUID())]
    await irPara(page, '/professor/conversa')
    await expect(page.getByRole('log').getByText('pedido da primeira professora')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await acionar(page.getByRole('button', { name: 'Ferramenta', exact: true }), hasTouch)
    await acionar(page.getByRole('menuitemradio', { name: /Adaptação/ }), hasTouch)
    await expect(page.getByRole('region', { name: 'Ferramenta Adaptação' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await irPara(page, '/professor/nova-conversa')
    // A primeira deixa um pedido escrito na caixa do Início; a segunda, com uma turma dela (sem turma não haveria caixa), a
    // encontra vazia: a memória da aba não passa de uma pessoa a outra (telas do professor, 3.4). O texto da caixa vive no
    // estado do componente, que se perde quando a Home sai da tela com a saída da primeira: este caso é guarda de regressão,
    // para o dia em que o rascunho for parar na memória da aba, e não a prova de uma limpeza.
    await caixaDoPedido(page).fill('rascunho da primeira professora')
    const segunda = await criarProfessoraNaEscola(cena.professora)
    const dela = await criarAlocacaoDoProfessor(segunda.escolaId, segunda.usuarioId, ['Biologia'])
    await confirmarVinculosNoBanco(segunda.escolaId, dela.vinculoIds)

    // A primeira sai, e a segunda entra na mesma aba, sem recarregar: o cache de consultas é o mesmo. Na API simulada não sobra
    // entrega: o que apareceria no sino dela só podia vir do que ficou da primeira.
    await abrirNavegacao(page, hasTouch)
    await acionar(lateral(page).getByRole('button', { name: 'Sair' }), hasTouch)
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    cena.api.entregas = []
    cena.api.conversa = []
    await entrarPorEmail(page, segunda, hasTouch)
    await esperarNovaConversa(page, segunda.nome)
    await expect(caixaDoPedido(page)).toHaveValue('', { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByLabel('Turma e disciplina').locator('option:checked')).toHaveText(`${dela.turmaNome} · Biologia`)

    const sino = await esperarSino(page, 'Esperando você, nada')
    await expect(sino).not.toHaveAccessibleName('Esperando você, 4')
    await acionar(sino, hasTouch)
    await expect(listaDoSino(page).getByText('Tudo em dia')).toBeVisible()
    // Sem nada esperando, só o pé tem link.
    await expect(listaDoSino(page).getByRole('link')).toHaveCount(2)
    await expect(peDoSino(page).getByRole('link')).toHaveCount(2)
    await expect(page.locator('body')).not.toContainText(cena.turmaA.turmaNome)
    await expect(page.locator('body')).not.toContainText(cena.professora.nome)
    await expect(page.locator('body')).not.toContainText('rascunho da primeira professora')
    const cache = semAcessosDaConta(await cacheDeConsultas(page))
    for (const daPrimeira of [cena.professora.usuarioId, cena.turmaA.turmaId, cena.turmaA.turmaNome, cena.turmaB.turmaNome, 'pedido da primeira professora', ...cena.turmaA.vinculoIds, ...cena.turmaB.vinculoIds]) expect(cache).not.toContain(daPrimeira)
    // A conversa que a primeira leu e o cartão que deixou aberto não estão na conversa da segunda.
    await irPara(page, '/professor/conversa')
    await expect(page.getByText('Nenhuma conversa ainda')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.locator('[data-cartao-de-ferramenta]')).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Ferramenta Adaptação' })).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('pedido da primeira professora')
  })

  test('360 px: o sino e a lista não rolam de lado e não têm violação grave', async ({ page, hasTouch }) => {
    test.slow()
    await page.setViewportSize({ width: 360, height: 740 })
    const cena = await prepararCena(page)
    await entrarNaCena(page, cena, hasTouch)
    const sino = await esperarSino(page, 'Esperando você, 4')
    expect(await larguraExcedente(page)).toBe(0)
    await acionar(sino, hasTouch)
    await expect(listaDoSino(page)).toBeVisible()
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    const painel = await listaDoSino(page).boundingBox()
    expect(painel?.width ?? 0).toBeLessThanOrEqual(360)
  })
})
