/**
 * A saudação da Home (`docs/interface.md` 11.2): pela hora, com o primeiro nome. É a única coisa da tela que muda com o
 * relógio, e muda três vezes por dia: nada aqui conta tempo de uso nem dá os parabéns por voltar (D59).
 */

/** "Bom dia" das 5h às 11h59, "Boa tarde" das 12h às 17h59, "Boa noite" no resto. */
export function cumprimentoDaHora(hora: number): string {
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** O primeiro nome, como a pessoa é chamada: "Camila Souza" → "Camila". Nome em branco não tem primeiro nome. */
export function primeiroNome(nome: string): string | undefined {
  const primeiro = nome.trim().split(/\s+/)[0]
  return primeiro === undefined || primeiro === '' ? undefined : primeiro
}

/** "Bom dia, Camila." Sem o nome ainda lido, só o cumprimento: "Bom dia." */
export function saudacao(nome: string | undefined, agora: Date): string {
  const cumprimento = cumprimentoDaHora(agora.getHours())
  const primeiro = nome === undefined ? undefined : primeiroNome(nome)
  return primeiro === undefined ? `${cumprimento}.` : `${cumprimento}, ${primeiro}.`
}
