import { CodigoDeErro, MENSAGENS_DE_ERRO, mensagemDaEntrada, mensagemDoSegundoFator } from '@educa/shared'
import { ErroDaApi } from '../api/cliente'

/**
 * Os textos da área do operador (Tech Spec da A0, seção 9). Ficam aqui, no chunk da operação, e não no catálogo de
 * `packages/shared`: nenhuma tela da escola os mostra, e o catálogo inteiro vai na entrada que o Chromebook baixa.
 */

/** A sessão que terminou (30 min parada, 8 h, saída, operador desativado): a pessoa volta à entrada com isto. */
export const TEXTO_DA_SESSAO_ENCERRADA = MENSAGENS_DE_ERRO[CodigoDeErro.SESSAO_ENCERRADA]

/** O 503 da operação (banco ou Redis fora): diz o que fazer e a tela fica onde está. */
export const TEXTO_DA_OPERACAO_INDISPONIVEL = 'O Turmma está indisponível agora. Tente de novo em instantes.'

/**
 * O código do segundo fator que não passou: a API queima o desafio em toda tentativa (tarefa 7.0), certa ou errada, e
 * o caminho é refazer o e-mail e a senha. A tela não diz se o código estava errado, já usado ou se o desafio venceu.
 */
export const TEXTO_DO_CODIGO_RECUSADO = 'O código não foi aceito. Entre de novo com o e-mail e a senha, e use o código que o aplicativo mostrar então.'

/** O "Sair" que a API não confirmou: o cookie da sessão pode continuar valendo neste navegador. */
export const TEXTO_DA_SAIDA_NAO_CONFIRMADA =
  'Não foi possível confirmar a saída com o servidor. Se este computador é compartilhado, feche o navegador antes de deixá-lo.'

/** O código da falha, ou erro interno para o que não veio da API. */
function codigoDe(erro: unknown): CodigoDeErro {
  return erro instanceof ErroDaApi ? erro.codigo : CodigoDeErro.ERRO_INTERNO
}

/** O texto de uma falha numa tela com sessão: o 503 da operação tem o texto dele; o resto, o do catálogo. */
export function textoDaFalha(erro: unknown): string {
  const codigo = codigoDe(erro)
  if (codigo === CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) return TEXTO_DA_OPERACAO_INDISPONIVEL
  return MENSAGENS_DE_ERRO[codigo]
}

/** O texto de uma falha da entrada por e-mail e senha, com a espera da conta segurada quando a API a informou. */
export function textoDaFalhaDaEntrada(erro: unknown): string {
  const codigo = codigoDe(erro)
  if (codigo === CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) return TEXTO_DA_OPERACAO_INDISPONIVEL
  return mensagemDaEntrada(codigo, erro instanceof ErroDaApi ? erro.esperaSegundos : undefined)
}

/** O texto de uma falha do segundo fator que deixa a pessoa na tela (formato do código, 503). */
export function textoDaFalhaDoSegundoFator(erro: unknown): string {
  const codigo = codigoDe(erro)
  if (codigo === CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) return TEXTO_DA_OPERACAO_INDISPONIVEL
  return mensagemDoSegundoFator(codigo, erro instanceof ErroDaApi ? erro.esperaSegundos : undefined)
}
