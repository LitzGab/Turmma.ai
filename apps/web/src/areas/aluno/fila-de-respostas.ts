import type { RespostaProva, RespostaQuestaoSalva } from '@educa/shared'
import type { QueryClient } from '@tanstack/react-query'
import { responderQuestao, consultaProva } from '../../api/atividades-do-aluno'
import { CHAVE_DAS_MINHAS_ATIVIDADES } from '../../api/chaves-do-aluno'
import { codigoDoErro } from '../../api/ciclo-de-execucao'
import { aoAbrirSessao, aoTrocarDeSessao } from '../../api/sessao'
import { comecarEnvio, confirmarEnvio, escolher, esperaAntesDeTentar, falharEnvio, FILA_VAZIA, proximoEnvio, type EstadoDaFila } from './respostas'

/**
 * A fila de respostas de uma atividade, ligada à rede e ao relógio (regra 80, item 6). A regra é de `respostas.ts`; aqui
 * ela só é posta para andar: manda uma escolha por vez, e, se a gravação falha, **tenta de novo sozinha** depois de uma
 * espera, e na hora em que a rede ou a sessão voltam.
 *
 * Mora fora da tela, de propósito: o aluno que marca a alternativa e vai pedir ajuda ao Tutor não perde a escolha que
 * ainda estava sendo salva, e a gravação continua enquanto ele está em outra tela.
 */
export interface FilaDeRespostas {
  readonly ler: () => EstadoDaFila
  readonly assinar: (ouvinte: () => void) => () => void
  /** O aluno marcou uma alternativa: entra na fila e é mandada. */
  readonly escolher: (questao: number, alternativa: number) => void
  /** Tenta agora, sem esperar o relógio: a rede voltou, a sessão voltou, ou a pessoa pediu. */
  readonly tentarAgora: () => void
  /** A sessão acabou ou mudou de dono: nada mais sai, e o que estava guardado é esquecido. */
  readonly parar: () => void
}

interface PartesDaFila {
  readonly salvar: (questao: number, alternativa: number) => Promise<RespostaQuestaoSalva>
  /** O servidor confirmou: a tela acerta o que ela lê como salvo. */
  readonly aoSalvar: (salva: RespostaQuestaoSalva) => void
  /** Chama a função depois da espera; devolve o cancelamento. No teste, um relógio que o teste adianta. */
  readonly agendar?: (funcao: () => void, esperaMs: number) => () => void
}

function agendarNoRelogio(funcao: () => void, esperaMs: number): () => void {
  const relogio = setTimeout(funcao, esperaMs)
  return () => clearTimeout(relogio)
}

export function criarFilaDeRespostas({ salvar, aoSalvar, agendar = agendarNoRelogio }: PartesDaFila): FilaDeRespostas {
  let estado = FILA_VAZIA
  let parada = false
  let cancelarEspera: (() => void) | undefined
  const ouvintes = new Set<() => void>()

  function publicar(novo: EstadoDaFila): void {
    if (novo === estado) return
    estado = novo
    for (const ouvinte of ouvintes) ouvinte()
  }

  function bombear(): void {
    cancelarEspera?.()
    cancelarEspera = undefined
    if (parada) return
    const proximo = proximoEnvio(estado)
    if (proximo === undefined) return
    publicar(comecarEnvio(estado))
    salvar(proximo.questao, proximo.alternativa).then(
      (salva) => {
        if (parada) return
        aoSalvar(salva)
        publicar(confirmarEnvio(estado))
        bombear()
      },
      (erro: unknown) => {
        if (parada) return
        publicar(falharEnvio(estado, codigoDoErro(erro)))
        // Só a falha que passa sozinha é tentada de novo pelo relógio; a escolha fica na fila em qualquer uma.
        if (estado.falha === 'passageira') cancelarEspera = agendar(bombear, esperaAntesDeTentar(estado.tentativas))
      },
    )
  }

  return {
    ler: () => estado,
    assinar: (ouvinte) => {
      ouvintes.add(ouvinte)
      return () => {
        ouvintes.delete(ouvinte)
      }
    },
    escolher: (questao, alternativa) => {
      if (parada) return
      publicar(escolher(estado, questao, alternativa))
      bombear()
    },
    tentarAgora: bombear,
    parar: () => {
      parada = true
      cancelarEspera?.()
      cancelarEspera = undefined
      publicar(FILA_VAZIA)
    },
  }
}

/** A prova no cache com a resposta que o servidor acabou de confirmar: é dela que a tela lê "Resposta salva". */
export function provaComRespostaSalva(prova: RespostaProva, salva: Pick<RespostaQuestaoSalva, 'questao' | 'alternativa'>): RespostaProva {
  return { ...prova, respostas: [...prova.respostas.filter((resposta) => resposta.questao !== salva.questao), { questao: salva.questao, alternativa: salva.alternativa }] }
}

/** As filas desta aba, uma por atividade. Só em memória: some com a aba e com a sessão. */
const filas = new Map<string, FilaDeRespostas>()

function tentarTodas(): void {
  for (const fila of filas.values()) fila.tentarAgora()
}

// A pessoa seguinte no Chromebook do carrinho não herda a escolha da anterior, e nada da anterior é mandado com a sessão dela.
aoTrocarDeSessao(() => {
  for (const fila of filas.values()) fila.parar()
  filas.clear()
})
// A sessão voltou (o login por cima, a renovação): o que ficou esperando sai agora.
aoAbrirSessao(tentarTodas)
// A rede voltou: não se espera o relógio.
if (typeof window !== 'undefined') window.addEventListener('online', tentarTodas)

/** A fila da atividade, criada na primeira vez que a tela a pede. */
export function filaDaAtividade(cliente: QueryClient, atividadeAplicadaId: string): FilaDeRespostas {
  const existente = filas.get(atividadeAplicadaId)
  if (existente !== undefined) return existente
  const fila = criarFilaDeRespostas({
    salvar: (questao, alternativa) => responderQuestao(atividadeAplicadaId, questao, alternativa),
    aoSalvar: (salva) => {
      cliente.setQueryData(consultaProva(atividadeAplicadaId).queryKey, (prova) => (prova === undefined ? prova : provaComRespostaSalva(prova, salva)))
      // A lista de atividades conta as respondidas: ela é lida de novo quando o aluno voltar a ela.
      void cliente.invalidateQueries({ queryKey: CHAVE_DAS_MINHAS_ATIVIDADES, refetchType: 'none' })
    },
  })
  filas.set(atividadeAplicadaId, fila)
  return fila
}
