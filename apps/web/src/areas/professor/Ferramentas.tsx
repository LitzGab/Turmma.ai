import { NOME_DA_FERRAMENTA } from '@educa/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'wouter'
import { consultaArtefatos } from '../../api/artefatos'
import { consultaTime, funcaoSuspensa } from '../../api/time'
import { consultaMeusVinculos } from '../../api/vinculos'
import { caminhoDaFerramentaDoProfessor, caminhoDoArtefatoDoProfessor } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { Estado } from '../../componentes/SeloDeEstado'
import { CabecalhoDeSecao } from '../../componentes/Tela'
import { formatarDataHora } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { textoDaAdaptacao } from './entregas'
import { catalogoPorCategoria } from './ferramentas'
import { Pagina } from './Pagina'
import { nomesDasTurmas } from './turmas-da-professora'

/** O que a linha de um artefato diz do estado da versão adaptada. O detalhe (quem e quando) está no artefato aberto. */
const SELO_DA_ENTREGA = { pendente: 'Esperando você', aprovada: 'Aprovada', rejeitada: 'Rejeitada' } as const
const FAMILIA_DA_ENTREGA = { pendente: 'pendente', aprovada: 'ok', rejeitada: 'erro' } as const

/**
 * "Ferramentas" (D74; `docs/interface.md` 1.2): o catálogo, nas categorias da D74, **só com as ferramentas que existem**
 * (atividade objetiva, plano de aula e Adaptação; as outras do desenho não aparecem, nem desligadas), e embaixo o que a
 * professora já gerou. Cada ferramenta abre o formulário dela, que é o mesmo motor do cartão da conversa (D18).
 *
 * O catálogo é fixo, e está sempre na tela. Os quatro estados são os da lista do que já foi gerado: carregando, erro,
 * vazio (com o convite para gerar a primeira) e com dado.
 */
export default function Ferramentas() {
  useTituloDaTela('Ferramentas')
  const idDoCatalogo = useId()
  const idDosGerados = useId()
  const time = useQuery(consultaTime)
  const artefatos = useInfiniteQuery(consultaArtefatos)
  const vinculos = useInfiniteQuery(consultaMeusVinculos)
  const nomes = nomesDasTurmas(vinculos.data?.pages.flatMap((pagina) => pagina.itens) ?? [])
  const gerados = artefatos.data?.pages.flatMap((pagina) => pagina.itens) ?? []

  return (
    <Pagina titulo="Ferramentas">
      <section aria-labelledby={idDoCatalogo} className="flex min-w-0 flex-col gap-4">
        <h2 id={idDoCatalogo} className="sr-only">
          Catálogo
        </h2>
        {catalogoPorCategoria().map((categoria) => (
          <div key={categoria.id} className="flex min-w-0 flex-col gap-2">
            <h3 className="text-sm font-medium text-sutil">{categoria.nome}</h3>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {categoria.ferramentas.map((item) => {
                const Icone = item.icone
                return (
                  <li key={item.ferramenta} className="min-w-0">
                    {/* Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela. */}
                    <Link to={caminhoDaFerramentaDoProfessor(item.ferramenta)} data-ferramenta={item.ferramenta} className="flex h-full min-h-11 min-w-0 items-start gap-3 rounded-cartao border border-linha bg-superficie p-4 hover:bg-realce-suave">
                      <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-linha bg-realce-suave text-tinta">
                        <Icone size={18} strokeWidth={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-medium break-words text-tinta">{item.nome}</span>
                        <span className="text-sm break-words text-apoio">{item.descricao}</span>
                        {funcaoSuspensa(time.data, item.funcao) && (
                          <span>
                            <Estado familia="info">Suspensa pela coordenação</Estado>
                          </span>
                        )}
                      </span>
                      <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} className="mt-1 shrink-0 text-sutil" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby={idDosGerados} className="mt-2 flex min-w-0 flex-col gap-3">
        <CabecalhoDeSecao id={idDosGerados} titulo="O que você já gerou" apoio="Cada item guarda a página do material de onde saiu." />
        {artefatos.isPending && <EstadoCarregando rotulo="Carregando o que você já gerou…" />}
        {artefatos.isError && <EstadoErro erro={artefatos.error} tentando={artefatos.isFetching} aoTentarDeNovo={() => void artefatos.refetch({ cancelRefetch: false })} />}
        {artefatos.data !== undefined && gerados.length === 0 && (
          <EstadoVazio titulo="Nada gerado ainda" descricao="Escolha uma ferramenta acima, ou peça ao Assistente em Nova conversa. O que for gerado fica guardado aqui, ligado à turma." />
        )}
        {gerados.length > 0 && (
          <ul className="flex min-w-0 flex-col gap-2">
            {gerados.map((artefato) => {
              const turma = nomes[artefato.turmaId]
              return (
                <li key={artefato.id} className="min-w-0">
                  <Link to={caminhoDoArtefatoDoProfessor(artefato.id)} data-artefato="" className="flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-cartao border border-linha bg-superficie px-4 py-3 hover:bg-realce-suave">
                    <span className="flex min-w-0 flex-1 basis-56 flex-col">
                      <span className="font-medium break-words text-tinta">{artefato.titulo}</span>
                      <span className="text-sm break-words text-sutil">
                        {artefato.adaptacao === null ? NOME_DA_FERRAMENTA[artefato.tipo] : `Versão adaptada · ${textoDaAdaptacao(artefato.adaptacao)}`}
                        {turma !== undefined && ` · ${turma}`} · {formatarDataHora(artefato.criadoEm)}
                      </span>
                    </span>
                    {artefato.entrega !== null && <Estado familia={FAMILIA_DA_ENTREGA[artefato.entrega.estado]}>{SELO_DA_ENTREGA[artefato.entrega.estado]}</Estado>}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {artefatos.hasNextPage && (
          <Botao variante="secundario" onClick={() => void artefatos.fetchNextPage()} disabled={artefatos.isFetchingNextPage} className="self-start">
            {artefatos.isFetchingNextPage ? 'Carregando…' : 'Ver mais'}
          </Botao>
        )}
      </section>
    </Pagina>
  )
}
