import { Check, type LucideIcon } from 'lucide-react'
import { useId } from 'react'

export interface OpcaoDeEscolha {
  readonly id: string
  /** O que a opção faz: "Usar a ferramenta Atividade". */
  readonly titulo: string
  /** A consequência, numa frase: "Salva na biblioteca, liga à turma e cita a página." */
  readonly descricao: string
  readonly icone: LucideIcon
}

interface PropsDaEscolha {
  /** A frase do Assistente: "Posso fazer isso com a ferramenta Atividade, ou só conversar." */
  readonly pergunta: string
  /** **Duas** opções, pelo tipo: é a pergunta da D18, e não um menu. */
  readonly opcoes: readonly [OpcaoDeEscolha, OpcaoDeEscolha]
  /** O id da opção escolhida. Com ele, o cartão encolhe para uma linha. */
  readonly escolhida?: string | undefined
  readonly aoEscolher: (id: string) => void
  /** A escolha já saiu e a resposta não chegou: as duas opções desligam juntas, e um segundo clique não escolhe de novo. */
  readonly desligada?: boolean
}

/** O desenho de uma opção. **É uma constante só, para as duas**: nenhuma tem estilo de primária. */
const CLASSES_DA_OPCAO =
  'flex min-h-11 w-full min-w-0 items-start gap-3 rounded-controle border border-borda-campo bg-superficie p-3 text-left text-tinta enabled:hover:bg-realce-suave enabled:active:bg-realce disabled:text-inativo'

/**
 * A pergunta da D18 — "quer usar a ferramenta?" — dentro da conversa (`docs/interface.md` 11.3; P16): uma frase do
 * Assistente e um cartão estreito com **duas opções do mesmo peso**, cada uma com ícone, título e uma frase.
 *
 * **Nenhuma das duas é a "certa"** (D59): as duas têm o mesmo desenho (o do botão `secundario`), o mesmo tamanho — a
 * grade dá a mesma largura e a mesma altura às duas, lado a lado ou empilhadas — e nenhuma vem marcada, destacada nem
 * com o foco. Um clique escolhe: não há "selecionar e depois enviar".
 *
 * Depois da escolha o cartão **encolhe para uma linha** que diz o que foi escolhido, e não deixa escolher de novo: a
 * conversa segue dali.
 */
export function Escolha({ pergunta, opcoes, escolhida, aoEscolher, desligada = false }: PropsDaEscolha) {
  const idDaPergunta = useId()
  const feita = opcoes.find((opcao) => opcao.id === escolhida)
  if (feita !== undefined)
    return (
      <p data-escolha="feita" className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full bg-realce-suave px-3 py-1.5 text-sm text-apoio">
        <Check aria-hidden="true" size={14} strokeWidth={2.4} className="shrink-0" />
        <span className="min-w-0 break-words">
          Você escolheu: <span className="font-medium text-tinta">{feita.titulo}</span>
        </span>
      </p>
    )
  return (
    <div role="group" aria-labelledby={idDaPergunta} data-escolha="aberta" className="flex w-full max-w-[520px] min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-3">
      <p id={idDaPergunta} className="px-1 text-base break-words text-tinta">
        {pergunta}
      </p>
      <div className="grid auto-rows-fr grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {opcoes.map((opcao) => {
          const Icone = opcao.icone
          return (
            <button key={opcao.id} type="button" disabled={desligada} onClick={() => aoEscolher(opcao.id)} className={CLASSES_DA_OPCAO}>
              <Icone aria-hidden="true" size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium break-words">{opcao.titulo}</span>
                <span className={`text-sm break-words ${desligada ? '' : 'text-sutil'}`}>{opcao.descricao}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
