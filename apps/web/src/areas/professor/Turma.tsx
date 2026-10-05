import { nomeDaSerie } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { lazy, Suspense, useCallback, useId, useRef, useState } from 'react'
import { Link } from 'wouter'
import { consultaTurmaAberta } from '../../api/estrutura'
import { consultaEu } from '../../api/eu'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { Abas } from '../../componentes/Abas'
import { EstadoCarregando, EstadoErro } from '../../componentes/estado'
import { ListaDePedidos } from '../../componentes/pedidos/ListaDePedidos'
import { TurmaIndisponivel } from '../../componentes/TurmaIndisponivel'
import { useTituloDaTela } from '../../titulo'
import { TEXTO_DA_TURMA_INDISPONIVEL, turmaIndisponivel } from './acesso-da-turma'
import { AcessoDaTurma } from './AcessoDaTurma'

/** A Visão Geral só é baixada com a aba dela aberta: fica fora da fachada da área, que é das telas da A1. */
const VisaoGeralDaTurma = lazy(() => import('./VisaoGeralDaTurma'))

const ABAS_DA_TURMA = [
  { id: 'visao-geral', rotulo: 'Visão Geral' },
  { id: 'alunos', rotulo: 'Alunos' },
] as const

/**
 * A turma aberta pelo professor, dentro de Turmas (A1, 15.0 e 16.0; `docs/interface.md` 1 e 11.1): o nome e a série, o
 * acesso dos alunos e os pedidos de nome, que ele aprova ou recusa. As abas chegam com a A3 (P28).
 *
 * Só abre a turma em que o vínculo dele está confirmado, no ano em curso: quem decide é a API (`GET /v1/turmas/:id`), e
 * a turma de outro professor, a de outra escola, a pendente e a que não existe respondem igual (regra 10, item 6). A tela
 * diz uma coisa só para as quatro, com a quem recorrer.
 *
 * As seções só existem com a turma e a escola da sessão lidas. Toda sessão que acaba ou muda esvazia as duas leituras
 * (`main.tsx`), e as seções saem com o que estiver aberto nelas — o link e o código, os pedidos marcados e o diálogo da
 * decisão inclusive. A releitura que cai por rede ou servidor com o dado já na tela não desmonta nada: a professora pode
 * estar com o código projetado.
 *
 * A turma que sai do alcance com a tela aberta tira a página inteira, com um aviso só: pela releitura da turma, ou pela
 * leitura dos pedidos, que é a que se repete sozinha e a primeira a saber (`perdida`).
 */
export function Turma({ turmaId }: { turmaId: string }) {
  const turma = useQuery(consultaTurmaAberta(turmaId))
  const eu = useQuery(consultaEu)
  const idDoTitulo = useId()
  const tituloDoAcesso = useRef<HTMLHeadingElement>(null)
  // A leitura dos pedidos deixou de achar a turma: vale como a releitura da turma que deixa de achá-la.
  const [perdida, definirPerdida] = useState(false)
  const [aba, definirAba] = useState<'visao-geral' | 'alunos'>('visao-geral')
  const perderATurma = useCallback(() => definirPerdida(true), [])
  // A turma que a API deixou de achar sai também do título da aba.
  const indisponivel = perdida || turmaIndisponivel(turma.error)
  useTituloDaTela(turma.data === undefined || indisponivel ? 'Turma' : `Turma ${turma.data.nome}`)

  const voltar = (
    // Relativo à área: o `Route` aninhado em `/professor` resolve o `to` a partir da base dela.
    <Link to={ROTAS_DO_PROFESSOR.turmas} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar para Turmas
    </Link>
  )

  // A turma que a API deixou de achar (o vínculo encerrado com a tela aberta) sai da página mesmo com o nome já lido: o
  // título da página e o da aba não continuam afirmando uma turma que a seção diz não estar disponível.
  if (turma.data === undefined || eu.data === undefined || indisponivel) {
    // A que falhou, a turma primeiro: sem ela não há o que mostrar, e é dela o "não está disponível".
    const falha = turma.isError ? turma : eu.isError ? eu : undefined
    return (
      <section className="flex min-w-0 flex-col gap-4">
        {voltar}
        {indisponivel ? (
          // Com a turma já na tela, tudo o que tinha o foco saiu com ela (o diálogo aberto, os botões das seções): o foco
          // vem para o aviso. Na página que abre já sem a turma, fica onde o navegador o pôs.
          <TurmaIndisponivel texto={TEXTO_DA_TURMA_INDISPONIVEL} comFoco={turma.data !== undefined} />
        ) : falha === undefined ? (
          <EstadoCarregando rotulo="Carregando a turma…" />
        ) : (
          <EstadoErro erro={falha.error} tentando={falha.isFetching} aoTentarDeNovo={() => void falha.refetch({ cancelRefetch: false })} />
        )}
      </section>
    )
  }

  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby={idDoTitulo}>
      {voltar}
      <div>
        <h1 id={idDoTitulo} className="text-xl font-semibold break-words sm:text-2xl">
          Turma {turma.data.nome}
        </h1>
        <p className="text-apoio">{nomeDaSerie(turma.data.serie)}</p>
      </div>
      {/*
        As duas abas que existem (A3; D69): a Visão Geral, com o acerto por habilidade, e Alunos, com o que a A1 já
        mostrava (o acesso da sala e os pedidos de nome). As outras do desenho nascem com a fase delas.
      */}
      <Abas rotulo="Seções da turma" abas={ABAS_DA_TURMA} ativa={aba} aoMudar={(id) => definirAba(id === 'alunos' ? 'alunos' : 'visao-geral')}>
        {aba === 'visao-geral' ? (
          <Suspense fallback={<EstadoCarregando rotulo="Carregando a visão geral…" />}>
            <VisaoGeralDaTurma turmaId={turmaId} />
          </Suspense>
        ) : (
          <div className="flex min-w-0 flex-col gap-6">
            <AcessoDaTurma turmaId={turmaId} escola={eu.data.escola} titulo={tituloDoAcesso} />
            <ListaDePedidos
              turma={{ id: turmaId, nome: turma.data.nome }}
              quem="professor"
              vazio={{
                titulo: 'Nenhum pedido esperando',
                descricao: 'Os pedidos aparecem aqui quando os alunos entram pelo link da sala ou pelo código da turma e pedem o nome. Confira se o acesso dos alunos está ativo.',
                acao: { rotulo: 'Ver o acesso dos alunos', aoAcionar: () => tituloDoAcesso.current?.focus() },
              }}
              aoPerderATurma={perderATurma}
            />
          </div>
        )}
      </Abas>
    </section>
  )
}
