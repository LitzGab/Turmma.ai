import type { ChaveDeFuncao } from '@educa/shared'
import type { z } from 'zod'
import type { Perfil } from './perfis.js'

/**
 * O prompt de uma tarefa: um arquivo por tarefa em `prompts/`, com versão (regra 30, item 6). A versão vai para o
 * registro de consumo, porque é ela que responde "com que instrução a IA disse isso?" depois que o texto muda.
 */
export interface PromptVersionado {
  readonly versao: string
  readonly sistema: string
}

/**
 * Um pedaço de conteúdo que vai ao modelo como **dado**: trecho de material, texto escrito por aluno ou por professor,
 * números já calculados. O adaptador o cerca com `<dado …>` e diz ao modelo que nada ali é instrução.
 */
export interface Dado {
  readonly tipo: string
  readonly atributos?: Readonly<Record<string, string | number>>
  readonly corpo: string
}

/** O que a tarefa manda ao modelo: a instrução, escrita por nós, e os dados, que nunca são instrução. */
export interface PedidoAoModelo {
  readonly instrucao: string
  readonly dados: readonly Dado[]
}

/**
 * Uma tarefa de IA, como dado: o domínio escolhe a tarefa e entrega a entrada; o resto (função, perfil, prompt,
 * schema, conferência e a versão determinística) está declarado aqui e vale para qualquer adaptador.
 *
 * Toda tarefa é de saída estruturada: o que volta ao domínio já passou por `esquemaDeSaida` e por `conferir`
 * (regra 30, item 7).
 */
export interface TarefaDeIa<Entrada, Saida> {
  readonly nome: string
  /** A função do agente que gasta (D9, D14): é por ela que o consumo e a suspensão se registram. */
  readonly funcao: ChaveDeFuncao
  /** O mais barato que resolve (regra 30, item 2). */
  readonly perfil: Perfil
  /** Sempre `strictObject`, em todos os níveis: chave a mais (um nome, um diagnóstico) é entrada inválida. */
  readonly esquemaDeEntrada: z.ZodType<Entrada>
  readonly esquemaDeSaida: z.ZodType<Saida>
  readonly prompt: PromptVersionado
  /** Teto de tokens de saída por chamada: tarefa que não sabe parar queima a margem (D14). */
  readonly maximoDeTokensDeSaida: number
  /** A entrada leva texto escrito por aluno: só em provedor com processamento no Brasil, antes de aluno real (D62). */
  readonly levaTextoDeAluno: boolean
  montarPedido(entrada: Entrada): PedidoAoModelo
  /**
   * Resposta fixa, decidida por regra, **sem chamar o modelo**. É o caminho do assunto delicado no Tutor (D36): o
   * texto do aluno não segue para o provedor como conversa a continuar.
   */
  semModelo?(entrada: Entrada): Saida | undefined
  /** Troca o que o modelo não pode improvisar por texto fixo nosso, antes da conferência. */
  ajustar?(entrada: Entrada, saida: Saida): Saida
  /**
   * O que o schema não alcança: página citada que não veio nos trechos, gabarito trocado na adaptação, Tutor
   * entregando a resposta. Devolve os problemas em texto fixo, que voltam ao modelo na repetição; lista vazia é aprovado.
   */
  conferir?(entrada: Entrada, saida: Saida): readonly string[]
  /** A versão determinística, do adaptador falso: mesma entrada, mesma saída, feita só do que veio na entrada. */
  falso(entrada: Entrada): Saida
}

/**
 * A versão determinística não achou, nos trechos, nada de que tirar a saída (material só com sumário, por exemplo).
 * Ela não inventa conteúdo: lança isto, e o adaptador falso responde com saída inválida, como qualquer modelo que
 * não entregou.
 *
 * É uma classe própria, e não o `ErroDeIa`, para a tarefa não depender do resto da camada: tarefa é dado, e pode
 * ser lida por um teste de `tools/` sem trazer junto o provedor e os erros de domínio.
 */
export class MaterialSemConteudoAproveitavel extends Error {
  override readonly name = 'MaterialSemConteudoAproveitavel'
}

/** Só para o compilador tirar `Entrada` e `Saida` dos dois schemas. */
export function definirTarefa<Entrada, Saida>(tarefa: TarefaDeIa<Entrada, Saida>): TarefaDeIa<Entrada, Saida> {
  return tarefa
}
