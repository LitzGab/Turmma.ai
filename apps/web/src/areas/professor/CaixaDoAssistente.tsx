import type { Ferramenta } from '@educa/shared'
import { LayoutGrid, MessagesSquare } from 'lucide-react'
import { useState } from 'react'
import { CaixaPedido } from '../../componentes/ia/CaixaPedido'
import { Menu, type ItemDoMenu } from '../../componentes/Menu'
import { Selecao } from '../../componentes/Selecao'
import { CATALOGO_DE_FERRAMENTAS, ehFerramenta, ferramentaDoCatalogo, iniciaisDoPedido } from './ferramentas'
import { abrirCartaoNaConversa, CARTAO_DA_CONVERSA, CONTEXTO_ESCOLHIDO, type PedidoDaConversa } from './memoria-do-professor'
import type { TurmaDaProfessora } from './turmas-da-professora'

/** O pedido sem ferramenta escolhida: o Assistente lê o pedido e pergunta antes de abrir uma (D18). */
const SEM_FERRAMENTA = 'nenhuma'

/**
 * O menu **Ferramenta** da caixa de pedido (11.2; P17): lê o mesmo catálogo da página de Ferramentas, e só o que existe.
 * A primeira linha desfaz a escolha.
 */
const ITENS_DO_MENU: readonly ItemDoMenu[] = [
  { id: SEM_FERRAMENTA, rotulo: 'Sem ferramenta', descricao: 'O Assistente lê o pedido e pergunta antes de abrir uma.', icone: MessagesSquare },
  ...CATALOGO_DE_FERRAMENTAS.map((item) => ({ id: item.ferramenta, rotulo: item.nome, descricao: item.descricao, icone: item.icone })),
]

interface PropsDaCaixa {
  /** As turmas com vínculo confirmado da professora, e a escolhida. Sem turma não há caixa: quem usa mostra o que falta. */
  readonly turmas: readonly TurmaDaProfessora[]
  readonly turma: TurmaDaProfessora
  /** Manda o pedido ao Assistente. Devolve `false`, sem mandar, com outro pedido ainda no ar. */
  readonly iniciar: (pedido: PedidoDaConversa) => boolean
  /** Um pedido ao Assistente está no ar: outro não sai. */
  readonly respondendo: boolean
  /** A escola suspendeu a função, ou um cartão de ferramenta está aberto: a caixa não aceita pedido. */
  readonly desligada: boolean
  /** O pedido saiu, ou o cartão de uma ferramenta abriu: a Home leva à conversa. */
  readonly depois?: () => void
}

/**
 * A caixa de pedido do Assistente de ensino, a mesma na Home e no pé da conversa (`docs/interface.md` 11.2 e 11.3). À
 * esquerda o que muda o pedido (a **Ferramenta**), à direita o contexto (a **turma e a disciplina**). Enviar:
 * - sem ferramenta, manda o pedido ao Assistente, que responde ou pergunta se ela quer a ferramenta (D18);
 * - com a atividade ou o plano escolhidos, abre o cartão da ferramenta com a turma e o tema do pedido, sem gastar um
 *   pedido perguntando o que ela já disse;
 * - a **Adaptação** abre o cartão dela ao ser escolhida, e **nunca recebe o que foi escrito na caixa** (D35, D67).
 *
 * O texto é limpo e o estado muda na hora do envio, sem esperar resposta nenhuma: o segundo Enter não manda de novo.
 */
export function CaixaDoAssistente({ turmas, turma, iniciar, respondendo, desligada, depois }: PropsDaCaixa) {
  const [texto, definirTexto] = useState('')
  const [ferramenta, definirFerramenta] = useState<Ferramenta | typeof SEM_FERRAMENTA>(SEM_FERRAMENTA)
  const escolhida = ferramenta === SEM_FERRAMENTA ? undefined : ferramentaDoCatalogo(ferramenta)

  function abrirCartao(daFerramenta: Ferramenta, pedido: string): void {
    abrirCartaoNaConversa({ ferramenta: daFerramenta, iniciais: iniciaisDoPedido(daFerramenta, pedido, turma.valor) })
    definirFerramenta(SEM_FERRAMENTA)
    depois?.()
  }

  function aoEscolherFerramenta(id: string): void {
    if (!ehFerramenta(id)) {
      definirFerramenta(SEM_FERRAMENTA)
      return
    }
    // A Adaptação não espera o enviar nem lê a caixa: abre o cartão dela, com a lista de tipos.
    if (id === 'adaptacao') abrirCartao(id, '')
    else definirFerramenta(id)
  }

  function aoEnviar(pedido: string): void {
    if (ferramenta !== SEM_FERRAMENTA) {
      definirTexto('')
      abrirCartao(ferramenta, pedido)
      return
    }
    // `iniciar` grava o pedido como enviado antes de devolver: o segundo Enter encontra o pedido no ar.
    if (!iniciar({ texto: pedido, turmaId: turma.turmaId, disciplinaId: turma.disciplinaId })) return
    definirTexto('')
    CARTAO_DA_CONVERSA.guardar(undefined)
    depois?.()
  }

  return (
    <CaixaPedido
      rotulo="Pedido ao Assistente de ensino"
      exemplo={escolhida === undefined ? 'Peça uma atividade, um plano de aula…' : `O tema para ${escolhida.nome.toLocaleLowerCase('pt-BR')}…`}
      valor={texto}
      aoMudar={definirTexto}
      aoEnviar={aoEnviar}
      estado={desligada ? 'desligada' : respondendo ? 'gerando' : 'pronta'}
      esquerda={
        <Menu
          rotulo={escolhida?.nome ?? 'Ferramenta'}
          {...(escolhida === undefined ? {} : { prefixo: 'Ferramenta' })}
          icone={LayoutGrid}
          titulo="Ferramentas"
          itens={ITENS_DO_MENU}
          escolhido={ferramenta}
          aoEscolher={aoEscolherFerramenta}
          variante="discreto"
          desligado={desligada}
        />
      }
      direita={<Selecao variante="pilula" rotulo="Turma e disciplina" opcoes={turmas.map((item) => ({ valor: item.valor, rotulo: item.rotulo }))} valor={turma.valor} aoMudar={CONTEXTO_ESCOLHIDO.guardar} desligada={desligada} />}
    />
  )
}
