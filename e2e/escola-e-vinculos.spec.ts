import type { Locator, Page, Route } from '@playwright/test'
import { AVISO_DA_TROCA_RECUSADA, MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { AVISO_DO_COMPLEMENTO, EFEITO_DA_CONTESTACAO, NOME_DA_CONTESTACAO, NOME_DO_ESTADO_DE_VINCULO } from '../packages/shared/src/estrutura/vinculo.ts'
import {
  codigoDoAutenticador,
  criarAlocacaoDoProfessor,
  criarAlunoComMatricula,
  criarEquipeComSenha,
  criarUsuarioEmOutraEscola,
  liberarProvedorDaEscola,
  ligarContaExterna,
  type EquipeDeTeste,
} from './__fixtures__/sessao.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, focoVisivel, larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

const ROTA_MEUS_VINCULOS = '**/v1/meus-vinculos*'
const ROTA_CONFIRMAR = '**/v1/vinculos/*/confirmar'
const ROTA_CONTESTAR = '**/v1/vinculos/*/contestar'
/** O Chromebook com CPU ×4 e rede Fast 3G carrega a página e ainda faz o hash da senha no servidor. */
const PRAZO_DA_ENTRADA_MS = 20_000
/** O login pela conta da escola passa por três navegações e o discovery do provedor. */
const PRAZO_DO_LOGIN_EXTERNO_MS = 40_000
/** Um passo do TOTP à frente: a ativação grava o passo usado, e só um passo maior entra depois (6.0). */
const PASSO_SEGUINTE_SEGUNDOS = 30

/** Os usuários sintéticos do `oidc-falso` (infra/oidc-falso/config.json), escolhidos pelo nome digitado no login dele. */
const CONTA_NO_PROVEDOR = 'google-aluna-a'
const SUJEITO_NO_PROVEDOR = 'google-sub-aluna-a'
const DOMINIO_DA_ESCOLA = 'escola-a.educa-sintetica.test'

const campoEmail = (page: Page) => page.getByLabel('E-mail')
const campoSenha = (page: Page) => page.getByLabel('Senha')

/** Toque no celular, clique no Chromebook: a mesma ação pela entrada que cada aparelho tem. */
async function acionar(page: Page, nome: string | RegExp, hasTouch: boolean, papel: 'button' | 'link' = 'button'): Promise<void> {
  const alvo = page.getByRole(papel, { name: nome })
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

async function esperarAlvoDeToque(alvo: Locator, descricao: string): Promise<void> {
  const caixa = await alvo.boundingBox()
  expect(caixa, `${descricao} sem caixa`).not.toBeNull()
  expect(caixa?.width ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
  expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
}

async function entrarPorEmail(page: Page, equipe: EquipeDeTeste, hasTouch: boolean): Promise<void> {
  await campoEmail(page).fill(equipe.email)
  await campoSenha(page).fill(equipe.senha)
  await acionar(page, /^Entrar$/, hasTouch)
}

/** A área autenticada de uma escola: o nome de quem entrou e o nome dela. */
async function esperarEscola(page: Page, nome: string, escolaNome: string): Promise<void> {
  await expect(page.getByRole('heading', { name: `Olá, ${nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  await expect(page.getByRole('main')).toContainText(escolaNome)
}

/** O formulário do `oidc-falso`, que faz o papel da tela do Google: o nome digitado ali é o `subject` do usuário. */
async function entrarNoProvedorFalso(page: Page, sujeito: string): Promise<void> {
  await page.route('**://fonts.googleapis.com/**', (rota: Route) => rota.abort())
  await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: PRAZO_DO_LOGIN_EXTERNO_MS })
  await page.locator('input[name="username"]').fill(sujeito)
  await page.locator('input[type="submit"]').click()
}

/**
 * Caminha pelo teclado até o alvo, como quem não usa o mouse (regra 50, item 11). Falha se ele não estiver na ordem
 * de foco: tela alcançável só por clique é tela que exclui gente, e edital de escola pública cobra isso.
 */
async function tabAte(page: Page, alvo: Locator, descricao: string, maximoDeTeclas = 30): Promise<void> {
  for (let tecla = 0; tecla < maximoDeTeclas; tecla++) {
    await page.keyboard.press('Tab')
    if (await alvo.evaluate((elemento) => elemento === document.activeElement)) {
      expect(await focoVisivel(page), `foco invisível em ${descricao}`).toBe(true)
      return
    }
  }
  throw new Error(`${descricao} não foi alcançado pelo teclado em ${String(maximoDeTeclas)} teclas`)
}

/** Abre o seletor de escola do cabeçalho, que é um `details`. */
async function abrirSeletor(page: Page, hasTouch: boolean): Promise<void> {
  const resumo = page.locator('summary')
  if (hasTouch) await resumo.tap()
  else await resumo.click()
}

test.describe('escolher e trocar de escola', () => {
  test('a professora com duas escolas escolhe por onde entra, só com teclado, e vê escola e papel de cada acesso', async ({ page }) => {
    const emA = await criarEquipeComSenha()
    const emB = await criarUsuarioEmOutraEscola(emA.contaId)
    await page.goto('/entrar')

    await page.keyboard.press('Tab')
    await page.keyboard.type(emA.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(emA.senha)
    await page.keyboard.press('Enter')

    await expect(page.getByRole('heading', { name: 'Escolher a escola' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // Sem a lista que vem junto com o desafio, esta tela não teria o que mostrar: não há sessão para consultar nada.
    await expect(page.getByRole('button', { name: `${emA.escolaNome} · professor` })).toBeVisible()
    await expect(page.getByRole('button', { name: `${emB.escolaNome} · professor` })).toBeVisible()
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Alcança a escolha só com o teclado, e o foco aparece.
    await page.keyboard.press('Tab')
    expect(await focoVisivel(page)).toBe(true)
    await page.getByRole('button', { name: `${emB.escolaNome} · professor` }).focus()
    await page.keyboard.press('Enter')

    await esperarEscola(page, 'Professora sintética na outra escola', emB.escolaNome)
    expect(new URL(page.url()).pathname).toBe('/')
    // O nome de A aparece no seletor, e só ali: é um acesso da própria conta. O nome de quem ela é em A, não.
    await expect(page.getByRole('main')).not.toContainText(emA.escolaNome)
    await expect(page.locator('body')).not.toContainText(emA.nome)
  })

  test('isolamento: trocar de escola pelo seletor não leva a turma da escola anterior, nem pelo histórico', async ({ page, hasTouch }) => {
    const emA = await criarEquipeComSenha()
    const emB = await criarUsuarioEmOutraEscola(emA.contaId)
    const alocacao = await criarAlocacaoDoProfessor(emA.escolaId, emA.usuarioId)

    await page.goto('/entrar')
    await entrarPorEmail(page, emA, hasTouch)
    await acionar(page, `${emA.escolaNome} · professor`, hasTouch)
    await esperarEscola(page, emA.nome, emA.escolaNome)

    await acionar(page, 'Meus vínculos', hasTouch, 'link')
    await expect(page.getByRole('main')).toContainText(alocacao.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })

    await abrirSeletor(page, hasTouch)
    await esperarAlvoDeToque(page.getByRole('button', { name: `${emB.escolaNome} · professor` }), 'a escola de destino no seletor')
    await acionar(page, `${emB.escolaNome} · professor`, hasTouch)

    // A troca volta à página inicial, já da escola de destino.
    await esperarEscola(page, 'Professora sintética na outra escola', emB.escolaNome)
    expect(new URL(page.url()).pathname).toBe('/')
    // Sem o esvaziamento do cache na troca, a turma de A continuaria no cliente e apareceria na tela de B. O nome da
    // escola A segue no seletor, e só nele: ele é um acesso da própria conta, e não dado da escola A.
    await expect(page.locator('body')).not.toContainText(alocacao.turmaNome)
    await expect(page.locator('body')).not.toContainText(emA.nome)

    // E nem voltando pelo histórico: o que saiu do cliente não volta.
    await page.goBack()
    await expect(page.locator('body')).not.toContainText(alocacao.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })

    // A janela que importa: voltar aos vínculos, já em B, com a lista segurada. É aqui que a turma de A apareceria
    // se tivesse ficado no cliente — depois que a resposta de B chega, a ausência já não prova nada.
    let liberar: () => void = () => undefined
    const segurada = new Promise<void>((resolver) => (liberar = resolver))
    await page.route(ROTA_MEUS_VINCULOS, async (rota: Route) => {
      await segurada
      await rota.continue()
    })
    await acionar(page, 'Meus vínculos', hasTouch, 'link')
    await expect(page.getByText('Carregando os seus vínculos…')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.locator('body')).not.toContainText(alocacao.turmaNome)
    liberar()
    await expect(page.getByText('Nenhuma turma alocada ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.locator('body')).not.toContainText(alocacao.turmaNome)
  })

  test('o aluno não tem seletor nem vínculos: a conta dele é só da escola dele', async ({ page, hasTouch }) => {
    const aluno = await criarAlunoComMatricula()
    await page.goto(`/e/${aluno.slug}`)
    await page.getByLabel('Matrícula').fill(aluno.matricula)
    await campoSenha(page).fill(aluno.senha)
    await acionar(page, /^Entrar$/, hasTouch)
    await esperarEscola(page, aluno.nome, aluno.escolaNome)

    // O aluno entra por matrícula e não tem conta (regra 20, item 2): não há outra escola para listar, e é por isso
    // que a troca de escola nunca começa por ele. O cabeçalho diz só onde ele está.
    await expect(page.locator('summary')).toHaveCount(0)
    await expect(page.getByRole('banner')).toContainText(aluno.escolaNome)
    // Vínculo é do professor: o aluno não confirma turma nenhuma (RF4).
    await expect(page.getByRole('link', { name: 'Meus vínculos' })).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('isolamento: a troca que passa pelo segundo fator também não leva nada da escola de origem para a de destino', async ({ page, hasTouch }) => {
    const emA = await criarEquipeComSenha()
    const emB = await criarUsuarioEmOutraEscola(emA.contaId, 'coordenador')
    const alocacao = await criarAlocacaoDoProfessor(emA.escolaId, emA.usuarioId)

    // Primeiro acesso: ela escolhe a escola onde coordena e configura o segundo fator, que a partir daí é da conta.
    const respostaDoSegredo = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/configurar')
    await page.goto('/entrar')
    await entrarPorEmail(page, emA, hasTouch)
    await acionar(page, `${emB.escolaNome} · coordenação`, hasTouch)
    await expect(page.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    const { segredo } = (await (await respostaDoSegredo).json()) as { segredo: string }
    await page.getByLabel(/Código do aplicativo|Digite o código que o aplicativo mostra/).fill(codigoDoAutenticador(segredo))
    await acionar(page, /Ativar o segundo fator|Ativando/, hasTouch)
    await acionar(page, 'Ir para a entrada', hasTouch, 'link')

    // Agora ela entra na escola onde dá aula, e carrega os vínculos dela lá.
    await entrarPorEmail(page, emA, hasTouch)
    await acionar(page, `${emA.escolaNome} · professor`, hasTouch)
    await esperarEscola(page, emA.nome, emA.escolaNome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')
    await expect(page.getByRole('main')).toContainText(alocacao.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })

    // E troca para a escola onde coordena. A sessão de origem continua valendo até o código ser aceito: é por isso
    // que esvaziar o cache aqui, antes do token de destino, traria de volta o dado da escola de origem — com a
    // credencial dela, que ainda funciona (regra 10, item 1).
    await abrirSeletor(page, hasTouch)
    await acionar(page, `${emB.escolaNome} · coordenação`, hasTouch)
    await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await page.getByLabel('Código do aplicativo').fill(codigoDoAutenticador(segredo, PASSO_SEGUINTE_SEGUNDOS))
    await acionar(page, /^Entrar$|Entrando/, hasTouch)

    await esperarEscola(page, 'Professora sintética na outra escola', emB.escolaNome)
    // Nada da escola onde ela dá aula pode aparecer dentro da escola onde ela coordena. O nome de A segue só no
    // seletor, que é acesso da própria conta.
    await expect(page.getByRole('main')).not.toContainText(emA.escolaNome)
    await expect(page.locator('body')).not.toContainText(alocacao.turmaNome)
    await expect(page.locator('body')).not.toContainText(emA.nome)
  })

  test('trocar para uma escola onde ela coordena passa pelo segundo fator antes de qualquer sessão nova', async ({ page, hasTouch }) => {
    const emA = await criarEquipeComSenha()
    const emB = await criarUsuarioEmOutraEscola(emA.contaId, 'coordenador')

    await page.goto('/entrar')
    await entrarPorEmail(page, emA, hasTouch)
    await acionar(page, `${emA.escolaNome} · professor`, hasTouch)
    await esperarEscola(page, emA.nome, emA.escolaNome)

    await abrirSeletor(page, hasTouch)
    await acionar(page, `${emB.escolaNome} · coordenação`, hasTouch)

    // Coordenar exige o segundo fator sempre, mesmo vindo de uma sessão já aberta (Tech Spec, seção 5).
    await expect(page.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveURL(/\/mfa\/configurar$/)
    await expect(page.locator('body')).not.toContainText(emB.escolaNome)
  })

  test('quem entrou pela conta da escola não troca por aqui: o seletor explica e oferece a entrada por e-mail', async ({ page, hasTouch }) => {
    const emA = await criarEquipeComSenha()
    const emB = await criarUsuarioEmOutraEscola(emA.contaId)
    await liberarProvedorDaEscola(emA.escolaId, 'google', DOMINIO_DA_ESCOLA)
    await ligarContaExterna(emA.escolaId, emA.usuarioId, { provedor: 'google', sujeito: SUJEITO_NO_PROVEDOR })

    await page.goto(`/e/${emA.slug}`)
    await acionar(page, /Entrar com a conta Google/, hasTouch, 'link')
    await entrarNoProvedorFalso(page, CONTA_NO_PROVEDOR)
    await expect(page.getByRole('heading', { name: `Olá, ${emA.nome}` })).toBeVisible({ timeout: PRAZO_DO_LOGIN_EXTERNO_MS })

    await abrirSeletor(page, hasTouch)
    await acionar(page, `${emB.escolaNome} · professor`, hasTouch)

    // A API recusa a troca de uma sessão que não é de e-mail, e a tela diz o que fazer em vez de mostrar o código.
    await expect(page.getByRole('alert')).toContainText(AVISO_DA_TROCA_RECUSADA, { timeout: PRAZO_DA_ENTRADA_MS })
    for (const proibido of ['NAO_ENCONTRADO', '404']) await expect(page.locator('body')).not.toContainText(proibido)
    // E continua na escola em que estava, com a sessão de pé.
    await esperarEscola(page, emA.nome, emA.escolaNome)
  })
})

test.describe('vínculos do professor', () => {
  test('duas disciplinas na mesma turma: confirma uma, contesta a outra, e cada uma fica no seu estado, em texto', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['Matemática', 'História'])

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarEscola(page, professora.nome, professora.escolaNome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')

    const matematica = page.getByRole('listitem').filter({ hasText: 'Matemática' })
    const historia = page.getByRole('listitem').filter({ hasText: 'História' })
    await expect(matematica).toContainText(`${alocacao.turmaNome} · Matemática`, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(matematica).toContainText(NOME_DO_ESTADO_DE_VINCULO.pendente)
    await expect(historia).toContainText(NOME_DO_ESTADO_DE_VINCULO.pendente)
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
    await esperarAlvoDeToque(matematica.getByRole('button', { name: 'Confirmar' }), 'o botão de confirmar o vínculo')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Confirma só a de matemática: a outra continua esperando.
    if (hasTouch) await matematica.getByRole('button', { name: 'Confirmar' }).tap()
    else await matematica.getByRole('button', { name: 'Confirmar' }).click()
    await expect(matematica).toContainText(NOME_DO_ESTADO_DE_VINCULO.confirmado, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(historia).toContainText(NOME_DO_ESTADO_DE_VINCULO.pendente)

    // Contesta a de história, com o motivo e o complemento.
    if (hasTouch) await historia.getByRole('button', { name: 'Contestar' }).tap()
    else await historia.getByRole('button', { name: 'Contestar' }).click()
    // O texto livre é lido pela coordenação: a tela avisa, ali mesmo, para não escrever nome de aluno (regra 20).
    await expect(historia).toContainText(AVISO_DO_COMPLEMENTO)
    // Ação oficial: o que vai acontecer aparece antes de enviar (regra 50, item 8).
    await expect(historia).toContainText(EFEITO_DA_CONTESTACAO)

    await historia.getByRole('radio', { name: NOME_DA_CONTESTACAO.nao_leciono }).check()
    await historia.getByRole('textbox').fill('Quem dá história nesta turma é o outro professor.')
    expect(await violacoesGraves(page)).toEqual([])
    expect(await larguraExcedente(page)).toBe(0)
    if (hasTouch) await historia.getByRole('button', { name: 'Enviar a contestação' }).tap()
    else await historia.getByRole('button', { name: 'Enviar a contestação' }).click()

    await expect(historia).toContainText(NOME_DO_ESTADO_DE_VINCULO.contestado, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(historia).toContainText(NOME_DA_CONTESTACAO.nao_leciono)
    // O estado de cada um é o seu: confirmar um não decide o outro (caso de borda do PRD).
    await expect(matematica).toContainText(NOME_DO_ESTADO_DE_VINCULO.confirmado)
  })

  test('o cartão se resolve inteiro pelo teclado: Tab até o botão, motivo com a barra de espaço e Enter para enviar', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['Matemática'])

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarEscola(page, professora.nome, professora.escolaNome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')
    await expect(page.getByRole('main')).toContainText(alocacao.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })

    // Abre a contestação sem tocar no mouse.
    await tabAte(page, page.getByRole('button', { name: 'Contestar' }), 'o botão de contestar')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('group', { name: 'O que está errado neste vínculo?' })).toBeVisible()

    // Escolhe o motivo pelo teclado: o grupo de rádio começa sem nada marcado, e a barra de espaço marca o focado.
    const primeiroMotivo = page.getByRole('radio', { name: NOME_DA_CONTESTACAO.nao_leciono })
    await tabAte(page, primeiroMotivo, 'o primeiro motivo da contestação')
    await page.keyboard.press('Space')
    await expect(primeiroMotivo).toBeChecked()

    await tabAte(page, page.getByRole('textbox'), 'o complemento da contestação')
    await page.keyboard.type('Nunca dei aula nesta turma.')
    await tabAte(page, page.getByRole('button', { name: 'Enviar a contestação' }), 'o botão de enviar a contestação')
    await page.keyboard.press('Enter')

    await expect(page.getByRole('main')).toContainText(NOME_DO_ESTADO_DE_VINCULO.contestado, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('main')).toContainText(NOME_DA_CONTESTACAO.nao_leciono)
  })

  test('contestar sem escolher o motivo não manda nada, e o clique repetido em confirmar não decide duas vezes', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['Matemática', 'História'])

    let contestacoes = 0
    await page.route(ROTA_CONTESTAR, async (rota: Route) => {
      contestacoes++
      await rota.continue()
    })
    let confirmacoes = 0
    let liberar: () => void = () => undefined
    const segurada = new Promise<void>((resolver) => (liberar = resolver))
    await page.route(ROTA_CONFIRMAR, async (rota: Route) => {
      confirmacoes++
      await segurada
      await rota.continue()
    })

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarEscola(page, professora.nome, professora.escolaNome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')

    const historia = page.getByRole('listitem').filter({ hasText: 'História' })
    await expect(historia).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    if (hasTouch) await historia.getByRole('button', { name: 'Contestar' }).tap()
    else await historia.getByRole('button', { name: 'Contestar' }).click()
    await historia.getByRole('textbox').fill('sem motivo escolhido')
    if (hasTouch) await historia.getByRole('button', { name: 'Enviar a contestação' }).tap()
    else await historia.getByRole('button', { name: 'Enviar a contestação' }).click()
    // Contestação sem código não é contestação: a coordenação receberia um vínculo travado e sem motivo.
    await expect(historia).toContainText(NOME_DO_ESTADO_DE_VINCULO.pendente)
    expect(contestacoes).toBe(0)

    const matematica = page.getByRole('listitem').filter({ hasText: 'Matemática' })
    const confirmar = matematica.getByRole('button', { name: /Confirmar|Confirmando/ })
    if (hasTouch) await confirmar.tap()
    else await confirmar.click()
    await expect(confirmar).toBeDisabled()
    // Duas confirmações do mesmo vínculo são duas decisões oficiais registradas com autor e data.
    await confirmar.dispatchEvent('click')
    liberar()
    await expect(matematica).toContainText(NOME_DO_ESTADO_DE_VINCULO.confirmado, { timeout: PRAZO_DA_ENTRADA_MS })
    expect(confirmacoes).toBe(1)
  })

  test('os quatro estados: carregando, erro com nova tentativa, vazio convidando a falar com a coordenação, e a lista', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()

    let segurar = true
    let falhar = false
    let liberar: () => void = () => undefined
    let segurada = new Promise<void>((resolver) => (liberar = resolver))
    await page.route(ROTA_MEUS_VINCULOS, async (rota: Route) => {
      if (segurar) await segurada
      if (falhar) {
        return rota.fulfill({
          status: 503,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }),
        })
      }
      return rota.continue()
    })

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarEscola(page, professora.nome, professora.escolaNome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')

    // Carregando.
    await expect(page.getByText('Carregando os seus vínculos…')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    // Erro: a tela fica de pé e oferece tentar de novo (regra 80, item 6).
    falhar = true
    liberar()
    await expect(page.getByRole('alert')).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()

    // Vazio: a professora ainda não foi alocada, e o vazio diz o que fazer.
    falhar = false
    segurar = false
    await acionar(page, 'Tentar de novo', hasTouch)
    await expect(page.getByText('Nenhuma turma alocada ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.getByRole('main')).toContainText('Fale com ela')
    // Sem lista, o que resta na ordem de foco é o cabeçalho, e ele continua alcançável com foco visível.
    await tabAte(page, page.getByRole('link', { name: 'Início' }), 'o caminho de volta no cabeçalho')
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // Com dado: a coordenação alocou, e a lista aparece na busca seguinte.
    const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId)
    segurar = true
    segurada = new Promise<void>((resolver) => (liberar = resolver))
    await page.reload()
    await expect(page.getByText('Carregando os seus vínculos…')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    liberar()
    await expect(page.getByRole('main')).toContainText(alocacao.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
