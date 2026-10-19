import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'wouter'
import { consultaTime, funcaoSuspensa } from '../../api/time'
import { caminhoDaFerramentaDoProfessor } from '../../caminhos'
import { Estado } from '../../componentes/SeloDeEstado'
import { Tela } from '../../componentes/Tela'
import { useTituloDaTela } from '../../titulo'
import { catalogoPorCategoria } from './ferramentas'

/**
 * "Ferramentas" (D74; `docs/interface.md` 1.2): o catálogo, nas categorias da D74, **só com as ferramentas que existem**
 * (atividade objetiva, plano de aula e Adaptação; as outras do desenho não aparecem, nem desligadas). Cada ferramenta abre o
 * formulário dela, que é o mesmo motor do cartão da conversa (D18). O que a professora já gerou saiu daqui e mora em
 * Criados (telas do professor, 5.0).
 *
 * O catálogo é fixo e não lê a lista de gerados: a única leitura é a do time, para dizer a função que a coordenação suspendeu.
 */
export default function Ferramentas() {
  useTituloDaTela('Ferramentas')
  const idDoCatalogo = useId()
  const time = useQuery(consultaTime)

  return (
    <Tela titulo="Ferramentas" largura="formulario">
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
    </Tela>
  )
}
