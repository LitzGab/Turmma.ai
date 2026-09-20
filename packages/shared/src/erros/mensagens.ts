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
  CONTA_SEGURADA: 'Muitas tentativas com senha errada nesta conta. Aguarde de 30 segundos a 15 minutos, como indicado, e tente de novo.',
  JA_RENOVADO: 'Sua sessão acabou de ser renovada em outra aba. Tente de novo.',
  CONTA_EXTERNA_NAO_LIGADA: 'Esta conta não está liberada nesta escola. Entre com a sua matrícula ou procure o professor ou a coordenação.',
}

/**
 * O que a tela de entrada diz, onde a mensagem geral não serve (regra 50, item 12).
 *
 * - `NAO_AUTENTICADO` no login não é sessão vencida: é a resposta única de senha errada, e-mail que não existe e
 *   conta sem usuário ativo (RF6). A tela não pode dizer qual dos três foi, e o texto vale para os três.
 * - `NAO_ENCONTRADO` e `CONFLITO` não acontecem aqui; quem cair neles vê a mensagem geral.
 */
export const MENSAGENS_DA_ENTRADA: Readonly<Partial<Record<CodigoDeErro, string>>> = {
  NAO_AUTENTICADO: 'E-mail ou senha incorretos. Confira os dois e tente de novo.',
}

/**
 * Quanto esperar, por extenso em pt-BR, a partir dos segundos do `Retry-After`. Arredonda para cima, e para o minuto
 * inteiro acima de um minuto: dizer "2 minutos" quando faltam 90 s atrasa um pouco a pessoa, e dizer "1 minuto" a
 * faria tentar cedo e esticar o bloqueio.
 */
export function formatarEspera(segundos: number): string {
  const inteiros = Math.max(1, Math.ceil(segundos))
  if (inteiros < 60) return `${String(inteiros)} ${inteiros === 1 ? 'segundo' : 'segundos'}`
  const minutos = Math.ceil(inteiros / 60)
  return `${String(minutos)} ${minutos === 1 ? 'minuto' : 'minutos'}`
}

/**
 * A mensagem da tela de entrada para um código, com o tempo de espera quando a API o informou no `Retry-After`
 * (`CONTA_SEGURADA`, RF11). O número vem da nossa própria resposta, nunca do que a pessoa digitou: nenhuma mensagem
 * carrega valor de campo.
 *
 * Sem o `Retry-After`, fica o texto fixo do catálogo, que já diz a faixa de espera.
 */
export function mensagemDaEntrada(codigo: CodigoDeErro, esperaSegundos?: number): string {
  if (codigo === 'CONTA_SEGURADA' && esperaSegundos !== undefined && Number.isFinite(esperaSegundos)) {
    return `Muitas tentativas com senha errada nesta conta. Espere ${formatarEspera(esperaSegundos)} e tente de novo.`
  }
  return MENSAGENS_DA_ENTRADA[codigo] ?? MENSAGENS_DE_ERRO[codigo]
}
