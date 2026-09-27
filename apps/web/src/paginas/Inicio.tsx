import { useQuery } from '@tanstack/react-query'
import { consultaEu } from '../api/eu'
import { Link } from 'wouter'
import { ROTAS } from '../caminhos'
import { EstadoCarregando, EstadoErro } from '../componentes/estado'
import { NOME_DO_PAPEL } from '../papeis'
import { useTituloDaTela } from '../titulo'

/**
 * A primeira tela de quem entrou, nos três papéis. Ela mostra quem está na sessão e em qual escola, que é o que prova,
 * para a pessoa e para o teste, que a sessão vale de verdade. A navegação de cada papel está na lateral
 * (`areas/navegacao.ts`); a coordenação abre em Estrutura quando ela existir (13.0), e o professor, em "Nova conversa"
 * (A2).
 *
 * Não há estado vazio: a resposta de `/v1/eu` sempre traz a pessoa e a escola. Carregando, erro e com dado estão
 * aqui, e o erro mantém a tela em pé com "Tentar de novo" — queda de rede não é logout (regra 80, item 6).
 */
export function Inicio() {
  useTituloDaTela('Início')
  const eu = useQuery(consultaEu)

  if (eu.isPending) return <EstadoCarregando rotulo="Carregando a sua escola…" />
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
          {/* O professor tem o que fazer já na A1: a turma só abre depois de ele confirmar o vínculo (E12). */}
          {eu.data.papel === 'professor' ? (
            <p className="mt-2 text-apoio">
              Confira e confirme as suas turmas em{' '}
              <Link className="text-caramelo-texto underline" to={ROTAS.turmas}>
                Turmas
              </Link>
              .
            </p>
          ) : (
            <p className="mt-2 text-apoio">O que você faz no Turmma aparece aqui nas próximas versões.</p>
          )}
        </div>
      )}
    </section>
  )
}
