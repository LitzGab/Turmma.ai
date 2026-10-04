import { lazy } from 'react'
import { Route, Switch } from 'wouter'
import { ROTAS_DA_COORDENACAO } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { Estrutura } from './Estrutura'
import { ListaDaTurma } from './ListaDaTurma'
import { Professores } from './Professores'

/** Material (MVP, A2): tela nova, num pedaço próprio (`tela-coordenacao-Material-*.js`), que só quem a abre baixa. */
const Material = lazy(() => import('./Material'))

/**
 * A área da coordenação, relativa a `/coordenacao`, num chunk próprio, `coordenacao-*.js` (`apps/web/nome-dos-chunks.ts`),
 * que só se baixa depois de a guarda de `apps/web/src/rotas.tsx` conferir o papel.
 *
 * Na A1: Estrutura (13.0), com a turma aberta e a lista de nomes dela, e Professores (14.0), cada uma com a linha dela em
 * `areas/navegacao.ts`. Qualquer outro endereço daqui responde "Página não encontrada".
 *
 * **Tela nova entra por `lazy(() => import('./Tela'))`**, e não por `import` direto: as cinco linhas da convenção estão
 * no topo de `areas/navegacao.ts`.
 */
export default function RotasDaCoordenacao() {
  return (
    <Switch>
      <Route path={ROTAS_DA_COORDENACAO.estrutura} component={Estrutura} />
      {/*
        A `key` pela turma: outra turma é outra tela. Sem ela, ir de uma turma já aberta para outra pelo histórico
        manteria o texto colado e a prévia da anterior, e "Gravar lista" os mandaria para a turma nova.
      */}
      <Route path={ROTAS_DA_COORDENACAO.turma}>{(parametros) => <ListaDaTurma key={parametros.turmaId} turmaId={parametros.turmaId} />}</Route>
      <Route path={ROTAS_DA_COORDENACAO.professores} component={Professores} />
      <Route path={ROTAS_DA_COORDENACAO.material} component={Material} />
      <Route>
        <ConteudoNaoEncontrado />
      </Route>
    </Switch>
  )
}
