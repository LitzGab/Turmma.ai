import { Route, Switch } from 'wouter'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'

/**
 * A área da coordenação, relativa a `/coordenacao`, num chunk próprio, `coordenacao-*.js` (`apps/web/nome-dos-chunks.ts`),
 * que só se baixa depois de a guarda de `apps/web/src/rotas.tsx` conferir o papel.
 *
 * Nasce sem tela: Estrutura chega na 13.0 e Professores na 14.0, cada uma com a linha dela em `areas/navegacao.ts`. Até
 * lá a coordenação fica na página inicial, e qualquer endereço daqui responde "Página não encontrada".
 */
export default function RotasDaCoordenacao() {
  return (
    <Switch>
      <Route>
        <ConteudoNaoEncontrado />
      </Route>
    </Switch>
  )
}
