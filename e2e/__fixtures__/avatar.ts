import type { Locator, Page } from '@playwright/test'
import { expect } from './perfis.ts'

/**
 * O que os specs que olham o avatar da onça dividem (RF10 da X1; `docs/interface.md` 9.7): **todo `[data-agente]` tem, no
 * `[data-assinatura]` mais próximo, exatamente ele, o nome da função em texto visível e um `[data-selo-ia]`**. A
 * `AssinaturaIA` e o cabeçalho do balão da `MensagemIA` levam o atributo; o avatar sem eles é o que o teste reprova.
 *
 * O nome que acompanha o avatar é o do agente dele: o `[data-agente="tutor"]` tem ao lado "Tutor" ou "Tutor · <função>",
 * e nunca o nome de outro.
 */
const NOME_POR_AGENTE: Readonly<Record<string, RegExp>> = {
  assistente_de_ensino: /^Assistente( de ensino| · .+)$/,
  tutor: /^Tutor( · .+)?$/,
  analista_de_desempenho_escolar: /^Analista( de desempenho escolar| · .+)$/,
}

/**
 * Confere cada avatar de `raiz` (a página ou um pedaço dela) e devolve quantos eram. Sem avatar nenhum falha: o caso que
 * passa vazio não prova nada.
 */
export async function conferirAssinaturas(raiz: Locator | Page): Promise<number> {
  const avatares = raiz.locator('[data-agente]')
  const total = await avatares.count()
  expect(total, 'nenhum avatar na tela: o caso passaria vazio').toBeGreaterThan(0)
  for (let indice = 0; indice < total; indice++) {
    const avatar = avatares.nth(indice)
    const agente = (await avatar.getAttribute('data-agente')) ?? ''
    const nome = NOME_POR_AGENTE[agente]
    expect(nome, `o agente "${agente}" não é um dos três`).toBeDefined()
    // `ancestor::…[1]` é o mais próximo: o bloco de uma assinatura dentro de outra não vale como o da de fora.
    const bloco = avatar.locator('xpath=ancestor::*[@data-assinatura][1]')
    await expect(bloco, `${agente} #${String(indice)}: o avatar está fora de uma assinatura`).toHaveCount(1)
    await expect(bloco.locator('[data-agente]'), `${agente}: a assinatura tem mais de um avatar`).toHaveCount(1)
    await expect(bloco.locator('[data-selo-ia]'), `${agente}: sem o selo "IA", ou com dois`).toHaveCount(1)
    await expect(bloco.locator('[data-selo-ia]'), `${agente}: o selo está escondido`).toBeVisible()
    // O nome, em texto que se vê, ao lado do avatar: um parágrafo ou um título, e o texto é o nome do mesmo agente.
    const texto = bloco.locator('p, h2, h3')
    await expect(texto, `${agente}: a assinatura não diz o nome da função`).toHaveCount(1)
    await expect(texto).toBeVisible()
    expect(((await texto.textContent()) ?? '').trim(), `${agente}: o nome é de outro agente`).toMatch(nome as RegExp)
  }
  return total
}

/**
 * Nada que se acesse na página se chama "onça": nem o nome de um agente, nem de uma imagem, nem de uma região. A onça é
 * desenho, e quem assina é a função (D58; regra 70, item 4a).
 */
export async function conferirQueAOncaNaoTemNome(page: Page): Promise<void> {
  const arvore = await page.locator('body').ariaSnapshot()
  expect(arvore, 'algum nome acessível da tela cita a onça').not.toMatch(/onça/i)
  await expect(page.locator('[aria-label*="onça" i], [title*="onça" i], [alt*="onça" i]')).toHaveCount(0)
  await expect(page.getByRole('img', { name: /onça/i })).toHaveCount(0)
}

/** Nenhum nó do avatar nem do que está ao lado dele anima ou faz transição: a onça fica parada (D59). */
export async function conferirQueOAvatarFicaParado(raiz: Locator | Page): Promise<number> {
  const nos = await raiz.locator('[data-agente], [data-agente] *').evaluateAll((elementos) =>
    elementos.map((elemento) => {
      const estilo = getComputedStyle(elemento)
      return { animacao: estilo.animationName, transicao: estilo.transitionDuration, nome: `${elemento.tagName.toLowerCase()}` }
    }),
  )
  expect(nos.length, 'nenhum nó de avatar: o caso passaria vazio').toBeGreaterThan(0)
  expect(nos.filter(({ animacao }) => animacao !== 'none')).toEqual([])
  expect(nos.filter(({ transicao }) => transicao.split(',').some((duracao) => duracao.trim() !== '0s'))).toEqual([])
  return nos.length
}

/**
 * Todo avatar de `raiz` é um quadrado de `tamanho` px: o cartão de agente da coordenação e o cabeçalho do Analista são de
 * 48 px (`docs/interface.md` 9.7). Devolve quantos conferiu; sem avatar nenhum o caso passaria vazio.
 */
export async function conferirTamanhoDoAvatar(raiz: Locator | Page, tamanho: number): Promise<number> {
  const avatares = raiz.locator('[data-agente]')
  const total = await avatares.count()
  expect(total, 'nenhum avatar na tela: o caso passaria vazio').toBeGreaterThan(0)
  for (let indice = 0; indice < total; indice++) {
    const caixa = await avatares.nth(indice).boundingBox()
    expect(caixa, `avatar #${String(indice)}`).not.toBeNull()
    expect({ largura: caixa?.width, altura: caixa?.height }, `avatar #${String(indice)}: ${String(tamanho)} px`).toEqual({ largura: tamanho, altura: tamanho })
  }
  return total
}
