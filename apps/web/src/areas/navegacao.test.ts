import { describe, expect, it } from 'vitest'
import { estaNoItem, NAVEGACAO, SEU_TIME } from './navegacao'

describe('navegação por papel', () => {
  it('W2: "Estrutura" e "Professores" da coordenação, "Minha turma" do aluno e, na A2, "Nova conversa", "Ferramentas" e "Turmas" do professor têm tela', () => {
    expect(NAVEGACAO.professor.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([
      { rotulo: 'Nova conversa', caminho: '/professor/nova-conversa' },
      { rotulo: 'Ferramentas', caminho: '/professor/ferramentas' },
      { rotulo: 'Turmas', caminho: '/professor/turmas' },
    ])
    // A3 e A4: o aluno tem Tutor, Atividades e Minha turma, nesta ordem, e mais nada.
    expect(NAVEGACAO.aluno.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([
      { rotulo: 'Tutor', caminho: '/aluno/tutor' },
      { rotulo: 'Atividades', caminho: '/aluno/atividades' },
      { rotulo: 'Minha turma', caminho: '/aluno/minha-turma' },
    ])
    expect(NAVEGACAO.coordenador.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([
      { rotulo: 'Estrutura', caminho: '/coordenacao/estrutura' },
      { rotulo: 'Professores', caminho: '/coordenacao/professores' },
      { rotulo: 'Material', caminho: '/coordenacao/material' },
    ])
  })

  it('D73: cada item só aparece com a fase dele — na A2 o professor não tem Calendário nem Histórico, e "Seu time" tem só o Assistente de ensino', () => {
    const rotulos = NAVEGACAO.professor.map((item) => item.rotulo)
    expect(rotulos).not.toContain('Calendário')
    expect(rotulos).not.toContain('Histórico')
    // A linha do Tutor chega com os sinais (A4): antes disso ela levaria a uma tela que não existe.
    expect(SEU_TIME.professor.map(({ agente, rotulo, caminho }) => ({ agente, rotulo, caminho }))).toEqual([
      { agente: 'assistente_de_ensino', rotulo: 'Assistente de ensino', caminho: '/professor/time/assistente' },
    ])
    expect(SEU_TIME.coordenador).toEqual([])
    expect(SEU_TIME.aluno).toEqual([])
  })

  it('o aluno não tem item que leva a tela inexistente nesta fatia, e a atividade e a conversa abertas ficam dentro do item delas', () => {
    const rotulos = NAVEGACAO.aluno.map((item) => item.rotulo)
    for (const fora of ['Meu desempenho', 'Privacidade', 'Avisar um adulto', 'Ranking', 'Colegas']) expect(rotulos).not.toContain(fora)
    const [tutor, atividades, minhaTurma] = NAVEGACAO.aluno
    if (tutor === undefined || atividades === undefined || minhaTurma === undefined) throw new Error('faltou item na navegação do aluno')
    expect(estaNoItem('/aluno/atividades/0190f5a0-0000-7000-8000-000000000001', atividades)).toBe(true)
    expect(estaNoItem('/aluno/tutor/0190f5a0-0000-7000-8000-000000000001', tutor)).toBe(true)
    // Pedir ajuda numa atividade é estar no Tutor, e não em Atividades.
    expect(estaNoItem('/aluno/tutor/0190f5a0-0000-7000-8000-000000000001', atividades)).toBe(false)
    expect(estaNoItem('/aluno/atividades', minhaTurma)).toBe(false)
  })

  it('a conversa aberta fica dentro de "Nova conversa", e o artefato aberto, dentro de "Ferramentas"', () => {
    const [novaConversa, ferramentas, turmas] = NAVEGACAO.professor
    if (novaConversa === undefined || ferramentas === undefined || turmas === undefined) throw new Error('faltou item na navegação do professor')
    expect(estaNoItem('/professor/conversa', novaConversa)).toBe(true)
    expect(estaNoItem('/professor/conversa', ferramentas)).toBe(false)
    expect(estaNoItem('/professor/artefatos/0190f5a0-0000-7000-8000-000000000001', ferramentas)).toBe(true)
    expect(estaNoItem('/professor/ferramentas/adaptacao', ferramentas)).toBe(true)
    expect(estaNoItem('/professor/artefatos/0190f5a0-0000-7000-8000-000000000001', novaConversa)).toBe(false)
    // O Seu time não é de nenhum item: quem diz onde a pessoa está é a linha do agente.
    for (const item of NAVEGACAO.professor) expect(estaNoItem('/professor/time/assistente', item)).toBe(false)
    expect(estaNoItem('/professor/conversas', novaConversa)).toBe(false)
  })

  it('o item fica selecionado no endereço dele e abaixo dele, e só neles', () => {
    const turmas = { caminho: '/professor/turmas' }
    expect(estaNoItem('/professor/turmas', turmas)).toBe(true)
    expect(estaNoItem('/professor/turmas/0190f5a0-0000-7000-8000-000000000001', turmas)).toBe(true)
    // Um endereço que só começa com as mesmas letras é outra tela.
    expect(estaNoItem('/professor/turmas-antigas', turmas)).toBe(false)
    expect(estaNoItem('/professor', turmas)).toBe(false)
    expect(estaNoItem('/', turmas)).toBe(false)
  })
})
