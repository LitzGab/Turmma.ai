import { Route, Switch } from 'wouter'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'

/**
 * A área do aluno, relativa a `/aluno`, num chunk próprio, `aluno-*.js` (`apps/web/nome-dos-chunks.ts`), que só se baixa
 * depois de a guarda de `apps/web/src/rotas.tsx` conferir o papel.
 *
 * Nasce sem tela: "Minha turma" chega na 12.0, com a linha dela em `areas/navegacao.ts`. Até lá o aluno fica na página
 * inicial, e qualquer endereço daqui responde "Página não encontrada".
 */
export default function RotasDoAluno() {
  return (
    <Switch>
      <Route>
        <ConteudoNaoEncontrado />
      </Route>
    </Switch>
  )
}
