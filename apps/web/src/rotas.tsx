import type { PapelDeUsuario } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useState, useSyncExternalStore, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'
import { Redirect, Route, Switch, useLocation } from 'wouter'
import { consultaEu } from './api/eu'
import { abrirSessaoPeloCookie, assinarSessao, erroDaSessao, estadoDaSessao } from './api/sessao'
import { BASE_DA_AREA, ROTAS } from './caminhos'
import { CascaDaEscola } from './componentes/CascaDaEscola'
import { EstadoCarregando, EstadoErro } from './componentes/estado'
import { FronteiraDaArea } from './componentes/FronteiraDaArea'
import { LoginPorCima } from './componentes/LoginPorCima'
import { ConteudoNaoEncontrado, PaginaNaoEncontrada } from './componentes/NaoEncontrada'
import { Casca } from './paginas/Casca'
import { ConfigurarMfa } from './paginas/ConfigurarMfa'
import { Convite } from './paginas/Convite'
import { Entrar } from './paginas/Entrar'
import { EntrarNaEscola } from './paginas/EntrarNaEscola'
import { EscolherEscola } from './paginas/EscolherEscola'
import { Inicio } from './paginas/Inicio'
import { Mfa } from './paginas/Mfa'
import { tituloDaEscola, tituloDaOperacao } from './titulo'

/**
 * A área do operador Turmma (A0), só por `import()`: vira o chunk `operacao-*.js` (`vite.config.ts`), que nenhuma tela
 * da escola baixa (Tech Spec da A0, seção 9, B2). Nada daqui importa de `./operacao/` de outro jeito: o teste de
 * `apps/web/nome-dos-chunks.test.ts` reprova, no build, o `import` estático.
 */
const AreaDaOperacao = lazy(() => import('./operacao/rotas'))

/** O caminho da área, repetido aqui para a entrada não importar nada de `./operacao/`. */
const BASE_DA_OPERACAO = '/operacao'

/**
 * A área de cada papel da escola, também só por `import()`: cada uma vira o chunk dela (`coordenacao-*.js`,
 * `professor-*.js`, `aluno-*.js`, em `apps/web/nome-dos-chunks.ts`), com teto próprio no `.size-limit.json`, e fica
 * fora da entrada que toda a escola baixa às 7h30.
 */
const AREA_DO_PAPEL: Readonly<Record<PapelDeUsuario, LazyExoticComponent<ComponentType>>> = {
  coordenador: lazy(() => import('./areas/coordenacao/rotas')),
  professor: lazy(() => import('./areas/professor/rotas')),
  aluno: lazy(() => import('./areas/aluno/rotas')),
}

/** O que a fronteira diz quando o chunk de uma área não chega: o título da falha na aba, e o que fazer (W5). */
const FALHA_DA_AREA = {
  tituloDaAba: tituloDaEscola('Não foi possível carregar'),
  titulo: 'Não foi possível carregar esta parte do Turmma',
  texto: 'A página não chegou até aqui. Confira a conexão e tente de novo.',
} as const

/**
 * A área que exige sessão. O estado vem do módulo de sessão, não do cache de consultas: a sessão não é dado de
 * servidor para guardar (regra 50, item 3), e a troca de escola da 20.0 limpa o cache inteiro do TanStack Query.
 *
 * Sem sessão, leva à entrada. Com a API fora do ar, mostra o erro e o "Tentar de novo" — 5xx e queda de rede nunca
 * mandam ninguém para o login (regra 80, item 6).
 *
 * Com a sessão vencida, a tela continua montada e o login abre por cima dela: a professora pode estar no meio de uma
 * contestação, e o relógio não pode apagar o que ela escreveu (regra 80, item 6). Só o "Sair" e a aba que abriu sem
 * sessão levam à entrada.
 */
function Protegida({ children }: { children: ReactNode }) {
  const estado = useSyncExternalStore(assinarSessao, estadoDaSessao)
  // Só na aba que acabou de abrir: depois disso, quem muda o estado é a entrada, a saída ou o "Tentar de novo".
  useEffect(() => {
    if (estado === 'desconhecida') void abrirSessaoPeloCookie()
  }, [estado])

  if (estado === 'aberta') return children
  if (estado === 'vencida')
    return (
      <>
        {children}
        <LoginPorCima />
      </>
    )
  if (estado === 'anonima') return <Redirect to={ROTAS.entrar} replace />
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      {estado === 'indisponivel' ? (
        <EstadoErro erro={erroDaSessao()} aoTentarDeNovo={() => void abrirSessaoPeloCookie()} />
      ) : (
        <EstadoCarregando rotulo="Abrindo a sua sessão…" />
      )}
    </div>
  )
}

/**
 * A guarda de papel da área (W2): a área só é baixada e montada para a sessão daquele papel. Para qualquer outro papel,
 * o endereço responde "Página não encontrada", igual a um endereço que não existe, e o chunk da área nem é pedido.
 *
 * É só a tela. Quem decide o que cada papel alcança é a API, pela matriz de permissão e pelo escopo do token (regra 00,
 * item 1): a guarda existe para ninguém cair numa tela que não é dele, e não para proteger dado.
 *
 * O papel vem do `/v1/eu`, a mesma consulta da casca. Toda sessão nova esvazia o cache (`main.tsx`), também a da mesma
 * pessoa que volta pelo login por cima da tela, e o `/v1/eu` fica sem dado até a resposta nova chegar. Nesse meio tempo
 * a guarda segue com o papel que já conhecia, e a área fica montada: é ela que guarda o que a professora estava
 * escrevendo, e a sessão vencer não pode apagar isso (regra 80, item 6). Quando é outra pessoa, a casca leva a aba à
 * página inicial (`lembrarQuemEsta`), e a área sai junto; quando a resposta nova traz outro papel, a guarda responde
 * "não encontrada".
 */
function AreaDoPapel({ papel }: { papel: PapelDeUsuario }) {
  const eu = useQuery(consultaEu)
  const [papelConhecido, definirPapelConhecido] = useState(eu.data?.papel)
  if (eu.data !== undefined && eu.data.papel !== papelConhecido) definirPapelConhecido(eu.data.papel)
  const papelDaSessao = eu.data?.papel ?? papelConhecido

  if (papelDaSessao === undefined) {
    if (eu.isError) return <EstadoErro erro={eu.error} tentando={eu.isFetching} aoTentarDeNovo={() => void eu.refetch({ cancelRefetch: false })} />
    return <EstadoCarregando rotulo="Carregando…" />
  }
  if (papelDaSessao !== papel) return <ConteudoNaoEncontrado />
  const Area = AREA_DO_PAPEL[papel]
  return (
    <FronteiraDaArea {...FALHA_DA_AREA}>
      <Suspense fallback={<EstadoCarregando rotulo="Carregando…" />}>
        <Area />
      </Suspense>
    </FronteiraDaArea>
  )
}

/**
 * Os endereços com sessão: a página inicial e as áreas de cada papel. Uma rota só para todos, para a casca ficar montada
 * na troca de tela — a gaveta, o seletor e o relógio de inatividade não recomeçam a cada clique na lateral.
 */
const CAMINHOS_COM_SESSAO = /^\/(?:(?:coordenacao|professor|aluno)(?:\/.*)?)?$/

/** A área autenticada: a casca da escola em volta de cada tela, com a navegação do papel e o "Sair" (RF13 do F1). */
function AreaAutenticada() {
  return (
    <Protegida>
      <CascaDaEscola>
        <Switch>
          <Route path={ROTAS.inicio} component={Inicio} />
          <Route path={BASE_DA_AREA.coordenador} nest>
            <AreaDoPapel papel="coordenador" />
          </Route>
          <Route path={BASE_DA_AREA.professor} nest>
            <AreaDoPapel papel="professor" />
          </Route>
          <Route path={BASE_DA_AREA.aluno} nest>
            <AreaDoPapel papel="aluno" />
          </Route>
        </Switch>
      </CascaDaEscola>
    </Protegida>
  )
}

/**
 * Quem já tem sessão **nesta aba** não fica na tela de entrada: o Voltar depois de entrar devolve à área autenticada.
 *
 * Abrir `/entrar` direto, com a aba recém-carregada, mostra o formulário mesmo com o cookie de renovação válido, e é
 * de propósito: renovar aqui faria toda a escola somar uma chamada a `/v1/sessao/renovar` ao abrir a tela de entrada
 * às 7h30, justamente para receber 401 na maioria das vezes (regra 80). Quem já entrou chega pela área autenticada.
 */
function Entrada() {
  const estado = useSyncExternalStore(assinarSessao, estadoDaSessao)
  const [, navegar] = useLocation()
  useEffect(() => {
    if (estado === 'aberta') navegar(ROTAS.inicio, { replace: true })
  }, [estado, navegar])
  return <Entrar />
}

export function Rotas() {
  return (
    <Switch>
      <Route path={ROTAS.entrar} component={Entrada} />
      {/* A área do operador, aninhada: dentro dela os caminhos são relativos a `/operacao`. */}
      <Route path={BASE_DA_OPERACAO} nest>
        <FronteiraDaArea
          tituloDaAba={tituloDaOperacao('Não foi possível carregar')}
          titulo="Operação Turmma"
          texto="Não foi possível carregar a área da operação. Confira a conexão e tente de novo."
          paginaInteira
        >
          <Suspense
            fallback={
              <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 sm:px-6">
                <EstadoCarregando rotulo="Carregando a área da operação…" />
              </div>
            }
          >
            <AreaDaOperacao />
          </Suspense>
        </FronteiraDaArea>
      </Route>
      <Route path={ROTAS.sistema} component={Casca} />
      {/* O endereço da escola, por onde o aluno entra (RF7). Fica antes das rotas fixas por ser a única com parâmetro. */}
      <Route path={ROTAS.escola}>{(parametros) => <EntrarNaEscola slug={parametros.slug} />}</Route>
      {/* Etapas do login, sem sessão ainda. */}
      <Route path={ROTAS.mfa} component={Mfa} />
      <Route path={ROTAS.configurarMfa} component={ConfigurarMfa} />
      <Route path={ROTAS.convite} component={Convite} />
      <Route path={ROTAS.escolherEscola} component={EscolherEscola} />
      <Route path={CAMINHOS_COM_SESSAO} component={AreaAutenticada} />
      <Route component={PaginaNaoEncontrada} />
    </Switch>
  )
}
