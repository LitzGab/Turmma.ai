import { z } from 'zod'
import { FINALIDADES_DA_LEITURA_DE_ALUNOS } from '../estrutura/turma.js'
import { esquemaAcertoPorHabilidade } from './prova.js'

/**
 * `GET /v1/turmas/:id/desempenho` (MVP, A3; D34, D45, D46): o acerto por habilidade da turma e de cada aluno, **só de
 * lotes aprovados**. Correção pendente ou rejeitada não entra em número nenhum.
 *
 * O professor com vínculo confirmado lê a própria turma. A coordenação lê com **finalidade e registro em auditoria**
 * (`turma.desempenho_lido`): a resposta nomeia alunos (D34), e o desempenho de uma turma numa disciplina é o de um
 * professor só, que a D45 trata como nominal. O agregado da coordenação, sem pessoa, está no resumo do Analista.
 */
export const esquemaConsultaDesempenhoDaTurma = z.strictObject({ finalidade: z.enum(FINALIDADES_DA_LEITURA_DE_ALUNOS).optional() })
export type ConsultaDesempenhoDaTurma = z.infer<typeof esquemaConsultaDesempenhoDaTurma>

export const MAXIMO_DE_HABILIDADES_NO_DESEMPENHO = 60
export const MAXIMO_DE_ALUNOS_NO_DESEMPENHO = 200

/** O acerto da turma numa habilidade, somado, e quantos alunos ficaram abaixo da metade nela. */
export const esquemaHabilidadeDaTurma = esquemaAcertoPorHabilidade.extend({ alunosAbaixoDaMetade: z.number().int().nonnegative() }).strict()

/** O acerto de um aluno, somado nos lotes aprovados. Contagem por habilidade, nunca nota, conceito ou texto sobre ele. */
export const esquemaDesempenhoDoAluno = z.strictObject({
  alunoId: z.uuid(),
  nome: z.string().min(1),
  acertos: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  porHabilidade: z.array(esquemaAcertoPorHabilidade).max(MAXIMO_DE_HABILIDADES_NO_DESEMPENHO),
})

/** Resposta de `GET /v1/turmas/:id/desempenho`. Turma sem lote aprovado vem com `lotesAprovados` zero e as listas vazias. */
export const esquemaRespostaDesempenhoDaTurma = z.strictObject({
  turmaId: z.uuid(),
  lotesAprovados: z.number().int().nonnegative(),
  porHabilidade: z.array(esquemaHabilidadeDaTurma).max(MAXIMO_DE_HABILIDADES_NO_DESEMPENHO),
  alunos: z.array(esquemaDesempenhoDoAluno).max(MAXIMO_DE_ALUNOS_NO_DESEMPENHO),
})
export type RespostaDesempenhoDaTurma = z.infer<typeof esquemaRespostaDesempenhoDaTurma>
