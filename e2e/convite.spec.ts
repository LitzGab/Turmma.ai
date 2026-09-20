import type { Page, Route } from '@playwright/test'
import { AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE, mensagemDoConvite } from '../packages/shared/src/erros/mensagens.ts'
import { criarConviteDeCoordenador, criarEquipeComSenha } from './__fixtures__/sessao.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

const ROTA_CONSULTAR = '**/v1/convites/consultar'
const PRAZO_DA_TELA_MS = 20_000
/** Senha nova de coordenador: o mínimo do contrato é 12 caracteres. */
const SENHA_NOVA = 'frase-sintetica-do-convite'

/** Todo endereço por onde o navegador passou: nenhum pode carregar o token do convite (regra 20, item 8). */
function seguirEnderecos(page: Page): string[] {
  const enderecos: string[] = []
  page.on('request', (pedido) => enderecos.push(pedido.url()))
  return enderecos
}

test.describe('aceite do convite do primeiro coordenador', () => {
  test('o token sai da barra antes da primeira chamada, e o aceite da conta nova leva ao segundo fator', async ({ page, hasTouch }) => {
    const convite = await criarConviteDeCoordenador()
    const enderecos = seguirEnderecos(page)

    // A consulta fica segurada: é a janela em que o token ainda estaria na barra se a tela o tivesse deixado lá.
    let liberar: () => void = () => undefined
    const segurada = new Promise<void>((resolver) => (liberar = resolver))
    let barraNaPrimeiraChamada = ''
    await page.route(ROTA_CONSULTAR, async (rota: Route) => {
      barraNaPrimeiraChamada = page.url()
      await segurada
      await rota.continue()
    })

    await page.goto(`/convite#${convite.token}`)
    await expect.poll(() => barraNaPrimeiraChamada, { timeout: PRAZO_DA_TELA_MS }).not.toBe('')
    expect(barraNaPrimeiraChamada, 'o token precisa sair da barra antes de a primeira chamada sair').not.toContain(convite.token)
    liberar()

    await expect(page.getByRole('main')).toContainText(convite.escolaNome, { timeout: PRAZO_DA_TELA_MS })
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    const caixa = await page.getByRole('button', { name: /Aceitar o convite/ }).boundingBox()
    expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)

    // A tela tenta o aceite sem senha: a conta nova é recusada sem gastar o convite, e só então a senha é pedida.
    const botaoAceitar = page.getByRole('button', { name: /Aceitar o convite|Aceitando/ })
    if (hasTouch) await botaoAceitar.tap()
    else await botaoAceitar.click()
    await expect(page.getByLabel('Senha nova')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByLabel('Senha nova')).toHaveAttribute('autocomplete', 'new-password')
    await page.getByLabel('Senha nova').fill(SENHA_NOVA)
    if (hasTouch) await page.getByRole('button', { name: /Definir a senha e continuar|Salvando/ }).tap()
    else await page.getByRole('button', { name: /Definir a senha e continuar|Salvando/ }).click()

    // Aceitar não abre sessão: o coordenador vai configurar o segundo fator antes de entrar (RF12).
    await expect(page.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page).toHaveURL(/\/mfa\/configurar$/)

    // Nem na barra, nem em chamada nenhuma, nem em armazenamento do navegador: o link some do computador da escola.
    expect(page.url()).not.toContain(convite.token)
    for (const endereco of enderecos) expect(endereco, 'token do convite numa URL').not.toContain(convite.token)
    const guardado = await page.evaluate(() => ({ local: JSON.stringify(Object.entries(localStorage)), sessao: JSON.stringify(Object.entries(sessionStorage)) }))
    expect(guardado.local).toBe('[]')
    expect(guardado.sessao).toBe('[]')
  })

  test('clique repetido em "Aceitar o convite" não manda dois aceites: o convite vale uma vez só', async ({ page, hasTouch }) => {
    const convite = await criarConviteDeCoordenador()
    let aceites = 0
    let liberar: () => void = () => undefined
    const segurada = new Promise<void>((resolver) => (liberar = resolver))
    await page.route('**/v1/convites/aceitar', async (rota: Route) => {
      aceites++
      await segurada
      await rota.continue()
    })

    await page.goto(`/convite#${convite.token}`)
    await expect(page.getByRole('main')).toContainText(convite.escolaNome, { timeout: PRAZO_DA_TELA_MS })
    const botaoAceitar = page.getByRole('button', { name: /Aceitar o convite|Aceitando/ })
    if (hasTouch) await botaoAceitar.tap()
    else await botaoAceitar.click()

    await expect(botaoAceitar).toBeDisabled()
    await botaoAceitar.dispatchEvent('click')
    liberar()
    await expect(page.getByLabel('Senha nova')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    expect(aceites).toBe(1)
  })

  test('convite expirado, revogado e inexistente pedem um convite novo, com a mesma mensagem', async ({ page }) => {
    const expirado = await criarConviteDeCoordenador({ expirado: true })
    const revogado = await criarConviteDeCoordenador({ revogado: true })
    const mensagem = mensagemDoConvite('NAO_ENCONTRADO')

    for (const token of [expirado.token, revogado.token, 'token-que-nunca-existiu-no-e2e']) {
      await page.goto(`/convite#${token}`)
      await expect(page.getByRole('alert')).toHaveText(mensagem, { timeout: PRAZO_DA_TELA_MS })
      // Nem o nome da escola aparece: a tela não confirma que aquele convite já existiu.
      await expect(page.locator('body')).not.toContainText(expirado.escolaNome)
      await expect(page.locator('body')).not.toContainText(revogado.escolaNome)
      expect(await larguraExcedente(page)).toBe(0)
      expect(await violacoesGraves(page)).toEqual([])
    }
  })

  test('quem já tem conta em outra escola vai para a entrada, sem campo de senha nova, e o login ativa a escola do convite', async ({ page, hasTouch }) => {
    // A professora já trabalha numa escola cliente: a conta dela tem senha, e o link não pode trocá-la.
    const camila = await criarEquipeComSenha('professor')
    const convite = await criarConviteDeCoordenador({ conta: camila })

    await page.goto(`/convite#${convite.token}`)
    await expect(page.getByRole('main')).toContainText(convite.escolaNome, { timeout: PRAZO_DA_TELA_MS })
    const botaoAceitar = page.getByRole('button', { name: /Aceitar o convite|Aceitando/ })
    if (hasTouch) await botaoAceitar.tap()
    else await botaoAceitar.click()

    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByRole('alert')).toContainText(AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE)
    // A tela nunca pede senha nova a quem já tem conta: o que falta é a senha que ela já usa.
    await expect(page.getByLabel('Senha nova')).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])

    await page.getByLabel('E-mail').fill(camila.email)
    await page.getByLabel('Senha').fill(camila.senha)
    if (hasTouch) await page.getByRole('button', { name: /^Entrar$/ }).tap()
    else await page.getByRole('button', { name: /^Entrar$/ }).click()

    // Com o bilhete guardado em memória, o login ativa o usuário da escola que convidou: agora são duas escolas
    // ativas, e a etapa passa a ser a escolha. Sem o bilhete, ela entraria direto na escola antiga.
    await expect(page.getByRole('heading', { name: 'Escolher a escola' })).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page).toHaveURL(/\/escolher-escola$/)
  })
})
