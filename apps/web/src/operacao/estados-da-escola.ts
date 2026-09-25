import type { EstadoDaCoordenacao } from '@educa/shared'

/**
 * O estado da primeira coordenação de cada escola, como a lista do painel o mostra (Tech Spec da A0b, seção 5; cenário
 * W10). A tela nunca mostra o identificador (`sem_convite`, `pendente`): mostra o que ele quer dizer para quem opera.
 */
export const TEXTO_DO_ESTADO: Readonly<Record<EstadoDaCoordenacao, string>> = {
  sem_convite: 'Sem convite',
  pendente: 'Convite enviado, ainda não aberto',
  vencido: 'Convite vencido',
  revogado: 'Convite revogado',
  aceito: 'Convite aceito, falta o primeiro acesso',
  sem_coordenacao: 'Sem coordenação ativa',
  ativa: 'Ativa',
}

/**
 * A família de cor do estado (`docs/interface.md` 9.1), **só de reforço**: o texto acima já diz tudo, e quem não
 * distingue cor não perde nada (regra 50, item 11). Verde é a escola que já tem quem a use; laranja, o que espera
 * alguém abrir o convite; vermelho, o que precisa de uma ação do operador; cinza, o que ainda não começou.
 */
export type TomDoEstado = 'ok' | 'pendente' | 'erro' | 'info'

export const TOM_DO_ESTADO: Readonly<Record<EstadoDaCoordenacao, TomDoEstado>> = {
  sem_convite: 'info',
  pendente: 'pendente',
  vencido: 'erro',
  revogado: 'erro',
  aceito: 'pendente',
  sem_coordenacao: 'erro',
  ativa: 'ok',
}

/** As classes de cada tom: o fundo e o texto da mesma família, com o contraste medido na 9.1. */
export const CLASSES_DO_TOM: Readonly<Record<TomDoEstado, string>> = {
  ok: 'bg-ok-cx text-ok',
  pendente: 'bg-pendente-cx text-pendente',
  erro: 'bg-erro-cx text-erro',
  info: 'bg-info-cx text-info',
}
