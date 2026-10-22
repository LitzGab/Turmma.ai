import type { LucideIcon } from 'lucide-react'
import { Botao } from '../ui/Botao'

interface Props {
  titulo: string
  /** O que vai aparecer aqui e o que a pessoa pode fazer: vazio é convite para agir, não desculpa. */
  descricao: string
  /**
   * `emAndamento` mostra que o toque foi recebido, para a rede lenta não parecer tela quebrada. `desligada` é o botão que
   * não aceita outro toque enquanto o pedido que ele fez está no ar (o resumo do Analista): o texto dele diz o que acontece.
   */
  acao?: { rotulo: string; aoAcionar: () => void; emAndamento?: boolean; desligada?: boolean }
  /**
   * `tracejado` é o vazio que ocupa o lugar de um bloco inteiro da tela — a turma sem correção aprovada, onde entrariam
   * as barras de acerto por habilidade —: centralizado, com mais respiro e, se houver, um ícone em cima. O padrão é o
   * vazio de lista, alinhado à esquerda.
   */
  variante?: 'padrao' | 'tracejado'
  /** Só no `tracejado`. É enfeite: o título já diz o que falta. */
  icone?: LucideIcon
}

/**
 * O estado vazio (`docs/interface.md` 10.2): o título em `t-secao`, o que vai aparecer ali e o que a pessoa pode fazer, e
 * uma ação. É convite para agir, e não pedido de desculpas (regra 50, item 5). A borda é de 2 px, **tracejada em
 * `borda-campo`** (3:1 contra o chão): o tracejado é o que diz "aqui falta algo", e a cor clara da `borda` o apagaria.
 * Sem onça nesta spec: a que dorme é da X2, com parecer (9.7).
 *
 * Esta peça mora na entrada (Tech Spec da X1, seção 7c): só importa o `Botao`, e nenhuma das peças que ficam fora dela.
 */
export function EstadoVazio({ titulo, descricao, acao, variante = 'padrao', icone: Icone }: Props) {
  const tracejado = variante === 'tracejado'
  return (
    <div className={`rounded-cartao border-2 border-dashed border-borda-campo bg-superficie ${tracejado ? 'flex flex-col items-center px-4 py-10 text-center' : 'p-4'}`}>
      {tracejado && Icone !== undefined && <Icone aria-hidden="true" size={24} strokeWidth={1.75} className="mb-3 text-sutil" />}
      <p className="t-secao text-tinta">{titulo}</p>
      <p className={`t-apoio mt-1 text-apoio ${tracejado ? 'max-w-prose' : ''}`}>{descricao}</p>
      {acao && (
        <div className={`mt-3 flex flex-wrap items-center gap-3 ${tracejado ? 'justify-center' : ''}`}>
          <Botao onClick={acao.aoAcionar} disabled={acao.desligada === true}>
            {acao.rotulo}
          </Botao>
          <span role="status" className="t-apoio text-apoio">
            {acao.emAndamento ? 'Verificando…' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
