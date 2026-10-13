import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './__fixtures__/perfis.ts'
import { conferirAssinaturas, conferirQueAOncaNaoTemNome, conferirQueOAvatarFicaParado } from './__fixtures__/avatar.ts'
import { abrirGaleria, caixa, desenho, secao } from './__fixtures__/galeria.ts'
import { corDoToken, IMPACTOS_QUE_REPROVAM, larguraExcedente, TAGS_WCAG } from './__fixtures__/verificacoes.ts'

/**
 * A onça como avatar dos três agentes, na galeria (`/galeria`), nos projetos `chromebook` e `celular` e nos dois temas
 * (X1, tarefa 8.0; RF10; `docs/interface.md` 9.7). O que o `jsdom` prova — as props, o bloco com nome e selo, dois renders
 * iguais, nenhum temporizador, a cadeia fechada de importação — está em `componentes/onca/CabecaOnca.test.tsx` e em
 * `componentes/ia/avatar-*.test.ts(x)`; aqui está o que só o navegador calcula: a cor resolvida, a medida e o que se mexe.
 *
 * A onça **de corpo inteiro não aparece**: ela vem com o primeiro uso (X2 e X4), com parecer próprio.
 */

const TEMAS = ['claro', 'escuro'] as const
type Tema = (typeof TEMAS)[number]

const TAMANHOS = [24, 32, 40, 48] as const

/** O anel de cada agente, pelo token: o Assistente em azul, o Tutor em laranja e o Analista em anil (9.7). */
const ANEL = { assistente_de_ensino: 'azul', tutor: 'laranja', analista_de_desempenho_escolar: 'anil' } as const
type Agente = keyof typeof ANEL
const AGENTES = Object.keys(ANEL) as Agente[]

/** Quantos avatares a seção tem: três agentes em quatro tamanhos, e um em cada tipo de mensagem (coluna, balão, pensando). */
const AVATARES_DA_SECAO = AGENTES.length * TAMANHOS.length + 3

/** As cores fixas da onça (9.7), como o navegador as devolve: a pelagem, o olho e a pupila. */
const PELAGEM = 'rgb(232, 115, 46)'
const OLHO = 'rgb(255, 255, 255)'
const PUPILA = 'rgb(22, 35, 62)'

async function irParaOTema(page: Page, tema: Tema): Promise<void> {
  await abrirGaleria(page)
  await page.evaluate((valor) => document.documentElement.setAttribute('data-tema', valor), tema)
}

for (const tema of TEMAS) {
  test.describe(`a onça como avatar, no tema ${tema}`, () => {
    test('cada avatar é um círculo `fundo` com anel de 2 px na cor do agente, quadrado, com a cabeça dentro e nenhuma imagem (A28)', async ({ page }) => {
      await irParaOTema(page, tema)
      const [fundo, azul, laranja, anil] = await Promise.all(['fundo', 'azul', 'laranja', 'anil'].map((token) => corDoToken(page, token)))
      const anel: Record<Agente, string | undefined> = { assistente_de_ensino: azul, tutor: laranja, analista_de_desempenho_escolar: anil }
      const avatares = secao(page, 'marca-onca').locator('[data-agente]')
      await expect(avatares).toHaveCount(AVATARES_DA_SECAO)

      let conferidos = 0
      for (const tamanho of TAMANHOS) {
        for (const agente of AGENTES) {
          const avatar = secao(page, 'marca-onca').locator(`[data-tamanho="${String(tamanho)}"] [data-agente="${agente}"]`)
          await expect(avatar, `${agente} a ${String(tamanho)} px`).toHaveCount(1)
          const medida = await caixa(avatar)
          expect(medida, `${agente}: quadrado de ${String(tamanho)} px`).toMatchObject({ width: tamanho, height: tamanho })
          expect(await desenho(avatar), agente).toMatchObject({ fundo, borda: `2px solid ${anel[agente] ?? ''}` })
          expect(Number.parseFloat((await desenho(avatar)).canto), `${agente}: redondo`).toBeGreaterThanOrEqual(tamanho / 2)
          // A cabeça preenche o miolo, dentro do anel: o círculo é de `tamanho`, e o desenho, de `tamanho − 4`.
          await expect(avatar.locator('svg'), agente).toHaveCount(1)
          expect(await caixa(avatar.locator('svg')), `${agente}: a cabeça dentro do anel`).toMatchObject({ width: tamanho - 4, height: tamanho - 4 })
          await expect(avatar.locator('img, image, picture'), agente).toHaveCount(0)
          conferidos += 1
        }
      }
      expect(conferidos).toBe(AGENTES.length * TAMANHOS.length)
      // O de cada tipo de mensagem tem o mesmo desenho: o avatar da linha é o de 24 px.
      for (const agente of AGENTES) expect(await desenho(secao(page, 'marca-onca').locator(`[data-onca-na-mensagem] [data-agente="${agente}"]`)), agente).toMatchObject({ fundo, borda: `2px solid ${anel[agente] ?? ''}` })
    })

    test('as cores da onça são fixas: a pelagem, o olho e a pupila são os mesmos no claro e no escuro, e a cabeça é a mesma nos três agentes', async ({ page }) => {
      await irParaOTema(page, tema)
      const cabecas = await secao(page, 'marca-onca').locator('[data-tamanho="48"] [data-agente] svg').evaluateAll((svgs) => svgs.map((svg) => svg.innerHTML))
      expect(cabecas).toHaveLength(AGENTES.length)
      expect(new Set(cabecas).size, 'um desenho só: a cabeça não muda de um agente para outro').toBe(1)
      const cores = await secao(page, 'marca-onca')
        .locator('[data-tamanho="48"] [data-agente="tutor"] svg')
        .evaluate((svg) => {
          const fill = (seletor: string) => getComputedStyle(svg.querySelector(seletor) as Element).fill
          return { pelagem: fill('circle[cx="13"]'), olho: fill('circle[cx="17.5"][r="3.4"]'), pupila: fill('circle[cx="17.5"][r="1.9"]') }
        })
      expect(cores).toEqual({ pelagem: PELAGEM, olho: OLHO, pupila: PUPILA })
    })

    test('todo avatar tem o nome da função em texto visível e o selo "IA" no mesmo bloco, e a assinatura não passa da janela', async ({ page }) => {
      await irParaOTema(page, tema)
      expect(await conferirAssinaturas(secao(page, 'marca-onca'))).toBe(AVATARES_DA_SECAO)
      // Os avatares das outras seções da galeria (a conversa, a assinatura) também assinam.
      expect(await conferirAssinaturas(page)).toBeGreaterThan(AVATARES_DA_SECAO)
      expect(await larguraExcedente(page)).toBe(0)
    })

    test('no balão do Seu time a assinatura fica em cima e o balão logo abaixo dela, com no máximo 85% da coluna no computador e a coluna inteira no celular', async ({ page }) => {
      await irParaOTema(page, tema)
      const mensagem = secao(page, 'marca-onca').locator('article').filter({ has: page.locator('[data-agente="assistente_de_ensino"]') })
      await expect(mensagem).toHaveCount(1)
      const assinatura = mensagem.locator(':scope > [data-assinatura]')
      const balao = mensagem.locator(':scope > div:not([data-assinatura])').first()
      await expect(assinatura).toHaveCount(1)
      await expect(balao).toBeVisible()
      const [da, db, coluna] = await Promise.all([caixa(assinatura), caixa(balao), caixa(mensagem)])
      expect(da.y + da.height, 'o balão começa depois da assinatura').toBeLessThanOrEqual(db.y)
      expect(db.y - (da.y + da.height), 'o balão vem logo abaixo da assinatura').toBeLessThanOrEqual(16)
      expect(Math.abs(da.x - db.x), 'a assinatura e o balão partem da mesma borda').toBeLessThanOrEqual(1)
      const largura = page.viewportSize()?.width ?? 0
      if (largura >= 640) expect(db.width, 'no computador o balão não passa de 85% da coluna').toBeLessThanOrEqual(coluna.width * 0.85 + 1)
      else expect(db.width, 'no celular o balão ocupa a coluna').toBeGreaterThan(coluna.width * 0.85)
      expect(db.x + db.width, 'o balão não passa da coluna').toBeLessThanOrEqual(coluna.x + coluna.width + 1)
    })

    test('nada se mexe: nenhuma animação nem transição no avatar, e o "preparando a resposta" ao lado dele continua parado (A51)', async ({ page }) => {
      await irParaOTema(page, tema)
      expect(await conferirQueOAvatarFicaParado(secao(page, 'marca-onca'))).toBeGreaterThan(0)
      const pensando = secao(page, 'marca-onca').locator('[data-pensando]')
      await expect(pensando).toHaveCount(1)
      await expect(pensando.locator('[data-agente]')).toHaveCount(1)
      expect(await pensando.evaluate((elemento) => [elemento, ...elemento.querySelectorAll('*')].filter((no) => getComputedStyle(no).animationName !== 'none').length)).toBe(0)
    })

    test('a onça não tem nome: o avatar some da leitura de tela, e nada na tela se chama "onça"', async ({ page }) => {
      await irParaOTema(page, tema)
      const avatares = secao(page, 'marca-onca').locator('[data-agente]')
      for (const avatar of await avatares.all()) {
        await expect(avatar).toHaveAttribute('aria-hidden', 'true')
        await expect(avatar).not.toHaveAttribute('title')
        await expect(avatar).not.toHaveAttribute('aria-label')
        await expect(avatar.locator('title, desc, text')).toHaveCount(0)
      }
      await conferirQueAOncaNaoTemNome(page)
    })

    test('a seção não tem violação grave de acessibilidade, e a página não ganha rolagem horizontal', async ({ page }) => {
      await irParaOTema(page, tema)
      const { violations } = await new AxeBuilder({ page }).withTags([...TAGS_WCAG]).include('[data-galeria="marca-onca"]').analyze()
      const graves = violations
        .filter((violacao) => (IMPACTOS_QUE_REPROVAM as readonly string[]).includes(violacao.impact ?? ''))
        .map((violacao) => ({ regra: violacao.id, impacto: violacao.impact, alvos: violacao.nodes.map((no) => no.target.join(' ')) }))
      expect(graves).toEqual([])
      expect(await larguraExcedente(page)).toBe(0)
    })
  })
}
