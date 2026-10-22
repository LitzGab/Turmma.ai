import type { Turno } from '@educa/shared'

/**
 * O turno da turma por extenso, em minúsculas, como a série o acompanha ("7º ano · manhã"). Vem da lista de turmas (`GET
 * /v1/turmas`): a turma aberta (`GET /v1/turmas/:id`) não o traz.
 */
export const NOME_DO_TURNO: Readonly<Record<Turno, string>> = { manha: 'manhã', tarde: 'tarde', noite: 'noite', integral: 'integral' }
