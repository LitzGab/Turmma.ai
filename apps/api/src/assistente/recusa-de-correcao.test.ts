import { AdaptadorFalso, ConsumoEmMemoria, executarNoContexto, OrcamentoEmMemoria, ProvedorDeIa, SuspensoesEmMemoria } from '@educa/nucleo'
import { describe, expect, it } from 'vitest'
import { pedeCorrecaoDeTextoDeAluno, proporFerramentaDoAssistente, RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO } from './recusa-de-correcao.js'

const ESCOLA = '0190f5a0-0000-7000-8000-00000000000a'
const REDACAO = 'A tecnologia mudou a sociedade porque as pessoas ficam mais conectadas e por isso eu acho que é bom.'

describe('pedeCorrecaoDeTextoDeAluno (D55)', () => {
  it.each([
    `Corrige esta redação do aluno: ${REDACAO}`,
    'Que nota você daria para essa redação?',
    'Avalie a resposta discursiva da questão 3 e sugira um conceito',
    'faz uma devolutiva do texto do aluno pra mim',
    'Pode fazer uma pré-correção das redações da turma?',
    'REVISA A PRODUÇÃO TEXTUAL DELES',
    'me dá um feedback sobre a resposta dissertativa',
    'comenta o texto da minha aluna',
  ])('recusa: %s', (mensagem) => {
    expect(pedeCorrecaoDeTextoDeAluno(mensagem)).toBe(true)
  })

  it.each([
    'monta uma atividade de estequiometria',
    'quero um plano de aula sobre redação dissertativa',
    'monta uma atividade com 5 questões sobre reagente limitante',
    'o que é mol?',
    'corrige a prova objetiva',
  ])('não recusa: %s', (mensagem) => {
    expect(pedeCorrecaoDeTextoDeAluno(mensagem)).toBe(false)
  })
})

describe('proporFerramentaDoAssistente: a recusa é regra fixa, antes do modelo', () => {
  const entrada = (mensagem: string) => ({ mensagem, contexto: { serie: '2º ano do Ensino Médio', disciplina: 'Língua Portuguesa' }, trechos: [], turnosAnteriores: [] })

  it('continua sendo a tarefa propor_ferramenta da função de conversa, com a mesma versão determinística', () => {
    expect(proporFerramentaDoAssistente).toMatchObject({ nome: 'propor_ferramenta', funcao: 'conversa_e_ferramentas', levaTextoLivreDePessoa: true })
    expect(proporFerramentaDoAssistente.semModelo?.(entrada('monta uma atividade de estequiometria'))).toBeUndefined()
    expect(proporFerramentaDoAssistente.falso(entrada('monta uma atividade sobre mol'))).toMatchObject({ tipo: 'proposta_de_ferramenta', proposta: { ferramenta: 'atividade_objetiva' } })
    // Em "só conversar", a regra olha também para o último pedido, que é o que a resposta vai atender.
    const soConversar = (pedido: string) => ({ ...entrada('Só conversar'), semProposta: true, turnosAnteriores: [{ autor: 'professor' as const, texto: pedido }] })
    expect(proporFerramentaDoAssistente.semModelo?.(soConversar('corrige esta redação do aluno'))).toMatchObject({ tipo: 'texto', texto: RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO })
    expect(proporFerramentaDoAssistente.semModelo?.(soConversar('monta uma atividade sobre mol'))).toBeUndefined()
    expect(proporFerramentaDoAssistente.semModelo?.({ ...soConversar('corrige esta redação do aluno'), semProposta: false })).toBeUndefined()
  })

  it('o pedido de corrigir redação sai com a recusa fixa, sem chamar o adaptador, sem nota, e sem repetir o texto do aluno nem no consumo', async () => {
    const registro = new ConsumoEmMemoria()
    const adaptador = new AdaptadorFalso()
    let chamadas = 0
    const chamar = adaptador.chamar.bind(adaptador)
    adaptador.chamar = (chamada) => {
      chamadas += 1
      return chamar(chamada)
    }
    const ia = new ProvedorDeIa({ adaptador, registro, orcamento: new OrcamentoEmMemoria(registro), suspensao: new SuspensoesEmMemoria(), timeoutMs: 1_000 })
    const { saida, medicao } = await executarNoContexto({ requisicaoId: 'r', escolaId: ESCOLA }, () =>
      ia.gerar({ tarefa: proporFerramentaDoAssistente, escolaId: ESCOLA, entrada: entrada(`Corrige e dá uma nota para esta redação do aluno: ${REDACAO}`) }),
    )
    expect(saida).toEqual({ tipo: 'texto', texto: RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO, citacoes: [] })
    expect(chamadas).toBe(0)
    expect(medicao.origem).toBe('regra_fixa')
    expect(JSON.stringify(saida)).not.toMatch(/tecnologia|conectadas|\d/u)
    expect(JSON.stringify(registro.registros)).not.toMatch(/tecnologia|conectadas|redação/u)
  })
})
