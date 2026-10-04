import { useQuery } from '@tanstack/react-query'
import { consultaEu } from '../api/eu'
import { Redirect } from 'wouter'
import { ROTAS } from '../caminhos'
import { EstadoCarregando, EstadoErro } from '../componentes/estado'
import { useTituloDaTela } from '../titulo'

/**
 * A raiz de quem entrou: cada papel é levado à tela em que abre, sem ficar no histórico. A coordenação abre em Governança
 * (MVP, A5; `docs/interface.md` 11.1: é a tela que fecha a venda), o professor em "Nova conversa" (A2; D73) e o aluno
 * em "Atividades" (A3): o que a professora passou é a primeira coisa que ele vê. A navegação de cada papel está na
 * lateral (`areas/navegacao.ts`), que também diz quem está na sessão e em qual escola.
 *
 * Não há estado vazio: a resposta de `/v1/eu` sempre traz a pessoa e a escola. Carregando e erro estão aqui, e o erro
 * mantém a tela em pé com "Tentar de novo" — queda de rede não é logout (regra 80, item 6).
 */
export function Inicio() {
  useTituloDaTela('Início')
  const eu = useQuery(consultaEu)

  if (eu.isPending) return <EstadoCarregando rotulo="Carregando a sua escola…" />
  const papel = eu.data?.papel
  if (papel === 'coordenador') return <Redirect to={ROTAS.governanca} replace />
  // O professor abre em "Nova conversa", a caixa de pedido do Assistente de ensino (A2; D73; `docs/interface.md` 11.1).
  if (papel === 'professor') return <Redirect to={ROTAS.novaConversa} replace />
  // O aluno abre em "Atividades": o que foi atribuído à turma dele (A3).
  if (papel === 'aluno') return <Redirect to={ROTAS.atividades} replace />
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="titulo-inicio">
      <h1 id="titulo-inicio" className="text-xl font-semibold sm:text-2xl">
        Início
      </h1>
      {eu.isError && <EstadoErro erro={eu.error} tentando={eu.isFetching} aoTentarDeNovo={() => void eu.refetch({ cancelRefetch: false })} />}
    </section>
  )
}
