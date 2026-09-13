import { CodigoDeErro, MENSAGENS_DE_ERRO, type RespostaDeErro } from '@educa/shared'
import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import { contextoAtual } from '../contexto/contexto.js'
import type { LoggerBase } from '../log/logger.js'
import { ErroDeDominio } from './erro-de-dominio.js'
import { mapearErroPostgres } from './mapear-erro-postgres.js'
import { resumirErro } from './resumir-erro.js'

/** Exceção HTTP do próprio Nest (rota inexistente, corpo JSON inválido) vira código tipado. */
function codigoDoStatusHttp(status: number): CodigoDeErro {
  if (status === 404) return CodigoDeErro.NAO_ENCONTRADO
  if (status === 409) return CodigoDeErro.CONFLITO
  if (status === 408 || status === 504) return CodigoDeErro.TEMPO_ESGOTADO
  if (status === 429) return CodigoDeErro.LIMITE_EXCEDIDO
  if (status === 503) return CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO
  if (status >= 400 && status < 500) return CodigoDeErro.ENTRADA_INVALIDA
  return CodigoDeErro.ERRO_INTERNO
}

function traduzir(excecao: unknown): ErroDeDominio {
  if (excecao instanceof ErroDeDominio) return excecao
  const doPostgres = mapearErroPostgres(excecao)
  if (doPostgres !== undefined) return doPostgres
  if (excecao instanceof HttpException) {
    const status = excecao.getStatus()
    const codigo = codigoDoStatusHttp(status)
    return new ErroDeDominio(codigo, codigo === CodigoDeErro.ERRO_INTERNO ? 500 : status)
  }
  return new ErroDeDominio(CodigoDeErro.ERRO_INTERNO)
}

/**
 * Última barreira entre uma exceção e o cliente. A resposta é sempre o envelope tipado, com a
 * mensagem do catálogo: o texto da exceção, a pilha, a consulta e o `detail` do Postgres não
 * saem da API (regra 20, item 11). O log leva o resumo do erro, também sem mensagem.
 */
@Catch()
export class FiltroGlobalDeErro implements ExceptionFilter {
  constructor(private readonly logger: LoggerBase) {}

  catch(excecao: unknown, host: ArgumentsHost): void {
    const erro = traduzir(excecao)
    const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
    const registro = { evento: 'http.erro', status: erro.status, codigo: erro.codigo }
    if (erro.status >= 500) {
      this.logger.error({ ...registro, erro: resumirErro(excecao) })
    } else {
      // Erro do cliente não precisa de pilha, e numa manhã de 404 ela só engorda o log.
      const { pilha: _pilha, ...semPilha } = resumirErro(excecao)
      this.logger.warn({ ...registro, erro: semPilha })
    }

    if (host.getType() !== 'http') return
    const resposta = host.switchToHttp().getResponse<ServerResponse>()
    if (resposta.headersSent) {
      resposta.destroy()
      return
    }
    const corpo: RespostaDeErro = {
      erro: { codigo: erro.codigo, mensagem: MENSAGENS_DE_ERRO[erro.codigo], requisicaoId },
    }
    resposta.statusCode = erro.status
    resposta.setHeader('Content-Type', 'application/json; charset=utf-8')
    resposta.setHeader('Cache-Control', 'no-store')
    resposta.end(JSON.stringify(corpo))
  }
}
