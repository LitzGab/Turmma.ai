import { lazy, Suspense } from 'react'
import { Redirect, Route, Switch } from 'wouter'
import { ABA_INICIAL_DA_PRIVACIDADE, caminhoDaAbaDaPrivacidade, ROTAS_DA_COORDENACAO } from '../../caminhos'
import { ConteudoNaoEncontrado } from '../../componentes/NaoEncontrada'
import { Estrutura } from './Estrutura'
import { ListaDaTurma } from './ListaDaTurma'
import { Professores } from './Professores'

/** Material (MVP, A2): tela nova, num pedaço próprio (`tela-coordenacao-Material-*.js`), que só quem a abre baixa. */
const Material = lazy(() => import('./Material'))
/** Governança, Agentes e Analista (MVP, A5): cada uma no pedaço dela (`tela-coordenacao-<Tela>-*.js`). */
const Governanca = lazy(() => import('./Governanca'))
const Agentes = lazy(() => import('./Agentes'))
const Analista = lazy(() => import('./Analista'))
/** Privacidade (F3, 6.0): no pedaço dela (`tela-coordenacao-Privacidade-*.js`), e só quem abre o item a baixa. */
const Privacidade = lazy(() => import('./privacidade/Privacidade'))
/** O aviso de incidente (F3, 10.0): o diálogo e a faixa, num pedaço próprio, para a fachada da área não crescer (`.size-limit.json`). */
const AvisoDeIncidente = lazy(() => import('./privacidade/AvisoDeIncidente'))

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
    <>
      {/* Em toda tela da coordenação, antes dela: o diálogo ao entrar e, com "Ver depois", a faixa até a confirmação. Sem fallback: a tela não espera por ele. */}
      <Suspense fallback={null}>
        <AvisoDeIncidente />
      </Suspense>
      <Switch>
        <Route path={ROTAS_DA_COORDENACAO.estrutura} component={Estrutura} />
        {/*
          A `key` pela turma: outra turma é outra tela. Sem ela, ir de uma turma já aberta para outra pelo histórico
          manteria o texto colado e a prévia da anterior, e "Gravar lista" os mandaria para a turma nova.
        */}
        <Route path={ROTAS_DA_COORDENACAO.turma}>{(parametros) => <ListaDaTurma key={parametros.turmaId} turmaId={parametros.turmaId} />}</Route>
        <Route path={ROTAS_DA_COORDENACAO.professores} component={Professores} />
        <Route path={ROTAS_DA_COORDENACAO.material} component={Material} />
        <Route path={ROTAS_DA_COORDENACAO.governanca} component={Governanca} />
        <Route path={ROTAS_DA_COORDENACAO.agentes} component={Agentes} />
        <Route path={ROTAS_DA_COORDENACAO.analista} component={Analista} />
        {/* A Privacidade sem aba no endereço abre a primeira; com uma aba, é a tela dela (a aba que não existe cai na primeira). */}
        <Route path={ROTAS_DA_COORDENACAO.privacidade}>
          <Redirect to={caminhoDaAbaDaPrivacidade(ABA_INICIAL_DA_PRIVACIDADE)} replace />
        </Route>
        <Route path={ROTAS_DA_COORDENACAO.privacidadeDaAba}>{(parametros) => <Privacidade aba={parametros.aba} />}</Route>
        <Route>
          <ConteudoNaoEncontrado />
        </Route>
      </Switch>
    </>
  )
}
