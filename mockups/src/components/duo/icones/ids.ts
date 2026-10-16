/* Os ids dos ícones ilustrados (sistema-turmma-duolingo.md, 2.5 e seção 9). */

export type IconeLugarId = 'inicio' | 'tarefas' | 'eu' | 'avisar' | 'turmas' | 'agenda' | 'criados' | 'escola' | 'ia' | 'registros' | 'rede' | 'painel'
export type IconeFilaId = 'atencao' | 'notas' | 'sinal' | 'pedidos' | 'adaptada' | 'turma' | 'aviso' | 'contestacao' | 'alerta' | 'material-falhou' | 'convite' | 'dossie' | 'titular'
export type IconeTarefaId = 'prova' | 'lista' | 'leitura'
export type IconeMateriaId = 'matematica' | 'portugues' | 'ciencias' | 'biologia' | 'quimica' | 'fisica' | 'historia' | 'geografia' | 'ingles' | 'arte' | 'educacao-fisica' | 'filosofia' | 'sociologia'
export type IconeMetricaId = 'alunos' | 'tutor' | 'aprovado' | 'acerto' | 'pacote' | 'corrigidas'
export type IconeAcaoId = 'mais'

export type IconeId = IconeLugarId | IconeFilaId | IconeTarefaId | IconeMateriaId | IconeMetricaId | IconeAcaoId

export type FamiliaIcone = 'laranja' | 'azul' | 'verde' | 'amarelo' | 'vermelho' | 'roxo' | 'turquesa' | 'anil' | 'lima' | 'rosa'

/** A família padrão de cada ícone (tabelas 2.1.4, 2.1.5 e seção 9). O "mais" é multicolorido: a família dele é só o padrão do primeiro quadradinho. */
export const FAMILIA_DO_ICONE: Record<IconeId, FamiliaIcone> = {
  inicio: 'laranja', tarefas: 'azul', eu: 'verde', avisar: 'roxo', turmas: 'turquesa', agenda: 'vermelho',
  criados: 'amarelo', escola: 'azul', ia: 'anil', registros: 'amarelo', rede: 'anil', painel: 'anil',
  atencao: 'roxo', notas: 'amarelo', sinal: 'azul', pedidos: 'verde', adaptada: 'amarelo', turma: 'turquesa',
  aviso: 'vermelho', contestacao: 'amarelo', alerta: 'anil', 'material-falhou': 'vermelho', convite: 'amarelo', dossie: 'anil', titular: 'anil',
  prova: 'azul', lista: 'azul', leitura: 'azul',
  matematica: 'azul', portugues: 'roxo', ciencias: 'verde', biologia: 'verde', quimica: 'turquesa', fisica: 'anil',
  historia: 'amarelo', geografia: 'lima', ingles: 'vermelho', arte: 'rosa', 'educacao-fisica': 'rosa', filosofia: 'amarelo', sociologia: 'lima',
  alunos: 'verde', tutor: 'laranja', aprovado: 'verde', acerto: 'vermelho', pacote: 'turquesa', corrigidas: 'amarelo',
  mais: 'laranja',
}

export const IDS_ICONE = Object.keys(FAMILIA_DO_ICONE) as IconeId[]
