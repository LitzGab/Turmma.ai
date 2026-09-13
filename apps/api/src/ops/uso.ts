import {
  ConfiguracaoInvalida,
  criarBanco,
  criarPool,
  diaAnterior,
  diaDeUso,
  diaValido,
  executarNoContexto,
  FORMATO_MES,
  relogioDoSistema,
  UsoRepository,
  validarAmbiente,
  type Banco,
  type Relogio,
  type UsoDoPeriodo,
} from '@educa/nucleo'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'

/**
 * Consulta de operação do uso de infra de uma escola (D30, RF17), lida de `uso_infra_diario`:
 *
 *   npm run -s ops:uso -- --escola <uuid> [--dia AAAA-MM-DD] [--mes AAAA-MM]
 *
 * Sem `--dia`, vale o último dia fechado (ontem, em São Paulo); sem `--mes`, o mês desse dia. Imprime
 * JSON com contagens e bytes, e nada de pessoa. O dia de hoje só aparece depois da consolidação das 2h.
 *
 * É ferramenta nossa, rodada por quem opera, e não rota: a escola vem da opção, e a consulta roda no
 * contexto dela, pelo mesmo repository com escopo que qualquer outro código usaria.
 */

export class ArgumentoInvalido extends Error {
  constructor(readonly opcao: string) {
    super(`Opção inválida ou ausente: --${opcao}`)
    this.name = 'ArgumentoInvalido'
  }
}

export interface PedidoDeUso {
  escolaId: string
  dia: string
  mes: string
}

export interface RespostaDeUso {
  escolaId: string
  dia: UsoDoPeriodo & { data: string }
  mes: UsoDoPeriodo & { referencia: string }
}

function lerOpcoes(argumentos: string[]) {
  try {
    return parseArgs({
      args: argumentos,
      options: { escola: { type: 'string' }, dia: { type: 'string' }, mes: { type: 'string' } },
      strict: true,
      allowPositionals: false,
    }).values
  } catch {
    // O erro do parseArgs repete o argumento recebido; a mensagem fica só com as opções aceitas.
    throw new ArgumentoInvalido('escola, --dia ou --mes')
  }
}

export function lerPedidoDeUso(argumentos: string[], relogio: Relogio = relogioDoSistema): PedidoDeUso {
  const valores = lerOpcoes(argumentos)
  if (valores.escola === undefined || !z.uuid().safeParse(valores.escola).success) throw new ArgumentoInvalido('escola')
  const dia = valores.dia ?? diaAnterior(diaDeUso(relogio.agora()))
  if (!diaValido(dia)) throw new ArgumentoInvalido('dia')
  const mes = valores.mes ?? dia.slice(0, 7)
  if (!FORMATO_MES.test(mes)) throw new ArgumentoInvalido('mes')
  return { escolaId: valores.escola.toLowerCase(), dia, mes }
}

/** O uso da escola do pedido no dia e no mês, lido no contexto dela. */
export function consultarUso(banco: Banco, pedido: PedidoDeUso): Promise<RespostaDeUso> {
  const repositorio = new UsoRepository(banco)
  return executarNoContexto({ requisicaoId: randomUUID(), escolaId: pedido.escolaId }, async () => ({
    escolaId: pedido.escolaId,
    dia: { data: pedido.dia, ...(await repositorio.doDia(pedido.dia)) },
    mes: { referencia: pedido.mes, ...(await repositorio.doMes(pedido.mes)) },
  }))
}

const inteiroPositivo = z.coerce.number().int().positive()

const esquemaAmbiente = z.object({
  BANCO_TIMEOUT_CONEXAO_MS: inteiroPositivo,
  BANCO_TIMEOUT_CONSULTA_MS: inteiroPositivo,
  // No container, o BANCO_URL do serviço; na máquina, com `.env.example`, o Postgres do compose local.
  BANCO_URL: z.string().regex(/^postgres(ql)?:\/\/[^/]+\/[^/]+$/).optional(),
  POSTGRES_USUARIO: z.string().optional(),
  POSTGRES_SENHA: z.string().optional(),
  POSTGRES_BANCO: z.string().optional(),
  POSTGRES_PORTA_HOST: inteiroPositivo.optional(),
})

export function urlDoBancoDeOperacao(ambiente: Record<string, string | undefined>): { url: string; timeoutConexaoMs: number; timeoutConsultaMs: number } {
  const valores = validarAmbiente(esquemaAmbiente, ambiente)
  const { POSTGRES_USUARIO: usuario, POSTGRES_SENHA: senha, POSTGRES_BANCO: nome, POSTGRES_PORTA_HOST: porta } = valores
  const url =
    valores.BANCO_URL ??
    (usuario === undefined || senha === undefined || nome === undefined || porta === undefined
      ? undefined
      : `postgres://${encodeURIComponent(usuario)}:${encodeURIComponent(senha)}@127.0.0.1:${porta}/${nome}`)
  if (url === undefined) throw new ConfiguracaoInvalida(['BANCO_URL'])
  return { url, timeoutConexaoMs: valores.BANCO_TIMEOUT_CONEXAO_MS, timeoutConsultaMs: valores.BANCO_TIMEOUT_CONSULTA_MS }
}

async function executar(): Promise<void> {
  try {
    const pedido = lerPedidoDeUso(process.argv.slice(2))
    const pool = criarPool({ ...urlDoBancoDeOperacao(process.env), maximoConexoes: 1 }, () => undefined)
    try {
      process.stdout.write(`${JSON.stringify(await consultarUso(criarBanco(pool), pedido), null, 2)}\n`)
    } finally {
      await pool.end()
    }
  } catch (erro) {
    if (!(erro instanceof ArgumentoInvalido || erro instanceof ConfiguracaoInvalida)) throw erro
    // Só o nome da opção ou da variável: nunca o valor, que pode ser a senha do banco.
    process.stderr.write(`${erro.message}\n`)
    process.exitCode = 2
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await executar()
}
