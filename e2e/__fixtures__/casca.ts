import type { Locator, Page } from '@playwright/test'
import { expect } from './perfis.ts'
import { campoCodigo } from './segundo-fator.ts'
import { codigoDoAutenticador, criarEquipeComSenha, type EquipeDeTeste } from './sessao.ts'

/**
 * A casca da escola pela tela (A1, tarefa 11.0; X1, 13.0): abaixo de 768 px a lateral é uma gaveta que abre pelo botão do
 * menu, e os itens do professor e do aluno ficam na **barra de baixo**, sempre à vista; no computador a lateral já está
 * aberta. A coordenação tem os quatro lugares dela na barra de baixo, como o professor e o aluno. Os specs que andam pela navegação passam por aqui, para
 * o mesmo teste valer nos projetos `chromebook` e `celular` (D51).
 */

/**
 * A casca está na largura do celular: a barra do topo com o botão do menu e a lateral fechada, na gaveta. Não diz onde
 * estão os itens de `Seções` (a barra de baixo ou a gaveta): quem pergunta isso é `secoes`.
 */
export function naGaveta(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 768
}

/** A gaveta aberta, o `dialog` modal com a lateral dentro. */
export const gaveta = (page: Page): Locator => page.getByRole('dialog', { name: 'Menu' })

/**
 * Onde a lateral está agora: dentro da gaveta, quando é gaveta, ou a página. Com a gaveta aberta, o "Sair" da barra do
 * topo continua na página, atrás dela: procurar a partir daqui acha o da lateral. Vale para a escola, "Seu time", o
 * rodapé, "Sua conta" e o nome da pessoa; **não vale para `Seções` do professor e do aluno no celular**, que estão na
 * barra de baixo, fora da gaveta: para eles, `secoes`.
 */
export function lateral(page: Page): Locator {
  return naGaveta(page) ? gaveta(page) : page.locator('body')
}

/**
 * A `navigation "Seções"` que a pessoa vê: a barra de baixo (professor e aluno abaixo de 768 px, sempre à vista), a
 * lateral ou o trilho (a partir de 768 px) ou, com a gaveta aberta, a que está dentro dela (a coordenação no celular).
 * Fechada, a gaveta não expõe nada. É a única navegação com esse nome na página: o resto da casca tem os dela ("Seu
 * time", "Rodapé", "Sua conta").
 */
export const secoes = (page: Page): Locator => page.getByRole('navigation', { name: 'Seções', exact: true })

/**
 * O lugar que a barra de baixo toma da janela agora (X1, 13.0): a `--barra-baixo` do `<html>` e o `padding-bottom` do
 * `<main>`, que guarda a variável mais 32 px. Sem barra (a coordenação no celular, o trilho e o computador) a variável é
 * `0px` e o `<main>` guarda só os 32 px.
 */
export async function reservaDaBarraDeBaixo(page: Page): Promise<{ readonly variavel: string; readonly paddingDoMain: string }> {
  return page.evaluate(() => {
    const principal = document.querySelector('main')
    return {
      variavel: getComputedStyle(document.documentElement).getPropertyValue('--barra-baixo').trim(),
      paddingDoMain: principal === null ? '' : getComputedStyle(principal).paddingBottom,
    }
  })
}

/** Abre a gaveta, se a casca está nela e ela ainda está fechada; no computador não faz nada. */
export async function abrirNavegacao(page: Page, hasTouch: boolean): Promise<void> {
  if (!naGaveta(page) || (await gaveta(page).isVisible())) return
  const menu = page.getByRole('button', { name: 'Abrir o menu' })
  if (hasTouch) await menu.tap()
  else await menu.click()
  await expect(gaveta(page)).toBeVisible()
}

/**
 * Vai a uma seção pelo link dela em `Seções`. A gaveta só abre quando `Seções` não está à vista (a coordenação no
 * celular); a barra de baixo do professor e do aluno está sempre à vista. E com a gaveta aberta por outro motivo (o
 * teste foi ver a escola ou a conta), a barra fica inerte: o toque nela cairia no fundo da gaveta e só a fecharia. Por
 * isso a gaveta que não leva `Seções` fecha antes.
 */
export async function irPelaNavegacao(page: Page, rotulo: string, hasTouch: boolean): Promise<void> {
  if ((await gaveta(page).isVisible()) && (await gaveta(page).getByRole('navigation', { name: 'Seções', exact: true }).count()) === 0) {
    await page.keyboard.press('Escape')
    await expect(gaveta(page)).toBeHidden()
  }
  if (!(await secoes(page).first().isVisible())) await abrirNavegacao(page, hasTouch)
  const item = secoes(page).getByRole('link', { name: rotulo })
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

/**
 * O título da aba na tela em que o professor abre: "Início" (D80; era "Nova conversa"), no mesmo endereço
 * `/professor/nova-conversa`. O nome da constante é o de antes, para os specs que a importam não mudarem.
 */
export const TITULO_DA_NOVA_CONVERSA = 'Início · Turmma'

/**
 * O professor abre em "Início" (A2; D73; D80; `docs/interface.md` 11.1), a Home com a caixa de pedido, e não numa página
 * de passagem: o endereço (`/professor/nova-conversa`, que não mudou), a saudação com o primeiro nome dele e, na lateral,
 * o nome inteiro de quem entrou. É o que prova que a sessão vale e de quem ela é: a saudação sozinha não distingue duas
 * professoras de mesmo primeiro nome.
 *
 * No celular a lateral é a gaveta, fechada: o nome está nela, fora da vista, e o teste o lê sem abri-la. A escola ativa
 * está na barra de topo.
 */
export async function esperarNovaConversa(page: Page, nome: string, opcoes: { readonly timeout?: number; readonly escolaNome?: string } = {}): Promise<void> {
  const timeout = opcoes.timeout ?? PRAZO_DA_ENTRADA_MS
  await expect(page).toHaveURL(/\/professor\/nova-conversa$/, { timeout })
  const primeiroNome = (nome.trim().split(/\s+/)[0] ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  await expect(page.getByText(new RegExp(`^(Bom dia|Boa tarde|Boa noite), ${primeiroNome}\\.$`))).toBeVisible({ timeout })
  await expect(naGaveta(page) ? page.locator('dialog[aria-label="Menu"]') : page.locator('body')).toContainText(nome, { timeout })
  if (opcoes.escolaNome !== undefined) await expect(page.getByText(opcoes.escolaNome).first()).toBeVisible({ timeout })
}

/**
 * Na turma aberta do professor, o acesso da sala e os pedidos de nome ficam na aba **"Alunos"** (A3; D69): a turma abre
 * na "Visão Geral", com o acerto por habilidade. Cada vez que a turma é aberta de novo (outro endereço, voltar pelo
 * histórico), ela abre na Visão Geral outra vez.
 */
export async function abrirAbaAlunos(page: Page, hasTouch: boolean): Promise<void> {
  const aba = page.getByRole('tab', { name: 'Alunos' })
  if (hasTouch) await aba.tap({ timeout: PRAZO_DA_ENTRADA_MS })
  else await aba.click({ timeout: PRAZO_DA_ENTRADA_MS })
  await expect(aba).toHaveAttribute('aria-selected', 'true')
}

/** A professora de uma escola só, em "Início", onde ela abre. */
export async function entrarComoProfessora(page: Page, hasTouch: boolean): Promise<EquipeDeTeste> {
  const professora = await criarEquipeComSenha()
  await page.goto('/entrar')
  await entrarPorEmail(page, professora, hasTouch)
  await esperarNovaConversa(page, professora.nome)
  return professora
}

/**
 * A coordenação abre no Painel (telas da coordenação, 3.0; D80; `docs/interface.md` 11.1), e não mais em Governança: o endereço e a
 * tela. O endereço vem da página inicial, na entrada; a tela, do pedaço dela, que a área carrega por `import()`, e por isso o teste
 * que segura o chunk da área confere só o endereço. **É o único lugar** que diz onde a coordenação abre.
 */
export async function esperarPainel(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/coordenacao\/painel$/, { timeout: PRAZO_DA_ENTRADA_MS })
  await expect(page.getByRole('heading', { level: 1, name: 'Painel' })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
}

/** A Estrutura da coordenação aberta (A1, 13.0), que é a aba Turmas de Escola: o endereço e a moldura. */
export async function esperarEstrutura(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/coordenacao\/estrutura$/, { timeout: PRAZO_DA_ENTRADA_MS })
  await expect(page.getByRole('heading', { level: 1, name: 'Escola' })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
}

/**
 * A coordenação que acabou de entrar vai à Estrutura: **confere que abriu no Painel** e segue pelo lugar Escola da lateral,
 * sem recarregar a página, que abre em Turmas. É o caminho de quem monta a escola.
 */
export async function abrirEstrutura(page: Page, hasTouch: boolean): Promise<void> {
  await esperarPainel(page)
  await irPelaNavegacao(page, 'Escola', hasTouch)
  await esperarEstrutura(page)
}

/**
 * A coordenadora no primeiro acesso, a partir da tela de entrada já aberta e sem recarregar a página: configura o
 * segundo fator do jeito sem celular, volta à entrada e entra com o código. Sem recarga, o que o teste afirma sobre o
 * cache da pessoa anterior na mesma aba continua valendo. Termina com a aba no endereço do Painel, onde a coordenação
 * abre; quem precisa da tela chama `esperarPainel`, e quem vai montar a escola, `abrirEstrutura`.
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
  await expect(page).toHaveURL(/\/coordenacao\/painel$/, { timeout: PRAZO_DA_ENTRADA_MS })
}

/** O título da aba na tela em que o aluno abre. */
export const TITULO_DAS_ATIVIDADES = 'Atividades · Turmma'

/**
 * O aluno abre em "Atividades" (MVP, A3), e não mais na página "Início": o endereço, a tela e, na lateral, o nome de quem
 * entrou e o papel. É o que prova que a sessão vale e de quem ela é, como a saudação "Olá, <nome>" provava antes.
 *
 * No celular a lateral é a gaveta, fechada: o nome está nela, fora da vista, e o teste o lê sem abri-la.
 */
export async function esperarAtividades(page: Page, nome: string, opcoes: { readonly timeout?: number; readonly escolaNome?: string } = {}): Promise<void> {
  const timeout = opcoes.timeout ?? PRAZO_DA_ENTRADA_MS
  await expect(page).toHaveURL(/\/aluno\/atividades$/, { timeout })
  await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Atividades' })).toBeAttached({ timeout })
  const lateralDaCasca = naGaveta(page) ? page.locator('dialog[aria-label="Menu"]') : page.locator('body')
  await expect(lateralDaCasca).toContainText(nome, { timeout })
  await expect(lateralDaCasca).toContainText('aluno', { timeout })
  if (opcoes.escolaNome !== undefined) await expect(lateralDaCasca).toContainText(opcoes.escolaNome, { timeout })
}

/** O aluno entra pelo endereço da escola, com matrícula e senha, e chega a "Atividades", onde ele abre. */
export async function entrarComoAluno(page: Page, aluno: { readonly slug: string; readonly matricula: string; readonly senha: string; readonly nome: string }, hasTouch: boolean): Promise<void> {
  await page.goto(`/e/${aluno.slug}`)
  await page.getByLabel('Matrícula').fill(aluno.matricula)
  await page.getByLabel('Senha').fill(aluno.senha)
  await acionar(page.getByRole('button', { name: /^Entrar$/ }), hasTouch)
  await esperarAtividades(page, aluno.nome)
}
