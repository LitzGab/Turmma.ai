import { describe, expect, it } from 'vitest'
import { estaNoItem, MENU_DA_PESSOA, NAVEGACAO, RODAPE_DA_LATERAL, SEU_TIME } from './navegacao'

describe('navegação por papel', () => {
  it('W2: "Estrutura" e "Professores" da coordenação, "Minha turma" do aluno e, na A2, "Início" (era "Nova conversa"), "Ferramentas" e "Turmas" do professor têm tela', () => {
    expect(NAVEGACAO.professor.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([
      { rotulo: 'Início', caminho: '/professor/nova-conversa' },
      { rotulo: 'Ferramentas', caminho: '/professor/ferramentas' },
      { rotulo: 'Turmas', caminho: '/professor/turmas' },
    ])
    // A3 e A4: o aluno tem Tutor, Atividades e Minha turma, nesta ordem, e mais nada.
    expect(NAVEGACAO.aluno.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([
      { rotulo: 'Tutor', caminho: '/aluno/tutor' },
      { rotulo: 'Atividades', caminho: '/aluno/atividades' },
      { rotulo: 'Minha turma', caminho: '/aluno/minha-turma' },
    ])
    // A5: a coordenação abre em Governança, e Agentes e Analista vêm com ela. F3 (6.0): Privacidade fecha a lista.
    expect(NAVEGACAO.coordenador.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([
      { rotulo: 'Governança', caminho: '/coordenacao/governanca' },
      { rotulo: 'Agentes', caminho: '/coordenacao/agentes' },
      { rotulo: 'Analista', caminho: '/coordenacao/analista' },
      { rotulo: 'Estrutura', caminho: '/coordenacao/estrutura' },
      { rotulo: 'Professores', caminho: '/coordenacao/professores' },
      { rotulo: 'Material', caminho: '/coordenacao/material' },
      { rotulo: 'Privacidade', caminho: '/coordenacao/privacidade' },
    ])
  })

  it('U, F3 (6.0): "Privacidade" é da coordenação, e o professor e o aluno não a têm na lista de seções', () => {
    expect(NAVEGACAO.coordenador.map((item) => item.rotulo)).toContain('Privacidade')
    expect(NAVEGACAO.professor.map((item) => item.rotulo)).not.toContain('Privacidade')
    // O do aluno é do rodapé fixo (F3, 18.0), e não da lista: "Seções" continua sendo só Tutor, Atividades e Minha turma.
    expect(NAVEGACAO.aluno.map((item) => item.rotulo)).not.toContain('Privacidade')
  })

  it('F3 (18.0): o aluno tem "Privacidade" no rodapé fixo, o professor tem "Meus dados" no menu da pessoa, e a coordenação não tem nenhum dos dois', () => {
    expect(RODAPE_DA_LATERAL.aluno.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([{ rotulo: 'Privacidade', caminho: '/aluno/privacidade' }])
    expect(MENU_DA_PESSOA.professor.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([{ rotulo: 'Meus dados', caminho: '/professor/meus-dados' }])
    // Cada papel só tem o seu: o aluno não tem menu da pessoa com links, o professor não tem rodapé, e a coordenação não é titular de pedido.
    expect(MENU_DA_PESSOA.aluno).toEqual([])
    expect(RODAPE_DA_LATERAL.professor).toEqual([])
    expect(RODAPE_DA_LATERAL.coordenador).toEqual([])
    expect(MENU_DA_PESSOA.coordenador).toEqual([])
    // Nenhum item do pé da lateral repete um da lista de seções do mesmo papel: seriam duas linhas para a mesma tela.
    for (const papel of ['aluno', 'professor', 'coordenador'] as const) {
      const secoes = new Set(NAVEGACAO[papel].map((item) => item.caminho))
      for (const item of [...RODAPE_DA_LATERAL[papel], ...MENU_DA_PESSOA[papel]]) expect(secoes.has(item.caminho)).toBe(false)
    }
  })

  it('F3 (18.0): "Privacidade" e "Meus dados" ficam selecionados no endereço deles, e nenhuma seção fica selecionada ali', () => {
    const [privacidade] = RODAPE_DA_LATERAL.aluno
    const [meusDados] = MENU_DA_PESSOA.professor
    if (privacidade === undefined || meusDados === undefined) throw new Error('faltou item no pé da lateral')
    expect(estaNoItem('/aluno/privacidade', privacidade)).toBe(true)
    expect(estaNoItem('/professor/meus-dados', meusDados)).toBe(true)
    for (const item of NAVEGACAO.aluno) expect(estaNoItem('/aluno/privacidade', item)).toBe(false)
    for (const item of NAVEGACAO.professor) expect(estaNoItem('/professor/meus-dados', item)).toBe(false)
    // Um endereço que só começa com as mesmas letras é outra tela.
    expect(estaNoItem('/aluno/privacidade-antiga', privacidade)).toBe(false)
    expect(estaNoItem('/aluno/atividades', privacidade)).toBe(false)
  })

  it('F3 (6.0): a Privacidade fica selecionada nos endereços das abas dela, e não no de Governança', () => {
    const privacidade = NAVEGACAO.coordenador.find((item) => item.rotulo === 'Privacidade')
    const governanca = NAVEGACAO.coordenador.find((item) => item.rotulo === 'Governança')
    if (privacidade === undefined || governanca === undefined) throw new Error('faltou item na navegação da coordenação')
    expect(estaNoItem('/coordenacao/privacidade/retencao', privacidade)).toBe(true)
    expect(estaNoItem('/coordenacao/privacidade', privacidade)).toBe(true)
    expect(estaNoItem('/coordenacao/privacidade/retencao', governanca)).toBe(false)
  })

  it('D73: cada item só aparece com a fase dele — o professor não tem Calendário nem Histórico, e "Seu time" tem o Assistente de ensino e, desde a A4, o Tutor', () => {
    const rotulos = NAVEGACAO.professor.map((item) => item.rotulo)
    expect(rotulos).not.toContain('Calendário')
    expect(rotulos).not.toContain('Histórico')
    // Só o Assistente deixa entrega esperando decisão: a linha do Tutor não leva contador (D59).
    expect(SEU_TIME.professor.map(({ agente, rotulo, caminho, comEspera }) => ({ agente, rotulo, caminho, comEspera }))).toEqual([
      { agente: 'assistente_de_ensino', rotulo: 'Assistente de ensino', caminho: '/professor/time/assistente', comEspera: true },
      { agente: 'tutor', rotulo: 'Tutor', caminho: '/professor/time/tutor', comEspera: false },
    ])
    // O Analista é da coordenação, e não aparece para o professor.
    expect(SEU_TIME.professor.map((item) => item.agente)).not.toContain('analista_de_desempenho_escolar')
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

  it('a conversa aberta fica dentro de "Início", e o artefato aberto, dentro de "Ferramentas"', () => {
    const [inicio, ferramentas, turmas] = NAVEGACAO.professor
    if (inicio === undefined || ferramentas === undefined || turmas === undefined) throw new Error('faltou item na navegação do professor')
    expect(estaNoItem('/professor/conversa', inicio)).toBe(true)
    expect(estaNoItem('/professor/conversa', ferramentas)).toBe(false)
    expect(estaNoItem('/professor/artefatos/0190f5a0-0000-7000-8000-000000000001', ferramentas)).toBe(true)
    expect(estaNoItem('/professor/ferramentas/adaptacao', ferramentas)).toBe(true)
    expect(estaNoItem('/professor/artefatos/0190f5a0-0000-7000-8000-000000000001', inicio)).toBe(false)
    // O Seu time não é de nenhum item: quem diz onde a pessoa está é a linha do agente.
    for (const item of NAVEGACAO.professor) expect(estaNoItem('/professor/time/assistente', item)).toBe(false)
    expect(estaNoItem('/professor/conversas', inicio)).toBe(false)
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
