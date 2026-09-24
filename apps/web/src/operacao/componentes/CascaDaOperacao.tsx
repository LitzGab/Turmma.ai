import type { ReactNode } from 'react'
import { Botao } from '../../componentes/Botao'
import { textoDaFalha } from '../textos'

/**
 * A faixa "Operação Turmma" em `noite` (Tech Spec da A0, seção 9; `docs/interface.md` 5a): a pele é a do produto, com a
 * marca de que ali é a operação, para ninguém confundir com a tela de uma escola. Dentro dela o anel de foco é
 * `caramelo-noite` (regra `.bg-noite :focus-visible` de `estilos.css`), porque o preto some sobre o preto.
 */
function Faixa({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-noite text-white">
      <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <p className="inline-flex shrink-0 items-center gap-2 text-lg font-semibold">
          <img src="/marca/turmma-pinta.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
          Operação Turmma
        </p>
        {children}
      </div>
    </header>
  )
}

/**
 * A casca das telas de fora da sessão da operação: entrar e o segundo fator. Coluna única a partir de 360 px, presa em
 * `max-w-md` para o formulário de dois campos não se espalhar no Chromebook (regra 50, item 2a). Sem "Sair": não há
 * sessão ainda.
 */
export function CascaPublicaDaOperacao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-fundo text-tinta">
      <Faixa />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold sm:text-2xl">{titulo}</h1>
        {children}
      </main>
    </div>
  )
}

interface PropsDaCasca {
  /** O `<h1>` da rota, só para o leitor de tela: a faixa já diz onde a pessoa está (`docs/interface.md` 6, P03). */
  readonly titulo: string
  /** O nome do operador, quando o `/eu` já respondeu. */
  readonly nome?: string | undefined
  readonly aoSair: () => void
  readonly saindo: boolean
  readonly children: ReactNode
}

/**
 * A casca da operação com a sessão aberta: a faixa com o nome de quem entrou e o **Sair** a um clique, em toda tela,
 * do mesmo tamanho de qualquer outra ação (D59; PRD da A0, seção 6). Sem menu: o painel (escolas, uso) é da A0b, e
 * cada item de navegação nasce com a fase dele (`docs/interface.md` 11.1).
 */
export function CascaDaOperacao({ titulo, nome, aoSair, saindo, children }: PropsDaCasca) {
  return (
    <div className="min-h-screen bg-fundo text-tinta">
      <Faixa>
        <div className="flex min-w-0 items-center gap-3">
          {nome !== undefined && <span className="min-w-0 truncate text-creme">{nome}</span>}
          <button
            type="button"
            onClick={aoSair}
            disabled={saindo}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-noite-alto px-4 py-2 text-base font-medium text-white enabled:hover:bg-noite-alto enabled:active:bg-noite-baixo"
          >
            {saindo ? 'Saindo…' : 'Sair'}
          </button>
        </div>
      </Faixa>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="sr-only">{titulo}</h1>
        {children}
      </main>
    </div>
  )
}

/**
 * O erro de uma tela da operação: o 503 diz "O Turmma está indisponível agora…" e a tela **fica** (Tech Spec, seção 9),
 * com "Tentar de novo". O alerta é só a mensagem; o botão fica fora dele.
 */
export function ErroDaOperacao({ erro, aoTentarDeNovo, tentando = false }: { erro: unknown; aoTentarDeNovo: () => void; tentando?: boolean }) {
  return (
    <div className="rounded-cartao border border-erro bg-erro-cx p-4">
      <p role="alert" className="text-erro">
        {textoDaFalha(erro)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Botao onClick={aoTentarDeNovo} disabled={tentando}>
          Tentar de novo
        </Botao>
        <span role="status" className="text-erro">
          {tentando ? 'Tentando de novo…' : ''}
        </span>
      </div>
    </div>
  )
}
