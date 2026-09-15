import {
  ConfiguracaoInvalida,
  criarBanco,
  criarPool,
  ErroDeDominio,
  erroDoPostgresEm,
  executarNoContexto,
  FORMATO_OPERADOR,
  FORMATO_SLUG,
  mapearErroPostgres,
  RegistroDeAuditoria,
  resumirErro,
  TAMANHO_MAXIMO_SLUG,
  TIPOS_DE_REDE,
  validarAmbiente,
  type Banco,
  type TipoDeRede,
} from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { RedeEEscolaRepository } from './escola.repository.js'
import { urlDoBancoDeOperacao } from './uso.js'

/**
 * Criação de rede e de escola pelo operador (RF1, D2). Não há rota pública de cadastro: a escola nasce
 * só por aqui.
 *
 *   OPERADOR=<pessoa da equipe> npm run -s ops:escola -- rede criar --nome <nome> --tipo prefeitura|grupo|independente
 *   OPERADOR=<pessoa da equipe> npm run -s ops:escola -- escola criar --rede <uuid> --nome <nome> --slug <endereco>
 *
 * - `OPERADOR` é obrigatório em qualquer ambiente e vai para `autor_operador` da auditoria. Sem ele, o
 *   comando recusa antes de abrir conexão com o banco.
 * - A criação e a auditoria dela são uma transação só. A da escola é gravada no contexto da escola
 *   criada; a da rede, com escola nula.
 * - Imprime só o id criado, em JSON. Nenhum comando do operador lista ou lê pessoa.
 */

export class ArgumentoInvalido extends Error {
  constructor(readonly opcao: string) {
    super(`Opção inválida ou ausente: ${opcao}`)
    this.name = 'ArgumentoInvalido'
  }
}

export type PedidoDoOperador = { entidade: 'rede'; nome: string; tipo: TipoDeRede } | { entidade: 'escola'; redeId: string; nome: string; slug: string }

const TAMANHO_MAXIMO_NOME = 200
// Nome de rede ou escola: texto de uma linha, sem caractere de controle.
const esquemaNome = z
  .string()
  .trim()
  .min(1)
  .max(TAMANHO_MAXIMO_NOME)
  .regex(/^[^\p{Cc}]+$/u)

function lerOpcoes(argumentos: string[]) {
  try {
    return parseArgs({
      args: argumentos,
      options: { nome: { type: 'string' }, tipo: { type: 'string' }, rede: { type: 'string' }, slug: { type: 'string' } },
      strict: true,
      allowPositionals: true,
    })
  } catch {
    // O erro do parseArgs repete o argumento recebido; a mensagem fica só com as opções aceitas.
    throw new ArgumentoInvalido('--nome, --tipo, --rede ou --slug')
  }
}

function nomeValido(valor: string | undefined): string {
  const resultado = esquemaNome.safeParse(valor)
  if (!resultado.success) throw new ArgumentoInvalido('--nome')
  return resultado.data
}

export function lerPedidoDoOperador(argumentos: string[]): PedidoDoOperador {
  const { values: valores, positionals: posicionais } = lerOpcoes(argumentos)
  const comando = posicionais.join(' ')
  if (comando === 'rede criar') {
    if (valores.rede !== undefined || valores.slug !== undefined) throw new ArgumentoInvalido('--rede e --slug não valem para rede')
    const tipo = TIPOS_DE_REDE.find((aceito) => aceito === valores.tipo)
    if (tipo === undefined) throw new ArgumentoInvalido('--tipo')
    return { entidade: 'rede', nome: nomeValido(valores.nome), tipo }
  }
  if (comando === 'escola criar') {
    if (valores.tipo !== undefined) throw new ArgumentoInvalido('--tipo não vale para escola')
    if (valores.rede === undefined || !z.uuid().safeParse(valores.rede).success) throw new ArgumentoInvalido('--rede')
    const slug = valores.slug
    if (slug === undefined || slug.length > TAMANHO_MAXIMO_SLUG || !FORMATO_SLUG.test(slug)) throw new ArgumentoInvalido('--slug')
    return { entidade: 'escola', redeId: valores.rede.toLowerCase(), nome: nomeValido(valores.nome), slug }
  }
  throw new ArgumentoInvalido('comando (rede criar | escola criar)')
}

const registro = new RegistroDeAuditoria()

const esquemaAmbienteOperador = z.object({ OPERADOR: z.string().regex(FORMATO_OPERADOR) })

/** Quem da equipe roda o comando. Ausente ou fora do formato, recusa pelo nome da variável, sem o valor. */
export function lerOperador(ambiente: Record<string, string | undefined>): string {
  return validarAmbiente(esquemaAmbienteOperador, ambiente).OPERADOR
}

/** Cria a rede e grava `rede.criada`, com escola nula e o operador como autor, na mesma transação. */
export function criarRede(banco: Banco, operador: string, pedido: { nome: string; tipo: TipoDeRede }): Promise<string> {
  return executarNoContexto({ requisicaoId: randomUUID() }, () =>
    banco.transaction(async (tx) => {
      const redeId = await new RedeEEscolaRepository(tx).criarRede(pedido)
      await registro.gravar(tx, 'rede.criada', { entidadeId: redeId, depois: { tipo: pedido.tipo }, autorOperador: operador })
      return redeId
    }),
  )
}

/**
 * Cria a escola e grava `escola.criada` no contexto dela, na mesma transação. Slug repetido sai como
 * `CONFLITO` e rede inexistente como `NAO_ENCONTRADO`, sem o valor recebido.
 */
export async function criarEscola(banco: Banco, operador: string, pedido: { redeId: string; nome: string; slug: string }): Promise<string> {
  const requisicaoId = randomUUID()
  try {
    return await executarNoContexto({ requisicaoId }, () =>
      banco.transaction(async (tx) => {
        const escolaId = await new RedeEEscolaRepository(tx).criarEscola(pedido)
        await executarNoContexto({ requisicaoId, escolaId }, () =>
          registro.gravar(tx, 'escola.criada', { entidadeId: escolaId, depois: { redeId: pedido.redeId }, autorOperador: operador }),
        )
        return escolaId
      }),
    )
  } catch (erro) {
    // foreign_key_violation: a rede informada não existe.
    if (erroDoPostgresEm(erro)?.code === '23503') throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    throw mapearErroPostgres(erro) ?? erro
  }
}

/** Texto fixo por código, sem nada do pedido: o slug e o nome nunca voltam na mensagem. */
const MENSAGEM_DO_OPERADOR: Partial<Record<CodigoDeErro, string>> = {
  CONFLITO: 'já existe escola com este endereço',
  NAO_ENCONTRADO: 'rede não encontrada',
}

export interface SaidaDoComando {
  saida: (texto: string) => void
  erro: (texto: string) => void
}

export interface BancoDoComando {
  banco: Banco
  fechar: () => Promise<void>
}

export function abrirBancoDeOperacao(ambiente: Record<string, string | undefined>): BancoDoComando {
  const pool = criarPool({ ...urlDoBancoDeOperacao(ambiente), maximoConexoes: 1 }, () => undefined)
  return { banco: criarBanco(pool), fechar: () => pool.end() }
}

/**
 * Executa o comando e devolve o código de saída: 0 criado, 1 erro (`CONFLITO`, `NAO_ENCONTRADO` ou
 * `ERRO_INTERNO` resumido), 2 argumento ou ambiente inválido. Argumento e `OPERADOR` são conferidos antes de
 * abrir o banco.
 */
export async function executarOpsEscola(
  argumentos: string[],
  ambiente: Record<string, string | undefined>,
  terminal: SaidaDoComando,
  abrirBanco: (ambiente: Record<string, string | undefined>) => BancoDoComando = abrirBancoDeOperacao,
): Promise<number> {
  try {
    const pedido = lerPedidoDoOperador(argumentos)
    const operador = lerOperador(ambiente)
    const { banco, fechar } = abrirBanco(ambiente)
    try {
      const resposta =
        pedido.entidade === 'rede'
          ? { redeId: await criarRede(banco, operador, pedido) }
          : { escolaId: await criarEscola(banco, operador, pedido) }
      terminal.saida(`${JSON.stringify(resposta)}\n`)
      return 0
    } finally {
      await fechar()
    }
  } catch (erro) {
    if (erro instanceof ArgumentoInvalido || erro instanceof ConfiguracaoInvalida) {
      // Só o nome da opção ou da variável: nunca o valor.
      terminal.erro(`${erro.message}\n`)
      return 2
    }
    if (erro instanceof ErroDeDominio && MENSAGEM_DO_OPERADOR[erro.codigo] !== undefined) {
      terminal.erro(`${erro.codigo}: ${MENSAGEM_DO_OPERADOR[erro.codigo]}\n`)
      return 1
    }
    // O erro cru do Postgres traz o valor da linha na mensagem e no `detail`: sai só o resumo seguro.
    terminal.erro(`${CodigoDeErro.ERRO_INTERNO}: ${JSON.stringify(resumirErro(erro))}\n`)
    return 1
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await executarOpsEscola(process.argv.slice(2), process.env, {
    saida: (texto) => process.stdout.write(texto),
    erro: (texto) => process.stderr.write(texto),
  })
}
