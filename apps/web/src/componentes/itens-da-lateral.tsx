import { useContext, type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { estaNoItem, type AgenteDaLateral, type IconeDoItem, type ItemDaNavegacao } from '../areas/navegacao'
import { ContextoDaGaveta } from './gaveta'
import { Icone } from './Icone'
import { Ladrilho } from './Ladrilho'

/**
 * O lugar da lateral (`docs/interface.md` 11.1; D80): uma linha de 52 px de canto 12 e borda de 2, com o ícone numa caixa de
 * 36 e o rótulo em `t-rotulo`. O mesmo desenho serve ao link de navegação e ao botão "Sair", e é por isso que os dois têm
 * a mesma altura e a mesma largura (RF15; D59): a altura é de quem desenha o lugar, e não de quem o usa.
 *
 * - **Aceso** tem a borda `azul-borda`, o fundo `azul-claro` e o texto `azul-texto`, e o `aria-current` quando é link. A
 *   pista que não é cor é a borda, que no apagado é transparente: o peso do texto não distingue mais (os dois em 700), e o
 *   filete de antes saiu.
 * - **Apagado** tem a borda transparente, o texto `sutil` e, no hover, `fundo-suave` com `tinta`. O espaço da borda existe
 *   nos dois estados, e por isso acender não desloca nada.
 * - No **trilho** o lugar é um quadrado de 52 px com só o ícone, e o rótulo vai para o leitor de tela e para a dica.
 */
const FORMA_DO_LUGAR = 'group relative flex items-center rounded-controle border-2 text-left'
const LUGAR_ABERTO = 'min-h-13 w-full gap-3 px-2'
const LUGAR_NO_TRILHO = 'size-13 justify-center'
const LUGAR_ACESO = 'border-azul-borda bg-azul-claro text-azul-texto'
const LUGAR_APAGADO = 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta'

/**
 * O lugar como botão, o do "Sair": a forma do lugar apagado (o hover só com o botão ligado) e o desligado em `inativo`.
 * Aberto ou no trilho, tem a mesma medida do link ao lado (RF15).
 */
export function classeDoBotaoDeLugar(trilho: boolean): string {
  return `${FORMA_DO_LUGAR} t-rotulo border-transparent text-sutil enabled:hover:bg-fundo-suave enabled:hover:text-tinta disabled:text-inativo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO}`
}

/**
 * A dica do trilho: o rótulo que o ícone sozinho não diz, ao passar o mouse **e** ao chegar pelo teclado. Para o leitor
 * de tela o nome já está no próprio controle, e a dica é só visual. É uma caixa flutuante como o menu: face `fundo`, borda
 * de 2 px e degrau de 4 (`shadow-flutua`), e a face do oficial é só do botão oficial.
 */
export function Dica({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="t-apoio pointer-events-none absolute top-1/2 left-full z-20 ml-3 hidden -translate-y-1/2 rounded-controle bg-fundo px-3 py-1.5 whitespace-nowrap text-tinta shadow-flutua group-hover:block group-focus-visible:block"
    >
      {children}
    </span>
  )
}

/**
 * O ícone de um lugar, na caixa de 36 do lugar (D80): o ilustrado a 32 px, ou o do `lucide` dentro de um `Ladrilho` na
 * família do lugar. Sempre decoração: o rótulo está escrito ao lado, ou no nome do controle, e dizê-lo duas vezes seria
 * ruído (9.4, "ícone sempre com rótulo").
 */
export function IconeDoLugar({ icone }: { icone: IconeDoItem }) {
  if ('lugar' in icone) {
    return (
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center">
        <Icone nome={icone.lugar} tamanho={32} />
      </span>
    )
  }
  // O `lucide` num `Ladrilho` de 36, com o traço de 2,5 px da 9.4.
  const Desenho = icone.lucide
  return (
    <Ladrilho familia={icone.familia} tamanho={36}>
      <Desenho strokeWidth={2.5} />
    </Ladrilho>
  )
}

/**
 * Um item da navegação. O selecionado tem **o `aria-current` e a borda de 2 px**, além da cor (`docs/interface.md` 11.1): o
 * fundo `azul-claro` sozinho é pouco contra o branco de uma tela de Chromebook de entrada, e a borda `azul-borda` fica a 2 px
 * do que é apagado, que não a tem.
 *
 * Tocar num item fecha a gaveta, também quando o item é o da tela aberta e o endereço não muda.
 */
export function ItemDaLateral({ item, trilho }: { item: ItemDaNavegacao; trilho: boolean }) {
  const [caminho] = useLocation()
  const { fechar } = useContext(ContextoDaGaveta)
  const aqui = estaNoItem(caminho, item)
  return (
    <li>
      <Link
        to={item.caminho}
        onClick={fechar}
        aria-current={aqui ? 'page' : undefined}
        className={`${FORMA_DO_LUGAR} t-rotulo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO} ${aqui ? LUGAR_ACESO : LUGAR_APAGADO}`}
      >
        <IconeDoLugar icone={item.icone} />
        {trilho ? (
          <>
            <span className="sr-only">{item.rotulo}</span>
            <Dica>{item.rotulo}</Dica>
          </>
        ) : (
          <span className="min-w-0 break-words">{item.rotulo}</span>
        )}
      </Link>
    </li>
  )
}

interface PropsDaListaDeItens {
  readonly itens: readonly ItemDaNavegacao[]
  /** O nome do grupo para o leitor de tela: `Seções` já é de quem tem os itens principais, e este não se confunde com ele. */
  readonly rotulo: string
  readonly trilho: boolean
}

/**
 * Os itens do pé da lateral — o rodapé fixo do aluno e os links do menu da pessoa —, numa navegação com nome próprio, para
 * `Seções` continuar sendo só os itens principais do papel. Sem item, não existe nem a região. Cada um é o mesmo
 * `ItemDaLateral`: as pistas do selecionado, 52 px de altura e, no trilho, o ícone com a dica.
 */
export function ListaDeItens({ itens, rotulo, trilho }: PropsDaListaDeItens) {
  if (itens.length === 0) return null
  return (
    <nav aria-label={rotulo}>
      <ul className={`flex flex-col gap-2 ${trilho ? 'items-center' : ''}`}>
        {itens.map((item) => (
          <ItemDaLateral key={item.caminho} item={item} trilho={trilho} />
        ))}
      </ul>
    </nav>
  )
}

/** O que espera a pessoa naquele agente: quantas entregas pendentes a leitura trouxe, e se há mais além da página. */
export interface EsperandoNoTime {
  readonly quantidade: number
  readonly haMais: boolean
}

/** "3 esperando você", "100 ou mais esperando você". Só existe com pendência: zero não tem texto. */
export function textoDoQueEspera({ quantidade, haMais }: EsperandoNoTime): string | undefined {
  if (quantidade === 0) return undefined
  return `${String(quantidade)}${haMais ? ' ou mais' : ''} esperando você`
}

interface PropsDaSecaoDoTime {
  readonly agentes: readonly AgenteDaLateral[]
  readonly esperando: EsperandoNoTime
  readonly trilho: boolean
}

/**
 * "Seu time" na lateral (`docs/interface.md` 11.1 e 11.4): o rótulo do grupo, em `t-selo` e `sutil`, e uma linha por
 * agente, com o **ícone da função num `Ladrilho`** na família dele e o contador do que espera a pessoa. No trilho, o
 * ladrilho com um ponto e a dica.
 *
 * **Sem a onça**: a casca é da entrada, e a cabeça da onça mora fora dela (Tech Spec da X1, 7b). O avatar do agente com
 * o nome da função e o selo "IA" é o da `AssinaturaIA`, nas telas; o grupo sai da lateral na X3.
 *
 * **O ponto e o contador só dizem que há algo esperando** (D59): não piscam, não crescem, não contam não lidas, e somem
 * quando não há pendência. O contador é escrito aqui, e não pelo `Contador`, que é peça de fora da entrada
 * (`PECAS_FORA_DA_ENTRADA`) e fica no pedaço `pecas-*`.
 */
export function SecaoDoTime({ agentes, esperando, trilho }: PropsDaSecaoDoTime) {
  const [caminho] = useLocation()
  const { fechar } = useContext(ContextoDaGaveta)
  if (agentes.length === 0) return null
  return (
    <nav aria-label="Seu time" className="border-t-2 border-borda pt-3">
      {!trilho && <p className="t-selo px-2 pb-2 text-sutil">Seu time</p>}
      <ul className={`flex flex-col gap-2 ${trilho ? 'items-center' : ''}`}>
        {agentes.map((item) => {
          const aqui = estaNoItem(caminho, item)
          const Desenho = item.icone
          // O que espera a pessoa é do agente que deixa entrega para decidir: os outros não levam contador nem ponto.
          const espera = item.comEspera ? textoDoQueEspera(esperando) : undefined
          return (
            <li key={item.agente}>
              <Link
                to={item.caminho}
                onClick={fechar}
                aria-current={aqui ? 'page' : undefined}
                className={`${FORMA_DO_LUGAR} t-rotulo ${trilho ? LUGAR_NO_TRILHO : LUGAR_ABERTO} ${aqui ? LUGAR_ACESO : LUGAR_APAGADO}`}
              >
                <span aria-hidden="true" className="relative inline-flex shrink-0">
                  <Ladrilho familia={item.familia} tamanho={36}>
                    <Desenho strokeWidth={2.5} />
                  </Ladrilho>
                  {trilho && espera !== undefined && <span data-ponto-de-espera="" className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-lateral bg-caramelo" />}
                </span>
                {trilho ? (
                  <>
                    <span className="sr-only">
                      {item.rotulo}
                      {espera !== undefined && `, ${espera}`}
                    </span>
                    <Dica>{espera === undefined ? item.rotulo : `${item.rotulo} · ${espera}`}</Dica>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 break-words">{item.rotulo}</span>
                    {espera !== undefined && (
                      <span data-contador-do-time="" className="shrink-0 rounded-full bg-pendente-cx px-1.5 text-[13px] font-semibold text-pendente tabular-nums">
                        {esperando.quantidade}
                        {esperando.haMais && '+'}
                        <span className="sr-only"> esperando você</span>
                      </span>
                    )}
                  </>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
