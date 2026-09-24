/**
 * Os endereços da área do operador Turmma (A0), relativos à base `/operacao`: as rotas daqui vivem num `Route` aninhado
 * (`nest`), e é por isso que `/entrar` aqui é `/operacao/entrar` no navegador. Para sair da área, o caminho começa por
 * `~`, a raiz do wouter.
 */
export const BASE_DA_OPERACAO = '/operacao'

export const ROTAS_DA_OPERACAO = {
  /** A casca da operação, com a sessão aberta. */
  inicio: '/',
  entrar: '/entrar',
  /** O código do aplicativo ou de recuperação, com o desafio `mfa` em memória. */
  mfa: '/mfa',
  /** Configurar o segundo fator: a tela é da tarefa 11.0; a entrada já leva para cá o desafio `configurar_mfa`. */
  configurarMfa: '/mfa/configurar',
} as const

/**
 * A casca pelo caminho absoluto (`~` é a raiz do wouter): navegar para `/` dentro da área daria `/operacao/`, com a
 * barra no fim, e o endereço da casca é um só.
 */
export const INICIO_DA_OPERACAO = `~${BASE_DA_OPERACAO}`
