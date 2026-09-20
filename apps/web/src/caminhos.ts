import type { EtapaDeLogin } from '@educa/shared'

/**
 * Os endereços da web, num lugar só. As telas de MFA, escolha de escola e vínculos chegam nas tarefas 19.0 e 20.0;
 * as rotas já existem para o login levar a elas sem quebrar.
 */
export const ROTAS = {
  inicio: '/',
  entrar: '/entrar',
  mfa: '/mfa',
  configurarMfa: '/mfa/configurar',
  escolherEscola: '/escolher-escola',
  /** Estado do sistema, público: é a tela que se abre justamente quando não se consegue entrar. */
  sistema: '/sistema',
} as const

/**
 * A tela de cada etapa que o login pode devolver (Tech Spec, seção 5, "Etapas"). `pronta` já tem sessão e vai para
 * a área autenticada; as outras seguem para a tela da etapa, sem sessão nenhuma gravada.
 */
export const ROTA_DA_ETAPA: Readonly<Record<EtapaDeLogin, string>> = {
  pronta: ROTAS.inicio,
  mfa: ROTAS.mfa,
  configurar_mfa: ROTAS.configurarMfa,
  escolher: ROTAS.escolherEscola,
}
