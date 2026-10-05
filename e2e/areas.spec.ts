import { randomUUID } from 'node:crypto'
import type { Page, Request, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { NOME_DA_CONTESTACAO, NOME_DO_ESTADO_DE_VINCULO } from '../packages/shared/src/estrutura/vinculo.ts'
import {
  abrirNavegacao,
  entrarComoCoordenacaoNaMesmaAba,
  escolherNoSeletor,
  esperarGovernanca,
  nomeNoSeletor,
  entrarComoProfessora,
  entrarPorEmail,
  gaveta,
  irPelaNavegacao,
  lateral,
  naGaveta,
  PRAZO_DA_ENTRADA_MS,
  esperarNovaConversa,
  TITULO_DA_NOVA_CONVERSA,
  esperarAtividades,
} from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { colocarAlunoNaTurma, criarAlocacaoDoProfessor, criarAlunoComMatricula, criarEquipeComSenha, criarUsuarioEmOutraEscola } from './__fixtures__/sessao.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As áreas de cada papel na casca da escola (A1, tarefa 11.0): a navegação por papel e a guarda (W2), a fronteira do
 * `import()` de cada área (W5), os quatro estados de "Turmas" (W4) e o recomeço da tela — outra pessoa na mesma aba, a
 * mesma rota aberta de novo, a área lenta que chega depois da troca e a falha com a gaveta aberta.
 */

const CHUNK_DO_PROFESSOR = /\/assets\/professor-[^/]+\.js$/
const CHUNK_DA_COORDENACAO = /\/assets\/coordenacao-[^/]+\.js$/
const CHUNK_DO_ALUNO = /\/assets\/aluno-[^/]+\.js$/
const ROTA_MEUS_VINCULOS = '**/v1/meus-vinculos*'

const TITULO_DA_FALHA = 'Não foi possível carregar esta parte do Turmma'

/**
 * Os itens do professor, como a tabela `apps/web/src/areas/navegacao.ts` os declara. O e2e não importa o fonte da web
 * (outra resolução de módulos); a tarefa que acrescenta a linha lá acrescenta aqui, e o W2 percorre todos. "Nova
 * conversa" e "Ferramentas" chegaram com a A2 (D73); "Turmas" continua por último, que é onde o W2 termina.
 */
const ITENS_DO_PROFESSOR = [
  { rotulo: 'Nova conversa', caminho: '/professor/nova-conversa' },
  { rotulo: 'Ferramentas', caminho: '/professor/ferramentas' },
  { rotulo: 'Turmas', caminho: '/professor/turmas' },
] as const
/**
 * Os itens da coordenação, como a mesma tabela os declara: "Estrutura" chegou na 13.0, "Professores", na 14.0, "Material",
 * no MVP de apresentação (A2), e "Governança", "Agentes" e "Analista", na A5, na frente: é na Governança que ela abre.
 */
const ITENS_DA_COORDENACAO = [
  { rotulo: 'Governança', caminho: '/coordenacao/governanca' },
  { rotulo: 'Agentes', caminho: '/coordenacao/agentes' },
  { rotulo: 'Analista', caminho: '/coordenacao/analista' },
  { rotulo: 'Estrutura', caminho: '/coordenacao/estrutura' },
  { rotulo: 'Professores', caminho: '/coordenacao/professores' },
  { rotulo: 'Material', caminho: '/coordenacao/material' },
] as const
/** Os itens do aluno, como a mesma tabela os declara: "Minha turma" chegou na 12.0; "Tutor" e "Atividades", no MVP (A3 e A4). */
const ITENS_DO_ALUNO = [
  { rotulo: 'Tutor', caminho: '/aluno/tutor' },
  { rotulo: 'Atividades', caminho: '/aluno/atividades' },
  { rotulo: 'Minha turma', caminho: '/aluno/minha-turma' },
] as const

/** Os pedidos de JS que a página fez, pelo caminho: é por eles que o teste sabe qual área foi baixada. */
function registrarChunks(page: Page): string[] {
  const pedidos: string[] = []
  page.on('request', (pedido: Request) => {
    const caminho = new URL(pedido.url()).pathname
    if (caminho.endsWith('.js')) pedidos.push(caminho)
  })
  return pedidos
}

/** Uma porta que segura a resposta até o teste abrir. */
function portao(): { aberta: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

/** Navega dentro da aplicação, sem recarregar: o cache e o módulo carregado continuam, como num clique. */
async function navegarSemRecarregar(page: Page, caminho: string): Promise<void> {
  await page.evaluate((destino) => {
    window.history.pushState(null, '', destino)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, caminho)
}

const naoEncontrada = (page: Page) => page.getByRole('heading', { name: 'Página não encontrada' })

/**
 * Pela marca, que leva à raiz. Para o professor a raiz é a tela em que ele abre, "Nova conversa" (A2; D73); para o aluno,
 * "Atividades" (A3).
 */
async function voltarAoInicio(page: Page, hasTouch: boolean): Promise<void> {
  await abrirNavegacao(page, hasTouch)
  const marca = lateral(page).getByRole('link', { name: 'Turmma, página inicial' })
  if (hasTouch) await marca.tap()
  else await marca.click()
}

test.describe('W2: a navegação de cada papel e a guarda de papel', () => {
  test('o professor vê os itens da fase dele, cada um leva à tela com as três pistas do selecionado, e a aba diz a tela', async ({ page, hasTouch }) => {
    const professora = await entrarComoProfessora(page, hasTouch)
    // O professor abre em "Nova conversa" (A2; D73), e não numa página de passagem.
    await expect(page).toHaveTitle(TITULO_DA_NOVA_CONVERSA)
    // A tela em que ele abre não diz que as turmas ficam para depois: sem turma confirmada, aponta para elas, a um toque
    // também no celular.
    await expect(page.getByRole('main')).not.toContainText('próximas versões')
    const paraTurmas = page.getByRole('main').getByRole('button', { name: 'Ir para Turmas' })
    if (hasTouch) await paraTurmas.tap({ timeout: PRAZO_DA_ENTRADA_MS })
    else await paraTurmas.click({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveURL(/\/professor\/turmas$/)
    await voltarAoInicio(page, hasTouch)
    await expect(page).toHaveURL(/\/professor\/nova-conversa$/)
    await expect(page).toHaveTitle(TITULO_DA_NOVA_CONVERSA)

    await abrirNavegacao(page, hasTouch)
    const secoes = lateral(page).getByRole('navigation', { name: 'Seções' })
    // Os itens são os da tabela do papel, e só eles; cada tarefa de tela acrescenta a linha dela.
    await expect(secoes.getByRole('link')).toHaveText(ITENS_DO_PROFESSOR.map(({ rotulo }) => rotulo))
    // O menu da pessoa (P18): o nome, o papel e o "Sair", à vista, sem abrir nada.
    await expect(lateral(page)).toContainText(professora.nome)
    await expect(lateral(page)).toContainText('professor')
    await expect(lateral(page).getByRole('button', { name: 'Sair' })).toBeVisible()
    expect(await violacoesGraves(page)).toEqual([])

    // Nenhum item da tabela leva a tela que não existe.
    for (const item of ITENS_DO_PROFESSOR) {
      await irPelaNavegacao(page, item.rotulo, hasTouch)
      await expect(page).toHaveURL(new RegExp(`${item.caminho}$`))
      await expect(page).toHaveTitle(`${item.rotulo} · Turmma`, { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(naoEncontrada(page)).toHaveCount(0)
    }
    await expect(page).toHaveURL(/\/professor\/turmas$/)
    await expect(page).toHaveTitle('Turmas · Turmma')
    // Nenhum item leva a tela que não existe: a tela é a das turmas, e não a página não encontrada.
    await expect(page.getByRole('heading', { level: 1, name: 'Turmas' })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByText('A coordenação ainda não alocou você')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(naoEncontrada(page)).toHaveCount(0)

    // O selecionado tem três pistas, e não só o fundo que some no Chromebook (11.1): fundo `realce`, peso 600 e o filete
    // `caramelo` na borda esquerda. E o `aria-current`, que o leitor de tela anuncia.
    await abrirNavegacao(page, hasTouch)
    const turmas = lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Turmas' })
    await expect(turmas).toHaveAttribute('aria-current', 'page')
    expect(await turmas.evaluate((elemento) => [getComputedStyle(elemento).backgroundColor, getComputedStyle(elemento).fontWeight])).toEqual(['rgb(236, 236, 236)', '600'])
    const filete = turmas.locator('[data-filete]')
    expect(await filete.evaluate((elemento) => [getComputedStyle(elemento).backgroundColor, getComputedStyle(elemento).width])).toEqual(['rgb(232, 115, 46)', '3px'])
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Fora de "Turmas", o item volta a ser um item comum. A marca não é item, e a gaveta fecha também pela troca de
    // endereço, e não só pelo toque num item.
    await voltarAoInicio(page, hasTouch)
    await expect(gaveta(page)).toBeHidden()
    await expect(page).toHaveTitle(TITULO_DA_NOVA_CONVERSA)
    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Turmas' })).not.toHaveAttribute('aria-current', 'page')
    await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Turmas' }).locator('[data-filete]')).toHaveCount(0)
  })

  test('o professor no endereço da coordenação e do aluno cai em "não encontrada", sem baixar a área deles', async ({ page, hasTouch }) => {
    const pedidos = registrarChunks(page)
    await entrarComoProfessora(page, hasTouch)

    // Os endereços da coordenação que têm tela: a Governança, onde ela abre (A5), uma turma aberta na Estrutura (13.0) e
    // Professores (14.0).
    for (const endereco of ['/coordenacao/governanca', `/coordenacao/estrutura/turmas/${randomUUID()}`, '/coordenacao/professores']) {
      await page.goto(endereco)
      await expect(naoEncontrada(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await expect(page.getByRole('heading', { name: 'Governança' })).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'Estrutura' })).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'Professores' })).toHaveCount(0)
    }
    await expect(page).toHaveTitle('Página não encontrada · Turmma')
    // A casca continua: a pessoa sai dali pela lateral, e não por um beco sem saída.
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
    await page.goto('/aluno/minha-turma')
    await expect(naoEncontrada(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // A área do aluno responderia "não encontrada" para o professor também sem a guarda (a "Minha turma" é só do aluno
    // na API): é o pedido do chunk que mostra que nenhuma das duas áreas foi baixada nem montada.
    expect(pedidos.filter((caminho) => CHUNK_DA_COORDENACAO.test(caminho) || CHUNK_DO_ALUNO.test(caminho))).toEqual([])
  })

  // Separado do anterior só pelo prazo: as cinco entradas de página por `page.goto`, no perfil de rede lenta e com o
  // servidor do e2e sem compressão nem cache, passavam dos 30 s juntas (esteira `37245636814`). As asserções são as
  // mesmas de antes; cada teste começa da entrada da professora.
  test('o endereço que não existe na área do professor responde igual ao de outro papel, e "página inicial" volta à Nova conversa', async ({ page, hasTouch }) => {
    const pedidos = registrarChunks(page)
    const professora = await entrarComoProfessora(page, hasTouch)

    // Um endereço que não existe dentro da própria área responde igual: a tela não confirma o que é de outro papel.
    await page.goto('/professor/qualquer')
    await expect(naoEncontrada(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(pedidos.some((caminho) => CHUNK_DO_PROFESSOR.test(caminho))).toBe(true)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    // Dentro da área, "página inicial" leva à raiz, e não ao começo da área (`/professor/`).
    if (hasTouch) await page.getByRole('main').getByRole('link', { name: 'página inicial', exact: true }).tap()
    else await page.getByRole('main').getByRole('link', { name: 'página inicial', exact: true }).click()
    // A raiz leva o professor à tela em que ele abre: é por ela que se chega a "Nova conversa", e não por `/professor/`,
    // que não é tela nenhuma.
    await esperarNovaConversa(page, professora.nome)
    await expect(naoEncontrada(page)).toHaveCount(0)
  })

  test('o aluno vê "Tutor", "Atividades" e "Minha turma", cada um levando à tela dele, e os endereços do professor e da coordenação caem em "não encontrada"', async ({ page, hasTouch }) => {
    const pedidos = registrarChunks(page)
    const aluno = await criarAlunoComMatricula()
    const turma = await colocarAlunoNaTurma(aluno)
    await page.goto(`/e/${aluno.slug}`)
    await page.getByLabel('Matrícula').fill(aluno.matricula)
    await page.getByLabel('Senha').fill(aluno.senha)
    if (hasTouch) await page.getByRole('button', { name: /^Entrar$/ }).tap()
    else await page.getByRole('button', { name: /^Entrar$/ }).click()
    // O aluno abre em "Atividades" (A3), e não numa página de passagem: nada ali aponta para Turmas, que não é tela dele.
    await esperarAtividades(page, aluno.nome)
    await expect(page.getByRole('main').getByRole('link', { name: 'Turmas', exact: true })).toHaveCount(0)
    await expect(page.getByRole('main')).not.toContainText('próximas versões')
    await irPelaNavegacao(page, 'Minha turma', hasTouch)
    await expect(page).toHaveURL(/\/aluno\/minha-turma$/)
    await expect(page.getByRole('main')).toContainText(turma.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })
    // A marca leva à raiz, e a raiz do aluno é "Atividades".
    await voltarAoInicio(page, hasTouch)
    await expect(page).toHaveURL(/\/aluno\/atividades$/)

    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link')).toHaveText(ITENS_DO_ALUNO.map(({ rotulo }) => rotulo))
    await expect(lateral(page)).toContainText(aluno.nome)
    await expect(lateral(page)).toContainText('aluno')

    // Nenhum item da tabela leva a tela que não existe.
    for (const item of ITENS_DO_ALUNO) {
      await irPelaNavegacao(page, item.rotulo, hasTouch)
      await expect(page).toHaveURL(new RegExp(`${item.caminho}$`))
      await expect(page).toHaveTitle(`${item.rotulo} · Turmma`, { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(naoEncontrada(page)).toHaveCount(0)
      await abrirNavegacao(page, hasTouch)
      await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: item.rotulo })).toHaveAttribute('aria-current', 'page')
    }
    // O último item é "Minha turma": a tela dele, com a turma dele.
    await expect(page.getByRole('main')).toContainText(turma.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })

    for (const endereco of ['/professor/turmas', '/coordenacao/estrutura', '/coordenacao/professores']) {
      await page.goto(endereco)
      await expect(naoEncontrada(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    }
    expect(pedidos.filter((caminho) => CHUNK_DO_PROFESSOR.test(caminho) || CHUNK_DA_COORDENACAO.test(caminho))).toEqual([])
  })
})

test.describe('W5: a fronteira do import() de cada área', () => {
  test('a área do professor que não chega: o texto e o título da falha, a casca de pé, e o título de antes ao sair', async ({ page, hasTouch }) => {
    await page.route(CHUNK_DO_PROFESSOR, (rota: Route) => rota.abort('internetdisconnected'))
    // O professor abre em "Nova conversa" (A2; D73): a área é pedida já na entrada, e é ali que ela não chega.
    const professora = await criarEquipeComSenha()
    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await expect(page).toHaveURL(/\/professor\/nova-conversa$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('alert')).toContainText('Confira a conexão e tente de novo', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Não foi possível carregar · Turmma')
    // A fronteira assume com o foco nela: quem usa leitor de tela fica sabendo que a tela mudou.
    await expect(page.getByRole('heading', { name: TITULO_DA_FALHA })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Saindo por outra rota, a aba volta a dizer a tela em que a pessoa está. Fora da área do professor, o que existe
    // para ele é a página não encontrada, que não depende do pedaço que falhou.
    await navegarSemRecarregar(page, '/coordenacao/estrutura')
    await expect(page.getByRole('heading', { name: TITULO_DA_FALHA })).toHaveCount(0)
    await expect(naoEncontrada(page)).toBeVisible()
    await expect(page).toHaveTitle('Página não encontrada · Turmma')

    // Saindo pelo "Sair", para uma tela que não põe título: a fronteira devolve o de antes dela, e a aba não continua
    // dizendo que algo não carregou (o `componentWillUnmount`, pendência da A0b).
    await irPelaNavegacao(page, 'Turmas', hasTouch)
    await expect(page).toHaveTitle('Não foi possível carregar · Turmma', { timeout: PRAZO_DA_ENTRADA_MS })
    if (hasTouch) await page.getByRole('button', { name: 'Sair' }).tap()
    else await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Turmma')
  })

  test('a área da coordenação que não chega mostra a mesma fronteira, e a nova tentativa carrega', async ({ page, hasTouch }) => {
    const coordenadora = await criarEquipeComSenha('coordenador')
    // A coordenação abre em Governança (A5): a área é pedida já na entrada, e é ali que ela não chega.
    const abortar = (rota: Route) => rota.abort('internetdisconnected')
    await page.route(CHUNK_DA_COORDENACAO, abortar)
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await expect(page.getByRole('alert')).toContainText('Confira a conexão e tente de novo', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Não foi possível carregar · Turmma')
    await expect(page.getByRole('heading', { name: TITULO_DA_FALHA })).toBeFocused()
    expect(await violacoesGraves(page)).toEqual([])

    // Com a rede de volta, "Tentar de novo" recarrega e a área chega, com a Governança.
    await page.unroute(CHUNK_DA_COORDENACAO, abortar)
    if (hasTouch) await page.getByRole('button', { name: 'Tentar de novo' }).tap()
    else await page.getByRole('button', { name: 'Tentar de novo' }).click()
    await esperarGovernanca(page)
    await expect(page.getByRole('heading', { name: TITULO_DA_FALHA })).toHaveCount(0)
  })
})

test.describe('W4: os estados de "Turmas"', () => {
  test('vazio e erro com a rota interceptada, só pendente e com as confirmadas', async ({ page, hasTouch }) => {
    let resposta: 'vazia' | 'falha' | 'real' = 'vazia'
    await page.route(ROTA_MEUS_VINCULOS, async (rota: Route) => {
      if (resposta === 'vazia') return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ itens: [] }) })
      if (resposta === 'falha')
        return rota.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }),
        })
      return rota.continue()
    })
    const professora = await entrarComoProfessora(page, hasTouch)

    // Vazio: quem aloca é a coordenação, e o vazio diz isso e o próximo passo.
    await irPelaNavegacao(page, 'Turmas', hasTouch)
    await expect(page.getByText('A coordenação ainda não alocou você')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('main')).toContainText('fale com ela')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Erro: a mensagem do catálogo, com "Tentar de novo", e nenhum código na tela.
    resposta = 'falha'
    await page.reload()
    await expect(page.getByRole('alert')).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible()
    for (const proibido of ['503', 'INDISPONIVEL_TENTE_DE_NOVO']) await expect(page.locator('body')).not.toContainText(proibido)

    // Só pendente: "Confirme suas turmas", com as duas disciplinas, e nenhuma "Suas turmas" ainda.
    const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['Matemática', 'História'])
    resposta = 'real'
    if (hasTouch) await page.getByRole('button', { name: 'Tentar de novo' }).tap()
    else await page.getByRole('button', { name: 'Tentar de novo' }).click()
    const paraConfirmar = page.getByRole('region', { name: 'Confirme suas turmas', exact: true })
    const decididas = page.getByRole('region', { name: 'Suas turmas', exact: true })
    await expect(paraConfirmar.getByRole('listitem')).toHaveCount(2, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(paraConfirmar).toContainText(alocacao.turmaNome)
    await expect(decididas).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Com dado: a confirmada passa para "Suas turmas", e a outra continua esperando a decisão.
    const matematica = paraConfirmar.getByRole('listitem').filter({ hasText: 'Matemática' })
    if (hasTouch) await matematica.getByRole('button', { name: 'Confirmar' }).tap()
    else await matematica.getByRole('button', { name: 'Confirmar' }).click()
    await expect(decididas.getByRole('listitem')).toHaveText([new RegExp(`${alocacao.turmaNome} · Matemática.*${NOME_DO_ESTADO_DE_VINCULO.confirmado}`)], {
      timeout: PRAZO_DA_ENTRADA_MS,
    })
    await expect(paraConfirmar.getByRole('listitem')).toHaveCount(1)
    await expect(paraConfirmar).toContainText('História')
    // A confirmada não oferece decidir de novo.
    await expect(decididas.getByRole('button')).toHaveCount(0)

    // A contestada continua esperando a decisão, no grupo de cima: ela ainda não dá acesso à turma.
    const historia = paraConfirmar.getByRole('listitem').filter({ hasText: 'História' })
    if (hasTouch) await historia.getByRole('button', { name: 'Contestar' }).tap()
    else await historia.getByRole('button', { name: 'Contestar' }).click()
    await historia.getByRole('radio', { name: NOME_DA_CONTESTACAO.nao_leciono }).check()
    if (hasTouch) await historia.getByRole('button', { name: 'Enviar a contestação' }).tap()
    else await historia.getByRole('button', { name: 'Enviar a contestação' }).click()
    await expect(paraConfirmar.getByRole('listitem').filter({ hasText: 'História' })).toContainText(NOME_DO_ESTADO_DE_VINCULO.contestado, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(decididas.getByRole('listitem')).toHaveCount(1)
  })
})

test.describe('recomeço da tela', () => {
  test('segunda pessoa: a coordenação entra na aba do professor sem o item nem o dado dele', async ({ page, hasTouch }) => {
    const professora = await entrarComoProfessora(page, hasTouch)
    const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId)
    await irPelaNavegacao(page, 'Turmas', hasTouch)
    await expect(page.getByRole('main')).toContainText(alocacao.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })

    if (hasTouch) await page.getByRole('button', { name: 'Sair' }).tap()
    else await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })

    // A coordenadora entra na mesma aba, sem recarregar: o módulo da área do professor continua na memória da página.
    let leiturasDosVinculos = 0
    await page.route(ROTA_MEUS_VINCULOS, async (rota: Route) => {
      leiturasDosVinculos++
      await rota.continue()
    })
    const coordenadora = await criarEquipeComSenha('coordenador')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    // A coordenação abre em Governança (A5), que também não aponta para Turmas, tela do professor.
    await esperarGovernanca(page)
    await expect(page.getByRole('main').getByRole('link', { name: 'Turmas' })).toHaveCount(0)

    await abrirNavegacao(page, hasTouch)
    await expect(lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link')).toHaveText(ITENS_DA_COORDENACAO.map(({ rotulo }) => rotulo))
    await expect(lateral(page)).toContainText(coordenadora.nome)
    await expect(page.locator('body')).not.toContainText(professora.nome)
    await expect(page.locator('body')).not.toContainText(alocacao.turmaNome)

    // Nem voltando ao endereço das turmas: a guarda responde pelo papel da pessoa de agora, e o cache da anterior
    // não aparece.
    await navegarSemRecarregar(page, '/professor/turmas')
    await expect(naoEncontrada(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.locator('body')).not.toContainText(alocacao.turmaNome)
    expect(leiturasDosVinculos).toBe(0)
  })

  test('troca de escola pelo seletor, de "Nova conversa" para "Nova conversa": a gaveta não fica aberta por cima', async ({ page, hasTouch }) => {
    const emA = await criarEquipeComSenha()
    const emB = await criarUsuarioEmOutraEscola(emA.contaId)
    await page.goto('/entrar')
    await entrarPorEmail(page, emA, hasTouch)
    const escolherA = page.getByRole('button', { name: `${emA.escolaNome} · professor` })
    if (hasTouch) await escolherA.tap({ timeout: PRAZO_DA_ENTRADA_MS })
    else await escolherA.click({ timeout: PRAZO_DA_ENTRADA_MS })
    await esperarNovaConversa(page, emA.nome)

    // A tela é a mesma antes e depois da troca (o professor abre em "Nova conversa" nas duas escolas): é a pessoa da
    // sessão que muda, e é ela que fecha a gaveta.
    await escolherNoSeletor(page, nomeNoSeletor(emB, 'professor'), hasTouch)
    await esperarNovaConversa(page, 'Professora sintética na outra escola')
    expect(new URL(page.url()).pathname).toBe('/professor/nova-conversa')
    await expect(gaveta(page)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  test('mesma entrada: abrir "Turmas" de novo não monta a área duas vezes nem baixa o chunk de novo', async ({ page, hasTouch }) => {
    const pedidos = registrarChunks(page)
    await entrarComoProfessora(page, hasTouch)
    await irPelaNavegacao(page, 'Turmas', hasTouch)
    await expect(page.getByText('A coordenação ainda não alocou você')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    await irPelaNavegacao(page, 'Turmas', hasTouch)
    await irPelaNavegacao(page, 'Turmas', hasTouch)
    await expect(page.getByRole('heading', { level: 1, name: 'Turmas' })).toHaveCount(1)
    await expect(page.getByText('A coordenação ainda não alocou você')).toHaveCount(1)
    // O item fecha a gaveta também quando o endereço não muda.
    await expect(gaveta(page)).toBeHidden()
    expect(pedidos.filter((caminho) => CHUNK_DO_PROFESSOR.test(caminho))).toHaveLength(1)
  })

  test('resposta atrasada: a área lenta que chega depois de a pessoa sair dela não aparece', async ({ page, hasTouch }) => {
    const pedidos = registrarChunks(page)
    const segurada = portao()
    await page.route(CHUNK_DO_PROFESSOR, async (rota: Route) => {
      await segurada.aberta
      await rota.continue()
    })
    // O professor abre em "Nova conversa" (A2; D73): a área é pedida já na entrada, e fica segurada.
    const professora = await criarEquipeComSenha()
    await page.goto('/entrar')
    const pedidoDoChunk = page.waitForRequest((pedido) => CHUNK_DO_PROFESSOR.test(new URL(pedido.url()).pathname))
    await entrarPorEmail(page, professora, hasTouch)
    await expect(page).toHaveURL(/\/professor\/nova-conversa$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('main').getByRole('status')).toHaveText('Carregando…', { timeout: PRAZO_DA_ENTRADA_MS })
    const chunk = await pedidoDoChunk
    // Ela sai da área antes de a área chegar. Fora dela, o que existe para o professor é a página não encontrada.
    await navegarSemRecarregar(page, '/coordenacao/estrutura')
    await expect(page).toHaveTitle('Página não encontrada · Turmma')

    // O chunk chega, e o módulo é avaliado: o `import()` do mesmo endereço só resolve com o módulo que a página já tem.
    // Dois quadros depois, qualquer coisa que a chegada fosse pintar já estaria na tela.
    const resposta = chunk.response()
    segurada.abrir()
    const chegada = await resposta
    expect(chegada, 'o chunk não teve resposta').not.toBeNull()
    await chegada?.finished()
    await page.evaluate(async (url) => {
      await import(/* @vite-ignore */ url)
      await new Promise<void>((pronto) => requestAnimationFrame(() => requestAnimationFrame(() => pronto())))
    }, chunk.url())
    await expect(page).toHaveURL(/\/coordenacao\/estrutura$/)
    // O único título do conteúdo é o da página em que ela está: nada da área do professor apareceu junto.
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(['Página não encontrada'])
    await expect(page.getByRole('main')).not.toContainText('O que vamos preparar hoje?')
    await expect(page.getByText('A coordenação ainda não alocou você')).toHaveCount(0)
    await expect(page).toHaveTitle('Página não encontrada · Turmma')

    // Controle: a área chegou de fato. Voltando a ela sem recarregar, aparece sem pedir o chunk de novo.
    await navegarSemRecarregar(page, '/professor/turmas')
    await expect(page.getByText('A coordenação ainda não alocou você')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    expect(pedidos.filter((caminho) => CHUNK_DO_PROFESSOR.test(caminho))).toHaveLength(1)
  })

  test('a guarda sem o /v1/eu: carrega enquanto ele não chega, e na falha mostra o erro com nova tentativa, nunca "não encontrada"', async ({ page, hasTouch }) => {
    const pedidos = registrarChunks(page)
    await entrarComoProfessora(page, hasTouch)

    let estado: 'segurado' | 'falha' | 'normal' = 'segurado'
    const segurado = portao()
    await page.route('**/v1/eu', async (rota: Route) => {
      if (estado === 'segurado') await segurado.aberta
      if (estado === 'falha')
        return rota.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }),
        })
      return rota.continue()
    })

    // A aba abre direto na área: a sessão volta pelo cookie, e o papel ainda não é conhecido. O pedaço da área que a
    // entrada baixou (o professor abre em "Nova conversa") foi com a página anterior: a conta recomeça aqui.
    pedidos.length = 0
    await page.goto('/professor/turmas')
    await expect(page.getByRole('main').getByRole('status')).toHaveText('Carregando…', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(naoEncontrada(page)).toHaveCount(0)
    await expect(page).not.toHaveTitle('Página não encontrada · Turmma')

    // A API cai: a guarda diz o que fazer, e não que a página não existe, nem baixa a área sem saber o papel.
    estado = 'falha'
    segurado.abrir()
    await expect(page.getByRole('main').getByRole('alert')).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('main').getByRole('button', { name: 'Tentar de novo' })).toBeVisible()
    await expect(naoEncontrada(page)).toHaveCount(0)
    await expect(page).not.toHaveTitle('Página não encontrada · Turmma')
    expect(pedidos.filter((caminho) => CHUNK_DO_PROFESSOR.test(caminho))).toEqual([])
    expect(await violacoesGraves(page)).toEqual([])

    // A API volta: "Tentar de novo" leva a "Turmas".
    estado = 'normal'
    const tentar = page.getByRole('main').getByRole('button', { name: 'Tentar de novo' })
    if (hasTouch) await tentar.tap()
    else await tentar.click()
    await expect(page.getByText('A coordenação ainda não alocou você')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Turmas · Turmma')
    expect(pedidos.filter((caminho) => CHUNK_DO_PROFESSOR.test(caminho))).toHaveLength(1)
  })

  test('sem sessão, o endereço de uma área leva à entrada sem baixar a área', async ({ page }) => {
    const pedidos = registrarChunks(page)
    await page.goto('/professor/turmas')
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    expect(pedidos.filter((caminho) => CHUNK_DO_PROFESSOR.test(caminho))).toEqual([])
  })

  test('falha com a gaveta aberta: a fronteira assume, a gaveta fecha e o foco vai para a falha', async ({ page, hasTouch }) => {
    // No computador, a gaveta é a lateral que o trilho abre por cima, entre 768 e 1023 px.
    if (!naGaveta(page)) await page.setViewportSize({ width: 900, height: 768 })
    const segurada = portao()
    await page.route(CHUNK_DO_PROFESSOR, async (rota: Route) => {
      await segurada.aberta
      await rota.abort('internetdisconnected')
    })
    const professora = await criarEquipeComSenha()
    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    // O professor abre em "Nova conversa" (A2; D73): a área começa a carregar já na entrada.
    await expect(page).toHaveURL(/\/professor\/nova-conversa$/, { timeout: PRAZO_DA_ENTRADA_MS })

    // A área está carregando, e a pessoa abre a gaveta enquanto espera.
    await expect(page.getByRole('main').getByRole('status')).toHaveText('Carregando…', { timeout: PRAZO_DA_ENTRADA_MS })
    const abrir = page.getByRole('button', { name: naGaveta(page) ? 'Abrir o menu' : 'Abrir a lateral' })
    if (hasTouch) await abrir.tap()
    else await abrir.click()
    await expect(gaveta(page)).toBeVisible()

    segurada.abrir()
    await expect(page.getByRole('heading', { name: TITULO_DA_FALHA })).toBeFocused({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(gaveta(page)).toBeHidden()
    await expect(page.getByRole('alert')).toContainText('Confira a conexão e tente de novo')
    expect(await violacoesGraves(page)).toEqual([])
  })
})
