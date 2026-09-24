import 'reflect-metadata'
import { criarLogger, type PoolBanco } from '@educa/nucleo'
import { MENSAGENS_DE_ERRO, type CodigoDeErro } from '@educa/shared'
import type { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { AddressInfo } from 'node:net'
import { expect } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { configurarAplicacao } from '../src/configurar-app.js'
import { configuracaoDeTeste, MONTAGEM_DE_TESTE } from './configuracao-de-teste.js'

/**
 * O que os testes de integração do painel da operação (A0b) têm em comum: a API montada com o log capturado, o pedido
 * com o token de operador, a conferência do erro tipado e o `desativar` segurado pelo teste.
 */

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** A espera das travas cabe folgada no prazo das consultas: o `statement_timeout` conta a espera de trava. */
export const PRAZO_DAS_CONSULTAS_MS = 15_000

/** A consulta do autor ativo, parada no `for share` (7c, "Autor ativo"). */
export const ESPERA_DO_AUTOR = '%from "operador"%for share%'

export interface Resposta {
  readonly status: number
  readonly corpo: unknown
  readonly texto: string
  readonly retryAfter: string | null
  readonly cacheControl: string | null
}

/** Um pedido à API, com o token de operador (ou sem nenhum, com `token` indefinido). */
export async function pedir(url: string, verbo: 'GET' | 'POST', caminho: string, token: string | undefined, corpo?: unknown): Promise<Resposta> {
  const resposta = await fetch(`${url}${caminho}`, {
    method: verbo,
    headers: { ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }), ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  })
  const texto = await resposta.text()
  return {
    status: resposta.status,
    corpo: texto === '' ? undefined : (JSON.parse(texto) as unknown),
    texto,
    retryAfter: resposta.headers.get('retry-after'),
    cacheControl: resposta.headers.get('cache-control'),
  }
}

export function esperarErro(resposta: Resposta, status: number, codigo: CodigoDeErro): void {
  expect(resposta.status).toBe(status)
  expect(resposta.corpo).toEqual({ erro: { codigo, mensagem: MENSAGENS_DE_ERRO[codigo], requisicaoId: expect.stringMatching(UUID) } })
}

/**
 * A API inteira, com cada linha de log em `linhasDeLog` e o prazo das consultas folgado; um prazo curto
 * (`prazoDasConsultasMs`) é para o teste que quer o `statement_timeout` estourando numa trava segura.
 */
export async function subirApiDoPainel(linhasDeLog: string[], ambiente: Record<string, string> = {}, prazoDasConsultasMs = PRAZO_DAS_CONSULTAS_MS): Promise<{ app: INestApplication; url: string }> {
  const app = await NestFactory.create(AppModule.com(configuracaoDeTeste({ banco: { timeoutConsultaMs: prazoDasConsultasMs }, ambiente }), MONTAGEM_DE_TESTE), { logger: false })
  configurarAplicacao(app, criarLogger({ servico: 'api-teste', nivel: 'info', destino: { write: (linha: string) => linhasDeLog.push(linha) } }))
  await app.listen(0, '127.0.0.1')
  return { app, url: `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}` }
}

/**
 * O que o `desativar` do `ops:operador` faz na linha do operador, numa transação que o teste abre e segura com o
 * `for update`: `confirmar` desativa e confirma; `desfazer` desiste, se ainda não confirmou.
 */
export async function segurarODesativar(pool: PoolBanco, operadorId: string): Promise<{ confirmar: () => Promise<void>; desfazer: () => Promise<void> }> {
  const conexao = await pool.connect()
  await conexao.query('begin')
  await conexao.query('select id from operador where id = $1 for update', [operadorId])
  let terminou = false
  return {
    confirmar: async () => {
      await conexao.query(
        `update operador set nome = null, email = null, senha_hash = null, mfa_segredo_cifrado = null, mfa_chave_versao = null,
           mfa_ativado_em = null, mfa_ultimo_passo = null, desativado_em = now() where id = $1`,
        [operadorId],
      )
      await conexao.query('commit')
      terminou = true
      conexao.release()
    },
    desfazer: async () => {
      if (terminou) return
      terminou = true
      await conexao.query('rollback')
      conexao.release()
    },
  }
}
