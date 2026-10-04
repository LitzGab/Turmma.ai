import type { MinhaAtividade } from '@educa/shared'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { Link } from 'wouter'
import { consultaMinhasAtividades } from '../../api/atividades-do-aluno'
import { caminhoDaAtividadeDoAluno } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { Estado } from '../../componentes/SeloDeEstado'
import { CabecalhoDeSecao, Tela } from '../../componentes/Tela'
import { useTituloDaTela } from '../../titulo'
import { AVISO_DA_AVALIACAO, detalheDaSituacao, estaParaResponder, resumoDaAtividade, separarAtividades, TEXTO_DA_SITUACAO } from './atividades'

/** Uma atividade na lista: a linha inteira é o link, com 44 px de sobra para o dedo (regra 50, item 2a). */
function LinhaDaAtividade({ atividade }: { atividade: MinhaAtividade }) {
  return (
    <li>
      <Link
        to={caminhoDaAtividadeDoAluno(atividade.id)}
        data-atividade={atividade.situacao}
        className="flex min-h-11 min-w-0 items-center gap-3 rounded-cartao border border-linha bg-superficie p-4 text-tinta hover:bg-realce-suave"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="min-w-0 text-base font-semibold break-words">{atividade.titulo}</span>
          <span className="min-w-0 text-sm break-words text-sutil">{resumoDaAtividade(atividade)}</span>
          <span className="flex min-w-0 flex-wrap items-center gap-2 pt-1">
            {/* O estado em texto, no selo: `ok` só quando há resultado; o resto é cinza, porque nada aqui é alarme. */}
            <Estado familia={atividade.situacao === 'com_diagnostico' ? 'ok' : 'info'}>{TEXTO_DA_SITUACAO[atividade.situacao]}</Estado>
          </span>
          <span className="min-w-0 text-sm break-words text-apoio">{detalheDaSituacao(atividade)}</span>
          {atividade.avaliativa && estaParaResponder(atividade) && <span className="min-w-0 text-sm font-medium break-words text-tinta">{AVISO_DA_AVALIACAO}</span>}
        </span>
        <ChevronRight aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0 text-sutil" />
      </Link>
    </li>
  )
}

/**
 * "Atividades" do aluno (MVP, A3; `docs/interface.md` 2 e 11.6): o que a professora atribuiu à turma dele, com o estado
 * de cada atividade em texto. É onde o aluno abre.
 *
 * **Nenhum dado de colega** (regra 50, item 9): sem lista de quem entregou, sem média da turma, sem posição. O contrato
 * de `GET /v1/minhas-atividades` não traz nada disso. E nada aqui empurra (D59): sem contagem regressiva, sem "atrasada",
 * sem selo de conquista; o vazio diz que não há o que fazer agora, e pronto.
 *
 * É aba de navegação: o `<h1>` existe só para o leitor de tela (`Tela`).
 */
export default function Atividades() {
  useTituloDaTela('Atividades')
  const atividades = useInfiniteQuery(consultaMinhasAtividades)
  const itens = atividades.data?.pages.flatMap((pagina) => pagina.itens) ?? []
  const { paraResponder, feitas } = separarAtividades(itens)

  return (
    <Tela titulo="Atividades" largura="conversa">
      {atividades.isPending && <EstadoCarregando rotulo="Carregando as suas atividades…" />}
      {atividades.isError && atividades.data === undefined && (
        <EstadoErro erro={atividades.error} tentando={atividades.isFetching} aoTentarDeNovo={() => void atividades.refetch({ cancelRefetch: false })} />
      )}
      {atividades.data !== undefined && itens.length === 0 && (
        <EstadoVazio titulo="Nada para fazer agora" descricao="Quando a sua professora passar uma atividade para a turma, ela aparece aqui." />
      )}

      {itens.length > 0 && (
        <>
          <section aria-labelledby="titulo-para-responder" className="flex min-w-0 flex-col gap-3">
            <CabecalhoDeSecao id="titulo-para-responder" titulo="Para responder" />
            {paraResponder.length === 0 ? (
              <p className="rounded-cartao border border-dashed border-borda-campo bg-superficie p-4 text-apoio">Nada para responder agora.</p>
            ) : (
              <ul className="flex min-w-0 flex-col gap-2">
                {paraResponder.map((atividade) => (
                  <LinhaDaAtividade key={atividade.id} atividade={atividade} />
                ))}
              </ul>
            )}
          </section>

          {feitas.length > 0 && (
            <section aria-labelledby="titulo-feitas" className="flex min-w-0 flex-col gap-3">
              <CabecalhoDeSecao id="titulo-feitas" titulo="Já feitas" />
              <ul className="flex min-w-0 flex-col gap-2">
                {feitas.map((atividade) => (
                  <LinhaDaAtividade key={atividade.id} atividade={atividade} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* A lista não rola sem fim: a página seguinte só vem quando o aluno pede (D59). */}
      {atividades.hasNextPage && (
        <Botao variante="secundario" onClick={() => void atividades.fetchNextPage()} disabled={atividades.isFetchingNextPage} className="self-center">
          {atividades.isFetchingNextPage ? 'Carregando…' : 'Ver mais atividades'}
        </Botao>
      )}
    </Tela>
  )
}
