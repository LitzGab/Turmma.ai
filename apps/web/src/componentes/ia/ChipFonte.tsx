import type { Citacao } from '@educa/shared'
import { FileText } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { estiloDoRecuo, useFlutuante } from '../flutuante'
import { nomeDoChip, textoDoChip, tituloDoMaterial, type TitulosDosMateriais } from './textos-das-fontes'

interface PropsDoChip {
  readonly citacao: Citacao
  /** Os títulos dos materiais, pelo id: a citação traz só o `materialId`. */
  readonly materiais: TitulosDosMateriais
}

/** A altura que o cartão da fonte costuma ter, para decidir se abre para baixo ou para cima. */
const ALTURA_DO_CARTAO = 220

/**
 * O chip de fonte, `p. 142`, dentro do texto da IA (`docs/interface.md` 11.3), em família `ia`. Ao ativar, mostra **o
 * material, a página e o trecho**: é por aqui que a professora confere, de relance, de onde a questão saiu (D6).
 *
 * - **Abre por clique, por toque e pelo teclado** (Enter ou Espaço), e não por hover: no Chromebook de toque e no
 *   celular não existe hover (regra 50, item 2a). É um botão com `aria-expanded`, e o cartão vem logo depois dele na
 *   ordem de leitura.
 * - **Fecha** pelo mesmo botão, pelo Esc (com o foco de volta no chip) e pelo toque fora.
 * - **Cabe dentro de um parágrafo**: é feito só de `span`, e o alvo tem 24 px de altura, a da linha do texto.
 * - **Não passa da janela a 360 px**: a posição é medida na abertura (`flutuante.ts`).
 *
 * Fonte de fora leva outro chip, "da web", de desenho diferente (D68), que nasce com a busca na web, fora do MVP.
 */
export function ChipFonte({ citacao, materiais }: PropsDoChip) {
  const [aberto, definirAberto] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  const idDoCartao = useId()
  const { ancora, posicao } = useFlutuante<HTMLSpanElement>({ aberto, aoFechar: () => definirAberto(false), alinhamento: 'inicio', lado: 'auto', altura: ALTURA_DO_CARTAO })
  const nome = nomeDoChip(citacao, materiais)
  const visivel = textoDoChip(citacao.pagina)

  function aoTeclar(evento: KeyboardEvent<HTMLSpanElement>): void {
    if (evento.key !== 'Escape' || !aberto) return
    // O Esc é do chip: dentro de um diálogo, ele fecha o cartão da fonte, e não o diálogo.
    evento.preventDefault()
    evento.stopPropagation()
    definirAberto(false)
    botao.current?.focus()
  }

  return (
    <span ref={ancora} onKeyDown={aoTeclar} className="relative mx-0.5 inline-block align-baseline">
      <button
        ref={botao}
        type="button"
        aria-expanded={aberto}
        {...(aberto ? { 'aria-controls': idDoCartao } : {})}
        onClick={() => definirAberto((estava) => !estava)}
        className={`inline-flex min-h-6 min-w-6 items-center gap-1 rounded-lg px-2 text-[13px] leading-none font-medium whitespace-nowrap text-ia hover:bg-realce ${aberto ? 'bg-realce' : 'bg-ia-cx'}`}
      >
        <FileText aria-hidden="true" size={12} strokeWidth={2} className="shrink-0" />
        <span className="sr-only">{nome.slice(0, nome.length - visivel.length)}</span>
        {visivel}
      </button>
      {aberto && (
        <span
          id={idDoCartao}
          role="group"
          aria-label={nome}
          style={estiloDoRecuo('inicio', posicao.recuo)}
          className={`absolute z-30 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-1 rounded-cartao bg-superficie p-4 text-left text-sm font-normal whitespace-normal shadow-flutua ${posicao.lado === 'acima' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          <span className="text-[13px] font-medium text-sutil">Material da escola</span>
          <span className="font-semibold break-words text-tinta">{tituloDoMaterial(citacao.materialId, materiais)}</span>
          <span className="text-sutil">Página {citacao.pagina}</span>
          <span className="mt-2 rounded-linha bg-realce-suave p-3 leading-relaxed break-words text-apoio">“{citacao.trecho}”</span>
        </span>
      )}
    </span>
  )
}
