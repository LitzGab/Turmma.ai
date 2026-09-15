import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as nucleo from '../index.js'
import { justificativaSemEscopo } from '../db/sem-escopo.decorator.js'
import { AuditoriaRepository } from './auditoria.repository.js'

const RAIZ = fileURLToPath(new URL('../../../../', import.meta.url))
const PASTAS_DE_CODIGO = ['apps', 'packages', 'infra', 'tools']
const MODULO_DA_INSERCAO = 'packages/nucleo/src/auditoria/insercao-de-auditoria.repository.ts'
const REGISTRO = 'packages/nucleo/src/auditoria/registro-de-auditoria.ts'

/** Todo `.ts` de código (sem teste, sem `dist`, sem `node_modules`), com o caminho a partir da raiz. */
function arquivosDeCodigo(): { caminho: string; texto: string }[] {
  return PASTAS_DE_CODIGO.flatMap((pasta) =>
    readdirSync(join(RAIZ, pasta), { recursive: true, encoding: 'utf8' })
      .filter((arquivo) => /\.(ts|tsx|mts)$/.test(arquivo) && !/\.test\.ts$/.test(arquivo))
      .filter((arquivo) => !arquivo.split(sep).some((parte) => parte === 'node_modules' || parte === 'dist'))
      .map((arquivo) => {
        const caminho = relative(RAIZ, join(RAIZ, pasta, arquivo)).split(sep).join('/')
        return { caminho, texto: readFileSync(join(RAIZ, caminho), 'utf8') }
      }),
  )
}

// Drizzle (`insert(auditoria)`, `delete(schema.auditoria)`) e SQL (`insert into auditoria`, `update public.auditoria`,
// `delete from "auditoria"`). Apagar registro de auditoria em silêncio é tão grave quanto gravar por fora: o
// expurgo por retenção (F3) entra com porta própria e acrescenta a exceção aqui.
const TABELA = String.raw`(?:"?public"?\.)?"?auditoria"?`
const ESCRITA_NA_AUDITORIA = new RegExp(
  String.raw`\b(?:insert|update|delete)\s*\(\s*(?:schema\.)?auditoria\b|\binsert\s+into\s+${TABELA}[\s(]|\bupdate\s+${TABELA}\s+set\b|\bdelete\s+from\s+${TABELA}\b`,
  'i',
)

/** Importa a tabela `auditoria` (e não só o `FORMATO_OPERADOR`) do arquivo de schema dela. */
const IMPORTA_A_TABELA = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*schema\/auditoria(?:\.js|\.ts)?['"]/g
const LEITURA = 'packages/nucleo/src/auditoria/auditoria.repository.ts'

describe('auditoria: uma porta só de escrita', () => {
  it('a varredura enxerga o código: acha o próprio insert da auditoria', () => {
    const arquivos = arquivosDeCodigo()
    expect(arquivos.length).toBeGreaterThan(100)
    expect(arquivos.filter((arquivo) => ESCRITA_NA_AUDITORIA.test(arquivo.texto)).map((arquivo) => arquivo.caminho)).toContain(MODULO_DA_INSERCAO)
  })

  it('nenhum código fora do módulo de inserção escreve em auditoria, por Drizzle ou por SQL', () => {
    const fora = arquivosDeCodigo()
      .filter((arquivo) => arquivo.caminho !== MODULO_DA_INSERCAO && ESCRITA_NA_AUDITORIA.test(arquivo.texto))
      .map((arquivo) => arquivo.caminho)
    expect(fora).toEqual([])
  })

  it('só o RegistroDeAuditoria importa o módulo de inserção, e o pacote não o exporta', () => {
    const importam = arquivosDeCodigo()
      .filter((arquivo) => arquivo.caminho !== MODULO_DA_INSERCAO && /insercao-de-auditoria/.test(arquivo.texto))
      .map((arquivo) => arquivo.caminho)
    expect(importam).toEqual([REGISTRO])
    expect(Object.keys(nucleo)).not.toContain('inserirAuditoria')
    expect(Object.keys(nucleo)).not.toContain('auditoria')
  })

  it('a tabela só é importada pelo módulo de inserção e pela leitura, e o schema exportado não a contém', () => {
    const importam = arquivosDeCodigo()
      .filter((arquivo) => [...arquivo.texto.matchAll(IMPORTA_A_TABELA)].some((importacao) => /\bauditoria\b/.test(importacao[1] ?? '')))
      .map((arquivo) => arquivo.caminho)
      .sort()
    expect(importam).toEqual([MODULO_DA_INSERCAO, LEITURA].sort())
    expect(Object.keys(nucleo.schema)).not.toContain('auditoria')
  })

  it('a varredura pega a escrita em qualquer forma', () => {
    for (const trecho of [
      'tx.insert(auditoria).values(linha)',
      'banco.update( schema.auditoria ).set({})',
      'tx.delete(auditoria).where(condicao)',
      "pool.query('INSERT INTO auditoria (acao) values ($1)')",
      'insert into public.auditoria(acao)',
      'update "auditoria" set depois = $1',
      'delete from "public"."auditoria" where em < now()',
    ]) {
      expect(ESCRITA_NA_AUDITORIA.test(trecho), trecho).toBe(true)
    }
    expect(ESCRITA_NA_AUDITORIA.test('new AuditoriaRepository(banco).listarDaEscola()')).toBe(false)
  })

  it('o AuditoriaRepository só lê, na escola do contexto: sem método de escrita e sem @SemEscopo', () => {
    const metodos = Object.getOwnPropertyNames(AuditoriaRepository.prototype).filter((nome) => nome !== 'constructor')
    expect(metodos).toEqual(['listarDaEscola'])
    expect(justificativaSemEscopo(AuditoriaRepository, 'listarDaEscola')).toBeUndefined()
  })
})
