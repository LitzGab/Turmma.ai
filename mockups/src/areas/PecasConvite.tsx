import { ConvidarAlunos } from '@/areas/professor/abas-turma/ConvidarAlunos'

/* Bancada do diálogo "Convidar alunos", aberto, fora de qualquer tela. Não está no menu. */
export function PecasConvite() {
  const turma = new URLSearchParams(window.location.search).get('turma') ?? '2b'
  return <div className="min-h-svh bg-lateral"><ConvidarAlunos turmaId={turma} aberto aoMudar={() => {}} /></div>
}
