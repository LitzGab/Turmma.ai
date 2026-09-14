// Páginas de fixture das guardas: cada uma tem uma violação de propósito, e o controle, a mesma página sem ela.
// Servem para provar que as verificações de largura e de acessibilidade pegam de fato.

function pagina(corpo: string, estilo = ''): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fixture</title>
    <style>body { margin: 0; font-family: sans-serif; color: #111; background: #fff } ${estilo}</style>
  </head>
  <body><main><h1>Fixture</h1>${corpo}</main></body>
</html>`
}

/** Um bloco de 480 px fixos: mais largo que a tela de 360 px. */
export const PAGINA_MAIS_LARGA = pagina('<div style="width: 480px; height: 40px">largo demais</div>')
export const PAGINA_DENTRO_DA_LARGURA = pagina('<div style="max-width: 100%; width: 480px; height: 40px">cabe</div>')

/** Botões de 16 × 16 px encostados: o `target-size` do WCAG 2.2 pede 24 px ou espaço equivalente. */
export const PAGINA_BOTOES_DE_16_PX = pagina(
  '<div style="display: flex"><button style="width:16px;height:16px;padding:0;border:0" aria-label="Um">1</button><button style="width:16px;height:16px;padding:0;border:0" aria-label="Dois">2</button></div>',
)
export const PAGINA_BOTOES_DE_44_PX = pagina(
  '<div style="display: flex; gap: 8px"><button style="min-width:44px;min-height:44px">1</button><button style="min-width:44px;min-height:44px">2</button></div>',
)

/** Texto cinza-claro sobre branco: `color-contrast` é violação `serious`. */
export const PAGINA_SEM_CONTRASTE = pagina('<p style="color: #d0d0d0">texto que quase não se lê</p>')
export const PAGINA_COM_CONTRASTE = pagina('<p style="color: #333">texto que se lê</p>')
