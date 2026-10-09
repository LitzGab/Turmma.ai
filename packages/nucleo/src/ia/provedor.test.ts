import { CodigoDeErro } from '@educa/shared'
import { describe, expect, it, vi } from 'vitest'
import { executarNoContexto } from '../contexto/contexto.js'
import { AdaptadorRoteirizado, PROVEDOR_ROTEIRIZADO } from './__fixtures__/adaptador-roteirizado.js'
import { ALUNO_1, ALUNO_2, atividadeDeEstequiometria, entradaDeAtividade, entradaDoAssistente, entradaDoRelatorio, entradaDoTutor, ESCOLA_A, ESCOLA_B } from './__fixtures__/entradas.js'
import type { AdaptadorDeModelo } from './adaptador.js'
import { AdaptadorFalso, MODELO_FALSO } from './adaptador-falso.js'
import { ConsumoEmMemoria, OrcamentoEmMemoria, type ConsumoDeIa, type OrcamentoDeIa, type RegistroDeConsumo } from './consumo.js'
import { CODIGOS_DE_ERRO_DE_IA, ErroDeIa } from './erros.js'
import type { EnvioDaChamada, MedicaoDaGeracao } from './porta.js'
import { criarProvedorDeIa, MODELO_DA_REGRA_FIXA, ProvedorDeIa, type RegistradorDeIa } from './provedor.js'
import { exigirFuncaoAtiva, SuspensoesEmMemoria, type SuspensaoDeFuncao } from './suspensao.js'
import type { DefinicaoDeTarefa } from './tarefa.js'
import { gerarAtividadeObjetiva } from './tarefas/gerar-atividade-objetiva.js'
import { proporFerramenta } from './tarefas/propor-ferramenta.js'
import { relatorioDaCorrecao } from './tarefas/relatorio-da-correcao.js'
import { turnoDoTutor } from './tarefas/turno-do-tutor.js'

const EXECUCAO = '1d2e3f4a-5b6c-4d7e-8f90-a1b2c3d4e5f6'
const SEMPRE = { consultar: async () => ({ permitido: true as const }) } satisfies OrcamentoDeIa

function registrador(): RegistradorDeIa & { linhas: () => unknown[] } {
  const info = vi.fn()
  const warn = vi.fn()
  return { info, warn, linhas: () => [...info.mock.calls, ...warn.mock.calls].flat() }
}

function montar(opcoes: { adaptador?: AdaptadorDeModelo; orcamento?: OrcamentoDeIa; registro?: RegistroDeConsumo; suspensao?: SuspensaoDeFuncao; logger?: RegistradorDeIa; agora?: () => Date } = {}) {
  const consumo = new ConsumoEmMemoria()
  const relogio = { agora: opcoes.agora ?? (() => new Date('2026-10-05T13:00:00Z')) }
  const ia = new ProvedorDeIa({
    adaptador: opcoes.adaptador ?? new AdaptadorFalso(),
    registro: opcoes.registro ?? consumo,
    orcamento: opcoes.orcamento ?? SEMPRE,
    suspensao: opcoes.suspensao ?? new SuspensoesEmMemoria(),
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
    expect(medicao).toMatchObject({ origem: 'falso', perfil: 'padrao', modelo: MODELO_FALSO, promptVersao: gerarAtividadeObjetiva.prompt.versao, envioExterno: false, provedorId: null, tentativas: 1 })
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

  it('com envio externo, o id do provedor que atendeu vai junto na medição e no registro; sem envio, o provedor é nulo', async () => {
    const externo = montar({ adaptador: new AdaptadorRoteirizado([JSON.stringify(atividadeDeEstequiometria())], true) })
    const { medicao } = await externo.ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A })
    expect(medicao).toMatchObject({ envioExterno: true, provedorId: PROVEDOR_ROTEIRIZADO })
    expect(externo.consumo.registros).toMatchObject([{ envioExterno: true, provedorId: PROVEDOR_ROTEIRIZADO }])
    // Modelo local: a chamada aconteceu, e nada saiu daqui.
    const local = montar({ adaptador: new AdaptadorRoteirizado([JSON.stringify(atividadeDeEstequiometria())], false) })
    const { medicao: daLocal } = await local.ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A })
    expect(daLocal).toMatchObject({ envioExterno: false, provedorId: null })
    expect(local.consumo.registros).toMatchObject([{ envioExterno: false, provedorId: null }])
  })

  it('a chamada que falhou depois de sair para o provedor também registra qual foi', async () => {
    const { ia, consumo } = montar({ adaptador: new AdaptadorRoteirizado([new Error('provedor fora')]) })
    await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A }))
    expect(consumo.registros).toMatchObject([{ estado: 'falhou', tentativas: 1, envioExterno: true, provedorId: PROVEDOR_ROTEIRIZADO }])
  })

  it('a falha antes de qualquer chamada não conta como envio, mesmo com adaptador externo: a regra fixa defeituosa não leva provedor', async () => {
    const adaptador = new AdaptadorRoteirizado([])
    const regraFixaDefeituosa = { ...turnoDoTutor, semModelo: () => ({ classificacao: 'normal' as const, resposta: '', citacoes: [] }) }
    const { ia, consumo } = montar({ adaptador })
    await erroDe(ia.gerar({ tarefa: regraFixaDefeituosa, entrada: entradaDoTutor('não entendi'), escolaId: ESCOLA_A, alunoId: ALUNO_1 }))
    expect(adaptador.chamadas).toBe(0)
    expect(consumo.registros).toMatchObject([{ estado: 'falhou', codigoDeErro: 'IA_SAIDA_INVALIDA', tentativas: 0, envioExterno: false, provedorId: null }])
  })

  it('o tipo da porta só aceita os dois pares possíveis: com envio externo, o provedor; sem envio, nulo', () => {
    const medida = { origem: 'openai_compat', perfil: 'padrao', modelo: 'm', promptVersao: 'v', tokensDeEntrada: 1, tokensDeSaida: 1, duracaoMs: 1, tentativas: 1 } as const
    const consumida = { ...medida, escolaId: ESCOLA_A, tarefa: 'gerar_atividade_objetiva', funcao: 'conversa_e_ferramentas', estado: 'concluida', em: new Date() } as const
    const externo: EnvioDaChamada = { envioExterno: true, provedorId: 'maritaca' }
    const local: EnvioDaChamada = { envioExterno: false, provedorId: null }
    const medicoes: MedicaoDaGeracao[] = [
      { ...medida, ...externo },
      { ...medida, ...local },
    ]
    const consumos: ConsumoDeIa[] = [
      { ...consumida, ...externo },
      { ...consumida, ...local },
    ]
    expect([...medicoes, ...consumos].map((item) => item.provedorId)).toEqual(['maritaca', null, 'maritaca', null])

    // @ts-expect-error envio externo sem provedor: a escola não saberia para onde o dado foi
    const semProvedor: EnvioDaChamada = { envioExterno: true, provedorId: null }
    // @ts-expect-error provedor sem envio externo: o banco recusa (consumo_ia_provedor_so_no_envio_externo)
    const provedorSemEnvio: EnvioDaChamada = { envioExterno: false, provedorId: 'maritaca' }
    // @ts-expect-error a medição leva o mesmo par
    const medicaoSemProvedor: MedicaoDaGeracao = { ...medida, envioExterno: true, provedorId: null }
    // @ts-expect-error o registro de consumo leva o mesmo par
    const consumoSemEnvio: ConsumoDeIa = { ...consumida, envioExterno: false, provedorId: 'maritaca' }
    expect([semProvedor, provedorSemEnvio, medicaoSemProvedor, consumoSemEnvio]).toHaveLength(4)
  })

  it('criarProvedorDeIa: sem nada configurado, a porta é a do adaptador falso', async () => {
    const consumo = new ConsumoEmMemoria()
    const ia = criarProvedorDeIa({ adaptador: 'falso', timeoutMs: 5_000, executor: { vagasPorEscola: 2, vagasNoTotal: 8, timeoutMs: 10_000 } }, { registro: consumo, orcamento: SEMPRE, suspensao: new SuspensoesEmMemoria() })
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

  it('tarefa que leva texto de aluno não deixa entrada nem saída no consumo: o registro da conversa é do Tutor, não daqui', async () => {
    const { ia, consumo } = montar()
    const duvida = 'como eu acho o reagente limitante? palavra-marcada-do-aluno'
    const { saida } = await ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor(duvida), escolaId: ESCOLA_A, alunoId: ALUNO_1 })
    expect(turnoDoTutor).toMatchObject({ levaTextoLivreDePessoa: true, levaTextoDeAluno: true })
    expect(consumo.registros).toMatchObject([{ tarefa: 'turno_do_tutor', alunoId: ALUNO_1, estado: 'concluida' }])
    expect(consumo.registros[0]).not.toHaveProperty('entrada')
    expect(consumo.registros[0]).not.toHaveProperty('saida')
    expect(consumo.registros[0]?.tokensDeEntrada).toBeGreaterThan(0)
    const gravado = JSON.stringify(consumo.registros)
    expect(gravado).not.toContain('palavra-marcada-do-aluno')
    expect(gravado).not.toContain(saida.resposta.slice(0, 20))
  })

  it('na falha de tarefa que leva texto de aluno, o consumo também fica sem a entrada', async () => {
    const { ia, consumo } = montar({ adaptador: new AdaptadorRoteirizado(['não é json', 'não é json']) })
    await erroDe(ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('não entendi palavra-marcada-do-aluno'), escolaId: ESCOLA_A, alunoId: ALUNO_1 }))
    expect(consumo.registros).toMatchObject([{ estado: 'falhou', codigoDeErro: 'IA_SAIDA_INVALIDA' }])
    expect(JSON.stringify(consumo.registros)).not.toContain('palavra-marcada')
  })

  it('a conversa do professor com o Assistente não é copiada para o consumo, no sucesso e na falha: só ele a lê, e ela mora em mensagem_agente', async () => {
    const mensagem = 'monta uma atividade para o Enzo, que tem dislexia: palavra-marcada-do-professor'
    const entrada = { ...entradaDoAssistente(mensagem), turnosAnteriores: [{ autor: 'professor' as const, texto: 'turno-anterior-marcado' }] }
    expect(proporFerramenta).toMatchObject({ levaTextoLivreDePessoa: true, levaTextoDeAluno: true })
    const { ia, consumo } = montar()
    await ia.gerar({ tarefa: proporFerramenta, entrada, escolaId: ESCOLA_A, execucaoId: EXECUCAO })
    const falhando = montar({ registro: consumo, adaptador: new AdaptadorRoteirizado(['não é json', 'não é json']) })
    await erroDe(falhando.ia.gerar({ tarefa: proporFerramenta, entrada, escolaId: ESCOLA_A, execucaoId: EXECUCAO }))
    expect(consumo.registros).toMatchObject([
      { tarefa: 'propor_ferramenta', funcao: 'conversa_e_ferramentas', estado: 'concluida', execucaoId: EXECUCAO },
      { tarefa: 'propor_ferramenta', estado: 'falhou', codigoDeErro: 'IA_SAIDA_INVALIDA' },
    ])
    for (const registro of consumo.registros) {
      expect(registro).not.toHaveProperty('entrada')
      expect(registro).not.toHaveProperty('saida')
    }
    expect(JSON.stringify(consumo.registros)).not.toMatch(/marcad|Enzo|dislexia/)
  })

  it('as tarefas de geração continuam gravando entrada e saída: é o que responde por que a IA gerou aquilo', async () => {
    const { ia, consumo } = montar()
    for (const [tarefa, entrada] of [
      [gerarAtividadeObjetiva, entradaDeAtividade()],
      [relatorioDaCorrecao, entradaDoRelatorio()],
    ] as const) {
      const { saida } = await ia.gerar({ tarefa: tarefa as DefinicaoDeTarefa<unknown, unknown>, entrada, escolaId: ESCOLA_A })
      expect(consumo.registros.at(-1)).toMatchObject({ tarefa: tarefa.nome, entrada, saida })
    }
  })

  it('o aluno só entra no consumo da função que é dele: em outra tarefa, o id passado por engano não é gravado (D64)', async () => {
    const { ia, consumo } = montar()
    await ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId: ESCOLA_A, alunoId: ALUNO_1 })
    expect(consumo.registros[0]).not.toHaveProperty('alunoId')
  })

  it('tarefa sem texto de aluno guarda a entrada na falha: é o que explica depois por que a IA não entregou', async () => {
    const { ia, consumo } = montar({ adaptador: new AdaptadorRoteirizado(['não é json', 'não é json']) })
    const entrada = entradaDeAtividade()
    await erroDe(ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada, escolaId: ESCOLA_A }))
    expect(consumo.registros[0]?.entrada).toEqual(entrada)
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
    expect(erro.codigo).toBe('IA_INDISPONIVEL')
    expect(`${erro.message} ${JSON.stringify(erro)} ${JSON.stringify(logger.linhas())}`).not.toContain('Enzo')
    expect(consumo.registros).toMatchObject([{ estado: 'falhou', codigoDeErro: 'IA_INDISPONIVEL' }])
  })

  it('cada código de IA é um código do contrato da API, com o status dele', () => {
    expect(new ErroDeIa('IA_INDISPONIVEL')).toMatchObject({ codigo: 'IA_INDISPONIVEL', status: 503 })
    expect(new ErroDeIa('IA_TEMPO_ESGOTADO')).toMatchObject({ codigo: 'IA_TEMPO_ESGOTADO', status: 503 })
    expect(new ErroDeIa('IA_SAIDA_INVALIDA')).toMatchObject({ codigo: 'IA_SAIDA_INVALIDA', status: 502 })
    expect(new ErroDeIa('IA_ORCAMENTO_ESGOTADO', 30)).toMatchObject({ codigo: 'IA_ORCAMENTO_ESGOTADO', status: 429, tenteDeNovoEmSegundos: 30 })
    expect(new ErroDeIa('LIMITE_DIARIO_DO_TUTOR')).toMatchObject({ codigo: 'LIMITE_DIARIO_DO_TUTOR', status: 429 })
    expect(new ErroDeIa('IA_ENTRADA_INVALIDA')).toMatchObject({ codigo: 'IA_ENTRADA_INVALIDA', status: 500 })
    expect(new ErroDeIa('FUNCAO_SUSPENSA')).toMatchObject({ codigo: 'FUNCAO_SUSPENSA', status: 409 })
    expect(new ErroDeIa('MATERIAL_INSUFICIENTE')).toMatchObject({ codigo: 'MATERIAL_INSUFICIENTE', status: 422 })
    // Todo código da camada é um código do contrato da API: o que a execução grava é o que a tela sabe mostrar.
    for (const codigo of CODIGOS_DE_ERRO_DE_IA) expect(Object.values(CodigoDeErro)).toContain(codigo)
  })
})

describe('ProvedorDeIa: a escola do pedido é a de quem pede (regra 10, item 3)', () => {
  const pedir = (ia: ProvedorDeIa, escolaId: string) => ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId })

  it('com contexto da escola A, o pedido em nome da escola B é recusado antes de consultar, gastar ou registrar', async () => {
    const adaptador = new AdaptadorRoteirizado([])
    const consultar = vi.fn(async () => ({ permitido: true as const }))
    const estaSuspensa = vi.fn(async () => false)
    const logger = registrador()
    const { ia, consumo } = montar({ adaptador, orcamento: { consultar }, suspensao: { estaSuspensa }, logger })
    const erro = await executarNoContexto({ requisicaoId: 'r', escolaId: ESCOLA_A, usuarioId: 'u' }, () => erroDe(pedir(ia, ESCOLA_B)))
    expect(erro).toMatchObject({ codigoDeIa: 'IA_ENTRADA_INVALIDA', status: 500 })
    expect(adaptador.chamadas).toBe(0)
    expect(consultar).not.toHaveBeenCalled()
    expect(estaSuspensa).not.toHaveBeenCalled()
    expect(consumo.registros).toEqual([])
    expect(logger.linhas()).toEqual([{ evento: 'ia.geracao.escola_fora_do_contexto', tipo: 'gerar_atividade_objetiva' }])
  })

  it('com a escola do contexto, o pedido passa; sem contexto de escola (rotina nossa), não há com o que comparar', async () => {
    const { ia } = montar()
    await expect(executarNoContexto({ requisicaoId: 'r', escolaId: ESCOLA_A }, () => pedir(ia, ESCOLA_A))).resolves.toBeDefined()
    await expect(executarNoContexto({ requisicaoId: 'r' }, () => pedir(ia, ESCOLA_B))).resolves.toBeDefined()
    await expect(pedir(ia, ESCOLA_B)).resolves.toBeDefined()
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
    const { ia } = montar({ adaptador, orcamento: { consultar: async () => ({ permitido: false, codigo: 'IA_ORCAMENTO_ESGOTADO', tenteDeNovoEmSegundos: 3600 }) } })
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

  it('a consulta leva a turma e a execução, quando vêm no pedido: o pacote do mês é da turma, e a pergunta da própria execução não conta contra ela', async () => {
    const consultar = vi.fn(async () => ({ permitido: true as const }))
    const { ia } = montar({ orcamento: { consultar } })
    await ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('não entendi'), escolaId: ESCOLA_A, alunoId: ALUNO_1, turmaId: ESCOLA_B, execucaoId: EXECUCAO })
    expect(consultar.mock.calls).toEqual([[{ escolaId: ESCOLA_A, funcao: 'tutor_com_o_aluno', alunoId: ALUNO_1, turmaId: ESCOLA_B, execucaoId: EXECUCAO }]])
  })

  it('o código da recusa é o que o orçamento deu: freio do dia e pacote do mês chegam com o código próprio', async () => {
    for (const codigo of ['LIMITE_DIARIO_DO_TUTOR', 'PACOTE_DO_TUTOR_ESGOTADO'] as const) {
      const { ia } = montar({ adaptador: new AdaptadorRoteirizado([]), orcamento: { consultar: async () => ({ permitido: false, codigo }) } })
      const erro = await erroDe(ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('não entendi'), escolaId: ESCOLA_A, alunoId: ALUNO_1 }))
      expect(erro).toMatchObject({ codigoDeIa: codigo, codigo, status: 429 })
    }
  })

  it('assunto delicado não passa pelo orçamento: no fim do freio do dia, o aluno ainda recebe a mensagem fixa com o 188', async () => {
    const consultar = vi.fn(async () => ({ permitido: false as const, codigo: 'LIMITE_DIARIO_DO_TUTOR' as const }))
    const { ia, consumo } = montar({ orcamento: { consultar }, adaptador: new AdaptadorRoteirizado([]) })
    const { saida } = await ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('eu quero morrer'), escolaId: ESCOLA_A, alunoId: ALUNO_1 })
    expect(saida.resposta).toContain('188')
    expect(consultar).not.toHaveBeenCalled()
    // O adaptador deste teste é externo: a regra fixa não chama ninguém, e por isso não leva provedor.
    expect(consumo.registros).toMatchObject([{ origem: 'regra_fixa', modelo: MODELO_DA_REGRA_FIXA, tentativas: 0, estado: 'concluida', envioExterno: false, provedorId: null }])
    // A dúvida comum, com o mesmo orçamento esgotado, é recusada.
    expect((await erroDe(ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('não entendi'), escolaId: ESCOLA_A, alunoId: ALUNO_1 }))).codigoDeIa).toBe('LIMITE_DIARIO_DO_TUTOR')
  })
})

describe('ProvedorDeIa: função suspensa pela escola não executa (D60)', () => {
  function comSuspensao() {
    const suspensao = new SuspensoesEmMemoria()
    const adaptador = new AdaptadorRoteirizado([JSON.stringify(atividadeDeEstequiometria()), JSON.stringify(atividadeDeEstequiometria())])
    const consultar = vi.fn(async () => ({ permitido: true as const }))
    const logger = registrador()
    return { suspensao, adaptador, consultar, logger, ...montar({ suspensao, adaptador, orcamento: { consultar }, logger }) }
  }
  const gerar = (ia: ProvedorDeIa, escolaId: string) => ia.gerar({ tarefa: gerarAtividadeObjetiva, entrada: entradaDeAtividade(), escolaId })

  it('função suspensa na escola A recusa com erro próprio, sem chamar o adaptador, sem consultar orçamento e sem registrar consumo', async () => {
    const { ia, suspensao, adaptador, consultar, consumo, logger } = comSuspensao()
    suspensao.suspender(ESCOLA_A, 'conversa_e_ferramentas')
    const erro = await erroDe(gerar(ia, ESCOLA_A))
    expect(erro).toMatchObject({ codigoDeIa: 'FUNCAO_SUSPENSA', codigo: 'FUNCAO_SUSPENSA', status: 409 })
    expect(adaptador.chamadas).toBe(0)
    expect(consultar).not.toHaveBeenCalled()
    expect(consumo.registros).toEqual([])
    expect(logger.linhas()).toMatchObject([{ evento: 'ia.geracao.falhou', codigo: 'FUNCAO_SUSPENSA', escolaId: ESCOLA_A }])
  })

  it('a mesma função na escola B executa', async () => {
    const { ia, suspensao, adaptador } = comSuspensao()
    suspensao.suspender(ESCOLA_A, 'conversa_e_ferramentas')
    await expect(gerar(ia, ESCOLA_B)).resolves.toMatchObject({ saida: atividadeDeEstequiometria() })
    expect(adaptador.chamadas).toBe(1)
  })

  it('outra função na escola A executa: suspender a adaptação não desliga a conversa e as ferramentas', async () => {
    const { ia, suspensao, adaptador } = comSuspensao()
    suspensao.suspender(ESCOLA_A, 'adaptacao')
    suspensao.suspender(ESCOLA_A, 'tutor_com_o_aluno')
    await expect(gerar(ia, ESCOLA_A)).resolves.toBeDefined()
    expect(adaptador.chamadas).toBe(1)
  })

  it('retomada a função, ela volta a executar', async () => {
    const { ia, suspensao } = comSuspensao()
    suspensao.suspender(ESCOLA_A, 'conversa_e_ferramentas')
    expect((await erroDe(gerar(ia, ESCOLA_A))).codigoDeIa).toBe('FUNCAO_SUSPENSA')
    suspensao.retomar(ESCOLA_A, 'conversa_e_ferramentas')
    await expect(gerar(ia, ESCOLA_A)).resolves.toBeDefined()
  })

  it('o Tutor suspenso não responde nem com a mensagem fixa: nada da função executa', async () => {
    const suspensao = new SuspensoesEmMemoria()
    suspensao.suspender(ESCOLA_A, 'tutor_com_o_aluno')
    const { ia, consumo } = montar({ suspensao })
    const erro = await erroDe(ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('eu quero morrer'), escolaId: ESCOLA_A, alunoId: ALUNO_1 }))
    expect(erro.codigoDeIa).toBe('FUNCAO_SUSPENSA')
    expect(consumo.registros).toEqual([])
  })

  it('sem conseguir consultar a suspensão, não executa', async () => {
    const adaptador = new AdaptadorRoteirizado([])
    const { ia } = montar({ adaptador, suspensao: { estaSuspensa: async () => Promise.reject(new Error('banco fora')) } })
    expect((await erroDe(gerar(ia, ESCOLA_A))).codigoDeIa).toBe('IA_INDISPONIVEL')
    expect(adaptador.chamadas).toBe(0)
  })

  it('a função sem modelo usa a mesma conferência: a correção de objetiva suspensa é recusada antes da conta', async () => {
    const suspensao = new SuspensoesEmMemoria()
    suspensao.suspender(ESCOLA_A, 'correcao_de_objetiva')
    const corrigir = vi.fn(() => 'lote corrigido')
    const encerrar = async (escolaId: string): Promise<string> => {
      await exigirFuncaoAtiva(suspensao, escolaId, 'correcao_de_objetiva')
      return corrigir()
    }
    const erro: unknown = await encerrar(ESCOLA_A).catch((motivo: unknown) => motivo)
    expect(erro).toBeInstanceOf(ErroDeIa)
    expect((erro as ErroDeIa).codigoDeIa).toBe('FUNCAO_SUSPENSA')
    expect(corrigir).not.toHaveBeenCalled()
    await expect(encerrar(ESCOLA_B)).resolves.toBe('lote corrigido')
    // E o relatório da correção, que usa modelo, é recusado pelo provedor com o mesmo código.
    const { ia } = montar({ suspensao })
    expect((await erroDe(ia.gerar({ tarefa: relatorioDaCorrecao, entrada: entradaDoRelatorio(), escolaId: ESCOLA_A }))).codigoDeIa).toBe('FUNCAO_SUSPENSA')
  })
})

describe('OrcamentoEmMemoria', () => {
  function comLimites(limites: { tokensPorEscolaNoMes?: number; trocasPorAlunoNoDia?: number }) {
    let agora = new Date('2026-10-05T13:00:00Z')
    const consumo = new ConsumoEmMemoria()
    const relogio = { agora: () => agora }
    const ia = new ProvedorDeIa({ adaptador: new AdaptadorFalso(), registro: consumo, orcamento: new OrcamentoEmMemoria(consumo, limites, relogio), suspensao: new SuspensoesEmMemoria(), timeoutMs: 5_000, relogio })
    const tutor = (escolaId: string, alunoId: string) => ia.gerar({ tarefa: turnoDoTutor, entrada: entradaDoTutor('não entendi essa'), escolaId, alunoId })
    return { ia, tutor, avancarPara: (iso: string) => void (agora = new Date(iso)) }
  }

  it('freio diário do aluno: a troca além do limite é recusada, outro aluno segue, e no dia seguinte volta', async () => {
    const { tutor, avancarPara } = comLimites({ trocasPorAlunoNoDia: 2 })
    await tutor(ESCOLA_A, ALUNO_1)
    await tutor(ESCOLA_A, ALUNO_1)
    expect((await erroDe(tutor(ESCOLA_A, ALUNO_1))).codigoDeIa).toBe('LIMITE_DIARIO_DO_TUTOR')
    await expect(tutor(ESCOLA_A, ALUNO_2)).resolves.toBeDefined()
    // 23h59 de São Paulo ainda é o mesmo dia; 00h01 já é o seguinte.
    avancarPara('2026-10-06T02:59:00Z')
    expect((await erroDe(tutor(ESCOLA_A, ALUNO_1))).codigoDeIa).toBe('LIMITE_DIARIO_DO_TUTOR')
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
