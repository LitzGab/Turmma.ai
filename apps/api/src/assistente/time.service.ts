import { exigirEscolaDoContexto, suspensaoDeFuncao, type Banco } from '@educa/nucleo'
import { esquemaRespostaTime, montarTime, type ChaveDeFuncao, type RespostaTime } from '@educa/shared'
import { and, eq, isNull } from 'drizzle-orm'

/**
 * As funções com suspensão vigente na escola do contexto (D60): a que não foi retomada. No máximo uma linha por função
 * (índice único parcial), e no máximo seis funções: a leitura não precisa de página. A escola vem do contexto.
 */
export class SuspensoesDaEscolaRepository {
  constructor(private readonly banco: Banco) {}

  async vigentes(): Promise<ChaveDeFuncao[]> {
    const linhas = await this.banco
      .select({ funcao: suspensaoDeFuncao.funcao })
      .from(suspensaoDeFuncao)
      .where(and(eq(suspensaoDeFuncao.escolaId, exigirEscolaDoContexto()), isNull(suspensaoDeFuncao.retomadaEm)))
    return linhas.map((linha) => linha.funcao)
  }
}

/**
 * `GET /v1/time` (MVP, A2 e A5; D9, D32, D60; regra 70, item 5): os três agentes, as funções de cada um, a autonomia em
 * português comum e se a função está suspensa **nesta escola**. O que é fixo vem do catálogo `FUNCOES`, em código
 * (`montarTime`); do banco vem só a suspensão vigente. Professor e coordenação leem o mesmo, e nada aqui é dado de pessoa.
 *
 * É por esta rota que a tela diz, na entrega pendente de uma função suspensa, que a função está suspensa: a entrega
 * traz a `funcao`, e o time, o `suspensa` dela.
 */
export class TimeService {
  constructor(private readonly banco: Banco) {}

  async ler(): Promise<RespostaTime> {
    return esquemaRespostaTime.parse(montarTime(new Set(await new SuspensoesDaEscolaRepository(this.banco).vigentes())))
  }
}
