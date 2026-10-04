import { diaDeUso, ErroDeDominio, limitesDoMes, RegistroDeAuditoria, relogioDoSistema, type Banco, type Relogio } from '@educa/nucleo'
import {
  CHAVES_DE_FUNCAO,
  CodigoDeErro,
  esquemaRespostaConsumo,
  esquemaRespostaFuncaoDaGovernanca,
  esquemaRespostaFuncoesDaGovernanca,
  esquemaRespostaResumoDaGovernanca,
  montarTime,
  TROCAS_POR_DIA_PADRAO_DO_TUTOR,
  TROCAS_POR_MES_PADRAO_DO_TUTOR,
  type ChaveDeFuncao,
  type ConsultaConsumo,
  type ConsultaResumoDaGovernanca,
  type ConsumoSomado,
  type FuncaoDaGovernanca,
  type PedidoSuspenderFuncao,
  type RespostaConsumo,
  type RespostaFuncoesDaGovernanca,
  type RespostaResumoDaGovernanca,
} from '@educa/shared'
import { paginar } from '../estrutura/entrada.js'
import { GovernancaRepository, type SuspensaoLida } from './governanca.repository.js'

const registro = new RegistroDeAuditoria()

/** O primeiro dia do mês seguinte a `mes` (`AAAA-MM`): é onde o período do consumo fecha, sem incluir. */
function primeiroDiaDoMesSeguinte(mes: string): string {
  const { ultimo } = limitesDoMes(mes)
  const dia = new Date(`${ultimo}T00:00:00Z`)
  dia.setUTCDate(dia.getUTCDate() + 1)
  return dia.toISOString().slice(0, 10)
}

const SEM_CONSUMO: ConsumoSomado = { chamadas: 0, tokensDeEntrada: 0, tokensDeSaida: 0, custoMicros: 0, comEnvioExterno: 0 }

/**
 * A governança de IA da coordenação (MVP, A5; D9, D14, D45, D60, D64; regra 70, itens 5, 6, 8 e 9).
 *
 * - **O resumo** diz o que a IA gerou e que uma pessoa decidiu, e quando. **Não diz quem**: quem aprovou está na
 *   auditoria (`entrega.decidida`, `lote.aprovado`), que responde por id. Não há turma, professor, título nem
 *   justificativa, e a lista só traz entrega de série com dois ou mais professores (D45).
 * - **As funções** são o catálogo `FUNCOES`, em código, com a suspensão vigente desta escola.
 * - **Suspender** grava a suspensão vigente e audita; a função passa a recusar execução nova **no servidor** (quem
 *   confere é o `AgendadorDeExecucoes`, o `LLMProvider` e a `ConferenciaDeFuncao`). Não apaga nada, e a entrega pendente
 *   continua decidível pelo professor. Suspender a que já está suspensa devolve a vigente, sem segunda linha e sem
 *   segunda auditoria. **Retomar** fecha a vigente e audita; sem vigente, `NAO_ENCONTRADO`.
 * - **O consumo** é somado por função e por mês. Não abre por origem, por aluno nem por pessoa.
 */
export class GovernancaService {
  constructor(
    private readonly banco: Banco,
    private readonly relogio: Relogio = relogioDoSistema,
  ) {}

  async resumo(consulta: ConsultaResumoDaGovernanca): Promise<RespostaResumoDaGovernanca> {
    const governanca = new GovernancaRepository(this.banco)
    const numeros = await governanca.numeros()
    const { itens, proxima } = paginar(await governanca.entregas(consulta), consulta.limite)
    return esquemaRespostaResumoDaGovernanca.parse({
      numeros,
      itens: itens.map((item) => ({
        id: item.id,
        funcao: item.funcao,
        tipo: item.tipo,
        estado: item.estado,
        serie: { id: item.serieId, etapa: item.etapa, ano: item.ano },
        criadaEm: item.criadaEm.toISOString(),
        decididaEm: item.decididaEm?.toISOString() ?? null,
      })),
      ...(proxima === undefined ? {} : { proxima }),
    })
  }

  async funcoes(): Promise<RespostaFuncoesDaGovernanca> {
    return esquemaRespostaFuncoesDaGovernanca.parse({ agentes: this.#agentes(await new GovernancaRepository(this.banco).suspensoesVigentes()) })
  }

  #agentes(vigentes: readonly SuspensaoLida[]): RespostaFuncoesDaGovernanca['agentes'] {
    const porFuncao = new Map(vigentes.map((suspensao) => [suspensao.funcao, suspensao]))
    return montarTime(new Set(porFuncao.keys())).agentes.map((agente) => ({
      ...agente,
      funcoes: agente.funcoes.map((funcao) => {
        const suspensao = porFuncao.get(funcao.chave)
        return { ...funcao, suspensao: suspensao === undefined ? null : { suspensaEm: suspensao.suspensaEm.toISOString(), motivo: suspensao.motivo } }
      }),
    }))
  }

  #funcao(vigentes: readonly SuspensaoLida[], chave: ChaveDeFuncao): FuncaoDaGovernanca {
    const funcao = this.#agentes(vigentes)
      .flatMap((agente) => agente.funcoes)
      .find((candidata) => candidata.chave === chave)
    if (funcao === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return esquemaRespostaFuncaoDaGovernanca.parse(funcao)
  }

  async suspender(chave: ChaveDeFuncao, { motivo }: PedidoSuspenderFuncao): Promise<FuncaoDaGovernanca> {
    return this.banco.transaction(async (tx) => {
      const governanca = new GovernancaRepository(tx)
      const suspensaoId = await governanca.suspender(chave, motivo ?? null)
      // Só a suspensão que nasceu agora é auditada: o segundo clique acha a vigente e não repete o registro.
      if (suspensaoId !== undefined) await registro.gravar(tx, 'funcao.suspensa', { entidadeId: suspensaoId, depois: { funcao: chave, motivo: motivo ?? null } })
      return this.#funcao(await governanca.suspensoesVigentes(), chave)
    })
  }

  async retomar(chave: ChaveDeFuncao): Promise<FuncaoDaGovernanca> {
    return this.banco.transaction(async (tx) => {
      const governanca = new GovernancaRepository(tx)
      const retomada = await governanca.retomar(chave)
      if (retomada === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      await registro.gravar(tx, 'funcao.retomada', {
        entidadeId: retomada.id,
        antes: { funcao: chave, suspensaEm: retomada.suspensaEm.toISOString() },
        depois: { retomadaEm: retomada.retomadaEm.toISOString() },
      })
      return this.#funcao(await governanca.suspensoesVigentes(), chave)
    })
  }

  async consumo(consulta: ConsultaConsumo): Promise<RespostaConsumo> {
    const governanca = new GovernancaRepository(this.banco)
    // Sem o mês na consulta, o mês corrente, que vira no fuso do uso como o freio do Tutor.
    const mes = consulta.mes ?? diaDeUso(this.relogio.agora()).slice(0, 7)
    const desde = `${mes}-01`
    const ate = primeiroDiaDoMesSeguinte(mes)
    const linhas = await governanca.consumoPorFuncao(desde, ate)
    // Na ordem do catálogo, e só as funções que gastaram no mês.
    const porFuncao = CHAVES_DE_FUNCAO.flatMap((funcao) => linhas.filter((linha) => linha.funcao === funcao))
    const total = porFuncao.reduce<ConsumoSomado>(
      (soma, linha) => ({
        chamadas: soma.chamadas + linha.chamadas,
        tokensDeEntrada: soma.tokensDeEntrada + linha.tokensDeEntrada,
        tokensDeSaida: soma.tokensDeSaida + linha.tokensDeSaida,
        custoMicros: soma.custoMicros + linha.custoMicros,
        comEnvioExterno: soma.comEnvioExterno + linha.comEnvioExterno,
      }),
      SEM_CONSUMO,
    )
    const pacote = await governanca.pacoteDoTutor()
    const trocasPorMesPorAluno = pacote.porMes ?? TROCAS_POR_MES_PADRAO_DO_TUTOR
    return esquemaRespostaConsumo.parse({
      mes,
      total,
      porFuncao,
      tutor: {
        trocasNoMes: await governanca.trocasComOTutor(desde, ate),
        pacoteDoMes: trocasPorMesPorAluno * pacote.alunos,
        trocasPorDiaPorAluno: pacote.porDia ?? TROCAS_POR_DIA_PADRAO_DO_TUTOR,
        trocasPorMesPorAluno,
      },
    })
  }
}
