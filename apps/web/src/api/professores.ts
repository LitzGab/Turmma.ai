import { esquemaRespostaListaDeProfessores, type ProfessorDaEscola } from '@educa/shared'
import { queryOptions } from '@tanstack/react-query'
import { CHAVE_DA_ESTRUTURA, lerPaginas } from './estrutura'

/**
 * Os professores da escola da sessão, com o estado do convite (`GET /v1/professores`; A1, 3.0): usuário, nome e estado,
 * sem e-mail, sem link e sem nada que diga se a conta do e-mail já existia (E11). A alocação da Estrutura (13.0) oferece
 * só os de `ESTADOS_DO_PROFESSOR_ALOCAVEIS`; a tela Professores (14.0) cadastra, refaz e revoga.
 */
export const consultaProfessores = queryOptions({
  queryKey: [...CHAVE_DA_ESTRUTURA, 'professores'],
  queryFn: ({ signal }) => lerPaginas<ProfessorDaEscola>('/v1/professores', esquemaRespostaListaDeProfessores, signal),
})
