import { ConfiguracaoInvalida, criarBanco, criarPool, FORMATO_OPERADOR, validarAmbiente, type Banco } from '@educa/nucleo'
import { open, type FileHandle } from 'node:fs/promises'
import { z } from 'zod'
import { OperadorRepository } from '../operacao/operador.repository.js'

/**
 * O que os comandos do operador (`ops:escola`, `ops:redefinir-mfa`, `ops:convite-coordenador`, `ops:revogar-convite`,
 * `ops:uso` e `ops:operador`) têm em comum: o erro de argumento, que cita só a opção e nunca o valor; o nome aceito; o
 * `OPERADOR` que vai para a auditoria e a conferência dele contra os operadores ativos; a saída do terminal; o arquivo
 * 0600 do token; e o banco de operação, com uma conexão só.
 */

export class ArgumentoInvalido extends Error {
  constructor(readonly opcao: string) {
    super(`Opção inválida ou ausente: ${opcao}`)
    this.name = 'ArgumentoInvalido'
  }
}

const TAMANHO_MAXIMO_NOME = 200

/**
 * Nome de rede, de escola ou da pessoa convidada (`ops:convite-coordenador`): texto de uma linha, sem caractere de
 * controle, com o mesmo teto do check de `usuario.nome`.
 */
export const esquemaNome = z
  .string()
  .trim()
  .min(1)
  .max(TAMANHO_MAXIMO_NOME)
  .regex(/^[^\p{Cc}]+$/u)

const esquemaAmbienteOperador = z.object({ OPERADOR: z.string().regex(FORMATO_OPERADOR) })

/** Quem da equipe roda o comando. Ausente ou fora do formato, recusa pelo nome da variável, sem o valor. */
export function lerOperador(ambiente: Record<string, string | undefined>): string {
  return validarAmbiente(esquemaAmbienteOperador, ambiente).OPERADOR
}

/** O `OPERADOR` não é um operador ativo, e há operador ativo. A mensagem é fixa: nunca repete o valor da variável. */
export class OperadorRecusado extends Error {
  constructor() {
    super('OPERADOR não é um operador ativo da equipe')
    this.name = 'OperadorRecusado'
  }
}

/**
 * A conferência do `OPERADOR` depois de abrir o banco e antes de qualquer escrita (Tech Spec da A0, seção 5,
 * "Nascimento"): sem operador ativo, qualquer `OPERADOR` no formato passa (o nascimento, `bootstrap`); com um, só o
 * apelido de um operador ativo. O `ops:operador` faz a mesma conferência dentro da transação, sob a trava.
 */
export async function conferirOperador(banco: Banco, apelido: string): Promise<void> {
  if ((await new OperadorRepository(banco).situacaoDoAutor(apelido)) === 'recusado') throw new OperadorRecusado()
}

/** Cria o arquivo do token só se ele não existe, com modo 0600: só o dono lê. */
export async function criarArquivoDoToken(caminho: string, invalido: () => Error): Promise<FileHandle> {
  try {
    return await open(caminho, 'wx', 0o600)
  } catch {
    throw invalido()
  }
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

const inteiroPositivo = z.coerce.number().int().positive()

const esquemaAmbienteDoBanco = z.object({
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
  const valores = validarAmbiente(esquemaAmbienteDoBanco, ambiente)
  const { POSTGRES_USUARIO: usuario, POSTGRES_SENHA: senha, POSTGRES_BANCO: nome, POSTGRES_PORTA_HOST: porta } = valores
  const url =
    valores.BANCO_URL ??
    (usuario === undefined || senha === undefined || nome === undefined || porta === undefined
      ? undefined
      : `postgres://${encodeURIComponent(usuario)}:${encodeURIComponent(senha)}@127.0.0.1:${porta}/${nome}`)
  if (url === undefined) throw new ConfiguracaoInvalida(['BANCO_URL'])
  return { url, timeoutConexaoMs: valores.BANCO_TIMEOUT_CONEXAO_MS, timeoutConsultaMs: valores.BANCO_TIMEOUT_CONSULTA_MS }
}
