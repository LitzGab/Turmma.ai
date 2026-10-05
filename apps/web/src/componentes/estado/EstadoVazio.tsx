import type { LucideIcon } from 'lucide-react'
import { Botao } from '../Botao'

interface Props {
  titulo: string
  /** O que vai aparecer aqui e o que a pessoa pode fazer: vazio é convite para agir, não desculpa. */
  descricao: string
  /** `emAndamento` mostra que o toque foi recebido, para a rede lenta não parecer tela quebrada. */
  acao?: { rotulo: string; aoAcionar: () => void; emAndamento?: boolean }
  /**
   * `tracejado` é o vazio que ocupa o lugar de um bloco inteiro da tela — a turma sem correção aprovada, onde entrariam
   * as barras de acerto por habilidade —: centralizado, com mais respiro e, se houver, um ícone em cima. O padrão é o
   * vazio de lista, alinhado à esquerda.
   */
  variante?: 'padrao' | 'tracejado'
  /** Só no `tracejado`. É enfeite: o título já diz o que falta. */
  icone?: LucideIcon
}

export function EstadoVazio({ titulo, descricao, acao, variante = 'padrao', icone: Icone }: Props) {
  const tracejado = variante === 'tracejado'
  return (
    <div className={`rounded-cartao border border-dashed border-borda-campo bg-superficie ${tracejado ? 'flex flex-col items-center px-4 py-10 text-center' : 'p-4'}`}>
      {tracejado && Icone !== undefined && <Icone aria-hidden="true" size={24} strokeWidth={1.75} className="mb-3 text-sutil" />}
      <p className="font-medium text-tinta">{titulo}</p>
      <p className={`mt-1 text-apoio ${tracejado ? 'max-w-prose' : ''}`}>{descricao}</p>
      {acao && (
        <div className={`mt-3 flex flex-wrap items-center gap-3 ${tracejado ? 'justify-center' : ''}`}>
          <Botao onClick={acao.aoAcionar}>{acao.rotulo}</Botao>
          <span role="status" className="text-apoio">
            {acao.emAndamento ? 'Verificando…' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
