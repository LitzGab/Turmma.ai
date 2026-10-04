import { Route, Switch } from 'wouter'
import { ROTAS_DO_ALUNO } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { MinhaTurma } from './MinhaTurma'

/**
 * A área do aluno, relativa a `/aluno`, num chunk próprio, `aluno-*.js` (`apps/web/nome-dos-chunks.ts`), que só se baixa
 * depois de a guarda de `apps/web/src/rotas.tsx` conferir o papel. Na A1 ela tem só "Minha turma" (12.0, D73); qualquer
 * outro endereço daqui responde "Página não encontrada".
 *
 * **Tela nova entra por `lazy(() => import('./Tela'))`**, e não por `import` direto: as cinco linhas da convenção estão
 * no topo de `areas/navegacao.ts`.
 */
export default function RotasDoAluno() {
  return (
    <Switch>
      <Route path={ROTAS_DO_ALUNO.minhaTurma} component={MinhaTurma} />
      <Route>
        <ConteudoNaoEncontrado />
      </Route>
    </Switch>
  )
}
