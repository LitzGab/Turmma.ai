import { test as base, expect } from '@playwright/test'

/**
 * Condições de rede aplicadas pelo CDP (`Network.emulateNetworkConditions`): latência de ida e volta em
 * ms e banda em bytes por segundo.
 */
export interface CondicaoDeRede {
  nome: string
  latenciaMs: number
  downloadBytesPorSegundo: number
  uploadBytesPorSegundo: number
}

export interface PerfilDeMaquina {
  /** Quantas vezes a CPU fica mais lenta (`Emulation.setCPUThrottlingRate`). */
  cpuMaisLenta: number
  rede: CondicaoDeRede
}

/** "Fast 3G" do DevTools do Chrome: 1,6 Mbps de descida e 750 kbps de subida, com 90% de vazão, e 562,5 ms. */
export const REDE_FAST_3G: CondicaoDeRede = {
  nome: 'Fast 3G',
  latenciaMs: 562.5,
  downloadBytesPorSegundo: ((1.6 * 1000 * 1000) / 8) * 0.9,
  uploadBytesPorSegundo: ((750 * 1000) / 8) * 0.9,
}

/** Rede móvel lenta, de celular com sinal fraco fora da escola: menos banda que o Fast 3G e mais latência. */
export const REDE_MOVEL_LENTA: CondicaoDeRede = {
  nome: 'móvel lenta',
  latenciaMs: 600,
  downloadBytesPorSegundo: ((1 * 1000 * 1000) / 8) * 0.9,
  uploadBytesPorSegundo: ((500 * 1000) / 8) * 0.9,
}

/** Chromebook de entrada na rede compartilhada da escola (regra 50, item 1). */
export const PERFIL_CHROMEBOOK: PerfilDeMaquina = { cpuMaisLenta: 4, rede: REDE_FAST_3G }

/** Celular de entrada em rede móvel, fora da sala (D51). */
export const PERFIL_CELULAR: PerfilDeMaquina = { cpuMaisLenta: 4, rede: REDE_MOVEL_LENTA }

export interface OpcoesDoPerfil {
  /** Sem perfil, a página roda sem limitação, e o teste falha: todo projeto declara o seu. */
  perfil: PerfilDeMaquina | undefined
}

/**
 * `test` de todo spec de tela. Antes de o teste usar a página, aplica a CPU e a rede do perfil do
 * projeto pelo CDP. Importar `test` direto de `@playwright/test` pula a limitação, e a guarda da
 * configuração (tools/ci/playwright.test.ts) reprova.
 */
export const test = base.extend<OpcoesDoPerfil>({
  perfil: [undefined, { option: true }],
  page: async ({ page, perfil }, use) => {
    if (!perfil) throw new Error('projeto do Playwright sem perfil de máquina: declare `perfil` em playwright.config.ts')
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: perfil.rede.latenciaMs,
      downloadThroughput: perfil.rede.downloadBytesPorSegundo,
      uploadThroughput: perfil.rede.uploadBytesPorSegundo,
    })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: perfil.cpuMaisLenta })
    await use(page)
  },
})

export { expect }
