import type { CodigoDeErro } from './codigo-de-erro.js'

/**
 * Mensagem curta, em pt-BR, que diz o que fazer (regra 50, item 12). É fixa por código: a
 * mensagem nunca é montada com dado da requisição, então não tem como carregar valor de campo.
 */
export const MENSAGENS_DE_ERRO: Readonly<Record<CodigoDeErro, string>> = {
  ERRO_INTERNO: 'Não foi possível concluir agora. Tente de novo em instantes.',
  ENTRADA_INVALIDA: 'Alguns dados não estão corretos. Confira o que foi preenchido e tente de novo.',
  NAO_AUTENTICADO: 'Sua sessão não é válida ou expirou. Entre de novo para continuar.',
  NAO_ENCONTRADO: 'Não encontramos o que você procurou. Confira o endereço ou volte à tela anterior.',
  CONFLITO: 'Isso já existe ou acabou de ser alterado. Atualize a tela e confira antes de tentar de novo.',
  TEMPO_ESGOTADO: 'A operação demorou mais que o esperado. Tente de novo em instantes.',
  INDISPONIVEL_TENTE_DE_NOVO: 'O sistema está indisponível no momento. Tente de novo em instantes.',
  LIMITE_EXCEDIDO: 'Muitas tentativas em pouco tempo. Aguarde um pouco e tente de novo.',
}
