import { describe, expect, it } from 'vitest'
import { esquemaConsultaSinais, esquemaGrupoDeSinais, esquemaRespostaSinais, esquemaSinal, TIPOS_DE_SINAL } from './sinal.js'
import {
  esquemaConsultaConversaDoTutor,
  esquemaMensagemDoTutor,
  esquemaPedidoMensagemAoTutor,
  esquemaRespostaConversaDoTutor,
  esquemaRespostaMemoriaDoTutor,
  ESTADOS_DO_TUTOR,
  TROCAS_POR_DIA_PADRAO_DO_TUTOR,
  TROCAS_POR_MES_PADRAO_DO_TUTOR,
} from './tutor.js'

// Valores fixos e sintéticos: o pacote não tem os tipos do Node.
const UM_ID = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'
const OUTRO_ID = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c'
const CHAVE = '4f1c2d3e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const AGORA = '2026-10-04T13:00:00.000Z'
const aluno = { id: UM_ID, nome: 'Ana Beatriz' }

describe('sinal do Tutor: tipo fechado e referência ao trabalho (D34, D36, D57)', () => {
  const travou = { id: UM_ID, tipo: 'travou', aluno, atividadeAplicadaId: OUTRO_ID, questao: 3, materialId: null, pagina: null, criadoEm: AGORA }
  const atencao = { id: UM_ID, tipo: 'atencao_humana', aluno, criadoEm: AGORA }

  it('os sinais de trabalho carregam onde aconteceu, e o tipo é da lista fechada', () => {
    expect(TIPOS_DE_SINAL).toEqual(['travou', 'resposta_pronta', 'duvida_repetida', 'atencao_humana'])
    expect(esquemaSinal.parse(travou)).toEqual(travou)
    for (const tipo of ['resposta_pronta', 'duvida_repetida']) expect(esquemaSinal.safeParse({ ...travou, tipo }).success, tipo).toBe(true)
    for (const tipo of ['desatento', 'triste', 'fora_de_escopo', 'ocioso']) expect(esquemaSinal.safeParse({ ...travou, tipo }).success, tipo).toBe(false)
  })

  it('`atencao_humana` com qualquer conteúdo é recusado: nem a conversa, nem o assunto, nem onde foi', () => {
    expect(esquemaSinal.parse(atencao)).toEqual(atencao)
    for (const [caso, campo] of [
      ['o que o aluno escreveu', { conteudo: 'meus pais estão brigando muito' }],
      ['um trecho', { trecho: 'não aguento mais' }],
      ['o assunto', { assunto: 'família' }],
      ['um resumo', { resumo: 'aluno relatou problema em casa' }],
      ['a mensagem', { mensagemId: OUTRO_ID }],
      ['a execução', { execucaoId: OUTRO_ID }],
      ['a atividade', { atividadeAplicadaId: OUTRO_ID }],
      ['a questão', { questao: 3 }],
      ['a página', { materialId: OUTRO_ID, pagina: 12 }],
      ['a referência vazia dos outros sinais', { atividadeAplicadaId: null, questao: null, materialId: null, pagina: null }],
      ['um nível de risco', { risco: 'alto' }],
    ] as const) {
      expect(esquemaSinal.safeParse({ ...atencao, ...campo }).success, caso).toBe(false)
    }
  })

  it('nenhum sinal aceita texto sobre o aluno, e o agrupado nunca soma `atencao_humana`', () => {
    for (const campo of [{ detalhe: 'parecia ansiosa' }, { texto: 'pediu a resposta três vezes' }, { humor: 'irritado' }, { duvida: 'como acho o mol?' }]) {
      expect(esquemaSinal.safeParse({ ...travou, ...campo }).success, Object.keys(campo)[0]).toBe(false)
    }
    const grupo = { tipo: 'travou', atividadeAplicadaId: OUTRO_ID, questao: 3, alunos: 8 }
    expect(esquemaGrupoDeSinais.safeParse(grupo).success).toBe(true)
    expect(esquemaGrupoDeSinais.safeParse({ ...grupo, tipo: 'atencao_humana' }).success).toBe(false)
    expect(esquemaGrupoDeSinais.safeParse({ ...grupo, nomes: ['Ana'] }).success).toBe(false)
    expect(esquemaRespostaSinais.safeParse({ itens: [travou, atencao], grupos: [grupo] }).success).toBe(true)
  })

  it('a consulta exige a turma, e não aceita aluno nem escola', () => {
    expect(esquemaConsultaSinais.safeParse({ turmaId: UM_ID }).success).toBe(true)
    expect(esquemaConsultaSinais.safeParse({}).success).toBe(false)
    for (const campo of ['alunoId', 'escolaId']) expect(esquemaConsultaSinais.safeParse({ turmaId: UM_ID, [campo]: UM_ID }).success, campo).toBe(false)
  })
})

describe('conversa com o Tutor (D36, D38, D47)', () => {
  it('a mensagem leva o texto, a atividade ou o material e a chave; aluno, turma e escola vêm da sessão', () => {
    const corpo = { texto: 'Como acho o reagente limitante?', atividadeAplicadaId: UM_ID, chaveEnvio: CHAVE }
    expect(esquemaPedidoMensagemAoTutor.parse(corpo)).toEqual(corpo)
    expect(esquemaPedidoMensagemAoTutor.safeParse({ texto: 'Dúvida do capítulo 7', materialId: UM_ID, chaveEnvio: CHAVE }).success).toBe(true)
    for (const campo of ['alunoId', 'turmaId', 'escolaId']) expect(esquemaPedidoMensagemAoTutor.safeParse({ ...corpo, [campo]: UM_ID }).success, campo).toBe(false)
    expect(esquemaPedidoMensagemAoTutor.safeParse({ ...corpo, texto: '   ' }).success).toBe(false)
    expect(esquemaPedidoMensagemAoTutor.safeParse({ texto: 'sem chave' }).success).toBe(false)
  })

  it('o Tutor responde texto com página citada ou a mensagem fixa de assunto delicado; o aluno só escreve texto', () => {
    const citacao = { materialId: UM_ID, pagina: 151, trecho: 'O reagente limitante é o que acaba primeiro.' }
    expect(esquemaMensagemDoTutor.safeParse({ id: UM_ID, autor: 'tutor', tipo: 'texto', texto: 'O que a equação diz?', citacoes: [citacao], criadaEm: AGORA }).success).toBe(true)
    expect(esquemaMensagemDoTutor.safeParse({ id: UM_ID, autor: 'tutor', tipo: 'assunto_delicado', texto: 'Mensagem combinada com a sua escola.', criadaEm: AGORA }).success).toBe(true)
    expect(esquemaMensagemDoTutor.safeParse({ id: UM_ID, autor: 'aluno', tipo: 'texto', texto: 'Qual é a resposta?', criadaEm: AGORA }).success).toBe(true)
    expect(esquemaMensagemDoTutor.safeParse({ id: UM_ID, autor: 'aluno', tipo: 'assunto_delicado', texto: 'x', criadaEm: AGORA }).success).toBe(false)
    // O Tutor não devolve a resposta da questão nem dado de colega como campo.
    for (const campo of [{ gabarito: 0 }, { respostaCerta: 'H2' }, { colegas: ['Bruno'] }]) {
      expect(esquemaMensagemDoTutor.safeParse({ id: UM_ID, autor: 'tutor', tipo: 'texto', texto: 'Vamos por partes.', citacoes: [], criadaEm: AGORA, ...campo }).success, Object.keys(campo)[0]).toBe(false)
    }
  })

  it('a conversa diz o estado, o freio do dia e a avaliação que trava, e a consulta não aceita outro aluno', () => {
    expect(ESTADOS_DO_TUTOR).toEqual(['ligado', 'avaliacao', 'fora', 'limite'])
    const conversa = { estado: 'avaliacao', uso: { hoje: 12, limiteDoDia: TROCAS_POR_DIA_PADRAO_DO_TUTOR }, avaliacaoAberta: { titulo: 'Prova de estequiometria' }, mensagens: [] }
    expect(esquemaRespostaConversaDoTutor.safeParse(conversa).success).toBe(true)
    expect(esquemaRespostaConversaDoTutor.safeParse({ ...conversa, uso: { hoje: 12, limiteDoDia: 0 } }).success).toBe(false)
    expect(esquemaRespostaConversaDoTutor.safeParse({ ...conversa, usoDaTurma: 420 }).success).toBe(false)
    expect(esquemaConsultaConversaDoTutor.safeParse({ atividadeAplicadaId: UM_ID }).success).toBe(true)
    expect(esquemaConsultaConversaDoTutor.safeParse({ alunoId: OUTRO_ID }).success).toBe(false)
    // O padrão da D38, para a coluna nula da configuração da escola.
    expect([TROCAS_POR_DIA_PADRAO_DO_TUTOR, TROCAS_POR_MES_PADRAO_DO_TUTOR]).toEqual([60, 300])
  })
})

describe('memória do Tutor (D66): o trabalho do aluno, nunca a pessoa', () => {
  const habilidade = { codigo: 'QUI.EM.05', descricao: 'Identificar o reagente limitante e o reagente em excesso.' }
  const trabalho = { atividadeAplicadaId: UM_ID, titulo: 'Lista de estequiometria', enviadaEm: AGORA, resultado: { acertos: 5, total: 8, aReforcar: [habilidade] } }
  const sinal = { tipo: 'travou', atividadeAplicadaId: UM_ID, questao: 3, criadoEm: AGORA }

  it('lista trabalhos e sinais de trabalho; o resultado é nulo enquanto o lote não foi aprovado', () => {
    expect(esquemaRespostaMemoriaDoTutor.safeParse({ trabalhos: [trabalho, { ...trabalho, resultado: null }], sinais: [sinal] }).success).toBe(true)
    // `atencao_humana` não é memória de trabalho, e não aparece para o aluno como coisa que o Tutor "sabe" dele.
    expect(esquemaRespostaMemoriaDoTutor.safeParse({ trabalhos: [], sinais: [{ ...sinal, tipo: 'atencao_humana' }] }).success).toBe(false)
  })

  it('não tem onde escrever o jeito, o humor, a atenção ou o comportamento do aluno', () => {
    for (const campo of [{ perfil: 'aluno ansioso, desiste rápido' }, { observacoes: ['pouco atento'] }, { humor: 'frustrado' }, { resumoDoAluno: 'tem dificuldade de concentração' }, { adaptacao: 'fonte ampliada' }]) {
      expect(esquemaRespostaMemoriaDoTutor.safeParse({ trabalhos: [trabalho], sinais: [sinal], ...campo }).success, Object.keys(campo)[0]).toBe(false)
    }
    expect(esquemaRespostaMemoriaDoTutor.safeParse({ trabalhos: [{ ...trabalho, comoTerminou: 'saiu irritado' }], sinais: [] }).success).toBe(false)
    expect(esquemaRespostaMemoriaDoTutor.safeParse({ trabalhos: [], sinais: [{ ...sinal, detalhe: 'chorou' }] }).success).toBe(false)
  })
})
