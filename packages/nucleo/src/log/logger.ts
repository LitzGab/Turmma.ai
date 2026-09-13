import type { LoggerService } from '@nestjs/common'
import { pino, stdTimeFunctions, type DestinationStream, type Logger, type LevelWithSilent } from 'pino'
import { contextoAtual } from '../contexto/contexto.js'
import { resumirErro } from '../erro/resumir-erro.js'

export type LoggerBase = Logger

/**
 * Chaves que nunca saem no log, até dois níveis abaixo do primeiro (`nome`, `aluno.nome`,
 * `dados.aluno.nome`, `req.headers.authorization`). É a rede de segurança: a regra continua
 * sendo logar só id (regra 20, item 9), e a guarda de lint da tarefa 3.0 pega o que o redact
 * não alcança, como chave em profundidade maior.
 */
const CHAVES_PESSOAIS = ['nome', 'matricula', 'email', 'senha', 'resposta', 'nota', 'conversa', 'prompt'] as const
const CHAVES_DE_CREDENCIAL = ['authorization', 'cookie'] as const

export const CAMINHOS_REDACT: readonly string[] = [...CHAVES_PESSOAIS, ...CHAVES_DE_CREDENCIAL].flatMap((chave) => [
  chave,
  `*.${chave}`,
  `*.*.${chave}`,
])

export const TEXTO_REMOVIDO = '[removido]'

type MetodoDeLog = (...argumentos: unknown[]) => void

export const TEXTO_OMITIDO_POR_PROFUNDIDADE = '[omitido: profundo demais]'
const PROFUNDIDADE_MAXIMA = 6

/**
 * Copia o valor trocando todo `Error`, em qualquer nível de objeto ou lista, pelo resumo. Ciclo
 * e nível além do limite viram texto fixo: log leva id, e objeto fundo assim não é id.
 */
function resumirErrosEmProfundidade(valor: unknown, profundidade: number, vistos: WeakSet<object>): unknown {
  if (valor instanceof Error) return resumirErro(valor)
  if (typeof valor !== 'object' || valor === null || valor instanceof Date || ArrayBuffer.isView(valor)) return valor
  if (vistos.has(valor)) return '[ciclo]'
  if (profundidade >= PROFUNDIDADE_MAXIMA) return TEXTO_OMITIDO_POR_PROFUNDIDADE
  vistos.add(valor)
  const copia = Array.isArray(valor)
    ? valor.map((item) => resumirErrosEmProfundidade(item, profundidade + 1, vistos))
    : Object.fromEntries(
        Object.entries(valor).map(([chave, item]) => [chave, resumirErrosEmProfundidade(item, profundidade + 1, vistos)]),
      )
  vistos.delete(valor)
  return copia
}

/**
 * Todo erro passado ao logger, direto (`logger.error(erro)`) ou dentro do objeto em qualquer
 * nível (`{ erro }`, `{ contexto: { erro } }`, `{ lista: [erro] }`), vira o resumo antes de o
 * pino vê-lo. Sem isso o pino usa `erro.message` como `msg` da linha e serializa as
 * propriedades do erro, e as do Postgres trazem `detail` com o valor da linha
 * ("Key (nome)=(Enzo Martins) already exists").
 */
function resumirErrosAntesDeLogar(this: unknown, argumentos: unknown[], metodo: MetodoDeLog): void {
  const [primeiro, ...resto] = argumentos
  if (primeiro instanceof Error) {
    metodo.apply(this, [{ erro: resumirErro(primeiro) }, ...resto])
    return
  }
  if (typeof primeiro === 'object' && primeiro !== null) {
    metodo.apply(this, [resumirErrosEmProfundidade(primeiro, 0, new WeakSet()), ...resto])
    return
  }
  metodo.apply(this, argumentos)
}

/**
 * Último registro de um processo que vai cair: promessa rejeitada sem tratamento ou exceção
 * fora de requisição. Sem isso o Node imprime o erro no stderr com as propriedades próprias,
 * `detail` do Postgres junto, e em texto em vez de JSON.
 */
export function registrarErrosDoProcesso(logger: LoggerBase): void {
  const encerrar = (codigo: number): void => process.exit(codigo)
  process.on('uncaughtException', tratadorDeErroDoProcesso(logger, 'processo.excecao_nao_tratada', encerrar))
  process.on('unhandledRejection', tratadorDeErroDoProcesso(logger, 'processo.rejeicao_nao_tratada', encerrar))
}

export function tratadorDeErroDoProcesso(logger: LoggerBase, evento: string, encerrar: (codigo: number) => void) {
  return (erro: unknown): void => {
    logger.fatal({ evento, erro: resumirErro(erro) })
    encerrar(1)
  }
}

export interface OpcoesDoLogger {
  servico: string
  nivel?: LevelWithSilent
  /** Para teste. Sem destino, o log sai no stdout, em JSON, uma linha por evento. */
  destino?: DestinationStream
}

/**
 * Logger JSON de todo processo. Toda linha leva `requisicaoId`, e `escolaId` e `usuarioId`
 * quando existirem, lidos do contexto da requisição em andamento.
 */
export function criarLogger(opcoes: OpcoesDoLogger): LoggerBase {
  const configuracao = {
    level: opcoes.nivel ?? 'info',
    base: { servico: opcoes.servico },
    timestamp: stdTimeFunctions.isoTime,
    formatters: { level: (rotulo: string) => ({ level: rotulo }) },
    redact: { paths: [...CAMINHOS_REDACT], censor: TEXTO_REMOVIDO },
    hooks: { logMethod: resumirErrosAntesDeLogar },
    mixin: () => {
      const contexto = contextoAtual()
      if (contexto === undefined) return {}
      return {
        requisicaoId: contexto.requisicaoId,
        ...(contexto.escolaId === undefined ? {} : { escolaId: contexto.escolaId }),
        ...(contexto.usuarioId === undefined ? {} : { usuarioId: contexto.usuarioId }),
      }
    },
  }
  return opcoes.destino === undefined ? pino(configuracao) : pino(configuracao, opcoes.destino)
}

/**
 * Faz o log interno do Nest (boot, rotas, `new Logger('banco')`) sair pelo mesmo logger JSON,
 * em vez do texto colorido do console.
 */
export class LoggerDoNest implements LoggerService {
  constructor(private readonly logger: LoggerBase) {}

  log(mensagem: unknown, ...parametros: unknown[]): void {
    this.escrever('info', mensagem, parametros)
  }

  error(mensagem: unknown, ...parametros: unknown[]): void {
    this.escrever('error', mensagem, parametros)
  }

  warn(mensagem: unknown, ...parametros: unknown[]): void {
    this.escrever('warn', mensagem, parametros)
  }

  debug(mensagem: unknown, ...parametros: unknown[]): void {
    this.escrever('debug', mensagem, parametros)
  }

  verbose(mensagem: unknown, ...parametros: unknown[]): void {
    this.escrever('trace', mensagem, parametros)
  }

  fatal(mensagem: unknown, ...parametros: unknown[]): void {
    this.escrever('fatal', mensagem, parametros)
  }

  private escrever(nivel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal', mensagem: unknown, parametros: unknown[]): void {
    // O Nest passa o nome do contexto ("RoutesResolver", "banco") como último parâmetro. Os
    // demais, quando existem, são a pilha de um erro: ela não entra, porque repete a mensagem.
    // Sem contexto, o último é a própria pilha, que tem quebra de linha e fica de fora também.
    const ultimo = parametros.at(-1)
    const origem = typeof ultimo === 'string' && !ultimo.includes('\n') ? { origem: ultimo } : {}
    if (mensagem instanceof Error) {
      this.logger[nivel]({ ...origem, erro: mensagem })
    } else if (typeof mensagem === 'string') {
      this.logger[nivel](origem, mensagem)
    } else {
      this.logger[nivel]({ ...origem, dados: mensagem })
    }
  }
}
