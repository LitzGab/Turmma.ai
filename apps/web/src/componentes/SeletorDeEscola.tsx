import { AVISO_DA_TROCA_RECUSADA, CodigoDeErro, type AcessoDaConta } from '@educa/shared'
import { useState } from 'react'
import { useLocation } from 'wouter'
import { ErroDaApi, mensagemDoErro } from '../api/cliente'
import { trocarDeEscola } from '../api/sessao'
import { ROTA_DA_ETAPA } from '../caminhos'
import { NOME_DO_PAPEL } from '../papeis'

/**
 * O que a troca recusada diz. A API responde `NAO_ENCONTRADO` para a sessão que não troca (matrícula, conta da
 * escola) e para o usuário que deixou de existir naquela escola: o texto vale para os dois e não diz qual foi
 * (regra 10, item 6). Qualquer outra falha é a mensagem do catálogo, que já diz o que fazer.
 */
function mensagemDaTroca(erro: unknown): string {
  return erro instanceof ErroDaApi && erro.codigo === CodigoDeErro.NAO_ENCONTRADO ? AVISO_DA_TROCA_RECUSADA : mensagemDoErro(erro)
}

interface Props {
  /** O nome da escola em que a pessoa está agora, que é o rótulo do seletor. */
  escolaAtual: string
  /** Os usuários ativos da conta (`/v1/eu.acessos`), este incluído. */
  acessos: readonly AcessoDaConta[]
  usuarioAtual: string
}

/**
 * O seletor de escola do topo (regra 50, item 13; `docs/interface.md`, seção 1). A professora da rede pública dá aula
 * em duas ou três escolas, e tudo abaixo daqui é da escola ativa.
 *
 * Trocar é uma entrada nova: a API cria a sessão na escola de destino, encerra a de origem e a web esvazia o cache
 * assim que o token do destino entra (`guardarToken`), porque nada da escola anterior pode sobreviver do lado do
 * cliente (regra 10, item 1). Com a coordenação no destino, o caminho passa pelo segundo fator antes de qualquer
 * sessão existir, e até lá a pessoa continua na escola de origem, com a tela dela (Tech Spec, seção 5, "Troca de
 * escola").
 *
 * Com uma escola só, não há seletor: fica o nome dela, que é o que diz onde a pessoa está.
 */
export function SeletorDeEscola({ escolaAtual, acessos, usuarioAtual }: Props) {
  const [, navegar] = useLocation()
  const [trocando, definirTrocando] = useState<string | undefined>(undefined)
  const [falha, definirFalha] = useState<unknown>(undefined)
  const outras = acessos.filter((acesso) => acesso.usuarioId !== usuarioAtual)

  async function trocar(usuarioId: string): Promise<void> {
    // Dois toques no mesmo cartão abririam duas sessões na escola de destino e encerrariam a de origem duas vezes.
    if (trocando !== undefined) return
    definirTrocando(usuarioId)
    definirFalha(undefined)
    try {
      const resposta = await trocarDeEscola(usuarioId)
      // `pronta` volta à página inicial, já da escola de destino; a coordenação passa antes pelo segundo fator.
      navegar(ROTA_DA_ETAPA[resposta.etapa], { replace: true })
    } catch (erro) {
      definirFalha(erro)
    } finally {
      definirTrocando(undefined)
    }
  }

  if (outras.length === 0) {
    return (
      <p className="min-w-0 break-words">
        <span className="text-apoio">Escola: </span>
        <span className="font-medium">{escolaAtual}</span>
      </p>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* `details` em vez de menu montado à mão: abre por teclado e por toque sem depender de hover nem de atalho
          (regra 50, item 2a), e não custa JavaScript nenhum no Chromebook fraco. */}
      <details className="min-w-0">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-borda-campo bg-superficie px-3 py-2 hover:bg-realce-suave">
          <span className="text-apoio">Escola:</span>
          <span className="min-w-0 break-words font-medium">{escolaAtual}</span>
          <span aria-hidden="true">▾</span>
        </summary>
        <ul className="mt-2 flex flex-col gap-2 rounded-cartao border border-linha bg-superficie p-2 shadow-flutua">
          {outras.map((acesso) => (
            <li key={acesso.usuarioId}>
              <button
                type="button"
                onClick={() => void trocar(acesso.usuarioId)}
                disabled={trocando !== undefined}
                className="flex min-h-11 w-full items-center rounded-linha px-3 py-2 text-left break-words hover:bg-realce-suave active:bg-realce disabled:text-sutil"
              >
                {trocando === acesso.usuarioId ? `Abrindo ${acesso.escolaNome}…` : `${acesso.escolaNome} · ${NOME_DO_PAPEL[acesso.papel]}`}
              </button>
            </li>
          ))}
        </ul>
      </details>
      {falha !== undefined && (
        <p role="alert" className="rounded-controle border border-erro bg-erro-cx p-3 text-erro">
          {mensagemDaTroca(falha)}
        </p>
      )}
    </div>
  )
}
