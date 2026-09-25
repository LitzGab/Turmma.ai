import type { ConsultaDoPainel, RespostaUsoDoPainel, UsoDaEscolaDoPainel } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useSearch } from 'wouter'
import { EstadoCarregando } from '../../componentes/estado'
import { formatarQuantidade } from '../../formatar'
import { buscaDaConsulta, consultaDoUso, lerConsultaDaTela, paginasDoTotal } from '../api/painel'
import { INICIO_DA_OPERACAO, USO_DA_OPERACAO } from '../caminhos'
import { ErroDaOperacao } from '../componentes/CascaDaOperacao'
import { PaginasDaLista, SeletorDeOrdem, VazioAlemDaUltima } from '../componentes/NavegacaoDaLista'
import { formatarDia, formatarMedidaDoUso, formatarMesDeReferencia, MEDIDAS_DO_USO, ROTULO_DO_USO } from '../formatos'
import { TEXTO_DO_USO_VAZIO } from '../textos'
import { useTituloDaPagina } from '../titulo'

/** Os dois períodos de cada escola, na ordem da tela: o último dia fechado, e o mês dele até esse dia. */
const PERIODOS = ['dia', 'mes'] as const
type Periodo = (typeof PERIODOS)[number]

type Referencia = Pick<RespostaUsoDoPainel, 'dia' | 'mes'>

/**
 * O título de cada período, com a data que **a API** devolveu (nunca a de hoje no navegador): o dia é o último fechado em
 * São Paulo, e o mês vai do dia 1 até ele (Tech Spec da A0b, seção 5).
 */
function tituloDoPeriodo(periodo: Periodo, referencia: Referencia): string {
  return periodo === 'dia' ? `Dia ${formatarDia(referencia.dia)}` : `Mês: ${formatarMesDeReferencia(referencia)}`
}

/** O rótulo da medida no começo de uma linha ou de uma coluna: "requisições" vira "Requisições". */
function comoTitulo(rotulo: string): string {
  return rotulo.charAt(0).toLocaleUpperCase('pt-BR') + rotulo.slice(1)
}

/**
 * Computador: a tabela, com a escola como cabeçalho da linha e os dois períodos como grupos de três colunas. Abaixo de
 * 640 px ela some e ficam os cartões.
 */
function Tabela({ escolas, referencia }: { escolas: readonly UsoDaEscolaDoPainel[]; referencia: Referencia }) {
  return (
    <table className="hidden w-full table-fixed border-collapse text-sm sm:table">
      <caption className="sr-only">Uso de infra de cada escola, no último dia fechado e no mês: requisições, tarefas em segundo plano e armazenamento</caption>
      <colgroup>
        <col className="w-[28%]" />
      </colgroup>
      <colgroup span={3} />
      <colgroup span={3} />
      <thead>
        <tr className="text-sutil">
          <th scope="col" rowSpan={2} className="border-b border-linha py-2 pr-3 text-left align-bottom font-medium">
            Escola
          </th>
          {PERIODOS.map((periodo) => (
            <th key={periodo} scope="colgroup" colSpan={3} className={`py-2 pr-3 text-right font-medium text-tinta ${periodo === 'mes' ? 'border-l border-linha' : ''}`}>
              {tituloDoPeriodo(periodo, referencia)}
            </th>
          ))}
        </tr>
        <tr className="border-b border-linha text-sutil">
          {PERIODOS.flatMap((periodo) =>
            MEDIDAS_DO_USO.map((medida, posicao) => (
              <th key={`${periodo}-${medida}`} scope="col" className={`py-2 pr-3 text-right align-bottom font-medium ${periodo === 'mes' && posicao === 0 ? 'border-l border-linha' : ''}`}>
                {comoTitulo(ROTULO_DO_USO[medida])}
              </th>
            )),
          )}
        </tr>
      </thead>
      <tbody>
        {escolas.map((escola) => (
          <tr key={escola.id} className="border-b border-linha align-top">
            <th scope="row" className="py-3 pr-3 text-left font-medium wrap-anywhere text-tinta">
              {escola.nome}
            </th>
            {PERIODOS.flatMap((periodo) =>
              MEDIDAS_DO_USO.map((medida, posicao) => (
                <td key={`${periodo}-${medida}`} className={`py-3 pr-3 text-right tabular-nums wrap-anywhere ${periodo === 'mes' && posicao === 0 ? 'border-l border-linha' : ''}`}>
                  {formatarMedidaDoUso(medida, escola[periodo][medida])}
                </td>
              )),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Celular: um cartão por escola, com o dia e o mês empilhados, cada medida numa linha, sem rolagem horizontal a 360 px. */
function Cartoes({ escolas, referencia }: { escolas: readonly UsoDaEscolaDoPainel[]; referencia: Referencia }) {
  return (
    <ul className="flex flex-col gap-3 sm:hidden">
      {escolas.map((escola) => (
        <li key={escola.id} className="rounded-cartao border border-linha bg-superficie p-4">
          <h2 className="font-semibold wrap-anywhere">{escola.nome}</h2>
          {PERIODOS.map((periodo) => (
            <div key={periodo} className={periodo === 'dia' ? 'mt-3' : 'mt-3 border-t border-linha pt-3'}>
              <h3 className="text-sm font-medium text-apoio">{tituloDoPeriodo(periodo, referencia)}</h3>
              <dl className="mt-1 flex flex-col gap-1 text-sm">
                {MEDIDAS_DO_USO.map((medida) => (
                  <div key={medida} className="flex items-baseline justify-between gap-3">
                    <dt className="min-w-0 text-sutil">{comoTitulo(ROTULO_DO_USO[medida])}</dt>
                    <dd className="min-w-0 text-right font-medium tabular-nums wrap-anywhere">{formatarMedidaDoUso(medida, escola[periodo][medida])}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </li>
      ))}
    </ul>
  )
}

/** Nenhuma escola no sistema: o uso nasce com a escola, e o vazio leva a Escolas, onde ela se cria (cenário W7). */
function VazioDoUso() {
  return (
    <div className="rounded-cartao border border-dashed border-borda-campo bg-superficie p-4">
      <p className="font-medium text-tinta">{TEXTO_DO_USO_VAZIO.titulo}</p>
      <p className="mt-1 text-apoio">{TEXTO_DO_USO_VAZIO.descricao}</p>
      <div className="mt-3">
        <Link
          to={INICIO_DA_OPERACAO}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-caramelo px-4 py-2 text-base font-medium text-tinta hover:bg-caramelo-claro active:bg-caramelo-fundo"
        >
          {TEXTO_DO_USO_VAZIO.link}
        </Link>
      </div>
    </div>
  )
}

/**
 * Uso (`/operacao/uso`; Tech Spec da A0b, seção 9; RF4 e RF5): o uso de infra de cada escola — requisições, tarefas em
 * segundo plano e armazenamento (D30) —, no último dia fechado e no mês dele, lado a lado. **Só número**, por escola,
 * nunca pessoa (D10, D76). As datas são as que a API devolveu: o dia de hoje só entra depois da consolidação, e a escola
 * sem uso consolidado aparece com zero.
 *
 * Custo em reais espera o provedor de hospedagem (D42), e o consumo de IA entra com a A2.
 *
 * Os quatro estados (regra 50, item 5): carregando; erro, com "Tentar de novo" e a tela no lugar; vazio, com o caminho
 * para Escolas; e com dado. A página além da última tem o seu vazio, como em Escolas. A página e a ordem ficam na query
 * string, e a troca mantém a página anterior na tela até a nova chegar.
 */
export function Uso() {
  useTituloDaPagina('Uso')
  const busca = useSearch()
  const [, navegar] = useLocation()
  const consulta = lerConsultaDaTela(busca)
  const uso = useQuery(consultaDoUso(consulta))

  function irPara(nova: ConsultaDoPainel): void {
    navegar(`${USO_DA_OPERACAO}?${buscaDaConsulta(nova)}`)
  }

  const dados = uso.data
  const paginas = paginasDoTotal(dados?.total ?? 0)
  const trocando = uso.isPlaceholderData

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <SeletorDeOrdem ordem={consulta.ordem} aoEscolher={(ordem) => irPara({ pagina: 1, ordem })} />
      </div>

      {uso.isPending ? (
        <EstadoCarregando rotulo="Carregando o uso das escolas…" />
      ) : uso.isError && dados === undefined ? (
        <ErroDaOperacao erro={uso.error} aoTentarDeNovo={() => void uso.refetch()} tentando={uso.isFetching} />
      ) : dados === undefined || dados.total === 0 ? (
        <VazioDoUso />
      ) : dados.itens.length === 0 ? (
        <VazioAlemDaUltima paginas={paginas} aoIrParaAPrimeira={() => irPara({ pagina: 1, ordem: consulta.ordem })} />
      ) : (
        <section aria-label="Uso por escola" aria-busy={trocando} className="flex flex-col gap-4">
          {uso.isError && <ErroDaOperacao erro={uso.error} aoTentarDeNovo={() => void uso.refetch()} tentando={uso.isFetching} />}
          <div className="flex flex-col gap-1 text-sm">
            <p className="text-apoio">
              Último dia fechado: <span className="font-medium text-tinta">{formatarDia(dados.dia)}</span>. Mês:{' '}
              <span className="font-medium text-tinta">{formatarMesDeReferencia(dados)}</span>. O dia de hoje entra depois da consolidação, na
              madrugada seguinte.
            </p>
            <p className="text-sutil">{formatarQuantidade(dados.total, 'escola', 'escolas')}</p>
          </div>
          <Tabela escolas={dados.itens} referencia={dados} />
          <Cartoes escolas={dados.itens} referencia={dados} />
          <PaginasDaLista rotulo="Páginas do uso" pagina={consulta.pagina} paginas={paginas} trocando={trocando} aoIr={(pagina) => irPara({ pagina, ordem: consulta.ordem })} />
        </section>
      )}
    </>
  )
}
