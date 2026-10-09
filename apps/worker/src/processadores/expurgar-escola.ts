import {
  ALVOS_DO_EXPURGO_DA_ESCOLA,
  contextoAtual,
  estaNaJanela,
  LOTE_DO_EXPURGO,
  ordemDaNoite,
  resumirErro,
  type ConfiguracaoOperacional,
  type ExpurgoDaEscolaRepository,
  type JanelaLetiva,
  type LoggerBase,
  type Relogio,
  type RetencaoDaEscolaRepository,
} from '@educa/nucleo'
import { CodigoDeFalhaDeJob, retencaoDaEscola } from '@educa/shared'
import type { Processador } from '../executor.js'
import { FalhaDeJob } from '../falha-de-job.js'

/** O job da escola que a rotina noturna grava, um por escola e noite (`sistema.expurgar-dado-pessoal`). */
export const TIPO_EXPURGAR_ESCOLA = 'retencao.expurgar-escola'

export interface DependenciasDoExpurgoDaEscola {
  repositorio: Pick<ExpurgoDaEscolaRepository, 'expurgarLote' | 'expurgarRegistroDoExpurgo' | 'registrar' | 'categoriaPendente'>
  retencao: Pick<RetencaoDaEscolaRepository, 'ajustes'>
  /** O horário letivo da escola do contexto: o expurgo confere a cada lote, e para quando ele abre. */
  janelaDaEscola: Pick<ConfiguracaoOperacional<JanelaLetiva>, 'daEscola'>
  relogio: Relogio
  logger: LoggerBase
  /** Linhas por lote. Só o teste troca. */
  lote?: number
}

/**
 * `retencao.expurgar-escola` (F3, tarefas 3.0 a 5.0; Tech Spec do F3, seção 5): no contexto da escola do job, apaga,
 * anonimiza ou elimina, como o catálogo diz, o que passou do prazo efetivo de cada categoria (`retencaoDaEscola`, com o ajuste da
 * escola e as travas: o tema da execução e o texto do modelo não passam da conversa do professor, e o aluno do consumo não
 * passa da conversa do Tutor), em lotes de 5.000, uma transação por lote, e grava uma linha de `expurgo_execucao` por
 * categoria, mesmo com zero. Terminadas as categorias, apaga o próprio registro do expurgo (`expurgo_execucao`) que passou
 * de 5 anos, sem linha sobre isso.
 *
 * - **O lote que falha** grava a linha da categoria com `concluida = false` antes de o erro subir, para a falha contar
 *   no alerta mesmo na primeira noite da escola.
 * - **A janela letiva é conferida antes de cada lote.** Se ela abriu, a categoria em andamento grava `concluida = false`
 *   com o que já saiu, e o job termina sem passar às seguintes. A noite seguinte começa pela categoria pendente e dá a
 *   volta no catálogo; duas noites seguidas sem terminar disparam o alerta (`expurgo.noites_incompletas`).
 * - **O corte é contado de um `agora` só**, lido no começo: a execução inteira usa o mesmo prazo, e o teste o injeta.
 *   A janela usa o relógio a cada lote. O fuso do horário letivo vai junto ao lote: a autoria de artefato conta de uma
 *   data, e o dia que vale é o da escola.
 * - Tolera reexecução e dois jobs da mesma escola ao mesmo tempo (D49): o que saiu não volta, o que foi anonimizado não é
 *   relido, e o `skip locked` dá a cada um linhas diferentes. Um job que morre no meio desfaz só o lote em andamento.
 * - Loga só a categoria (sob `tipo`) e as contagens; a escola vai pelo contexto, nunca uma linha.
 */
export function criarExpurgoDaEscola({ repositorio, retencao, janelaDaEscola, relogio, logger, lote = LOTE_DO_EXPURGO }: DependenciasDoExpurgoDaEscola): Processador {
  return async () => {
    if (contextoAtual()?.escolaId === undefined) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    const agora = relogio.agora()
    const prazos = new Map(retencaoDaEscola(await retencao.ajustes()).map(({ categoria, meses }) => [categoria, meses]))
    const janela = await janelaDaEscola.daEscola()
    const ordem = ordemDaNoite(await repositorio.categoriaPendente())
    let linhasTotal = 0
    for (const categoria of ordem) {
      const meses = prazos.get(categoria)
      if (meses === undefined) throw new Error(`categoria sem prazo no catálogo: ${categoria}`)
      let linhasDaCategoriaTotal = 0
      try {
        for (const alvo of ALVOS_DO_EXPURGO_DA_ESCOLA[categoria]) {
          for (;;) {
            if (estaNaJanela(janela, relogio.agora())) {
              await repositorio.registrar(categoria, linhasDaCategoriaTotal, false, relogio.agora())
              linhasTotal += linhasDaCategoriaTotal
              // A categoria vai sob `tipo`: o nome dela é do catálogo, nunca de pessoa.
              const tipo = categoria
              logger.info({ evento: 'retencao.expurgo_interrompido', tipo, linhasDaCategoriaTotal, linhasTotal })
              return
            }
            const doLote = await repositorio.expurgarLote(alvo, { agora, meses, fuso: janela.fuso }, lote)
            linhasDaCategoriaTotal += doLote.linhas
            if (!doLote.cheio) break
          }
        }
      } catch (erro) {
        // O lote que falha (prazo da instrução, erro de SQL) também deixa a linha da noite, `false`: sem ela, a escola cujo
        // expurgo falha desde a primeira noite nunca teria série, e o alerta de duas noites nunca dispararia. O erro sobe,
        // e a fila tenta de novo; se nem a linha grava (o banco fora), fica o aviso e sobe o erro original. A gravação da
        // janela letiva, acima, também está aqui dentro: se ela falhar, esta tenta a mesma linha de novo, uma vez só.
        await repositorio.registrar(categoria, linhasDaCategoriaTotal, false, relogio.agora()).catch((falhaDoRegistro: unknown) => {
          const tipo = categoria
          logger.warn({ evento: 'retencao.registro_nao_gravado', tipo, erro: resumirErro(falhaDoRegistro) })
        })
        throw erro
      }
      await repositorio.registrar(categoria, linhasDaCategoriaTotal, true, relogio.agora())
      linhasTotal += linhasDaCategoriaTotal
    }
    // O registro do próprio expurgo (prazo fixo de 5 anos) sai depois das categorias, também em lotes e sem passar da janela
    // letiva. A noite já está completa (cada categoria gravou `true`): se a janela abrir aqui, o resto sai na seguinte.
    let registroApagadoTotal = 0
    for (;;) {
      if (estaNaJanela(janela, relogio.agora())) {
        const tipo = 'expurgo_execucao'
        logger.info({ evento: 'retencao.expurgo_interrompido', tipo, registroApagadoTotal, linhasTotal })
        return
      }
      const doLote = await repositorio.expurgarRegistroDoExpurgo(agora, lote)
      registroApagadoTotal += doLote.linhas
      if (!doLote.cheio) break
    }
    const categoriasTotal = ordem.length
    logger.info({ evento: 'retencao.expurgada', categoriasTotal, linhasTotal, registroApagadoTotal })
  }
}
