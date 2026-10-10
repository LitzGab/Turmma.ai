import { CLASSIFICACAO_DAS_TABELAS } from '@educa/shared'
import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { colunasDoSelect, LEITURAS_DO_ARQUIVO } from './leitura-do-titular.js'

const texto = (instrucao: ReturnType<typeof colunasDoSelect>): string => new PgDialect().sqlToQuery(instrucao).sql

describe('colunasDoSelect: a lista de colunas que entra no SQL do arquivo', () => {
  it('põe cada coluna sob o alias da tabela, na ordem, sem aspas nem parâmetro', () => {
    expect(texto(colunasDoSelect('id', 'criada_em'))).toBe('t.id, t.criada_em')
  })

  it.each(['id; drop table usuario', 'a b', 'Id', '1id', "id'", 'id--', ''])('recusa o nome fora do formato %j: nada que não seja nome de coluna chega ao SQL', (nome) => {
    expect(() => colunasDoSelect('id', nome)).toThrow('nome de coluna fora do formato')
  })
})

describe('LEITURAS_DO_ARQUIVO: a forma das leituras', () => {
  const alvo = { escolaId: '11111111-1111-4111-8111-111111111111', titularId: '22222222-2222-4222-8222-222222222222' }

  it('toda consulta leva a escola do alvo e o titular como parâmetro, nunca no texto, e devolve a coluna `id` que junta as ligações', () => {
    const dialeto = new PgDialect()
    for (const [tabela, leitura] of Object.entries(LEITURAS_DO_ARQUIVO)) {
      for (const versao of ['completa', 'coordenacao'] as const) {
        const consultas = leitura.consultas({ ...alvo, versao })
        expect(consultas.length, tabela).toBeGreaterThan(0)
        for (const consulta of consultas) {
          const { sql: instrucao, params } = dialeto.sqlToQuery(consulta)
          expect(params, `${tabela} ${versao}`).toContain(alvo.escolaId)
          expect(params, `${tabela} ${versao}`).toContain(alvo.titularId)
          expect(instrucao, `${tabela} ${versao}`).not.toContain(alvo.escolaId)
          expect(instrucao, `${tabela} ${versao}`).not.toContain(alvo.titularId)
          expect(instrucao, `${tabela} ${versao}`).toMatch(/\bt\.id\b/)
        }
      }
    }
  })

  it('a versão da coordenação não lê a conversa do professor, a entrada das execuções, o texto do modelo nem a justificativa', () => {
    const dialeto = new PgDialect()
    const daCoordenacao = (tabela: string): string => (LEITURAS_DO_ARQUIVO[tabela]?.consultas({ ...alvo, versao: 'coordenacao' }) ?? []).map((consulta) => dialeto.sqlToQuery(consulta).sql).join('\n')
    expect(LEITURAS_DO_ARQUIVO['thread_agente']?.naVersao?.('coordenacao')).toBe(false)
    expect(LEITURAS_DO_ARQUIVO['mensagem_agente']?.naVersao?.('coordenacao')).toBe(false)
    expect(LEITURAS_DO_ARQUIVO['thread_agente']?.naVersao?.('completa')).toBe(true)
    expect(daCoordenacao('execucao_agente')).not.toMatch(/\bt\.entrada\b/)
    expect(daCoordenacao('consumo_ia')).not.toMatch(/\bt\.(entrada|saida)\b/)
    expect(daCoordenacao('entrega')).not.toMatch(/\bt\.justificativa\b/)
    const daCompleta = (tabela: string): string => (LEITURAS_DO_ARQUIVO[tabela]?.consultas({ ...alvo, versao: 'completa' }) ?? []).map((consulta) => dialeto.sqlToQuery(consulta).sql).join('\n')
    expect(daCompleta('execucao_agente')).toMatch(/\bt\.entrada\b/)
    expect(daCompleta('consumo_ia')).toMatch(/\bt\.entrada, t\.saida\b/)
    expect(daCompleta('entrega')).toMatch(/\bt\.justificativa\b/)
  })

  it('a correção do aluno só sai do banco com o lote aprovado: cada número e o diagnóstico passam pelo `case` da entrega', () => {
    const dialeto = new PgDialect()
    const [doAluno] = LEITURAS_DO_ARQUIVO['correcao']?.consultas({ ...alvo, versao: 'completa' }) ?? []
    const instrucao = dialeto.sqlToQuery(doAluno ?? ({} as never)).sql
    for (const coluna of ['acertos', 'total', 'em_branco', 'por_habilidade', 'destaques', 'corrigida_em']) {
      expect(instrucao, coluna).toMatch(new RegExp(`case when e\\.estado = 'aprovada' then t\\.${coluna} end as ${coluna}`))
    }
    expect(instrucao).toMatch(/join entrega e on e\.escola_id = t\.escola_id and e\.id = t\.entrega_id/)
  })

  it('cada coluna de ligação que a classificação dá à tabela é lida: a leitura não ignora uma das formas de a linha chegar ao titular', () => {
    const dialeto = new PgDialect()
    for (const [tabela, classificada] of Object.entries(CLASSIFICACAO_DAS_TABELAS)) {
      if (!classificada.arquivo.entra) continue
      const leitura = LEITURAS_DO_ARQUIVO[tabela]
      const texto = (leitura?.consultas({ ...alvo, versao: 'completa' }) ?? []).map((consulta) => dialeto.sqlToQuery(consulta).sql).join('\n')
      for (const coluna of classificada.arquivo.ligacao) {
        // A `conta` liga por `conta.id` (o `usuario.conta_id` da pessoa), e a `usuario`, por `usuario.id`: as duas pelo `t.id`.
        expect(texto, `${tabela}.${coluna}`).toMatch(new RegExp(`\\b[a-z]\\.${coluna}\\b`))
      }
    }
  })
})
