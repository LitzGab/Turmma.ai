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
    const laco = () =>
      page.evaluate(() => {
        let acumulado = 0
        const inicio = performance.now()
        for (let indice = 0; indice < 5_000_000; indice++) acumulado = (acumulado + indice * 7) % 1_000_003
        return performance.now() - inicio + acumulado * 0
      })
    await laco()
    const limitado = await laco()
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await laco()
    const livre = await laco()
    expect(limitado / livre).toBeGreaterThanOrEqual(2)
  })
})
