import { describe, expect, it } from 'vitest'
import { citaOutraEscola, textoParaComparar } from './incidente.js'

const A = { id: '0198a0c0-1111-7000-8000-00000000000a', nome: 'Colégio Ágata' }
const B = { id: '0198a0c0-2222-7000-8000-00000000000b', nome: 'Escola Municipal Basalto' }

describe('o texto do incidente e a outra escola afetada (F3, 9.0)', () => {
  it('textoParaComparar tira acento e caixa e junta os espaços', () => {
    expect(textoParaComparar('  Colégio   ÁGATA\n Norte ')).toBe('colegio agata norte')
    expect(textoParaComparar('Ação')).toBe('acao')
  })

  it('cita o nome da outra escola inteiro, em qualquer caixa, com ou sem acento, e com espaços a mais', () => {
    for (const texto of ['Afetou a Escola Municipal Basalto.', 'AFETOU A ESCOLA MUNICIPAL BASALTO', 'afetou a escola   municipal\nbasalto', 'escola municipal basalto', 'Escóla Munícipal Básalto']) {
      expect(citaOutraEscola(texto, A, [B]), texto).toBe(true)
    }
  })

  it('cita o id da outra escola, em qualquer caixa, com ou sem hífen', () => {
    for (const texto of [`Veja ${B.id}`, `Veja ${B.id.toUpperCase()}`, `Veja ${B.id.replaceAll('-', '')}`, `(${B.id})`]) expect(citaOutraEscola(texto, A, [B]), texto).toBe(true)
  })

  it('não casa no meio de uma palavra, nem com a metade do nome, nem com o id de uma escola que não é afetada', () => {
    const alfa = { id: '0198a0c0-3333-7000-8000-00000000000c', nome: 'Alfa' }
    expect(citaOutraEscola('O alfabeto da prova foi exposto.', A, [alfa])).toBe(false)
    expect(citaOutraEscola('Nova alfa', A, [alfa])).toBe(true)
    expect(citaOutraEscola('Alfa.', A, [alfa])).toBe(true)
    expect(citaOutraEscola('Afetou a Escola Municipal.', A, [B])).toBe(false)
    expect(citaOutraEscola(`Veja ${'0198a0c0-9999-7000-8000-000000000009'}`, A, [B])).toBe(false)
    expect(citaOutraEscola('Texto qualquer.', A, [])).toBe(false)
  })

  it('o nome da própria escola não conta, mesmo quando contém o da outra; o da outra ao lado dele conta', () => {
    const curta = { id: '0198a0c0-4444-7000-8000-00000000000d', nome: 'Colégio Ametista' }
    const longa = { id: '0198a0c0-5555-7000-8000-00000000000e', nome: 'Colégio Ametista Norte' }
    expect(citaOutraEscola('O Colégio Ametista Norte teve acesso indevido.', longa, [curta])).toBe(false)
    expect(citaOutraEscola('O Colégio Ametista Norte e o Colégio Ametista tiveram acesso indevido.', longa, [curta])).toBe(true)
    // Sem o nome da própria no texto, o da curta dentro da longa não é tirado: a curta é citada.
    expect(citaOutraEscola('O Colégio Ametista teve acesso indevido.', longa, [curta])).toBe(true)
    // A curta que escreve o nome da longa cita a outra: o nome da longa não é apagado por conter o da própria.
    expect(citaOutraEscola('O Colégio Ametista Norte teve acesso indevido.', curta, [longa])).toBe(true)
  })

  it('o nome de outra escola que começa com o da própria é citação, sem nome composto', () => {
    const alfa = { id: '0198a0c0-3333-7000-8000-00000000000c', nome: 'Alfa' }
    const alfabeto = { id: '0198a0c0-7777-7000-8000-000000000010', nome: 'Escola Alfabeto' }
    expect(citaOutraEscola('A Escola Alfabeto teve acesso indevido.', alfa, [alfabeto])).toBe(true)
    // O nome da própria escola sozinho não acusa.
    expect(citaOutraEscola('O Alfa teve acesso indevido.', alfa, [alfabeto])).toBe(false)
  })

  it('o nome com caractere de expressão regular é procurado como texto, e o nome vazio não casa com tudo', () => {
    const especial = { id: '0198a0c0-6666-7000-8000-00000000000f', nome: 'Escola (Unidade 2) [Sul] a+b?' }
    expect(citaOutraEscola('Também a escola (unidade 2) [sul] a+b? foi alcançada.', A, [especial])).toBe(true)
    expect(citaOutraEscola('Também a escola unidade 2 sul foi alcançada.', A, [especial])).toBe(false)
    expect(citaOutraEscola('qualquer texto', A, [{ id: B.id, nome: '   ' }])).toBe(false)
  })
})
