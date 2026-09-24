import 'reflect-metadata'
import * as nucleo from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { Controller, Get, SetMetadata, type ExecutionContext, type Type } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { getTableName, is } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { EntradaDeOperacao, RotaDeOperacao } from '../src/operacao/marcadores.js'
import { OperacaoModule } from '../src/operacao/operacao.module.js'
import { configuracaoDeTeste } from './configuracao-de-teste.js'
import { controladoresDoModulo, rotasDe, rotasDeOperacaoSemGuarda, rotasForaDaCerca, type RotaRegistrada } from './rotas-registradas.js'

const RAIZ = fileURLToPath(new URL('../../../', import.meta.url))
const MODULO_SESSAO = 'apps/api/src/sessao/'
const ESTE_ARQUIVO = 'apps/api/test/arquitetura.test.ts'

interface Arquivo {
  caminho: string
  texto: string
}

/** Todo `.ts`, `.tsx`, `.mts`, `.js` e `.mjs` de código e de teste, sem `dist` e sem `node_modules`. */
function arquivosDoRepositorio(): Arquivo[] {
  return ['apps', 'packages', 'infra', 'tools', 'e2e'].flatMap((pasta) =>
    readdirSync(join(RAIZ, pasta), { recursive: true, encoding: 'utf8' })
      .filter((arquivo) => /\.(ts|tsx|mts|js|mjs)$/.test(arquivo))
      .filter((arquivo) => !arquivo.split(sep).some((parte) => parte === 'node_modules' || parte === 'dist'))
      .map((arquivo) => {
        const caminho = relative(RAIZ, join(RAIZ, pasta, arquivo)).split(sep).join('/')
        return { caminho, texto: readFileSync(join(RAIZ, caminho), 'utf8') }
      }),
  )
}

/** Cita a classe ou o arquivo dela: importação, reexportação ou `import()` dinâmico. */
const USO_DA_RESOLUCAO = /\bResolucaoDeTenantRepository\b|resolucao-de-tenant\.repository/

/**
 * Os arquivos fora de `apps/api/src/sessao` que usam a `ResolucaoDeTenantRepository`. A classe concentra os
 * `@SemEscopo` da resolução de tenant (Tech Spec, seção 6), e o desvio da regra 10, item 9 só é aceito porque fica
 * contido no módulo de sessão.
 */
function usosForaDoModuloSessao(arquivos: readonly Arquivo[]): string[] {
  return arquivos
    .filter((arquivo) => !arquivo.caminho.startsWith(MODULO_SESSAO) && arquivo.caminho !== ESTE_ARQUIVO)
    .filter((arquivo) => USO_DA_RESOLUCAO.test(arquivo.texto))
    .map((arquivo) => arquivo.caminho)
}

describe('arquitetura: a resolução de tenant fica dentro do módulo de sessão', () => {
  it('a varredura enxerga o código: acha a própria classe dentro do módulo de sessão', () => {
    const arquivos = arquivosDoRepositorio()
    expect(arquivos.length).toBeGreaterThan(100)
    expect(arquivos.filter((arquivo) => USO_DA_RESOLUCAO.test(arquivo.texto)).map((arquivo) => arquivo.caminho)).toContain('apps/api/src/sessao/resolucao-de-tenant.repository.ts')
  })

  it('nenhum arquivo fora de apps/api/src/sessao importa ou cita a ResolucaoDeTenantRepository', () => {
    expect(usosForaDoModuloSessao(arquivosDoRepositorio())).toEqual([])
  })

  it('reprova o arquivo de fora que a importa, reexporta ou carrega por import dinâmico', () => {
    const fora = [
      { caminho: 'apps/api/src/estrutura/turma.service.ts', texto: "import { ResolucaoDeTenantRepository } from '../sessao/resolucao-de-tenant.repository.js'" },
      { caminho: 'apps/api/src/sistema/atalho.ts', texto: "export * from '../sessao/resolucao-de-tenant.repository.js'" },
      { caminho: 'apps/worker/src/expurgo.ts', texto: "const modulo = await import('../../api/src/sessao/resolucao-de-tenant.repository.js')" },
    ]
    const dentro = { caminho: 'apps/api/src/sessao/login.service.ts', texto: "import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'" }
    expect(usosForaDoModuloSessao([...fora, dentro])).toEqual(fora.map((arquivo) => arquivo.caminho))
  })
})

/**
 * C45 (Tech Spec da A0, seção 6): as seis tabelas da operação não têm `escola_id`, e o que impede que isso vire atalho
 * é que só o `OperadorRepository` as toca, e ele não toca outra tabela. O expurgo (tarefa 9.0) entra nesta lista quando
 * existir. Ficam de fora o schema delas, o barrel do pacote, as migrations (`.sql`, que não são varridas) e os testes.
 */
const REPOSITORY_DA_OPERACAO = 'apps/api/src/operacao/operador.repository.ts'
const QUEM_PODE_TOCAR_A_OPERACAO = [REPOSITORY_DA_OPERACAO]
const FORA_DA_VARREDURA = ['packages/nucleo/src/db/schema/operador.ts', 'packages/nucleo/src/index.ts']
const TABELAS_DA_OPERACAO = [nucleo.operador, nucleo.codigoRecuperacaoOperador, nucleo.conviteOperador, nucleo.sessaoOperador, nucleo.acessoOperacao, nucleo.auditoriaOperacao]

/** Nome exportado pelo `@educa/nucleo` → nome físico, de toda tabela que o pacote exporta. */
const TABELAS_EXPORTADAS = new Map<string, string>(
  Object.entries(nucleo as Record<string, unknown>).flatMap(([nome, valor]): [string, string][] => (is(valor, PgTable) ? [[nome, getTableName(valor)]] : [])),
)
const FISICOS_DA_OPERACAO = new Set<string>(TABELAS_DA_OPERACAO.map((tabela) => getTableName(tabela)))
const EXPORTS_DA_OPERACAO = new Set([...TABELAS_EXPORTADAS].filter(([, fisico]) => FISICOS_DA_OPERACAO.has(fisico)).map(([nome]) => nome))

/** Toda tabela criada nas migrations, inclusive as que o pacote não exporta (`auditoria`). */
const TABELAS_FISICAS: readonly string[] = readdirSync(join(RAIZ, 'packages/nucleo/drizzle'))
  .filter((arquivo) => arquivo.endsWith('.sql'))
  .flatMap((arquivo) => [...readFileSync(join(RAIZ, 'packages/nucleo/drizzle', arquivo), 'utf8').matchAll(/CREATE TABLE "(\w+)"/g)].map((criacao) => criacao[1] ?? ''))

/** As tabelas que o texto cita em SQL: depois de `from`, `into`, `update`, `join`, `table` ou `truncate`. */
function tabelasEmSql(texto: string): string[] {
  return [...texto.matchAll(/\b(?:from|into|update|join|table|truncate)\s+(?:"?public"?\.)?"?(\w+)"?/gi)].map((uso) => uso[1] ?? '').filter((nome) => TABELAS_FISICAS.includes(nome))
}

/** Os nomes que o texto importa (ou reexporta) do `@educa/nucleo` ou do schema da operação, sem o `as` e o `type`. */
function nomesImportados(texto: string): string[] {
  return [...texto.matchAll(/(?:import|export)\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"](@educa\/nucleo|[^'"]*schema\/operador(?:\.js|\.ts)?)['"]/g)].flatMap((importacao) =>
    (importacao[1] ?? '')
      .split(',')
      .map((nome) => nome.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0] ?? '')
      .filter((nome) => nome !== ''),
  )
}

/** As tabelas da operação que o arquivo alcança: por nome importado, por namespace do pacote, pelo arquivo do schema ou em SQL. */
function usosDaOperacao(texto: string): string[] {
  const porImport = nomesImportados(texto).filter((nome) => EXPORTS_DA_OPERACAO.has(nome))
  const namespaces = [...texto.matchAll(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]@educa\/nucleo['"]/g)].map((uso) => uso[1] ?? '')
  const porNamespace = namespaces.flatMap((ns) => [...texto.matchAll(new RegExp(`\\b${ns}\\.(\\w+)`, 'g'))].map((uso) => uso[1] ?? '').filter((nome) => EXPORTS_DA_OPERACAO.has(nome)))
  const peloArquivo = /['"][^'"]*db\/schema\/operador(?:\.js|\.ts)?['"]/.test(texto) ? ['schema/operador'] : []
  const porSql = tabelasEmSql(texto).filter((nome) => FISICOS_DA_OPERACAO.has(nome))
  return [...porImport, ...porNamespace, ...peloArquivo, ...porSql]
}

/** Teste e apoio de teste (`*.test.ts`, e o que mora numa pasta `test/`, como a bancada de operadores da tarefa 4.0). */
function deTeste(caminho: string): boolean {
  return /\.test\.ts$/.test(caminho) || /(^|\/)test\//.test(caminho)
}

function quemTocaAOperacao(arquivos: readonly Arquivo[]): string[] {
  return arquivos
    .filter((arquivo) => !deTeste(arquivo.caminho) && !FORA_DA_VARREDURA.includes(arquivo.caminho))
    .filter((arquivo) => usosDaOperacao(arquivo.texto).length > 0)
    .map((arquivo) => arquivo.caminho)
}

/** O que o repository toca fora das seis: tabela importada do pacote que não é da operação, e tabela de fora em SQL. */
function tabelasDeForaNoRepository(texto: string): string[] {
  const importadas = nomesImportados(texto).filter((nome) => TABELAS_EXPORTADAS.has(nome) && !EXPORTS_DA_OPERACAO.has(nome))
  const emSql = tabelasEmSql(texto).filter((nome) => !FISICOS_DA_OPERACAO.has(nome))
  return [...importadas, ...emSql]
}

describe('arquitetura: as seis tabelas da operação só pelo OperadorRepository (C45)', () => {
  it('a lista das seis vem do pacote, e a varredura conhece todas as tabelas das migrations', () => {
    expect([...FISICOS_DA_OPERACAO].sort()).toEqual(['acesso_operacao', 'auditoria_operacao', 'codigo_recuperacao_operador', 'convite_operador', 'operador', 'sessao_operador'])
    expect(EXPORTS_DA_OPERACAO.size).toBe(6)
    for (const tabela of [...FISICOS_DA_OPERACAO, 'auditoria', 'conta', 'escola', 'sessao']) expect(TABELAS_FISICAS).toContain(tabela)
  })

  it('só o OperadorRepository toca as seis tabelas, por import, por namespace, pelo arquivo do schema ou pelo nome em SQL', () => {
    expect(quemTocaAOperacao(arquivosDoRepositorio())).toEqual(QUEM_PODE_TOCAR_A_OPERACAO)
  })

  it('o OperadorRepository não toca nenhuma outra tabela', () => {
    const repository = arquivosDoRepositorio().find((arquivo) => arquivo.caminho === REPOSITORY_DA_OPERACAO)
    expect(repository && usosDaOperacao(repository.texto).length).toBeGreaterThan(0)
    expect(repository && tabelasDeForaNoRepository(repository.texto)).toEqual([])
  })

  it('a varredura pega o uso em qualquer forma, e não confunde variável ou comentário com tabela', () => {
    const fora = [
      { caminho: 'apps/api/src/painel/painel.repository.ts', texto: "import { and, operador, sql } from '@educa/nucleo'" },
      { caminho: 'apps/api/src/painel/alias.ts', texto: "import { type Banco, sessaoOperador as sessoes } from '@educa/nucleo'" },
      { caminho: 'apps/api/src/painel/ns.ts', texto: "import * as n from '@educa/nucleo'\nn.conviteOperador" },
      { caminho: 'apps/api/src/painel/reexporta.ts', texto: "export { auditoriaOperacao } from '@educa/nucleo'" },
      { caminho: 'apps/api/src/painel/schema.ts', texto: "import { operador as o } from '../../../../packages/nucleo/src/db/schema/operador.js'" },
      { caminho: 'apps/worker/src/sql.ts', texto: "pool.query('delete from acesso_operacao where em < now()')" },
      { caminho: 'apps/worker/src/sql-aspas.ts', texto: 'sql`update "public"."codigo_recuperacao_operador" set x = 1`' },
      { caminho: 'apps/worker/src/sql-maiuscula.ts', texto: "pool.query('SELECT 1 FROM operador')" },
    ]
    const inocentes = [
      { caminho: 'apps/api/src/ops/escola.ts', texto: "const operador = lerOperador(ambiente)\nimport { FORMATO_OPERADOR } from '@educa/nucleo'\n// o operador da equipe" },
      { caminho: 'apps/api/src/sessao/x.repository.ts', texto: "pool.query('select 1 from sessao where escola_id = $1')" },
      { caminho: 'apps/api/src/ops/operador.test.ts', texto: "pool.query('delete from operador')" },
      { caminho: 'apps/api/test/sessao-de-operador.ts', texto: "pool.query('insert into sessao_operador (operador_id) values ($1)')" },
      { caminho: 'packages/nucleo/src/index.ts', texto: "export { operador } from './db/schema/operador.js'" },
    ]
    expect(quemTocaAOperacao([...fora, ...inocentes])).toEqual(fora.map((arquivo) => arquivo.caminho))
  })

  it('reprova o repository que importa outra tabela do pacote ou cita outra tabela em SQL', () => {
    expect(tabelasDeForaNoRepository("import { conta, operador } from '@educa/nucleo'")).toEqual(['conta'])
    expect(tabelasDeForaNoRepository("sql`select 1 from escola`; sql`insert into auditoria (x)`; sql`update operador set x = 1`")).toEqual(['escola', 'auditoria'])
  })
})

/**
 * C40 a C42 e C36 (parte) (Tech Spec da A0, seção 6): as rotas `/v1/operacao/*` escapam das guardas de escola pelo
 * `rotaSemSessao`, e o que impede que isso vire atalho é que os marcadores só existem na pasta da operação, que a rota
 * `@RotaDeOperacao` sempre leva a `GuardaDeOperador`, que marcador e caminho andam juntos, e que o limite conta o
 * operador. A lista de rotas é a que o `AppModule` registra, lida dos metadados, sem subir a aplicação.
 */
const PASTA_DA_OPERACAO = 'apps/api/src/operacao/'
const NOMES_DOS_MARCADORES = /\b(?:RotaDeOperacao|EntradaDeOperacao)\b/
const CHAVES_DOS_MARCADORES = /\bMETADADO_(?:ROTA|ENTRADA)_DE_OPERACAO\b/
/** Quem pode citar as chaves: onde nascem, o barrel, a conferência do boot, e os decoradores. */
const QUEM_PODE_CITAR_AS_CHAVES = [
  'packages/nucleo/src/identidade/marcadores-de-operacao.ts',
  'packages/nucleo/src/index.ts',
  'packages/nucleo/src/permissao/conferencia-das-permissoes.ts',
  'apps/api/src/operacao/marcadores.ts',
]

/** O texto sem comentário de bloco nem de linha: citar o marcador num comentário não é usá-lo. */
function semComentarios(texto: string): string {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

/** Os arquivos de código de produção que usam um marcador fora da pasta da operação, ou citam as chaves fora da lista. */
function marcadoresForaDaOperacao(arquivos: readonly Arquivo[]): string[] {
  return arquivos
    .filter((arquivo) => /^(apps|packages)\/[^/]+\/src\//.test(arquivo.caminho) && !deTeste(arquivo.caminho))
    .filter((arquivo) => {
      const codigo = semComentarios(arquivo.texto)
      const usaMarcador = NOMES_DOS_MARCADORES.test(codigo) && !arquivo.caminho.startsWith(PASTA_DA_OPERACAO)
      const citaChave = CHAVES_DOS_MARCADORES.test(codigo) && !QUEM_PODE_CITAR_AS_CHAVES.includes(arquivo.caminho)
      return usaMarcador || citaChave
    })
    .map((arquivo) => arquivo.caminho)
}

const rotasDaApi = (): RotaRegistrada[] => rotasDe(controladoresDoModulo(AppModule.com(configuracaoDeTeste())))
const nomeDaRota = (rota: RotaRegistrada) => `${rota.verbo} ${rota.caminho}`

// Controllers de mentira, para provar que as conferências reprovam o que deveriam.
@Controller('v1/operacao/so-metadado')
class SoMetadadoController {
  @Get()
  @SetMetadata(nucleo.METADADO_ROTA_DE_OPERACAO, true)
  obter(): void {}
}

@RotaDeOperacao()
@Controller('v1/operacao/na-classe')
class NaClasseController {
  @Get()
  obter(): void {}
}

@Controller('v1/operacao/no-metodo')
class NoMetodoController {
  @Get()
  @RotaDeOperacao()
  obter(): void {}

  @Get('entrar')
  @EntradaDeOperacao()
  entrar(): void {}
}

@Controller('v1/operacao/esquecida')
class SemMarcadorController {
  @Get()
  obter(): void {}
}

@Controller('v1/escola/marcada')
class EscolaMarcadaController {
  @Get()
  @RotaDeOperacao()
  obter(): void {}
}

@Controller('v1/operacaox')
class PrefixoParecidoController {
  @Get()
  @EntradaDeOperacao()
  obter(): void {}
}

describe('arquitetura: os marcadores da operação só na pasta da operação (C40)', () => {
  it('nenhum código de produção fora de apps/api/src/operacao/ usa os marcadores, e as chaves só onde é preciso', () => {
    const arquivos = arquivosDoRepositorio()
    // A varredura enxerga o código: os decoradores e o controller do /eu usam os marcadores.
    expect(arquivos.filter((arquivo) => NOMES_DOS_MARCADORES.test(semComentarios(arquivo.texto))).map((arquivo) => arquivo.caminho)).toEqual(
      expect.arrayContaining(['apps/api/src/operacao/marcadores.ts', 'apps/api/src/operacao/eu.controller.ts']),
    )
    expect(marcadoresForaDaOperacao(arquivos)).toEqual([])
  })

  it('em método e em classe: todo controller registrado com marcador é um controller do OperacaoModule', () => {
    const daOperacao = new Set(controladoresDoModulo(OperacaoModule.com(configuracaoDeTeste().identidade, { dispositivo: configuracaoDeTeste().login.dispositivo, mfa: configuracaoDeTeste().login.mfa })))
    const marcados = new Set(rotasDaApi().filter((rota) => rota.marcador !== undefined).map((rota) => rota.controlador))
    expect(marcados.size).toBeGreaterThan(0)
    expect([...marcados].filter((controlador) => !daOperacao.has(controlador)).map((controlador) => controlador.name)).toEqual([])
    // E o OperacaoModule só registra controller da própria pasta.
    const modulo = readFileSync(join(RAIZ, PASTA_DA_OPERACAO, 'operacao.module.ts'), 'utf8')
    expect([...modulo.matchAll(/import\s+\{[^}]*Controller[^}]*\}\s+from\s+'([^']+)'/g)].map((importacao) => importacao[1]).every((origem) => origem?.startsWith('./'))).toBe(true)
  })

  it('a varredura reprova o marcador fora da pasta, na classe, no método ou pela chave, e não confunde comentário com uso', () => {
    const fora = [
      { caminho: 'apps/api/src/estrutura/turma.controller.ts', texto: "import { RotaDeOperacao } from '../operacao/marcadores.js'\n@RotaDeOperacao()\n@Controller('v1/turmas')\nexport class TurmaController {}" },
      { caminho: 'apps/api/src/sessao/atalho.controller.ts', texto: 'export class Atalho {\n  @Get()\n  @EntradaDeOperacao()\n  obter() {}\n}' },
      { caminho: 'apps/api/src/sessao/chave.ts', texto: "import { METADADO_ROTA_DE_OPERACAO } from '@educa/nucleo'\nSetMetadata(METADADO_ROTA_DE_OPERACAO, true)" },
      { caminho: 'packages/nucleo/src/limite/outro.ts', texto: 'reflector.get(METADADO_ENTRADA_DE_OPERACAO, alvo)' },
    ]
    const inocentes = [
      { caminho: 'apps/api/src/operacao/painel.controller.ts', texto: '@RotaDeOperacao()\nexport class PainelController {}' },
      { caminho: 'packages/nucleo/src/limite/guarda-limite.ts', texto: '/** A rota `@RotaDeOperacao()` conta no rl:op. */\n// e a @EntradaDeOperacao não\nconst x = 1' },
      { caminho: 'apps/api/test/qualquer.int.test.ts', texto: '@RotaDeOperacao()\nclass X {}' },
      { caminho: 'apps/api/test/rotas-registradas.ts', texto: "import { METADADO_ROTA_DE_OPERACAO } from '@educa/nucleo'" },
    ]
    expect(marcadoresForaDaOperacao([...fora, ...inocentes])).toEqual(fora.map((arquivo) => arquivo.caminho))
  })
})

describe('arquitetura: a rota @RotaDeOperacao tem a GuardaDeOperador no handler resolvido (C41)', () => {
  it('toda rota @RotaDeOperacao registrada tem a guarda', () => {
    const rotas = rotasDaApi().filter((rota) => rota.marcador === 'rota')
    expect(rotas.map(nomeDaRota)).toContain('GET /v1/operacao/eu')
    expect(rotasDeOperacaoSemGuarda(rotas)).toEqual([])
  })

  it('reprova a rota com o marcador e sem a guarda, e aceita o marcador no método e na classe', () => {
    expect(rotasDeOperacaoSemGuarda(rotasDe([SoMetadadoController, NaClasseController, NoMetodoController]))).toEqual(['SoMetadadoController.obter'])
  })
})

describe('arquitetura: marcador e caminho /v1/operacao andam juntos (C42)', () => {
  it('todo caminho /v1/operacao tem marcador, e todo marcador está sob /v1/operacao', () => {
    const rotas = rotasDaApi()
    expect(rotas.length).toBeGreaterThan(30)
    expect(rotasForaDaCerca(rotas)).toEqual([])
  })

  it('reprova o caminho da operação sem marcador, o marcador fora dela, e não se engana com prefixo parecido', () => {
    const rotas = rotasDe([NaClasseController, NoMetodoController, SemMarcadorController, EscolaMarcadaController, PrefixoParecidoController])
    expect(rotasForaDaCerca(rotas)).toEqual(['GET /v1/operacao/esquecida', 'GET /v1/escola/marcada', 'GET /v1/operacaox'])
  })
})

describe('arquitetura: toda rota @RotaDeOperacao conta pelo rl:op:{sub} (C36, parte)', () => {
  const identidade = configuracaoDeTeste().identidade
  const OPERADOR = '0190f5a0-0000-7000-8000-0000000000e1'
  const SESSAO = '0190f5a0-0000-7000-8000-0000000000f1'

  function guardaComLimitador(resultado: nucleo.ResultadoDoLimite = { aceita: true }) {
    const limitador = {
      consumirDeOperador: vi.fn(async (_operadorId: string) => resultado),
      consumirAnonima: vi.fn(async () => ({ aceita: true }) as const),
      consumirDoLogin: vi.fn(async () => ({ aceita: true }) as const),
      consumirAutenticada: vi.fn(async () => ({ aceita: true }) as const),
    }
    const guarda = new nucleo.GuardaDeLimite(new Reflector(), limitador as unknown as nucleo.LimitadorDeRequisicoes, new nucleo.ProxiesConfiaveis(['127.0.0.1']), { daEscola: async () => ({ porUsuarioMin: 1, porEscolaMin: 1 }) }, identidade)
    return { guarda, limitador }
  }

  function execucao(rota: Pick<RotaRegistrada, 'handler' | 'controlador'>, authorization?: string): ExecutionContext {
    const requisicao = { headers: authorization === undefined ? {} : { authorization }, socket: { remoteAddress: '127.0.0.1' } }
    return {
      getHandler: () => rota.handler,
      getClass: () => rota.controlador as Type,
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => requisicao }),
    } as unknown as ExecutionContext
  }

  const tokenDeOperador = async () => `Bearer ${(await new nucleo.EmissorDeTokenDeOperador(identidade.chaveAssinatura).emitir({ operadorId: OPERADOR, sessaoId: SESSAO })).token}`

  it('em cada rota @RotaDeOperacao registrada, o token de operador conta no rl:op do sub, e em nenhum outro limite', async () => {
    const rotas = rotasDaApi().filter((rota) => rota.marcador === 'rota')
    expect(rotas.length).toBeGreaterThan(0)
    for (const rota of rotas) {
      const { guarda, limitador } = guardaComLimitador()
      expect(await guarda.canActivate(execucao(rota, await tokenDeOperador())), nomeDaRota(rota)).toBe(true)
      expect(limitador.consumirDeOperador.mock.calls, nomeDaRota(rota)).toEqual([[OPERADOR]])
      expect([limitador.consumirAnonima, limitador.consumirDoLogin, limitador.consumirAutenticada].map((consumo) => consumo.mock.calls.length), nomeDaRota(rota)).toEqual([0, 0, 0])
    }
  })

  it('acima do limite, 429 LIMITE_EXCEDIDO com a espera; sem token de operador que confira, não conta nada e deixa a GuardaDeOperador responder', async () => {
    const [rota] = rotasDaApi().filter((candidata) => candidata.marcador === 'rota')
    if (rota === undefined) throw new Error('nenhuma rota @RotaDeOperacao')
    const recusada = guardaComLimitador({ aceita: false, msAteLiberar: 1_500 })
    await expect(recusada.guarda.canActivate(execucao(rota, await tokenDeOperador()))).rejects.toMatchObject({ codigo: CodigoDeErro.LIMITE_EXCEDIDO, status: 429, tenteDeNovoEmSegundos: 2 })

    const tokenDeEscola = (await new nucleo.EmissorDeToken(identidade.chaveAssinatura).emitir({ escolaId: SESSAO, usuarioId: OPERADOR, sessaoId: SESSAO })).token
    for (const authorization of [undefined, `Bearer ${tokenDeEscola}`, 'Bearer a.b.c']) {
      const { guarda, limitador } = guardaComLimitador()
      expect(await guarda.canActivate(execucao(rota, authorization))).toBe(true)
      expect(Object.values(limitador).map((consumo) => consumo.mock.calls.length)).toEqual([0, 0, 0, 0])
    }
  })
})

/**
 * C43 (Tech Spec da A0, seções 4 e 6): as rotas `@EntradaDeOperacao` pulam as guardas de escola sem a `GuardaDeOperador`,
 * e por isso são uma lista fechada, escrita aqui. Rota de entrada nova é mudança da spec, não do código.
 */
const AS_SETE_ENTRADAS = [
  'POST /v1/operacao/convite/consultar',
  'POST /v1/operacao/convite/aceitar',
  'POST /v1/operacao/sessao/email',
  'POST /v1/operacao/sessao/mfa/configurar',
  'POST /v1/operacao/sessao/mfa',
  'POST /v1/operacao/sessao/renovar',
  'POST /v1/operacao/sessao/sair',
]

describe('arquitetura: as rotas @EntradaDeOperacao são exatamente as sete da seção 4 (C43)', () => {
  it('a lista registrada é a da spec, nem uma a mais, nem uma a menos', () => {
    expect(rotasDaApi().filter((rota) => rota.marcador === 'entrada').map(nomeDaRota).sort()).toEqual([...AS_SETE_ENTRADAS].sort())
  })
})

describe('arquitetura: toda rota @EntradaDeOperacao está num dos três grupos de limite (C36, parte)', () => {
  const identidade = configuracaoDeTeste().identidade
  /**
   * O grupo de cada entrada (Tech Spec da A0, seção 5, "Limite"): rebaixa no semáforo do hash (quem recusa é o contador
   * por conta), recusa pelo contador do `operador.id` no service (a rota também não responde 429 pelo IP), ou o limite
   * anônimo por IP que recusa (`rl:ip`).
   */
  const GRUPOS: Record<string, 'rebaixa_no_hash' | 'contador_do_operador' | 'rl_ip'> = {
    'POST /v1/operacao/convite/consultar': 'rl_ip',
    'POST /v1/operacao/convite/aceitar': 'rebaixa_no_hash',
    'POST /v1/operacao/sessao/email': 'rebaixa_no_hash',
    'POST /v1/operacao/sessao/mfa/configurar': 'rl_ip',
    'POST /v1/operacao/sessao/mfa': 'contador_do_operador',
    'POST /v1/operacao/sessao/renovar': 'rl_ip',
    'POST /v1/operacao/sessao/sair': 'rl_ip',
  }

  /** O que a `GuardaDeLimite` faz com a rota, com o IP acima do limite: qual limite ela conta, e se responde 429. */
  async function acimaDoLimite(rota: RotaRegistrada): Promise<{ contou: string[]; recusou: boolean }> {
    const recusa = { aceita: false, msAteLiberar: 1_000 } as const
    const limitador = {
      consumirDeOperador: vi.fn(async () => recusa),
      consumirAnonima: vi.fn(async () => recusa),
      consumirDoLogin: vi.fn(async () => recusa),
      consumirAutenticada: vi.fn(async () => recusa),
    }
    const guarda = new nucleo.GuardaDeLimite(new Reflector(), limitador as unknown as nucleo.LimitadorDeRequisicoes, new nucleo.ProxiesConfiaveis(['127.0.0.1']), { daEscola: async () => ({ porUsuarioMin: 1, porEscolaMin: 1 }) }, identidade)
    const requisicao = { headers: {}, socket: { remoteAddress: '127.0.0.1' } }
    const execucao = {
      getHandler: () => rota.handler,
      getClass: () => rota.controlador,
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => requisicao }),
    } as unknown as ExecutionContext
    let recusou = false
    try {
      await guarda.canActivate(execucao)
    } catch (erro) {
      expect(erro).toMatchObject({ codigo: CodigoDeErro.LIMITE_EXCEDIDO, status: 429 })
      recusou = true
    }
    const contou = Object.entries(limitador)
      .filter(([, consumo]) => consumo.mock.calls.length > 0)
      .map(([nome]) => nome)
    return { contou, recusou }
  }

  it('cada entrada conta no limite do seu grupo: rl:ip recusa com 429; rebaixar e o contador do operador nunca recusam pelo IP', async () => {
    const entradas = rotasDaApi().filter((rota) => rota.marcador === 'entrada')
    expect(entradas.map(nomeDaRota).sort()).toEqual(Object.keys(GRUPOS).sort())
    const esperado = { rl_ip: { contou: ['consumirAnonima'], recusou: true }, rebaixa_no_hash: { contou: ['consumirDoLogin'], recusou: false }, contador_do_operador: { contou: ['consumirDoLogin'], recusou: false } }
    for (const rota of entradas) {
      const grupo = GRUPOS[nomeDaRota(rota)]
      if (grupo === undefined) throw new Error(`entrada sem grupo: ${nomeDaRota(rota)}`)
      expect(await acimaDoLimite(rota), nomeDaRota(rota)).toEqual(esperado[grupo])
    }
  })
})

/**
 * C44 (Tech Spec da A0, seção 6; PRD, RF1): o operador e o convite dele nascem só pelo `ops:operador`. Os únicos
 * métodos que os inserem são o `criar` e o `criarConvite` do `OperadorRepository` (e só ele toca as tabelas, C45); aqui
 * se prova que só o comando os chama, e que nenhum módulo da API importa o código dos comandos.
 */
const COMANDO_DO_OPERADOR = 'apps/api/src/ops/operador.ts'
const PASTA_DOS_COMANDOS = 'apps/api/src/ops/'

/** Os arquivos de produção que criam operador ou convite de operador fora do comando, ou que importam os comandos na API. */
function quemCriaOperadorForaDoComando(arquivos: readonly Arquivo[]): string[] {
  return arquivos
    .filter((arquivo) => /^(apps|packages)\/[^/]+\/src\//.test(arquivo.caminho) && !deTeste(arquivo.caminho))
    .filter((arquivo) => {
      const codigo = semComentarios(arquivo.texto)
      const chamaORepository = /\bOperadorRepository\b/.test(codigo) && /\.(?:criar|criarConvite)\s*\(/.test(codigo) && arquivo.caminho !== COMANDO_DO_OPERADOR
      const chamaOComando = /\b(?:criarOperador|gerarConviteDeOperador|executarOpsOperador)\s*\(/.test(codigo) && !arquivo.caminho.startsWith(PASTA_DOS_COMANDOS)
      const importaOsComandos = arquivo.caminho.startsWith('apps/api/src/') && !arquivo.caminho.startsWith(PASTA_DOS_COMANDOS) && /from\s+['"](?:\.\.?\/)+(?:[^'"]*\/)?ops\//.test(codigo)
      return chamaORepository || chamaOComando || importaOsComandos
    })
    .map((arquivo) => arquivo.caminho)
}

describe('arquitetura: nenhuma rota registrada cria operador (C44)', () => {
  it('só o comando cria operador e convite de operador, e nenhum módulo da API importa os comandos', () => {
    const arquivos = arquivosDoRepositorio()
    // A varredura enxerga o código: o comando cria pelo repository.
    expect(arquivos.find((arquivo) => arquivo.caminho === COMANDO_DO_OPERADOR)?.texto).toMatch(/repositorio\.criar\(/)
    expect(quemCriaOperadorForaDoComando(arquivos)).toEqual([])
  })

  it('a varredura reprova a rota que cria pelo repository ou pelo comando, e o módulo que importa os comandos; não confunde comentário, teste nem outro repository', () => {
    const fora = [
      { caminho: 'apps/api/src/operacao/painel.service.ts', texto: "import { OperadorRepository } from './operador.repository.js'\nawait new OperadorRepository(tx).criar(dados)" },
      { caminho: 'apps/api/src/operacao/convite.service.ts', texto: "import { OperadorRepository } from './operador.repository.js'\nawait repositorio.criarConvite({ operadorId })" },
      { caminho: 'apps/api/src/operacao/atalho.controller.ts', texto: "import { criarOperador } from '../ops/operador.js'\nawait criarOperador(banco, autor, dados)" },
      { caminho: 'apps/api/src/app.module.ts', texto: "import { algo } from './ops/uso.js'" },
    ]
    const inocentes = [
      { caminho: COMANDO_DO_OPERADOR, texto: "import { OperadorRepository } from '../operacao/operador.repository.js'\nawait repositorio.criar(dados)" },
      { caminho: 'apps/api/src/estrutura/turma.service.ts', texto: 'await turmas.criar({ nome })' },
      { caminho: 'apps/api/src/operacao/eu.service.ts', texto: "import type { OperadorRepository } from './operador.repository.js'\n// nunca chama .criar( daqui" },
      { caminho: 'apps/api/test/registros-operador.int.test.ts', texto: "import { criarOperador } from '../src/ops/operador.js'\nawait criarOperador(banco, autor, dados)" },
    ]
    expect(quemCriaOperadorForaDoComando([...fora, ...inocentes])).toEqual(fora.map((arquivo) => arquivo.caminho))
  })
})
