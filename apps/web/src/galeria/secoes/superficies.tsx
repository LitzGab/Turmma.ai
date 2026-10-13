import { Ellipsis, FileDown } from 'lucide-react'
import { Botao } from '../../componentes/Botao'
import { BarraPresa } from '../../componentes/BarraPresa'
import type { Aprovacao } from '../../componentes/ia/aprovacao'
import { AssinaturaIA } from '../../componentes/ia/AssinaturaIA'
import { LinhaAprovacao } from '../../componentes/ia/LinhaAprovacao'
import { Menu } from '../../componentes/Menu'
import { Tabela, type ColunaDaTabela } from '../../componentes/Tabela'
import { QUANDO } from '../dados'
import { Secao } from '../Secao'

interface Registro {
  readonly id: string
  readonly oQue: string
  readonly funcao: 'correcao_de_objetiva' | 'adaptacao' | 'conversa_e_ferramentas'
  readonly turma: string
  readonly aprovacao: Aprovacao
}

const REGISTROS: readonly Registro[] = [
  { id: 'r1', oQue: 'Correção da lista 3', funcao: 'correcao_de_objetiva', turma: '2ºB', aprovacao: { estado: 'aprovada', por: 'Camila Souza', quando: QUANDO } },
  { id: 'r2', oQue: 'Versão com fonte ampliada', funcao: 'adaptacao', turma: '2ºB', aprovacao: { estado: 'pendente' } },
  { id: 'r3', oQue: 'Atividade de estequiometria', funcao: 'conversa_e_ferramentas', turma: '1ºA', aprovacao: { estado: 'rejeitada', por: 'Camila Souza', quando: QUANDO, motivo: 'A questão 3 não é do capítulo 7.' } },
]

const DESTAQUES = ['Ana B. · em branco', 'Caio M. · muito abaixo do histórico', 'Questão 7 · erro em 28 de 32', 'Davi R. · em branco', 'Elis T. · padrão de erro', 'Fábio L. · em branco']

const COLUNAS_SEM_MENU: readonly [ColunaDaTabela<Registro>, ...ColunaDaTabela<Registro>[]] = [
  { chave: 'oQue', titulo: 'O quê', celula: (registro) => registro.oQue },
  { chave: 'funcao', titulo: 'Agente e função', celula: (registro) => <AssinaturaIA funcao={registro.funcao} /> },
  { chave: 'turma', titulo: 'Turma', celula: (registro) => registro.turma },
  { chave: 'estado', titulo: 'Aprovação', celula: (registro) => <LinhaAprovacao aprovacao={registro.aprovacao} espera="Esperando o professor" /> },
]

const COLUNAS: readonly [ColunaDaTabela<Registro>, ...ColunaDaTabela<Registro>[]] = [
  ...COLUNAS_SEM_MENU,
  {
    chave: 'acoes',
    titulo: 'Ações',
    alinhamento: 'fim',
    celula: (registro) => <Menu rotulo={`Ações de ${registro.oQue}`} icone={Ellipsis} soIcone variante="discreto" alinhamento="fim" itens={[{ id: 'abrir', rotulo: 'Abrir' }, { id: 'exportar', rotulo: 'Exportar em PDF', icone: FileDown }]} aoEscolher={() => undefined} />,
  },
]

export default function SecoesDeSuperficies() {
  return (
    <>
      <Secao nome="barra-presa" titulo="Barra presa embaixo">
        {/* A lista rola dentro desta caixa, e a barra é o último filho dela: gruda no pé e não cobre o último item. */}
        <div data-rolagem="" className="flex h-64 min-w-0 flex-col overflow-y-auto rounded-cartao border border-linha px-4">
          <ul className="flex min-w-0 flex-1 flex-col gap-2 py-4">
            {DESTAQUES.map((destaque) => (
              <li key={destaque} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-controle border border-linha p-3">
                <span className="min-w-0 break-words">{destaque}</span>
                {/* Um controle em cada item: é o que o Tab alcança no meio da lista, atrás de onde a barra está. */}
                <Botao variante="secundario" tamanho="compacto">
                  Abrir
                </Botao>
              </li>
            ))}
          </ul>
          <BarraPresa rotulo="Aprovação do lote" informacao="3 de 5 destaques abertos">
            <Botao variante="perigo">Rejeitar</Botao>
            <Botao variante="oficial" disabled>
              Aprovar 32 correções
            </Botao>
          </BarraPresa>
        </div>
      </Secao>

      <Secao nome="tabela" titulo="Tabela que vira lista">
        <Tabela rotulo="O que a IA gerou e quem aprovou" colunas={COLUNAS} linhas={REGISTROS} chaveDaLinha={(registro) => registro.id} />
        {/* A mesma tabela num lugar onde não cabe: aí, e só aí, a região que rola recebe foco. */}
        <div data-tabela-estreita="" className="max-w-[280px]">
          <Tabela rotulo="Tabela que não cabe" colunas={COLUNAS_SEM_MENU} linhas={REGISTROS} chaveDaLinha={(registro) => registro.id} />
        </div>
      </Secao>
    </>
  )
}
