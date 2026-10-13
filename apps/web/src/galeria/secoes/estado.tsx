import { Eye, Inbox } from 'lucide-react'
import { useState } from 'react'
import { Abas } from '../../componentes/Abas'
import { BarraRotulada } from '../../componentes/BarraRotulada'
import { Cartao } from '../../componentes/Cartao'
import { EstadoVazio } from '../../componentes/estado'
import { Faixa } from '../../componentes/Faixa'
import { NumeroPainel } from '../../componentes/NumeroPainel'
import { Estado } from '../../componentes/SeloDeEstado'
import { Secao } from '../Secao'

const ABAS = [
  { id: 'visao-geral', rotulo: 'Visão geral' },
  { id: 'alunos', rotulo: 'Alunos', contador: 2, oQueConta: 'pedidos de nome' },
  { id: 'atividades', rotulo: 'Atividades' },
]

export default function SecoesDeEstado() {
  const [aba, definirAba] = useState('visao-geral')
  return (
    <>
      <Secao nome="estado" titulo="Selo de estado">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Estado familia="pendente" />
          <Estado familia="ok">Aprovado</Estado>
          <Estado familia="erro">Rejeitado</Estado>
          <Estado familia="info">Faz e avisa</Estado>
        </div>
        <Faixa icone={Eye}>Seu professor acompanha como você usa o Tutor.</Faixa>
      </Secao>

      <Secao nome="painel" titulo="Número de painel e barra">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <NumeroPainel rotulo="Gerado por IA" valor={1412} />
          <NumeroPainel rotulo="Consumo do mês" valor="61%" apoio={<BarraRotulada rotulo="Do orçamento" valor={61} />} />
        </div>
        <Cartao titulo="Acerto por habilidade" nivel={3}>
          <div className="flex min-w-0 flex-col gap-4">
            <BarraRotulada rotulo="Cálculo estequiométrico" valor={72} detalhe="EM13CNT101 · 4 questões" />
            <BarraRotulada rotulo="Hoje" valor={12} maximo={60} texto="12 de 60 perguntas" />
          </div>
        </Cartao>
        <EstadoVazio variante="tracejado" icone={Inbox} titulo="Nenhuma correção aprovada ainda" descricao="O acerto por habilidade aparece aqui depois que você aprova a correção de uma atividade da turma." />
      </Secao>

      <Secao nome="abas" titulo="Abas">
        <Abas rotulo="Seções da turma" abas={ABAS} ativa={aba} aoMudar={definirAba}>
          <p className="text-apoio">Conteúdo de {ABAS.find((item) => item.id === aba)?.rotulo}.</p>
        </Abas>
        {/* A aba ativa que não existe na lista: a primeira continua alcançável pelo Tab. */}
        <div data-abas="sem-ativa">
          <Abas rotulo="Abas com a ativa fora da lista" abas={ABAS} ativa="aba-que-sumiu" aoMudar={() => undefined}>
            <p className="text-apoio">Escolha uma aba.</p>
          </Abas>
        </div>
      </Secao>
    </>
  )
}
