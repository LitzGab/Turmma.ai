import type { Locator, Page, Route } from '@playwright/test'
import { abrirNavegacao, entrarComoCoordenacaoNaMesmaAba, escolherNoSeletor, esperarGovernanca, irPelaNavegacao, lateral, nomeNoSeletor, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { ajustarRetencaoDaEscola, cadastrarSuboperadorDeTeste, codigoDoAutenticador, criarEquipeComSenha, criarEscolaSintetica, criarUsuarioEmOutraEscola, type EquipeDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * A Privacidade da coordenação, na aba "Por quanto tempo guardamos" (F3, 6.0; RF20; `docs/interface.md` 3): o prazo que
 * vale para cada dado da escola, de onde ele vem, e os prazos fixos. Contra a API real, nos projetos `chromebook` e
 * `celular`. A escola de cada teste tem o ajuste que o teste precisa, e o segundo dado é o que torna cada cláusula visível.
 */

const INDISPONIVEL = JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })
const ENDERECO_DA_RETENCAO = /\/coordenacao\/privacidade\/retencao$/
const AJUSTADO = 'Ajustado pela escola'
const CARREGANDO = 'Carregando os prazos de guarda…'
const NOME_DA_ABA = 'Por quanto tempo guardamos'
const NOME_DAS_CATEGORIAS = 'O que a escola guarda, e por quanto tempo'

const principal = (page: Page) => page.getByRole('main')
/** A tabela das categorias: a região pelo nome, o primeiro que é a seção que a contém. */
const categorias = (page: Page) => principal(page).getByRole('region', { name: NOME_DAS_CATEGORIAS }).first()
/**
 * A linha de uma categoria, pelo texto da coluna "Dado": `tr` no chromebook, `li` no celular. No celular o texto do "Dado"
 * é um nó solto ao lado do rótulo "Dado:", então `getByText` exato não o acha; a linha começa por ele, com ou sem o rótulo.
 * A ancoragem no começo deixa de fora a coluna "De onde vem", onde o nome aparece dentro do texto de uma trava.
 */
const linhaDa = (page: Page, dado: string) => {
  const escapado = dado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return categorias(page).locator('tr, li').filter({ hasText: new RegExp(`^(Dado:\\s*)?${escapado}`) })
}

function portao(): { aberta: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

/** A coordenadora entra e abre a Privacidade pela navegação, na aba de retenção. */
async function entrarNaPrivacidade(page: Page, hasTouch: boolean, pessoa: EquipeDeTeste): Promise<void> {
  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, pessoa, hasTouch)
  await esperarGovernanca(page)
  await irPelaNavegacao(page, 'Privacidade', hasTouch)
  await expect(page).toHaveURL(ENDERECO_DA_RETENCAO, { timeout: PRAZO_DA_ENTRADA_MS })
}

test.describe('Privacidade: por quanto tempo a escola guarda cada dado', () => {
  test('a coordenação abre Privacidade pela navegação, na aba de retenção, com o prazo que vale, de onde ele vem e os prazos fixos', async ({ page, hasTouch }) => {
    const coordenadora = await criarEquipeComSenha('coordenador')
    await ajustarRetencaoDaEscola(coordenadora.escolaId, 'conversa_tutor', 6)
    await ajustarRetencaoDaEscola(coordenadora.escolaId, 'conversa_professor', 3)
    await entrarNaPrivacidade(page, hasTouch, coordenadora)

    await expect(page).toHaveTitle('Privacidade · Turmma')
    await expect(page.getByRole('heading', { level: 1, name: 'Privacidade' })).toBeVisible()
    await expect(page.getByRole('tab', { name: NOME_DA_ABA })).toHaveAttribute('aria-selected', 'true')

    // O ajuste da escola aparece, na linha da categoria dele, com o prazo e a origem ditos.
    const doAluno = linhaDa(page, 'Conversa do aluno com o Tutor')
    await expect(doAluno).toHaveCount(1)
    await expect(doAluno).toContainText('cada mensagem')
    await expect(doAluno).toContainText('6 meses')
    await expect(doAluno).toContainText(AJUSTADO)
    const doProfessor = linhaDa(page, 'Conversa do professor com o Assistente de ensino')
    await expect(doProfessor).toHaveCount(1)
    await expect(doProfessor).toContainText('3 meses')
    // Uma descrição que nenhum texto de trava cita também aparece na coluna "Dado".
    await expect(linhaDa(page, 'Sinais do Tutor ao professor (travou, pediu a resposta pronta, repetiu a dúvida)')).toHaveCount(1)
    await expect(linhaDa(page, 'Quanto cada aluno usou da IA')).toHaveCount(1)
    // Um prazo que a trava encurtou, sem ajuste próprio, diz de qual categoria veio o limite.
    await expect(categorias(page)).toContainText('Padrão do sistema; encurtado pela trava com "Conversa do professor com o Assistente de ensino"')
    // Os prazos fixos ficam à parte, e a escola não os ajusta.
    const fixos = principal(page).getByRole('region', { name: 'Prazos que não mudam' }).first()
    await expect(fixos).toContainText('Registro de acesso')
    await expect(fixos).toContainText('6 meses')

    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('o endereço sem aba, e um endereço com aba que não existe, abrem a aba de retenção', async ({ page, hasTouch }) => {
    const coordenadora = await criarEquipeComSenha('coordenador')
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await esperarGovernanca(page)

    await page.goto('/coordenacao/privacidade')
    await expect(page).toHaveURL(ENDERECO_DA_RETENCAO, { timeout: PRAZO_DA_ENTRADA_MS })
    await page.goto('/coordenacao/privacidade/nao-existe')
    await expect(page).toHaveURL(ENDERECO_DA_RETENCAO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('tab', { name: NOME_DA_ABA })).toHaveAttribute('aria-selected', 'true')
  })

  test('os estados: carregando, erro com "Tentar de novo", e com dado', async ({ page, hasTouch }) => {
    const segurada = portao()
    let falhar = true
    await page.route(
      (url) => url.pathname === '/v1/privacidade/retencao',
      async (rota: Route) => {
        await segurada.aberta
        if (falhar) return rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL })
        return rota.continue()
      },
    )
    const coordenadora = await criarEquipeComSenha('coordenador')
    await ajustarRetencaoDaEscola(coordenadora.escolaId, 'conversa_tutor', 6)
    await page.goto('/entrar')
    await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
    await esperarGovernanca(page)
    await irPelaNavegacao(page, 'Privacidade', hasTouch)

    await expect(principal(page).getByRole('status').filter({ hasText: CARREGANDO })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    segurada.abrir()
    await expect(principal(page).getByRole('alert')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('button', { name: 'Tentar de novo' })).toBeVisible()

    falhar = false
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(categorias(page)).toContainText(AJUSTADO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('alert')).toHaveCount(0)
  })

  test('a troca de escola não mostra a retenção da escola anterior, nem enquanto a da nova ainda não chegou', async ({ page, hasTouch }) => {
    // A virada de 30 s do segundo fator pode levar quase um minuto de relógio, além do que o teste tem por padrão.
    test.setTimeout(90_000)
    const emA = await criarEquipeComSenha('coordenador')
    await ajustarRetencaoDaEscola(emA.escolaId, 'conversa_tutor', 6)
    // O segredo do segundo fator sai da resposta do primeiro acesso: a troca de escola pede um código de novo.
    const respostaDoSegredo = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/configurar')
    await entrarNaPrivacidade(page, hasTouch, emA)
    const fimDoLogin = Date.now()
    await expect(categorias(page)).toContainText(AJUSTADO, { timeout: PRAZO_DA_ENTRADA_MS })
    const { segredo } = (await (await respostaDoSegredo).json()) as { segredo: string }
    // A segunda escola entra depois do primeiro acesso: com duas escolas, o login pede a escola e o segundo fator, e o
    // helper de entrada só cobre uma. A lista de escolas da sessão vê a nova ao recarregar a aba.
    const emB = await criarUsuarioEmOutraEscola(emA.contaId, 'coordenador')
    await page.reload()
    await expect(categorias(page)).toContainText(AJUSTADO, { timeout: PRAZO_DA_ENTRADA_MS })

    // A resposta de B fica segurada: enquanto ela não chega, a tela não pode mostrar o ajuste de A.
    const segurada = portao()
    await page.route(
      (url) => url.pathname === '/v1/privacidade/retencao',
      async (rota: Route) => {
        await segurada.aberta
        return rota.continue()
      },
    )
    await escolherNoSeletor(page, nomeNoSeletor(emB, 'coordenação'), hasTouch)
    await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // O login usou o código do passo seguinte ao instante em que ele foi montado, e o segundo fator não aceita um passo que
    // já passou da janela. O código que vale é o do passo seguinte ao fim do login, e só depois da próxima virada de 30 s
    // do relógio: antes disso ele ainda é o do login, e o servidor o recusa.
    const PASSO_MS = 30_000
    const proximaVirada = (Math.floor(fimDoLogin / PASSO_MS) + 1) * PASSO_MS
    await new Promise((resolver) => setTimeout(resolver, Math.max(0, proximaVirada + 1_000 - Date.now())))
    await page.getByLabel('Código do aplicativo').fill(codigoDoAutenticador(segredo, PASSO_MS / 1_000))
    await acionar(page.getByRole('button', { name: /^Entrar$|Entrando/ }), hasTouch)
    await esperarGovernanca(page)
    await irPelaNavegacao(page, 'Privacidade', hasTouch)
    await expect(principal(page).getByRole('status').filter({ hasText: CARREGANDO })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).not.toContainText(AJUSTADO)

    segurada.abrir()
    await expect(categorias(page)).toContainText('Padrão do sistema', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).not.toContainText(AJUSTADO)
  })

  test('a segunda pessoa na mesma aba não vê a retenção da anterior', async ({ page, hasTouch }) => {
    const primeira = await criarEquipeComSenha('coordenador')
    await ajustarRetencaoDaEscola(primeira.escolaId, 'conversa_tutor', 6)
    await entrarNaPrivacidade(page, hasTouch, primeira)
    await expect(categorias(page)).toContainText(AJUSTADO, { timeout: PRAZO_DA_ENTRADA_MS })

    await abrirNavegacao(page, hasTouch)
    await acionar(lateral(page).getByRole('button', { name: 'Sair' }), hasTouch)
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })

    const segunda = await criarEquipeComSenha('coordenador')
    // A resposta da segunda pessoa fica segurada: enquanto ela não chega, a tela não pode mostrar o ajuste da primeira.
    const segurada = portao()
    await page.route(
      (url) => url.pathname === '/v1/privacidade/retencao',
      async (rota: Route) => {
        await segurada.aberta
        return rota.continue()
      },
    )
    await entrarComoCoordenacaoNaMesmaAba(page, segunda, hasTouch)
    await esperarGovernanca(page)
    await irPelaNavegacao(page, 'Privacidade', hasTouch)
    await expect(principal(page).getByRole('status').filter({ hasText: CARREGANDO })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).not.toContainText(AJUSTADO)

    segurada.abrir()
    await expect(categorias(page)).toContainText('Padrão do sistema', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).not.toContainText(AJUSTADO)
  })
})

/**
 * A aba "Empresas que recebem dados" (F3, 8.0; RF7 e RF20): os suboperadores da escola, vigentes e passados. `suboperador`
 * é global e o banco acumula, então toda empresa de teste tem nome único, e a tela se confere só pelos nomes que o teste
 * criou: o vazio, que o banco não produz, vem de `rota.fulfill`.
 */
const NOME_DA_ABA_DAS_EMPRESAS = 'Empresas que recebem dados'
const ENDERECO_DAS_EMPRESAS = /\/coordenacao\/privacidade\/suboperadores$/
const CARREGANDO_AS_EMPRESAS = 'Carregando as empresas que recebem dados…'
const SECAO_DAS_VIGENTES = 'Empresas que recebem dado da escola hoje'
const SECAO_DAS_PASSADAS = 'Empresas que já receberam dado da escola'
const VAZIO_DAS_EMPRESAS = 'Nenhuma empresa recebe dado desta escola'

const secao = (page: Page, nome: string) => principal(page).getByRole('region', { name: nome }).first()
/** A linha de uma empresa pelo nome dela: `tr` no chromebook, `li` no celular. */
const linhaDaEmpresa = (page: Page, nome: string) => principal(page).locator('tr, li').filter({ hasText: nome })
const marca = () => Math.random().toString(36).slice(2, 10)

/** A coordenadora entra e abre a aba das empresas pelo endereço da aba, depois de entrar na Privacidade pela navegação. */
async function abrirAsEmpresas(page: Page, hasTouch: boolean, pessoa: EquipeDeTeste): Promise<void> {
  await entrarNaPrivacidade(page, hasTouch, pessoa)
  await acionar(page.getByRole('tab', { name: NOME_DA_ABA_DAS_EMPRESAS }), hasTouch)
  await expect(page).toHaveURL(ENDERECO_DAS_EMPRESAS, { timeout: PRAZO_DA_ENTRADA_MS })
}

test.describe('Privacidade: as empresas que recebem dados da escola', () => {
  test('a coordenação lê as empresas vigentes e as passadas da escola dela, com o que cada uma faz, recebe e processa, e não lê as de outra escola', async ({ page, hasTouch }) => {
    const coordenadora = await criarEquipeComSenha('coordenador')
    const outra = await criarEscolaSintetica()
    const m = marca()
    const hospedagem = `Hospedagem ${m}`
    const provedor = `Provedor de IA ${m}`
    const antiga = `Antiga ${m}`
    const deOutraEscola = `Só da outra escola ${m}`
    await cadastrarSuboperadorDeTeste({ nome: hospedagem, escolas: [coordenadora.escolaId], pais: 'BR', categorias: ['cadastro', 'conta_de_acesso'], vedaTreinamento: true, finalidade: 'Guarda o banco e os arquivos da escola' })
    await cadastrarSuboperadorDeTeste({ nome: provedor, escolas: [coordenadora.escolaId], pais: 'US', categorias: ['conversa_do_aluno'], vedaTreinamento: false })
    await cadastrarSuboperadorDeTeste({ nome: antiga, escolas: [coordenadora.escolaId], encerrado: true })
    await cadastrarSuboperadorDeTeste({ nome: deOutraEscola, escolas: [outra.escolaId] })
    await abrirAsEmpresas(page, hasTouch, coordenadora)

    await expect(page.getByRole('tab', { name: NOME_DA_ABA_DAS_EMPRESAS })).toHaveAttribute('aria-selected', 'true')
    await expect(secao(page, SECAO_DAS_VIGENTES)).toContainText(hospedagem, { timeout: PRAZO_DA_ENTRADA_MS })

    const daHospedagem = linhaDaEmpresa(page, hospedagem)
    await expect(daHospedagem).toHaveCount(1)
    await expect(daHospedagem).toContainText('Guarda o banco e os arquivos da escola')
    await expect(daHospedagem).toContainText('Cadastro de alunos, professores e turmas; E-mail e senha de acesso de professores e da coordenação')
    await expect(daHospedagem).toContainText('Brasil')
    await expect(daHospedagem).toContainText('O contrato proíbe usar o dado para treinar IA')
    await expect(daHospedagem).toContainText(/Desde \d{2}\/\d{2}\/\d{4}/)
    // O contrato que não proíbe é dito, e o país que não é o Brasil também.
    const doProvedor = linhaDaEmpresa(page, provedor)
    await expect(doProvedor).toHaveCount(1)
    await expect(doProvedor).toContainText('Conversa do aluno com o Tutor')
    await expect(doProvedor).toContainText('Estados Unidos')
    await expect(doProvedor).toContainText('O contrato não proíbe usar o dado para treinar IA')
    // A encerrada fica à parte, com o começo e o fim; não está entre as vigentes.
    await expect(secao(page, SECAO_DAS_VIGENTES)).not.toContainText(antiga)
    const daAntiga = secao(page, SECAO_DAS_PASSADAS).locator('tr, li').filter({ hasText: antiga })
    await expect(daAntiga).toHaveCount(1)
    await expect(daAntiga).toContainText(/De \d{2}\/\d{2}\/\d{4} até \d{2}\/\d{2}\/\d{4}/)
    // Nada da outra escola, e nada que seja da operação.
    await expect(principal(page)).not.toContainText(deOutraEscola)
    await expect(principal(page)).not.toContainText('DPA-E2E')
    await expect(principal(page)).not.toContainText('equipe-de-teste')

    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('as duas abas se alternam pelo clique ou toque, e o endereço guarda a aba', async ({ page, hasTouch }) => {
    const coordenadora = await criarEquipeComSenha('coordenador')
    const nome = `Hospedagem ${marca()}`
    await cadastrarSuboperadorDeTeste({ nome, escolas: [coordenadora.escolaId] })
    await abrirAsEmpresas(page, hasTouch, coordenadora)
    await expect(secao(page, SECAO_DAS_VIGENTES)).toContainText(nome, { timeout: PRAZO_DA_ENTRADA_MS })

    await page.reload()
    await expect(page).toHaveURL(ENDERECO_DAS_EMPRESAS)
    await expect(page.getByRole('tab', { name: NOME_DA_ABA_DAS_EMPRESAS })).toHaveAttribute('aria-selected', 'true')
    await expect(secao(page, SECAO_DAS_VIGENTES)).toContainText(nome, { timeout: PRAZO_DA_ENTRADA_MS })

    await acionar(page.getByRole('tab', { name: NOME_DA_ABA }), hasTouch)
    await expect(page).toHaveURL(ENDERECO_DA_RETENCAO)
    await expect(categorias(page)).toBeVisible()
    await expect(principal(page)).not.toContainText(nome)
  })

  test('os estados: carregando, erro com "Tentar de novo", vazio, só passadas e com dado', async ({ page, hasTouch }) => {
    const segurada = portao()
    let modo: 'erro' | 'vazio' | 'so_passadas' | 'real' = 'erro'
    const passada = { chave: 'antiga-do-estado', nome: `Antiga do estado ${marca()}`, finalidade: 'Hospedagem', pais: 'BR', categorias: ['cadastro'], vedaTreinamento: true, inicio: '2026-01-05T12:00:00.000Z', fim: '2026-02-20T12:00:00.000Z' }
    await page.route(
      (url) => url.pathname === '/v1/privacidade/suboperadores',
      async (rota: Route) => {
        await segurada.aberta
        if (modo === 'erro') return rota.fulfill({ status: 503, contentType: 'application/json', body: INDISPONIVEL })
        if (modo === 'vazio') return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ suboperadores: [] }) })
        if (modo === 'so_passadas') return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ suboperadores: [passada] }) })
        return rota.continue()
      },
    )
    const coordenadora = await criarEquipeComSenha('coordenador')
    const real = `Hospedagem real ${marca()}`
    await cadastrarSuboperadorDeTeste({ nome: real, escolas: [coordenadora.escolaId] })
    await abrirAsEmpresas(page, hasTouch, coordenadora)

    await expect(principal(page).getByRole('status').filter({ hasText: CARREGANDO_AS_EMPRESAS })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    segurada.abrir()
    await expect(principal(page).getByRole('alert')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('button', { name: 'Tentar de novo' })).toBeVisible()

    // Vazio: nenhuma empresa recebe dado da escola, e a tela diz isso; não há seção de passadas.
    modo = 'vazio'
    await acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)
    await expect(principal(page).getByText(VAZIO_DAS_EMPRESAS)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByRole('alert')).toHaveCount(0)
    await expect(principal(page).getByRole('region', { name: SECAO_DAS_PASSADAS })).toHaveCount(0)

    // Só passadas: o vazio das vigentes continua, e a passada aparece com o período.
    modo = 'so_passadas'
    await page.reload()
    await expect(principal(page).getByText(VAZIO_DAS_EMPRESAS)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const daPassada = secao(page, SECAO_DAS_PASSADAS).locator('tr, li').filter({ hasText: passada.nome })
    await expect(daPassada).toHaveCount(1, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(daPassada).toContainText('De 05/01/2026 até 20/02/2026')

    // Com dado: a resposta real, com a empresa que o teste cadastrou, e sem o vazio.
    modo = 'real'
    await page.reload()
    await expect(secao(page, SECAO_DAS_VIGENTES)).toContainText(real, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page).getByText(VAZIO_DAS_EMPRESAS)).toHaveCount(0)
  })

  test('a segunda pessoa na mesma aba não vê as empresas da anterior, nem enquanto as dela não chegaram', async ({ page, hasTouch }) => {
    const primeira = await criarEquipeComSenha('coordenador')
    const daPrimeira = `Só da primeira escola ${marca()}`
    await cadastrarSuboperadorDeTeste({ nome: daPrimeira, escolas: [primeira.escolaId] })
    await abrirAsEmpresas(page, hasTouch, primeira)
    await expect(secao(page, SECAO_DAS_VIGENTES)).toContainText(daPrimeira, { timeout: PRAZO_DA_ENTRADA_MS })

    await abrirNavegacao(page, hasTouch)
    await acionar(lateral(page).getByRole('button', { name: 'Sair' }), hasTouch)
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })

    const segunda = await criarEquipeComSenha('coordenador')
    // A resposta da segunda pessoa fica segurada: enquanto ela não chega, a tela não pode mostrar a empresa da primeira.
    const segurada = portao()
    await page.route(
      (url) => url.pathname === '/v1/privacidade/suboperadores',
      async (rota: Route) => {
        await segurada.aberta
        return rota.continue()
      },
    )
    await entrarComoCoordenacaoNaMesmaAba(page, segunda, hasTouch)
    await esperarGovernanca(page)
    await irPelaNavegacao(page, 'Privacidade', hasTouch)
    await acionar(page.getByRole('tab', { name: NOME_DA_ABA_DAS_EMPRESAS }), hasTouch)
    await expect(principal(page).getByRole('status').filter({ hasText: CARREGANDO_AS_EMPRESAS })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).not.toContainText(daPrimeira)

    segurada.abrir()
    await expect(principal(page).getByRole('status').filter({ hasText: CARREGANDO_AS_EMPRESAS })).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal(page)).not.toContainText(daPrimeira)
  })
})
