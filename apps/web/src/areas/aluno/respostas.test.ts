import { CodigoDeErro, type RespostaQuestaoSalva } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { ErroDaApi } from '../../api/cliente'
import { criarFilaDeRespostas, provaComRespostaSalva } from './fila-de-respostas'
import { comecarEnvio, confirmarEnvio, escolher, esperaAntesDeTentar, falharEnvio, FILA_VAZIA, MAIOR_ESPERA_DA_FILA_MS, proximoEnvio, tipoDaFalha } from './respostas'

describe('a fila das respostas ainda não salvas (regra 80, item 6)', () => {
  it('a escolha entra na fila na hora, e a última escolha da mesma questão é a que vale', () => {
    const umaVez = escolher(FILA_VAZIA, 3, 1)
    expect(umaVez.pendentes).toEqual([{ questao: 3, alternativa: 1 }])
    const trocada = escolher(escolher(umaVez, 1, 0), 3, 2)
    expect(trocada.pendentes).toEqual([{ questao: 1, alternativa: 0 }, { questao: 3, alternativa: 2 }])
  })

  it('manda uma por vez, a mais antiga primeiro', () => {
    const duas = escolher(escolher(FILA_VAZIA, 3, 1), 1, 0)
    expect(proximoEnvio(duas)).toEqual({ questao: 3, alternativa: 1 })
    const noAr = comecarEnvio(duas)
    expect(noAr.noAr).toEqual({ questao: 3, alternativa: 1 })
    expect(proximoEnvio(noAr)).toBeUndefined()
    const confirmada = confirmarEnvio(noAr)
    expect(confirmada.pendentes).toEqual([{ questao: 1, alternativa: 0 }])
    expect(proximoEnvio(confirmada)).toEqual({ questao: 1, alternativa: 0 })
  })

  it('a gravação que falha NÃO tira a escolha da fila', () => {
    const noAr = comecarEnvio(escolher(FILA_VAZIA, 3, 1))
    const falhou = falharEnvio(noAr, CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    expect(falhou.pendentes).toEqual([{ questao: 3, alternativa: 1 }])
    expect(falhou).toMatchObject({ noAr: undefined, falha: 'passageira', tentativas: 1 })
    // E volta a ser a próxima a sair.
    expect(proximoEnvio(falhou)).toEqual({ questao: 3, alternativa: 1 })
  })

  it('quem troca de alternativa enquanto a anterior é salva continua com a nova na fila', () => {
    const noAr = comecarEnvio(escolher(FILA_VAZIA, 3, 1))
    const trocouNoMeio = escolher(noAr, 3, 2)
    const confirmada = confirmarEnvio(trocouNoMeio)
    expect(confirmada.pendentes).toEqual([{ questao: 3, alternativa: 2 }])
  })

  it('com a atividade encerrada a fila para, guarda o que não foi salvo e não aceita escolha nova', () => {
    const encerrada = falharEnvio(comecarEnvio(escolher(FILA_VAZIA, 3, 1)), CodigoDeErro.ATIVIDADE_ENCERRADA)
    expect(encerrada).toMatchObject({ falha: 'encerrada', pendentes: [{ questao: 3, alternativa: 1 }] })
    expect(proximoEnvio(encerrada)).toBeUndefined()
    expect(escolher(encerrada, 1, 0)).toBe(encerrada)
  })

  it('só o encerramento e a recusa que não passa com o tempo param a fila; o resto é tentado de novo', () => {
    expect(tipoDaFalha(CodigoDeErro.ATIVIDADE_ENCERRADA)).toBe('encerrada')
    expect(tipoDaFalha(CodigoDeErro.NAO_ENCONTRADO)).toBe('recusada')
    for (const codigo of [CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO, CodigoDeErro.TEMPO_ESGOTADO, CodigoDeErro.ERRO_INTERNO, CodigoDeErro.LIMITE_EXCEDIDO, CodigoDeErro.NAO_AUTENTICADO]) expect(tipoDaFalha(codigo), codigo).toBe('passageira')
    // Depois de uma recusa, a escolha nova tenta de novo.
    const recusada = falharEnvio(comecarEnvio(escolher(FILA_VAZIA, 3, 1)), CodigoDeErro.NAO_ENCONTRADO)
    expect(proximoEnvio(recusada)).toBeUndefined()
    expect(proximoEnvio(escolher(recusada, 3, 2))).toEqual({ questao: 3, alternativa: 2 })
  })

  it('a espera entre as tentativas cresce e tem teto: a escola inteira atrás da mesma rede não martela a API', () => {
    expect([1, 2, 3, 4, 9].map(esperaAntesDeTentar)).toEqual([2_000, 4_000, 8_000, MAIOR_ESPERA_DA_FILA_MS, MAIOR_ESPERA_DA_FILA_MS])
  })
})

/** Um servidor de mentira: cada gravação fica esperando o teste dizer se deu certo. */
function servidorDeMentira() {
  const chamadas: { questao: number; alternativa: number; aceitar: () => void; recusar: (codigo: CodigoDeErro) => void }[] = []
  const salvar = (questao: number, alternativa: number): Promise<RespostaQuestaoSalva> =>
    new Promise((resolver, rejeitar) => {
      chamadas.push({ questao, alternativa, aceitar: () => resolver({ questao, alternativa, respondidaEm: '2026-10-05T13:10:00.000Z' }), recusar: (codigo) => rejeitar(new ErroDaApi(codigo)) })
    })
  return { chamadas, salvar }
}

/** Um relógio de mentira: guarda o que foi agendado, e o teste dispara. */
function relogioDeMentira() {
  const agendados: { funcao: () => void; esperaMs: number; cancelado: boolean }[] = []
  const agendar = (funcao: () => void, esperaMs: number) => {
    const item = { funcao, esperaMs, cancelado: false }
    agendados.push(item)
    return () => {
      item.cancelado = true
    }
  }
  return { agendados, agendar }
}

const assentar = () => new Promise<void>((resolver) => setTimeout(resolver, 0))

describe('o reenvio das respostas', () => {
  it('a resposta que falha ao salvar continua marcada e é mandada de novo sozinha, com a mesma escolha, até o servidor confirmar', async () => {
    const servidor = servidorDeMentira()
    const relogio = relogioDeMentira()
    const salvas: RespostaQuestaoSalva[] = []
    const fila = criarFilaDeRespostas({ salvar: servidor.salvar, aoSalvar: (salva) => salvas.push(salva), agendar: relogio.agendar })

    fila.escolher(3, 1)
    expect(servidor.chamadas).toHaveLength(1)
    servidor.chamadas[0]?.recusar(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    await assentar()
    // Falhou: a escolha fica, nada foi dado como salvo, e a tentativa seguinte está agendada.
    expect(fila.ler()).toMatchObject({ pendentes: [{ questao: 3, alternativa: 1 }], falha: 'passageira', tentativas: 1 })
    expect(salvas).toEqual([])
    expect(relogio.agendados.map((item) => item.esperaMs)).toEqual([2_000])

    // O relógio dispara: a mesma escolha sai de novo, e falha de novo, com a espera maior.
    relogio.agendados[0]?.funcao()
    expect(servidor.chamadas[1]).toMatchObject({ questao: 3, alternativa: 1 })
    servidor.chamadas[1]?.recusar(CodigoDeErro.TEMPO_ESGOTADO)
    await assentar()
    expect(relogio.agendados.map((item) => item.esperaMs)).toEqual([2_000, 4_000])

    // A rota voltou: a tentativa seguinte é aceita, a fila esvazia, e só agora a resposta conta como salva.
    relogio.agendados[1]?.funcao()
    servidor.chamadas[2]?.aceitar()
    await assentar()
    expect(fila.ler()).toEqual(FILA_VAZIA)
    expect(salvas).toEqual([{ questao: 3, alternativa: 1, respondidaEm: '2026-10-05T13:10:00.000Z' }])
    expect(servidor.chamadas).toHaveLength(3)
  })

  it('"tentar agora" (a rede voltou, a sessão voltou) não espera o relógio, e cancela a espera para não mandar duas vezes', async () => {
    const servidor = servidorDeMentira()
    const relogio = relogioDeMentira()
    const fila = criarFilaDeRespostas({ salvar: servidor.salvar, aoSalvar: () => undefined, agendar: relogio.agendar })
    fila.escolher(1, 0)
    servidor.chamadas[0]?.recusar(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    await assentar()
    fila.tentarAgora()
    expect(servidor.chamadas).toHaveLength(2)
    expect(relogio.agendados[0]?.cancelado).toBe(true)
    // Com um envio no ar, pedir de novo não manda outro.
    fila.tentarAgora()
    expect(servidor.chamadas).toHaveLength(2)
  })

  it('a escolha feita com a rede fora entra atrás das que já esperavam, e todas saem quando a rota volta, uma por vez', async () => {
    const servidor = servidorDeMentira()
    const relogio = relogioDeMentira()
    const salvas: number[] = []
    const fila = criarFilaDeRespostas({ salvar: servidor.salvar, aoSalvar: (salva) => salvas.push(salva.questao), agendar: relogio.agendar })
    fila.escolher(1, 0)
    servidor.chamadas[0]?.recusar(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    await assentar()
    // O aluno continua respondendo sem rede: a escolha nova tenta na hora (e a questão 1 continua na frente).
    fila.escolher(2, 3)
    expect(servidor.chamadas[1]).toMatchObject({ questao: 1, alternativa: 0 })
    servidor.chamadas[1]?.aceitar()
    await assentar()
    expect(servidor.chamadas[2]).toMatchObject({ questao: 2, alternativa: 3 })
    servidor.chamadas[2]?.aceitar()
    await assentar()
    expect(salvas).toEqual([1, 2])
    expect(fila.ler()).toEqual(FILA_VAZIA)
  })

  it('com a atividade encerrada pelo servidor, a fila não tenta de novo', async () => {
    const servidor = servidorDeMentira()
    const relogio = relogioDeMentira()
    const fila = criarFilaDeRespostas({ salvar: servidor.salvar, aoSalvar: () => undefined, agendar: relogio.agendar })
    fila.escolher(3, 1)
    servidor.chamadas[0]?.recusar(CodigoDeErro.ATIVIDADE_ENCERRADA)
    await assentar()
    expect(fila.ler()).toMatchObject({ falha: 'encerrada', pendentes: [{ questao: 3, alternativa: 1 }] })
    expect(relogio.agendados).toEqual([])
    fila.tentarAgora()
    fila.escolher(1, 0)
    expect(servidor.chamadas).toHaveLength(1)
  })

  it('a sessão que acaba esvazia a fila: nada da pessoa anterior é mandado nem mostrado à seguinte', async () => {
    const servidor = servidorDeMentira()
    const relogio = relogioDeMentira()
    const salvas: RespostaQuestaoSalva[] = []
    const fila = criarFilaDeRespostas({ salvar: servidor.salvar, aoSalvar: (salva) => salvas.push(salva), agendar: relogio.agendar })
    fila.escolher(3, 1)
    fila.parar()
    expect(fila.ler()).toEqual(FILA_VAZIA)
    // A resposta que volta depois não mexe em nada, e nenhuma escolha nova sai.
    servidor.chamadas[0]?.aceitar()
    await assentar()
    fila.escolher(1, 0)
    expect(salvas).toEqual([])
    expect(servidor.chamadas).toHaveLength(1)
  })

  it('a resposta confirmada entra na prova lida, no lugar da anterior da mesma questão', () => {
    const prova = { atividadeAplicadaId: 'x', titulo: 't', avaliativa: false, estado: 'aberta' as const, adaptacao: null, questoes: [], respostas: [{ questao: 1, alternativa: 0 }, { questao: 2, alternativa: 2 }], enviadaEm: null }
    expect(provaComRespostaSalva(prova, { questao: 1, alternativa: 3 }).respostas).toEqual([{ questao: 2, alternativa: 2 }, { questao: 1, alternativa: 3 }])
  })
})
