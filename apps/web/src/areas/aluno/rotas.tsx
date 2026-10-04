import { lazy } from 'react'
import { Route, Switch } from 'wouter'
import { ROTAS_DO_ALUNO } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { MinhaTurma } from './MinhaTurma'

/**
 * As telas da atividade e do Tutor (A3 e A4), cada uma no pedaço dela (`tela-aluno-<Tela>-*.js`), que só se baixa ao
 * abrir a rota: quem abre Atividades não baixa a conversa do Tutor, e o teto de cada tela é o de
 * `apps/web/nome-dos-chunks.ts`. O `Suspense` e a fronteira de erro da área (`src/rotas.tsx`) já as cobrem.
 */
const Atividades = lazy(() => import('./Atividades'))
const Atividade = lazy(() => import('./Atividade'))
const Tutor = lazy(() => import('./Tutor'))

/** O id que vem no endereço só vai à API se for um UUID: o resto é endereço que não existe. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A área do aluno, relativa a `/aluno`, num chunk próprio, `aluno-*.js` (`apps/web/nome-dos-chunks.ts`), que só se baixa
 * depois de a guarda de `apps/web/src/rotas.tsx` conferir o papel. Tem o Tutor (a escolha da atividade e a conversa por
 * atividade), "Atividades" (a lista, onde o aluno abre, e a atividade aberta) e "Minha turma" (A1, 12.0); qualquer outro
 * endereço daqui responde "Página não encontrada". "Meu desempenho", "Privacidade" e "Avisar um adulto" não existem
 * nesta fatia.
 *
 * **Tela nova entra por `lazy(() => import('./Tela'))`**, e não por `import` direto: as cinco linhas da convenção estão
 * no topo de `areas/navegacao.ts`. "Minha turma" é da A1, e fica na fachada como estava.
 */
export default function RotasDoAluno() {
  return (
    <Switch>
      <Route path={ROTAS_DO_ALUNO.tutor}>
        <Tutor />
      </Route>
      {/* A `key` pela atividade: outra atividade é outra conversa, e o que foi digitado numa não aparece na outra. */}
      <Route path={ROTAS_DO_ALUNO.tutorDaAtividade}>
        {(parametros) => (UUID.test(parametros.atividadeAplicadaId) ? <Tutor key={parametros.atividadeAplicadaId} atividadeAplicadaId={parametros.atividadeAplicadaId} /> : <ConteudoNaoEncontrado />)}
      </Route>
      <Route path={ROTAS_DO_ALUNO.atividades} component={Atividades} />
      <Route path={ROTAS_DO_ALUNO.atividade}>
        {(parametros) => (UUID.test(parametros.atividadeAplicadaId) ? <Atividade key={parametros.atividadeAplicadaId} atividadeAplicadaId={parametros.atividadeAplicadaId} /> : <ConteudoNaoEncontrado />)}
      </Route>
      <Route path={ROTAS_DO_ALUNO.minhaTurma} component={MinhaTurma} />
      <Route>
        <ConteudoNaoEncontrado />
      </Route>
    </Switch>
  )
}
