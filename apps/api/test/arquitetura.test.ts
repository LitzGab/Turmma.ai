import * as nucleo from '@educa/nucleo'
import { getTableName, is } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

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

function quemTocaAOperacao(arquivos: readonly Arquivo[]): string[] {
  return arquivos
    .filter((arquivo) => !/\.test\.ts$/.test(arquivo.caminho) && !FORA_DA_VARREDURA.includes(arquivo.caminho))
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
      { caminho: 'packages/nucleo/src/index.ts', texto: "export { operador } from './db/schema/operador.js'" },
    ]
    expect(quemTocaAOperacao([...fora, ...inocentes])).toEqual(fora.map((arquivo) => arquivo.caminho))
  })

  it('reprova o repository que importa outra tabela do pacote ou cita outra tabela em SQL', () => {
    expect(tabelasDeForaNoRepository("import { conta, operador } from '@educa/nucleo'")).toEqual(['conta'])
    expect(tabelasDeForaNoRepository("sql`select 1 from escola`; sql`insert into auditoria (x)`; sql`update operador set x = 1`")).toEqual(['escola', 'auditoria'])
  })
})
