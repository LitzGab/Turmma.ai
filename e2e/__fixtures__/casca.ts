import type { Locator, Page } from '@playwright/test'
import { expect } from './perfis.ts'
import { campoCodigo } from './segundo-fator.ts'
import { codigoDoAutenticador, criarEquipeComSenha, type EquipeDeTeste } from './sessao.ts'

/**
 * A casca da escola pela tela (A1, tarefa 11.0): abaixo de 768 px a lateral é uma gaveta que abre pelo botão do menu; no
 * computador ela já está aberta. Os specs que andam pela navegação passam por aqui, para o mesmo teste valer nos
 * projetos `chromebook` e `celular` (D51).
 */

/** A casca está na largura da gaveta: a barra do topo com o botão do menu, e a lateral fechada. */
export function naGaveta(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 768
}

/** A gaveta aberta, o `dialog` modal com a lateral dentro. */
export const gaveta = (page: Page): Locator => page.getByRole('dialog', { name: 'Menu' })

/**
 * Onde a lateral está agora: dentro da gaveta, quando é gaveta, ou a página. Com a gaveta aberta, o "Sair" da barra do
 * topo continua na página, atrás dela: procurar a partir daqui acha o da lateral.
 */
export function lateral(page: Page): Locator {
  return naGaveta(page) ? gaveta(page) : page.locator('body')
}

/** Abre a gaveta, se a casca está nela e ela ainda está fechada; no computador não faz nada. */
export async function abrirNavegacao(page: Page, hasTouch: boolean): Promise<void> {
  if (!naGaveta(page) || (await gaveta(page).isVisible())) return
  const menu = page.getByRole('button', { name: 'Abrir o menu' })
  if (hasTouch) await menu.tap()
  else await menu.click()
  await expect(gaveta(page)).toBeVisible()
}

/** Vai a uma seção pela navegação da lateral, abrindo a gaveta antes quando é preciso. */
export async function irPelaNavegacao(page: Page, rotulo: string, hasTouch: boolean): Promise<void> {
  await abrirNavegacao(page, hasTouch)
  const item = lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: rotulo })
  if (hasTouch) await item.tap()
  else await item.click()
}

/**
 * O botão que abre o seletor de escola, no topo da lateral (P30; A1, 12.0). Só existe para quem tem mais de uma escola;
 * com uma só, a lateral mostra o nome dela e não há o que abrir. O nome acessível começa por "Escola:", que as linhas da
 * lista não têm.
 */
export const botaoDoSeletor = (page: Page): Locator => lateral(page).getByRole('button', { name: /^Escola: / })

/** O nome acessível da linha de uma escola no seletor: a escola, a rede e o papel, como a lista os mostra. */
export function nomeNoSeletor(acesso: { readonly escolaNome: string; readonly redeNome: string }, papel: 'professor' | 'coordenação'): string {
  return `${acesso.escolaNome}, ${acesso.redeNome} · ${papel}`
}

/** A linha de uma escola na lista aberta do seletor, pelo nome exato (o botão que abre a lista leva o da escola de agora). */
export const linhaDoSeletor = (page: Page, nome: string): Locator => lateral(page).getByRole('button', { name: nome, exact: true })

/** Abre o seletor de escola, abrindo antes a gaveta quando a casca está nela. */
export async function abrirSeletorDeEscola(page: Page, hasTouch: boolean): Promise<void> {
  await abrirNavegacao(page, hasTouch)
  const botao = botaoDoSeletor(page)
  if (hasTouch) await botao.tap()
  else await botao.click()
  await expect(botao).toHaveAttribute('aria-expanded', 'true')
}

/** Abre o seletor e escolhe a escola daquela linha. */
export async function escolherNoSeletor(page: Page, nome: string, hasTouch: boolean): Promise<void> {
  await abrirSeletorDeEscola(page, hasTouch)
  const linha = linhaDoSeletor(page, nome)
  if (hasTouch) await linha.tap()
  else await linha.click()
}

/** O Chromebook com CPU ×4 e rede Fast 3G carrega a página e ainda faz o hash da senha no servidor. */
export const PRAZO_DA_ENTRADA_MS = 20_000

/** Um passo do TOTP à frente: a ativação grava o passo usado, e só um passo maior entra depois (6.0 do F1). */
const PASSO_SEGUINTE_SEGUNDOS = 30

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

/** Entra por e-mail e senha a partir da tela de entrada já aberta, sem recarregar a página. */
export async function entrarPorEmail(page: Page, pessoa: EquipeDeTeste, hasTouch: boolean): Promise<void> {
  await page.getByLabel('E-mail').fill(pessoa.email)
  await page.getByLabel('Senha').fill(pessoa.senha)
  await acionar(page.getByRole('button', { name: /^Entrar$/ }), hasTouch)
}

/** O título da aba na tela em que o professor abre. */
export const TITULO_DA_NOVA_CONVERSA = 'Nova conversa · Turmma'

/**
 * O professor abre em "Nova conversa" (A2; D73; `docs/interface.md` 11.1), e não mais na página "Início": o endereço, a
 * saudação com o primeiro nome dele e, na lateral, o nome inteiro de quem entrou. É o que prova que a sessão vale e de
 * quem ela é: a saudação sozinha não distingue duas professoras de mesmo primeiro nome.
 *
 * No celular a lateral é a gaveta, fechada: o nome está nela, fora da vista, e o teste o lê sem abri-la.
 */
export async function esperarNovaConversa(page: Page, nome: string, opcoes: { readonly timeout?: number; readonly escolaNome?: string } = {}): Promise<void> {
  const timeout = opcoes.timeout ?? PRAZO_DA_ENTRADA_MS
  await expect(page).toHaveURL(/\/professor\/nova-conversa$/, { timeout })
  const primeiroNome = (nome.trim().split(/\s+/)[0] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  await expect(page.getByText(new RegExp(`^(Bom dia|Boa tarde|Boa noite), ${primeiroNome}\\.$`))).toBeVisible({ timeout })
  await expect(naGaveta(page) ? page.locator('dialog[aria-label="Menu"]') : page.locator('body')).toContainText(nome, { timeout })
  if (opcoes.escolaNome !== undefined) await expect(page.getByText(opcoes.escolaNome).first()).toBeVisible({ timeout })
}

/** A professora de uma escola só, em "Nova conversa", onde ela abre. */
export async function entrarComoProfessora(page: Page, hasTouch: boolean): Promise<EquipeDeTeste> {
  const professora = await criarEquipeComSenha()
  await page.goto('/entrar')
  await entrarPorEmail(page, professora, hasTouch)
  await esperarNovaConversa(page, professora.nome)
  return professora
}

/**
 * A coordenação abre em Governança (MVP, A5; `docs/interface.md` 11.1: é a tela que fecha a venda), e não mais em
 * Estrutura: o endereço e a tela. O endereço vem da página inicial, na entrada; a tela, do pedaço dela, que a área
 * carrega por `import()`, e por isso o teste que segura o chunk da área confere só o endereço.
 */
export async function esperarGovernanca(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/coordenacao\/governanca$/, { timeout: PRAZO_DA_ENTRADA_MS })
  await expect(page.getByRole('heading', { level: 1, name: 'Governança' })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
}

/** A Estrutura da coordenação aberta (A1, 13.0): o endereço e a tela. */
export async function esperarEstrutura(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/coordenacao\/estrutura$/, { timeout: PRAZO_DA_ENTRADA_MS })
  await expect(page.getByRole('heading', { level: 1, name: 'Estrutura' })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
}

/**
 * A coordenação que acabou de entrar vai à Estrutura: **confere que abriu em Governança** e segue pela navegação da
 * lateral, sem recarregar a página. É o caminho de quem monta a escola desde a A5.
 */
export async function abrirEstrutura(page: Page, hasTouch: boolean): Promise<void> {
  await esperarGovernanca(page)
  await irPelaNavegacao(page, 'Estrutura', hasTouch)
  await esperarEstrutura(page)
}

/**
 * A coordenadora no primeiro acesso, a partir da tela de entrada já aberta e sem recarregar a página: configura o
 * segundo fator do jeito sem celular, volta à entrada e entra com o código. Sem recarga, o que o teste afirma sobre o
 * cache da pessoa anterior na mesma aba continua valendo. Termina com a aba no endereço da Governança, onde a coordenação
 * abre (A5); quem precisa da tela chama `esperarGovernanca`, e quem vai montar a escola, `abrirEstrutura`.
 */
export async function entrarComoCoordenacaoNaMesmaAba(page: Page, coordenadora: EquipeDeTeste, hasTouch: boolean): Promise<void> {
  const respostaDoSegredo = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/configurar')
  await entrarPorEmail(page, coordenadora, hasTouch)
  await expect(page.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  const { segredo } = (await (await respostaDoSegredo).json()) as { segredo: string }
  await campoCodigo(page).fill(codigoDoAutenticador(segredo))
  await acionar(page.getByRole('button', { name: /Ativar o segundo fator|Ativando/ }), hasTouch)
  await acionar(page.getByRole('link', { name: 'Ir para a entrada' }), hasTouch)
  await entrarPorEmail(page, coordenadora, hasTouch)
  await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  await campoCodigo(page).fill(codigoDoAutenticador(segredo, PASSO_SEGUINTE_SEGUNDOS))
  await acionar(page.getByRole('button', { name: /^Entrar$/ }), hasTouch)
  await expect(page).toHaveURL(/\/coordenacao\/governanca$/, { timeout: PRAZO_DA_ENTRADA_MS })
}
