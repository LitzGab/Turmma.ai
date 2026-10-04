import { describe, expect, it } from 'vitest'
import { AdaptadorRoteirizado } from '../__fixtures__/adaptador-roteirizado.js'
import { entradaDoAnalista, entradaDoAssistente, entradaDoRelatorio, ESCOLA_A } from '../__fixtures__/entradas.js'
import { MATERIAL_DE_ESTEQUIOMETRIA } from '../__fixtures__/estequiometria.js'
import type { AdaptadorDeModelo } from '../adaptador.js'
import { ConsumoEmMemoria, OrcamentoEmMemoria } from '../consumo.js'
import { ErroDeIa } from '../erros.js'
import { ProvedorDeIa } from '../provedor.js'
import { proporFerramenta } from './propor-ferramenta.js'
import { relatorioDaCorrecao } from './relatorio-da-correcao.js'
import { resumoDoAnalista } from './resumo-do-analista.js'

function provedorCom(adaptador: AdaptadorDeModelo): { ia: ProvedorDeIa; consumo: ConsumoEmMemoria } {
  const consumo = new ConsumoEmMemoria()
  return { ia: new ProvedorDeIa({ adaptador, registro: consumo, orcamento: new OrcamentoEmMemoria(consumo), timeoutMs: 5_000 }), consumo }
}

describe('propor_ferramenta: o Assistente pergunta antes de abrir a ferramenta (D18)', () => {
  const proposta = (mensagem: string) => proporFerramenta.falso(entradaDoAssistente(mensagem))

  it('pedido que corresponde a uma ferramenta vira proposta com o que deu para entender, e nada é gerado', () => {
    expect(proposta('monta uma atividade com 5 questões sobre reagente limitante para o 2ºB')).toEqual({
      tipo: 'proposta',
      texto: 'Quer que eu abra a ferramenta de atividade objetiva com 5 questões sobre “reagente limitante”? Você ajusta antes de gerar.',
      proposta: { ferramenta: 'atividade_objetiva', parametros: { tema: 'reagente limitante', quantidade: 5 } },
    })
    expect(proposta('preciso de um plano de aula de 50 minutos sobre mol e massa molar')).toMatchObject({
      tipo: 'proposta',
      proposta: { ferramenta: 'plano_de_aula', parametros: { tema: 'mol e massa molar', duracaoMinutos: 50 } },
    })
  })

  it('sem quantidade nem duração no pedido, a proposta não inventa: o cartão abre só com o tema', () => {
    expect(proposta('faz uns exercícios sobre rendimento')).toMatchObject({ proposta: { ferramenta: 'atividade_objetiva', parametros: { tema: 'rendimento' } } })
    const saida = proposta('faz uns exercícios sobre rendimento')
    expect(saida.tipo === 'proposta' && 'quantidade' in saida.proposta.parametros).toBe(false)
  })

  it('pedido de adaptação que descreve um aluno vira proposta só com os tipos: o que foi dito sobre o aluno não aparece em lugar nenhum da saída', () => {
    const saida = proposta('quero adaptar a atividade com fonte ampliada e mais tempo para o Enzo, que tem baixa visão')
    expect(saida).toMatchObject({ tipo: 'proposta', proposta: { ferramenta: 'adaptacao', parametros: { tipos: ['fonte_ampliada', 'tempo_adicional'] } } })
    expect(JSON.stringify(saida)).not.toMatch(/Enzo|baixa visão/)
  })

  it('a proposta de adaptação não tem campo de texto: descrição de aluno nos parâmetros nem passa no schema', () => {
    const comTexto = { tipo: 'proposta', texto: 'Quer abrir?', proposta: { ferramenta: 'adaptacao', parametros: { tipos: ['fonte_ampliada'], observacao: 'aluno com baixa visão' } } }
    expect(proporFerramenta.esquemaDeSaida.safeParse(comTexto).success).toBe(false)
    expect(proporFerramenta.esquemaDeSaida.safeParse({ tipo: 'proposta', texto: 'Quer abrir?', proposta: { ferramenta: 'prova_discursiva', parametros: {} } }).success).toBe(false)
  })

  it('o que não é pedido de ferramenta vira texto, com a página do material citada quando a resposta vem dele', () => {
    const saida = proposta('o que é rendimento teórico?')
    expect(saida).toMatchObject({ tipo: 'texto', citacoes: [{ materialId: MATERIAL_DE_ESTEQUIOMETRIA, pagina: 6 }] })
    expect(saida.texto).toContain('página 6')
    expect(proporFerramenta.falso({ ...entradaDoAssistente('bom dia'), trechos: [] })).toMatchObject({ tipo: 'texto', citacoes: [] })
  })

  it('texto do modelo citando página que não veio nos trechos é recusado', () => {
    const entrada = entradaDoAssistente('o que é mol?')
    const problemas = proporFerramenta.conferir?.(entrada, { tipo: 'texto', texto: 'Está na página 1.', citacoes: [{ materialId: MATERIAL_DE_ESTEQUIOMETRIA, pagina: 1, trecho: 'O mol é…' }] })
    expect(problemas).toHaveLength(1)
  })
})

describe('relatorio_da_correcao: a conta é do domínio, a IA só põe em palavras', () => {
  it('usa os números como vieram: acertos, total, percentual, a errada mais marcada e os em branco', () => {
    const { questoes, visaoGeral } = relatorioDaCorrecao.falso(entradaDoRelatorio())
    expect(questoes.map((questao) => questao.numero)).toEqual([1, 2, 3])
    expect(questoes[0]?.texto).toContain('25 de 30 acertaram (83%). A correta é a D.')
    expect(questoes[1]?.texto).toContain('8 de 30 acertaram (27%). A correta é a C. A errada mais marcada foi a B, com 15 respostas. 2 ficaram em branco. Menos da metade acertou')
    expect(questoes[1]?.texto).toContain('Identificar o reagente limitante')
    expect(questoes[2]?.texto).toContain('30 de 30 acertaram (100%)')
    expect(questoes[2]?.texto).toContain('Todos acertaram.')
    expect(visaoGeral).toContain('30 alunos enviaram 3 questões')
    expect(visaoGeral).toContain('menos acertos foi a 2 (27%)')
    expect(visaoGeral).toContain('mais acertos, a 3 (100%)')
  })

  it('a entrada é a contagem da turma: resposta de um aluno, ou aluno identificado, não tem onde entrar', () => {
    const entrada = entradaDoRelatorio()
    const [primeira] = entrada.questoes
    expect(relatorioDaCorrecao.esquemaDeEntrada.safeParse({ ...entrada, respostas: [{ alunoId: 'x', alternativa: 2 }] }).success).toBe(false)
    expect(relatorioDaCorrecao.esquemaDeEntrada.safeParse({ ...entrada, questoes: [{ ...primeira, errou: ['Enzo Martins'] }] }).success).toBe(false)
  })

  it('a saída não tem campo de nota, e relatório que pula ou troca questão é recusado', () => {
    const entrada = entradaDoRelatorio()
    const bom = relatorioDaCorrecao.falso(entrada)
    expect(relatorioDaCorrecao.esquemaDeSaida.safeParse({ ...bom, nota: 7.5 }).success).toBe(false)
    expect(relatorioDaCorrecao.conferir?.(entrada, { ...bom, questoes: bom.questoes.slice(0, 2) })).toHaveLength(1)
    expect(relatorioDaCorrecao.conferir?.(entrada, { ...bom, questoes: [...bom.questoes].reverse() })).toHaveLength(1)
  })

  it('questão que ninguém respondeu não vira divisão por zero', () => {
    const entrada = { ...entradaDoRelatorio(), respondentes: 0, questoes: entradaDoRelatorio().questoes.map((questao) => ({ ...questao, marcacoes: [0, 0, 0, 0], emBranco: 0 })) }
    const saida = relatorioDaCorrecao.falso(entrada)
    expect(saida.questoes.map((questao) => questao.texto)).toEqual(['Ninguém respondeu a esta questão.', 'Ninguém respondeu a esta questão.', 'Ninguém respondeu a esta questão.'])
    expect(JSON.stringify(saida)).not.toContain('NaN')
  })
})

describe('resumo_do_analista: só agregado, alerta como hipótese com contexto', () => {
  it('alerta só o que está abaixo do limiar recebido, do pior para o melhor, com hipótese e contexto', () => {
    const saida = resumoDoAnalista.falso(entradaDoAnalista())
    expect(saida.alertas).toHaveLength(1)
    expect(saida.alertas[0]).toMatchObject({ serie: '2ª série do Ensino Médio', disciplina: 'Química', acertoPercentual: 49, habilidade: { codigo: 'EM13CNT104' } })
    expect(saida.alertas[0]?.hipotese).toContain('Uma hipótese é que')
    expect(saida.alertas[0]?.hipotese).toContain('abaixo do limiar de 60%')
    expect(saida.alertas[0]?.contexto).toContain('Agregado de 180 respostas, em 3 turmas')
    expect(saida.alertas[0]?.contexto).toContain('não permite concluir a causa')
    expect(saida.destaques.map((destaque) => destaque.acertoPercentual)).toEqual([82, 64])
    // Média ponderada pelas respostas: (49×180 + 64×90 + 82×240) ÷ 510 = 67.
    expect(saida.resumo).toContain('O acerto médio por habilidade foi de 67%')
    expect(saida.resumo).toContain('De 28/09/2026 a 02/10/2026')
  })

  it('o limiar é de quem chama: mudando o limiar, muda o que é alerta', () => {
    expect(resumoDoAnalista.falso({ ...entradaDoAnalista(), limiarDeAlertaPercentual: 40 }).alertas).toEqual([])
    expect(resumoDoAnalista.falso({ ...entradaDoAnalista(), limiarDeAlertaPercentual: 70 }).alertas.map((alerta) => alerta.acertoPercentual)).toEqual([49, 64])
  })

  it('recorte com um professor só é nominal e nem entra (D45)', () => {
    const entrada = entradaDoAnalista()
    const [primeiro, ...demais] = entrada.recortes
    expect(resumoDoAnalista.esquemaDeEntrada.safeParse({ ...entrada, recortes: [{ ...primeiro, professoresNoRecorte: 1 }, ...demais] }).success).toBe(false)
    expect(resumoDoAnalista.esquemaDeEntrada.safeParse({ ...entrada, recortes: [{ ...primeiro, professoresNoRecorte: 2 }, ...demais] }).success).toBe(true)
  })

  it('não há pessoa na entrada: professor, turma nomeada e aluno não têm campo', () => {
    const entrada = entradaDoAnalista()
    const [primeiro, ...demais] = entrada.recortes
    for (const extra of [{ professor: 'Camila Souza' }, { turma: '2ºB' }, { alunosEmRisco: ['Enzo Martins'] }]) {
      expect(resumoDoAnalista.esquemaDeEntrada.safeParse({ ...entrada, recortes: [{ ...primeiro, ...extra }, ...demais] }).success).toBe(false)
    }
  })

  it('a saída da versão determinística não cita pessoa: nem professor, nem aluno, nem nome de turma', () => {
    expect(JSON.stringify(resumoDoAnalista.falso(entradaDoAnalista())).toLowerCase()).not.toMatch(/professor|docente|\baluno\b|\baluna\b/)
  })

  it('a conferência recusa número inventado, alerta acima do limiar e qualquer fala sobre professor', () => {
    const entrada = entradaDoAnalista()
    const bom = resumoDoAnalista.falso(entrada)
    const [alerta] = bom.alertas
    const [destaque] = bom.destaques
    if (alerta === undefined || destaque === undefined) throw new Error('o resumo de teste deveria ter alerta e destaque')
    expect(resumoDoAnalista.conferir?.(entrada, bom)).toEqual([])
    expect(resumoDoAnalista.conferir?.(entrada, { ...bom, alertas: [{ ...alerta, acertoPercentual: 12 }] })).toHaveLength(1)
    expect(resumoDoAnalista.conferir?.(entrada, { ...bom, alertas: [{ ...alerta, serie: '3ª série do Ensino Médio' }] })).toHaveLength(1)
    expect(resumoDoAnalista.conferir?.(entrada, { ...bom, alertas: [{ ...destaque, hipotese: 'x', contexto: 'y' }] })).toHaveLength(1)
    expect(resumoDoAnalista.conferir?.(entrada, { ...bom, alertas: [{ ...alerta, hipotese: 'Os professores da série não retomaram o conteúdo.' }] })).toHaveLength(1)
    expect(resumoDoAnalista.conferir?.(entrada, { ...bom, resumo: 'A professora de Química precisa rever o planejamento.' })).toHaveLength(1)
  })

  it('o modelo que culpa o professor duas vezes não tem o resumo entregue à coordenação', async () => {
    const entrada = entradaDoAnalista()
    const culpando = JSON.stringify({ ...resumoDoAnalista.falso(entrada), resumo: 'O resultado indica falha do professor da 2ª série.' })
    const { ia, consumo } = provedorCom(new AdaptadorRoteirizado([culpando, culpando]))
    const erro: unknown = await ia.gerar({ tarefa: resumoDoAnalista, entrada, escolaId: ESCOLA_A }).catch((motivo: unknown) => motivo)
    expect(erro).toBeInstanceOf(ErroDeIa)
    expect((erro as ErroDeIa).codigoDeIa).toBe('IA_SAIDA_INVALIDA')
    expect(consumo.registros).toMatchObject([{ funcao: 'resumo_e_alerta', estado: 'falhou' }])
  })
})
