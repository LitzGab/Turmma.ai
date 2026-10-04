import type { ConteudoDeAtividade } from '@educa/shared'
import type { EntradaDeAdaptacao } from '../tarefas/adaptar-atividade.js'
import { gerarAtividadeObjetiva, type EntradaDeAtividadeObjetiva } from '../tarefas/gerar-atividade-objetiva.js'
import type { EntradaDePlanoDeAula } from '../tarefas/gerar-plano-de-aula.js'
import type { EntradaDoAssistente } from '../tarefas/propor-ferramenta.js'
import type { EntradaDoRelatorio } from '../tarefas/relatorio-da-correcao.js'
import type { EntradaDoAnalista } from '../tarefas/resumo-do-analista.js'
import type { EntradaDoTutor } from '../tarefas/turno-do-tutor.js'
import { CONTEXTO_DE_QUIMICA, HABILIDADES_DE_ESTEQUIOMETRIA, trechosDeEstequiometria } from './estequiometria.js'

/** Uma entrada válida de cada tarefa, toda sintética, sobre o mesmo material de estequiometria. */

export const ESCOLA_A = '6f1d2c3b-4a59-4e68-8b7a-1c2d3e4f5a60'
export const ESCOLA_B = '7a2e3d4c-5b6a-4f79-9c8b-2d3e4f5a6b71'
export const ALUNO_1 = '8b3f4e5d-6c7b-4a8a-8d9c-3e4f5a6b7c82'
export const ALUNO_2 = '9c4a5f6e-7d8c-4b9b-9eab-4f5a6b7c8d93'

const habilidades = [...HABILIDADES_DE_ESTEQUIOMETRIA]

export const entradaDeAtividade = (): EntradaDeAtividadeObjetiva => ({
  tema: 'estequiometria',
  quantidade: 6,
  contexto: { ...CONTEXTO_DE_QUIMICA },
  habilidades,
  trechos: trechosDeEstequiometria(),
})

export const atividadeDeEstequiometria = (): ConteudoDeAtividade => gerarAtividadeObjetiva.falso(entradaDeAtividade())

export const entradaDePlano = (): EntradaDePlanoDeAula => ({
  tema: 'reagente limitante',
  duracaoMinutos: 50,
  contexto: { ...CONTEXTO_DE_QUIMICA },
  habilidades,
  trechos: trechosDeEstequiometria(),
})

export const entradaDeAdaptacao = (): EntradaDeAdaptacao => ({
  conteudo: atividadeDeEstequiometria(),
  adaptacao: { tipos: ['linguagem_direta', 'tempo_adicional'], tempoExtraPercentual: 50 },
})

/** A questão do reagente limitante: a frase da página 5 é, palavra por palavra, a alternativa correta. */
export function questaoDoReagenteLimitante(): ConteudoDeAtividade['questoes'][number] {
  const questao = atividadeDeEstequiometria().questoes.find((candidata) => candidata.enunciado.includes('reagente limitante'))
  if (questao === undefined) throw new Error('a atividade de teste deveria ter a questão do reagente limitante')
  return questao
}

export function entradaDoTutor(duvida: string): EntradaDoTutor {
  const questao = questaoDoReagenteLimitante()
  return {
    duvida,
    contexto: { ...CONTEXTO_DE_QUIMICA },
    trechos: trechosDeEstequiometria(),
    questao: { numero: 5, enunciado: questao.enunciado, alternativas: questao.alternativas, habilidade: questao.habilidade },
    memoria: [
      { habilidade: questao.habilidade, acertos: 1, erros: 3 },
      { habilidade: habilidades[0] ?? questao.habilidade, acertos: 4, erros: 0 },
    ],
    turnosAnteriores: [],
  }
}

export const entradaDoAssistente = (mensagem = 'monta uma atividade com 5 questões sobre reagente limitante'): EntradaDoAssistente => ({
  mensagem,
  contexto: { ...CONTEXTO_DE_QUIMICA },
  trechos: trechosDeEstequiometria([5, 6]),
  turnosAnteriores: [],
})

export const entradaDoRelatorio = (): EntradaDoRelatorio => ({
  titulo: 'Atividade — estequiometria',
  respondentes: 30,
  questoes: [
    { numero: 1, habilidade: habilidades[0] ?? { codigo: 'X', descricao: 'x' }, gabarito: 3, marcacoes: [2, 1, 2, 25], emBranco: 0 },
    { numero: 2, habilidade: habilidades[2] ?? { codigo: 'X', descricao: 'x' }, gabarito: 2, marcacoes: [3, 15, 8, 2], emBranco: 2 },
    { numero: 3, habilidade: habilidades[3] ?? { codigo: 'X', descricao: 'x' }, gabarito: 0, marcacoes: [30, 0, 0, 0], emBranco: 0 },
  ],
})

export const entradaDoAnalista = (): EntradaDoAnalista => ({
  periodo: { inicio: '2026-09-28', fim: '2026-10-02' },
  limiarDeAlertaPercentual: 60,
  recortes: [
    {
      serie: '2ª série do Ensino Médio',
      disciplina: 'Química',
      professoresNoRecorte: 2,
      turmas: 3,
      habilidades: [
        { habilidade: habilidades[0] ?? { codigo: 'X', descricao: 'x' }, respostas: 180, acertoPercentual: 49 },
        { habilidade: habilidades[2] ?? { codigo: 'X', descricao: 'x' }, respostas: 90, acertoPercentual: 64 },
      ],
    },
    {
      serie: '1ª série do Ensino Médio',
      disciplina: 'Química',
      professoresNoRecorte: 3,
      turmas: 4,
      habilidades: [{ habilidade: habilidades[1] ?? { codigo: 'X', descricao: 'x' }, respostas: 240, acertoPercentual: 82 }],
    },
  ],
})
