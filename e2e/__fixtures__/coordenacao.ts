import type { Locator, Page } from '@playwright/test'
import { irPelaNavegacao } from './casca.ts'
import { expect } from './perfis.ts'
import { larguraExcedente } from './verificacoes.ts'

/**
 * A navegação da coordenação pela tela (telas da coordenação, 3.0; D80): quatro lugares na lateral e na barra de baixo, e as
 * abas dentro de Escola e de Registros. Os specs que andam pela coordenação passam por aqui, para o mesmo teste valer nos
 * projetos `chromebook` e `celular` e para o caminho de cada tela estar escrito num lugar só.
 *
 * **Cada tela é a que já existia, no endereço que já tinha.** O que mudou é o caminho até ela: o lugar, e a aba dentro dele.
 */

/** Uma tela da coordenação, pelo nome de hoje dela. */
export type TelaDaCoordenacao =
  | 'Painel'
  | 'Analista'
  | 'Turmas'
  | 'Professores'
  | 'Material'
  | 'IA'
  | 'Agentes'
  | 'Pedidos'
  | 'Prazos de guarda'
  | 'Empresas'
  | 'Incidentes'

type Lugar = 'Painel' | 'Analista' | 'Escola' | 'Registros'

interface Caminho {
  readonly lugar: Lugar
  /** A aba dentro do lugar que leva à tela. Sem ela, o lugar já abre na tela. */
  readonly aba?: string
  /** O seletor da aba Privacidade: "Empresas" e "Incidentes" são o terceiro clique. */
  readonly seletor?: string
  /** O link de dentro da tela (Agentes, a partir de Registros). */
  readonly link?: string
}

/**
 * O caminho de cada tela, como a coordenação o faz. **A até dois cliques** (lugar e aba), e Empresas e Incidentes, a três
 * (lugar, aba e seletor) — o RF3 do PRD. A IA, a primeira aba de Registros, abre com o lugar; os Agentes, pelo link da IA.
 */
const CAMINHO: Readonly<Record<TelaDaCoordenacao, Caminho>> = {
  Painel: { lugar: 'Painel' },
  Analista: { lugar: 'Analista' },
  Turmas: { lugar: 'Escola' },
  Professores: { lugar: 'Escola', aba: 'Professores' },
  Material: { lugar: 'Escola', aba: 'Material' },
  IA: { lugar: 'Registros' },
  Agentes: { lugar: 'Registros', link: 'Como cada IA trabalha' },
  Pedidos: { lugar: 'Registros', aba: 'Pedidos' },
  'Prazos de guarda': { lugar: 'Registros', aba: 'Privacidade' },
  Empresas: { lugar: 'Registros', aba: 'Privacidade', seletor: 'Empresas' },
  Incidentes: { lugar: 'Registros', aba: 'Privacidade', seletor: 'Incidentes' },
}

/** Quantos cliques a coordenação faz até a tela, a partir de qualquer outra: o lugar, mais a aba, mais o seletor ou o link. */
export function cliquesAte(tela: TelaDaCoordenacao): number {
  const { aba, seletor, link } = CAMINHO[tela]
  return 1 + (aba === undefined ? 0 : 1) + (seletor === undefined ? 0 : 1) + (link === undefined ? 0 : 1)
}

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

/**
 * Vai a uma tela da coordenação pelo caminho da pessoa: o lugar em `Seções` (a lateral, ou a barra de baixo no celular) e, se a
 * tela é uma aba, a aba. O seletor da Privacidade e o link dos Agentes são o clique de dentro. Termina com a tela aberta:
 * a aba selecionada ou o seletor marcado, e não só o clique feito.
 */
export async function irPelaCoordenacao(page: Page, tela: TelaDaCoordenacao, hasTouch: boolean): Promise<void> {
  const { lugar, aba, seletor, link } = CAMINHO[tela]
  await irPelaNavegacao(page, lugar, hasTouch)
  const principal = page.getByRole('main')
  if (aba !== undefined) {
    const abaDoLugar = principal.getByRole('tab', { name: aba, exact: true })
    await acionar(abaDoLugar, hasTouch)
    await expect(abaDoLugar).toHaveAttribute('aria-selected', 'true')
  }
  if (seletor !== undefined) {
    const opcao = principal.getByRole('radio', { name: seletor, exact: true })
    await acionar(opcao, hasTouch)
    await expect(opcao).toHaveAttribute('aria-checked', 'true')
  }
  if (link !== undefined) await acionar(principal.getByRole('link', { name: link }), hasTouch)
}

/**
 * A página não rola a 1366 × 768, e nada rola de lado a 360 px (RF23). A partir de 768 px quem rola é o miolo da moldura, e a
 * página tem a altura da janela; abaixo, rola a página, e o que não pode acontecer é a rolagem de lado.
 */
export async function paginaNaoRola(page: Page): Promise<void> {
  expect(await larguraExcedente(page)).toBe(0)
  if ((page.viewportSize()?.width ?? 0) < 768) return
  const sobra = () => page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight)
  await expect.poll(sobra, { message: 'a página inteira rola a partir de 768 px: só o miolo deveria' }).toBeLessThanOrEqual(0)
}

/**
 * As linhas de uma tabela que vira lista (`Tabela`), numa região: as do corpo da tabela a partir de 768 px e os itens da lista
 * abaixo disso. Quem conta nomes ou procura um nome pela linha usa isto, para o mesmo caso valer nos projetos `chromebook` e
 * `celular` (telas da coordenação, 9.0): o cabeçalho da tabela não é linha de dado.
 */
export function linhasDaTabela(regiao: Locator): Locator {
  return regiao.locator('tbody tr, [data-tabela="lista"] > li')
}
