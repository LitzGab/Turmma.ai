import { CATEGORIAS_DE_RETENCAO, type RetencaoDaCategoria } from '@educa/shared'

/**
 * Os textos da aba "Por quanto tempo guardamos" (F3, 6.0; `docs/interface.md` 3). Funções puras: a tela só as chama, e o
 * teste as prova sem renderizar nada.
 */

/** Um prazo em anos quando é exato ("1 ano", "5 anos") e em meses no resto ("6 meses", "1 mês"). */
export function textoDoPrazo(meses: number): string {
  if (meses % 12 === 0) {
    const anos = meses / 12
    return anos === 1 ? '1 ano' : `${anos} anos`
  }
  return meses === 1 ? '1 mês' : `${meses} meses`
}

/**
 * De onde vem o prazo que vale: o padrão do sistema ou o ajuste da escola e, quando uma trava encurtou o prazo, qual
 * categoria a encurtou. A trava é dita pelo nome que a própria categoria tem no catálogo.
 */
export function textoDaOrigem(linha: Pick<RetencaoDaCategoria, 'origem' | 'limitadaPor'>): string {
  const origem = linha.origem === 'ajustada' ? 'Ajustado pela escola' : 'Padrão do sistema'
  if (linha.limitadaPor === null) return origem
  return `${origem}; encurtado pela trava com "${CATEGORIAS_DE_RETENCAO[linha.limitadaPor].descricao}"`
}
