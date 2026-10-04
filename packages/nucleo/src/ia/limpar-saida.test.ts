import { describe, expect, it } from 'vitest'
import { descartarRaciocinio, limparSaidaDoModelo, tirarCercaDeCodigo } from './limpar-saida.js'

const JSON_BOM = '{"ok":true}'

describe('descartarRaciocinio', () => {
  it('tira o bloco de raciocínio, onde quer que esteja, e quantos forem', () => {
    expect(descartarRaciocinio(`<think>primeiro penso {"ok":false}</think>${JSON_BOM}`)).toBe(JSON_BOM)
    expect(descartarRaciocinio(`<think>um</think>\n${JSON_BOM}\n<think>dois</think>`)).toBe(JSON_BOM)
    expect(descartarRaciocinio(`<THINK>\nvárias\nlinhas\n</THINK>\n\n${JSON_BOM}`)).toBe(JSON_BOM)
  })

  it('bloco aberto e não fechado: tudo depois da abertura é raciocínio, e não sobra nada para validar', () => {
    expect(descartarRaciocinio('<think>o aluno pediu a resposta, que é a B {"classificacao":"normal"')).toBe('')
    expect(descartarRaciocinio(`${JSON_BOM}<think>e ainda fiquei pensando`)).toBe(JSON_BOM)
  })

  it('fechamento sem abertura (o template abriu o bloco): só vale o que vem depois', () => {
    expect(descartarRaciocinio(`vou responder {"ok":false}</think>${JSON_BOM}`)).toBe(JSON_BOM)
  })

  it('texto sem raciocínio fica como veio', () => {
    expect(descartarRaciocinio(`  ${JSON_BOM}  `)).toBe(JSON_BOM)
  })
})

describe('tirarCercaDeCodigo e limparSaidaDoModelo', () => {
  it('tira a cerca de código em volta do JSON, com ou sem a linguagem', () => {
    expect(tirarCercaDeCodigo('```json\n{"ok":true}\n```')).toBe(JSON_BOM)
    expect(tirarCercaDeCodigo('```\n{"ok":true}\n```')).toBe(JSON_BOM)
    expect(tirarCercaDeCodigo(JSON_BOM)).toBe(JSON_BOM)
  })

  it('raciocínio, cerca e prosa em volta saem juntos: sobra o objeto', () => {
    expect(limparSaidaDoModelo('<think>hmm</think>\nAqui está:\n```json\n{"ok":true}\n```')).toBe(JSON_BOM)
    expect(limparSaidaDoModelo(`Claro! ${JSON_BOM} Espero ter ajudado.`)).toBe(JSON_BOM)
  })

  it('o que não tem objeto nenhum fica como veio, para a validação recusar', () => {
    expect(limparSaidaDoModelo('não consegui')).toBe('não consegui')
    expect(limparSaidaDoModelo('<think>só pensei')).toBe('')
  })
})
