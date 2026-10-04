import { CodigoDeErro, nomeDaSerie } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { ErroDaApi } from '../../api/cliente'
import { consultaMinhaTurma } from '../../api/minha-turma'
import { EstadoCarregando, EstadoErro } from '../../componentes/estado'
import { useTituloDaTela } from '../../titulo'

/**
 * O que a tela diz quando a API não acha turma para o aluno no ano em curso (`NAO_ENCONTRADO`): o ano virou e a turma
 * nova ainda não existe, ou o vínculo dele não está confirmado. Não é falha da rede, e "Tentar de novo" não mudaria
 * nada: o texto diz a quem recorrer.
 */
const SEM_TURMA_NO_ANO = 'Você ainda não está em uma turma neste ano letivo. Fale com quem dá a aula ou com a coordenação.'

/**
 * "Minha turma" do aluno (A1, 12.0; RF13; D73): a escola, a turma e a série dele, pelo vínculo confirmado no ano em curso.
 * Sem colegas, sem professor, sem matrícula (regra 50, item 9): o contrato de `GET /v1/minha-turma` não traz nada disso,
 * e a tela não tem de onde tirar.
 *
 * Nunca vazia (W4): o aluno só entra depois de aprovado, e a aprovação nasce com a turma. Os estados são carregando, com
 * dado, o erro com "Tentar de novo" (queda de rede não é logout, regra 80, item 6) e, à parte, o aluno sem turma no ano,
 * que não é erro de ninguém e diz o que fazer.
 *
 * É aba de navegação: o `<h1>` existe só para o leitor de tela, e a lateral já diz onde a pessoa está (`docs/interface.md`
 * 6, P03).
 */
export function MinhaTurma() {
  useTituloDaTela('Minha turma')
  const minhaTurma = useQuery(consultaMinhaTurma)

  function conteudo() {
    if (minhaTurma.isPending) return <EstadoCarregando rotulo="Carregando a sua turma…" />
    if (minhaTurma.isError) {
      if (minhaTurma.error instanceof ErroDaApi && minhaTurma.error.codigo === CodigoDeErro.NAO_ENCONTRADO)
        return (
          <p role="status" className="rounded-cartao border border-linha bg-superficie p-4 text-apoio">
            {SEM_TURMA_NO_ANO}
          </p>
        )
      return <EstadoErro erro={minhaTurma.error} tentando={minhaTurma.isFetching} aoTentarDeNovo={() => void minhaTurma.refetch({ cancelRefetch: false })} />
    }
    const { escola, turma, serie } = minhaTurma.data
    return (
      <div className="rounded-cartao border border-linha bg-superficie p-4">
        <p className="text-sm text-apoio">Sua turma</p>
        {/* Título de verdade, e não só letra grande: é o ponto de navegação por títulos de quem usa leitor de tela. */}
        <h2 className="mt-1 text-2xl font-semibold break-words text-tinta">{turma.nome}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <dt className="text-sm text-apoio">Série</dt>
          <dd className="-mt-2 break-words sm:mt-0">{nomeDaSerie(serie)}</dd>
          <dt className="text-sm text-apoio">Escola</dt>
          <dd className="-mt-2 break-words sm:mt-0">{escola.nome}</dd>
        </dl>
      </div>
    )
  }

  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby="titulo-minha-turma">
      <h1 id="titulo-minha-turma" className="sr-only">
        Minha turma
      </h1>
      {conteudo()}
    </section>
  )
}
