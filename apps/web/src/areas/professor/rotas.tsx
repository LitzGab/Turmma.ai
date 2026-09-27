import { Route, Switch } from 'wouter'
import { ROTAS_DO_PROFESSOR } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { Turmas } from './Turmas'

/**
 * A área do professor, relativa a `/professor` (o `Route` aninhado de `apps/web/src/rotas.tsx`), num chunk próprio,
 * `professor-*.js` (`apps/web/nome-dos-chunks.ts`), que só se baixa depois de a guarda conferir o papel. Na A1 ela tem
 * só "Turmas" (D73); a turma aberta chega na 15.0.
 */
export default function RotasDoProfessor() {
  return (
    <Switch>
      <Route path={ROTAS_DO_PROFESSOR.turmas} component={Turmas} />
      <Route>
        <ConteudoNaoEncontrado />
      </Route>
    </Switch>
  )
}
