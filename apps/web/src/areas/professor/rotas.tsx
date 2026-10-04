import { lazy } from 'react'
import { Route, Switch } from 'wouter'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { Turma } from './Turma'
import { Turmas } from './Turmas'

/**
 * As telas do Assistente de ensino (A2), cada uma no pedaço dela (`tela-professor-<Tela>-*.js`), que só se baixa ao
 * abrir a rota: quem abre Turmas não baixa a conversa, e o teto de cada tela é o de `apps/web/nome-dos-chunks.ts`. O
 * `Suspense` e a fronteira de erro da área (`src/rotas.tsx`) já as cobrem.
 */
const Home = lazy(() => import('./Home'))
const Conversa = lazy(() => import('./Conversa'))
const Ferramentas = lazy(() => import('./Ferramentas'))
const Ferramenta = lazy(() => import('./Ferramenta'))
const Artefato = lazy(() => import('./Artefato'))
const Time = lazy(() => import('./Time'))
const Tutor = lazy(() => import('./Tutor'))
const Aprovar = lazy(() => import('./Aprovar'))

/**
 * A área do professor, relativa a `/professor` (o `Route` aninhado de `apps/web/src/rotas.tsx`), num chunk próprio,
 * `professor-*.js` (`apps/web/nome-dos-chunks.ts`), que só se baixa depois de a guarda conferir o papel. Na A2 (D73) ela
 * tem "Nova conversa" (a Home, onde o professor abre, e a conversa com o Assistente), "Ferramentas" (o catálogo, o
 * formulário de cada uma e o artefato aberto), "Turmas", com a turma aberta dentro dela (A1), e, no "Seu time", a
 * conversa do Assistente de ensino. O item da lateral continua selecionado nas telas de dentro (`estaNoItem`).
 *
 * **Tela nova entra por `lazy(() => import('./Tela'))`**, e não por `import` direto: as cinco linhas da convenção estão
 * no topo de `areas/navegacao.ts`. Turmas e a turma aberta são da A1, e ficam na fachada como estavam.
 */
export default function RotasDoProfessor() {
  return (
    <Switch>
      <Route path={ROTAS_DO_PROFESSOR.novaConversa} component={Home} />
      <Route path={ROTAS_DO_PROFESSOR.conversa} component={Conversa} />
      <Route path={ROTAS_DO_PROFESSOR.ferramentas} component={Ferramentas} />
      {/* A `key` pela ferramenta: outra ferramenta é outro formulário, e não o anterior com os valores dele. */}
      <Route path={ROTAS_DO_PROFESSOR.ferramenta}>{(parametros) => <Ferramenta key={parametros.ferramenta} ferramenta={parametros.ferramenta} />}</Route>
      {/* A `key` pelo artefato: ir de uma versão adaptada à atividade de origem é abrir outra tela, sem o renomear da anterior. */}
      <Route path={ROTAS_DO_PROFESSOR.artefato}>{(parametros) => <Artefato key={parametros.artefatoId} artefatoId={parametros.artefatoId} />}</Route>
      <Route path={ROTAS_DO_PROFESSOR.timeDoAssistente} component={Time} />
      <Route path={ROTAS_DO_PROFESSOR.timeDoTutor} component={Tutor} />
      {/* A `key` pela atividade: outra correção é outra tela, sem os destaques abertos nem o diálogo da anterior. */}
      <Route path={ROTAS_DO_PROFESSOR.aprovar}>{(parametros) => <Aprovar key={parametros.atividadeAplicadaId} atividadeAplicadaId={parametros.atividadeAplicadaId} />}</Route>
      <Route path={ROTAS_DO_PROFESSOR.turmas} component={Turmas} />
      {/*
        A `key` pela turma: outra turma é outra tela. Sem ela, ir de uma turma aberta para outra pelo histórico manteria
        o diálogo da anterior, com o link e o código dela, por cima da turma nova.
      */}
      <Route path={ROTAS_DO_PROFESSOR.turma}>{(parametros) => <Turma key={parametros.turmaId} turmaId={parametros.turmaId} />}</Route>
      <Route>
        <ConteudoNaoEncontrado />
      </Route>
    </Switch>
  )
}
