import { nomeDaSerie, type ItemDaGovernanca } from '@educa/shared'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { mensagemDoErro } from '../../api/cliente'
import { consultaConsumo, consultaResumoDaGovernanca } from '../../api/governanca'
import { BarraRotulada } from '../../componentes/BarraRotulada'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { LinhaAprovacao } from '../../componentes/ia/LinhaAprovacao'
import { NumeroPainel } from '../../componentes/NumeroPainel'
import { Tabela, type ColunaDaTabela } from '../../componentes/Tabela'
import { CabecalhoDeSecao, Tela } from '../../componentes/Tela'
import { formatarDataHora } from '../../formatar'
import { useTituloDaTela } from '../../titulo'
import { DadoNominal } from './DadoNominal'
import { aprovacaoDoItem, ESPERANDO_O_PROFESSOR, NOME_DO_TIPO_DE_ENTREGA, nomeDaFuncao, O_QUE_CHEGA_AO_ALUNO, textoDoConsumo, textoDoCusto, textoDoPacoteDoTutor } from './textos-da-governanca'

/**
 * As colunas de "O que a IA gerou e quem aprovou". **Não existe coluna de professor nem de turma**, e a tabela não tem
 * filtro nem ordenação: a API não os aceita (D45, D64). A última coluna diz que uma pessoa decidiu e quando; quem foi
 * está na auditoria.
 */
const COLUNAS: readonly [ColunaDaTabela<ItemDaGovernanca>, ...ColunaDaTabela<ItemDaGovernanca>[]] = [
  { chave: 'oQue', titulo: 'O que foi gerado', celula: (item) => NOME_DO_TIPO_DE_ENTREGA[item.tipo] },
  { chave: 'funcao', titulo: 'Agente e função', celula: (item) => nomeDaFuncao(item.funcao) },
  { chave: 'serie', titulo: 'Série', celula: (item) => nomeDaSerie(item.serie) },
  { chave: 'quando', titulo: 'Gerado em', celula: (item) => formatarDataHora(item.criadaEm) },
  { chave: 'decisao', titulo: 'Decisão', celula: (item) => <LinhaAprovacao aprovacao={aprovacaoDoItem(item)} espera={ESPERANDO_O_PROFESSOR} /> },
]

/**
 * Governança de IA (MVP, A5; `docs/interface.md` 3 e 11.7; D9, D45, D61, D64; regra 70, item 6): é onde a coordenação
 * abre. Quatro números, a tabela do que a IA gerou e se uma pessoa aprovou, e o consumo do mês por função.
 *
 * Tudo é agregado. O dado nominal fica numa seção à parte, atrás de um botão `oficial` e de um diálogo que avisa da
 * auditoria (`DadoNominal`).
 */
export default function Governanca() {
  useTituloDaTela('Governança')
  const resumo = useInfiniteQuery(consultaResumoDaGovernanca)

  if (resumo.isPending) {
    return (
      <Tela titulo="Governança">
        <EstadoCarregando rotulo="Carregando a governança…" />
      </Tela>
    )
  }
  if (resumo.isError && resumo.data === undefined) {
    return (
      <Tela titulo="Governança">
        <EstadoErro erro={resumo.error} tentando={resumo.isFetching} aoTentarDeNovo={() => void resumo.refetch({ cancelRefetch: false })} />
      </Tela>
    )
  }

  // Os números vêm em toda página: valem os da mais recente lida.
  const numeros = resumo.data.pages.at(-1)?.numeros ?? { geradoPorIa: 0, aprovadoPorPessoa: 0, rejeitado: 0, esperando: 0 }
  const itens = resumo.data.pages.flatMap((pagina) => pagina.itens)
  const nadaGerado = numeros.geradoPorIa === 0 && numeros.aprovadoPorPessoa + numeros.rejeitado + numeros.esperando === 0

  return (
    <Tela titulo="Governança">
      <p className="max-w-prose text-apoio">O que a IA produziu nesta escola no ano letivo, e o que as pessoas decidiram sobre isso. {O_QUE_CHEGA_AO_ALUNO}</p>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumeroPainel rotulo="Gerado por IA" valor={numeros.geradoPorIa} apoio="Atividades, planos, versões adaptadas e correções" />
        <NumeroPainel rotulo="Aprovado por gente" valor={numeros.aprovadoPorPessoa} apoio="Versões adaptadas e correções que um professor aprovou" />
        <NumeroPainel rotulo="Esperando o professor" valor={numeros.esperando} apoio="Só valem depois da decisão dele" />
        <NumeroPainel rotulo="Rejeitado" valor={numeros.rejeitado} apoio="O professor recusou, com justificativa" />
      </div>

      <section className="flex min-w-0 flex-col gap-3" aria-labelledby="titulo-registro">
        <CabecalhoDeSecao id="titulo-registro" titulo="O que a IA gerou e quem aprovou" apoio="Da mais nova para a mais antiga. Cada linha diz o que foi gerado, por qual função, e se uma pessoa já decidiu." />
        {/* A página seguinte que falhou: aviso com botão secundário, para a tela não ganhar um segundo primário ao lado do erro do consumo. */}
        {resumo.isError && (
          <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-controle border border-erro bg-erro-cx p-3">
            <p role="alert" className="min-w-0 flex-1 basis-56 break-words text-erro">
              {mensagemDoErro(resumo.error)}
            </p>
            <Botao variante="secundario" onClick={() => void resumo.fetchNextPage()} disabled={resumo.isFetchingNextPage}>
              Tentar de novo
            </Botao>
          </div>
        )}
        {itens.length === 0 ? (
          <EstadoVazio
            titulo={nadaGerado ? 'A IA ainda não gerou nada nesta escola' : 'Nenhuma linha para mostrar ainda'}
            descricao={
              nadaGerado
                ? 'Quando um professor pedir uma versão adaptada ou encerrar uma atividade objetiva, a entrega aparece aqui, primeiro esperando o professor e depois com a decisão dele e a data.'
                : 'Aqui entram as versões adaptadas e as correções de objetiva, das séries com dois ou mais professores. O que já foi gerado está contado nos números acima.'
            }
          />
        ) : (
          <>
            <Tabela rotulo="O que a IA gerou e quem aprovou" colunas={COLUNAS} linhas={itens} chaveDaLinha={(item) => item.id} />
            {resumo.hasNextPage && (
              <div>
                <Botao variante="secundario" onClick={() => void resumo.fetchNextPage()} disabled={resumo.isFetchingNextPage}>
                  {resumo.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
                </Botao>
              </div>
            )}
          </>
        )}
        <p className="max-w-prose text-sm text-sutil">
          A lista não mostra turma nem quem decidiu: quem aprovou cada entrega, e quando, fica na auditoria da escola. Entrega de série com um professor só conta nos números e não entra na lista, porque a linha diria o que ele fez.
        </p>
      </section>

      <Consumo />
      <DadoNominal />
    </Tela>
  )
}

/** O consumo do mês por função, em barras neutras: o valor está no texto. Por função, nunca por pessoa (D64). */
function Consumo() {
  const consumo = useQuery(consultaConsumo)
  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="titulo-consumo">
      <CabecalhoDeSecao id="titulo-consumo" titulo="Consumo do mês por função" apoio="Quanto cada função da IA trabalhou neste mês. É somado por função: não existe consumo por professor nem por aluno." />
      {consumo.isPending && <EstadoCarregando rotulo="Carregando o consumo…" />}
      {consumo.isError && <EstadoErro erro={consumo.error} tentando={consumo.isFetching} aoTentarDeNovo={() => void consumo.refetch({ cancelRefetch: false })} />}
      {consumo.data !== undefined &&
        (consumo.data.porFuncao.length === 0 ? (
          <EstadoVazio titulo="Nenhuma função trabalhou neste mês" descricao="Quando um professor conversar com o Assistente, gerar uma atividade ou um aluno usar o Tutor, o consumo de cada função aparece aqui." />
        ) : (
          <div className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
            {consumo.data.porFuncao.map((linha) => (
              <BarraRotulada
                key={linha.funcao}
                rotulo={nomeDaFuncao(linha.funcao)}
                valor={linha.tokensDeEntrada + linha.tokensDeSaida}
                maximo={Math.max(1, consumo.data.total.tokensDeEntrada + consumo.data.total.tokensDeSaida)}
                texto={textoDoConsumo(linha)}
              />
            ))}
            <BarraRotulada
              rotulo="Trocas dos alunos com o Tutor"
              valor={consumo.data.tutor.trocasNoMes}
              maximo={Math.max(1, consumo.data.tutor.pacoteDoMes)}
              texto={textoDoPacoteDoTutor(consumo.data.tutor)}
              detalhe={`Pacote do mês: ${String(consumo.data.tutor.trocasPorMesPorAluno)} trocas por aluno, com freio de ${String(consumo.data.tutor.trocasPorDiaPorAluno)} por dia`}
            />
            <p className="text-sm text-sutil">{textoDoCusto(consumo.data.total)}</p>
          </div>
        ))}
    </section>
  )
}
