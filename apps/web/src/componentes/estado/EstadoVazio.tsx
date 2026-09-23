import { Botao } from '../Botao'

interface Props {
  titulo: string
  /** O que vai aparecer aqui e o que a pessoa pode fazer: vazio é convite para agir, não desculpa. */
  descricao: string
  /** `emAndamento` mostra que o toque foi recebido, para a rede lenta não parecer tela quebrada. */
  acao?: { rotulo: string; aoAcionar: () => void; emAndamento?: boolean }
}

export function EstadoVazio({ titulo, descricao, acao }: Props) {
  return (
    <div className="rounded-cartao border border-dashed border-borda-campo bg-superficie p-4">
      <p className="font-medium text-tinta">{titulo}</p>
      <p className="mt-1 text-apoio">{descricao}</p>
      {acao && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Botao onClick={acao.aoAcionar}>{acao.rotulo}</Botao>
          <span role="status" className="text-apoio">
            {acao.emAndamento ? 'Verificando…' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
