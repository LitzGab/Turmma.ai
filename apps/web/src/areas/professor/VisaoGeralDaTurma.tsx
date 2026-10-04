import { useQuery } from '@tanstack/react-query'
import { ChartNoAxesColumn } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'wouter'
import { consultaAtividadesAplicadas, consultaDesempenhoDaTurma } from '../../api/atividades'
import { caminhoDaCorrecaoDoProfessor, caminhoDoArtefatoDoProfessor } from '../../caminhos'
import { BarraRotulada } from '../../componentes/BarraRotulada'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { Tabela } from '../../componentes/Tabela'
import { CabecalhoDeSecao } from '../../componentes/Tela'
import { situacaoDaAplicacao, textoDeAlunos } from './aprovar'

const CLASSES_DO_LINK = 'inline-flex min-h-11 items-center text-caramelo-texto underline md:min-h-9'

/**
 * A Visão Geral da turma aberta (`docs/interface.md` 1; D34, D46, D69): o **acerto por habilidade**, da turma e de cada
 * aluno, **só de lotes aprovados**, e as atividades aplicadas à turma. Correção pendente ou rejeitada não entra em número
 * nenhum; a turma sem correção aprovada mostra o estado vazio tracejado, que diz o que falta.
 *
 * As barras são neutras: nenhuma fica vermelha, e o número está no texto. Os alunos vêm em ordem de nome, como a API os
 * entrega: **não é ranking**, e a tela não ordena por acerto. Não há tempo parado nem comparação com outra turma (D69;
 * regra 70, item 7).
 */
export default function VisaoGeralDaTurma({ turmaId }: { turmaId: string }) {
  const desempenho = useQuery(consultaDesempenhoDaTurma(turmaId))
  const atividades = useQuery(consultaAtividadesAplicadas(turmaId))
  const idDasHabilidades = useId()
  const idDosAlunos = useId()
  const idDasAtividades = useId()
  const dados = desempenho.data
  const aplicadas = atividades.data?.itens ?? []

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section aria-labelledby={idDasHabilidades} className="flex min-w-0 flex-col gap-3">
        <CabecalhoDeSecao id={idDasHabilidades} titulo="Acerto por habilidade" apoio="Só das correções que você já aprovou, na sua disciplina." />
        {desempenho.isPending && <EstadoCarregando rotulo="Carregando o desempenho da turma…" />}
        {desempenho.isError && dados === undefined && <EstadoErro erro={desempenho.error} tentando={desempenho.isFetching} aoTentarDeNovo={() => void desempenho.refetch({ cancelRefetch: false })} />}
        {dados !== undefined && dados.lotesAprovados === 0 && (
          <EstadoVazio
            variante="tracejado"
            icone={ChartNoAxesColumn}
            titulo="Ainda não há correção aprovada nesta turma"
            descricao="O acerto por habilidade aparece aqui depois que você aprovar a correção de uma atividade aplicada à turma. Correção que ainda espera você não entra na conta."
          />
        )}
        {dados !== undefined && dados.lotesAprovados > 0 && (
          <div className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4">
            {dados.porHabilidade.map((item) => (
              <BarraRotulada
                key={item.habilidade.codigo}
                rotulo={`${item.habilidade.codigo} · ${item.habilidade.descricao}`}
                valor={item.acertos}
                maximo={item.total}
                texto={`${String(item.acertos)} de ${String(item.total)}`}
                detalhe={item.alunosAbaixoDaMetade === 0 ? 'Nenhum aluno abaixo da metade nesta habilidade.' : `${textoDeAlunos(item.alunosAbaixoDaMetade)} abaixo da metade nesta habilidade.`}
              />
            ))}
          </div>
        )}
      </section>

      {dados !== undefined && dados.lotesAprovados > 0 && dados.alunos.length > 0 && (
        <section aria-labelledby={idDosAlunos} className="flex min-w-0 flex-col gap-3">
          <CabecalhoDeSecao id={idDosAlunos} titulo="Por aluno" apoio="Os acertos de cada aluno nas correções aprovadas, em ordem de nome." />
          <Tabela
            rotulo="Acertos por aluno"
            colunas={[
              { chave: 'nome', titulo: 'Aluno', celula: (aluno) => aluno.nome },
              // O aluno que ainda não tem correção aprovada vem zerado: a tela diz isso, em vez de "0 de 0".
              { chave: 'acertos', titulo: 'Acertos', celula: (aluno) => (aluno.total === 0 ? 'Sem correção aprovada' : `${String(aluno.acertos)} de ${String(aluno.total)}`) },
              {
                chave: 'habilidades',
                titulo: 'Por habilidade',
                celula: (aluno) => aluno.porHabilidade.map((item) => `${item.habilidade.codigo}: ${String(item.acertos)} de ${String(item.total)}`).join(' · '),
              },
            ]}
            linhas={dados.alunos}
            chaveDaLinha={(aluno) => aluno.alunoId}
          />
        </section>
      )}

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
    </div>
  )
}
