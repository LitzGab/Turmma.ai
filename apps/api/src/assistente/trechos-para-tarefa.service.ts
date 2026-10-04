import type { Banco } from '@educa/nucleo'
import { TrechoParaTarefaRepository } from './trecho-para-tarefa.repository.js'

/** O maior texto de trecho que uma tarefa de IA aceita (`esquemaTrecho`, na camada de IA); a página guardada pode ter até 20.000 caracteres. */
export const TAMANHO_MAXIMO_DO_TRECHO_NA_TAREFA = 8000
/** Quantos termos da pergunta entram na busca: o pedido tem até 2.000 caracteres, e a consulta não precisa de todos. */
export const MAXIMO_DE_TERMOS_NA_BUSCA = 24

export interface PedidoDeTrechos {
  /** A disciplina cujo material se procura. **Quem chama já conferiu que a pessoa do contexto a alcança.** */
  readonly disciplinaId: string
  /** O tema da ferramenta, a mensagem do professor ou a dúvida do aluno. Não é gravado nem vai a log. */
  readonly tema: string
  readonly limite: number
}

/** Um trecho do material da escola, como a tarefa de IA o recebe e como a citação o aponta: material, página e texto. */
export interface TrechoParaTarefa {
  readonly materialId: string
  /** O título do material, para a tela e o PDF dizerem de onde veio. A tarefa não o recebe. */
  readonly titulo: string
  readonly pagina: number
  readonly texto: string
}

/**
 * A consulta de `websearch_to_tsquery` para um texto livre: as palavras dele ligadas por `or`. Sem isso, a função
 * exige todas as palavras na mesma página, e "monta uma atividade de estequiometria" não acharia a página que fala de
 * estequiometria, porque ela não diz "monta". O `ts_rank` põe na frente a página que tem mais das palavras. Só letras e
 * algarismos passam: aspas, sinal de menos e o resto da sintaxe da busca não chegam ao banco como operador.
 */
export function consultaDoTema(tema: string): string {
  const termos = tema.match(/[\p{L}\p{N}]+/gu) ?? []
  return [...new Set(termos.map((termo) => termo.toLowerCase()))].slice(0, MAXIMO_DE_TERMOS_NA_BUSCA).join(' or ')
}

/**
 * A busca de trechos **para as tarefas de IA** (o Assistente e as ferramentas aqui; o Tutor reusa): dada a disciplina
 * e o tema, os trechos do material da escola do contexto que mais têm a ver, até o limite, em ordem de material e
 * página, com o texto no tamanho que a tarefa aceita. Só material `pronto` e não excluído.
 *
 * É a mesma tabela da rota `GET /v1/materiais/busca`, com outra pergunta: lá o professor procura uma palavra; aqui a
 * tarefa precisa das páginas de onde vai citar. Sem trecho nenhum, devolve lista vazia, e quem chama decide: a
 * ferramenta falha com `MATERIAL_INSUFICIENTE`, a conversa segue sem citação.
 */
export class TrechosParaTarefa {
  constructor(private readonly banco: Banco) {}

  async buscar({ disciplinaId, tema, limite }: PedidoDeTrechos): Promise<TrechoParaTarefa[]> {
    const consulta = consultaDoTema(tema)
    if (consulta === '') return []
    const achados = await new TrechoParaTarefaRepository(this.banco).buscar(disciplinaId, consulta, limite)
    return achados
      .map((achado) => ({ ...achado, texto: achado.texto.slice(0, TAMANHO_MAXIMO_DO_TRECHO_NA_TAREFA) }))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR') || a.materialId.localeCompare(b.materialId) || a.pagina - b.pagina)
  }
}
