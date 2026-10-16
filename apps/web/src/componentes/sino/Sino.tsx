import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { Aviso } from '../Aviso'
import { Botao } from '../Botao'
import { CLASSES_DO_LINK_SECUNDARIO } from '../botao-secundario'
import { Contador } from '../Contador'
import { EstadoCarregando, EstadoErro } from '../estado'
import { Icone } from '../Icone'
import { Linha } from '../Linha'
import { PainelLado } from '../PainelLado'

/** Um item da lista "Esperando você": o que é, por que importa e a tela que o resolve. */
export interface ItemDoSino {
  readonly id: string
  readonly titulo: string
  readonly detalhe: string
  /** Vai para o grupo "Urgente"; os outros vão para "Da escola". */
  readonly urgente: boolean
  /** O endereço da tela que resolve o item, relativo à área onde o sino está. */
  readonly para: string
  /** Um número que o item carrega (as turmas sem professor), com o que ele conta, em texto, para o leitor de tela. */
  readonly contador?: { readonly n: number; readonly oQueConta: string }
}

/** O que a leitura da lista diz: lendo, lida inteira, lida em parte (uma consulta falhou ou veio truncada), ou nada lido. */
export type SituacaoDoSino = 'carregando' | 'pronta' | 'parcial' | 'erro'

interface Props {
  readonly itens: readonly ItemDoSino[]
  readonly situacao: SituacaoDoSino
  /** A falha que explica `erro`, para a mensagem do catálogo. */
  readonly erro?: unknown
  readonly aoTentarDeNovo: () => void
  readonly tentandoDeNovo?: boolean
  readonly aoAtualizar: () => void
  readonly atualizando?: boolean
  /** Quando a lista foi lida pela última vez. Só muda quando quem usa a peça muda: ela não tem relógio. */
  readonly atualizadoEm?: Date | undefined
  /** Para onde "Ver o que falta para a escola" leva, no vazio. */
  readonly faltaPara: string
}

const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

/**
 * O nome do botão. Só duas formas existem para a lista lida: "Esperando você, N" e "Esperando você, nada". Lista que não foi
 * lida inteira nunca diz "nada": lendo, parcial sem item e erro têm o nome do que falta, e a contagem de uma lista parcial
 * é a do que se leu.
 */
function nomeDoBotao(itens: number, situacao: SituacaoDoSino): string {
  if (itens > 0) return `Esperando você, ${String(itens)}`
  if (situacao === 'carregando') return 'Esperando você, carregando'
  if (situacao === 'erro') return 'Esperando você, não carregou'
  if (situacao === 'parcial') return 'Esperando você, parte não carregou'
  return 'Esperando você, nada'
}

function GrupoDeItens({ titulo, itens }: { readonly titulo: string; readonly itens: readonly ItemDoSino[] }) {
  if (itens.length === 0) return null
  return (
    <section aria-label={titulo} className="flex min-w-0 flex-col gap-2">
      <h3 className="t-rotulo text-sutil">{titulo}</h3>
      <ul className="divide-y-2 divide-borda overflow-hidden rounded-cartao border-2 border-borda">
        {itens.map((item) => (
          <li key={item.id}>
            <Linha
              para={item.para}
              titulo={item.titulo}
              abaixo={item.detalhe}
              {...(item.contador === undefined ? {} : { fim: <Contador n={item.contador.n} oQueConta={item.contador.oQueConta} /> })}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * O sino da coordenação (D80; Tech Spec das telas da coordenação, seções 5 e 9): um botão "Esperando você, N" que abre a
 * lista num `PainelLado`. Recebe a lista por prop e não lê nada: quem a calcula é a área (`useFilaDaCoordenacao`), e
 * por isso a peça serve também ao sino do professor (X3).
 *
 * - **Não pisca, não soa e não anima**: o número é um `Contador` parado, e o botão não muda por tempo (D59). **Abrir a lista
 *   não faz leitura**; só "Tentar de novo" e "Atualizar" pedem (RF5).
 * - **Nunca diz "Tudo em dia" sem ter lido tudo**: a lista parcial mostra o que veio, com "Parte da lista não carregou" e
 *   "Tentar de novo". O vazio é ícone ilustrado, sem mascote (a onça de corpo inteiro é decisão do Joaquim, seção 12).
 * - **A lista fecha ao se ir a um item**: o painel é modal, e a tela de destino nasce sem nada por cima dela.
 * - "Atualizado às HH:MM" é o que quem usa a peça entrega; a peça não tem temporizador.
 */
export function Sino({ itens, situacao, erro, aoTentarDeNovo, tentandoDeNovo = false, aoAtualizar, atualizando = false, atualizadoEm, faltaPara }: Props) {
  // O endereço em que a lista foi aberta. Ir a um item muda o endereço (o caminho ou só a consulta), e o painel modal sai da
  // frente da tela de destino; voltar a ele depois não o reabre.
  const [caminho] = useLocation()
  const busca = useSearch()
  const endereco = `${caminho}?${busca}`
  const [abertoEm, definirAbertoEm] = useState<string | null>(null)
  if (abertoEm !== null && abertoEm !== endereco) definirAbertoEm(null)
  const aberto = abertoEm !== null
  const definirAberto = (valor: boolean) => definirAbertoEm(valor ? endereco : null)

  const urgentes = itens.filter((item) => item.urgente)
  const daEscola = itens.filter((item) => !item.urgente)
  const nome = nomeDoBotao(itens.length, situacao)

  return (
    <>
      <Botao variante="secundario" aria-label={nome} aria-haspopup="dialog" aria-expanded={aberto} onClick={() => definirAberto(true)} className="gap-2 px-3">
        <Bell aria-hidden="true" size={20} strokeWidth={2.5} />
        {/* O nome vem do `aria-label`, com o número; o texto à vista é o rótulo do botão a partir de 768 px, e abaixo disso só o ícone cabe. */}
        <span className="sr-only md:not-sr-only">Esperando você</span>
        <Contador n={itens.length} oQueConta="esperando você" />
      </Botao>
      {aberto && (
        <PainelLado
          titulo="Esperando você"
          aoFechar={() => definirAberto(false)}
          rodape={
            <>
              <p role="status" className="t-apoio mr-auto text-sutil">
                {atualizadoEm === undefined ? '' : `Atualizado às ${HORA.format(atualizadoEm)}`}
              </p>
              <Botao variante="secundario" disabled={atualizando} onClick={aoAtualizar}>
                {atualizando ? 'Atualizando…' : 'Atualizar'}
              </Botao>
            </>
          }
        >
          <div className="flex min-w-0 flex-col gap-4">
            {situacao === 'carregando' && <EstadoCarregando rotulo="Carregando o que espera você…" />}
            {situacao === 'erro' && <EstadoErro erro={erro} aoTentarDeNovo={aoTentarDeNovo} tentando={tentandoDeNovo} />}
            {situacao === 'parcial' && (
              <Aviso
                tom="atencao"
                acao={
                  <Botao variante="secundario" disabled={tentandoDeNovo} onClick={aoTentarDeNovo}>
                    {tentandoDeNovo ? 'Tentando de novo…' : 'Tentar de novo'}
                  </Botao>
                }
              >
                Parte da lista não carregou
              </Aviso>
            )}
            {(situacao === 'pronta' || situacao === 'parcial') && (
              <>
                <GrupoDeItens titulo="Urgente" itens={urgentes} />
                <GrupoDeItens titulo="Da escola" itens={daEscola} />
              </>
            )}
            {situacao === 'pronta' && itens.length === 0 && (
              <div data-vazio-do-sino="" className="flex flex-col items-center gap-2 rounded-cartao border-2 border-dashed border-borda-campo bg-superficie px-4 py-10 text-center">
                <Icone nome="inicio" tamanho={48} />
                <p className="t-secao text-tinta">Tudo em dia</p>
                <p className="t-apoio max-w-prose text-apoio">Nada espera a coordenação agora.</p>
                <Link to={faltaPara} className={CLASSES_DO_LINK_SECUNDARIO}>
                  Ver o que falta para a escola
                </Link>
              </div>
            )}
          </div>
        </PainelLado>
      )}
    </>
  )
}
