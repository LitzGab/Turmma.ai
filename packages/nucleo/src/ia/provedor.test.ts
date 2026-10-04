import { describe, expect, it, vi } from 'vitest'
import { AdaptadorRoteirizado } from './__fixtures__/adaptador-roteirizado.js'
import { ALUNO_1, ALUNO_2, atividadeDeEstequiometria, entradaDeAtividade, entradaDoTutor, ESCOLA_A, ESCOLA_B } from './__fixtures__/entradas.js'
import type { AdaptadorDeModelo } from './adaptador.js'
import { AdaptadorFalso, MODELO_FALSO } from './adaptador-falso.js'
import { ConsumoEmMemoria, OrcamentoEmMemoria, type OrcamentoDeIa, type RegistroDeConsumo } from './consumo.js'
import { ErroDeIa } from './erros.js'
import { criarProvedorDeIa, MODELO_DA_REGRA_FIXA, ProvedorDeIa, type RegistradorDeIa } from './provedor.js'
import { gerarAtividadeObjetiva } from './tarefas/gerar-atividade-objetiva.js'
import { turnoDoTutor } from './tarefas/turno-do-tutor.js'

const EXECUCAO = '1d2e3f4a-5b6c-4d7e-8f90-a1b2c3d4e5f6'
const SEMPRE = { consultar: async () => ({ permitido: true as const }) } satisfies OrcamentoDeIa

function registrador(): RegistradorDeIa & { linhas: () => unknown[] } {
  const info = vi.fn()
  const warn = vi.fn()
  return { info, warn, linhas: () => [...info.mock.calls, ...warn.mock.calls].flat() }
}

function montar(opcoes: { adaptador?: AdaptadorDeModelo; orcamento?: OrcamentoDeIa; registro?: RegistroDeConsumo; logger?: RegistradorDeIa; agora?: () => Date } = {}) {
  const consumo = new ConsumoEmMemoria()
  const relogio = { agora: opcoes.agora ?? (() => new Date('2026-10-05T13:00:00Z')) }
  const ia = new ProvedorDeIa({
    adaptador: opcoes.adaptador ?? new AdaptadorFalso(),
    registro: opcoes.registro ?? consumo,
    orcamento: opcoes.orcamento ?? SEMPRE,
    timeoutMs: 5_000,
    relogio,
    ...(opcoes.logger === undefined ? {} : { logger: opcoes.logger }),
  })
  return { ia, consumo, relogio }
}

async function erroDe(promessa: Promise<unknown>): Promise<ErroDeIa> {
  const erro: unknown = await promessa.then(
    () => undefined,
    (motivo: unknown) => motivo,
  )
  if (!(erro instanceof ErroDeIa)) throw new Error('a chamada deveria ter falhado com ErroDeIa')
  return erro
}

describe('ProvedorDeIa: saída validada e medição', () => {
  it('devolve a saída da tarefa já validada, e a medição diz o perfil, o modelo, os tokens, a duração e que não houve envio externo', async () => {
    const { ia } = montar()
    const { saida, medicao } = await ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A })
    expect(saida).toEqual(atividadeDeEstequiometria())
    expect(medicao).toMatchObject({ origem: 'falso', perfil: 'padrao', modelo: MODELO_FALSO, promptVersao: gerarAtividadeObjetiva.prompt.versao, envioExterno: false, tentativas: 1 })
    expect(medicao.tokensDeEntrada).toBeGreaterThan(0)
    expect(medicao.tokensDeSaida).toBeGreaterThan(0)
    expect(medicao.duracaoMs).toBeGreaterThanOrEqual(0)
  })

  it('com adaptador que manda para fora, a medição e o registro dizem que houve envio externo', async () => {
    const { ia, consumo } = montar({ adaptador: new AdaptadorRoteirizado([JSON.stringify(atividadeDeEstequiometria())], true) })
    const { medicao } = await ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A })
    expect(medicao.envioExterno).toBe(true)
    expect(consumo.registros[0]?.envioExterno).toBe(true)
  })

  it('criarProvedorDeIa: sem nada configurado, a porta é a do adaptador falso', async () => {
    const consumo = new ConsumoEmMemoria()
    const ia = criarProvedorDeIa({ adaptador: 'falso', timeoutMs: 5_000, executor: { vagasPorEscola: 2, vagasNoTotal: 8, timeoutMs: 10_000 } }, { registro: consumo, orcamento: SEMPRE })
    const { medicao } = await ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A })
    expect(medicao.origem).toBe('falso')
  })
})

describe('ProvedorDeIa: toda execução registra (regra 30, item 4)', () => {
  it('grava entrada, saída, tarefa, função, perfil, modelo, versão do prompt, tokens, duração, envio externo e a execução', async () => {
    const { ia, consumo } = montar()
    const entrada = entradaDeAtividade()
    const { saida, medicao } = await ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada, escolaId: ESCOLA_A, execucaoId: EXECUCAO })
    expect(consumo.registros).toEqual([
      {
        escolaId: ESCOLA_A,
        execucaoId: EXECUCAO,
        tarefa: 'gerar_atividade_objetiva',
        funcao: 'conversa_e_ferramentas',
        ...medicao,
        entrada,
        saida,
        estado: 'concluida',
        em: new Date('2026-10-05T13:00:00Z'),
      },
    ])
  })

  it('a falha também fica registrada, com o código, sem saída', async () => {
    const { ia, consumo } = montar({ adaptador: new AdaptadorRoteirizado(['não é json', '{"tipo":"outra coisa"}']) })
    await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A }))
    expect(consumo.registros).toMatchObject([{ estado: 'falhou', codigoDeErro: 'IA_SAIDA_INVALIDA', tentativas: 2, tokensDeEntrada: 200, tokensDeSaida: 40 }])
    expect(consumo.registros[0]).not.toHaveProperty('saida')
  })

  it('se o registro falhar, a saída não é devolvida: nada que não foi registrado chega ao domínio', async () => {
    const registro = { registrar: async () => Promise.reject(new Error('banco fora')) }
    const { ia } = montar({ registro })
    expect((await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A }))).codigoDeIa).toBe('IA_INDISPONIVEL')
  })
})

describe('ProvedorDeIa: o log leva id, nunca conteúdo (regra 20, item 9)', () => {
  it('a linha de sucesso tem evento, tarefa, ids, duração e tentativas, e mais nada', async () => {
    const logger = registrador()
    const { ia } = montar({ logger })
    await ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A, execucaoId: EXECUCAO })
    expect(logger.linhas()).toEqual([{ evento: 'ia.geracao.concluida', tipo: 'gerar_atividade_objetiva', escolaId: ESCOLA_A, execucaoId: EXECUCAO, duracaoMs: expect.any(Number) as number, tentativas: 1 }])
  })

  it('o que o aluno escreveu e o que o Tutor respondeu não aparecem em nenhuma linha, nem no sucesso nem na falha', async () => {
    const logger = registrador()
    const duvida = 'como eu acho o reagente limitante? palavra-marcada-do-aluno'
    const { ia } = montar({ logger })
    const { saida } = await ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor(duvida), escolaId: ESCOLA_A, alunoId: ALUNO_1 })
    const falhando = montar({ logger, adaptador: new AdaptadorRoteirizado(['palavra-marcada-do-modelo', 'palavra-marcada-do-modelo']) })
    await erroDe(falhando.ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor(duvida), escolaId: ESCOLA_A, alunoId: ALUNO_1 }))
    const linhas = JSON.stringify(logger.linhas())
    expect(logger.linhas()).toHaveLength(2)
    expect(linhas).not.toContain('palavra-marcada')
    expect(linhas).not.toContain(saida.resposta.slice(0, 20))
    expect(linhas).toContain('"codigo":"IA_SAIDA_INVALIDA"')
  })
})

describe('ProvedorDeIa: o domínio nunca vê erro cru', () => {
  it('erro qualquer do adaptador vira ErroDeIa indisponível, sem a mensagem original', async () => {
    const logger = registrador()
    const { ia, consumo } = montar({ logger, adaptador: new AdaptadorRoteirizado([new Error('HTTP 400: prompt era "texto do aluno Enzo"')]) })
    const erro = await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A }))
    expect(erro.codigoDeIa).toBe('IA_INDISPONIVEL')
    expect(erro.codigo).toBe('INDISPONIVEL_TENTE_DE_NOVO')
    expect(`${erro.message} ${JSON.stringify(erro)} ${JSON.stringify(logger.linhas())}`).not.toContain('Enzo')
    expect(consumo.registros).toMatchObject([{ estado: 'falhou', codigoDeErro: 'IA_INDISPONIVEL' }])
  })

  it('cada código de IA responde com um código do contrato da API e o status dele', () => {
    expect(new ErroDeIa('IA_INDISPONIVEL')).toMatchObject({ codigo: 'INDISPONIVEL_TENTE_DE_NOVO', status: 503 })
    expect(new ErroDeIa('IA_TEMPO_ESGOTADO')).toMatchObject({ codigo: 'TEMPO_ESGOTADO', status: 503 })
    expect(new ErroDeIa('IA_SAIDA_INVALIDA')).toMatchObject({ codigo: 'INDISPONIVEL_TENTE_DE_NOVO', status: 503 })
    expect(new ErroDeIa('IA_ORCAMENTO_ESGOTADO', 30)).toMatchObject({ codigo: 'LIMITE_EXCEDIDO', status: 429, tenteDeNovoEmSegundos: 30 })
    expect(new ErroDeIa('IA_ENTRADA_INVALIDA')).toMatchObject({ codigo: 'ENTRADA_INVALIDA', status: 400 })
  })
})

describe('ProvedorDeIa: entrada inválida para antes de qualquer gasto', () => {
  it('entrada com nome de aluno é recusada, o modelo não é chamado e o orçamento não é consultado', async () => {
    const adaptador = new AdaptadorRoteirizado([])
    const consultar = vi.fn(async () => ({ permitido: true as const }))
    const { ia, consumo } = montar({ adaptador, orcamento: { consultar } })
    const comNome = { ...entradaDeAtividade(), nomeDoAluno: 'Enzo Martins' }
    expect((await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: comNome, escolaId: ESCOLA_A }))).codigoDeIa).toBe('IA_ENTRADA_INVALIDA')
    expect(adaptador.chamadas).toBe(0)
    expect(consultar).not.toHaveBeenCalled()
    expect(consumo.registros).toEqual([])
  })
})

describe('ProvedorDeIa: orçamento consultado antes de gastar (D14, D38)', () => {
  it('toda chamada consulta o orçamento com a escola e a função; no Tutor, também com o aluno', async () => {
    const consultar = vi.fn(async () => ({ permitido: true as const }))
    const { ia } = montar({ orcamento: { consultar } })
    await ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A })
    await ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('não entendi'), escolaId: ESCOLA_A, alunoId: ALUNO_1 })
    expect(consultar.mock.calls).toEqual([[{ escolaId: ESCOLA_A, funcao: 'conversa_e_ferramentas' }], [{ escolaId: ESCOLA_A, funcao: 'tutor_com_o_aluno', alunoId: ALUNO_1 }]])
  })

  it('orçamento esgotado: erro tipado com a espera sugerida, e o modelo não é chamado', async () => {
    const adaptador = new AdaptadorRoteirizado([])
    const { ia } = montar({ adaptador, orcamento: { consultar: async () => ({ permitido: false, tenteDeNovoEmSegundos: 3600 }) } })
    const erro = await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A }))
    expect(erro).toMatchObject({ codigoDeIa: 'IA_ORCAMENTO_ESGOTADO', status: 429, tenteDeNovoEmSegundos: 3600 })
    expect(adaptador.chamadas).toBe(0)
  })

  it('sem conseguir consultar o orçamento, não gasta', async () => {
    const adaptador = new AdaptadorRoteirizado([])
    const { ia } = montar({ adaptador, orcamento: { consultar: async () => Promise.reject(new Error('banco fora')) } })
    expect((await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A }))).codigoDeIa).toBe('IA_INDISPONIVEL')
    expect(adaptador.chamadas).toBe(0)
  })

  it('assunto delicado também passa pelo orçamento e pelo registro, sem modelo', async () => {
    const consultar = vi.fn(async () => ({ permitido: true as const }))
    const { ia, consumo } = montar({ orcamento: { consultar }, adaptador: new AdaptadorRoteirizado([]) })
    await ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('eu quero morrer'), escolaId: ESCOLA_A, alunoId: ALUNO_1 })
    expect(consultar).toHaveBeenCalledTimes(1)
    expect(consumo.registros).toMatchObject([{ origem: 'regra_fixa', modelo: MODELO_DA_REGRA_FIXA, tentativas: 0, estado: 'concluida' }])
  })
})

describe('OrcamentoEmMemoria', () => {
  function comLimites(limites: { tokensPorEscolaNoMes?: number; trocasPorAlunoNoDia?: number }) {
    let agora = new Date('2026-10-05T13:00:00Z')
    const consumo = new ConsumoEmMemoria()
    const relogio = { agora: () => agora }
    const ia = new ProvedorDeIa({ adaptador: new AdaptadorFalso(), registro: consumo, orcamento: new OrcamentoEmMemoria(consumo, limites, relogio), timeoutMs: 5_000, relogio })
    const tutor = (escolaId: string, alunoId: string) => ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('não entendi essa'), escolaId, alunoId })
    return { ia, tutor, avancarPara: (iso: string) => void (agora = new Date(iso)) }
  }

  it('freio diário do aluno: a troca além do limite é recusada, outro aluno segue, e no dia seguinte volta', async () => {
    const { tutor, avancarPara } = comLimites({ trocasPorAlunoNoDia: 2 })
    await tutor(ESCOLA_A, ALUNO_1)
    await tutor(ESCOLA_A, ALUNO_1)
    expect((await erroDe(tutor(ESCOLA_A, ALUNO_1))).codigoDeIa).toBe('IA_ORCAMENTO_ESGOTADO')
    await expect(tutor(ESCOLA_A, ALUNO_2)).resolves.toBeDefined()
    // 23h59 de São Paulo ainda é o mesmo dia; 00h01 já é o seguinte.
    avancarPara('2026-10-06T02:59:00Z')
    expect((await erroDe(tutor(ESCOLA_A, ALUNO_1))).codigoDeIa).toBe('IA_ORCAMENTO_ESGOTADO')
    avancarPara('2026-10-06T03:01:00Z')
    await expect(tutor(ESCOLA_A, ALUNO_1)).resolves.toBeDefined()
  })

  it('teto da escola: o gasto da escola A não segura a escola B', async () => {
    const { ia } = comLimites({ tokensPorEscolaNoMes: 100 })
    const gerar = (escolaId: string) => ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId })
    await gerar(ESCOLA_A)
    expect((await erroDe(gerar(ESCOLA_A))).codigoDeIa).toBe('IA_ORCAMENTO_ESGOTADO')
    await expect(gerar(ESCOLA_B)).resolves.toBeDefined()
  })

  it('sem limite configurado, não há teto: os valores são de quem configura, não constantes daqui', async () => {
    const { tutor } = comLimites({})
    for (let troca = 0; troca < 5; troca += 1) await expect(tutor(ESCOLA_A, ALUNO_1)).resolves.toBeDefined()
  })
})
