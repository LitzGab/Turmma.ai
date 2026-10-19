import { useQuery } from '@tanstack/react-query'
import { useId, useRef } from 'react'
import { consultaDesempenhoDaTurma } from '../../api/atividades'
import { EstadoCarregando, EstadoErro } from '../../componentes/estado'
import { ListaDePedidos } from '../../componentes/pedidos/ListaDePedidos'
import { Tabela } from '../../componentes/Tabela'
import { CabecalhoDeSecao } from '../../componentes/Tela'
import { AcessoDaTurma } from './AcessoDaTurma'

type EscolaDaSessao = Parameters<typeof AcessoDaTurma>[0]['escola']

interface PropsDosAlunos {
  readonly turmaId: string
  readonly turmaNome: string
  readonly escola: EscolaDaSessao
  /** A leitura dos pedidos deixou de achar a turma: a página inteira sai, e quem a tira é a `Turma` (regra 10, item 6). */
  readonly aoPerderATurma: () => void
}

/**
 * A aba Alunos da turma aberta (`docs/interface.md` 11.1; D34, D46, D69): o acesso da sala, os pedidos de nome que a
 * professora aprova ou recusa e os acertos de cada aluno nas correções aprovadas, em ordem de nome. É o que a Visão Geral e a
 * aba Alunos de antes mostravam, **sem mudar** (telas do professor, 10.0); a lista de nomes da turma chega com a 12.0 e o
 * diálogo do acesso, com a 13.0, e nenhuma das duas altera `Turma.tsx`.
 *
 * Os alunos vêm em ordem de nome, como a API os entrega: **não é ranking**, e a tela não ordena por acerto.
 */
export default function AlunosDaTurma({ turmaId, turmaNome, escola, aoPerderATurma }: PropsDosAlunos) {
  const tituloDoAcesso = useRef<HTMLHeadingElement>(null)
  const desempenho = useQuery(consultaDesempenhoDaTurma(turmaId))
  const idDosAlunos = useId()
  const dados = desempenho.data

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AcessoDaTurma turmaId={turmaId} escola={escola} titulo={tituloDoAcesso} />
      <ListaDePedidos
        turma={{ id: turmaId, nome: turmaNome }}
        quem="professor"
        vazio={{
          titulo: 'Nenhum pedido esperando',
          descricao: 'Os pedidos aparecem aqui quando os alunos entram pelo link da sala ou pelo código da turma e pedem o nome. Confira se o acesso dos alunos está ativo.',
          acao: { rotulo: 'Ver o acesso dos alunos', aoAcionar: () => tituloDoAcesso.current?.focus() },
        }}
        aoPerderATurma={aoPerderATurma}
      />

      {desempenho.isPending && <EstadoCarregando rotulo="Carregando os acertos da turma…" />}
      {desempenho.isError && dados === undefined && <EstadoErro erro={desempenho.error} tentando={desempenho.isFetching} aoTentarDeNovo={() => void desempenho.refetch({ cancelRefetch: false })} />}
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
    </div>
  )
}
