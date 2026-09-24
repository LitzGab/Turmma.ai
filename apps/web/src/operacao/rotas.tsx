import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link, Redirect, Route, Switch } from 'wouter'
import { criarClienteDeConsultas } from '../api/cliente-de-consultas'
import { Botao } from '../componentes/Botao'
import { EstadoCarregando } from '../componentes/estado'
import { consultaEuDoOperador } from './api/eu'
import {
  abrirSessaoDeOperadorPeloCookie,
  aoTrocarDeSessaoDeOperador,
  assinarSessaoDeOperador,
  erroDaSessaoDeOperador,
  estadoDaSessaoDeOperador,
  sairComoOperador,
} from './api/sessao'
import { ROTAS_DA_OPERACAO } from './caminhos'
import { CascaDaOperacao, CascaPublicaDaOperacao, ErroDaOperacao } from './componentes/CascaDaOperacao'
import { useInatividadeDaOperacao } from './inatividade'
import { ConfigurarMfa } from './paginas/ConfigurarMfa'
import { Convite } from './paginas/Convite'
import { Entrar } from './paginas/Entrar'
import { Mfa } from './paginas/Mfa'
import { useTituloDaPagina } from './titulo'

/**
 * A área do operador Turmma (A0), carregada por `import()` num chunk próprio (`operacao-*.js`): a web da escola nunca
 * baixa este código (Tech Spec da A0, seção 9, B2).
 *
 * O cache de consultas é **outro**, e não o da escola: a troca de pessoa numa sessão não esvazia a outra, e nenhuma
 * consulta de uma aparece na outra. Toda sessão de operador que acaba, ou que muda de dono, esvazia o daqui inteiro.
 */
const clienteDaOperacao = criarClienteDeConsultas()
aoTrocarDeSessaoDeOperador(() => {
  clienteDaOperacao.clear()
})

/** A área que exige a sessão do operador. Sem sessão, a entrada; com a API fora, a mensagem e o "Tentar de novo". */
function Protegida({ children }: { children: ReactNode }) {
  const estado = useSyncExternalStore(assinarSessaoDeOperador, estadoDaSessaoDeOperador)
  useEffect(() => {
    if (estado === 'desconhecida') void abrirSessaoDeOperadorPeloCookie()
  }, [estado])

  if (estado === 'aberta') return children
  if (estado === 'anonima') return <Redirect to={ROTAS_DA_OPERACAO.entrar} replace />
  return (
    <CascaPublicaDaOperacao titulo="Operação Turmma">
      {estado === 'indisponivel' ? (
        <ErroDaOperacao erro={erroDaSessaoDeOperador()} aoTentarDeNovo={() => void abrirSessaoDeOperadorPeloCookie()} />
      ) : (
        <EstadoCarregando rotulo="Abrindo a sua sessão…" />
      )}
    </CascaPublicaDaOperacao>
  )
}

/**
 * O aviso 2 min antes do fim da sessão parada (Tech Spec da A0, seção 9). Não é diálogo: não rouba o foco de quem
 * voltou à tela, e é anunciado pelo `role="alert"`. "Continuar" e "Sair" do mesmo tamanho (D59).
 */
function AvisoDeInatividade({ aoContinuar, aoSair }: { aoContinuar: () => void; aoSair: () => void }) {
  return (
    <section aria-label="Aviso de inatividade" className="fixed inset-x-0 bottom-0 z-10 border-t border-pendente bg-pendente-cx">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p role="alert" className="text-pendente">
          Sua sessão vai terminar em 2 minutos por falta de uso.
        </p>
        <div className="flex flex-wrap gap-3">
          <Botao onClick={aoContinuar}>Continuar na sessão</Botao>
          <button
            type="button"
            onClick={aoSair}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 py-2 text-base font-medium text-tinta hover:bg-realce-suave"
          >
            Sair
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * A casca da operação com a sessão aberta. Os quatro estados do `/eu`: carregando, erro (o 503 fica na tela, com
 * "Tentar de novo"), com dado (o nome na faixa) e vazio, que é o conteúdo desta fase: o painel chega na A0b.
 */
function Inicio() {
  useTituloDaPagina('Início')
  const eu = useQuery(consultaEuDoOperador)
  const [saindo, definirSaindo] = useState(false)
  const { avisoVisivel, continuar } = useInatividadeDaOperacao(true)

  function sair(): void {
    if (saindo) return
    definirSaindo(true)
    void sairComoOperador().finally(() => definirSaindo(false))
  }

  return (
    <CascaDaOperacao titulo="Início da operação" nome={eu.data?.nome} aoSair={sair} saindo={saindo}>
      {eu.isPending ? (
        <EstadoCarregando rotulo="Carregando a operação…" />
      ) : eu.isError ? (
        <ErroDaOperacao erro={eu.error} aoTentarDeNovo={() => void eu.refetch()} tentando={eu.isFetching} />
      ) : (
        <div className="rounded-cartao border border-dashed border-borda-campo bg-superficie p-4">
          <p className="font-medium text-tinta">Você está na operação como {eu.data.apelido}.</p>
          <p className="mt-1 text-apoio">
            As telas de redes, escolas e uso ainda não chegaram. Por enquanto, criar rede, escola e o convite da
            coordenação é pelos comandos <code>ops:*</code> no terminal.
          </p>
        </div>
      )}
      {avisoVisivel && <AvisoDeInatividade aoContinuar={continuar} aoSair={sair} />}
    </CascaDaOperacao>
  )
}

/** As rotas da operação, relativas a `/operacao` (o `Route` aninhado em `apps/web/src/rotas.tsx`). */
export default function RotasDaOperacao() {
  return (
    <QueryClientProvider client={clienteDaOperacao}>
      <Switch>
        <Route path={ROTAS_DA_OPERACAO.convite} component={Convite} />
        <Route path={ROTAS_DA_OPERACAO.entrar} component={Entrar} />
        <Route path={ROTAS_DA_OPERACAO.mfa} component={Mfa} />
        <Route path={ROTAS_DA_OPERACAO.configurarMfa} component={ConfigurarMfa} />
        <Route path={ROTAS_DA_OPERACAO.inicio}>
          <Protegida>
            <Inicio />
          </Protegida>
        </Route>
        <Route>
          <NaoEncontradaNaOperacao />
        </Route>
      </Switch>
    </QueryClientProvider>
  )
}

/** Endereço da operação que não existe: diz o que fazer, sem código nem status (regra 50, item 12). */
function NaoEncontradaNaOperacao() {
  useTituloDaPagina('Página não encontrada')
  return (
    <CascaPublicaDaOperacao titulo="Página não encontrada">
      <p className="text-apoio">
        Confira o endereço digitado ou volte à{' '}
        <Link className="text-caramelo-texto underline" to={ROTAS_DA_OPERACAO.entrar}>
          entrada da operação
        </Link>
        .
      </p>
    </CascaPublicaDaOperacao>
  )
}
