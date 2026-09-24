import {
  ConfiguracaoInvalida,
  contextoAtual,
  ErroDeDominio,
  erroDoPostgresEm,
  executarNoContexto,
  FORMATO_SLUG,
  mapearErroPostgres,
  RegistroDeAuditoria,
  resumirErro,
  TAMANHO_MAXIMO_SLUG,
  TIPOS_DE_REDE,
  type Banco,
  type TipoDeRede,
} from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import type { ConferenciaDoAutor } from '../operacao/operador.repository.js'
import { abrirBancoDeOperacao, ArgumentoInvalido, autorDoComando, esquemaNome, lerOperador, OperadorRecusado, type BancoDoComando, type SaidaDoComando } from './comando.js'
import { RedeEEscolaRepository, type Criada } from './escola.repository.js'

// O que é comum aos comandos do operador mora em `comando.ts`; reexportado aqui para quem já o importava daqui.
export { abrirBancoDeOperacao, ArgumentoInvalido, lerOperador, type BancoDoComando, type SaidaDoComando }

/**
 * Criação de rede e de escola pelo operador Turmma (RF1, D2): por este comando, ou pelo painel da operação
 * (`POST /v1/operacao/redes` e `/escolas`, A0b), que chama os mesmos `criarRede` e `criarEscola`. Não há rota de escola
 * nem cadastro público: a escola nasce só por aqui.
 *
 *   OPERADOR=<pessoa da equipe> npm run -s ops:escola -- rede criar --nome <nome> --tipo prefeitura|grupo|independente
 *   OPERADOR=<pessoa da equipe> npm run -s ops:escola -- escola criar --rede <uuid> --nome <nome> --slug <endereco>
 *
 * - `OPERADOR` é obrigatório em qualquer ambiente e vai para `autor_operador` da auditoria. Sem ele, o
 *   comando recusa antes de abrir conexão com o banco. Com operador ativo (A0), só o apelido de um deles passa,
 *   conferido dentro da transação da criação (`autorDoComando`).
 * - O comando sorteia o id da rede e da escola; o painel manda o que a web sorteou.
 * - A criação e a auditoria dela são uma transação só. A da escola é gravada no contexto da escola
 *   criada; a da rede, com escola nula. O pedido repetido (mesmo id, mesmos dados) devolve o id sem auditoria nova.
 * - Imprime só o id criado, em JSON. Nenhum comando do operador lista ou lê pessoa.
 */

export type PedidoDoOperador = { entidade: 'rede'; nome: string; tipo: TipoDeRede } | { entidade: 'escola'; redeId: string; nome: string; slug: string }

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

/**
 * Cria a rede e grava `rede.criada`, com escola nula e o autor conferido, na mesma transação. O autor é a primeira
 * instrução dela (`ConferenciaDoAutor`): quem não passa não grava nada. O pedido repetido (mesmo id, mesmos dados)
 * devolve o mesmo id sem auditoria nova; o mesmo id com outros dados, `CONFLITO`.
 */
export function criarRede(banco: Banco, autor: ConferenciaDoAutor, pedido: { id: string; nome: string; tipo: TipoDeRede }): Promise<Criada> {
  return executarNoContexto({ requisicaoId: contextoAtual()?.requisicaoId ?? randomUUID() }, () =>
    banco.transaction(async (tx) => {
      const autorOperador = await autor(tx)
      const criada = await new RedeEEscolaRepository(tx).criarRede(pedido)
      if (criada.nova) await registro.gravar(tx, 'rede.criada', { entidadeId: criada.id, depois: { tipo: pedido.tipo }, autorOperador })
      return criada
    }),
  )
}

/**
 * Cria a escola e grava `escola.criada` no contexto dela, na mesma transação, com o autor conferido como primeira
 * instrução. Slug de outra escola e o mesmo id com outros dados saem como `CONFLITO`, e rede inexistente como
 * `NAO_ENCONTRADO`, sem o valor recebido. O pedido repetido devolve o mesmo id sem auditoria nova.
 */
export async function criarEscola(banco: Banco, autor: ConferenciaDoAutor, pedido: { id: string; redeId: string; nome: string; slug: string }): Promise<Criada> {
  const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
  try {
    return await executarNoContexto({ requisicaoId }, () =>
      banco.transaction(async (tx) => {
        const autorOperador = await autor(tx)
        const criada = await new RedeEEscolaRepository(tx).criarEscola(pedido)
        if (criada.nova) {
          await executarNoContexto({ requisicaoId, escolaId: criada.id }, () =>
            registro.gravar(tx, 'escola.criada', { entidadeId: criada.id, depois: { redeId: pedido.redeId }, autorOperador }),
          )
        }
        return criada
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

/**
 * Executa o comando e devolve o código de saída: 0 criado, 1 erro (`CONFLITO`, `NAO_ENCONTRADO` ou
 * `ERRO_INTERNO` resumido), 2 argumento ou ambiente inválido, ou `OPERADOR` que não é operador ativo. Argumento e
 * formato do `OPERADOR` são conferidos antes de abrir o banco; o `OPERADOR` contra os ativos, dentro da transação.
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
      const autor = autorDoComando(operador)
      const resposta =
        pedido.entidade === 'rede'
          ? { redeId: (await criarRede(banco, autor, { id: randomUUID(), nome: pedido.nome, tipo: pedido.tipo })).id }
          : { escolaId: (await criarEscola(banco, autor, { id: randomUUID(), redeId: pedido.redeId, nome: pedido.nome, slug: pedido.slug })).id }
      terminal.saida(`${JSON.stringify(resposta)}\n`)
      return 0
    } finally {
      await fechar()
    }
  } catch (erro) {
    if (erro instanceof ArgumentoInvalido || erro instanceof ConfiguracaoInvalida || erro instanceof OperadorRecusado) {
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
