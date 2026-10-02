import { Route, Switch } from 'wouter'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { Turma } from './Turma'
import { Turmas } from './Turmas'

/**
 * A área do professor, relativa a `/professor` (o `Route` aninhado de `apps/web/src/rotas.tsx`), num chunk próprio,
 * `professor-*.js` (`apps/web/nome-dos-chunks.ts`), que só se baixa depois de a guarda conferir o papel. Na A1 ela tem
 * só "Turmas" (D73), com a turma aberta dentro dela (15.0): o item da lateral continua selecionado (`estaNoItem`).
 */
export default function RotasDoProfessor() {
  return (
    <Switch>
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
