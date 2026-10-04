import { describe, expect, it } from 'vitest'
import {
  classesDoBotao,
  CLASSES_DO_BOTAO_OFICIAL,
  CLASSES_DO_BOTAO_PERIGO,
  CLASSES_DO_BOTAO_PERIGO_CHEIO,
  CLASSES_DO_BOTAO_SECUNDARIO,
  TAMANHOS_DE_BOTAO,
  VARIANTES_DE_BOTAO,
} from './botao-secundario'

const classes = (texto: string): Set<string> => new Set(texto.split(/\s+/).filter((classe) => classe !== ''))

describe('as variantes de botão da 11.1', () => {
  it('são cinco, e nenhuma outra', () => {
    expect([...VARIANTES_DE_BOTAO]).toEqual(['primario', 'oficial', 'secundario', 'discreto', 'perigo'])
  })

  it('só a oficial pinta de preto: a decisão oficial não se parece com nenhum outro botão (regra 50, item 8)', () => {
    const comOPreto = VARIANTES_DE_BOTAO.filter((variante) => classes(classesDoBotao({ variante })).has('bg-noite'))
    expect(comOPreto).toEqual(['oficial'])
    expect(classes(classesDoBotao({ variante: 'oficial' })).has('text-white')).toBe(true)
  })

  it('só a primária pinta de laranja, e com texto tinta: branco sobre o laranja dá 3,0:1 e reprova (9.1)', () => {
    const comOLaranja = VARIANTES_DE_BOTAO.filter((variante) => classes(classesDoBotao({ variante })).has('bg-caramelo'))
    expect(comOLaranja).toEqual(['primario'])
    expect(classes(classesDoBotao()).has('text-tinta')).toBe(true)
    expect(classes(classesDoBotao()).has('text-white')).toBe(false)
  })

  it('todas são pílula, com alvo de 44 px no principal; o compacto tem 36 px só a partir de 768 px, e 44 px no celular', () => {
    for (const variante of VARIANTES_DE_BOTAO) {
      const principal = classes(classesDoBotao({ variante }))
      expect(principal.has('rounded-full'), variante).toBe(true)
      expect(principal.has('min-h-11') && principal.has('min-w-11'), variante).toBe(true)
      const compacto = classes(classesDoBotao({ variante, tamanho: 'compacto' }))
      expect(compacto.has('md:min-h-9') && compacto.has('md:min-w-9'), variante).toBe(true)
      // Sem prefixo de largura, vale o de 44 px: é o que o celular recebe (regra 50, item 2a).
      expect(compacto.has('min-h-11') && compacto.has('min-w-11'), variante).toBe(true)
      expect(compacto.has('min-h-9'), variante).toBe(false)
      // O botão só de ícone é o círculo de 44 px: sem o enchimento lateral, que o deixaria mais largo que alto.
      const icone = classes(classesDoBotao({ variante, tamanho: 'icone' }))
      expect(icone.has('size-11') && icone.has('rounded-full'), variante).toBe(true)
      expect([...icone].filter((classe) => classe.startsWith('px-')), variante).toEqual([])
    }
    expect([...TAMANHOS_DE_BOTAO]).toEqual(['principal', 'compacto', 'icone'])
  })

  it('o perigo só é cheio quando pedido: fora do diálogo de confirmação ele é texto em erro, sem fundo de erro', () => {
    expect(classes(classesDoBotao({ variante: 'perigo' })).has('bg-erro')).toBe(false)
    expect(classes(classesDoBotao({ variante: 'perigo' })).has('text-erro')).toBe(true)
    expect(classes(classesDoBotao({ variante: 'perigo', cheio: true })).has('bg-erro')).toBe(true)
    // `cheio` não muda as outras variantes: a primária não vira botão de erro por engano.
    expect(classesDoBotao({ variante: 'primario', cheio: true })).toBe(classesDoBotao({ variante: 'primario' }))
  })

  it('a variante do Botao e a constante escrita à mão dizem o mesmo botão', () => {
    // As telas da A0 e da A1 usam as constantes num `<button>` solto; se uma das duas mudar sozinha, a tela nova e a
    // antiga passam a ter dois "secundários". A tabela acrescenta só o vão do ícone.
    const comOVao = (constante: string) => new Set([...classes(constante), 'gap-2'])
    expect(classes(classesDoBotao({ variante: 'secundario' }))).toEqual(comOVao(CLASSES_DO_BOTAO_SECUNDARIO))
    expect(classes(classesDoBotao({ variante: 'oficial' }))).toEqual(comOVao(CLASSES_DO_BOTAO_OFICIAL))
    expect(classes(classesDoBotao({ variante: 'perigo' }))).toEqual(comOVao(CLASSES_DO_BOTAO_PERIGO))
    expect(classes(classesDoBotao({ variante: 'perigo', cheio: true }))).toEqual(comOVao(CLASSES_DO_BOTAO_PERIGO_CHEIO))
  })
})
