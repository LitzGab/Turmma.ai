import type { PapelDeUsuario } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { consultaEu } from '../api/eu'
import { Link, Redirect } from 'wouter'
import { ROTAS } from '../caminhos'
import { EstadoCarregando, EstadoErro } from '../componentes/estado'
import { NOME_DO_PAPEL } from '../papeis'
import { useTituloDaTela } from '../titulo'

/**
 * O que a página inicial aponta, por papel: o professor tem o que fazer já na A1, porque a turma só abre depois de ele
 * confirmar o vínculo (E12); o aluno vê a própria turma (12.0). A coordenação não fica aqui: abre em Estrutura (13.0).
 */
function ProximoPasso({ papel }: { papel: Exclude<PapelDeUsuario, 'coordenador'> }) {
  if (papel === 'professor')
    return (
      <p className="mt-2 text-apoio">
        Confira e confirme as suas turmas em{' '}
        <Link className="text-caramelo-texto underline" to={ROTAS.turmas}>
          Turmas
        </Link>
        .
      </p>
    )
  return (
    <p className="mt-2 text-apoio">
      Veja a sua turma em{' '}
      <Link className="text-caramelo-texto underline" to={ROTAS.minhaTurma}>
        Minha turma
      </Link>
      .
    </p>
  )
}

/**
 * A primeira tela de quem entrou, no professor e no aluno. Ela mostra quem está na sessão e em qual escola, que é o que
 * prova, para a pessoa e para o teste, que a sessão vale de verdade. A navegação de cada papel está na lateral
 * (`areas/navegacao.ts`). A coordenação abre em Estrutura (13.0; `docs/interface.md` 11.1, enquanto a Governança não
 * existe): daqui ela é levada para lá, sem ficar no histórico. O professor vai abrir em "Nova conversa" (A2).
 *
 * Não há estado vazio: a resposta de `/v1/eu` sempre traz a pessoa e a escola. Carregando, erro e com dado estão
 * aqui, e o erro mantém a tela em pé com "Tentar de novo" — queda de rede não é logout (regra 80, item 6).
 */
export function Inicio() {
  useTituloDaTela('Início')
  const eu = useQuery(consultaEu)

  if (eu.isPending) return <EstadoCarregando rotulo="Carregando a sua escola…" />
  const papel = eu.data?.papel
  if (papel === 'coordenador') return <Redirect to={ROTAS.estrutura} replace />
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="titulo-inicio">
      <h1 id="titulo-inicio" className="text-xl font-semibold sm:text-2xl">
        {eu.data ? `Olá, ${eu.data.nome}` : 'Início'}
      </h1>
      {eu.isError && <EstadoErro erro={eu.error} tentando={eu.isFetching} aoTentarDeNovo={() => void eu.refetch({ cancelRefetch: false })} />}
      {eu.data && (
        <div className="rounded-cartao border border-linha bg-superficie p-4">
          <p className="break-words text-apoio">
            Você está em <span className="font-medium text-tinta">{eu.data.escola.nome}</span> como{' '}
            <span className="font-medium text-tinta">{NOME_DO_PAPEL[eu.data.papel]}</span>.
          </p>
          {papel !== undefined && <ProximoPasso papel={papel} />}
        </div>
      )}
    </section>
  )
}
