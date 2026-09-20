import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { Link, Redirect, Route, Switch, useLocation } from 'wouter'
import { abrirSessaoPeloCookie, assinarSessao, erroDaSessao, estadoDaSessao } from './api/sessao'
import { ROTAS } from './caminhos'
import { Cabecalho } from './componentes/Cabecalho'
import { EstadoCarregando, EstadoErro } from './componentes/estado'
import { Casca } from './paginas/Casca'
import { EmConstrucao } from './paginas/EmConstrucao'
import { Entrar } from './paginas/Entrar'
import { Inicio } from './paginas/Inicio'

/**
 * A área que exige sessão. O estado vem do módulo de sessão, não do cache de consultas: a sessão não é dado de
 * servidor para guardar (regra 50, item 3), e a troca de escola da 20.0 limpa o cache inteiro do TanStack Query.
 *
 * Sem sessão, leva à entrada. Com a API fora do ar, mostra o erro e o "Tentar de novo" — 5xx e queda de rede nunca
 * mandam ninguém para o login (regra 80, item 6).
 */
function Protegida({ children }: { children: ReactNode }) {
  const estado = useSyncExternalStore(assinarSessao, estadoDaSessao)
  // Só na aba que acabou de abrir: depois disso, quem muda o estado é a entrada, a saída ou o "Tentar de novo".
  useEffect(() => {
    if (estado === 'desconhecida') void abrirSessaoPeloCookie()
  }, [estado])

  if (estado === 'aberta') return children
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
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
      <Route path={ROTAS.sistema} component={Casca} />
      {/* Etapas do login sem sessão ainda: as telas chegam na 19.0 (MFA) e na 20.0 (escolha de escola). */}
      <Route path={ROTAS.mfa}>
        <EmConstrucao titulo="Segundo fator" />
      </Route>
      <Route path={ROTAS.configurarMfa}>
        <EmConstrucao titulo="Configurar o segundo fator" />
      </Route>
      <Route path={ROTAS.escolherEscola}>
        <EmConstrucao titulo="Escolher a escola" />
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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-3 bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <h1 className="text-xl font-semibold sm:text-2xl">Página não encontrada</h1>
      <p className="text-slate-700">
        Confira o endereço digitado ou volte à{' '}
        <Link className="underline" to={ROTAS.inicio}>
          página inicial
        </Link>
        .
      </p>
    </main>
  )
}
