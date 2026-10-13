import { FileDown, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Botao } from '../../componentes/Botao'
import { CampoLongo } from '../../componentes/CampoLongo'
import { Menu } from '../../componentes/Menu'
import { Selecao } from '../../componentes/Selecao'
import { TURMAS } from '../dados'
import { Secao } from '../Secao'

export default function SecoesDeCampos() {
  const [turma, definirTurma] = useState('')
  const [acao, definirAcao] = useState('')
  const [observacao, definirObservacao] = useState('')
  return (
    <Secao nome="selecao-e-menu" titulo="Seleção e menu">
      <Selecao rotulo="Turma" obrigatoria marcador="Escolha a turma" opcoes={TURMAS} valor={turma} aoMudar={definirTurma} dica="A turma em que a atividade vai ser aplicada." />
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Menu
          rotulo="Ações da atividade"
          variante="discreto"
          itens={[
            { id: 'exportar', rotulo: 'Exportar em PDF', icone: FileDown },
            { id: 'adaptar', rotulo: 'Gerar versão adaptada', icone: SlidersHorizontal },
            { id: 'aplicar', rotulo: 'Aplicar à turma', descricao: 'Só depois de aprovada', desabilitado: true },
            { id: 'excluir', rotulo: 'Excluir', perigo: true },
          ]}
          aoEscolher={definirAcao}
        />
        {/* Um botão ao lado do menu, para o e2e provar que o toque fora do menu aberto só o fecha, sem acionar o vizinho. */}
        <Botao variante="secundario" tamanho="compacto" onClick={() => definirAcao('vizinho')}>
          Vizinho
        </Botao>
        <p role="status" data-acao="" className="text-sm text-sutil">
          {acao === '' ? '' : `Escolhido: ${acao}`}
        </p>
      </div>
      <CampoLongo rotulo="Observação" dica="Até 200 caracteres." valor={observacao} aoMudar={definirObservacao} maximo={200} />
    </Secao>
  )
}
