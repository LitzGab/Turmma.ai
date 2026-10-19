import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { Link } from 'wouter'
import { consultaAtividadesAplicadas } from '../../api/atividades'
import { caminhoDaCorrecaoDoProfessor, caminhoDoArtefatoDoProfessor } from '../../caminhos'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { CabecalhoDeSecao } from '../../componentes/Tela'
import { situacaoDaAplicacao } from './aprovar'

const CLASSES_DO_LINK = 'inline-flex min-h-11 items-center text-caramelo-texto underline md:min-h-9'

/**
 * A aba Atividades da turma aberta (`docs/interface.md` 11.1; D46, D55): as atividades aplicadas à turma, com a situação de
 * cada uma e o caminho para a correção. É a lista que a Visão Geral tinha, **sem mudar** (telas do professor, 10.0); a
 * tabela com estado e o painel da atividade chegam com a 11.0, que só altera este arquivo.
 *
 * Não diz nota nem conceito: o texto é o de `situacaoDaAplicacao` (quantos enviaram), e a correção fica em "Revisar a correção".
 */
export default function AtividadesDaTurma({ turmaId }: { turmaId: string }) {
  const atividades = useQuery(consultaAtividadesAplicadas(turmaId))
  const idDasAtividades = useId()
  const aplicadas = atividades.data?.itens ?? []

  return (
    <section aria-labelledby={idDasAtividades} className="flex min-w-0 flex-col gap-3">
      <CabecalhoDeSecao id={idDasAtividades} titulo="Atividades da turma" />
      {atividades.isPending && <EstadoCarregando rotulo="Carregando as atividades da turma…" />}
      {atividades.isError && atividades.data === undefined && <EstadoErro erro={atividades.error} tentando={atividades.isFetching} aoTentarDeNovo={() => void atividades.refetch({ cancelRefetch: false })} />}
      {atividades.data !== undefined && aplicadas.length === 0 && (
        <EstadoVazio titulo="Nenhuma atividade aplicada a esta turma" descricao="Gere uma atividade objetiva em Ferramentas e use “Aplicar à turma”, no artefato. Ela aparece aqui, com quantos alunos já enviaram." />
      )}
      {aplicadas.length > 0 && (
        <ul className="flex min-w-0 flex-col gap-2">
          {aplicadas.map((aplicada) => (
            <li key={aplicada.id} data-atividade-aplicada={aplicada.estado} className="flex min-w-0 flex-col gap-1 rounded-cartao border border-linha bg-superficie p-4">
              <p className="font-medium break-words text-tinta">{aplicada.titulo}</p>
              <p className="text-sm break-words text-apoio">{situacaoDaAplicacao(aplicada)}</p>
              <div className="flex min-w-0 flex-wrap gap-x-4">
                {/* Relativos à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela. */}
                <Link to={caminhoDoArtefatoDoProfessor(aplicada.artefatoId)} className={CLASSES_DO_LINK}>
                  Abrir a atividade<span className="sr-only">: {aplicada.titulo}</span>
                </Link>
                {aplicada.entrega !== null && (
                  <Link to={caminhoDaCorrecaoDoProfessor(aplicada.id)} className={CLASSES_DO_LINK}>
                    {aplicada.entrega.estado === 'pendente' ? 'Revisar a correção' : 'Ver a correção'}
                    <span className="sr-only">: {aplicada.titulo}</span>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
