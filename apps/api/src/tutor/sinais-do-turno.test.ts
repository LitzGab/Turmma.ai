import { describe, expect, it } from 'vitest'
import { sinaisDeTrabalhoDoTurno, TROCAS_SEGUIDAS_PARA_TRAVOU, type TurnoDoAluno } from './sinais-do-turno.js'

const ATIVIDADE = '0198c1de-0000-7000-8000-000000000001'
const MATERIAL = '0198c1de-0000-7000-8000-000000000002'
const HOJE = '2026-10-05'
const ONTEM = '2026-10-04'

const naQuestao = (questao: number, dia = HOJE): TurnoDoAluno => ({ atividadeAplicadaId: ATIVIDADE, questao, materialId: null, pagina: null, dia })
const naPagina = (pagina: number, dia = HOJE): TurnoDoAluno => ({ atividadeAplicadaId: null, questao: null, materialId: MATERIAL, pagina, dia })
const semReferencia = (dia = HOJE): TurnoDoAluno => ({ atividadeAplicadaId: null, questao: null, materialId: null, pagina: null, dia })
const vezes = (quantas: number, turno: TurnoDoAluno): TurnoDoAluno[] => Array.from({ length: quantas }, () => turno)
const tipos = (atual: TurnoDoAluno, anteriores: TurnoDoAluno[]): string[] => sinaisDeTrabalhoDoTurno(atual, anteriores).map((sinal) => sinal.tipo)

describe('sinais de trabalho do turno', () => {
  it('o limiar de travou é quatro trocas seguidas na mesma referência', () => {
    expect(TROCAS_SEGUIDAS_PARA_TRAVOU).toBe(4)
  })

  it('travou nasce na troca que completa o limiar, e não antes nem a cada troca depois', () => {
    for (let anteriores = 0; anteriores < 8; anteriores += 1) {
      const esperado = anteriores + 1 === TROCAS_SEGUIDAS_PARA_TRAVOU ? ['travou'] : []
      expect(tipos(naQuestao(3), vezes(anteriores, naQuestao(3))), `${String(anteriores + 1)}ª troca`).toEqual(esperado)
    }
  })

  it('travou carrega a questão em que o aluno ficou, e nada da página que veio junto', () => {
    const comPagina: TurnoDoAluno = { ...naQuestao(3), materialId: MATERIAL, pagina: 5 }
    expect(sinaisDeTrabalhoDoTurno(comPagina, vezes(3, comPagina))).toEqual([{ tipo: 'travou', atividadeAplicadaId: ATIVIDADE, questao: 3, materialId: null, pagina: null }])
    expect(sinaisDeTrabalhoDoTurno(naPagina(5), vezes(3, naPagina(5)))).toEqual([{ tipo: 'travou', atividadeAplicadaId: null, questao: null, materialId: MATERIAL, pagina: 5 }])
  })

  it('quem sai da questão antes do limiar recomeça a conta: três trocas, outra questão e mais três não é travou', () => {
    const ateAqui = [...vezes(3, naQuestao(3)), naQuestao(4), ...vezes(2, naQuestao(3))]
    expect(tipos(naQuestao(3), ateAqui)).toEqual([])
    // Mais uma, a quarta seguida desde a volta: aí sim.
    expect(tipos(naQuestao(3), [...ateAqui, naQuestao(3)])).toEqual(['travou'])
  })

  it('o dia que vira fecha a sessão: três trocas ontem e uma hoje na mesma questão é dúvida repetida, não travou', () => {
    expect(tipos(naQuestao(3), vezes(3, naQuestao(3, ONTEM)))).toEqual(['duvida_repetida'])
  })

  it('dúvida repetida nasce quando o aluno volta a uma questão ou página em que já tinha pedido ajuda, uma vez por volta', () => {
    expect(tipos(naQuestao(3), [naQuestao(3), naQuestao(4)])).toEqual(['duvida_repetida'])
    expect(tipos(naPagina(5), [naPagina(5), naPagina(6)])).toEqual(['duvida_repetida'])
    // A troca seguinte, ainda na mesma volta, não avisa de novo.
    expect(tipos(naQuestao(3), [naQuestao(3), naQuestao(4), naQuestao(3)])).toEqual([])
    // A primeira vez numa questão não é repetição, por mais que ele já tenha usado o Tutor em outras.
    expect(tipos(naQuestao(5), [naQuestao(3), naQuestao(4)])).toEqual([])
  })

  it('a mesma questão em outra atividade e a mesma página em outro material são outra referência', () => {
    const outraAtividade: TurnoDoAluno = { ...naQuestao(3), atividadeAplicadaId: '0198c1de-0000-7000-8000-000000000009' }
    expect(tipos(naQuestao(3), [outraAtividade, naQuestao(4)])).toEqual([])
    expect(tipos(naQuestao(3), vezes(3, outraAtividade))).toEqual([])
  })

  it('turno sem questão e sem página não gera sinal, e não conta como a mesma dúvida', () => {
    expect(tipos(semReferencia(), vezes(6, semReferencia()))).toEqual([])
    const soAtividade: TurnoDoAluno = { ...naQuestao(3), questao: null }
    expect(tipos(soAtividade, vezes(6, soAtividade))).toEqual([])
    const soMaterial: TurnoDoAluno = { ...naPagina(5), pagina: null }
    expect(tipos(soMaterial, vezes(6, soMaterial))).toEqual([])
  })

  it('a regra não tem onde ler texto, tempo nem navegação: o turno é só a referência e o dia', () => {
    const turno = naQuestao(3)
    expect(Object.keys(turno).sort()).toEqual(['atividadeAplicadaId', 'dia', 'materialId', 'pagina', 'questao'])
    for (const sinal of sinaisDeTrabalhoDoTurno(turno, vezes(3, turno))) expect(Object.keys(sinal).sort()).toEqual(['atividadeAplicadaId', 'materialId', 'pagina', 'questao', 'tipo'])
  })
})
