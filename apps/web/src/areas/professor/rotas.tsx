import { lazy, Suspense } from 'react'
import { Route, Switch } from 'wouter'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'

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
/** Turmas (telas do professor, 9.0): os cartões, a faixa e o painel de contestação tiraram a fachada do teto de 8 kB; sai em `tela-professor-Turmas-*.js`. */
const Turmas = lazy(() => import('./Turmas'))
/** A turma aberta (telas do professor, 10.0): a tela e as três abas dela, cada uma num pedaço próprio. */
const Turma = lazy(() => import('./Turma'))
/**
 * "Meus dados" é a mesma tela do professor e do aluno, e por isso mora em `componentes/` (a tela de uma área não importa
 * módulo de outra, `areas/navegacao.ts`, linha 5): sai num pedaço `parte-*` só por `import()`, que nenhuma entrada baixa.
 */
const MeusDados = lazy(() => import('../../componentes/meus-dados/MeusDados'))
/** O sino "Esperando você" (telas do professor, 1.0): a fila e a lista num pedaço próprio, desenhado na âncora da casca. */
const SinoDoProfessor = lazy(() => import('./SinoDoProfessor'))

/**
 * A área do professor, relativa a `/professor` (o `Route` aninhado de `apps/web/src/rotas.tsx`), num chunk próprio,
 * `professor-*.js` (`apps/web/nome-dos-chunks.ts`), que só se baixa depois de a guarda conferir o papel. Na A2 (D73) ela
 * tem "Início" (a Home, onde o professor abre, e a conversa com o Assistente), "Ferramentas" (o catálogo, o
 * formulário de cada uma e o artefato aberto), "Turmas", com a turma aberta dentro dela (A1), "Meus dados" (F3, 18.0, no
 * menu da pessoa) e, pelo pé do sino, "O que o Assistente fez" e "O que o Tutor viu". O item da lateral continua selecionado nas telas
 * de dentro (`estaNoItem`).
 *
 * **Tela nova entra por `lazy(() => import('./Tela'))`**, e não por `import` direto: as cinco linhas da convenção estão
 * no topo de `areas/navegacao.ts`. Turmas saiu da fachada na 9.0 e a turma aberta, na 10.0 (Tech Spec, seção 8): a fachada
 * fica com as rotas e o sino, e o teto dela, 8 kB, não sobe.
 */
export default function RotasDoProfessor() {
  return (
    <>
      {/* Em toda tela da professora, antes dela: o sino "Esperando você". Sem fallback: a tela não espera por ele. */}
      <Suspense fallback={null}>
        <SinoDoProfessor />
      </Suspense>
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
        {/* No menu da pessoa, e não na lista de seções: o link dele é o que fica selecionado, e nenhuma seção. */}
        <Route path={ROTAS_DO_PROFESSOR.meusDados}>
          <MeusDados titulo="Meus dados" />
        </Route>
        {/*
          A `key` pela turma: outra turma é outra tela. Sem ela, ir de uma turma aberta para outra pelo histórico manteria
          o diálogo da anterior, com o link e o código dela, por cima da turma nova.
        */}
        <Route path={ROTAS_DO_PROFESSOR.turma}>{(parametros) => <Turma key={parametros.turmaId} turmaId={parametros.turmaId} />}</Route>
        <Route>
          <ConteudoNaoEncontrado />
        </Route>
      </Switch>
    </>
  )
}
