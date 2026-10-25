import { Tela } from '../../componentes/ui/Tela'
import { useTituloDaTela } from '../../titulo'
import { EscolhaDaAtividade } from './EscolhaDaAtividade'
import { FaixaDeSupervisao } from './FaixaDeSupervisao'

/**
 * "Início" do aluno (telas do aluno e primeiro acesso, 2.0; RF1, RF2, RF4): é onde ele abre. Por enquanto reúne o que o
 * Tutor mostrava ao ser aberto, sem mudar texto: a faixa de supervisão, presa e sem fechar (D8), e a escolha da atividade
 * em que quer ajuda. A saudação, o "Para fazer" e o aviso da avaliação são da 3.0.
 *
 * Nenhum dado de colega, nenhum número de uso e nada que empurre (regra 50, item 9; D59). É aba de navegação: o `<h1>` existe
 * só para o leitor de tela, como o do Tutor, porque a tela começa pelo que o Tutor diz.
 */
export default function Inicio() {
  useTituloDaTela('Início')
  return (
    <Tela titulo="Início" largura="conversa" tituloSoParaLeitor>
      <FaixaDeSupervisao />
      <EscolhaDaAtividade />
    </Tela>
  )
}
