import { useMemo } from 'react'
import { TURMAS } from './escola'
import { resumoDa } from './turmas-resumo'
import { useAlocacoes } from './escola-estado'
import { useEstadoAcesso, listaDe } from './acesso'
import { turmaPorId } from './demo/turmas-base'
import { useProfessorAtual } from './sessao'

/* AS TURMAS DO PROFESSOR (12ª rodada, 04/10/2026).

   As turmas do professor da SESSÃO, numa escola:
   · da Camila, as de sempre (dados/escola: 2ºB, 2ºA e 1ºC no Aurora; 9ºA na Rio Cachoeira);
   · mais as que ele CONFIRMOU na demonstração (a 3ºA depois de "Confirmar", a 3ºB depois da correção da
     coordenação, a 3ºA de Física do Marcos), com a disciplina da alocação. Sem a confirmação, a turma não abre (D3). */

export type TurmaProfessora = (typeof TURMAS)[number] & { nova?: boolean }

const ESTATICAS_DA_CAMILA = TURMAS.map((t) => t.id)

/** As turmas do professor da sessão (numa escola, quando passada). */
export function useTurmasDoProfessor(escolaId?: string): TurmaProfessora[] {
  const prof = useProfessorAtual()
  const aloc = useAlocacoes(prof.profId)
  const acesso = useEstadoAcesso()
  return useMemo(() => {
    void acesso
    const base: TurmaProfessora[] = prof.id === 'camila' ? [...TURMAS] : []
    const confirmadas = aloc.filter((a) => a.estado === 'confirmado' && !ESTATICAS_DA_CAMILA.includes(a.turmaId))
    const novas: TurmaProfessora[] = confirmadas.map((a) => {
      const t = turmaPorId(a.turmaId)
      return {
        id: a.turmaId, nome: a.turma, serie: t?.serie ?? '', disciplina: a.disciplina, alunos: listaDe(a.turmaId).length,
        turno: t?.turno ?? 'Manhã', escolaId: 'aurora', nova: true,
      }
    })
    const todas = [...base, ...novas]
    return escolaId ? todas.filter((t) => t.escolaId === escolaId) : todas
  }, [prof, aloc, acesso, escolaId])
}

/** As turmas da professora numa escola (o nome de antes; agora é o professor da sessão). */
export function useTurmasDaProfessora(escolaId: string): TurmaProfessora[] {
  return useTurmasDoProfessor(escolaId)
}

/** Uma turma pelo id (as de sempre e as da escola, como a 3ºA). */
export function turmaDaProfessora(id: string): TurmaProfessora | undefined {
  const t = TURMAS.find((x) => x.id === id)
  if (t) return t
  const e = turmaPorId(id)
  if (!e) return undefined
  return { id: e.id, nome: e.nome, serie: e.serie, disciplina: 'Química', alunos: listaDe(e.id).length, turno: e.turno, escolaId: 'aurora', nova: true }
}

/** A turma da próxima aula numa escola: é a que a caixa de pedido já traz escolhida. */
export function turmaDaProximaAula(escolaId: string): string {
  return escolaId === 'cachoeira' ? '9a' : '2b'
}

/** A próxima aula de uma turma: quando, o conteúdo (pode não haver) e se é agora. */
export function aulaDe(turmaId: string): { quando: string; conteudo: string | null; agora?: boolean } {
  return resumoDa(turmaId).proximaAula
}
