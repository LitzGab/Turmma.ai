import { criarFatia, registrar } from './nucleo'

/* A SESSÃO, a parte que não depende de ninguém (12ª rodada): quem está usando agora, no papel de aluno e no de
   professor, o primeiro acesso já visto e as novidades já abertas (o selo NOVO). Mora aqui, separada de
   `dados/sessao.ts`, para os módulos que CRIAM pessoas (acesso.ts e escola-estado.ts) poderem trocar a sessão sem
   importar quem os importa. As telas usam `dados/sessao.ts`. */

export type EstadoSessao = {
  /** o aluno da sessão: 'lucas' ou o id de uma conta aprovada na demonstração */
  alunoId: string
  /** o professor da sessão: 'camila' ou o id de quem aceitou um convite na demonstração */
  professorId: string
  /** os alunos que já viram o primeiro acesso com a onça */
  onboarding: Record<string, true>
  /** as novidades já abertas (a chave muda quando a coisa muda: o NOVO volta) */
  vistos: Record<string, true>
  /** as introduções já vistas, por papel e pessoa ("professor:camila", "rede:secretaria"); 13ª rodada */
  introducoes: Record<string, true>
}

export const fatiaSessao = criarFatia<EstadoSessao>('sessao', {
  alunoId: 'lucas',
  professorId: 'camila',
  onboarding: {},
  vistos: {},
  introducoes: {},
})

export const sessaoBase = {
  entrarComoAluno(id: string) {
    fatiaSessao.mudar((s) => (s.alunoId === id ? s : { ...s, alunoId: id }))
  },
  entrarComoProfessor(id: string) {
    fatiaSessao.mudar((s) => (s.professorId === id ? s : { ...s, professorId: id }))
  },
  /** Marca o primeiro acesso como visto (só uma vez por aluno). */
  verOnboarding(alunoId: string) {
    if (fatiaSessao.ler().onboarding[alunoId]) return
    fatiaSessao.mudar((s) => ({ ...s, onboarding: { ...s.onboarding, [alunoId]: true } }))
    registrar('onboarding-visto', { alunoId })
  },
  onboardingVisto: (alunoId: string) => !!fatiaSessao.ler().onboarding[alunoId],
  /** Marca a introdução de um papel como vista ("papel:pessoa"). Devolve true quando é a primeira vez. */
  verIntroducao(chave: string): boolean {
    const atual = fatiaSessao.ler()
    if (atual.introducoes?.[chave]) return false
    fatiaSessao.mudar((s) => ({ ...s, introducoes: { ...(s.introducoes ?? {}), [chave]: true } }))
    return true
  },
  introducaoVista: (chave: string) => !!fatiaSessao.ler().introducoes?.[chave],
  marcarVisto(chave: string) {
    if (fatiaSessao.ler().vistos[chave]) return
    fatiaSessao.mudar((s) => ({ ...s, vistos: { ...s.vistos, [chave]: true } }))
  },
}
