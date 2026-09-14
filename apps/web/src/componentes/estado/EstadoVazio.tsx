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
    <div className="rounded-lg border border-dashed border-slate-400 bg-white p-4">
      <p className="font-medium text-slate-900">{titulo}</p>
      <p className="mt-1 text-slate-700">{descricao}</p>
      {acao && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Botao onClick={acao.aoAcionar}>{acao.rotulo}</Botao>
          <span role="status" className="text-slate-700">
            {acao.emAndamento ? 'Verificando…' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
