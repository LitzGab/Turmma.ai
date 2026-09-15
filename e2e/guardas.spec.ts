import { expect, test } from './__fixtures__/perfis.ts'
import {
  PAGINA_BOTOES_DE_16_PX,
  PAGINA_BOTOES_DE_44_PX,
  PAGINA_COM_CONTRASTE,
  PAGINA_DENTRO_DA_LARGURA,
  PAGINA_MAIS_LARGA,
  PAGINA_SEM_CONTRASTE,
} from './__fixtures__/paginas.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

// As verificações que a casca usa, aplicadas a páginas com a violação de propósito. Se uma delas deixar
// de pegar, este spec fica vermelho, e não a casca verde por engano.

test.describe('guardas de celular e acessibilidade pegam de fato', () => {
  test('página mais larga que 360 px faz a verificação de rolagem horizontal falhar; a mesma, contida, passa', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.setContent(PAGINA_MAIS_LARGA)
    expect(await larguraExcedente(page)).toBeGreaterThan(0)

    await page.setContent(PAGINA_DENTRO_DA_LARGURA)
    expect(await larguraExcedente(page)).toBe(0)
  })

  test('botões de 16 px encostados fazem o axe reprovar target-size; os de 44 px não', async ({ page }) => {
    await page.setContent(PAGINA_BOTOES_DE_16_PX)
    const violacoes = await violacoesGraves(page)
    expect(violacoes.map((violacao) => violacao.regra)).toContain('target-size')

    await page.setContent(PAGINA_BOTOES_DE_44_PX)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('página com violação serious faz o axe falhar; a mesma, corrigida, passa', async ({ page }) => {
    await page.setContent(PAGINA_SEM_CONTRASTE)
    expect(await violacoesGraves(page)).toContainEqual(expect.objectContaining({ regra: 'color-contrast', impacto: 'serious' }))

    await page.setContent(PAGINA_COM_CONTRASTE)
    expect(await violacoesGraves(page)).toEqual([])
  })

  test('o perfil do projeto está aplicado: a rede tem a latência do perfil e a CPU fica mais lenta', async ({ page, perfil }) => {
    if (!perfil) throw new Error('projeto sem perfil')
    await page.goto('/')

    // Rede: a ida e volta de um pedido pequeno à web leva pelo menos a latência declarada.
    const idaEVolta = await page.evaluate(async () => {
      const inicio = performance.now()
      await fetch(`/?sem-cache=${Math.random()}`, { cache: 'no-store' })
      return performance.now() - inicio
    })
    expect(idaEVolta).toBeGreaterThanOrEqual(perfil.rede.latenciaMs * 0.9)

    // CPU: o mesmo laço com a limitação do perfil e sem ela, trocada por uma sessão CDP própria do teste.
    // O runner ocupado só aumenta o tempo, nunca diminui: por isso vale o menor tempo de cada lado. Uma
    // amostra solta chegou a 1,68 na esteira com a limitação aplicada, e um bloco de cinco seguidas, a 1,93,
    // quando a ocupação pegou o bloco livre inteiro (menor de 30 ms, contra 19 ms no bloco seguinte). O lado
    // livre, que é o que derruba a razão, sai do menor de três blocos espaçados, mais de 1 s ao todo. Sem a
    // limitação aplicada, os dois menores ficam iguais e a razão fica perto de 1.
    const laco = () =>
      page.evaluate(() => {
        let acumulado = 0
        const inicio = performance.now()
        for (let indice = 0; indice < 5_000_000; indice++) acumulado = (acumulado + indice * 7) % 1_000_003
        return performance.now() - inicio + acumulado * 0
      })
    const menorDeCinco = async () => {
      await laco()
      let menor = Number.POSITIVE_INFINITY
      for (let vez = 0; vez < 5; vez++) menor = Math.min(menor, await laco())
      return menor
    }
    const limitado = await menorDeCinco()
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    let livre = Number.POSITIVE_INFINITY
    for (let bloco = 0; bloco < 3; bloco++) {
      if (bloco > 0) await page.waitForTimeout(400)
      livre = Math.min(livre, await menorDeCinco())
    }
    expect(limitado / livre).toBeGreaterThanOrEqual(2)
  })
})
