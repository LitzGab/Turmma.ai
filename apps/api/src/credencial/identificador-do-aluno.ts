/** O identificador da conta do aluno no contador e no cookie: a escola e a matrícula, nunca a matrícula sozinha. */
export function identificadorDoAluno(escolaId: string, matricula: string): string {
  return `${escolaId}|${matricula}`
}
