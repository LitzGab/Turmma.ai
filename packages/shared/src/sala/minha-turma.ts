import { z } from 'zod'
import { esquemaSerie } from '../estrutura/serie.js'

/**
 * Resposta de `GET /v1/minha-turma` (A1, tarefa 8.0, RF13): a escola, a turma e a série do aluno aprovado, pelo vínculo
 * de aluno confirmado dele no ano em curso. Sem colegas, sem professor, sem matrícula. Estrita.
 */
export const esquemaRespostaMinhaTurma = z.strictObject({
  escola: z.strictObject({ nome: z.string().min(1) }),
  turma: z.strictObject({ id: z.uuid(), nome: z.string().min(1) }),
  serie: esquemaSerie,
})
export type RespostaMinhaTurma = z.infer<typeof esquemaRespostaMinhaTurma>
