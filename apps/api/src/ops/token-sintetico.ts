import {
  ALGORITMO_TOKEN,
  AMBIENTES,
  ConfiguracaoInvalida,
  EMISSOR_TOKEN_SINTETICO,
  TAMANHO_MINIMO_CHAVE_ASSINATURA,
  TIPO_TOKEN,
  VALIDADE_MAXIMA_TOKEN_SEGUNDOS,
  validarAmbiente,
} from '@educa/nucleo'
import { SignJWT } from 'jose'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'

/**
 * Emissor do token do F0, para teste local, esteira e cenário de carga:
 *
 *   npm run -s ops:token-sintetico -- --escola <uuid> [--usuario <uuid>] [--validade 1h]
 *
 * Imprime só o token. Assina com `IDENTIDADE_CHAVE_ASSINATURA` e se recusa a emitir com
 * `AMBIENTE=producao`. O token leva `sub`, `esc`, `iss`, `iat` e `exp`, e nada da pessoa.
 */

export const VALIDADE_PADRAO = '1h'

const SEGUNDOS_POR_UNIDADE = { s: 1, m: 60, h: 3600 } as const

export class ArgumentoInvalido extends Error {
  constructor(readonly opcao: string) {
    super(`Opção inválida ou ausente: --${opcao}`)
    this.name = 'ArgumentoInvalido'
  }
}

export interface PedidoDeToken {
  escolaId: string
  usuarioId: string
  validadeSegundos: number
}

function validadeEmSegundos(texto: string): number {
  const partes = /^([1-9][0-9]{0,5})([smh])$/.exec(texto)
  if (partes === null) throw new ArgumentoInvalido('validade')
  const segundos = Number(partes[1]) * SEGUNDOS_POR_UNIDADE[partes[2] as keyof typeof SEGUNDOS_POR_UNIDADE]
  if (segundos > VALIDADE_MAXIMA_TOKEN_SEGUNDOS) throw new ArgumentoInvalido('validade')
  return segundos
}

function uuid(valor: string | undefined, opcao: string): string {
  if (valor === undefined || !z.uuid().safeParse(valor).success) throw new ArgumentoInvalido(opcao)
  return valor.toLowerCase()
}

function lerOpcoes(argumentos: string[]) {
  try {
    return parseArgs({
      args: argumentos,
      options: { escola: { type: 'string' }, usuario: { type: 'string' }, validade: { type: 'string' } },
      strict: true,
      allowPositionals: false,
    }).values
  } catch {
    // O erro do parseArgs repete o argumento recebido; a mensagem fica só com as opções aceitas.
    throw new ArgumentoInvalido('escola, --usuario ou --validade')
  }
}

export function lerPedido(argumentos: string[]): PedidoDeToken {
  const valores = lerOpcoes(argumentos)
  return {
    escolaId: uuid(valores.escola, 'escola'),
    usuarioId: valores.usuario === undefined ? randomUUID() : uuid(valores.usuario, 'usuario'),
    validadeSegundos: validadeEmSegundos(valores.validade ?? VALIDADE_PADRAO),
  }
}

const esquemaAmbienteEmissor = z
  .object({
    AMBIENTE: z.enum(AMBIENTES),
    IDENTIDADE_CHAVE_ASSINATURA: z.string().min(TAMANHO_MINIMO_CHAVE_ASSINATURA),
  })
  .superRefine((valores, contexto) => {
    if (valores.AMBIENTE === 'producao') {
      contexto.addIssue({ code: 'custom', path: ['AMBIENTE'], message: 'token sintético não é emitido com AMBIENTE=producao' })
    }
  })

export async function emitirTokenSintetico(
  pedido: PedidoDeToken,
  ambiente: Record<string, string | undefined>,
  agora: Date = new Date(),
): Promise<string> {
  const { IDENTIDADE_CHAVE_ASSINATURA: chave } = validarAmbiente(esquemaAmbienteEmissor, ambiente)
  const emitidoEm = Math.floor(agora.getTime() / 1000)
  return new SignJWT({ esc: pedido.escolaId })
    .setProtectedHeader({ alg: ALGORITMO_TOKEN, typ: TIPO_TOKEN })
    .setIssuer(EMISSOR_TOKEN_SINTETICO)
    .setSubject(pedido.usuarioId)
    .setIssuedAt(emitidoEm)
    .setExpirationTime(emitidoEm + pedido.validadeSegundos)
    .sign(new TextEncoder().encode(chave))
}

async function executar(): Promise<void> {
  try {
    const token = await emitirTokenSintetico(lerPedido(process.argv.slice(2)), process.env)
    process.stdout.write(`${token}\n`)
  } catch (erro) {
    if (!(erro instanceof ArgumentoInvalido || erro instanceof ConfiguracaoInvalida)) throw erro
    // Mensagem só com o nome da opção ou da variável: nunca o valor, que pode ser a chave.
    process.stderr.write(`${erro.message}\n`)
    process.exitCode = 2
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await executar()
}
