import { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { ACOES_DE_AUDITORIA, CAMPOS_PROIBIDOS_NA_AUDITORIA, problemasDoMapaDeAcoes, type DefinicaoDeAcao } from './acoes.js'

const acaoCom = (depois: z.ZodObject): Record<string, DefinicaoDeAcao> => ({ 'teste.acao': { entidade: 'teste', antes: null, depois, finalidade: null } })

describe('mapa de ações da auditoria', () => {
  it('o mapa real passa na conferência: nenhum nome proibido, todo objeto estrito, só tipos de id, estado ou data', () => {
    expect(Object.keys(ACOES_DE_AUDITORIA).length).toBeGreaterThan(0)
    expect(problemasDoMapaDeAcoes(ACOES_DE_AUDITORIA)).toEqual([])
  })

  it('a lista proibida é a da Tech Spec, seção 3, mais senha', () => {
    expect([...CAMPOS_PROIBIDOS_NA_AUDITORIA].sort()).toEqual(['complemento', 'email', 'hash', 'matricula', 'nome', 'segredo', 'senha'])
  })

  it.each(CAMPOS_PROIBIDOS_NA_AUDITORIA)('a conferência acha "%s" como campo, como parte do nome e dentro de objeto aninhado', (proibido) => {
    const comMaiuscula = `${proibido[0]?.toUpperCase() ?? ''}${proibido.slice(1)}`
    const mapa: Record<string, DefinicaoDeAcao> = {
      'teste.direto': { entidade: 'teste', antes: null, depois: z.strictObject({ [proibido]: z.uuid() }), finalidade: null },
      'teste.composto': { entidade: 'teste', antes: z.strictObject({ [`aluno${comMaiuscula}`]: z.uuid().optional() }), depois: null, finalidade: null },
      'teste.aninhado': {
        entidade: 'teste',
        antes: null,
        depois: z.strictObject({ itens: z.array(z.strictObject({ turmaId: z.uuid(), [proibido]: z.boolean().nullable() })) }),
        finalidade: null,
      },
    }
    expect(problemasDoMapaDeAcoes(mapa)).toEqual([
      `teste.direto.depois.${proibido}: nome proibido`,
      `teste.composto.antes.aluno${comMaiuscula}: nome proibido`,
      `teste.aninhado.depois.itens.${proibido}: nome proibido`,
    ])
  })

  it('objeto que não é estrito é apontado: campo fora da lista seria descartado em silêncio, e não recusado', () => {
    const mapa: Record<string, DefinicaoDeAcao> = {
      'teste.frouxo': { entidade: 'teste', antes: null, depois: z.object({ turmaId: z.uuid() }), finalidade: null },
      'teste.aninhado': { entidade: 'teste', antes: null, depois: z.strictObject({ vinculo: z.looseObject({ estado: z.enum(['pendente']) }).optional() }), finalidade: null },
    }
    expect(problemasDoMapaDeAcoes(mapa)).toEqual(['teste.frouxo.depois: objeto não estrito', 'teste.aninhado.depois.vinculo: objeto não estrito'])
  })

  // Cada um aceitaria `{ dados: { nome: 'Enzo Martins' } }` ou texto livre sem nenhum campo proibido declarado.
  it.each([
    ['record', z.record(z.string(), z.uuid()), 'tipo não permitido (record)'],
    ['unknown', z.unknown(), 'tipo não permitido (unknown)'],
    ['any', z.any(), 'tipo não permitido (any)'],
    ['union com objeto', z.union([z.strictObject({ turmaId: z.uuid() }), z.null()]), 'tipo não permitido (union)'],
    ['default sobre objeto', z.strictObject({ turmaId: z.uuid() }).default({ turmaId: '0190f5a0-0000-7000-8000-00000000000a' }), 'tipo não permitido (default)'],
    ['readonly', z.strictObject({ turmaId: z.uuid() }).readonly(), 'tipo não permitido (readonly)'],
    ['lazy', z.lazy(() => z.uuid()), 'tipo não permitido (lazy)'],
    ['tuple', z.tuple([z.uuid()]), 'tipo não permitido (tuple)'],
    ['intersection', z.intersection(z.strictObject({ a: z.uuid() }), z.strictObject({ b: z.uuid() })), 'tipo não permitido (intersection)'],
    ['map', z.map(z.string(), z.uuid()), 'tipo não permitido (map)'],
    ['transform', z.uuid().transform((valor) => valor), 'tipo não permitido (pipe)'],
    ['texto sem formato', z.string(), 'texto sem formato de id ou data'],
    ['texto com regex', z.string().regex(/^[a-z]+$/), 'texto sem formato de id ou data'],
    ['texto e-mail', z.email(), 'texto sem formato de id ou data'],
    ['uuid com overwrite', z.uuid().overwrite(() => 'Enzo Martins'), 'texto sem formato de id ou data'],
    ['uuid com trim', z.uuid().trim(), 'texto sem formato de id ou data'],
    ['uuid com refine', z.uuid().refine(() => true), 'texto sem formato de id ou data'],
    ['formato próprio com nome de uuid', z.stringFormat('uuid', () => true), 'texto sem formato de id ou data'],
  ])('%s é recusado em qualquer profundidade, com o caminho', (_caso, esquema, problema) => {
    expect(problemasDoMapaDeAcoes(acaoCom(z.strictObject({ dados: esquema })))).toEqual([`teste.acao.depois.dados: ${problema}`])
    expect(problemasDoMapaDeAcoes(acaoCom(z.strictObject({ lista: z.array(z.strictObject({ dados: esquema.optional() })) })))).toEqual([
      `teste.acao.depois.lista.dados: ${problema}`,
    ])
  })

  it('os tipos que guardam id, estado, código, número ou data passam', () => {
    const esquema = z.strictObject({
      turmaId: z.uuid(),
      estado: z.enum(['pendente', 'confirmado']),
      versao: z.literal(1),
      ativo: z.boolean(),
      tentativas: z.int(),
      decididoEm: z.iso.datetime().nullable(),
      dia: z.iso.date().optional(),
      disciplinas: z.array(z.uuid()),
    })
    expect(problemasDoMapaDeAcoes(acaoCom(esquema))).toEqual([])
  })

  it('finalidade só como enum: texto livre é recusado', () => {
    const mapa = {
      'teste.livre': { entidade: 'teste', antes: null, depois: null, finalidade: z.string().max(200) },
      'teste.codigo': { entidade: 'teste', antes: null, depois: null, finalidade: z.enum(['conferir_turma']) },
    } as unknown as Record<string, DefinicaoDeAcao>
    expect(problemasDoMapaDeAcoes(mapa)).toEqual(['teste.livre.finalidade: precisa ser enum'])
  })
})
