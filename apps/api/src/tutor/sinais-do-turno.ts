import type { TipoDeSinalDeTrabalho } from '@educa/shared'

/**
 * Os dois sinais que saem de **regra nossa**, e não da classificação do turno: `travou` e `duvida_repetida` (MVP, A4;
 * glossário, "Sinal"; D57; `docs/aia/sinais-e-alertas.md`, N1 a N3). A regra é uma conta sobre **onde** o aluno pediu
 * ajuda (a atividade e a questão, ou o material e a página), e nada mais: não lê o que ele escreveu, não mede tempo
 * entre trocas, não olha navegação e não conclui nada sobre a pessoa.
 *
 * Os limiares são **decisão de produto em aberto** (`CLAUDE.md`, "Indicadores de desempenho do professor e do aluno"):
 * os valores abaixo são o ponto de partida da fatia de apresentação.
 */

/**
 * Quantas trocas seguidas na mesma questão (ou na mesma página), sem sair dela, fazem o sinal `travou`. Quatro é o
 * ponto em que o Tutor já fez as três perguntas diferentes que tem para uma questão e o aluno continua nela.
 */
export const TROCAS_SEGUIDAS_PARA_TRAVOU = 4

/**
 * Quantos turnos anteriores do aluno a regra olha, do mais novo para trás. É o teto da leitura, para a conta não crescer
 * com o ano: a volta a uma questão pedida há mais turnos que isso não gera `duvida_repetida`.
 */
export const TURNOS_QUE_A_REGRA_OLHA = 200

/** Onde o aluno estava num turno, e em que dia de uso (`AAAA-MM-DD`). Sem texto: a regra não tem como ler a conversa. */
export interface TurnoDoAluno {
  readonly atividadeAplicadaId: string | null
  readonly questao: number | null
  readonly materialId: string | null
  readonly pagina: number | null
  readonly dia: string
}

export interface SinalDeTrabalho {
  readonly tipo: Extract<TipoDeSinalDeTrabalho, 'travou' | 'duvida_repetida'>
  readonly atividadeAplicadaId: string | null
  readonly questao: number | null
  readonly materialId: string | null
  readonly pagina: number | null
}

/**
 * A referência exata do turno: a questão da atividade, ou a página do material. Turno só com a atividade, só com o
 * material ou sem nada não tem referência exata, e não conta para sinal nenhum: "a mesma dúvida" precisa de um "onde".
 */
function referenciaDe(turno: TurnoDoAluno): string | undefined {
  if (turno.atividadeAplicadaId !== null && turno.questao !== null) return `questao:${turno.atividadeAplicadaId}:${String(turno.questao)}`
  if (turno.materialId !== null && turno.pagina !== null) return `pagina:${turno.materialId}:${String(turno.pagina)}`
  return undefined
}

/**
 * Os sinais de trabalho que o turno de agora gera, dado o que o aluno pediu antes (`anteriores`, do mais antigo para o
 * mais novo, só turnos que o Tutor respondeu).
 *
 * - **Sessão** é o trecho de turnos seguidos na mesma referência, no mesmo dia de uso. Ela acaba quando o aluno pede
 *   ajuda em outra questão ou página, ou quando o dia vira. Não há relógio aqui: tempo parado não abre nem fecha sessão.
 * - **`travou`**: a sessão chegou a `TROCAS_SEGUIDAS_PARA_TRAVOU` trocas. Nasce uma vez, na troca que completa a conta,
 *   e não de novo a cada troca seguinte.
 * - **`duvida_repetida`**: o turno abre uma sessão nova numa referência em que o aluno já tinha pedido ajuda antes.
 *   Nasce uma vez por volta.
 */
export function sinaisDeTrabalhoDoTurno(atual: TurnoDoAluno, anteriores: readonly TurnoDoAluno[]): SinalDeTrabalho[] {
  const referencia = referenciaDe(atual)
  if (referencia === undefined) return []
  let seguidas = 1
  for (let indice = anteriores.length - 1; indice >= 0; indice -= 1) {
    const anterior = anteriores[indice]
    if (anterior === undefined || referenciaDe(anterior) !== referencia || anterior.dia !== atual.dia) break
    seguidas += 1
  }
  const onde = { atividadeAplicadaId: atual.atividadeAplicadaId, questao: atual.questao, materialId: atual.materialId, pagina: atual.pagina }
  // A referência do sinal é uma só: a questão, quando há, e não a página que veio junto.
  const exata = atual.atividadeAplicadaId !== null && atual.questao !== null ? { ...onde, materialId: null, pagina: null } : { ...onde, atividadeAplicadaId: null, questao: null }
  if (seguidas === TROCAS_SEGUIDAS_PARA_TRAVOU) return [{ tipo: 'travou', ...exata }]
  if (seguidas === 1 && anteriores.some((anterior) => referenciaDe(anterior) === referencia)) return [{ tipo: 'duvida_repetida', ...exata }]
  return []
}
