import type { ReactNode } from 'react'
import { Sino, type ItemDoSino } from '../../componentes/sino/Sino'
import { Secao } from '../Secao'

/** Os itens de exemplo: nomes e turmas inventados, nenhum de ninguém (regra 20, item 17). */
const URGENTE: ItemDoSino = { id: 'a', titulo: 'Incidente de segurança sem confirmação', detalhe: 'Avisado em 01/10/2026. Confirme que recebeu.', urgente: true, para: '/galeria#sino' }
const CONVITE: ItemDoSino = { id: 'b', titulo: 'Refazer o convite de Paulo Sintético', detalhe: 'O convite venceu antes de ser aceito.', urgente: false, para: '/galeria#sino' }
const CONTESTACAO: ItemDoSino = { id: 'c', titulo: 'Camila Sintética contestou a turma', detalhe: '7º A · Química', urgente: false, para: '/galeria#sino' }
const TURMAS: ItemDoSino = {
  id: 'd',
  titulo: 'Turmas sem professor',
  detalhe: 'Aloque um professor em cada uma.',
  urgente: false,
  para: '/galeria#sino',
  contador: { n: 3, oQueConta: 'turmas sem professor' },
}

const SEM_FUNCAO = () => undefined
const FALTA_PARA = '/galeria#sino'

function Exemplo({ rotulo, children }: { readonly rotulo: string; readonly children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-cartao border-2 border-borda bg-superficie p-3">
      <p className="t-apoio min-w-0 break-words text-apoio">{rotulo}</p>
      {children}
    </div>
  )
}

/**
 * O sino da coordenação nos estados dele (telas da coordenação, 1.0): com itens, vazio ("Tudo em dia", sem mascote),
 * lendo, parcial e com erro. Cada botão abre a lista no painel ao lado, com dado inventado; nada aqui lê a API.
 */
export default function SecoesDoSino() {
  return (
    <Secao nome="sino" titulo="Sino «Esperando você»">
      <div className="flex min-w-0 flex-col gap-3">
        <Exemplo rotulo="Com itens, nos dois grupos">
          <Sino itens={[URGENTE, CONVITE, CONTESTACAO, TURMAS]} situacao="pronta" aoTentarDeNovo={SEM_FUNCAO} aoAtualizar={SEM_FUNCAO} atualizadoEm={new Date(2026, 9, 16, 9, 30)} faltaPara={FALTA_PARA} />
        </Exemplo>
        <Exemplo rotulo="Vazio: tudo lido e nada espera">
          <Sino itens={[]} situacao="pronta" aoTentarDeNovo={SEM_FUNCAO} aoAtualizar={SEM_FUNCAO} atualizadoEm={new Date(2026, 9, 16, 9, 30)} faltaPara={FALTA_PARA} />
        </Exemplo>
        <Exemplo rotulo="Carregando">
          <Sino itens={[]} situacao="carregando" aoTentarDeNovo={SEM_FUNCAO} aoAtualizar={SEM_FUNCAO} faltaPara={FALTA_PARA} />
        </Exemplo>
        <Exemplo rotulo="Parcial: parte da lista não carregou">
          <Sino itens={[CONVITE]} situacao="parcial" aoTentarDeNovo={SEM_FUNCAO} aoAtualizar={SEM_FUNCAO} atualizadoEm={new Date(2026, 9, 16, 9, 30)} faltaPara={FALTA_PARA} />
        </Exemplo>
        <Exemplo rotulo="Erro: nada carregou">
          <Sino itens={[]} situacao="erro" erro={new Error('sem rede')} aoTentarDeNovo={SEM_FUNCAO} aoAtualizar={SEM_FUNCAO} faltaPara={FALTA_PARA} />
        </Exemplo>
      </div>
    </Secao>
  )
}
