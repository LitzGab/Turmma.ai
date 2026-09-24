import { Component, lazy, Suspense, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { Link, Redirect, Route, Switch, useLocation } from 'wouter'
import { abrirSessaoPeloCookie, assinarSessao, erroDaSessao, estadoDaSessao } from './api/sessao'
import { ROTAS } from './caminhos'
import { Botao } from './componentes/Botao'
import { Cabecalho } from './componentes/Cabecalho'
import { EstadoCarregando, EstadoErro } from './componentes/estado'
import { LoginPorCima } from './componentes/LoginPorCima'
import { Casca } from './paginas/Casca'
import { ConfigurarMfa } from './paginas/ConfigurarMfa'
import { Convite } from './paginas/Convite'
import { Entrar } from './paginas/Entrar'
import { EntrarNaEscola } from './paginas/EntrarNaEscola'
import { EscolherEscola } from './paginas/EscolherEscola'
import { Inicio } from './paginas/Inicio'
import { Mfa } from './paginas/Mfa'
import { Vinculos } from './paginas/Vinculos'

/**
 * A área do operador Turmma (A0), só por `import()`: vira o chunk `operacao-*.js` (`vite.config.ts`), que nenhuma tela
 * da escola baixa (Tech Spec da A0, seção 9, B2). Nada daqui importa de `./operacao/` de outro jeito: o teste de
 * `apps/web/nome-dos-chunks.test.ts` reprova, no build, o `import` estático.
 */
const AreaDaOperacao = lazy(() => import('./operacao/rotas'))

/** O caminho da área, repetido aqui para a entrada não importar nada de `./operacao/`. */
const BASE_DA_OPERACAO = '/operacao'

/**
 * A fronteira de erro do chunk da operação: o `import()` que falha (rede da escola caindo, 3G no celular) não vira tela
 * branca. "Tente de novo" recarrega a página, porque o navegador guarda a falha do módulo e um segundo `import()` do
 * mesmo endereço devolveria a mesma falha. A tela da operação não tem rascunho que a recarga possa perder.
 */
class FronteiraDaOperacao extends Component<{ children: ReactNode }, { falhou: boolean }> {
  override state = { falhou: false }

  static getDerivedStateFromError(): { falhou: boolean } {
    return { falhou: true }
  }

  override render() {
    if (!this.state.falhou) return this.props.children
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-fundo px-4 py-6 text-tinta sm:px-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Operação Turmma</h1>
        <p role="alert" className="rounded-controle border border-erro bg-erro-cx p-4 text-erro">
          Não foi possível carregar a área da operação. Confira a conexão e tente de novo.
        </p>
        <Botao className="self-start" onClick={() => window.location.reload()}>
          Tente de novo
        </Botao>
      </main>
    )
  }
}

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

/** A área autenticada: o cabeçalho com "Sair" em toda tela (RF13) e a página da rota. */
function AreaAutenticada({ children }: { children: ReactNode }) {
  return (
    <Protegida>
      <div className="min-h-screen bg-fundo text-tinta">
        <Cabecalho />
        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">{children}</main>
      </div>
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
        <FronteiraDaOperacao>
          <Suspense
            fallback={
              <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 sm:px-6">
                <EstadoCarregando rotulo="Carregando a área da operação…" />
              </div>
            }
          >
            <AreaDaOperacao />
          </Suspense>
        </FronteiraDaOperacao>
      </Route>
      <Route path={ROTAS.sistema} component={Casca} />
      {/* O endereço da escola, por onde o aluno entra (RF7). Fica antes das rotas fixas por ser a única com parâmetro. */}
      <Route path={ROTAS.escola}>{(parametros) => <EntrarNaEscola slug={parametros.slug} />}</Route>
      {/* Etapas do login, sem sessão ainda. */}
      <Route path={ROTAS.mfa} component={Mfa} />
      <Route path={ROTAS.configurarMfa} component={ConfigurarMfa} />
      <Route path={ROTAS.convite} component={Convite} />
      <Route path={ROTAS.escolherEscola} component={EscolherEscola} />
      <Route path={ROTAS.vinculos}>
        <AreaAutenticada>
          <Vinculos />
        </AreaAutenticada>
      </Route>
      <Route path={ROTAS.inicio}>
        <AreaAutenticada>
          <Inicio />
        </AreaAutenticada>
      </Route>
      <Route>
        <NaoEncontrada />
      </Route>
    </Switch>
  )
}

/** Endereço que não existe: diz o que fazer, sem código nem status (regra 50, item 12). */
function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-3 bg-fundo px-4 py-6 text-tinta sm:px-6">
      <h1 className="text-xl font-semibold sm:text-2xl">Página não encontrada</h1>
      <p className="text-apoio">
        Confira o endereço digitado ou volte à{' '}
        <Link className="text-caramelo-texto underline" to={ROTAS.inicio}>
          página inicial
        </Link>
        .
      </p>
    </main>
  )
}
