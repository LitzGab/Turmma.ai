import {
  ArquivoDoTitularRepository,
  chaveDoObjeto,
  contextoAtual,
  LeituraDoTitular,
  type ArmazemDeArquivos,
  type Banco,
  type LoggerBase,
  type Relogio,
} from '@educa/nucleo'
import { CodigoDeFalhaDeJob, TIPO_DO_JOB_MONTAR_ARQUIVO, TIPOS_DE_PEDIDO_COM_ARQUIVO, type VersaoDoArquivo } from '@educa/shared'
import { z } from 'zod'
import type { Processador } from '../executor.js'
import { FalhaDeJob } from '../falha-de-job.js'

/** O job que monta o arquivo do titular (F3, tarefa 13.0): `normal`, só com o id do pedido (regra 20, itens 9 e 12). */
export const TIPO_MONTAR_ARQUIVO = TIPO_DO_JOB_MONTAR_ARQUIVO

/** O job leva **só o id do pedido**: o nome e todo o resto são lidos aqui dentro, na escola do job (Tech Spec do F3, seção 5). */
const esquemaDoJob = z.strictObject({ pedidoId: z.uuid() })

export interface DependenciasDaMontagemDoArquivo {
  banco: Banco
  armazem: ArmazemDeArquivos
  relogio: Relogio
  logger: LoggerBase
}

/**
 * `titular.montar-arquivo` (F3, tarefa 13.0; Tech Spec do F3, seção 5, "Arquivo"): no contexto da escola do job, lê o que
 * a escola guarda do titular do pedido, grava o JSON no storage privado e passa o pedido de `em_preparacao` para `pronto`.
 *
 * - **Uma versão `completa` sempre; a `coordenacao` só quando o titular não tem conta ativa nesta escola**, e nunca a
 *   conversa do professor nela (regra 70, item 8). A conta ativa é por escola.
 * - **O objeto vai antes da linha.** O job grava todos os objetos e só então, numa transação, as linhas e o estado. A
 *   mesma chave sobrescreve o objeto órfão de uma tentativa que morreu entre as duas coisas, e o `on conflict do update`
 *   do único `(escola_id, pedido_id, versao)` torna dois jobs do mesmo pedido inofensivos.
 * - **Armazém fora**: o erro sobe, o pedido continua `em_preparacao` e a fila tenta de novo. Nada do que o storage disse
 *   sai no erro (`ErroParaAFila` leva só o código), e o log leva só o id do pedido e contagens.
 * - O titular que já não existe na escola não tem o que montar: termina sem efeito. O pedido de acesso dele fica
 *   `em_preparacao` e o alerta de duas horas o mostra.
 */
export function criarMontagemDoArquivo({ banco, armazem, relogio, logger }: DependenciasDaMontagemDoArquivo): Processador {
  return async (dados) => {
    const escolaId = contextoAtual()?.escolaId
    const lido = esquemaDoJob.safeParse(dados)
    if (escolaId === undefined || !lido.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    const { pedidoId } = lido.data
    const arquivos = new ArquivoDoTitularRepository(banco)
    const pedido = await arquivos.pedidoParaMontar(pedidoId)
    if (pedido === undefined || !TIPOS_DE_PEDIDO_COM_ARQUIVO.some((tipo) => tipo === pedido.tipo)) {
      logger.info({ evento: 'titular.arquivo_sem_pedido_que_monte' })
      return
    }
    const ativa = await arquivos.contaAtiva(pedido.titularId)
    if (ativa === undefined) {
      logger.info({ evento: 'titular.arquivo_sem_titular' })
      return
    }
    const versoes: VersaoDoArquivo[] = ativa ? ['completa'] : ['completa', 'coordenacao']
    const agora = relogio.agora()
    const leitura = new LeituraDoTitular(banco)
    const prontas: Array<{ versao: VersaoDoArquivo; bytes: number }> = []
    for (const versao of versoes) {
      const documento = await leitura.montar({ titularId: pedido.titularId, papel: pedido.papel, versao, compartilhamento: pedido.compartilhamento, geradoEm: agora })
      const json = JSON.stringify(documento)
      await armazem.guardar(chaveDoObjeto(escolaId, pedido.id, versao), json)
      prontas.push({ versao, bytes: Buffer.byteLength(json, 'utf8') })
    }
    const mudou = await banco.transaction(async (tx) => {
      const gravacao = new ArquivoDoTitularRepository(tx)
      for (const { versao, bytes } of prontas) await gravacao.gravar(pedido.id, versao, bytes, agora)
      return gravacao.marcarPronto(pedido.id)
    })
    const versoesTotal = prontas.length
    const status = mudou ? 'pronto' : 'estado_ja_nao_era_em_preparacao'
    logger.info({ evento: 'titular.arquivo_pronto', versoesTotal, status })
  }
}
