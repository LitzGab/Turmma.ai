import { mensagemDoErro } from '../../api/cliente'
import { Botao } from '../Botao'

interface Props {
  /** O erro da consulta. A mensagem vem do catálogo pelo código; status HTTP nunca aparece. */
  erro: unknown
  aoTentarDeNovo: () => void
  /** Uma nova tentativa já está em andamento. */
  tentando?: boolean
}

/** O alerta é só a mensagem; o botão fica fora dele, e o "tentando" é anunciado como status. */
export function EstadoErro({ erro, aoTentarDeNovo, tentando = false }: Props) {
  return (
    <div className="rounded-cartao border border-erro bg-erro-cx p-4">
      <p role="alert" className="text-erro">
        {mensagemDoErro(erro)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Botao onClick={aoTentarDeNovo}>Tentar de novo</Botao>
        <span role="status" className="text-erro">
          {tentando ? 'Tentando de novo…' : ''}
        </span>
      </div>
    </div>
  )
}
