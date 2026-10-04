import { useQuery } from '@tanstack/react-query'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { Link, useLocation } from 'wouter'
import { consultaEntregasPendentes, quantasEsperam } from '../api/entregas'
import { consultaEu } from '../api/eu'
import { assinarSessao, estadoDaSessao, lembrarQuemEsta, sair } from '../api/sessao'
import { NAVEGACAO, SEU_TIME, type AgenteDaLateral } from '../areas/navegacao'
import { ROTAS } from '../caminhos'
import { NOME_DO_PAPEL } from '../papeis'
import { useInatividade } from '../sessao/inatividade'
import { ContextoDaGaveta, type Gaveta } from './gaveta'
import { Dica, ItemDaLateral, SecaoDoTime, type EsperandoNoTime } from './itens-da-lateral'
import { Marca } from './Marca'
import { MenuDaPessoa } from './MenuDaPessoa'
import { SeletorDeEscola } from './SeletorDeEscola'

/**
 * As três larguras da casca (`docs/interface.md` 11.1, "Responsivo"; D51): abaixo de 768 px, a barra no topo com a
 * gaveta; de 768 a 1023 px, o trilho de 56 px, que abre a lateral por cima do conteúdo; a partir de 1024 px (o
 * Chromebook de 1366 × 768 cai aqui), a lateral aberta de 260 px, que recolhe para o trilho por escolha.
 *
 * Decidido em JavaScript, e não só no CSS, para existir na página **uma** lateral por vez: esconder as outras com
 * `display: none` deixaria dois seletores de escola e duas navegações no DOM, com os mesmos ids.
 */
type Faixa = 'estreita' | 'media' | 'larga'

const CONSULTA_MEDIA = '(min-width: 768px)'
const CONSULTA_LARGA = '(min-width: 1024px)'

function faixaDeAgora(): Faixa {
  if (window.matchMedia(CONSULTA_LARGA).matches) return 'larga'
  return window.matchMedia(CONSULTA_MEDIA).matches ? 'media' : 'estreita'
}

function assinarFaixa(aoMudar: () => void): () => void {
  const consultas = [CONSULTA_MEDIA, CONSULTA_LARGA].map((consulta) => window.matchMedia(consulta))
  for (const consulta of consultas) consulta.addEventListener('change', aoMudar)
  return () => {
    for (const consulta of consultas) consulta.removeEventListener('change', aoMudar)
  }
}

/**
 * A lateral recolhida por escolha, no computador, fica guardada neste navegador (`docs/interface.md` 11.1). É preferência
 * de tela, sem nada da pessoa nem da escola, e por isso pode ficar no `localStorage` (regra 50, item 7). Sem acesso a
 * ele (navegação anônima, política do Chromebook gerenciado), a lateral abre aberta, como na primeira vez.
 */
const CHAVE_DA_LATERAL_RECOLHIDA = 'educa.lateral-recolhida'

function lerRecolhida(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_DA_LATERAL_RECOLHIDA) === 'sim'
  } catch {
    return false
  }
}

function guardarRecolhida(recolhida: boolean): void {
  try {
    if (recolhida) window.localStorage.setItem(CHAVE_DA_LATERAL_RECOLHIDA, 'sim')
    else window.localStorage.removeItem(CHAVE_DA_LATERAL_RECOLHIDA)
  } catch {
    // Sem armazenamento, a escolha vale até a aba fechar: a lateral continua funcionando.
  }
}

/** O botão só de ícone da lateral: 44 px, o nome para o leitor de tela e, no computador, a dica. */
const CLASSE_DO_BOTAO_DE_ICONE = 'group relative flex size-11 shrink-0 items-center justify-center rounded-linha text-apoio hover:bg-realce-suave hover:text-tinta'

interface DadosDaPessoa {
  readonly nome: string
  readonly papel: string
}

interface PropsDaLateralAberta {
  readonly pessoa: DadosDaPessoa | undefined
  readonly itens: (typeof NAVEGACAO)[keyof typeof NAVEGACAO]
  /** "Seu time": os agentes que o papel acompanha e o que espera a pessoa (A2). Vazio para quem não tem o grupo. */
  readonly time: readonly AgenteDaLateral[]
  readonly esperando: EsperandoNoTime
  readonly seletor: ReactNode
  /** O botão do topo, ao lado da marca: "Recolher a lateral" no computador, "Fechar o menu" na gaveta. */
  readonly botaoDoTopo: ReactNode
  readonly aoSair: () => void
  readonly saindo: boolean
}

/** A lateral aberta, de 260 px no computador e dentro da gaveta: marca, escola, navegação e a pessoa no rodapé. */
function LateralAberta({ pessoa, itens, time, esperando, seletor, botaoDoTopo, aoSair, saindo }: PropsDaLateralAberta) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-2">
      <div className="flex items-center justify-between gap-2">
        <Link to={ROTAS.inicio} aria-label="Turmma, página inicial" className="rounded-linha px-2 py-1.5 hover:bg-realce-suave">
          <Marca />
        </Link>
        {botaoDoTopo}
      </div>
      <div className="px-1">{seletor}</div>
      {itens.length > 0 && (
        <nav aria-label="Seções">
          <ul className="flex flex-col gap-0.5">
            {itens.map((item) => (
              <ItemDaLateral key={item.caminho} item={item} trilho={false} />
            ))}
          </ul>
        </nav>
      )}
      <SecaoDoTime agentes={time} esperando={esperando} trilho={false} />
      <div className="mt-auto">
        <MenuDaPessoa nome={pessoa?.nome} papel={pessoa?.papel} aoSair={aoSair} saindo={saindo} />
      </div>
    </div>
  )
}

interface PropsDoTrilho {
  readonly itens: (typeof NAVEGACAO)[keyof typeof NAVEGACAO]
  readonly time: readonly AgenteDaLateral[]
  readonly esperando: EsperandoNoTime
  readonly botaoDeAbrir: RefObject<HTMLButtonElement | null>
  readonly aoAbrir: () => void
  readonly lateralAberta: boolean
  readonly aoSair: () => void
  readonly saindo: boolean
}

/**
 * O trilho de 56 px: a pinta, o "Abrir a lateral", os ícones com a dica de cada um e o "Sair". Nenhum rótulo sobra
 * cortado (P04): ou aparece inteiro, na dica, ou não aparece.
 */
function Trilho({ itens, time, esperando, botaoDeAbrir, aoAbrir, lateralAberta, aoSair, saindo }: PropsDoTrilho) {
  return (
    <div className="sticky top-0 z-10 flex h-screen w-14 shrink-0 flex-col items-center gap-3 self-start border-r border-linha bg-lateral py-2">
      <Link to={ROTAS.inicio} aria-label="Turmma, página inicial" className="flex size-11 items-center justify-center rounded-linha hover:bg-realce-suave">
        <img src="/marca/turmma-pinta.svg" alt="" width={24} height={24} className="h-6 w-6" />
      </Link>
      <button ref={botaoDeAbrir} type="button" onClick={aoAbrir} aria-expanded={lateralAberta} className={CLASSE_DO_BOTAO_DE_ICONE}>
        <PanelLeftOpen aria-hidden="true" size={20} strokeWidth={1.75} />
        <span className="sr-only">Abrir a lateral</span>
        <Dica>Abrir a lateral</Dica>
      </button>
      {itens.length > 0 && (
        <nav aria-label="Seções">
          <ul className="flex flex-col items-center gap-0.5">
            {itens.map((item) => (
              <ItemDaLateral key={item.caminho} item={item} trilho />
            ))}
          </ul>
        </nav>
      )}
      <SecaoDoTime agentes={time} esperando={esperando} trilho />
      <div className="mt-auto">
        <MenuDaPessoa aoSair={aoSair} saindo={saindo} trilho />
      </div>
    </div>
  )
}

/**
 * A casca da escola, igual nos três papéis (`docs/interface.md` 11.1; D72, D73): a lateral com a marca, o seletor de
 * escola (regra 50, item 13), a navegação do papel (`areas/navegacao.ts`) e a pessoa no rodapé, com o "Sair" a um
 * clique (P18, D59). O conteúdo da rota vem no `<main>`, em coluna, com a margem de 16 px no celular e 24 px a partir de
 * 768 px (P03).
 *
 * Abaixo de 768 px a lateral vira **gaveta**, num `dialog` modal: o navegador prende o foco nela, o Esc fecha, e o que
 * está atrás fica inerte. A barra do topo mostra o botão do menu, a pinta, a escola e o **Sair**, que continua a um
 * toque também no celular (D59). A gaveta fecha ao escolher um item, e fecha sozinha quando uma fronteira de erro
 * assume a tela (`FronteiraDaArea`).
 *
 * Esta é a única peça que existe em toda tela com sessão, e por isso é daqui que saem o relógio de inatividade (RF13
 * do F1) e a memória de quem está na aba, que o login por cima usa para reconhecer quem volta. Os dois dependem do
 * `/v1/eu`, que é a mesma consulta da navegação.
 *
 * "Sair" encerra a sessão na API, o que apaga o cookie de renovação, e só então volta à entrada: no Chromebook do
 * carrinho, o aluno seguinte não herda nada do anterior.
 */
export function CascaDaEscola({ children }: { children: ReactNode }) {
  const [caminho, navegar] = useLocation()
  const [saindo, definirSaindo] = useState(false)
  const estado = useSyncExternalStore(assinarSessao, estadoDaSessao)
  const eu = useQuery(consultaEu)
  const dados = eu.data
  const faixa = useSyncExternalStore(assinarFaixa, faixaDeAgora)
  const [recolhida, definirRecolhida] = useState(lerRecolhida)
  const [gavetaAberta, definirGavetaAberta] = useState(false)
  const gaveta = useRef<HTMLDialogElement>(null)
  const botaoDeAbrir = useRef<HTMLButtonElement>(null)
  const botaoDeRecolher = useRef<HTMLButtonElement>(null)
  // Recolher ou abrir troca a lateral inteira, e o botão que tinha o foco sai da página com ela: o foco vai para o
  // botão que faz o contrário, e não se perde no `body`.
  const focarAposTrocar = useRef(false)

  useEffect(() => {
    if (dados === undefined) return
    // Outra pessoa entrou depois de a sessão anterior vencer: é o Chromebook do carrinho passando de mão. A tela que
    // estava aberta sai da frente dela, e com ela o que a pessoa anterior tinha escrito (RF13 do F1).
    if (lembrarQuemEsta(dados)) navegar(ROTAS.inicio, { replace: true })
  }, [dados, navegar])
  // Com a sessão já vencida, o relógio para: quem conta o tempo daí em diante é o login por cima da tela.
  useInatividade({ inatividadeMin: dados?.inatividadeMin, ativa: estado === 'aberta' })

  const fecharGaveta = useCallback(() => {
    // `close()` devolve o foco ao botão que abriu a gaveta, e o `onClose` do `dialog` atualiza o estado. Com a gaveta
    // já fechada, não faz nada.
    gaveta.current?.close()
  }, [])
  const contextoDaGaveta = useMemo<Gaveta>(() => ({ fechar: fecharGaveta }), [fecharGaveta])

  function abrirGaveta(): void {
    // Com a gaveta aberta, o resto da página fica inerte: o botão que a abre não é tocado duas vezes.
    gaveta.current?.showModal()
    definirGavetaAberta(true)
  }

  // A gaveta não sobrevive à troca de rota, à de pessoa ou escola (o seletor, o login por cima) nem à de largura: a tela
  // nova aparece sem nada por cima dela. O usuário entra nas dependências só para disparar o fechamento.
  const usuarioDaSessao = dados?.usuarioId
  useEffect(() => {
    fecharGaveta()
  }, [caminho, usuarioDaSessao, fecharGaveta])
  // Entrar na largura do computador desmonta a gaveta sem o `onClose`: o estado acompanha já no render, como a React
  // recomenda para estado que depende de outro valor, e não num efeito que pintaria a tela duas vezes. Entre o celular e
  // o trilho a gaveta continua montada, e aberta se estava: o estado fica como está.
  const [faixaDaGaveta, definirFaixaDaGaveta] = useState(faixa)
  if (faixaDaGaveta !== faixa) {
    definirFaixaDaGaveta(faixa)
    if (faixa === 'larga') definirGavetaAberta(false)
  }

  useEffect(() => {
    if (!focarAposTrocar.current) return
    focarAposTrocar.current = false
    ;(recolhida ? botaoDeAbrir : botaoDeRecolher).current?.focus()
  }, [recolhida])

  function recolher(valor: boolean): void {
    focarAposTrocar.current = true
    definirRecolhida(valor)
    guardarRecolhida(valor)
  }

  async function encerrar(): Promise<void> {
    if (saindo) return
    definirSaindo(true)
    // `sair` não lança: a sessão desta aba é esquecida mesmo se a API não respondeu, e a entrada é o lugar certo de
    // qualquer jeito. Quando o encerramento não foi confirmado, é lá que o aviso aparece.
    await sair()
    navegar(ROTAS.entrar, { replace: true })
  }
  const aoSair = () => void encerrar()

  const itens = dados === undefined ? [] : NAVEGACAO[dados.papel]
  // "Seu time" (A2): só quem tem agente na lateral pergunta o que espera por ele. A leitura fica velha quando uma entrega
  // nasce ou é decidida (`api/ciclo-de-execucao.ts`, `api/entregas.ts`) e ao voltar à aba; a casca não bate na API sozinha.
  const time = dados === undefined ? [] : SEU_TIME[dados.papel]
  const pendentes = useQuery({ ...consultaEntregasPendentes, enabled: time.length > 0 })
  const esperando = quantasEsperam(pendentes.data)
  const pessoa = dados === undefined ? undefined : { nome: dados.nome, papel: NOME_DO_PAPEL[dados.papel] }
  const seletor = dados !== undefined && <SeletorDeEscola escolaAtual={dados.escola.nome} acessos={dados.acessos} usuarioAtual={dados.usuarioId} />

  const conteudo = (
    <main className="mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col gap-6 px-4 pt-4 pb-8 md:px-6 md:pt-5">{children}</main>
  )

  const gavetaNaPagina = faixa !== 'larga' && (
    // O `dialog` fica na página fechado e só abre por `showModal()`: fechado, é `display: none`, e nem o leitor de tela
    // nem o Tab o alcançam. O clique fora da lateral cai no próprio `dialog` (o fundo escurecido) e fecha.
    <dialog
      ref={gaveta}
      aria-label="Menu"
      onClose={() => definirGavetaAberta(false)}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) fecharGaveta()
      }}
      className="m-0 h-full max-h-none w-[260px] max-w-[85vw] bg-lateral p-0 text-tinta shadow-flutua"
    >
      <LateralAberta
        pessoa={pessoa}
        itens={itens}
        time={time}
        esperando={esperando}
        seletor={seletor}
        aoSair={aoSair}
        saindo={saindo}
        botaoDoTopo={
          <button type="button" onClick={fecharGaveta} className={CLASSE_DO_BOTAO_DE_ICONE}>
            <X aria-hidden="true" size={20} strokeWidth={1.75} />
            <span className="sr-only">Fechar o menu</span>
          </button>
        }
      />
    </dialog>
  )

  return (
    <ContextoDaGaveta value={contextoDaGaveta}>
      <div className="flex min-h-screen flex-col bg-fundo text-tinta md:flex-row">
        {faixa === 'estreita' && (
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-linha bg-fundo px-2">
            <button
              type="button"
              onClick={abrirGaveta}
              aria-haspopup="dialog"
              aria-expanded={gavetaAberta}
              className={CLASSE_DO_BOTAO_DE_ICONE}
            >
              <Menu aria-hidden="true" size={20} strokeWidth={1.75} />
              <span className="sr-only">Abrir o menu</span>
            </button>
            <Link to={ROTAS.inicio} aria-label="Turmma, página inicial" className="flex size-11 shrink-0 items-center justify-center rounded-linha hover:bg-realce-suave">
              <img src="/marca/turmma-pinta.svg" alt="" width={24} height={24} className="h-6 w-6" />
            </Link>
            <p className="min-w-0 flex-1 truncate font-medium">{dados?.escola.nome}</p>
            <button
              type="button"
              onClick={aoSair}
              disabled={saindo}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 text-base font-medium text-tinta enabled:hover:bg-realce-suave disabled:text-inativo"
            >
              {saindo ? 'Saindo…' : 'Sair'}
            </button>
          </header>
        )}
        {faixa === 'larga' && !recolhida ? (
          <div className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col self-start border-r border-linha bg-lateral">
            <LateralAberta
              pessoa={pessoa}
              itens={itens}
              time={time}
              esperando={esperando}
              seletor={seletor}
              aoSair={aoSair}
              saindo={saindo}
              botaoDoTopo={
                <button ref={botaoDeRecolher} type="button" onClick={() => recolher(true)} className={CLASSE_DO_BOTAO_DE_ICONE}>
                  <PanelLeftClose aria-hidden="true" size={20} strokeWidth={1.75} />
                  <span className="sr-only">Recolher a lateral</span>
                </button>
              }
            />
          </div>
        ) : (
          faixa !== 'estreita' && (
            <Trilho
              itens={itens}
              time={time}
              esperando={esperando}
              botaoDeAbrir={botaoDeAbrir}
              // No computador, abrir desfaz a escolha de recolher; entre 768 e 1023 px, a lateral abre por cima.
              aoAbrir={() => (faixa === 'larga' ? recolher(false) : abrirGaveta())}
              lateralAberta={faixa === 'media' && gavetaAberta}
              aoSair={aoSair}
              saindo={saindo}
            />
          )
        )}
        {gavetaNaPagina}
        {conteudo}
      </div>
    </ContextoDaGaveta>
  )
}
